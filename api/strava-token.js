// Vercel serverless function — keeps STRAVA_CLIENT_SECRET server-side
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  var { code, refresh_token, redirect_uri, grant_type = "authorization_code" } = req.body || {};

  var clientId     = (process.env.STRAVA_CLIENT_ID     || "").trim();
  var clientSecret = (process.env.STRAVA_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Strava credentials not configured" });
  }

  try {
    var params = new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type,
    });
    if (grant_type === "authorization_code") {
      params.set("code", code);
    } else {
      params.set("refresh_token", refresh_token);
    }

    var stravaRes = await fetch("https://www.strava.com/oauth/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });

    var data = await stravaRes.json();

    if (!stravaRes.ok) {
      return res.status(400).json(data);
    }

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
