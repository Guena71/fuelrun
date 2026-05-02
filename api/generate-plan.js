// Génération de plan d'entraînement côté serveur
// Le paywall (semaines gratuites) est appliqué ici, pas dans le client
// Variables d'environnement : FIREBASE_PROJECT_ID, FIREBASE_API_KEY

const FREE_PLAN_WEEKS = 3;

const DIST_BRACKETS = [10, 21, 42, 80, 999];
const IDEAL_WEEKS_TABLE = {
  starter: [12,18,24,32,36], beginner: [10,14,20,28,32],
  intermediate: [8,12,16,22,28], advanced: [6,10,14,18,24], expert: [6,8,12,16,20]
};
const PEAK_KM_TABLE = {
  starter: [35,45,55,70,80], beginner: [45,55,65,85,100],
  intermediate: [55,65,80,100,120], advanced: [65,75,95,120,150], expert: [75,90,110,140,180]
};
const PACES = {
  starter:      {easy:"8:00",tempo:"7:00",interval:"6:30",long:"8:30",recovery:"9:00"},
  beginner:     {easy:"6:30",tempo:"5:45",interval:"5:15",long:"7:00",recovery:"7:30"},
  intermediate: {easy:"5:30",tempo:"4:50",interval:"4:20",long:"5:50",recovery:"6:20"},
  advanced:     {easy:"4:50",tempo:"4:10",interval:"3:45",long:"5:10",recovery:"5:30"},
  expert:       {easy:"4:20",tempo:"3:45",interval:"3:20",long:"4:40",recovery:"5:00"}
};
const PHASE_DEFS = [
  {id:"base",  label:"Base",         color:"#22C55E", sessions:[
    {type:"easy",    label:"Endurance fondamentale",   pct:0.32, desc:"Allure conversationnelle, 65-70% FCmax."},
    {type:"interval",label:"Côtes",                   pct:0.18, desc:"8×20s en côte, récup trot en descente."},
    {type:"long",    label:"Sortie longue",            pct:0},
    {type:"recovery",label:"Récupération",             pct:0.12, desc:"Footing léger 40 min, très facile."}
  ]},
  {id:"build", label:"Développement", color:"#3B82F6", sessions:[
    {type:"easy",    label:"Endurance",                pct:0.28, desc:"Allure facile, base de la semaine."},
    {type:"tempo",   label:"Seuil",                    pct:0.22, desc:"15 min échauffement + 25 min à allure seuil."},
    {type:"long",    label:"Sortie longue progressive",pct:0},
    {type:"recovery",label:"Récupération",             pct:0.12, desc:"Footing régénérateur 30-40 min."}
  ]},
  {id:"peak",  label:"Spécifique",   color:"#FF5A1F", sessions:[
    {type:"easy",    label:"Activation",               pct:0.26, desc:"Footing facile, gardez l'énergie."},
    {type:"interval",label:"Fractionné long",          pct:0.22, desc:"4×8 min à 85% FCmax, récup 3 min trot."},
    {type:"long",    label:"Sortie longue spécifique", pct:0},
    {type:"recovery",label:"Récupération",             pct:0.12, desc:"Footing très léger + étirements."}
  ]},
  {id:"taper", label:"Affûtage",     color:"#F59E0B", sessions:[]}
];

function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d) { var r = new Date(d); var day = r.getDay() === 0 ? 6 : r.getDay() - 1; r.setDate(r.getDate() - day); r.setHours(0,0,0,0); return r; }
function weeksUntil(date, today) { return Math.max(1, Math.ceil((new Date(date) - today) / (7*86400000))); }
function idealPlanWeeks(dist, level) { var row = IDEAL_WEEKS_TABLE[level] || IDEAL_WEEKS_TABLE.beginner; for (var i=0; i<DIST_BRACKETS.length; i++) { if (dist <= DIST_BRACKETS[i]) return row[i]; } return row[row.length-1]; }
function getPeakKm(dist, level) { var row = PEAK_KM_TABLE[level] || PEAK_KM_TABLE.beginner; for (var i=0; i<DIST_BRACKETS.length; i++) { if (dist <= DIST_BRACKETS[i]) return row[i]; } return row[row.length-1]; }

function buildPlan(race, profile, today) {
  if (!race) return null;
  var level = (profile && profile.level) || "beginner";
  var dist = race.dist || 42;
  var raceDate = new Date(race.date);
  var base = Math.max(parseFloat((profile && profile.kmWeek) || 25), 10);
  var idealWeeks = idealPlanWeeks(dist, level);
  var availWeeks = weeksUntil(race.date, today);
  var minViable = dist<=10?3:dist<=21?5:dist<=42?8:12;
  if (availWeeks < minViable) return { tooShort:true, idealWeeks, availWeeks, minViable };
  var totalWeeks = Math.min(idealWeeks, availWeeks);
  var peakKm = getPeakKm(dist, level);
  if (availWeeks < idealWeeks * 0.7) peakKm = Math.min(peakKm, base * 1.4);
  var taperW = dist<=10?1:dist<=21?2:dist<=42?3:dist<=80?4:5;
  taperW = Math.min(taperW, Math.floor(totalWeeks/3));
  var trainW = Math.max(1, totalWeeks - taperW);
  var phaseSeq = trainW>=15?["base","base","build","build","peak"]:trainW>=10?["base","build","build","peak"]:trainW>=6?["base","build","peak"]:["build","peak"];
  var nP = phaseSeq.length;
  var phaseLens = []; var assigned = 0;
  for (var pi=0; pi<nP; pi++) {
    var pw2 = pi===nP-1 ? trainW-assigned : Math.max(1, Math.floor(trainW/nP));
    phaseLens.push(pw2); assigned += pw2;
  }
  var raceWeekStart = startOfWeek(raceDate);
  var planStart = addDays(raceWeekStart, -(totalWeeks-1)*7);
  var sPerWeek = Math.min(7, Math.max(1, parseInt((profile && profile.sessWeek) || 3)));
  var dayMaps = {1:[3],2:[1,4],3:[1,3,5],4:[1,3,5,6],5:[0,2,3,5,6],6:[0,1,2,4,5,6],7:[0,1,2,3,4,5,6]};
  var days = dayMaps[sPerWeek] || [1,3,5];
  var pt = (profile && profile.vdotPaces) ? profile.vdotPaces : (PACES[level] || PACES.beginner);
  var jours = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  var allWeeks = []; var wi = 0;
  for (var pi2=0; pi2<phaseSeq.length; pi2++) {
    var phaseId = phaseSeq[pi2];
    var phase = PHASE_DEFS.find(p => p.id === phaseId);
    var pw = phaseLens[pi2];
    for (var i=0; i<pw; i++) {
      var wStart = addDays(planStart, wi*7);
      var isRecup = i>0 && (i+1)%4===0;
      var progress = (wi+1)/trainW;
      var kmWeek = isRecup ? Math.round(base*0.7) : Math.max(base, Math.round(base+(peakKm-base)*progress));
      var lf = dist<=21?0.85:dist<=42?0.80:0.60;
      var longKm = Math.max(8, Math.round(dist*lf*(0.4+progress*0.5)));
      var baseSess = phase.sessions.map(s => ({
        type:s.type, label:s.label, km:s.type==="long"?longKm:Math.max(4,Math.round(kmWeek*s.pct)),
        desc:s.desc, pace:pt[s.type]||pt.easy
      }));
      var sessions = baseSess.slice(0, sPerWeek).map((s, si) => {
        var dayOff = days[si % days.length];
        return { type:s.type, label:s.label, km:s.km, desc:s.desc, pace:s.pace, date:addDays(wStart,dayOff), dayLabel:jours[dayOff] };
      });
      var realKm = sessions.reduce((s,x) => s+(x.type==="race"?0:x.km), 0);
      allWeeks.push({
        num:wi+1, total:totalWeeks, idealWeeks, availWeeks, phase:phaseId,
        phaseLabel:phase.label, phaseColor:phase.color,
        weekStart:wStart, weekEnd:addDays(wStart,6), km:realKm, isRecup,
        isCurrent: wStart.toDateString() === startOfWeek(today).toDateString(),
        isPast: addDays(wStart,6) < today,
        sessions
      });
      wi++;
    }
  }
  for (var t=0; t<taperW; t++) {
    var wStart2 = addDays(planStart, wi*7);
    var isLast = t === taperW-1;
    var kmWeek2 = Math.round(base*(isLast?0.2:0.5));
    var taperSess = [
      {type:"easy",    label:"Footing léger",km:Math.max(4,Math.round(kmWeek2*0.4)),desc:"Allure très facile.",   pace:pt.easy},
      {type:"interval",label:"Activations", km:Math.max(4,Math.round(kmWeek2*0.3)),desc:"20 min facile + 4×100 m.",pace:pt.interval},
      {type:"easy",    label:"Confirmation",km:Math.max(3,Math.round(kmWeek2*0.2)),desc:"30 min très facile.",   pace:pt.easy}
    ];
    var sessions2 = taperSess.slice(0, sPerWeek).map((s, si) => {
      var dayOff = days[si % days.length];
      return { type:s.type, label:s.label, km:s.km, desc:s.desc, pace:s.pace, date:addDays(wStart2,dayOff), dayLabel:jours[dayOff] };
    });
    if (isLast) {
      var dow = raceDate.getDay()===0?6:raceDate.getDay()-1;
      sessions2.push({ type:"race", label:"Jour de course", km:dist, date:raceDate, dayLabel:jours[dow], pace:"", desc:"C'est le grand jour !" });
    }
    var realKm2 = sessions2.reduce((s,x) => s+(x.type==="race"?0:x.km), 0);
    allWeeks.push({
      num:wi+1, total:totalWeeks, idealWeeks, availWeeks, phase:"taper",
      phaseLabel:"Affûtage", phaseColor:"#F59E0B",
      weekStart:wStart2, weekEnd:addDays(wStart2,6), km:realKm2, isRecup:false,
      isCurrent: wStart2.toDateString() === startOfWeek(today).toDateString(),
      isPast: addDays(wStart2,6) < today,
      sessions: sessions2
    });
    wi++;
  }
  return { weeks:allWeeks, planStart, raceDate, idealWeeks, availWeeks };
}

// Récupère le plan de l'utilisateur depuis Firestore (pour connaître son abonnement)
async function getUserPlan(uid, idToken) {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_API_KEY) return "gratuit";
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      { headers: { Authorization: "Bearer " + idToken } }
    );
    if (!r.ok) return "gratuit";
    const doc = await r.json();
    return doc?.fields?.profile?.mapValue?.fields?.plan?.stringValue || "gratuit";
  } catch { return "gratuit"; }
}

async function verifyToken(idToken) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({idToken}) }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return data.users?.[0]?.localId || null;
}

export default async function handler(req, res) {
  const _allowed = ["https://fuelrun.fr", "https://fuelrun.vercel.app"];
  const _origin = req.headers.origin || "";
  if (_allowed.includes(_origin)) res.setHeader("Access-Control-Allow-Origin", _origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { race, profile } = req.body || {};
  if (!race) return res.status(400).json({ error: "race required" });

  // Validation des paramètres
  const raceDate = new Date(race.date);
  if (!race.date || isNaN(raceDate.getTime())) return res.status(400).json({ error: "race.date invalide" });
  const raceDist = parseFloat(race.dist);
  if (!race.dist || isNaN(raceDist) || raceDist <= 0 || raceDist > 1000) return res.status(400).json({ error: "race.dist invalide" });
  race.dist = raceDist;
  const VALID_LEVELS = ["starter","beginner","intermediate","advanced","expert"];
  if (profile?.level && !VALID_LEVELS.includes(profile.level)) return res.status(400).json({ error: "profile.level invalide" });
  const kmWeek = profile?.kmWeek ? parseFloat(profile.kmWeek) : null;
  if (kmWeek !== null && (isNaN(kmWeek) || kmWeek < 0 || kmWeek > 500)) return res.status(400).json({ error: "profile.kmWeek invalide" });

  const today = new Date(new Date().setHours(0,0,0,0));
  const plan = buildPlan(race, profile || {}, today);
  if (!plan || plan.tooShort) return res.status(200).json({ plan });

  // ── Appliquer le paywall serveur ────────────────────────────────────
  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  let userPlan = "gratuit";
  if (idToken) {
    try {
      const uid = await verifyToken(idToken);
      if (uid) userPlan = await getUserPlan(uid, idToken);
    } catch {}
  }

  const PLAN_LEVELS = { gratuit:0, essential:1, pro:2, elite:2 };
  const level = PLAN_LEVELS[userPlan] ?? 0;

  if (level < 1) {
    // Gratuit : retourner uniquement les premières semaines, verrouiller le reste
    plan.weeks = plan.weeks.map((w, i) => ({
      ...w,
      locked: i >= FREE_PLAN_WEEKS,
      sessions: i >= FREE_PLAN_WEEKS ? [] : w.sessions
    }));
  }

  res.status(200).json({ plan, userPlan });
}
