// Cron hebdomadaire — lundi 9h heure de Paris (7h UTC)
// Envoie : résumé de la semaine + encouragements
import { sendEmail, templates } from "./_email.js";
import { getAdminToken, listUsers, parseUser } from "./_firestore.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).end("Unauthorized");
  }

  const adminToken = await getAdminToken();
  if (!adminToken) return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT manquant" });

  const docs = await listUsers(adminToken);
  const results = { sent: 0, skipped: 0, errors: 0 };

  await Promise.allSettled(docs.map(async (doc) => {
    const user = parseUser(doc);
    if (!user.email) { results.skipped++; return; }
    // Ne pas relancer les utilisateurs sans aucune activité (compte créé mais jamais utilisé)
    if (!user.statsSessions && !user.statsKm) { results.skipped++; return; }
    try {
      await sendEmail({
        to: user.email,
        subject: "Ton résumé FuelRun de la semaine 🏃",
        html: templates.weekly(user),
      });
      results.sent++;
    } catch (e) {
      console.error("cron-weekly error", user.email, e.message);
      results.errors++;
    }
  }));

  res.status(200).json(results);
}
