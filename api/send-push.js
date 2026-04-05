// Envoie une notification push à tous les utilisateurs (ou à un uid précis)
// Variables d'environnement :
//   VAPID_PUBLIC_KEY   → BDnhMkrmir_7UMOVXnPOeMYv_e4h5lrvKLmb-I9VJyMUZPZDm7x9g1fqhFNZj7-csn6jAV6LuzCfJwRSpdLtO7k
//   VAPID_PRIVATE_KEY  → MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDIGJfqXySoiH8Qwyq2PbXnw9vRGA5gEDaXpZpXb1DYyhRANCAAQ54TJK5oq_-1DDlV5zznjGL_3uIeZa7yi5m_iPVScjFGT2Q5u8fYNX6oRTWY-_nLJ-owFei7swnycEUqXS7Tu5
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

import webpush from "web-push";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

webpush.setVapidDetails(
  "mailto:contact@fuelrun.app",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { uid, title, body, url } = req.body || {};
  const payload = JSON.stringify({ title: title || "FuelRun", body: body || "Consulte ton plan du jour !", url: url || "/" });

  try {
    const db = initAdmin();
    let query = db.collection("push_subscriptions");
    if (uid) query = query.where("uid", "==", uid);

    const snap = await query.get();
    const results = await Promise.allSettled(
      snap.docs.map(function(d) {
        return webpush.sendNotification(d.data().subscription, payload);
      })
    );
    const sent = results.filter(function(r){ return r.status === "fulfilled"; }).length;
    const failed = results.filter(function(r){ return r.status === "rejected"; }).length;
    res.status(200).json({ sent, failed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
