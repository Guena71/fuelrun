// Vercel serverless function — keeps STRAVA_CLIENT_SECRET server-side
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  var { code, refresh_token, grant_type = "authorization_code" } = req.body || {};

  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return res.status(500).json({ error: "Strava credentials not configured" });
  }

  try {
    var body = {
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type,
    };
    if (grant_type === "authorization_code") body.code = code;
    else body.refresh_token = refresh_token;

    var stravaRes = await fetch("https://www.strava.com/oauth/token", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    var data = await stravaRes.json();

    if (!stravaRes.ok) {
      return res.status(400).json(data);
    }

    // Only forward what the client needs — never expose client_secret
    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      athlete:       data.athlete ? { id: data.athlete.id, firstname: data.athlete.firstname, lastname: data.athlete.lastname, profile_medium: data.athlete.profile_medium } : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
