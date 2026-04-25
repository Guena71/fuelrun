// Strava activities — retourne les 10 dernières courses de l'utilisateur
// Variables Vercel : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY

const FS_BASE = () =>
  `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function verifyToken(idToken) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d.users?.[0]?.localId || null;
}

async function fsGet(path, idToken) {
  const r = await fetch(`${FS_BASE()}/${path}`, { headers: { Authorization: "Bearer " + idToken } });
  return r.ok ? r.json() : null;
}

async function fsPatch(path, fields, idToken) {
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  await fetch(`${FS_BASE()}/${path}?${mask}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
    body:    JSON.stringify({ fields }),
  });
}

function fsStr(f) { return f?.stringValue ?? null; }
function fsInt(f) { return f?.integerValue ? parseInt(f.integerValue, 10) : null; }

function msToPace(mps) {
  if (!mps || mps <= 0) return null;
  const s = 1000 / mps;
  return `${Math.floor(s / 60)}'${String(Math.round(s % 60)).padStart(2, "0")}"`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://fuelrun.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!idToken) return res.status(401).json({ error: "Non authentifié" });

  const uid = await verifyToken(idToken);
  if (!uid) return res.status(401).json({ error: "Token invalide" });

  const doc = await fsGet(`users/${uid}`, idToken);
  const sf  = doc?.fields?.strava?.mapValue?.fields;
  if (!sf) return res.status(404).json({ error: "Strava non connecté" });

  let accessToken  = fsStr(sf.accessToken);
  let refreshToken = fsStr(sf.refreshToken);
  let expiresAt    = fsInt(sf.expiresAt) || 0;

  if (Date.now() / 1000 > expiresAt - 60) {
    const r = await fetch("https://www.strava.com/oauth/token", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type:    "refresh_token",
      }),
    });
    const refreshed = await r.json();
    if (refreshed.access_token) {
      accessToken  = refreshed.access_token;
      refreshToken = refreshed.refresh_token;
      expiresAt    = refreshed.expires_at;
      await fsPatch(`users/${uid}`, {
        strava: {
          mapValue: {
            fields: {
              accessToken:  { stringValue: accessToken },
              refreshToken: { stringValue: refreshToken },
              expiresAt:    { integerValue: String(expiresAt) },
              athleteId:    sf.athleteId,
              athleteName:  sf.athleteName,
            },
          },
        },
      }, idToken);
    }
  }

  const r = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10&page=1", {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!r.ok) return res.status(r.status).json({ error: "Erreur API Strava" });
  const activities = await r.json();

  const runs = activities
    .filter(a => a.type === "Run" || a.sport_type === "Run")
    .map(a => ({
      id:        a.id,
      name:      a.name,
      date:      a.start_date_local.slice(0, 10),
      km:        +(a.distance / 1000).toFixed(2),
      duration:  Math.round(a.moving_time / 60),
      pace:      msToPace(a.average_speed),
      elevation: Math.round(a.total_elevation_gain),
    }));

  res.status(200).json({ runs, athleteName: fsStr(sf.athleteName) });
}
