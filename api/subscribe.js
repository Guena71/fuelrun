// Enregistre une souscription Web Push dans Firestore
// Variables d'environnement : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { uid, subscription } = req.body || {};
  if (!uid) return res.status(400).json({ error: "uid requis" });

  try {
    const db = initAdmin();
    if (req.method === "POST") {
      if (!subscription) return res.status(400).json({ error: "subscription requise" });
      await db.collection("push_subscriptions").doc(uid).set({ uid, subscription, updatedAt: Date.now() });
      res.status(200).json({ ok: true });
    } else if (req.method === "DELETE") {
      await db.collection("push_subscriptions").doc(uid).delete();
      res.status(200).json({ ok: true });
    } else {
      res.status(405).end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
