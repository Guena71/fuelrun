export var RACES=[
  /* ── PARIS ── */
  {id:1,  name:"La Parisienne",              dist:10,  type:"route",date:"2026-09-13",city:"Paris",           lat:48.86, lng:2.35},
  {id:2,  name:"10 km de Paris",             dist:10,  type:"route",date:"2026-04-05",city:"Paris",           lat:48.86, lng:2.35},
  {id:3,  name:"20 km de Paris",             dist:20,  type:"route",date:"2026-10-11",city:"Paris",           lat:48.86, lng:2.35},
  {id:5,  name:"Marathon de Paris",          dist:42,  type:"route",date:"2026-04-12",city:"Paris",           lat:48.86, lng:2.35,star:true},
  {id:6,  name:"Semi de Paris Automne",      dist:21,  type:"route",date:"2026-10-18",city:"Paris",           lat:48.86, lng:2.35},
  {id:4,  name:"5 km du Bois de Vincennes",  dist:5,   type:"route",date:"2026-05-10",city:"Paris",           lat:48.84, lng:2.43},
  {id:60, name:"10 km de Boulogne",          dist:10,  type:"route",date:"2026-06-07",city:"Boulogne-Billancourt",lat:48.83,lng:2.24},
  {id:61, name:"Semi de Versailles",         dist:21,  type:"route",date:"2026-05-03",city:"Versailles",      lat:48.80, lng:2.13},
  {id:62, name:"10 km de Saint-Denis",       dist:10,  type:"route",date:"2026-09-20",city:"Saint-Denis",     lat:48.94, lng:2.36},
  /* ── LYON ── */
  {id:7,  name:"10 km de Lyon",              dist:10,  type:"route",date:"2026-05-17",city:"Lyon",            lat:45.75, lng:4.83},
  {id:8,  name:"Run in Lyon Semi",           dist:21,  type:"route",date:"2026-10-04",city:"Lyon",            lat:45.75, lng:4.83},
  {id:9,  name:"Run in Lyon Marathon",       dist:42,  type:"route",date:"2026-10-04",city:"Lyon",            lat:45.75, lng:4.83},
  {id:63, name:"5 km des Berges du Rhône",   dist:5,   type:"route",date:"2026-04-26",city:"Lyon",            lat:45.75, lng:4.83},
  {id:64, name:"10 km de Villeurbanne",      dist:10,  type:"route",date:"2026-06-14",city:"Villeurbanne",    lat:45.77, lng:4.89},
  /* ── MARSEILLE ── */
  {id:13, name:"10 km de Marseille",         dist:10,  type:"route",date:"2026-04-12",city:"Marseille",       lat:43.30, lng:5.37},
  {id:14, name:"Semi de Marseille",          dist:21,  type:"route",date:"2026-10-25",city:"Marseille",       lat:43.30, lng:5.37},
  {id:15, name:"Marathon de Marseille",      dist:42,  type:"route",date:"2026-10-25",city:"Marseille",       lat:43.30, lng:5.37},
  /* ── BORDEAUX ── */
  {id:10, name:"10 km de Bordeaux",          dist:10,  type:"route",date:"2026-05-03",city:"Bordeaux",        lat:44.84, lng:-0.58},
  {id:11, name:"Semi de Bordeaux",           dist:21,  type:"route",date:"2026-11-08",city:"Bordeaux",        lat:44.84, lng:-0.58},
  {id:12, name:"Marathon de Bordeaux",       dist:42,  type:"route",date:"2026-11-08",city:"Bordeaux",        lat:44.84, lng:-0.58},
  {id:38, name:"Marathon du Médoc",          dist:42,  type:"route",date:"2026-09-12",city:"Pauillac",        lat:45.20, lng:-0.75},
  {id:65, name:"5 km des Quais de Bordeaux", dist:5,   type:"route",date:"2026-06-21",city:"Bordeaux",        lat:44.84, lng:-0.58},
  /* ── NANTES ── */
  {id:20, name:"Marathon de Nantes",         dist:42,  type:"route",date:"2026-04-26",city:"Nantes",          lat:47.22, lng:-1.55},
  {id:66, name:"Semi de Nantes",             dist:21,  type:"route",date:"2026-04-26",city:"Nantes",          lat:47.22, lng:-1.55},
  {id:67, name:"10 km de Nantes",            dist:10,  type:"route",date:"2026-05-31",city:"Nantes",          lat:47.22, lng:-1.55},
  /* ── TOULOUSE ── */
  {id:21, name:"Marathon de Toulouse",       dist:42,  type:"route",date:"2026-10-18",city:"Toulouse",        lat:43.60, lng:1.44},
  {id:22, name:"Semi de Toulouse",           dist:21,  type:"route",date:"2026-04-05",city:"Toulouse",        lat:43.60, lng:1.44},
  {id:68, name:"10 km de Toulouse",          dist:10,  type:"route",date:"2026-04-05",city:"Toulouse",        lat:43.60, lng:1.44},
  /* ── NICE / CÔTE D'AZUR ── */
  {id:17, name:"Semi de Nice",               dist:21,  type:"route",date:"2026-04-19",city:"Nice",            lat:43.70, lng:7.27},
  {id:23, name:"Marathon Nice-Cannes",       dist:42,  type:"route",date:"2026-11-08",city:"Nice",            lat:43.70, lng:7.27,star:true},
  {id:69, name:"10 km de Cannes",            dist:10,  type:"route",date:"2026-10-04",city:"Cannes",          lat:43.55, lng:7.02},
  {id:70, name:"5 km de Monaco",             dist:5,   type:"route",date:"2026-05-24",city:"Monaco",          lat:43.73, lng:7.42},
  /* ── LILLE / NORD ── */
  {id:24, name:"Marathon de Lille",          dist:42,  type:"route",date:"2026-10-04",city:"Lille",           lat:50.63, lng:3.06},
  {id:25, name:"Semi de Lille",              dist:21,  type:"route",date:"2026-04-19",city:"Lille",           lat:50.63, lng:3.06},
  {id:71, name:"10 km de Roubaix",           dist:10,  type:"route",date:"2026-05-10",city:"Roubaix",         lat:50.69, lng:3.18},
  {id:72, name:"Run de Valenciennes",        dist:10,  type:"route",date:"2026-06-07",city:"Valenciennes",    lat:50.36, lng:3.52},
  /* ── STRASBOURG / ALSACE ── */
  {id:26, name:"Marathon de Strasbourg",     dist:42,  type:"route",date:"2026-04-19",city:"Strasbourg",      lat:48.57, lng:7.75},
  {id:27, name:"Semi de Strasbourg",         dist:21,  type:"route",date:"2026-04-19",city:"Strasbourg",      lat:48.57, lng:7.75},
  {id:73, name:"10 km de Mulhouse",          dist:10,  type:"route",date:"2026-05-17",city:"Mulhouse",        lat:47.75, lng:7.34},
  /* ── RENNES / BRETAGNE ── */
  {id:28, name:"Marathon de Rennes",         dist:42,  type:"route",date:"2026-10-11",city:"Rennes",          lat:48.11, lng:-1.68},
  {id:74, name:"Semi de Brest",              dist:21,  type:"route",date:"2026-05-03",city:"Brest",           lat:48.39, lng:-4.49},
  {id:75, name:"10 km de Quimper",           dist:10,  type:"route",date:"2026-07-26",city:"Quimper",         lat:47.99, lng:-4.10},
  {id:76, name:"10 km de Saint-Malo",        dist:10,  type:"route",date:"2026-06-14",city:"Saint-Malo",      lat:48.65, lng:-2.01},
  /* ── ANNECY / ALPES ── */
  {id:29, name:"Semi d'Annecy",              dist:21,  type:"route",date:"2026-04-19",city:"Annecy",          lat:45.90, lng:6.12},
  {id:30, name:"Marathon du Lac d'Annecy",   dist:42,  type:"route",date:"2026-04-19",city:"Annecy",          lat:45.90, lng:6.12},
  {id:77, name:"10 km de Grenoble",          dist:10,  type:"route",date:"2026-05-31",city:"Grenoble",        lat:45.19, lng:5.72},
  {id:78, name:"Semi de Grenoble",           dist:21,  type:"route",date:"2026-10-04",city:"Grenoble",        lat:45.19, lng:5.72},
  {id:79, name:"Marathon de Chambéry",       dist:42,  type:"route",date:"2026-09-27",city:"Chambéry",        lat:45.57, lng:5.92},
  /* ── MONTPELLIER / SUD ── */
  {id:31, name:"Marathon de Montpellier",    dist:42,  type:"route",date:"2026-10-25",city:"Montpellier",     lat:43.61, lng:3.88},
  {id:32, name:"Semi de Montpellier",        dist:21,  type:"route",date:"2026-10-25",city:"Montpellier",     lat:43.61, lng:3.88},
  {id:80, name:"10 km de Nîmes",             dist:10,  type:"route",date:"2026-05-10",city:"Nîmes",           lat:43.84, lng:4.36},
  {id:81, name:"Semi de Perpignan",          dist:21,  type:"route",date:"2026-04-12",city:"Perpignan",       lat:42.70, lng:2.90},
  /* ── CLERMONT / AUVERGNE ── */
  {id:33, name:"Semi de Clermont-Ferrand",   dist:21,  type:"route",date:"2026-05-03",city:"Clermont-Ferrand",lat:45.78, lng:3.08},
  {id:82, name:"10 km de Vichy",             dist:10,  type:"route",date:"2026-08-23",city:"Vichy",           lat:46.12, lng:3.43},
  /* ── DIJON / BOURGOGNE ── */
  {id:34, name:"Semi de Dijon",              dist:21,  type:"route",date:"2026-10-18",city:"Dijon",           lat:47.32, lng:5.04},
  {id:83, name:"Marathon de Dijon",          dist:42,  type:"route",date:"2026-10-18",city:"Dijon",           lat:47.32, lng:5.04},
  /* ── METZ / NANCY / LORRAINE ── */
  {id:35, name:"Semi de Metz",               dist:21,  type:"route",date:"2026-05-03",city:"Metz",            lat:49.12, lng:6.18},
  {id:84, name:"10 km de Nancy",             dist:10,  type:"route",date:"2026-06-07",city:"Nancy",           lat:48.69, lng:6.18},
  /* ── REIMS / CHAMPAGNE ── */
  {id:36, name:"Marathon de Reims",          dist:42,  type:"route",date:"2026-10-18",city:"Reims",           lat:49.25, lng:4.03},
  {id:85, name:"Semi de Reims",              dist:21,  type:"route",date:"2026-04-26",city:"Reims",           lat:49.25, lng:4.03},
  /* ── TOURS / VAL DE LOIRE ── */
  {id:37, name:"Marathon de Tours",          dist:42,  type:"route",date:"2026-10-11",city:"Tours",           lat:47.39, lng:0.69},
  {id:86, name:"Semi de Tours",              dist:21,  type:"route",date:"2026-10-11",city:"Tours",           lat:47.39, lng:0.69},
  {id:87, name:"10 km d'Orléans",            dist:10,  type:"route",date:"2026-05-17",city:"Orléans",         lat:47.90, lng:1.91},
  /* ── ROUEN / NORMANDIE ── */
  {id:39, name:"Semi de Rouen",              dist:21,  type:"route",date:"2026-04-26",city:"Rouen",           lat:49.44, lng:1.10},
  {id:88, name:"Marathon de Caen",           dist:42,  type:"route",date:"2026-10-11",city:"Caen",            lat:49.18, lng:-0.37},
  {id:89, name:"10 km du Havre",             dist:10,  type:"route",date:"2026-05-24",city:"Le Havre",        lat:49.49, lng:0.11},
  /* ── BELGIQUE / SUISSE ── */
  {id:90, name:"Marathon de Bruxelles",      dist:42,  type:"route",date:"2026-10-04",city:"Bruxelles",       lat:50.85, lng:4.35},
  {id:91, name:"Semi de Liège",              dist:21,  type:"route",date:"2026-04-26",city:"Liège",           lat:50.63, lng:5.57},
  {id:92, name:"Lausanne Marathon",          dist:42,  type:"route",date:"2026-10-25",city:"Lausanne",        lat:46.52, lng:6.63},
  {id:93, name:"Genève Marathon",            dist:42,  type:"route",date:"2026-05-03",city:"Genève",          lat:46.20, lng:6.15},
  {id:94, name:"Semi de Zurich",             dist:21,  type:"route",date:"2026-04-05",city:"Zurich",          lat:47.38, lng:8.54},
  /* ── GRANDS MARATHONS MONDE ── */
  {id:51, name:"Boston Marathon",            dist:42,  type:"route",date:"2026-04-20",city:"Boston",          lat:42.36, lng:-71.06,star:true},
  {id:52, name:"London Marathon",            dist:42,  type:"route",date:"2026-04-26",city:"London",          lat:51.50, lng:-0.12, star:true},
  {id:53, name:"Berlin Marathon",            dist:42,  type:"route",date:"2026-09-27",city:"Berlin",          lat:52.52, lng:13.40, star:true},
  {id:54, name:"Chicago Marathon",           dist:42,  type:"route",date:"2026-10-11",city:"Chicago",         lat:41.88, lng:-87.62,star:true},
  {id:55, name:"NYC Marathon",               dist:42,  type:"route",date:"2026-11-01",city:"New York",        lat:40.71, lng:-74.00,star:true},
  {id:56, name:"Tokyo Marathon",             dist:42,  type:"route",date:"2026-03-01",city:"Tokyo",           lat:35.68, lng:139.69,star:true},
  {id:57, name:"Valencia Marathon",          dist:42,  type:"route",date:"2026-12-06",city:"Valencia",        lat:39.47, lng:-0.38},
  {id:58, name:"Amsterdam Marathon",         dist:42,  type:"route",date:"2026-10-18",city:"Amsterdam",       lat:52.37, lng:4.90},
  {id:59, name:"Francfort Marathon",         dist:42,  type:"route",date:"2026-10-25",city:"Francfort",       lat:50.11, lng:8.68},
  /* ── TRAIL FRANCE ── */
  {id:103,name:"Trail Fontainebleau 50 km",  dist:50,  type:"trail",date:"2026-04-18",city:"Fontainebleau",   lat:48.40, lng:2.70},
  {id:104,name:"Trail des Calanques 55 km",  dist:55,  type:"trail",date:"2026-04-19",city:"Marseille",       lat:43.21, lng:5.44},
  {id:107,name:"Maxi-Race Annecy 90 km",     dist:90,  type:"trail",date:"2026-06-06",city:"Annecy",          lat:45.90, lng:6.12},
  {id:112,name:"UTMB 171 km",                dist:171, type:"trail",date:"2026-08-28",city:"Chamonix",        lat:45.92, lng:6.87,star:true},
  {id:113,name:"CCC 100 km",                 dist:100, type:"trail",date:"2026-08-27",city:"Chamonix",        lat:45.92, lng:6.87},
  {id:119,name:"Les Templiers 80 km",        dist:80,  type:"trail",date:"2026-10-18",city:"Millau",          lat:44.09, lng:3.07,star:true},
  {id:120,name:"Grand Raid Réunion 165 km",  dist:165, type:"trail",date:"2026-10-15",city:"La Réunion",      lat:-21.11,lng:55.54,star:true},
  {id:121,name:"Trail du Beaujolais 42 km",  dist:42,  type:"trail",date:"2026-11-15",city:"Villefranche-sur-Saône",lat:45.99,lng:4.72},
  {id:122,name:"Trail des Montagnes du Giffre 40 km",dist:40,type:"trail",date:"2026-07-05",city:"Samoëns",  lat:46.08, lng:6.73},
  {id:123,name:"Alsace Ultra Trail 100 km",  dist:100, type:"trail",date:"2026-09-05",city:"Munster",         lat:48.04, lng:7.13},
  {id:124,name:"Trail des Fées 25 km",       dist:25,  type:"trail",date:"2026-05-10",city:"Condrieu",        lat:45.47, lng:4.75},
  {id:125,name:"Trail de la Sainte-Victoire 30 km",dist:30,type:"trail",date:"2026-04-05",city:"Aix-en-Provence",lat:43.53,lng:5.45},
  {id:126,name:"Pyrénées Trail Run 60 km",   dist:60,  type:"trail",date:"2026-07-19",city:"Cauterets",       lat:42.89, lng:-0.10},
  {id:127,name:"Trail des Gorges du Verdon 45 km",dist:45,type:"trail",date:"2026-05-24",city:"Castellane",   lat:43.84, lng:6.52},
  {id:128,name:"Puy-de-Dôme Trail 30 km",    dist:30,  type:"trail",date:"2026-06-14",city:"Clermont-Ferrand",lat:45.77, lng:2.96},
  {id:129,name:"Trail des Citadelles 35 km", dist:35,  type:"trail",date:"2026-09-13",city:"Carcassonne",     lat:43.21, lng:2.35},
  {id:130,name:"Trail du Golfe du Morbihan 28 km",dist:28,type:"trail",date:"2026-05-31",city:"Vannes",       lat:47.66, lng:-2.76},
  {id:131,name:"Normandie Trail 50 km",       dist:50,  type:"trail",date:"2026-09-06",city:"Alençon",        lat:48.43, lng:0.09},
  {id:132,name:"Trail des Passerelles 20 km", dist:20,  type:"trail",date:"2026-07-12",city:"Millau",         lat:44.09, lng:3.07},
  {id:133,name:"Vercors Trails 56 km",        dist:56,  type:"trail",date:"2026-06-28",city:"Villard-de-Lans",lat:45.07, lng:5.55},
  {id:134,name:"Ecotrail Paris 80 km",        dist:80,  type:"trail",date:"2026-03-22",city:"Paris",          lat:48.86, lng:2.35},
  {id:135,name:"Trail de la Motte 18 km",     dist:18,  type:"trail",date:"2026-04-26",city:"Motte-d'Aveillans",lat:45.03,lng:5.73},
  /* ── TRAIL INTERNATIONAL ── */
  {id:150,name:"Western States 100 miles",    dist:161, type:"trail",date:"2026-06-27",city:"Squaw Valley",   lat:39.19, lng:-120.24,star:true},
  {id:151,name:"Hardrock 100",                dist:161, type:"trail",date:"2026-07-11",city:"Silverton",      lat:37.81, lng:-107.66,star:true},
  {id:152,name:"TDS 145 km",                  dist:145, type:"trail",date:"2026-08-25",city:"Chamonix",       lat:45.92, lng:6.87},
  {id:153,name:"Lavaredo Ultra Trail 120 km", dist:120, type:"trail",date:"2026-06-26",city:"Cortina d'Ampezzo",lat:46.54,lng:12.14,star:true},
  {id:154,name:"Ultra Trail du Mont Blanc OCC 55 km",dist:55,type:"trail",date:"2026-08-29",city:"Chamonix", lat:45.92, lng:6.87},
  {id:155,name:"Swiss Peaks Trail 360 km",    dist:360, type:"trail",date:"2026-08-08",city:"Martigny",       lat:46.10, lng:7.07},
];

// ── URLs d'inscription par course ────────────────────────────────────────
export var REG_URLS={
  112:"https://utmb.world/utmb-world-series/races/utmb",
  113:"https://utmb.world/utmb-world-series/races/ccc",
  152:"https://utmb.world/utmb-world-series/races/tds",
  154:"https://utmb.world/utmb-world-series/races/occ",
  107:"https://www.maxi-race.com",
  119:"https://www.lestempliers.com",
  120:"https://www.grandraid-reunion.com",
  150:"https://www.wser.org",
  151:"https://hardrock100.com",
  153:"https://ultratraillavaredo.com",
  134:"https://www.ecotrail.fr",
  51:"https://www.baa.org/races/boston-marathon",
  52:"https://www.tcslondonmarathon.com",
  53:"https://www.bmw-berlin-marathon.com",
  54:"https://www.chicagomarathon.com",
  55:"https://www.nyrr.org/races/tcsnewyorkcitymarathon",
  56:"https://www.marathon.tokyo",
  57:"https://valenciaciudaddelrunning.com/en/marathon",
  58:"https://www.tcsamstelgoldrace.nl",
  5:"https://www.schneiderelectricparismarathon.com",
};

export function regUrl(race){
  if(REG_URLS[race.id])return REG_URLS[race.id];
  return "https://www.klikego.com/recherche?terms="+encodeURIComponent(race.name);
}
