// Vercel serverless function — lit le Google Sheet publié en CSV et retourne du JSON
// Cache en mémoire 1h pour éviter les appels répétés

var cache = { data: null, ts: 0 };
var TTL = 60 * 60 * 1000; // 1h

function parseCsv(text) {
  var lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  var headers = lines[0].split(",").map(function(h) { return h.trim().replace(/^"|"$/g, ""); });
  return lines.slice(1).map(function(line) {
    var cols = [];
    var cur = ""; var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    var obj = {};
    headers.forEach(function(h, i) {
      var v = (cols[i] || "").replace(/^"|"$/g, "").trim();
      obj[h] = v;
    });
    return obj;
  });
}

function toRace(row, idx) {
  if (!row.name || !row.date) return null;
  return {
    id:   parseInt(row.id) || (1000 + idx),
    name: row.name,
    dist: parseFloat(row.dist) || 10,
    type: row.type === "trail" ? "trail" : "route",
    date: row.date,
    city: row.city || "",
    lat:  parseFloat(row.lat) || null,
    lng:  parseFloat(row.lng) || null,
    star: row.star === "true" || row.star === "1" || row.star === "TRUE",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  var url = process.env.RACES_SHEET_URL;
  if (!url) return res.status(200).json([]);

  // Retourner le cache si valide
  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.status(200).json(cache.data);
  }

  try {
    var r = await fetch(url);
    if (!r.ok) throw new Error("Sheet fetch error " + r.status);
    var text = await r.text();
    var rows = parseCsv(text);
    var today = new Date().toISOString().slice(0, 10);
    var races = rows
      .map(function(row, i) { return toRace(row, i); })
      .filter(function(r) { return r && r.date >= today; });
    cache = { data: races, ts: Date.now() };
    return res.status(200).json(races);
  } catch (e) {
    // En cas d'erreur retourner tableau vide → l'app utilise les données statiques
    return res.status(200).json([]);
  }
}
