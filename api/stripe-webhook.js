// Stripe Webhook — met à jour le plan dans Firestore après paiement
// Variables d'environnement : STRIPE_WEBHOOK_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY

import crypto from "crypto";
import { sendEmail, templates } from "./_email.js";
import { getUserByUid } from "./_firestore.js";

function verifyStripeSignature(rawBody, signature, secret) {
  const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
  const payload = parts.t + "." + rawBody;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === parts.v1;
}

const PLAN_LEVEL = { gratuit: 0, essential: 1, pro: 2 };

async function updatePlan(uid, plan, preventDowngrade = false) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey    = process.env.FIREBASE_API_KEY;
  // Lire d'abord le profil existant pour ne pas écraser les autres champs
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;
  const getRes = await fetch(base);
  if(!getRes.ok){ console.error("Firestore GET failed",getRes.status,await getRes.text()); return; }
  const doc = await getRes.json();
  // Reconstruire le profil avec le nouveau plan
  const existingProfile = doc.fields?.profile?.mapValue?.fields || {};
  // Pour les abonnements actifs, ne jamais rétrograder (cas de plusieurs abonnements en mode test)
  if (preventDowngrade) {
    const currentPlan = existingProfile?.plan?.stringValue || "gratuit";
    if ((PLAN_LEVEL[plan] || 0) < (PLAN_LEVEL[currentPlan] || 0)) {
      console.log("Webhook: downgrade ignoré", uid, currentPlan, "→", plan);
      return;
    }
  }
  const updatedFields = Object.assign({}, existingProfile, { plan: { stringValue: plan } });
  const patchUrl = `${base}&updateMask.fieldPaths=profile`;
  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: Object.assign({}, doc.fields||{}, {
        profile: { mapValue: { fields: updatedFields } }
      })
    })
  });
  if(!patchRes.ok) console.error("Firestore PATCH failed",patchRes.status,await patchRes.text());
  else console.log("Plan mis à jour:",uid,"→",plan);
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

  // ── Idempotency : ignorer les événements déjà traités ──────────────────────
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey    = process.env.FIREBASE_API_KEY;
    const evUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/webhook_events/${event.id}?key=${apiKey}`;
    const evGet = await fetch(evUrl);
    if (evGet.ok) {
      const evDoc = await evGet.json();
      if (evDoc.fields?.processed?.booleanValue) {
        console.log("Webhook: event déjà traité", event.id);
        return res.status(200).json({ received: true, duplicate: true });
      }
    }
    // Marquer comme traité immédiatement
    fetch(evUrl.split("?")[0] + `?updateMask.fieldPaths=processed&updateMask.fieldPaths=type&updateMask.fieldPaths=ts&key=${apiKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: {
        processed: { booleanValue: true },
        type:      { stringValue: event.type },
        ts:        { integerValue: String(Date.now()) },
      }}),
    }).catch(() => {});
  } catch (e) { console.error("Idempotency check failed:", e.message); }

  const sub = event.data?.object;
  const uid = sub?.metadata?.uid;
  const plan = sub?.metadata?.plan;

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    if (uid && plan) {
      const active = sub.status === "active" || sub.status === "trialing";
      const newPlan = active ? plan : "gratuit";
      // preventDowngrade=true pour les abonnements actifs (évite qu'un vieil event "essential" écrase "pro")
      await updatePlan(uid, newPlan, active);
      if (active && event.type === "customer.subscription.created") {
        try {
          const user = await getUserByUid(uid);
          if (user?.email) {
            await sendEmail({
              to: user.email,
              subject: `Ton abonnement FuelRun ${plan} est activé 🎉`,
              html: templates.subscription({ name: user.name, plan }),
            });
          }
        } catch (e) { console.error("Email abonnement:", e.message); }
      }
    }
  }
  if (event.type === "customer.subscription.deleted") {
    if (uid) await updatePlan(uid, "gratuit");
  }

  res.status(200).json({ received: true });
}
