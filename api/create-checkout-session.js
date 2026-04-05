// Stripe Checkout — crée une session de paiement
// Variables d'environnement à configurer dans Vercel :
//   STRIPE_SECRET_KEY      → clé secrète Stripe (sk_live_... ou sk_test_...)
//   STRIPE_PRICE_ESSENTIAL → price_xxx du plan Essential (4,99 €/mois)
//   STRIPE_PRICE_PRO       → price_xxx du plan Pro (9,99 €/mois)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, uid } = req.body || {};
  if (!plan || !uid) return res.status(400).json({ error: "plan et uid requis" });

  const priceMap = {
    essential: process.env.STRIPE_PRICE_ESSENTIAL,
    pro:       process.env.STRIPE_PRICE_PRO,
  };
  const priceId = priceMap[plan];
  if (!priceId) return res.status(400).json({ error: "Plan inconnu : " + plan });

  const base = "https://fuelrun-9ibg.vercel.app";
  const params = new URLSearchParams({
    mode: "subscription",
    "payment_method_types[0]": "card",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": "14",
    "subscription_data[metadata][uid]": uid,
    "subscription_data[metadata][plan]": plan,
    "client_reference_id": uid,
    "success_url": base + "/?checkout=success&plan=" + plan,
    "cancel_url":  base + "/?checkout=cancel",
  });

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await r.json();
    if (session.error) return res.status(400).json({ error: session.error.message });
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
