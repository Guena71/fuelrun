// Coach IA — proxy Mistral avec vérification Firebase + rate-limit serveur
// Variables : MISTRAL_KEY, FIREBASE_API_KEY, FIREBASE_PROJECT_ID

const LIMITS = { gratuit: 7, essential: 30 }; // pro = illimité

function fsBase() {
  return `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

async function verifyToken(idToken) {
  const key = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d.users?.[0]?.localId || null;
}

async function getUserPlan(uid, idToken) {
  try {
    const r = await fetch(`${fsBase()}/users/${uid}`, { headers: { Authorization: "Bearer " + idToken } });
    if (!r.ok) return "gratuit";
    const doc = await r.json();
    return doc?.fields?.profile?.mapValue?.fields?.plan?.stringValue || "gratuit";
  } catch { return "gratuit"; }
}

async function getDailyCount(uid) {
  try {
    const r = await fetch(`${fsBase()}/coach_daily/${uid}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) return { date: "", count: 0 };
    const doc = await r.json();
    return {
      date:  doc.fields?.date?.stringValue  || "",
      count: parseInt(doc.fields?.count?.integerValue || "0", 10),
    };
  } catch { return { date: "", count: 0 }; }
}

async function setDailyCount(uid, date, count) {
  try {
    await fetch(`${fsBase()}/coach_daily/${uid}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          date:  { stringValue: date },
          count: { integerValue: String(count) },
        },
      }),
    });
  } catch {}
}

export default async function handler(req, res) {
  const _allowed = ["https://fuelrun.fr", "https://fuelrun.vercel.app"];
  const _origin = req.headers.origin || "";
  if (_allowed.includes(_origin)) res.setHeader("Access-Control-Allow-Origin", _origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });
  const uid = await verifyToken(idToken);
  if (!uid) return res.status(401).json({ error: "Token invalide" });

  const mistralKey = process.env.MISTRAL_KEY || process.env.VITE_MISTRAL_KEY;
  if (!mistralKey) return res.status(500).json({ error: "Service indisponible" });

  // ── Rate-limit côté serveur ─────────────────────────────────────────────────
  const userPlan = await getUserPlan(uid, idToken);
  const maxMsg = userPlan === "pro" ? Infinity : (LIMITS[userPlan] ?? LIMITS.gratuit);

  if (maxMsg !== Infinity) {
    const today = new Date().toISOString().slice(0, 10);
    const daily = await getDailyCount(uid);
    const count = daily.date === today ? daily.count : 0;
    if (count >= maxMsg) {
      return res.status(429).json({ error: "Limite journalière atteinte", limit: maxMsg });
    }
    // Incrémenter en background (non bloquant)
    setDailyCount(uid, today, count + 1);
  }

  const { messages, system } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages requis" });
  }
  // Limiter la taille des messages pour éviter les abus
  if (messages.length > 50) return res.status(400).json({ error: "Trop de messages" });

  const payload = {
    model: "mistral-small-latest",
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    max_tokens: 400,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + mistralKey },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timeout);
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Mistral error:", upstream.status, data?.error?.message);
      return res.status(503).json({ error: "Service indisponible, réessaie dans un instant." });
    }
    return res.status(200).json(data);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") return res.status(504).json({ error: "Délai dépassé, réessaie." });
    return res.status(502).json({ error: "Service indisponible." });
  }
}
