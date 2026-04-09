export default async function handler(req, res) {
  var clientId = process.env.STRAVA_CLIENT_ID || "MISSING";
  var hasSecret = !!(process.env.STRAVA_CLIENT_SECRET);
  var secretLen = (process.env.STRAVA_CLIENT_SECRET||"").length;
  return res.status(200).json({
    client_id: clientId,
    has_secret: hasSecret,
    secret_length: secretLen,
    redirect_uri_env: process.env.STRAVA_REDIRECT_URI || "not set",
  });
}
