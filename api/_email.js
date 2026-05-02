// Module interne — non exposé comme endpoint Vercel (préfixe _)
// Usage : import { sendEmail, templates } from "./_email.js"

const APP_URL = "https://fuelrun.fr";

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquant");
  const from = process.env.RESEND_FROM || "FuelRun <noreply@fuelrun.fr>";
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
<tr><td style="background:#0a0a0a;padding:24px 32px;text-align:center">
  <a href="${APP_URL}" style="text-decoration:none"><span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">&#9889; FuelRun</span></a>
</td></tr>
<tr><td style="padding:32px 32px 24px">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #ebebeb;text-align:center">
  <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.6">
    Tu reçois cet e-mail car tu es inscrit(e) sur FuelRun.<br>
    <a href="${APP_URL}" style="color:#FF6B2B;text-decoration:none;font-weight:600">fuelrun.fr</a>
    &nbsp;&middot;&nbsp;
    <a href="${APP_URL}/profil" style="color:#9ca3af;text-decoration:underline">Gérer mes préférences</a>
  </p>
  <p style="margin:0;font-size:11px;color:#c4c4c4">FuelRun &mdash; Application de préparation sportive</p>
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
      <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7">Commence par choisir ta prochaine course &mdash; le plan se construit automatiquement en quelques secondes.</p>
      <table role="presentation" style="background:#fff8f5;border-radius:10px;padding:16px 20px;width:100%;margin:0 0 24px;border:1px solid #ffe4d6">
        <tr><td style="font-size:14px;color:#444;padding:4px 0">&#9989;&nbsp; Plan d'entra&icirc;nement adapt&eacute; &agrave; ton niveau</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:4px 0">&#9989;&nbsp; Coach IA accessible 7j/7</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:4px 0">&#9989;&nbsp; Suivi nutrition jour par jour</td></tr>
        <tr><td style="font-size:14px;color:#444;padding:4px 0">&#9989;&nbsp; Points, badges &amp; d&eacute;fis hebdomadaires</td></tr>
      </table>
      ${btn("Ouvrir FuelRun &rarr;", APP_URL)}
      <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6">Des questions&nbsp;? Ton Coach IA r&eacute;pond directement dans l'application.</p>
    `);
  },

  subscription({ name, plan }) {
    const labels = { pro: "Pro", elite: "&Eacute;lite", essential: "Essentiel" };
    const perks = {
      essential: [
        "Plan d'entra&icirc;nement complet sur toutes les semaines",
        "Synchronisation Strava automatique",
        "Import de trac&eacute;s GPS (Garmin, Polar, Wahoo&hellip;)",
        "30 messages Coach IA par jour",
      ],
      pro: [
        "Tout Essentiel, plus&nbsp;:",
        "Coach IA illimit&eacute; 24h/24",
        "Allures personnalis&eacute;es (m&eacute;thode Jack Daniels)",
        "Strat&eacute;gie de course et splits par kilom&egrave;tre",
        "Recettes premium et plans repas sur-mesure",
      ],
    };
    const label = labels[plan] || plan;
    const items = perks[plan] || perks.essential;
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#22C55E;text-transform:uppercase;letter-spacing:0.5px">Abonnement confirm&eacute;</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">Plan ${label} activ&eacute; !</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7">F&eacute;licitations ${name}&nbsp;! Ton abonnement <strong>FuelRun ${label}</strong> est maintenant actif. Tu as acc&egrave;s &agrave; toutes ces fonctionnalit&eacute;s&nbsp;:</p>
      <table role="presentation" style="background:#f0fdf4;border-radius:10px;padding:16px 20px;width:100%;margin:0 0 24px;border:1px solid #bbf7d0">
        ${items.map(i => `<tr><td style="font-size:14px;color:#166534;padding:5px 0">&check;&nbsp; ${i}</td></tr>`).join("")}
      </table>
      ${btn("Acc&eacute;der &agrave; mon plan &rarr;", APP_URL + "/training")}
      <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6">Merci de ta confiance. &Agrave; bient&ocirc;t sur les sentiers !</p>
    `);
  },

  raceCountdown({ name, raceName, raceDist, daysLeft }) {
    const isJ1 = daysLeft === 1;
    const accent = isJ1 ? "#FF6B2B" : "#3B82F6";
    const tag = isJ1 ? "DEMAIN C&apos;EST LE GRAND JOUR &#127937;" : "J&#8209;7 : LA SEMAINE DE LA COURSE &#128197;";
    const title = isJ1 ? `C&apos;est demain, ${name}&nbsp;!` : `Plus qu&apos;une semaine, ${name}&nbsp;!`;
    const tips = isJ1
      ? [
          "&#127837;&nbsp; Repas l&eacute;ger ce soir &mdash; p&acirc;tes, riz ou quinoa, sans exag&eacute;rer",
          "&#128164;&nbsp; Couche-toi t&ocirc;t, m&ecirc;me si tu n&apos;arrives pas &agrave; t&apos;endormir &mdash; le repos compte",
          "&#128085;&nbsp; Pr&eacute;pare ton &eacute;quipement ce soir : dossard, chaussures, nutrition de course",
          "&#128167;&nbsp; Hydrate-toi toute la journ&eacute;e, r&eacute;guli&egrave;rement",
          "&#129302;&nbsp; Fais confiance &agrave; ta pr&eacute;paration &mdash; tu as fait le travail",
        ]
      : [
          "&#127939;&nbsp; Derni&egrave;re sortie longue cette semaine si ce n&apos;est pas fait",
          "&#127829;&nbsp; Commence &agrave; augmenter les glucides en fin de semaine (pates, riz, pain)",
          "&#128085;&nbsp; V&eacute;rifie ton &eacute;quipement : chaussures rod&eacute;es, dossard, nutrition pr&eacute;vue",
          "&#128134;&nbsp; R&eacute;duis l&apos;intensit&eacute; : c&apos;est la semaine d&apos;aff&ucirc;tage, pas de surcharge",
          "&#128205;&nbsp; Rep&egrave;re le parcours, le lieu de d&eacute;part et le timing",
        ];
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.5px">${tag}</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">${title}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#666;font-weight:500">${raceName} &middot; ${raceDist}&nbsp;km</p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;font-weight:600">${isJ1 ? "Tes derniers conseils avant le d&eacute;part&nbsp;:" : "Comment bien g&eacute;rer cette derni&egrave;re semaine&nbsp;:"}</p>
      ${tips.map(t => `<p style="margin:0 0 12px;font-size:14px;color:#444;line-height:1.6;padding:10px 14px;background:#f9f9f9;border-radius:8px;border-left:3px solid ${accent}">${t}</p>`).join("")}
      <div style="margin-top:8px">
        ${btn(isJ1 ? "Voir ma strat&eacute;gie de course &rarr;" : "Voir mon plan de la semaine &rarr;", APP_URL + "/training")}
      </div>
      <p style="margin:8px 0 0;font-size:13px;color:#888">Bonne course ${name}&nbsp;! L&apos;&eacute;quipe FuelRun est avec toi. &#9889;</p>
    `);
  },

  weekly({ name, raceName, raceDate, raceDist, statsKm, statsSessions, statsStreak }) {
    const km = Math.round(statsKm || 0);
    const sess = statsSessions || 0;
    const streak = statsStreak || 0;
    const daysLeft = raceDate ? Math.max(0, Math.ceil((new Date(raceDate) - new Date()) / 86400000)) : null;
    const weeksLeft = daysLeft !== null ? Math.ceil(daysLeft / 7) : null;
    const raceBlock = raceName && weeksLeft && weeksLeft > 0
      ? `<div style="background:#fff8f5;border-radius:10px;padding:14px 18px;margin:0 0 20px;border:1px solid #ffe4d6">
           <p style="margin:0;font-size:14px;color:#FF6B2B;font-weight:700">&#127937; ${raceName} &mdash; ${raceDist}&nbsp;km</p>
           <p style="margin:6px 0 0;font-size:13px;color:#666">Dans <strong>${weeksLeft}&nbsp;semaine${weeksLeft > 1 ? "s" : ""}</strong> &mdash; continue comme &ccedil;a !</p>
         </div>`
      : "";
    const motivation = sess === 0
      ? `<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7">Cette semaine, reprends ton plan&nbsp;! M&ecirc;me une courte s&eacute;ance de 20 minutes fait la diff&eacute;rence sur le long terme.</p>`
      : `<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7">Beau travail cette semaine&nbsp;! Lance l'application pour voir le plan de la semaine et continuer sur ta lanc&eacute;e.</p>`;
    return base(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FF6B2B;text-transform:uppercase;letter-spacing:0.5px">R&eacute;sum&eacute; hebdomadaire</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111;letter-spacing:-0.3px">Bonne semaine, ${name}&nbsp;! &#127939;</h1>
      ${raceBlock}
      <table role="presentation" style="width:100%;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;margin:0 0 20px">
        <tr style="background:#f9f9f9">
          <td style="padding:16px;text-align:center;border-right:1px solid #e5e5e5">
            <p style="margin:0;font-size:28px;font-weight:800;color:#FF6B2B">${km}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">km courus</p>
          </td>
          <td style="padding:16px;text-align:center;border-right:1px solid #e5e5e5">
            <p style="margin:0;font-size:28px;font-weight:800;color:#3B82F6">${sess}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">s&eacute;ances</p>
          </td>
          <td style="padding:16px;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:800;color:#22C55E">${streak}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">jours cons&eacute;cutifs</p>
          </td>
        </tr>
      </table>
      ${motivation}
      ${btn("Voir mon plan de la semaine &rarr;", APP_URL + "/training")}
    `);
  },
};
