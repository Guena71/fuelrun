// Envoie une notification push à un utilisateur (ou tous)
// Variables d'environnement configurées dans Vercel :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, FIREBASE_PROJECT_ID, FIREBASE_API_KEY

import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:contact@fuelrun.app",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getSubscriptions(uid) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey    = process.env.FIREBASE_API_KEY;
  const base      = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  if (uid) {
    const r = await fetch(`${base}/push_subscriptions/${uid}?key=${apiKey}`);
    if (!r.ok) return [];
    const doc = await r.json();
    if (!doc.fields) return [];
    return [JSON.parse(doc.fields.subscription.stringValue)];
  }

  // Tous les abonnés
  const r = await fetch(`${base}/push_subscriptions?key=${apiKey}&pageSize=300`);
  if (!r.ok) return [];
  const data = await r.json();
  if (!data.documents) return [];
  return data.documents
    .filter(d => d.fields?.subscription)
    .map(d => JSON.parse(d.fields.subscription.stringValue));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { uid, title, body, url } = req.body || {};
  const payload = JSON.stringify({
    title: title || "FuelRun",
    body:  body  || "Consulte ton plan du jour !",
    url:   url   || "/"
  });

  try {
    const subs = await getSubscriptions(uid);
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub, payload))
    );
    const sent   = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    res.status(200).json({ sent, failed, total: subs.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
