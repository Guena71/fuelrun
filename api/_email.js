// Module interne — non exposé comme endpoint Vercel (préfixe _)
// Usage : import { sendEmail, templates } from "./_email.js"

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquant");
  const from = process.env.RESEND_FROM || "FuelRun <noreply@fuelrun.vercel.app>";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || "Resend error " + r.status);
  }
  return r.json();
}

function base(content) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FuelRun</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table role="presentation" style="max-width:520px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
<tr><td style="background:#0a0a0a;padding:24px 32px">
  <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">&#9889; FuelRun</span>
</td></tr>
<tr><td style="padding:32px 32px 24px">${content}</td></tr>
<tr><td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #ebebeb;text-align:center">
  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">Tu reçois cet e-mail car tu es inscrit(e) sur FuelRun.<br>
  <a href="https://fuelrun.vercel.app" style="color:#FF6B2B;text-decoration:none">fuelrun.vercel.app</a></p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function btn(label, url) {
  return `<a href="${url}" style="display:inline-block;background:#FF6B2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;margin:20px 0">${label}</a>`;
}

export const templates = {
  welcome({ name }) {
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FF6B2B;text-transform:uppercase;letter-spacing:0.5px">Bienvenue !</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">Pr&ecirc;t(e) &agrave; courir, ${name}&nbsp;?</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">Ton compte FuelRun est actif. Tu acc&egrave;des maintenant &agrave; ton plan d'entra&icirc;nement personnalis&eacute;, au suivi nutrition et au Coach IA disponible 7j/7.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7">Commence par choisir ta prochaine course &mdash; le plan se construit automatiquement.</p>
      ${btn("Ouvrir FuelRun &rarr;", "https://fuelrun.vercel.app")}
      <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6">Des questions&nbsp;? Ton Coach IA r&eacute;pond directement dans l'application.</p>
    `);
  },

  subscription({ name, plan }) {
    const labels = { pro:"Pro", elite:"&Eacute;lite", essential:"Essentiel" };
    const label = labels[plan] || plan;
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#22C55E;text-transform:uppercase;letter-spacing:0.5px">Abonnement confirm&eacute;</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">Plan ${label} activ&eacute; !</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7">F&eacute;licitations ${name}&nbsp;! Ton abonnement <strong>FuelRun ${label}</strong> est maintenant actif.</p>
      <table role="presentation" style="background:#f9f9f9;border-radius:10px;padding:16px 20px;width:100%;margin:0 0 24px;border:1px solid #e5e5e5">
        <tr><td style="font-size:14px;color:#444;padding:5px 0">&check;&nbsp; Plan d'entra&icirc;nement complet sans limite</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:5px 0">&check;&nbsp; Coach IA illimit&eacute;</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:5px 0">&check;&nbsp; Nutrition personnalis&eacute;e</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:5px 0">&check;&nbsp; Strat&eacute;gie de course et splits</td></tr>
      </table>
      ${btn("Acc&eacute;der &agrave; mon plan &rarr;", "https://fuelrun.vercel.app/training")}
    `);
  },

  raceCountdown({ name, raceName, raceDist, daysLeft }) {
    const isJ1 = daysLeft === 1;
    const accent = isJ1 ? "#FF6B2B" : "#3B82F6";
    const tag = isJ1 ? "DEMAIN C&apos;EST LE GRAND JOUR" : "DANS 7 JOURS";
    const title = isJ1 ? `C&apos;est demain, ${name}&nbsp;!` : `Plus qu&apos;une semaine, ${name}&nbsp;!`;
    const tips = isJ1
      ? ["&#127837;&nbsp; Repas l&eacute;ger ce soir &mdash; p&acirc;tes, riz ou quinoa",
         "&#128164;&nbsp; Couche-toi t&ocirc;t, m&ecirc;me si tu n&apos;arrives pas &agrave; dormir",
         "&#128085;&nbsp; Pr&eacute;pare ton &eacute;quipement cette nuit",
         "&#128167;&nbsp; Hydrate-toi r&eacute;guli&egrave;rement toute la journ&eacute;e",
         "&#129488;&nbsp; Reste calme &mdash; tu t&apos;es pr&eacute;par&eacute;(e), fais confiance &agrave; ton corps"]
      : ["&#127939;&nbsp; Derni&egrave;re sortie longue cette semaine si ce n&apos;est pas fait",
         "&#127829;&nbsp; Commence &agrave; augmenter les glucides en fin de semaine",
         "&#128085;&nbsp; V&eacute;rifie ton &eacute;quipement (chaussures, dossard, nutrition)",
         "&#128134;&nbsp; R&eacute;duis l&apos;intensit&eacute; &mdash; c&apos;est la semaine d&apos;aff&ucirc;tage",
         "&#128205;&nbsp; Rep&egrave;re le parcours et le lieu de d&eacute;part"];
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.5px">${tag}</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">${title}</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#666">${raceName} &middot; ${raceDist}&nbsp;km</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7">${isJ1 ? "La pr&eacute;paration est termin&eacute;e. Voici tes derniers conseils&nbsp;:" : "La course approche. Voici comment bien g&eacute;rer cette derni&egrave;re semaine&nbsp;"}</p>
      ${tips.map(t => `<p style="margin:0 0 10px;font-size:14px;color:#444;line-height:1.6">${t}</p>`).join("")}
      ${btn("Voir ma strat&eacute;gie de course &rarr;", "https://fuelrun.vercel.app/training")}
    `);
  },

  weekly({ name, raceName, raceDate, raceDist, statsKm, statsSessions, statsStreak }) {
    const km = Math.round(statsKm || 0);
    const sess = statsSessions || 0;
    const streak = statsStreak || 0;
    const daysLeft = raceDate ? Math.max(0, Math.ceil((new Date(raceDate) - new Date()) / 86400000)) : null;
    const weeksLeft = daysLeft !== null ? Math.ceil(daysLeft / 7) : null;
    const raceBlock = raceName && weeksLeft
      ? `<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7">Tu es &agrave; <strong>${weeksLeft}&nbsp;semaine${weeksLeft > 1 ? "s" : ""}</strong> de <strong>${raceName}</strong> (${raceDist}&nbsp;km). Continue comme &ccedil;a&nbsp;!</p>`
      : "";
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FF6B2B;text-transform:uppercase;letter-spacing:0.5px">R&eacute;sum&eacute; hebdomadaire</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">Bonne semaine, ${name}&nbsp;!</h1>
      ${raceBlock}
      <table role="presentation" style="width:100%;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;margin:0 0 24px">
        <tr style="background:#f9f9f9">
          <td style="padding:16px;text-align:center;border-right:1px solid #e5e5e5">
            <p style="margin:0;font-size:26px;font-weight:800;color:#FF6B2B">${km}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">km total</p>
          </td>
          <td style="padding:16px;text-align:center;border-right:1px solid #e5e5e5">
            <p style="margin:0;font-size:26px;font-weight:800;color:#3B82F6">${sess}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">s&eacute;ances</p>
          </td>
          <td style="padding:16px;text-align:center">
            <p style="margin:0;font-size:26px;font-weight:800;color:#22C55E">${streak}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">jours cons&eacute;cutifs</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7">Lance l'application pour voir ton plan de la semaine et valider tes s&eacute;ances.</p>
      ${btn("Voir mon plan &rarr;", "https://fuelrun.vercel.app/training")}
    `);
  },
};
