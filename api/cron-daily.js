// Cron quotidien — 9h heure de Paris (7h UTC)
// Envoie : J-7 et J-1 avant la course
import { sendEmail, templates } from "./_email.js";
import { getAdminToken, listUsers, parseUser } from "./_firestore.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).end("Unauthorized");
  }

  const adminToken = await getAdminToken();
  if (!adminToken) return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT manquant" });

  const docs = await listUsers(adminToken);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results = { sent: 0, skipped: 0, errors: 0 };

  await Promise.allSettled(docs.map(async (doc) => {
    const user = parseUser(doc);
    if (!user.email || !user.raceDate) { results.skipped++; return; }

    const raceDay = new Date(user.raceDate);
    raceDay.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((raceDay - today) / 86400000);

    if (daysLeft !== 7 && daysLeft !== 1) { results.skipped++; return; }

    try {
      const subject = daysLeft === 1
        ? `Demain c'est le grand jour ! 🏁 ${user.raceName}`
        : `J-7 : Plus qu'une semaine avant ${user.raceName} ! 📅`;
      await sendEmail({ to: user.email, subject, html: templates.raceCountdown({ ...user, daysLeft }) });
      results.sent++;
    } catch (e) {
      console.error("cron-daily error", user.email, e.message);
      results.errors++;
    }
  }));

  res.status(200).json(results);
}
