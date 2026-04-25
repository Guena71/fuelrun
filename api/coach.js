// Coach IA — proxy Mistral avec vérification Firebase
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://fuelrun.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });
  const uid = await verifyToken(idToken);
  if (!uid) return res.status(401).json({ error: "Token invalide" });

  const key = process.env.MISTRAL_KEY || process.env.VITE_MISTRAL_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  const { messages, system } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing messages" });
  }

  const payload = {
    model: "mistral-small-latest",
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages,
    max_tokens: 400,
  };

  try {
    const upstream = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Upstream error" });
  }
}
