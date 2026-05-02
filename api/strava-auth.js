// Strava OAuth callback — échange le code, stocke les tokens chiffrés dans Firestore
// Variables Vercel : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, STRAVA_ENCRYPT_KEY

import { encrypt } from "./_crypto.js";

const APP_URL = "https://fuelrun.fr";

export default async function handler(req, res) {
  const { code, state: uid, error } = req.query || {};

  if (error || !code || !uid) {
    return res.redirect(`${APP_URL}/?strava=error`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type:    "authorization_code",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await tokenRes.json();
    if (!data.access_token) return res.redirect(`${APP_URL}/?strava=error`);

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey    = process.env.FIREBASE_API_KEY;
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=strava&key=${apiKey}`,
      {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            strava: {
              mapValue: {
                fields: {
                  accessToken:  { stringValue: encrypt(data.access_token) },
                  refreshToken: { stringValue: encrypt(data.refresh_token) },
                  expiresAt:    { integerValue: String(data.expires_at) },
                  athleteId:    { integerValue: String(data.athlete?.id || 0) },
                  athleteName:  { stringValue: [data.athlete?.firstname, data.athlete?.lastname].filter(Boolean).join(" ") },
                },
              },
            },
          },
        }),
      }
    );

    res.redirect(`${APP_URL}/?strava=connected`);
  } catch {
    clearTimeout(timeout);
    res.redirect(`${APP_URL}/?strava=error`);
  }
}
