// Stripe Webhook — met à jour le plan dans Firestore après paiement
// Variables d'environnement à configurer dans Vercel :
//   STRIPE_WEBHOOK_SECRET → whsec_... (depuis Stripe Dashboard > Webhooks)
//   FIREBASE_PROJECT_ID   → fuelrun-7a369
//   FIREBASE_CLIENT_EMAIL → email du service account Firebase
//   FIREBASE_PRIVATE_KEY  → clé privée du service account (avec \n)

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

function verifyStripeSignature(rawBody, signature, secret) {
  const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
  const payload = parts.t + "." + rawBody;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === parts.v1;
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  const sig = req.headers["stripe-signature"];
  if (!verifyStripeSignature(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: "Signature invalide" });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const uid  = sub.metadata?.uid;
    const plan = sub.metadata?.plan;
    const status = sub.status; // trialing, active, past_due, canceled…
    if (uid && plan) {
      await db.collection("users").doc(uid).set(
        { profile: { plan: status === "active" || status === "trialing" ? plan : "gratuit" } },
        { merge: true }
      );
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const uid = sub.metadata?.uid;
    if (uid) {
      await db.collection("users").doc(uid).set(
        { profile: { plan: "gratuit" } },
        { merge: true }
      );
    }
  }

  res.status(200).json({ received: true });
}
