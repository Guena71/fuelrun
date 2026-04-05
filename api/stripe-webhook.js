// Stripe Webhook — met à jour le plan dans Firestore après paiement
// Variables d'environnement : STRIPE_WEBHOOK_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY

import crypto from "crypto";

function verifyStripeSignature(rawBody, signature, secret) {
  const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
  const payload = parts.t + "." + rawBody;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === parts.v1;
}

async function updatePlan(uid, plan) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey    = process.env.FIREBASE_API_KEY;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=profile.plan&key=${apiKey}`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { profile: { mapValue: { fields: { plan: { stringValue: plan } } } } }
    })
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  const sig = req.headers["stripe-signature"];
  if (!process.env.STRIPE_WEBHOOK_SECRET || !verifyStripeSignature(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: "Signature invalide" });
  }

  const event = JSON.parse(rawBody);
  const sub = event.data?.object;
  const uid = sub?.metadata?.uid;
  const plan = sub?.metadata?.plan;

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    if (uid && plan) {
      const active = sub.status === "active" || sub.status === "trialing";
      await updatePlan(uid, active ? plan : "gratuit");
    }
  }
  if (event.type === "customer.subscription.deleted") {
    if (uid) await updatePlan(uid, "gratuit");
  }

  res.status(200).json({ received: true });
}
