// Strava OAuth callback — échange le code, stocke les tokens dans Firestore
// Variables Vercel : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY

const APP_URL = "https://fuelrun.vercel.app";

export default async function handler(req, res) {
  const { code, state: uid, error } = req.query || {};

  if (error || !code || !uid) {
    return res.redirect(`${APP_URL}/?strava=error`);
  }

  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type:    "authorization_code",
      }),
    });
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
                  accessToken:  { stringValue: data.access_token },
                  refreshToken: { stringValue: data.refresh_token },
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
    res.redirect(`${APP_URL}/?strava=error`);
  }
}
