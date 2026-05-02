// Stripe — Checkout / Upgrade / Cancel / Portal / Syncplan
// Body { plan, uid } → checkout ou upgrade ; { cancel:true, uid } → résiliation
// Body { portal:true, uid } → portail ; { syncplan:true, uid } → vérif plan
// Variables : STRIPE_SECRET_KEY, STRIPE_PRICE_ESSENTIAL, STRIPE_PRICE_PRO, FIREBASE_API_KEY

const PLAN_LEVEL = { gratuit: 0, essential: 1, pro: 2 };
const VALID_STATUS = ["active", "trialing"];

async function verifyToken(idToken) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d.users?.[0]?.localId || null;
}

// Trouve l'abonnement actif d'un utilisateur (par metadata uid, puis par client_reference_id)
async function findActiveSub(uid, stripeKey) {
  const subRes = await fetch(
    `https://api.stripe.com/v1/subscriptions?metadata[uid]=${encodeURIComponent(uid)}&limit=10`,
    { headers: { Authorization: "Bearer " + stripeKey } }
  );
  const subData = await subRes.json();
  let sub = subData.data?.find(s => VALID_STATUS.includes(s.status)) || null;
  if (sub) return sub;

  // Fallback : cherche via sessions de checkout (client_reference_id)
  const sessRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions?client_reference_id=${encodeURIComponent(uid)}&limit=10`,
    { headers: { Authorization: "Bearer " + stripeKey } }
  );
  const sessData = await sessRes.json();
  const customerId = sessData.data?.find(s => s.customer)?.customer;
  if (!customerId) return null;

  const custSubRes = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&limit=10`,
    { headers: { Authorization: "Bearer " + stripeKey } }
  );
  const custSubData = await custSubRes.json();
  return custSubData.data?.find(s => VALID_STATUS.includes(s.status)) || null;
}

export default async function handler(req, res) {
  const allowed = ["https://fuelrun.fr", "https://fuelrun.vercel.app"];
  const origin = req.headers.origin || "";
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe non configuré" });

  const { plan, uid, portal, syncplan, cancel } = req.body || {};
  if (!uid) return res.status(400).json({ error: "uid requis" });

  // ── Mode syncplan ──────────────────────────────────────────────────────────
  if (syncplan) {
    const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (idToken) {
      const tokenUid = await verifyToken(idToken);
      if (!tokenUid || tokenUid !== uid) return res.status(401).json({ error: "Token invalide" });
    }
    try {
      const activeSub = await findActiveSub(uid, stripeKey);
      if (!activeSub) return res.status(200).json({ plan: "gratuit" });
      const priceId = (activeSub.items?.data?.[0]?.price?.id || "").trim();
      let detectedPlan = "gratuit";
      if (priceId === (process.env.STRIPE_PRICE_PRO || "").trim()) detectedPlan = "pro";
      else if (priceId === (process.env.STRIPE_PRICE_ESSENTIAL || "").trim()) detectedPlan = "essential";
      return res.status(200).json({ plan: detectedPlan });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const base = allowed.includes(origin) ? origin : "https://fuelrun.vercel.app";

  // ── Mode cancel (résiliation abonnement) ───────────────────────────────────
  if (cancel) {
    const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (idToken) {
      const tokenUid = await verifyToken(idToken);
      if (!tokenUid || tokenUid !== uid) return res.status(401).json({ error: "Token invalide" });
    }
    try {
      const activeSub = await findActiveSub(uid, stripeKey);
      if (!activeSub) return res.status(404).json({ error: "Aucun abonnement actif trouvé" });
      const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${activeSub.id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + stripeKey },
      });
      if (!cancelRes.ok) {
        const err = await cancelRes.json();
        return res.status(400).json({ error: err.error?.message || "Erreur Stripe" });
      }
      return res.status(200).json({ cancelled: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Mode portail ───────────────────────────────────────────────────────────
  if (portal) {
    const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (idToken) {
      const tokenUid = await verifyToken(idToken);
      if (!tokenUid || tokenUid !== uid) return res.status(401).json({ error: "Token invalide" });
    }
    const { email } = req.body || {};
    try {
      let customerId = null;
      const subRes = await fetch(
        `https://api.stripe.com/v1/subscriptions?metadata[uid]=${encodeURIComponent(uid)}&limit=10&status=all`,
        { headers: { Authorization: "Bearer " + stripeKey } }
      );
      const subData = await subRes.json();
      const subFound = subData.data?.find(s => s.customer);
      if (subFound?.customer) customerId = subFound.customer;

      if (!customerId) {
        const sessRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions?client_reference_id=${encodeURIComponent(uid)}&limit=10`,
          { headers: { Authorization: "Bearer " + stripeKey } }
        );
        const sessData = await sessRes.json();
        const sessFound = sessData.data?.find(s => s.customer);
        if (sessFound?.customer) customerId = sessFound.customer;
      }
      if (!customerId && email) {
        const custRes = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=5`,
          { headers: { Authorization: "Bearer " + stripeKey } }
        );
        const custData = await custRes.json();
        if (custData.data?.length) customerId = custData.data[0].id;
      }
      if (!customerId) return res.status(404).json({ error: "Aucun abonnement Stripe trouvé. Vérifie que ton paiement a bien été complété." });

      const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
        method: "POST",
        headers: { Authorization: "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ customer: customerId, return_url: base + "/profile?portal=done" }).toString(),
      });
      const portalData = await portalRes.json();
      if (portalData.error) return res.status(400).json({ error: portalData.error.message });
      return res.status(200).json({ url: portalData.url });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Mode checkout / upgrade — token obligatoire ────────────────────────────
  if (!plan) return res.status(400).json({ error: "plan requis" });
  const checkoutToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (checkoutToken) {
    const tokenUid = await verifyToken(checkoutToken);
    if (!tokenUid || tokenUid !== uid) return res.status(401).json({ error: "Token invalide" });
  }
  const priceMap = {
    essential: process.env.STRIPE_PRICE_ESSENTIAL,
    pro:       process.env.STRIPE_PRICE_PRO,
  };
  const priceId = (priceMap[plan] || "").trim();
  if (!priceId) return res.status(400).json({ error: "Plan inconnu : " + plan });

  try {
    // Vérifie si l'utilisateur a déjà un abonnement actif → upgrade en place
    const existingSub = await findActiveSub(uid, stripeKey);
    if (existingSub) {
      const currentPriceId = (existingSub.items?.data?.[0]?.price?.id || "").trim();
      let currentPlan = "gratuit";
      if (currentPriceId === (process.env.STRIPE_PRICE_PRO || "").trim()) currentPlan = "pro";
      else if (currentPriceId === (process.env.STRIPE_PRICE_ESSENTIAL || "").trim()) currentPlan = "essential";

      // Déjà sur ce plan
      if (currentPlan === plan) return res.status(200).json({ upgraded: true, plan });

      // Upgrade ou downgrade en place
      const subItemId = existingSub.items?.data?.[0]?.id;
      if (!subItemId) return res.status(500).json({ error: "Impossible de mettre à jour l'abonnement" });
      // Pas de proration pour les trials ni pour les downgrades (pas de remboursement partiel)
      const isUpgrade = (PLAN_LEVEL[plan] || 0) > (PLAN_LEVEL[currentPlan] || 0);
      const proration = (isUpgrade && existingSub.status !== "trialing") ? "always_invoice" : "none";
      const updateParams = new URLSearchParams({
        "items[0][id]": subItemId,
        "items[0][price]": priceId,
        "metadata[plan]": plan,
        "metadata[uid]": uid,
        "proration_behavior": proration,
      });
      const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${existingSub.id}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
        body: updateParams.toString(),
      });
      const updatedSub = await updateRes.json();
      if (updatedSub.error) return res.status(400).json({ error: updatedSub.error.message });
      return res.status(200).json({ upgraded: true, plan });
    }
  } catch (e) { /* ignore, fall through to new checkout session */ }

  // Pas d'abonnement existant → nouvelle session Stripe Checkout
  const params = new URLSearchParams({
    mode: "subscription",
    "payment_method_types[0]": "card",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": "14",
    "subscription_data[metadata][uid]": uid,
    "subscription_data[metadata][plan]": plan,
    "client_reference_id": uid,
    "success_url": base + "/profile?checkout=success&plan=" + plan,
    "cancel_url":  base + "/profile?checkout=cancel",
  });

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const session = await r.json();
  if (session.error) return res.status(400).json({ error: session.error.message });
  res.status(200).json({ url: session.url });
}
