// Module interne — helpers Firestore admin avec service account
import crypto from "crypto";

function b64url(str) {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function getAdminToken() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const sa = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = b64url(sign.sign(sa.private_key));
  const jwt = `${header}.${payload}.${sig}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth2:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const d = await r.json();
  return d.access_token || null;
}

export async function listUsers(adminToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;
  const docs = [];
  let pageToken = null;
  do {
    const url = base + `?pageSize=100${pageToken ? "&pageToken=" + pageToken : ""}`;
    const r = await fetch(url, { headers: { Authorization: "Bearer " + adminToken } });
    if (!r.ok) break;
    const data = await r.json();
    if (data.documents) docs.push(...data.documents);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return docs;
}

function str(f) { return f?.stringValue ?? null; }
function num(f) {
  if (f?.integerValue) return parseInt(f.integerValue, 10);
  if (f?.doubleValue)  return f.doubleValue;
  return 0;
}

export function parseUser(doc) {
  const f  = doc.fields || {};
  const pf = f.profile?.mapValue?.fields || {};
  const rf = f.race?.mapValue?.fields    || {};
  const sf = f.stats?.mapValue?.fields   || {};
  return {
    uid:           doc.name.split("/").pop(),
    email:         str(f.email),
    name:          str(pf.name) || "Champion",
    raceName:      str(rf.name),
    raceDate:      str(rf.date),
    raceDist:      num(rf.dist) || 42,
    statsKm:       num(sf.km),
    statsSessions: num(sf.sessions),
    statsStreak:   num(sf.streak),
  };
}

export async function getUserByUid(uid) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey    = process.env.FIREBASE_API_KEY;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return parseUser(await r.json());
}
