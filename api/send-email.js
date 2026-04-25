// Endpoint client → déclenche les emails transactionnels (bienvenue)
// Requiert un token Firebase valide dans Authorization: Bearer <token>
import { sendEmail, templates } from "./_email.js";

async function verifyToken(idToken) {
  const key = process.env.FIREBASE_API_KEY;
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d.users?.[0] || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://fuelrun.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });
  const fbUser = await verifyToken(idToken);
  if (!fbUser) return res.status(401).json({ error: "Token invalide" });

  const { type, name } = req.body || {};

  try {
    if (type === "welcome") {
      await sendEmail({
        to: fbUser.email,
        subject: "Bienvenue sur FuelRun ⚡",
        html: templates.welcome({ name: name || fbUser.displayName || "Champion" }),
      });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Type inconnu : " + type });
  } catch (e) {
    console.error("send-email error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
