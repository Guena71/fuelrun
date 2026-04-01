import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { auth, db, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc } from "./firebase.js";

var MISTRAL_KEY=import.meta.env.VITE_MISTRAL_KEY||"";

var BG="#0a0a0a",SURF="#161616",SURF2="#1f1f1f",BORD="#2a2a2a";
var TXT="#f0f0f0",SUB="#888",MUT="#444";
var OR="#FF5A1F",GR="#22C55E",BL="#3B82F6",PU="#A855F7",YE="#F59E0B",RE="#EF4444";

var CSS=[
  "*{box-sizing:border-box;margin:0;padding:0;}",
  "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;}",
  "html,body{overflow-x:hidden;}",
  "@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}",
  "@keyframes run{0%{transform:translateX(-4px)}50%{transform:translateX(4px)}100%{transform:translateX(-4px)}}",
  "@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
  "input,textarea,button{font-family:inherit;}",
  "input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;outline:none;cursor:pointer;}",
  "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;cursor:pointer;background:#f0f0f0;}",
  "::-webkit-scrollbar{width:0;height:0;}"
].join("");

var MONTHS_F=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
var MONTHS_S=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
var WDAYS=["L","M","M","J","V","S","D"];
var TODAY=new Date(2026,2,24);

function addDays(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r;}
function startOfWeek(d){var r=new Date(d);var day=r.getDay()===0?6:r.getDay()-1;r.setDate(r.getDate()-day);r.setHours(0,0,0,0);return r;}
function fmtDate(d){return d.getDate()+" "+MONTHS_F[d.getMonth()];}
function fmtS(d){return d.getDate()+" "+MONTHS_S[d.getMonth()];}
function weeksUntil(date){return Math.max(1,Math.ceil((new Date(date)-TODAY)/(7*86400000)));}
function durStr(pace,km){var p=(pace||"5:30").split(":");var tot=Math.round((parseInt(p[0])+(parseInt(p[1]||0)/60))*(km||0));return Math.floor(tot/60)+"h"+String(tot%60).padStart(2,"0");}

var DIST_BRACKETS=[10,21,42,80,999];
var IDEAL_WEEKS_TABLE={starter:[12,18,24,32,36],beginner:[10,14,20,28,32],intermediate:[8,12,16,22,28],advanced:[6,10,14,18,24],expert:[6,8,12,16,20]};
var PEAK_KM_TABLE={starter:[35,45,55,70,80],beginner:[45,55,65,85,100],intermediate:[55,65,80,100,120],advanced:[65,75,95,120,150],expert:[75,90,110,140,180]};

function idealPlanWeeks(dist,level){var row=IDEAL_WEEKS_TABLE[level]||IDEAL_WEEKS_TABLE.beginner;for(var i=0;i<DIST_BRACKETS.length;i++){if(dist<=DIST_BRACKETS[i])return row[i];}return row[row.length-1];}
function getPeakKm(dist,level){var row=PEAK_KM_TABLE[level]||PEAK_KM_TABLE.beginner;for(var i=0;i<DIST_BRACKETS.length;i++){if(dist<=DIST_BRACKETS[i])return row[i];}return row[row.length-1];}
function getPlanWeeks(plan){if(!plan||plan.tooShort||!Array.isArray(plan.weeks))return [];return plan.weeks;}

var LEVELS=[
  {id:"starter",  label:"Je démarre",    sub:"Mes premiers kilomètres",           emoji:"🌱"},
  {id:"beginner", label:"Débutant",       sub:"Moins d'un an de pratique",         emoji:"🏃"},
  {id:"intermediate",label:"Intermédiaire",sub:"1 à 3 ans, quelques courses",      emoji:"🔥"},
  {id:"advanced", label:"Avancé",         sub:"Compétiteur régulier",              emoji:"⚡"},
  {id:"expert",   label:"Expert",         sub:"Performances de haut niveau",       emoji:"🏆"}
];
var LEVEL_LABELS={starter:"Démarrage",beginner:"Débutant",intermediate:"Intermédiaire",advanced:"Avancé",expert:"Expert"};

var PACES={
  starter:    {easy:"8:00",tempo:"7:00",interval:"6:30",long:"8:30",recovery:"9:00"},
  beginner:   {easy:"6:30",tempo:"5:45",interval:"5:15",long:"7:00",recovery:"7:30"},
  intermediate:{easy:"5:30",tempo:"4:50",interval:"4:20",long:"5:50",recovery:"6:20"},
  advanced:   {easy:"4:50",tempo:"4:10",interval:"3:45",long:"5:10",recovery:"5:30"},
  expert:     {easy:"4:20",tempo:"3:45",interval:"3:20",long:"4:40",recovery:"5:00"}
};

var PHASE_DEFS=[
  {id:"base",label:"Base",color:GR,sessions:[
    {type:"easy",    label:"Endurance fondamentale",  pct:0.32, desc:"Allure conversationnelle, 65-70% FCmax."},
    {type:"interval",label:"Côtes",                  pct:0.18, desc:"8×20s en côte, récup trot en descente."},
    {type:"long",    label:"Sortie longue",           pct:0},
    {type:"recovery",label:"Récupération",            pct:0.12, desc:"Footing léger 40 min, très facile."}
  ]},
  {id:"build",label:"Développement",color:BL,sessions:[
    {type:"easy",    label:"Endurance",               pct:0.28, desc:"Allure facile, base de la semaine."},
    {type:"tempo",   label:"Seuil",                   pct:0.22, desc:"15 min échauffement + 25 min à allure seuil."},
    {type:"long",    label:"Sortie longue progressive",pct:0},
    {type:"recovery",label:"Récupération",            pct:0.12, desc:"Footing régénérateur 30-40 min."}
  ]},
  {id:"peak",label:"Spécifique",color:OR,sessions:[
    {type:"easy",    label:"Activation",              pct:0.26, desc:"Footing facile, gardez l'énergie pour les séances clés."},
    {type:"interval",label:"Fractionné long",         pct:0.22, desc:"4×8 min à 85% FCmax, récup 3 min trot."},
    {type:"long",    label:"Sortie longue spécifique",pct:0},
    {type:"recovery",label:"Récupération",            pct:0.12, desc:"Footing très léger + étirements."}
  ]},
  {id:"taper",label:"Affûtage",color:YE,sessions:[]}
];

var TYPE_COLORS={easy:GR,interval:BL,tempo:YE,long:OR,recovery:MUT,race:OR};

var QUOTES=[
  {text:"Les champions ne sont pas faits dans les salles de sport. Ils sont faits de quelque chose qu'ils ont au fond d'eux : un désir, un rêve, une vision.",author:"Muhammad Ali"},
  {text:"La douleur est temporaire. Abandonner dure toujours.",author:"Lance Armstrong"},
  {text:"Je ne cours pas pour ajouter des jours à ma vie, mais pour ajouter de la vie à mes jours.",author:"Emil Zátopek"},
  {text:"Ce qui compte, ce n'est pas l'intensité de l'effort, mais sa continuité.",author:"Michael Jordan"},
  {text:"L'impossible, c'est ce que personne ne peut faire jusqu'à ce que quelqu'un le fasse.",author:"Adidas / Jesse Owens"},
  {text:"Si quelque chose se dresse entre toi et ton succès, avance dessus ou contourne-le.",author:"Michael Jordan"},
  {text:"Le secret, c'est de commencer. Une fois que tu as commencé, c'est à moitié fait.",author:"Eliud Kipchoge"},
  {text:"Aucun être humain n'est limité.",author:"Eliud Kipchoge"},
  {text:"La souffrance est le carburant du champion.",author:"Kylian Mbappé"},
  {text:"Je peux accepter l'échec, tout le monde échoue un jour. Mais je ne peux pas accepter de ne pas essayer.",author:"Michael Jordan"},
  {text:"Les limites, comme les peurs, ne sont souvent que des illusions.",author:"Michael Jordan"},
  {text:"Pour gagner, il faut d'abord croire que c'est possible.",author:"Roger Federer"},
  {text:"L'entraînement dur aujourd'hui rend demain plus facile.",author:"Usain Bolt"},
  {text:"Je m'entraîne tous les jours pour être le meilleur que je puisse être.",author:"Cristiano Ronaldo"},
  {text:"Le succès, c'est 1% d'inspiration et 99% de transpiration.",author:"Thomas Edison / Pelé"},
  {text:"Chaque matin, un coureur se lève et sait qu'il devra courir plus vite ou rester derrière.",author:"Roger Bannister"},
  {text:"La victoire a un prix. Et ce prix, c'est l'entraînement.",author:"Jesse Owens"},
  {text:"Ne rêve pas de gagner, entraîne-toi pour ça.",author:"Usain Bolt"},
  {text:"Les médailles se gagnent à l'entraînement, pas le jour de la compétition.",author:"Michael Phelps"},
  {text:"Je n'ai jamais perdu. Soit je gagne, soit j'apprends.",author:"Nelson Mandela / Serena Williams"},
];

var MEALS_MAP={
  easy:    [{time:"Matin",      food:"Porridge + fruits rouges"},          {time:"Midi",         food:"Riz + poulet + légumes"},      {time:"Soir",      food:"Pâtes + saumon + salade"}],
  long:    [{time:"Matin J−3h", food:"Flocons d'avoine + banane + miel"},  {time:"Pendant",      food:"1 gel toutes les 45 min + eau"},{time:"Récup 30min",food:"Boisson protéines + banane"}],
  interval:[{time:"Matin",      food:"Toast + œufs + jus d'orange"},       {time:"Midi",         food:"Quinoa + légumes"},            {time:"Soir",      food:"Poulet + patate douce"}],
  recovery:[{time:"Matin",      food:"Smoothie protéine + fruits"},        {time:"Midi",         food:"Salade + pain complet"},       {time:"Soir",      food:"Soupe + poisson blanc + riz"}],
  tempo:   [{time:"Matin",      food:"Toast + beurre d'amande + banane"},  {time:"Midi",         food:"Pâtes + thon + tomates"},      {time:"Soir",      food:"Riz + poulet + brocolis"}],
  rest:    [{time:"Matin",      food:"Yaourt grec + granola + miel"},      {time:"Midi",         food:"Salade composée + protéines"}, {time:"Soir",      food:"Légumes rôtis + poisson"}],
  race:    [{time:"Matin J−3h", food:"Riz ou pâtes blanches + banane"},    {time:"Pendant",      food:"Gels + eau régulièrement"},    {time:"Récup",     food:"Boisson récup + fruits + protéines"}]
};

var RECIPES={
  easy:[
    {name:"Porridge fruits rouges",slot:"Matin",time:"10 min",kcal:380,
     ingredients:["80 g flocons d'avoine","200 ml lait","100 g fruits rouges","1 c. à soupe de miel","1 c. à café de cannelle"],
     steps:["Chauffer le lait avec les flocons 5 minutes en remuant.","Verser dans un bol.","Garnir de fruits rouges et arroser de miel."]},
    {name:"Bol riz poulet légumes",slot:"Midi",time:"20 min",kcal:520,
     ingredients:["150 g riz basmati","150 g poulet grillé","200 g légumes vapeur","1 c. à soupe d'huile d'olive","Herbes fraîches"],
     steps:["Cuire le riz 15 minutes.","Griller le poulet assaisonné.","Assembler dans un bol avec les légumes.","Arroser d'huile d'olive."]},
    {name:"Pâtes saumon salade",slot:"Soir",time:"20 min",kcal:560,
     ingredients:["180 g pâtes","120 g saumon vapeur","1 poignée de roquette","1 c. à soupe d'huile d'olive","Jus de citron"],
     steps:["Cuire les pâtes al dente.","Émietter le saumon sur les pâtes tièdes.","Ajouter la roquette, l'huile et le citron."]}
  ],
  long:[
    {name:"Porridge avoine banane miel",slot:"Matin J−3h",time:"10 min",kcal:480,
     ingredients:["100 g flocons d'avoine","250 ml eau","1 banane","2 c. à soupe de miel","Pincée de sel"],
     steps:["Cuire les flocons à l'eau 5 minutes.","Ajouter une pincée de sel.","Garnir de banane tranchée et de miel.","Consommer 3 heures avant le départ."]},
    {name:"Gel maison dattes-citron",slot:"Pendant",time:"5 min",kcal:180,
     ingredients:["6 dattes Medjool dénoyautées","1 pincée de sel","Jus d'un demi-citron","2 c. à soupe d'eau"],
     steps:["Mixer tous les ingrédients jusqu'à obtenir une pâte lisse.","Répartir dans des poches à gel réutilisables.","Consommer 1 poche toutes les 45 min pendant l'effort."]},
    {name:"Smoothie récupération protéiné",slot:"Récup 30 min",time:"5 min",kcal:420,
     ingredients:["200 ml lait d'amande","1 banane","30 g protéines vanille","1 c. à soupe de beurre d'amande","100 g myrtilles"],
     steps:["Mixer tous les ingrédients 30 secondes.","Servir immédiatement après la sortie."]}
  ],
  interval:[
    {name:"Toast œufs brouillés jus d'orange",slot:"Matin",time:"10 min",kcal:420,
     ingredients:["2 tranches de pain complet","3 œufs","1 c. à soupe de lait","Sel, poivre","1 grand verre de jus d'orange frais"],
     steps:["Battre les œufs avec le lait, sel et poivre.","Cuire à feu doux en remuant constamment.","Servir sur le pain toasté avec le jus d'orange."]},
    {name:"Bowl quinoa légumineuses",slot:"Midi",time:"20 min",kcal:560,
     ingredients:["150 g quinoa","100 g pois chiches","100 g edamame","1 avocat","Sauce tahini"],
     steps:["Cuire le quinoa 12 minutes.","Égoutter les pois chiches.","Assembler dans un bol avec l'avocat.","Napper de sauce tahini."]},
    {name:"Poulet patate douce brocolis",slot:"Soir",time:"25 min",kcal:530,
     ingredients:["180 g poulet","200 g patate douce","150 g brocolis","1 c. à soupe d'huile d'olive","Épices au choix"],
     steps:["Rôtir la patate douce et les brocolis 20 min au four.","Griller le poulet assaisonné à la poêle.","Servir ensemble avec un filet d'huile d'olive."]}
  ],
  tempo:[
    {name:"Toast beurre d'amande banane",slot:"Matin",time:"5 min",kcal:380,
     ingredients:["2 tranches de pain complet","2 c. à soupe de beurre d'amande","1 banane","1 c. à café de miel"],
     steps:["Toaster le pain.","Étaler le beurre d'amande généreusement.","Garnir de rondelles de banane et d'un filet de miel."]},
    {name:"Pâtes thon tomates",slot:"Midi",time:"15 min",kcal:580,
     ingredients:["180 g pâtes","1 boîte de thon naturel","200 g tomates cerises","1 c. à soupe d'huile d'olive","Basilic frais"],
     steps:["Cuire les pâtes al dente.","Égoutter et mélanger avec le thon émietté.","Ajouter les tomates, l'huile et le basilic."]},
    {name:"Riz poulet brocolis",slot:"Soir",time:"20 min",kcal:500,
     ingredients:["150 g riz","180 g poulet","200 g brocolis vapeur","Sauce soja légère","Gingembre râpé"],
     steps:["Cuire le riz et les brocolis à la vapeur.","Faire revenir le poulet avec le gingembre.","Assembler et assaisonner de sauce soja."]}
  ],
  recovery:[
    {name:"Smoothie bowl protéiné",slot:"Matin",time:"10 min",kcal:360,
     ingredients:["200 ml lait d'amande","1 banane congelée","30 g protéines vanille","Granola","Fruits frais"],
     steps:["Mixer le lait, la banane et les protéines.","Verser dans un bol épais.","Garnir de granola et de fruits frais."]},
    {name:"Salade composée pain complet",slot:"Midi",time:"10 min",kcal:380,
     ingredients:["1 poignée de roquette","100 g thon naturel","1 œuf dur","Tomates cerises","2 tranches de pain complet"],
     steps:["Assembler la salade avec tous les ingrédients.","Assaisonner légèrement d'huile et de citron.","Servir avec le pain complet."]},
    {name:"Soupe miso tofu poisson blanc",slot:"Soir",time:"15 min",kcal:320,
     ingredients:["2 c. à soupe de pâte miso","150 g tofu soyeux","150 g poisson blanc","100 g riz cuit","Oignon vert"],
     steps:["Chauffer le bouillon et pocher le poisson 5 min.","Dissoudre le miso hors feu.","Ajouter le tofu, le riz et garnir d'oignon vert."]}
  ],
  race:[
    {name:"Riz blanc huile parmesan",slot:"Matin J−3h",time:"15 min",kcal:620,
     ingredients:["250 g riz blanc","2 c. à soupe d'huile d'olive","Parmesan râpé","Sel","Basilic frais"],
     steps:["Cuire le riz à l'eau salée.","Égoutter et huiler immédiatement.","Parsemer de parmesan et de basilic.","Manger 3 heures avant le départ."]},
    {name:"Gel énergie maison banane",slot:"Pendant",time:"5 min",kcal:160,
     ingredients:["1 banane bien mûre","1 pincée de sel","1 c. à café de miel"],
     steps:["Écraser la banane en purée lisse.","Mélanger avec le sel et le miel.","Consommer régulièrement pendant la course."]},
    {name:"Boisson récupération maison",slot:"Récup",time:"5 min",kcal:280,
     ingredients:["500 ml lait écrémé","1 banane","30 g protéines chocolat","1 c. à soupe de miel","Glaçons"],
     steps:["Mixer tous les ingrédients.","Boire dans les 30 minutes après l'arrivée.","Compléter avec des fruits frais si appétit."]}
  ]
};

var RACES=[
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

var PLANS=[
  {
    name:"Gratuit", price:"0", per:"toujours", color:SUB, tag:null,
    desc:"Pour découvrir FuelRun sans engagement.",
    items:[
      "1 objectif de course",
      "Plan d'entraînement basique",
      "Journal des séances",
      "Météo et conseils parcours",
      "5 messages Coach IA / jour",
    ],
    cta:"Continuer gratuitement"
  },
  {
    name:"Essential", price:"4,99", per:"/mois", color:BL, tag:"Populaire",
    desc:"Pour le coureur régulier qui veut progresser.",
    items:[
      "Courses et objectifs illimités",
      "Plans personnalisés avancés",
      "Journal + RPE + suivi fatigue",
      "Météo et conseils parcours",
      "30 messages Coach IA / jour",
    ],
    cta:"Essayer 14 j gratuit"
  },
  {
    name:"Pro", price:"9,99", per:"/mois", color:OR, tag:"Recommandé",
    desc:"Pour performer et préparer une vraie compétition.",
    items:[
      "Tout Essential, plus :",
      "Coach IA illimité 24h/24",
      "Allures d'entraînement personnalisées",
      "Stratégie de course et splits",
      "Nutrition complète + recettes",
      "Analyse de performance détaillée",
    ],
    cta:"Essayer 14 j gratuit"
  },
  {
    name:"Elite", price:"19,99", per:"/mois", color:PU, tag:"Max",
    desc:"Pour les compétiteurs qui veulent le meilleur.",
    items:[
      "Tout Pro, plus :",
      "5 profils (famille / équipe)",
      "Synchronisation Strava et Garmin",
      "Prédictions de temps et records",
      "Coach dédié et support prioritaire",
    ],
    cta:"Essayer 14 j gratuit"
  }
];

function getCourseReadiness(race,profile){
  var lvl=(profile&&profile.level)||"beginner";
  var dist=race.dist||42;
  var av=weeksUntil(race.date);
  var ideal=idealPlanWeeks(dist,lvl);
  if(av<4)           return{color:RE,icon:"🔴",label:"Trop proche",         msg:"Moins de 4 semaines."};
  if(av<ideal*0.5)   return{color:RE,icon:"🔴",label:"Délai insuffisant",   msg:"Il faudrait au moins "+ideal+" semaines."};
  if(av<ideal*0.8)   return{color:YE,icon:"🟡",label:"Faisable avec effort",msg:"Délai serré ("+av+" sem. sur "+ideal+" idéales)."};
  return              {color:GR,icon:"🟢",label:"Objectif réalisable",      msg:"Profil et délai compatibles !"};
}

function calcNutrition(profile,sessType){
  var w=parseFloat((profile&&profile.weight)||70),a=parseInt((profile&&profile.age)||30),h=parseFloat((profile&&profile.height)||175);
  var female=profile&&profile.sex==="F";
  var bmr=female?447.6+9.2*w+3.1*h-4.3*a:88.4+13.4*w+4.8*h-5.7*a;
  var mults={easy:1.5,interval:1.7,tempo:1.65,long:1.9,recovery:1.3,rest:1.2,race:2.1};
  var macros={easy:{c:0.55,p:0.20,f:0.25},interval:{c:0.55,p:0.25,f:0.20},tempo:{c:0.57,p:0.22,f:0.21},long:{c:0.65,p:0.15,f:0.20},recovery:{c:0.45,p:0.30,f:0.25},rest:{c:0.40,p:0.30,f:0.30},race:{c:0.70,p:0.15,f:0.15}};
  var kcal=Math.round(bmr*(mults[sessType]||1.5));
  var mr=macros[sessType]||macros.easy;
  var src=MEALS_MAP[sessType]||MEALS_MAP.easy;
  var meals=src.map(function(m,i){return{time:m.time,food:m.food,kcal:Math.round(kcal*([0.30,0.40,0.30][i]||0.30))};});
  return{kcal:kcal,carbs:Math.round(kcal*mr.c/4),prot:Math.round(kcal*mr.p/4),fat:Math.round(kcal*mr.f/9),meals:meals};
}

function buildPlan(race,profile){
  if(!race)return null;
  var level=(profile&&profile.level)||"beginner";
  var dist=race.dist||42;
  var raceDate=new Date(race.date);
  var base=Math.max(parseFloat((profile&&profile.kmWeek)||25),10);
  var idealWeeks=idealPlanWeeks(dist,level);
  var availWeeks=weeksUntil(race.date);
  var minViable=dist<=10?3:dist<=21?5:dist<=42?8:12;
  if(availWeeks<minViable)return{tooShort:true,idealWeeks:idealWeeks,availWeeks:availWeeks,minViable:minViable};
  var totalWeeks=Math.min(idealWeeks,availWeeks);
  var peakKm=getPeakKm(dist,level);
  if(availWeeks<idealWeeks*0.7)peakKm=Math.min(peakKm,base*1.4);
  var taperW=dist<=10?1:dist<=21?2:dist<=42?3:dist<=80?4:5;
  taperW=Math.min(taperW,Math.floor(totalWeeks/3));
  var trainW=Math.max(1,totalWeeks-taperW);
  var phaseSeq=trainW>=15?["base","base","build","build","peak"]:trainW>=10?["base","build","build","peak"]:trainW>=6?["base","build","peak"]:["build","peak"];
  var nP=phaseSeq.length;
  var phaseLens=[];var assigned=0;
  for(var pi=0;pi<nP;pi++){var pw2=pi===nP-1?trainW-assigned:Math.max(1,Math.floor(trainW/nP));phaseLens.push(pw2);assigned+=pw2;}
  var raceWeekStart=startOfWeek(raceDate);
  var planStart=addDays(raceWeekStart,-(totalWeeks-1)*7);
  var sPerWeek=Math.min(7,Math.max(1,parseInt((profile&&profile.sessWeek)||3)));
  var dayMaps={1:[3],2:[1,4],3:[1,3,5],4:[1,3,5,6],5:[0,2,3,5,6],6:[0,1,2,4,5,6],7:[0,1,2,3,4,5,6]};
  var days=dayMaps[sPerWeek]||[1,3,5];
  var pt=(profile&&profile.vdotPaces)?profile.vdotPaces:(PACES[level]||PACES.beginner);
  var jours=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  var allWeeks=[];var wi=0;
  for(var pi2=0;pi2<phaseSeq.length;pi2++){
    var phaseId=phaseSeq[pi2];
    var phase=PHASE_DEFS.find(function(p){return p.id===phaseId;});
    var pw=phaseLens[pi2];
    for(var i=0;i<pw;i++){
      var wStart=addDays(planStart,wi*7);
      var isRecup=i>0&&(i+1)%4===0;
      var progress=(wi+1)/trainW;
      var kmWeek=isRecup?Math.round(base*0.7):Math.max(base,Math.round(base+(peakKm-base)*progress));
      var lf=dist<=21?0.85:dist<=42?0.80:0.60;
      var longKm=Math.max(8,Math.round(dist*lf*(0.4+progress*0.5)));
      var baseSess=phase.sessions.map(function(s){return{type:s.type,label:s.label,km:s.type==="long"?longKm:Math.max(4,Math.round(kmWeek*s.pct)),desc:s.desc,pace:pt[s.type]||pt.easy};});
      var sessions=baseSess.slice(0,sPerWeek).map(function(s,si){var dayOff=days[si%days.length];return{type:s.type,label:s.label,km:s.km,desc:s.desc,pace:pt[s.type]||pt.easy,date:addDays(wStart,dayOff),dayLabel:jours[dayOff]};});
      var realKm=sessions.reduce(function(s,x){return s+(x.type==="race"?0:x.km);},0);
      allWeeks.push({num:wi+1,total:totalWeeks,idealWeeks:idealWeeks,availWeeks:availWeeks,phase:phaseId,phaseLabel:phase.label,phaseColor:phase.color,weekStart:wStart,weekEnd:addDays(wStart,6),km:realKm,isRecup:isRecup,isCurrent:wStart.toDateString()===startOfWeek(TODAY).toDateString(),isPast:addDays(wStart,6)<TODAY,sessions:sessions});
      wi++;
    }
  }
  for(var t=0;t<taperW;t++){
    var wStart2=addDays(planStart,wi*7);
    var isLast=t===taperW-1;
    var kmWeek2=Math.round(base*(isLast?0.2:0.5));
    var taperSess=[
      {type:"easy",    label:"Footing léger",  km:Math.max(4,Math.round(kmWeek2*0.4)),desc:"Allure très facile.",              pace:pt.easy},
      {type:"interval",label:"Activations",    km:Math.max(4,Math.round(kmWeek2*0.3)),desc:"20 min facile + 4×100 m.",        pace:pt.interval},
      {type:"easy",    label:"Confirmation",   km:Math.max(3,Math.round(kmWeek2*0.2)),desc:"30 min très facile.",             pace:pt.easy}
    ];
    var sessions2=taperSess.slice(0,sPerWeek).map(function(s,si){var dayOff=days[si%days.length];return{type:s.type,label:s.label,km:s.km,desc:s.desc,pace:s.pace,date:addDays(wStart2,dayOff),dayLabel:jours[dayOff]};});
    if(isLast){var dow=raceDate.getDay()===0?6:raceDate.getDay()-1;sessions2.push({type:"race",label:"Jour de course",km:dist,date:raceDate,dayLabel:jours[dow],pace:"",desc:"C'est le grand jour !"});}
    var realKm2=sessions2.reduce(function(s,x){return s+(x.type==="race"?0:x.km);},0);
    allWeeks.push({num:wi+1,total:totalWeeks,idealWeeks:idealWeeks,availWeeks:availWeeks,phase:"taper",phaseLabel:"Affûtage",phaseColor:YE,weekStart:wStart2,weekEnd:addDays(wStart2,6),km:realKm2,isRecup:false,isCurrent:wStart2.toDateString()===startOfWeek(TODAY).toDateString(),isPast:addDays(wStart2,6)<TODAY,sessions:sessions2});
    wi++;
  }
  return{weeks:allWeeks,planStart:planStart,raceDate:raceDate,idealWeeks:idealWeeks,availWeeks:availWeeks};
}

// ── VDOT / Allures calibrées (Jack Daniels) ──────────────────────────
function calcVdot(distKm,timeSec){
  var t=timeSec/60;
  var v=(distKm*1000)/t;
  var pct=0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t);
  var vo2=-4.60+0.182258*v+0.000104*v*v;
  return vo2/pct;
}
function vdotToPaces(vdot){
  function p(pct){
    var tv=pct*vdot;
    var a=0.000104,b=0.182258,c=-(4.60+tv);
    var v=(-b+Math.sqrt(b*b-4*a*c))/(2*a);
    var s=60000/v;
    var mn=Math.floor(s/60),sc=Math.round(s%60);
    if(sc>=60){mn++;sc=0;}
    return mn+":"+String(sc).padStart(2,"0");
  }
  return{easy:p(0.65),long:p(0.62),tempo:p(0.88),interval:p(0.975),recovery:p(0.57)};
}

// ── Stratégie de course ───────────────────────────────────────────────
function fmtTime(secs){
  var h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=Math.round(secs%60);
  if(h>0)return h+"h"+String(m).padStart(2,"0")+"'"+String(s).padStart(2,"0");
  return m+"'"+String(s).padStart(2,"0");
}
function fmtPaceSec(sPerKm){
  var mn=Math.floor(sPerKm/60),sc=Math.round(sPerKm%60);
  if(sc>=60){mn++;sc=0;}
  return mn+":"+String(sc).padStart(2,"0");
}
function calcSplits(distKm,goalSec,strategy){
  var avgSec=goalSec/distKm;
  var unit=distKm<=21?1:distKm<=50?5:10;
  var n=Math.floor(distKm/unit);
  var splits=[];var elapsed=0;
  for(var i=0;i<n;i++){
    var frac=(i+0.5)/n;
    var factor=strategy==="negative"?(frac<0.5?1.02:0.98):1.0;
    var pace=avgSec*factor;
    elapsed+=pace*unit;
    splits.push({km:(i+1)*unit,pace:fmtPaceSec(pace),elapsed:fmtTime(Math.round(elapsed))});
  }
  var rem=distKm-n*unit;
  if(rem>0.05){elapsed+=avgSec*rem;splits.push({km:distKm,pace:fmtPaceSec(avgSec),elapsed:fmtTime(Math.round(goalSec))});}
  return splits;
}

// ── Météo ─────────────────────────────────────────────────────────────
function weatherAdvice(code,temp,wind){
  var desc,color;
  if(code===0)     {desc="Ciel dégagé";color=YE;}
  else if(code<=3) {desc="Nuageux";color=BL;}
  else if(code<=48){desc="Brouillard";color=MUT;}
  else if(code<=55){desc="Bruine";color=BL;}
  else if(code<=65){desc="Pluie";color=BL;}
  else if(code<=77){desc="Neige";color=BL;}
  else if(code<=82){desc="Averses";color=BL;}
  else             {desc="Orage";color=RE;}
  var tip;
  if(code>=95)     tip="Orage — entraînement en salle recommandé.";
  else if(code>=71)tip="Sols glissants — réduis ton allure, sois prudent.";
  else if(code>=61)tip="Pluie — tenue imperméable, evite les chaussures légères.";
  else if(temp<0)  tip="Froid extrême — 3 couches, échauffement long.";
  else if(temp<5)  tip="Froid — bonnet et gants obligatoires.";
  else if(temp<15) tip="Température idéale pour la performance.";
  else if(temp<20) tip="Bonne température — hydratation normale.";
  else if(temp<25) tip="Chaud — bois 200 ml toutes les 20 min.";
  else if(temp<30) tip="Très chaud — ralentis de 10-15 sec/km.";
  else             tip="Chaleur extrême — sors tôt le matin seulement.";
  if(wind>30&&code<61)tip+=" Vent fort, planifie ton parcours en conséquence.";
  var icon=code===0?"☀":code<=3?"⛅":code<=48?"🌫":code<=65?"🌧":code<=77?"❄":code<=82?"🌦":"⛈";
  return{desc:desc,tip:tip,color:color,icon:icon};
}

function Btn(p){
  var sz={sm:{padding:"8px 14px",fontSize:13},md:{padding:"13px 18px",fontSize:15},lg:{padding:"16px 22px",fontSize:16}}[p.size||"md"];
  var vr={primary:{background:OR,color:"#fff"},ghost:{background:"transparent",border:"1px solid "+BORD,color:SUB}}[p.variant||"primary"];
  return(<button onClick={p.disabled?undefined:p.onClick} style={Object.assign({display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:12,fontWeight:600,cursor:p.disabled?"not-allowed":"pointer",border:"none",opacity:p.disabled?0.4:1,fontFamily:"inherit",width:p.full?"100%":undefined},sz,vr,p.style||{})}>{p.label}</button>);
}
function Chip(p){var col=p.color||OR;return(<button onClick={p.onClick} style={{padding:"7px 16px",borderRadius:20,border:"1.5px solid "+(p.active?col:BORD),background:p.active?col+"22":"transparent",color:p.active?col:SUB,fontSize:13,fontWeight:p.active?600:400,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{p.label}</button>);}
function Card(p){return(<div onClick={p.onClick} style={Object.assign({background:SURF,borderRadius:16,border:"1px solid "+BORD,overflow:"hidden"},p.style||{})}>{p.children}</div>);}
function Stat(p){return(<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:p.color||OR,lineHeight:1}}>{p.value}</div><div style={{fontSize:11,color:MUT,marginTop:4}}>{p.label}</div></div>);}

function RunnerHero(p){
  var sz=p.size||160;
  return(<svg width={sz} height={sz} viewBox="0 0 160 160" fill="none"><circle cx="80" cy="80" r="76" fill={OR} fillOpacity="0.07"/><circle cx="80" cy="80" r="58" fill={OR} fillOpacity="0.05"/><path d="M80 24 L126 110 L34 110 Z" fill={OR} fillOpacity="0.9"/><path d="M80 24 L93 52 L80 46 L67 52 Z" fill="#fff" fillOpacity="0.18"/><path d="M34 110 L56 74 L78 110 Z" fill={OR} fillOpacity="0.4"/><path d="M14 126 Q80 114 146 126" stroke={OR} strokeWidth="4.5" strokeLinecap="round" fill="none"/></svg>);
}

// ── GPS / MAP ─────────────────────────────────────────────────────────────────
function parseGpx(text){
  var doc=new DOMParser().parseFromString(text,"application/xml");
  var pts=doc.querySelectorAll("trkpt,rtept,wpt");
  var track=[];
  pts.forEach(function(pt){
    var lat=parseFloat(pt.getAttribute("lat")),lon=parseFloat(pt.getAttribute("lon"));
    var t=pt.querySelector("time");
    if(!isNaN(lat)&&!isNaN(lon))track.push({lat:lat,lon:lon,ts:t?new Date(t.textContent).getTime():null});
  });
  return track;
}
function calcTrackKm(track){
  if(!track||track.length<2)return 0;
  var d=0;
  for(var i=1;i<track.length;i++){
    var R=6371,dLat=(track[i].lat-track[i-1].lat)*Math.PI/180,dLon=(track[i].lon-track[i-1].lon)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(track[i-1].lat*Math.PI/180)*Math.cos(track[i].lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    d+=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  return Math.round(d*100)/100;
}
function RunMap({track,height}){
  var ref=useRef(null);
  var mapInst=useRef(null);
  useEffect(function(){
    if(!track||track.length<2||!ref.current)return;
    if(mapInst.current){mapInst.current.remove();mapInst.current=null;}
    var map=L.map(ref.current,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,touchZoom:false,doubleClickZoom:false});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
    var coords=track.map(function(p){return[p.lat,p.lon];});
    L.polyline(coords,{color:OR,weight:4,opacity:0.9}).addTo(map);
    L.circleMarker(coords[0],{radius:6,fillColor:"#22c55e",fillOpacity:1,color:"#fff",weight:2}).addTo(map);
    L.circleMarker(coords[coords.length-1],{radius:6,fillColor:RE,fillOpacity:1,color:"#fff",weight:2}).addTo(map);
    map.fitBounds(L.polyline(coords).getBounds(),{padding:[16,16]});
    mapInst.current=map;
    return function(){if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[track]);
  return <div ref={ref} style={{height:height||200,borderRadius:12,overflow:"hidden",background:SURF2}}/>;
}
function GpsTrackerModal({onSave,onClose}){
  var [status,setStatus]=useState("idle");
  var [track,setTrack]=useState([]);
  var [elapsed,setElapsed]=useState(0);
  var [,setSpd]=useState(0);
  var watchId=useRef(null);
  var timerRef=useRef(null);
  var startTs=useRef(null);
  var elapsedBase=useRef(0);
  function startTracking(){
    setStatus("running");
    startTs.current=Date.now();
    watchId.current=navigator.geolocation.watchPosition(function(pos){
      setTrack(function(t){return t.concat([{lat:pos.coords.latitude,lon:pos.coords.longitude,ts:Date.now()}]);});
      setSpd(Math.round((pos.coords.speed||0)*3.6*10)/10);
    },function(){},{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    timerRef.current=setInterval(function(){setElapsed(elapsedBase.current+Math.floor((Date.now()-startTs.current)/1000));},1000);
  }
  function pauseTracking(){
    setStatus("paused");
    elapsedBase.current=elapsed;
    if(watchId.current!=null)navigator.geolocation.clearWatch(watchId.current);
    clearInterval(timerRef.current);
  }
  function stopTracking(){pauseTracking();setStatus("done");}
  useEffect(function(){return function(){if(watchId.current!=null)navigator.geolocation.clearWatch(watchId.current);clearInterval(timerRef.current);};},[]); // eslint-disable-line
  var km=calcTrackKm(track);
  var pace=km>0&&elapsed>0?fmtPaceSec(elapsed/km):"--:--";
  return(
    <div style={{position:"fixed",inset:0,background:BG,zIndex:300,display:"flex",flexDirection:"column",padding:"0 0 32px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid "+BORD}}>
        <button onClick={onClose} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,padding:"6px 14px",color:SUB,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
        <div style={{fontSize:14,fontWeight:600,color:TXT}}>Enregistrement GPS</div>
        <div style={{width:70}}/>
      </div>
      <div style={{flex:1,padding:"12px 16px 0"}}>
        {track.length>1
          ?<RunMap track={track} height={220}/>
          :<div style={{height:220,borderRadius:12,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><span style={{fontSize:40}}>📍</span><span style={{fontSize:12,color:SUB}}>En attente du GPS…</span></div>
        }
      </div>
      <div style={{display:"flex",justifyContent:"space-around",padding:"20px 24px"}}>
        {[{label:"Durée",val:fmtTime(elapsed),col:OR},{label:"Distance",val:km.toFixed(2)+" km",col:BL},{label:"Allure",val:pace+" /km",col:GR}].map(function(s,i){
          return <div key={i} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:10,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.label}</div></div>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:16,padding:"0 24px"}}>
        {status==="idle"&&<button onClick={startTracking} style={{width:80,height:80,borderRadius:"50%",background:GR,border:"none",cursor:"pointer",fontSize:28,boxShadow:"0 0 24px "+GR+"60",color:"#fff"}}>▶</button>}
        {status==="running"&&<>
          <button onClick={pauseTracking} style={{width:72,height:72,borderRadius:"50%",background:YE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏸</button>
          <button onClick={stopTracking} style={{width:72,height:72,borderRadius:"50%",background:RE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏹</button>
        </>}
        {status==="paused"&&<>
          <button onClick={startTracking} style={{width:72,height:72,borderRadius:"50%",background:GR,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>▶</button>
          <button onClick={stopTracking} style={{width:72,height:72,borderRadius:"50%",background:RE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏹</button>
        </>}
        {status==="done"&&<button onClick={function(){onSave({track:track,km:String(km.toFixed(2)),min:String(Math.round(elapsed/60))});}} style={{padding:"16px 40px",borderRadius:14,background:OR,border:"none",cursor:"pointer",fontSize:16,fontWeight:700,color:"#fff",fontFamily:"inherit"}}>Enregistrer</button>}
      </div>
    </div>
  );
}

function LogoBar(){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px 0"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{animation:"bounce 1.8s ease-in-out infinite",filter:"drop-shadow(0 0 12px "+OR+"60)"}}><RunnerHero size={56}/></div>
        <span style={{fontSize:30,fontWeight:800,color:TXT,letterSpacing:"-0.5px"}}>FuelRun</span>
      </div>
      <div style={{width:70,height:70,borderRadius:"50%",background:"radial-gradient(circle, "+OR+"40 0%, "+OR+"10 60%, transparent 100%)",boxShadow:"0 0 32px 12px "+OR+"30",animation:"pulse 2.4s ease-in-out infinite"}}/>
    </div>
  );
}


function HeroScreen(p){
  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 40px"}}>
      <style>{CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:16,paddingTop:40}}>
        <div style={{animation:"run 2.5s ease-in-out infinite"}}><RunnerHero size={160}/></div>
        <div style={{fontSize:38,fontWeight:800,color:TXT,letterSpacing:"-0.5px"}}>FuelRun</div>
        <div style={{fontSize:16,color:SUB,maxWidth:280,lineHeight:1.8}}>Entraînement · Nutrition · Performance</div>
        <div style={{padding:"12px 20px",background:OR+"12",borderRadius:12,border:"1px solid "+OR+"30",maxWidth:320}}>
          <div style={{fontSize:14,color:OR,fontWeight:600,fontStyle:"italic"}}>Pas besoin d'être rapide, l'important est de commencer !</div>
        </div>
        <div style={{marginTop:24,width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:10}}>
          <Btn label="Commencer" onClick={p.onCommencer} size="lg" full/>
          <Btn label="J'ai déjà un compte" onClick={p.onLogin} variant="ghost" size="md" full/>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:11,color:MUT}}>En continuant, vous acceptez les conditions d'utilisation.</div>
    </div>
  );
}



function AuthScreen(){
  var [isLogin,setIsLogin]=useState(false);
  var [email,setEmail]=useState("");
  var [password,setPassword]=useState("");
  var [error,setError]=useState("");
  var [loading,setLoading]=useState(false);

  function handleEmail(){
    if(!email.trim()||!password.trim()){setError("Remplis tous les champs.");return;}
    setLoading(true);setError("");
    var fn=isLogin?signInWithEmailAndPassword:createUserWithEmailAndPassword;
    fn(auth,email,password).catch(function(e){
      var msg=e.code==="auth/email-already-in-use"?"Email déjà utilisé.":e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Mot de passe incorrect.":e.code==="auth/user-not-found"?"Compte introuvable.":e.code==="auth/weak-password"?"Mot de passe trop court (6 car. min).":"Erreur : "+e.message;
      setError(msg);setLoading(false);
    });
  }

  function handleGoogle(){
    setLoading(true);setError("");
    signInWithPopup(auth,googleProvider).catch(function(e){setError(e.message);setLoading(false);});
  }

  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 40px"}}>
      <style>{CSS}</style>
      <LogoBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",paddingTop:32}}>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:6}}>{isLogin?"Bon retour !":"Créer un compte"}</div>
        <div style={{fontSize:14,color:SUB,marginBottom:28}}>{isLogin?"Retrouve ton plan et tes stats.":"Gratuit · Sans carte bancaire"}</div>

        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 40 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.2C37.3 38.8 44 33.8 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
          Continuer avec Google
        </button>

        <button onClick={function(){alert("Connexion Apple bientôt disponible.");}} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:"#fff",border:"1px solid #ddd",color:"#000",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 814 1000"><path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-142.7-108.4c-33.7-55.7-52.3-117-52.3-175.2 0-201.3 130-307.1 257.7-307.1 69.1 0 126.4 45.3 170.1 45.3 42.1 0 108.2-47.2 183.1-47.2zm-126.7-153.2c34.4-39.7 60.3-95.2 60.3-150.6 0-7.8-.6-15.6-2-22.3-57.1 2.2-124.2 38.2-164.8 81.2-31.1 33.1-60.1 88.3-60.1 144.5 0 8.5 1.3 17 1.9 19.8 3.3.5 8.6 1.3 14 1.3 51.5.1 116.3-34.9 150.7-74z"/></svg>
          Continuer avec Apple
        </button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:BORD}}/><span style={{fontSize:12,color:MUT}}>ou</span><div style={{flex:1,height:1,background:BORD}}/>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>E-mail</label>
          <input value={email} onChange={function(e){setEmail(e.target.value);setError("");}} placeholder="votre@email.com" type="email" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        </div>
        <div style={{marginBottom:error?12:24}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Mot de passe</label>
          <input value={password} onChange={function(e){setPassword(e.target.value);setError("");}} onKeyDown={function(e){if(e.key==="Enter")handleEmail();}} placeholder="••••••••" type="password" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        </div>
        {error?<div style={{fontSize:13,color:RE,marginBottom:16,padding:"10px 14px",borderRadius:10,background:RE+"10",border:"1px solid "+RE+"30"}}>{error}</div>:null}

        <Btn label={loading?"Chargement…":isLogin?"Se connecter":"Créer mon compte"} onClick={handleEmail} size="lg" full/>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:SUB}}>
          {isLogin?"Pas encore de compte ? ":"Déjà un compte ? "}
          <span onClick={function(){setIsLogin(!isLogin);setError("");}} style={{color:OR,fontWeight:600,cursor:"pointer"}}>{isLogin?"S'inscrire":"Se connecter"}</span>
        </div>
      </div>
    </div>
  );
}

function PricingScreen(p){
  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 40px",overflowY:"auto"}}>
      <style>{CSS}</style>
      <LogoBar/>
      <div style={{paddingTop:28,marginBottom:20}}>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:6}}>Choisir ma formule</div>
        <div style={{fontSize:14,color:SUB}}>Sans engagement · Résiliable à tout moment</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {PLANS.map(function(pl,i){
          return(
            <div key={i} onClick={p.onStart} style={{position:"relative",background:i===2?OR+"10":SURF2,border:"1.5px solid "+(i===2?OR:BORD),borderRadius:16,padding:"16px 18px",cursor:"pointer"}}>
              {pl.tag?<div style={{position:"absolute",top:-10,right:16,background:pl.color,color:"#fff",fontSize:10,fontWeight:700,borderRadius:6,padding:"2px 10px"}}>{pl.tag}</div>:null}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:17,fontWeight:800,color:i===2?OR:TXT}}>{pl.name}</div>
                <div><span style={{fontSize:22,fontWeight:800,color:pl.color}}>{pl.price==="0"?"Gratuit":pl.price+"€"}</span>{pl.price!=="0"&&<span style={{fontSize:11,color:MUT,marginLeft:3}}>{pl.per}</span>}</div>
              </div>
              <div style={{fontSize:12,color:SUB,marginBottom:10}}>{pl.desc}</div>
              <div style={{height:1,background:BORD,marginBottom:10}}/>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {pl.items.map(function(it,j){
                  var isHeader=it.endsWith(":");
                  return(<div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                    {isHeader
                      ?<span style={{fontSize:11,fontWeight:700,color:pl.color,textTransform:"uppercase",letterSpacing:0.5}}>{it}</span>
                      :<><div style={{width:16,height:16,borderRadius:"50%",background:pl.color+"22",border:"1px solid "+pl.color+"44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:5,height:5,borderRadius:"50%",background:pl.color}}/></div><span style={{fontSize:13,color:i===0?SUB:TXT}}>{it}</span></>
                    }
                  </div>);
                })}
              </div>
              <div style={{background:i===2?OR:SURF2,borderRadius:10,padding:"10px",textAlign:"center",border:i!==2?"1px solid "+BORD:"none"}}>
                <span style={{fontSize:13,fontWeight:600,color:i===2?"#fff":SUB}}>{pl.cta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Splash(){
  var [step,setStep]=useState(0);
  if(step===0)return <HeroScreen onCommencer={function(){setStep(1);}} onLogin={function(){setStep(2);}}/>;
  if(step===1)return <PricingScreen onStart={function(){setStep(2);}}/>;
  return <AuthScreen/>;
}

function Onboarding(p){
  var [step,setStep]=useState(0);
  var [name,setName]=useState("");var [age,setAge]=useState("");var [weight,setWeight]=useState("");var [height,setHeight]=useState("");var [sex,setSex]=useState("M");
  var [level,setLevel]=useState("");var [sessWeek,setSessWeek]=useState(3);var [kmWeek,setKmWeek]=useState(25);
  var [selected,setSelected]=useState(null);var [tab,setTab]=useState("route");var [search,setSearch]=useState("");
  var [custom,setCustom]=useState([]);var [showCustom,setShowCustom]=useState(false);
  var [cn,setCn]=useState("");var [cd,setCd]=useState("");var [cdt,setCdt]=useState("");var [ct,setCt]=useState("route");

  function confirmCustom(){
    if(!cn||!cd||!cdt)return;
    var r={id:Date.now(),name:cn,dist:parseFloat(cd),type:ct,date:cdt,city:"Personnalisé",custom:true};
    setCustom(function(prev){return prev.concat([r]);});
    setSelected(r);setShowCustom(false);setCn("");setCd("");setCdt("");
  }
  var canNext=step===0?!!name.trim():step===1?!!level:true;
  var allRaces=RACES.concat(custom);
  var filtered=allRaces.filter(function(r){
    if(r.type!==tab)return false;
    if(!search)return true;
    var q=search.toLowerCase();
    return r.name.toLowerCase().includes(q)||r.city.toLowerCase().includes(q);
  });

  function renderStep(){
    if(step===0){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Faisons connaissance</div>
        <div style={{fontSize:15,color:SUB,marginBottom:24}}>Quelques infos pour personnaliser ton plan.</div>
        <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Prénom" style={{width:"100%",background:SURF2,border:"1.5px solid "+(name?OR:BORD),borderRadius:12,padding:"14px 16px",color:TXT,fontSize:16,outline:"none",fontFamily:"inherit",marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Âge</label><input value={age} onChange={function(e){setAge(e.target.value);}} type="number" placeholder="30" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Poids (kg)</label><input value={weight} onChange={function(e){setWeight(e.target.value);}} type="number" placeholder="70" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Taille (cm)</label><input value={height} onChange={function(e){setHeight(e.target.value);}} type="number" placeholder="175" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Sexe</label>
            <div style={{display:"flex",gap:8,height:46}}>
              <button onClick={function(){setSex("M");}} style={{flex:1,borderRadius:12,border:"1.5px solid "+(sex==="M"?OR:BORD),background:sex==="M"?OR+"22":"transparent",color:sex==="M"?OR:SUB,fontWeight:sex==="M"?600:400,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Homme</button>
              <button onClick={function(){setSex("F");}} style={{flex:1,borderRadius:12,border:"1.5px solid "+(sex==="F"?OR:BORD),background:sex==="F"?OR+"22":"transparent",color:sex==="F"?OR:SUB,fontWeight:sex==="F"?600:400,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Femme</button>
            </div>
          </div>
        </div>
      </div>
    );}
    if(step===1){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ton niveau ?</div>
        <div style={{fontSize:15,color:SUB,marginBottom:24}}>Sois honnête, c'est juste pour ton plan.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {LEVELS.map(function(l){var on=level===l.id;return(
            <div key={l.id} onClick={function(){setLevel(l.id);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"15":SURF,cursor:"pointer"}}>
              <span style={{fontSize:24}}>{l.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:on?OR:TXT}}>{l.label}</div><div style={{fontSize:12,color:MUT,marginTop:2}}>{l.sub}</div></div>
              <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(on?OR:BORD),background:on?OR:"transparent"}}/>
            </div>
          );})}
        </div>
      </div>
    );}
    if(step===2){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ta disponibilité</div>
        <div style={{fontSize:15,color:SUB,marginBottom:32}}>Le plan s'adapte à ton emploi du temps.</div>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <span style={{fontSize:15,color:TXT,fontWeight:500}}>Séances par semaine</span>
            <span style={{fontSize:26,fontWeight:700,color:OR}}>{sessWeek}</span>
          </div>
          <input type="range" min={2} max={7} value={sessWeek} onChange={function(e){setSessWeek(parseInt(e.target.value));}} style={{width:"100%",accentColor:OR,background:MUT}}/>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <span style={{fontSize:15,color:TXT,fontWeight:500}}>Kilomètres actuels / semaine</span>
            <span style={{fontSize:26,fontWeight:700,color:BL}}>{kmWeek} km</span>
          </div>
          <input type="range" min={5} max={100} step={5} value={kmWeek} onChange={function(e){setKmWeek(parseInt(e.target.value));}} style={{width:"100%",accentColor:BL,background:MUT}}/>
        </div>
      </div>
    );}
    return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ton objectif</div>
        <div style={{fontSize:15,color:SUB,marginBottom:16}}>Choisis une course ou ajoutes-en une.</div>
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher..." style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <Chip label="Route" active={tab==="route"} onClick={function(){setTab("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTab("trail");}}/>
          <Chip label="+ La mienne" active={false} color={BL} onClick={function(){setShowCustom(true);}}/>
        </div>
        {showCustom?(<Card style={{padding:16,marginBottom:14}}>
          <input value={cn} onChange={function(e){setCn(e.target.value);}} placeholder="Nom de la course" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",marginBottom:8,fontFamily:"inherit"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <input value={cd} onChange={function(e){setCd(e.target.value);}} type="number" placeholder="Distance km" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <input value={cdt} onChange={function(e){setCdt(e.target.value);}} type="date" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",colorScheme:"dark",fontFamily:"inherit"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Chip label="Route" active={ct==="route"} onClick={function(){setCt("route");}}/>
            <Chip label="Trail" active={ct==="trail"} color={GR} onClick={function(){setCt("trail");}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn label="Ajouter" onClick={confirmCustom} size="sm" disabled={!cn||!cd||!cdt} style={{flex:1}}/>
            <Btn label="Annuler" onClick={function(){setShowCustom(false);}} variant="ghost" size="sm" style={{flex:1}}/>
          </div>
        </Card>):null}
        <div style={{maxHeight:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(function(r){
            var on=selected&&selected.id===r.id;var col=r.type==="trail"?GR:BL;
            return(
              <div key={r.id} onClick={function(){setSelected(on?null:r);}} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"12":SURF,cursor:"pointer"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:on?OR:TXT}}>{r.name}{r.star?" ⭐":""}</div>
                  <div style={{display:"flex",gap:8,marginTop:3}}>
                    <span style={{fontSize:12,color:MUT}}>{r.city}</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,fontWeight:600,color:col+"cc"}}>{r.dist} km</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,color:MUT}}>{weeksUntil(r.date)} sem.</span>
                  </div>
                </div>
                {on?<div style={{color:OR,fontSize:16,fontWeight:700}}>✓</div>:null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      <LogoBar/>
      <div style={{padding:"12px 24px 0"}}>
        <div style={{display:"flex",gap:4,marginBottom:4}}>{[0,1,2,3].map(function(i){return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?OR:SURF2}}/>;}) }</div>
        <div style={{fontSize:12,color:MUT,marginTop:6,textAlign:"right"}}>{step+1} / 4</div>
      </div>
      <div style={{flex:1,padding:"32px 24px 100px",overflowY:"auto"}}>{renderStep()}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"16px 24px 28px",background:"linear-gradient(to top,"+BG+" 70%,transparent)",display:"flex",gap:10}}>
        {step>0?<Btn label="Retour" onClick={function(){setStep(function(s){return s-1;});}} variant="ghost" style={{flex:1}}/>:null}
        <Btn label={step===3?"Lancer FuelRun":"Continuer"} onClick={function(){if(step===3)p.onDone({name:name,age:age,weight:weight,height:height,sex:sex,level:level,sessWeek:sessWeek,kmWeek:kmWeek,race:selected});else setStep(function(s){return s+1;});}} disabled={!canNext} style={{flex:2}}/>
      </div>
    </div>
  );
}

var WB_QS=[
  {id:"sleep",     label:"Sommeil cette nuit", emoji:"😴",opts:[{l:"Moins de 5 h",v:1},{l:"5–6 h",v:2},{l:"7–8 h",v:3},{l:"Plus de 8 h",v:4}]},
  {id:"stress",    label:"Niveau de stress",   emoji:"🧠",opts:[{l:"Très élevé",v:1}, {l:"Élevé",v:2},  {l:"Normal",v:3},{l:"Relax",v:4}]},
  {id:"legs",      label:"Tes jambes",          emoji:"🦵",opts:[{l:"Très lourdes",v:1},{l:"Fatiguées",v:2},{l:"Normales",v:3},{l:"Légères",v:4}]},
  {id:"motivation",label:"Motivation",          emoji:"🔥",opts:[{l:"Zéro",v:1},      {l:"Bof",v:2},    {l:"Bonne",v:3}, {l:"À fond",v:4}]}
];
function CheckinModal(p){
  var [step,setStep]=useState(0);var [answers,setAnswers]=useState({});
  var q=WB_QS[step];
  function answer(v){var na=Object.assign({},answers,{[q.id]:v});setAnswers(na);if(step<WB_QS.length-1)setStep(function(s){return s+1;});else p.onDone(na);}
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 24px 36px",animation:"slideUp .3s ease"}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 24px"}}/>
        <div style={{display:"flex",gap:4,marginBottom:24}}>{WB_QS.map(function(_,i){return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?OR:SURF2}}/>;}) }</div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:10}}>{q.emoji}</div>
          <div style={{fontSize:20,fontWeight:700,color:TXT}}>{q.label}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {q.opts.map(function(o,i){return <button key={i} onClick={function(){answer(o.v);}} style={{padding:"14px 10px",borderRadius:12,border:"1px solid "+BORD,background:SURF2,color:TXT,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{o.l}</button>;})}
        </div>
      </div>
    </div>
  );
}

function AnimCount(p){
  var [disp,setDisp]=useState(0);
  useEffect(function(){var frame,start=null,to=parseFloat(p.value)||0;if(to===0)return;function step(ts){if(!start)start=ts;var pct=Math.min((ts-start)/600,1);setDisp(Math.round(to*pct));if(pct<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);return function(){cancelAnimationFrame(frame);};},[p.value]);
  return <span style={{color:p.color||TXT}}>{disp}</span>;
}

function NutritionMiniCard(p){
  var n=calcNutrition(p.profile,p.sessType);
  var labels={easy:"Endurance",long:"Sortie longue",interval:"Fractionné",tempo:"Seuil",recovery:"Récupération",race:"Jour de course"};
  return(
    <Card style={{marginBottom:14}}>
      <div style={{padding:"16px 18px",borderBottom:"1px solid "+BORD}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:14,fontWeight:600,color:TXT}}>Nutrition du jour</div><div style={{fontSize:12,color:SUB,marginTop:2}}>Pour une séance {labels[p.sessType]||"normale"}</div></div>
          <div style={{fontSize:22,fontWeight:800,color:OR}}>{n.kcal}<span style={{fontSize:11,fontWeight:500,marginLeft:2}}>kcal</span></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          {[{label:"Glucides",value:n.carbs+"g",color:BL},{label:"Protéines",value:n.prot+"g",color:GR},{label:"Lipides",value:n.fat+"g",color:YE}].map(function(m,i){
            return <div key={i} style={{flex:1,background:SURF2,borderRadius:10,padding:"8px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.value}</div><div style={{fontSize:9,color:MUT,marginTop:3}}>{m.label}</div></div>;
          })}
        </div>
      </div>
      {n.meals.map(function(m,i){return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:i<n.meals.length-1?"1px solid "+BORD:"none"}}><div style={{fontSize:10,fontWeight:600,color:MUT,width:72,flexShrink:0}}>{m.time}</div><div style={{flex:1,fontSize:13,color:TXT}}>{m.food}</div><div style={{fontSize:12,fontWeight:600,color:OR,flexShrink:0}}>{m.kcal} kcal</div></div>);})}
    </Card>
  );
}

function HomeScreen(p){
  var [weather,setWeather]=useState(null);
  useEffect(function(){
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(function(pos){
      var la=pos.coords.latitude.toFixed(4),lo=pos.coords.longitude.toFixed(4);
      fetch("https://api.open-meteo.com/v1/forecast?latitude="+la+"&longitude="+lo+"&current=temperature_2m,weathercode,windspeed_10m")
        .then(function(r){return r.json();})
        .then(function(d){if(d&&d.current)setWeather(d.current);})
        .catch(function(){});
    },function(){},{timeout:5000,maximumAge:300000});
  },[]);
  var plan=p.race?buildPlan(p.race,p.profile):null;
  var planWeeks=getPlanWeeks(plan);
  var raceWeeks=p.race?weeksUntil(p.race.date):null;
  var raceCol=p.race&&p.race.type==="trail"?GR:BL;
  var hour=new Date().getHours();
  var greeting=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";
  var curWeek=null;
  for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){curWeek=planWeeks[ci];break;}}
  if(!curWeek){for(var ci2=0;ci2<planWeeks.length;ci2++){if(!planWeeks[ci2].isPast){curWeek=planWeeks[ci2];break;}}}
  var nextSess=curWeek&&curWeek.sessions&&curWeek.sessions.length>0?curWeek.sessions[0]:null;
  var sessType=nextSess?nextSess.type:"easy";
  var sessCol=TYPE_COLORS[sessType]||OR;
  var wba=null;
  if(p.wellbeing){var tot=0;var vals=Object.values(p.wellbeing);for(var vi=0;vi<vals.length;vi++)tot+=vals[vi];var wpct=tot/(4*4);if(wpct<=0.4)wba={text:"Repos aujourd'hui",sub:"Ton corps a besoin de récupérer.",icon:"🛌",color:RE,bg:RE+"12"};else if(wpct<=0.6)wba={text:"Séance légère conseillée",sub:"Ne force pas trop.",icon:"🚶",color:YE,bg:YE+"12"};else if(wpct<=0.8)wba={text:"Séance normale",sub:"Tu es en bonne forme.",icon:"✅",color:BL,bg:BL+"12"};else wba={text:"Super forme !",sub:"Profites-en, donne tout.",icon:"🚀",color:GR,bg:GR+"12"};}
  var quoteIdx=Math.floor(Date.now()/(30*60*1000))%QUOTES.length;
  var quote=QUOTES[quoteIdx];
  var raceProgress=p.race&&planWeeks.length>0?Math.max(2,Math.min(100,Math.round((1-raceWeeks/planWeeks.length)*100))):0;
  return(
    <div style={{paddingBottom:8}}>
      <LogoBar/>
      {/* ── HEADER ── */}
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(150deg,#1c0f00 0%,#110900 45%,"+BG+" 100%)",padding:"16px 20px 0px"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:OR,opacity:0.05,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:BL,opacity:0.04,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <div style={{fontSize:12,color:OR,fontWeight:600,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>{greeting}</div>
            <div style={{fontSize:30,fontWeight:800,color:TXT,letterSpacing:"-0.5px",lineHeight:1}}>{p.profile.name||"Champion"}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,padding:"5px 12px",borderRadius:20,background:OR+"18",border:"1px solid "+OR+"35"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:OR}}/>
              <span style={{fontSize:11,color:OR,fontWeight:600}}>{LEVEL_LABELS[p.profile.level]||""}</span>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          {[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km),color:BL},{label:"Streak",value:p.stats.streak,color:YE}].map(function(st,i){
            return(<div key={i} style={{background:"rgba(255,255,255,0.045)",backdropFilter:"blur(8px)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:24,fontWeight:800,lineHeight:1}}><AnimCount value={st.value} color={st.color}/></div>
              <div style={{fontSize:9,color:MUT,marginTop:5,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5}}>{st.label}</div>
            </div>);
          })}
        </div>
        {p.stats.sessions>0&&(
          <button onClick={function(){
            var txt="J'ai parcouru "+Math.round(p.stats.km)+" km en "+p.stats.sessions+" séance"+(p.stats.sessions>1?"s":"")+" avec FuelRun !"+(p.race?" Je prépare "+p.race.name+" !":"")+" Rejoins-moi sur l'app.";
            if(navigator.share){navigator.share({title:"FuelRun",text:txt,url:window.location.href});}
            else{navigator.clipboard&&navigator.clipboard.writeText(txt);}
          }} style={{width:"100%",marginBottom:10,padding:"10px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:TXT,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.3}}>
            Partager mes stats
          </button>
        )}
        <div style={{padding:"14px 16px",borderRadius:14,background:"rgba(138,100,255,0.15)",border:"1px solid rgba(138,100,255,0.30)",textAlign:"center"}}>
          <div style={{fontSize:13,color:"#fff",lineHeight:1.7,fontStyle:"italic",fontWeight:500}}>"{quote.text}"</div>
          <div style={{fontSize:11,color:PU,fontWeight:700,marginTop:8,letterSpacing:0.3}}>{'\u2014'} {quote.author} {'\u2014'}</div>
        </div>
      </div>

      <div style={{padding:"14px 16px 0"}}>

        {/* ── SÉANCE + OBJECTIF COURSE ── */}
        <div style={{borderRadius:18,background:SURF,border:"1px solid "+BORD,marginBottom:14,overflow:"hidden"}}>
          {nextSess?(
            <div style={{padding:"12px 16px",background:"linear-gradient(135deg,"+sessCol+"16,"+sessCol+"04)",borderBottom:"1px solid "+sessCol+"20"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:sessCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2}}>Prochaine séance</div>
                <div style={{padding:"3px 10px",borderRadius:20,background:sessCol+"18",border:"1px solid "+sessCol+"35"}}>
                  <span style={{fontSize:10,color:sessCol,fontWeight:600}}>{nextSess.dayLabel}{nextSess.date?" · "+nextSess.date.getDate()+"/"+(nextSess.date.getMonth()+1):""}</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:46,height:46,borderRadius:12,background:sessCol+"22",border:"1px solid "+sessCol+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {sessType==="long"?"🏔":sessType==="interval"?"⚡":sessType==="tempo"?"🎯":sessType==="recovery"?"🌿":sessType==="race"?"🏁":"🏃"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:TXT,marginBottom:3}}>{nextSess.label}</div>
                  <div style={{display:"flex",gap:10}}>
                    {nextSess.type!=="race"?<span style={{fontSize:12,color:SUB}}>{nextSess.km} km</span>:null}
                    {nextSess.pace?<span style={{fontSize:12,color:SUB}}>· {nextSess.pace}/km</span>:null}
                  </div>
                </div>
                {nextSess.pace?<div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:18,fontWeight:800,color:sessCol}}>{durStr(nextSess.pace,nextSess.km)}</div><div style={{fontSize:9,color:MUT,marginTop:1}}>durée est.</div></div>:null}
              </div>
              {(function(){var n=calcNutrition(p.profile,sessType);return(<div style={{display:"flex",gap:6,marginTop:12}}>{[{l:"Kcal",v:n.kcal,c:OR},{l:"Glucides",v:n.carbs+"g",c:BL},{l:"Protéines",v:n.prot+"g",c:GR},{l:"Lipides",v:n.fat+"g",c:YE}].map(function(m,i){return(<div key={i} style={{flex:1,background:"rgba(0,0,0,0.15)",borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:m.c}}>{m.v}</div><div style={{fontSize:8,color:MUT,marginTop:2}}>{m.l}</div></div>);})}</div>);})()}
            </div>
          ):(
            <div style={{padding:"14px 18px",borderBottom:"1px solid "+BORD,display:"flex",alignItems:"center",gap:12}}>
              <div><div style={{fontSize:13,fontWeight:600,color:TXT}}>Pas de séance aujourd'hui</div><div style={{fontSize:11,color:SUB}}>Profite pour récupérer</div></div>
            </div>
          )}
          {(p.race&&planWeeks.length>0)?(
            <div style={{padding:"14px 18px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontSize:10,color:raceCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Objectif</div>
                  <div style={{fontSize:14,fontWeight:700,color:TXT,lineHeight:1.2}}>{p.race.name}</div>
                  <div style={{fontSize:11,color:SUB,marginTop:2}}>{p.race.city} · 🏁 {fmtS(new Date(p.race.date))}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <div style={{fontSize:24,fontWeight:800,color:raceCol,lineHeight:1}}>{p.race.dist}<span style={{fontSize:11,fontWeight:500,color:MUT,marginLeft:2}}>km</span></div>
                  <div style={{fontSize:9,color:MUT,textTransform:"uppercase",letterSpacing:0.5}}>{p.race.type==="trail"?"Trail":"Route"}</div>
                </div>
              </div>
              <div style={{height:5,background:raceCol+"18",borderRadius:6,overflow:"hidden",marginBottom:5}}>
                <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+raceCol+"99,"+raceCol+")",borderRadius:6}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:10,color:MUT}}>Sem. 1</span>
                <span style={{fontSize:10,color:raceCol,fontWeight:600}}>{raceProgress}% · dans {raceWeeks} sem.</span>
                <span style={{fontSize:10,color:MUT}}>Sem. {planWeeks.length}</span>
              </div>
            </div>
          ):(
            <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
              <div><div style={{fontSize:13,fontWeight:600,color:TXT}}>Pas encore d'objectif</div><div style={{fontSize:11,color:SUB}}>Ajoute une course pour générer ton plan</div></div>
            </div>
          )}
        </div>

        {/* ── WELLBEING + HABITUDES ── */}
        <div style={{borderRadius:18,background:SURF,border:"1px solid "+BORD,marginBottom:14,overflow:"hidden"}}>
          {p.wellbeing?(
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:wba.bg,borderBottom:"1px solid "+wba.color+"20"}}>
              <div style={{width:44,height:44,borderRadius:12,background:wba.color+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{wba.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:wba.color}}>{wba.text}</div>
                <div style={{fontSize:12,color:SUB,marginTop:2}}>{wba.sub}</div>
              </div>
            </div>
          ):(
            <div onClick={p.onCheckin} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderBottom:"1px solid "+BORD,cursor:"pointer"}}>
              <div style={{width:44,height:44,borderRadius:12,background:PU+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌡️</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:TXT}}>Comment tu te sens ?</div>
                <div style={{fontSize:12,color:SUB,marginTop:2}}>Check-in rapide · 30 sec</div>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:PU+"18",display:"flex",alignItems:"center",justifyContent:"center",color:PU,fontSize:16,flexShrink:0}}>›</div>
            </div>
          )}
        </div>

        {weather&&(function(){
          var adv=weatherAdvice(weather.weathercode||0,weather.temperature_2m||15,weather.windspeed_10m||0);
          return(
            <div style={{borderRadius:14,background:SURF,border:"1px solid "+BORD,padding:"14px 16px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:34,lineHeight:1,flexShrink:0}}>{adv.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:adv.color,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Météo · Conseil séance</div>
                  <div style={{fontSize:13,fontWeight:600,color:TXT,marginBottom:4}}>{adv.desc} · {Math.round(weather.temperature_2m||0)}°C{weather.windspeed_10m>10?" · "+Math.round(weather.windspeed_10m)+" km/h":""}</div>
                  <div style={{fontSize:12,color:SUB,lineHeight:1.5}}>{adv.tip}</div>
                </div>
              </div>
            </div>
          );
        })()}
        {(p.race&&curWeek)?<NutritionMiniCard profile={p.profile} sessType={sessType}/>:null}

      </div>
    </div>
  );
}

var TIPS=[
  {icon:"🏃",title:"Maintiens ton volume habituel",   desc:"Continue à courir à ton rythme actuel sans augmenter la charge."},
  {icon:"😴",title:"Privilégie la récupération",      desc:"Dors bien, évite les efforts intenses dans les 3 jours avant la course."},
  {icon:"🥗",title:"Charge en glucides J−2/J−1",     desc:"Pâtes, riz, pain complet — fais le plein d'énergie avant le départ."},
  {icon:"💧",title:"Hydratation ++",                   desc:"Bois régulièrement les jours précédant la course."},
  {icon:"👟",title:"Pas de nouveautés",               desc:"N'essaie pas de nouvelles chaussures ou tenues le jour J."}
];

function RecipeRow(p){
  var r=p.row;
  var [open,setOpen]=useState(false);
  return(
    <div style={{borderTop:"1px solid "+BORD}}>
      <div onClick={r.ingredients?function(){setOpen(!open);}:undefined} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:r.ingredients?"pointer":"default"}}>
        <div style={{fontSize:11,fontWeight:700,color:OR,width:68,flexShrink:0}}>{r.slot}</div>
        <div style={{flex:1,fontSize:12,fontWeight:500,color:TXT}}>{r.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{fontSize:11,color:MUT}}>{r.kcal} kcal</span>
          {r.ingredients?<div style={{width:20,height:20,borderRadius:6,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:SUB,transform:open?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▼</div>:null}
        </div>
      </div>
      {open&&r.ingredients&&(
        <div style={{padding:"0 14px 10px",borderTop:"1px solid "+BORD}}>
          <div style={{fontSize:10,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,marginTop:8}}>Ingrédients</div>
          {r.ingredients.map(function(ing,i){return(<div key={i} style={{display:"flex",gap:6,paddingBottom:3}}><div style={{width:4,height:4,borderRadius:"50%",background:OR,flexShrink:0,marginTop:5}}/><span style={{fontSize:12,color:TXT}}>{ing}</span></div>);})}
          {r.steps&&<div style={{fontSize:10,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,marginTop:8}}>Préparation</div>}
          {r.steps&&r.steps.map(function(st,i){return(<div key={i} style={{display:"flex",gap:8,marginBottom:4}}><div style={{width:16,height:16,borderRadius:"50%",background:OR+"22",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:OR,flexShrink:0}}>{i+1}</div><span style={{fontSize:12,color:SUB,lineHeight:1.5}}>{st}</span></div>);})}
        </div>
      )}
    </div>
  );
}

function SessionCard(p){
  var s=p.session;
  var [open,setOpen]=useState(p.isNext||false);
  var [nutOpen,setNutOpen]=useState(false);
  var doneKey="fr_done_"+s.date;
  var [done,setDoneRaw]=useState(function(){return ls(doneKey,false);});
  function toggleDone(e){e.stopPropagation();var v=!done;setDoneRaw(v);lsSet(doneKey,v);}
  var sc=TYPE_COLORS[s.type]||OR;
  var n=calcNutrition(p.profile,s.type);
  var recipes=RECIPES[s.type]||[];
  var isPast=s.date&&s.date<new Date(new Date().setHours(0,0,0,0));
  return(
    <Card style={{marginBottom:10,border:done?"1.5px solid "+GR:p.isNext?"1.5px solid "+sc:"1px solid "+BORD,opacity:(isPast&&!done)?0.5:1}}>
      {p.isNext&&(
        <div style={{background:"linear-gradient(90deg,"+sc+"cc,"+sc+"88)",padding:"5px 14px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10}}>⚡</span>
          <span style={{fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:0.8}}>Prochaine séance</span>
        </div>
      )}
      <div style={{padding:"14px 16px"}}>
        {/* ── EN-TÊTE ── */}
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
          <div style={{width:44,height:44,borderRadius:11,background:sc+(p.isNext?"44":"20"),border:"1px solid "+sc+"44",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <div style={{fontSize:9,color:sc,fontWeight:700}}>{s.dayLabel}</div>
            <div style={{fontSize:9,color:sc}}>{s.date?s.date.getDate()+"/"+(s.date.getMonth()+1):""}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:p.isNext?700:600,color:p.isNext?sc:TXT,marginBottom:3}}>{s.label}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {s.type!=="race"?<span style={{fontSize:12,color:SUB}}>{s.km} km</span>:null}
              {s.pace?<span style={{fontSize:12,color:SUB}}>· {s.pace}/km</span>:null}
              {(s.type!=="race"&&s.pace)?<span style={{fontSize:12,color:sc,fontWeight:600}}>· {durStr(s.pace,s.km)}</span>:null}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <button onClick={toggleDone} style={{width:28,height:28,borderRadius:8,background:done?GR+"22":SURF2,border:"1px solid "+(done?GR:BORD),display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:done?GR:MUT}}>{done?"✓":"○"}</button>
            <div style={{width:24,height:24,borderRadius:8,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:SUB,transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
          </div>
        </div>

        {open&&(
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+BORD}}>

            {/* ── CONTENU DE LA SÉANCE ── */}
            {s.desc&&(
              <div style={{background:sc+"10",border:"1px solid "+sc+"25",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,color:sc,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Consignes</div>
                <div style={{fontSize:13,color:TXT,lineHeight:1.7}}>{s.desc}</div>
              </div>
            )}

            {/* ── NUTRITION + REPAS + RECETTES (accordéon) ── */}
            {(function(){
              var rows=recipes.length>0?recipes:n.meals.map(function(m){return{slot:m.time,name:m.food,kcal:m.kcal};});
              var totalKcal=rows.reduce(function(s,r){return s+(r.kcal||0);},0);
              return(
            <div style={{borderRadius:12,border:"1px solid "+BORD,overflow:"hidden"}}>
              <div onClick={function(){setNutOpen(!nutOpen);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:SURF2,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13}}>🥗</span>
                  <span style={{fontSize:12,fontWeight:600,color:TXT}}>Nutrition · Repas · Recettes</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:OR}}>{totalKcal} kcal</span>
                  <div style={{width:22,height:22,borderRadius:7,background:BG,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:SUB,transform:nutOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▼</div>
                </div>
              </div>
              {nutOpen&&(
                <div>
                  <div style={{display:"flex",gap:6,padding:"10px 12px",borderTop:"1px solid "+BORD}}>
                    {[{label:"Glucides",value:n.carbs+"g",color:BL},{label:"Protéines",value:n.prot+"g",color:GR},{label:"Lipides",value:n.fat+"g",color:YE}].map(function(m,i){
                      return <div key={i} style={{flex:1,background:SURF2,borderRadius:8,padding:"7px 4px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div><div style={{fontSize:9,color:MUT,marginTop:2}}>{m.label}</div></div>;
                    })}
                  </div>
                  {(recipes.length>0?recipes.map(function(r){return{slot:r.slot,name:r.name,kcal:r.kcal,ingredients:r.ingredients,steps:r.steps};}) : n.meals.map(function(m){return{slot:m.time,name:m.food,kcal:m.kcal,ingredients:null,steps:null};})).map(function(row,ri){
                    return <RecipeRow key={ri} row={row}/>;
                  })}
                </div>
              )}
            </div>
              );})()}

          </div>
        )}
      </div>
    </Card>
  );
}

function RaceStrategyModal(p){
  var [goalH,setGoalH]=useState(""); var [goalM,setGoalM]=useState(""); var [goalS,setGoalS]=useState("00");
  var [strategy,setStrategy]=useState("even");
  var [splits,setSplits]=useState(null);
  var dist=p.race?p.race.dist:42;
  function calc(){
    var h=parseInt(goalH)||0,m=parseInt(goalM)||0,s=parseInt(goalS)||0;
    var total=h*3600+m*60+s;
    if(total<60)return;
    setSplits(calcSplits(dist,total,strategy));
  }
  var unit=dist<=21?1:dist<=50?5:10;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 20px 36px",animation:"slideUp .3s ease",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 20px"}}/>
        <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:4}}>Stratégie de course</div>
        <div style={{fontSize:13,color:SUB,marginBottom:20}}>{p.race&&p.race.name} · {dist} km</div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:8}}>Temps objectif</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalH} onChange={function(e){setGoalH(e.target.value);setSplits(null);}} type="number" min={0} placeholder="00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>heures</div>
            </div>
            <span style={{fontSize:20,color:MUT,fontWeight:700}}>:</span>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalM} onChange={function(e){setGoalM(e.target.value);setSplits(null);}} type="number" min={0} max={59} placeholder="30" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>minutes</div>
            </div>
            <span style={{fontSize:20,color:MUT,fontWeight:700}}>:</span>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalS} onChange={function(e){setGoalS(e.target.value);setSplits(null);}} type="number" min={0} max={59} placeholder="00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>secondes</div>
            </div>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:8}}>Stratégie d'allure</label>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){setStrategy("even");setSplits(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(strategy==="even"?OR:BORD),background:strategy==="even"?OR+"15":"transparent",color:strategy==="even"?OR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Allure régulière
            </button>
            <button onClick={function(){setStrategy("negative");setSplits(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(strategy==="negative"?GR:BORD),background:strategy==="negative"?GR+"15":"transparent",color:strategy==="negative"?GR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Split négatif
            </button>
          </div>
          <div style={{fontSize:11,color:MUT,marginTop:6,lineHeight:1.6}}>{strategy==="negative"?"2% plus lent en première moitié, 2% plus rapide en seconde — la méthode des champions.":"Même allure du début à la fin — fiable pour les débutants."}</div>
        </div>

        <Btn label="Générer mes splits" onClick={calc} full style={{marginBottom:16}}/>

        {splits&&(
          <div style={{background:SURF2,borderRadius:12,overflow:"hidden",border:"1px solid "+BORD}}>
            <div style={{display:"flex",padding:"10px 14px",borderBottom:"1px solid "+BORD}}>
              <div style={{flex:1,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>km</div>
              <div style={{width:70,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"center"}}>Allure</div>
              <div style={{width:70,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"right"}}>Temps</div>
            </div>
            {splits.map(function(sp,i){
              var isHalf=Math.abs(sp.km-dist/2)<unit/2;
              var isFinish=sp.km===dist;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<splits.length-1?"1px solid "+BORD+"80":"none",background:isFinish?OR+"10":isHalf?BL+"08":"transparent"}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT}}>{sp.km} km</span>
                    {isHalf&&<span style={{fontSize:10,color:BL,fontWeight:600,marginLeft:6}}>Mi-course</span>}
                    {isFinish&&<span style={{fontSize:10,color:OR,fontWeight:600,marginLeft:6}}>Arrivée</span>}
                  </div>
                  <div style={{width:70,fontSize:13,fontWeight:600,color:strategy==="negative"?(i<splits.length/2?YE:GR):OR,textAlign:"center"}}>{sp.pace}/km</div>
                  <div style={{width:70,fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT,textAlign:"right"}}>{sp.elapsed}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingScreen(p){
  var [selWeek,setSelWeek]=useState(null);
  var [forceNoPlan,setForceNoPlan]=useState(false);
  var [showStrategy,setShowStrategy]=useState(false);
  var scrollRef=useRef(null);
  var races=useRaces();
  var raceId=p.race?p.race.id:null;
  useEffect(function(){setForceNoPlan(false);setSelWeek(null);},[raceId]);
  useEffect(function(){if(scrollRef.current&&selWeek!==null){var el=scrollRef.current.children[selWeek];if(el)el.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});}},[selWeek]);
  var plan=p.race?buildPlan(p.race,p.profile):null;
  var planWeeks=getPlanWeeks(plan);
  var activeIdx=selWeek!==null?Math.max(0,Math.min(selWeek,planWeeks.length-1)):0;
  if(selWeek===null&&planWeeks.length>0){for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){activeIdx=ci;break;}}}
  var w=planWeeks.length>0?planWeeks[activeIdx]:null;
  // Trouve la prochaine séance globale dans tout le plan
  var today=new Date(new Date().setHours(0,0,0,0));
  var nextSessDate=null;
  for(var wi=0;wi<planWeeks.length;wi++){
    var wk=planWeeks[wi];
    for(var si=0;si<wk.sessions.length;si++){
      var ss=wk.sessions[si];
      if(ss.date&&ss.date>=today){nextSessDate=ss.date;break;}
    }
    if(nextSessDate)break;
  }

  if(!p.race){
    var sugg0=suggestRaces(p.profile,races,"both");
    return(
      <div><LogoBar/>
        <div style={{padding:"24px 16px 0"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:6}}>Aucun plan actif</div>
            <div style={{fontSize:13,color:SUB}}>Choisis une course pour générer ton plan d'entraînement.</div>
          </div>
          {sugg0.length>0?(
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>Courses recommandées</div>
                <div style={{padding:"2px 8px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44"}}><span style={{fontSize:10,color:OR,fontWeight:700}}>Pour ton niveau</span></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {sugg0.map(function(r){
                  var col=r.type==="trail"?GR:BL;
                  var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(r);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,background:SURF,border:"1px solid "+BORD,cursor:"pointer"}}>
                      <div style={{width:46,height:46,borderRadius:12,background:col+"18",border:"1px solid "+col+"33",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <div style={{fontSize:16,fontWeight:800,color:col,lineHeight:1}}>{r.dist}</div>
                        <div style={{fontSize:8,color:col,fontWeight:600}}>km</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:3}}>
                          {r.name}{r.star?" ⭐":""}
                        </div>
                        <div style={{fontSize:11,color:SUB}}>{r.city} · dans {wks} semaines · {r.type==="trail"?"Trail":"Route"}</div>
                      </div>
                      <div style={{color:MUT,fontSize:18,flexShrink:0}}>›</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):null}
          <Btn label="Voir toutes les courses" onClick={p.onGoToCourses} variant="ghost" full/>
        </div>
      </div>
    );
  }
  if(plan&&plan.tooShort&&!forceNoPlan){return(
    <div style={{padding:"40px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <div style={{fontSize:18,fontWeight:700,color:RE,marginBottom:12}}>Délai trop court</div>
      <div style={{fontSize:14,color:SUB,lineHeight:1.8,marginBottom:16}}>
        Il ne reste que <span style={{color:YE,fontWeight:600}}>{plan.availWeeks} semaine{plan.availWeeks>1?"s":""}</span> avant cette course.
        Un plan cohérent nécessite au minimum <span style={{color:OR,fontWeight:600}}>{plan.minViable} semaines</span>.
        Le plan idéal serait de <span style={{color:GR,fontWeight:600}}>{plan.idealWeeks} semaines</span>.
      </div>
      <div style={{padding:"14px 18px",background:YE+"12",borderRadius:14,border:"1px solid "+YE+"33",fontSize:13,color:SUB,lineHeight:1.7,marginBottom:24}}>
        Tu peux participer sans plan structuré, ou choisir une course plus lointaine.
      </div>
      {(function(){
        var sugg1=suggestRaces(p.profile,races,p.race&&p.race.type).filter(function(r){return r.id!==p.race.id;}).slice(0,3);
        if(!sugg1.length)return null;
        return(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:MUT,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Courses adaptées à ton niveau</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sugg1.map(function(r){
                var col=r.type==="trail"?GR:BL;
                var wks=weeksUntil(r.date);
                return(
                  <div key={r.id} onClick={function(){p.setRace(r);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:SURF,border:"1px solid "+BORD,cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:col+"18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:col,lineHeight:1}}>{r.dist}</div>
                      <div style={{fontSize:8,color:col,fontWeight:600}}>km</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:TXT,marginBottom:2}}>{r.name}{r.star?" ⭐":""}</div>
                      <div style={{fontSize:11,color:SUB}}>{r.city} · dans {wks} sem.</div>
                    </div>
                    <div style={{color:MUT,fontSize:16}}>›</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn label="Voir toutes les courses" onClick={p.onGoToCourses} full/>
        <Btn label="Continuer sans plan structuré" onClick={function(){setForceNoPlan(true);}} variant="ghost" full/>
      </div>
    </div>
  );}
  if(forceNoPlan){var rd2=getCourseReadiness(p.race,p.profile);return(
    <div><LogoBar/>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:4}}>{p.race.name}</div>
        <div style={{fontSize:13,color:SUB,marginBottom:16}}>{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:rd2.color+"12",border:"1px solid "+rd2.color+"33",marginBottom:16}}>
          <span style={{fontSize:14}}>{rd2.icon}</span><span style={{fontSize:12,fontWeight:700,color:rd2.color}}>{rd2.label}</span><span style={{fontSize:12,color:SUB}}> · {rd2.msg}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {TIPS.map(function(tip,i){return(<div key={i} style={{display:"flex",gap:14,padding:"14px 16px",background:SURF,borderRadius:14,border:"1px solid "+BORD}}><div style={{fontSize:24,flexShrink:0}}>{tip.icon}</div><div><div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:4}}>{tip.title}</div><div style={{fontSize:12,color:SUB,lineHeight:1.6}}>{tip.desc}</div></div></div>);})}
        </div>
        <div style={{marginTop:16,marginBottom:24}}><Btn label="Choisir une autre course" onClick={function(){setForceNoPlan(false);p.onGoToCourses();}} variant="ghost" full/></div>
      </div>
    </div>
  );}
  if(planWeeks.length===0){return(<div style={{padding:"60px 24px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:600,color:TXT,marginBottom:8}}>Plan indisponible</div><Btn label="Choisir une autre course" onClick={p.onGoToCourses} full/></div>);}

  var rd=getCourseReadiness(p.race,p.profile);
  return(
    <><div><LogoBar/>
      <div style={{padding:"16px 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:18,fontWeight:700,color:TXT}}>{p.race.name}</div>
          <span style={{padding:"3px 10px",borderRadius:20,background:(p.race.type==="trail"?GR:BL)+"22",color:p.race.type==="trail"?GR:BL,fontSize:12,fontWeight:600}}>{weeksUntil(p.race.date)} sem.</span>
        </div>
        <div style={{fontSize:13,color:SUB,marginBottom:10}}>{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <div style={{background:SURF2,borderRadius:12,padding:"12px 14px",marginBottom:10,border:"1px solid "+BORD}}>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:OR}}>{planWeeks.length}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>sem. de plan</div></div>
            <div style={{width:1,background:BORD}}/>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:plan.idealWeeks>plan.availWeeks?YE:GR}}>{plan.idealWeeks}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>sem. idéales</div></div>
            <div style={{width:1,background:BORD}}/>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:BL}}>{plan.availWeeks}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>sem. dispo</div></div>
          </div>
          <div style={{fontSize:11,color:SUB,textAlign:"center",borderTop:"1px solid "+BORD,paddingTop:8}}>Début recommandé : <span style={{color:TXT,fontWeight:600}}>{fmtDate(plan.planStart)}</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:rd.color+"12",border:"1px solid "+rd.color+"33",marginBottom:10}}>
          <span style={{fontSize:14}}>{rd.icon}</span>
          <div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:rd.color}}>{rd.label}</span><span style={{fontSize:12,color:SUB}}> · {rd.msg}</span></div>
        </div>
        <button onClick={function(){setShowStrategy(true);}} style={{width:"100%",marginTop:10,padding:"11px",borderRadius:12,background:PU+"15",border:"1px solid "+PU+"44",color:PU,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          Stratégie de course · Splits
        </button>
      </div>
      <div ref={scrollRef} style={{display:"flex",gap:6,overflowX:"auto",padding:"0 16px 16px"}}>
        {planWeeks.map(function(wk,i){var isA=i===activeIdx;var pc=wk.phaseColor;return(
          <div key={i} onClick={function(){setSelWeek(i);}} style={{flexShrink:0,width:54,textAlign:"center",padding:"10px 4px",borderRadius:12,border:"1.5px solid "+(isA?pc:BORD),background:isA?pc+"20":SURF,cursor:"pointer",position:"relative",opacity:wk.isPast?0.55:1}}>
            {wk.isCurrent?<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:OR,color:"#fff",fontSize:7,fontWeight:700,borderRadius:4,padding:"1px 5px",whiteSpace:"nowrap"}}>now</div>:null}
            {i===planWeeks.length-1?<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:10}}>🏁</div>:null}
            <div style={{fontSize:8,color:isA?pc:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{wk.phaseLabel.slice(0,3)}</div>
            <div style={{fontSize:14,fontWeight:700,color:isA?pc:TXT}}>S{wk.num}</div>
            <div style={{fontSize:9,color:isA?pc:MUT,marginTop:1}}>{wk.isRecup?"R":wk.km+"k"}</div>
          </div>
        );})}
      </div>
      {w?(
        <div key={activeIdx} style={{padding:"0 16px"}}>
          <Card style={{marginBottom:12}}>
            <div style={{padding:"16px 18px",borderBottom:"1px solid "+BORD}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:12,color:w.phaseColor,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{w.phaseLabel}{w.isRecup?" · Récupération":""}</div>
                  <div style={{fontSize:20,fontWeight:700,color:TXT}}>Semaine {w.num}<span style={{fontSize:14,color:SUB,fontWeight:400}}> / {w.total}</span></div>
                </div>
                <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:TXT}}>{fmtS(w.weekStart)}</div><div style={{fontSize:12,color:SUB}}>au {fmtS(w.weekEnd)}</div></div>
              </div>
            </div>
            <div style={{display:"flex",padding:"14px 18px"}}>
              <Stat value={w.km+" km"} label="volume" color={w.phaseColor}/>
              <div style={{width:1,background:BORD}}/>
              <Stat value={w.sessions.length} label="séances" color={BL}/>
            </div>
          </Card>
          {w.sessions.map(function(s,si){return <SessionCard key={si} session={s} profile={p.profile} isNext={!!(nextSessDate&&s.date&&s.date.getTime()===nextSessDate.getTime())}/>;})}
          <div style={{display:"flex",gap:10,marginBottom:24,marginTop:4}}>
            <Btn label="Précédente" onClick={function(){setSelWeek(Math.max(0,activeIdx-1));}} disabled={activeIdx===0} variant="ghost" style={{flex:1}} size="sm"/>
            <Btn label="Suivante"  onClick={function(){setSelWeek(Math.min(planWeeks.length-1,activeIdx+1));}} disabled={activeIdx===planWeeks.length-1} variant="ghost" style={{flex:1}} size="sm"/>
          </div>
        </div>
      ):null}
    </div>
    {showStrategy&&<RaceStrategyModal race={p.race} onClose={function(){setShowStrategy(false);}}/>}
    </>
  );
}

function haversineKm(lat1,lng1,lat2,lng2){
  var R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

function useRaces(){
  var today=new Date().toISOString().slice(0,10);
  var [races,setRaces]=useState(function(){return RACES.filter(function(r){return r.date>=today;});});
  useEffect(function(){
    fetch("/races.json")
      .then(function(res){return res.json();})
      .then(function(data){setRaces(data.filter(function(r){return r.date>=today;}));})
      .catch(function(){});
  },[]);
  return races;
}

function suggestRaces(profile,races,preferredType){
  var level=(profile&&profile.level)||"beginner";
  var kmW=parseFloat((profile&&profile.kmWeek)||20);
  var type=preferredType||"both";
  var minWeeks=level==="beginner"?6:level==="intermediate"?8:10;
  var today=Date.now();
  // distances idéales et plafonds selon type et niveau
  var idealRoute=kmW<25?10:kmW<40?21:42;
  var maxRoute=level==="beginner"?21:level==="intermediate"?42:100;
  var idealTrail=kmW<25?20:kmW<40?35:60;
  var maxTrail=level==="beginner"?30:level==="intermediate"?60:200;
  return races.filter(function(r){
    if(type!=="both"&&r.type!==type)return false;
    var wks=weeksUntil(r.date);
    var maxD=r.type==="trail"?maxTrail:maxRoute;
    return wks>=minWeeks&&r.dist<=maxD&&new Date(r.date).getTime()>today;
  }).map(function(r){
    var score=0;
    var ideal=r.type==="trail"?idealTrail:idealRoute;
    var diff=Math.abs(r.dist-ideal);
    score+=diff===0?4:diff<=10?2:diff<=20?1:0;
    if(r.star)score+=2;
    var wks=weeksUntil(r.date);
    if(wks>=minWeeks&&wks<=minWeeks+8)score+=2;
    if(type!=="both")score+=1; // bonus cohérence type
    return{race:r,score:score};
  }).sort(function(a,b){return b.score-a.score;}).slice(0,4).map(function(x){return x.race;});
}

function CoursesScreen(p){
  var races=useRaces();
  var [tab,setTab]=useState("route");var [search,setSearch]=useState("");var [custom,setCustom]=useState([]);var [showAdd,setShowAdd]=useState(false);
  var [n,setN]=useState("");var [d,setD]=useState("");var [dt,setDt]=useState("");var [tp,setTp]=useState("route");
  var [userPos,setUserPos]=useState(null);var [locLoading,setLocLoading]=useState(false);var [locError,setLocError]=useState(null);var [nearMe,setNearMe]=useState(false);
  var [showCityFallback,setShowCityFallback]=useState(false);var [cityInput,setCityInput]=useState("");

  var CITY_COORDS={
    "paris":{lat:48.86,lng:2.35},"lyon":{lat:45.75,lng:4.83},"marseille":{lat:43.30,lng:5.37},
    "bordeaux":{lat:44.84,lng:-0.58},"nantes":{lat:47.22,lng:-1.55},"toulouse":{lat:43.60,lng:1.44},
    "nice":{lat:43.70,lng:7.27},"strasbourg":{lat:48.57,lng:7.75},"lille":{lat:50.63,lng:3.06},
    "rennes":{lat:48.11,lng:-1.68},"annecy":{lat:45.90,lng:6.12},"chamonix":{lat:45.92,lng:6.87},
    "grenoble":{lat:45.19,lng:5.72},"montpellier":{lat:43.61,lng:3.88},"tours":{lat:47.39,lng:0.69},
    "dijon":{lat:47.32,lng:5.04},"reims":{lat:49.25,lng:4.03},"metz":{lat:49.12,lng:6.18},
    "brussels":{lat:50.85,lng:4.35},"london":{lat:51.50,lng:-0.12},"berlin":{lat:52.52,lng:13.40},
    "madrid":{lat:40.42,lng:-3.70},"barcelona":{lat:41.39,lng:2.15},"rome":{lat:41.90,lng:12.49},
    "amsterdam":{lat:52.37,lng:4.90},"zurich":{lat:47.38,lng:8.54},"geneve":{lat:46.20,lng:6.15}
  };

  function applyCity(){
    var key=cityInput.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    var coords=CITY_COORDS[key];
    if(!coords){setLocError("Ville non reconnue, essaie une grande ville proche");return;}
    setUserPos(coords);setNearMe(true);setShowCityFallback(false);setLocError(null);
  }

  function requestLocation(){
    if(!navigator.geolocation){setShowCityFallback(true);return;}
    setLocLoading(true);setLocError(null);setShowCityFallback(false);
    navigator.geolocation.getCurrentPosition(
      function(pos){setUserPos({lat:pos.coords.latitude,lng:pos.coords.longitude});setLocLoading(false);setNearMe(true);},
      function(err){
        setLocLoading(false);
        if(err.code===1){setLocError("Permission refusée");}
        else{setLocError("Géolocalisation indisponible");}
        setShowCityFallback(true);
      },
      {timeout:8000,maximumAge:60000}
    );
  }

  var all=races.concat(custom);
  var filtered=all.filter(function(r){if(r.type!==tab)return false;if(search&&!r.name.toLowerCase().includes(search.toLowerCase())&&!r.city.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  var sorted=filtered.slice().sort(function(a,b){
    if(nearMe&&userPos){return haversineKm(userPos.lat,userPos.lng,a.lat,a.lng)-haversineKm(userPos.lat,userPos.lng,b.lat,b.lng);}
    return new Date(a.date)-new Date(b.date);
  });
  function addCustom(){if(!n||!d||!dt)return;var r={id:Date.now(),name:n,dist:parseFloat(d),type:tp,date:dt,city:"Personnalisé",custom:true};setCustom(function(prev){return prev.concat([r]);});p.setRace(r);setShowAdd(false);setN("");setD("");setDt("");}
  return(
    <div><LogoBar/>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:22,fontWeight:700,color:TXT,marginBottom:16}}>Courses</div>
        {(function(){
          var sugg=suggestRaces(p.profile,races,tab);
          if(!sugg.length)return null;
          return(
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>Pour toi</div>
                <div style={{padding:"2px 8px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44"}}><span style={{fontSize:10,color:OR,fontWeight:700}}>Basé sur ton profil</span></div>
              </div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                {sugg.map(function(r){
                  var on=p.race&&p.race.id===r.id;
                  var col=r.type==="trail"?GR:BL;
                  var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(on?null:r);}} style={{flexShrink:0,width:160,borderRadius:16,background:on?col+"18":SURF,border:"1.5px solid "+(on?col:BORD),padding:"14px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                      {r.star?<div style={{position:"absolute",top:8,right:8,fontSize:11}}>⭐</div>:null}
                      <div style={{fontSize:11,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>{r.type==="trail"?"Trail":"Route"}</div>
                      <div style={{fontSize:13,fontWeight:700,color:TXT,lineHeight:1.3,marginBottom:4}}>{r.name}</div>
                      <div style={{fontSize:12,color:SUB,marginBottom:8}}>{r.city}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:14,fontWeight:800,color:col}}>{r.dist}<span style={{fontSize:10,fontWeight:500,marginLeft:2}}>km</span></span>
                        <span style={{fontSize:10,color:MUT}}>{wks} sem.</span>
                      </div>
                      {on?<div style={{position:"absolute",bottom:10,right:10,width:18,height:18,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>✓</div>:null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher une course ou une ville…" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"12px 16px",color:TXT,fontSize:14,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          <Chip label="Route" active={tab==="route"} onClick={function(){setTab("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTab("trail");}}/>
          <button onClick={function(){if(nearMe){setNearMe(false);setShowCityFallback(false);}else{requestLocation();}}} style={{display:"flex",alignItems:"center",gap:5,background:nearMe?OR+"22":"none",border:"1px solid "+(nearMe?OR:BORD),borderRadius:20,padding:"7px 14px",color:nearMe?OR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {locLoading?"⏳":"📍"}{locLoading?"Localisation...":nearMe?"Près de moi ✓":"Près de moi"}
          </button>
          {locError?<span style={{fontSize:11,color:RE}}>{locError}</span>:null}
          <button onClick={function(){setShowAdd(true);}} style={{marginLeft:"auto",background:"none",border:"1px solid "+BORD,borderRadius:20,padding:"7px 14px",color:BL,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Ajouter</button>
        </div>
        {showCityFallback?(
          <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
            <input value={cityInput} onChange={function(e){setCityInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")applyCity();}} placeholder="Ta ville (ex: Lyon, Paris…)" style={{flex:1,background:SURF2,border:"1px solid "+OR+"55",borderRadius:10,padding:"10px 12px",color:TXT,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={applyCity} style={{background:OR,border:"none",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
            <button onClick={function(){setShowCityFallback(false);setLocError(null);}} style={{background:"none",border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:MUT,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        ):null}
        {showAdd?(
          <Card style={{padding:16,marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:12}}>Ma course</div>
            <input value={n} onChange={function(e){setN(e.target.value);}} placeholder="Nom" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",marginBottom:8,fontFamily:"inherit"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input value={d} onChange={function(e){setD(e.target.value);}} type="number" placeholder="Distance km" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <input value={dt} onChange={function(e){setDt(e.target.value);}} type="date" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",colorScheme:"dark",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <Chip label="Route" active={tp==="route"} onClick={function(){setTp("route");}}/>
              <Chip label="Trail" active={tp==="trail"} color={GR} onClick={function(){setTp("trail");}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn label="Ajouter" onClick={addCustom} size="sm" disabled={!n||!d||!dt} style={{flex:1}}/>
              <Btn label="Annuler" onClick={function(){setShowAdd(false);}} variant="ghost" size="sm" style={{flex:1}}/>
            </div>
          </Card>
        ):null}
        <div style={{display:"flex",flexDirection:"column",gap:8,paddingBottom:24}}>
          {sorted.map(function(r){var on=p.race&&p.race.id===r.id;var wks=weeksUntil(r.date);var col=r.type==="trail"?GR:BL;var distFromUser=(nearMe&&userPos&&r.lat!=null)?haversineKm(userPos.lat,userPos.lng,r.lat,r.lng):null;return(
            <Card key={r.id} onClick={function(){p.setRace(on?null:r);}} style={{cursor:"pointer",borderColor:on?col:BORD,background:on?col+"0f":SURF}}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:14,fontWeight:600,color:on?col:TXT}}>{r.name}</span>{r.star?<span style={{fontSize:11}}>⭐</span>:null}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:12,color:SUB}}>{r.city}</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,fontWeight:600,color:col+"cc"}}>{r.dist} km</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,color:on?col:SUB,fontWeight:on?600:400}}>{wks} sem.</span>
                    {distFromUser!=null?<><span style={{fontSize:12,color:MUT}}>·</span><span style={{fontSize:12,color:OR,fontWeight:600}}>📍 {distFromUser} km</span></>:null}
                  </div>
                </div>
                {on?<div style={{color:col,fontWeight:700,fontSize:16}}>✓</div>:<div style={{color:MUT,fontSize:18}}>›</div>}
              </div>
            </Card>
          );})}
          {sorted.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:SUB}}><div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:6}}>Aucune course trouvée</div></div>):null}
        </div>
      </div>
    </div>
  );
}




function JournalScreen(p){
  var [month,setMonth]=useState(new Date());
  var entries=p.entries||{};
  function setEntries(fn){p.onSetEntries&&p.onSetEntries(fn);}
  var [sel,setSel]=useState(null);
  var [form,setForm]=useState({done:false,km:"",min:"",feel:null,note:""});
  var [showGps,setShowGps]=useState(false);
  var y=month.getFullYear();var mo=month.getMonth();
  var dc=new Date(y,mo+1,0).getDate();
  var fd=(function(){var d=new Date(y,mo,1).getDay();return d===0?6:d-1;})();
  var cells=Array(fd).fill(null).concat(Array(dc).fill(0).map(function(_,i){return new Date(y,mo,i+1);}));
  var plan=p.race?buildPlan(p.race,{}):null;
  var planWeeks=getPlanWeeks(plan);
  function hasSess(d){for(var wi=0;wi<planWeeks.length;wi++){for(var si=0;si<planWeeks[wi].sessions.length;si++){var s=planWeeks[wi].sessions[si];if(s.date&&s.date.toDateString()===d.toDateString()&&s.type!=="race")return true;}}return false;}
  var doneE=Object.entries(entries).filter(function(e){return e[1].done;});
  var totalKm=doneE.reduce(function(s,e){return s+(parseFloat(e[1].km)||0);},0);
  function openDay(d){var k=d.toDateString();var e=entries[k]||{};setSel({date:d,key:k});setForm({done:!!e.done,km:e.km||"",min:e.min||"",feel:e.feel!=null?e.feel:null,rpe:e.rpe||5,note:e.note||"",track:e.track||null});}
  function save(){var was=!entries[sel.key]||!entries[sel.key].done;setEntries(function(prev){return Object.assign({},prev,{[sel.key]:Object.assign({},form)});});if(form.done&&was&&p.onAddSession)p.onAddSession(parseFloat(form.km)||5);setSel(null);}
  var feels=["😤","😓","😐","🙂","💪"];
  return(
    <><div><LogoBar/>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:22,fontWeight:700,color:TXT,marginBottom:16}}>Journal</div>
        <Card style={{marginBottom:14}}><div style={{display:"flex",padding:"14px 18px"}}><Stat value={doneE.length} label="séances" color={OR}/><div style={{width:1,background:BORD}}/><Stat value={Math.round(totalKm)+" km"} label="ce mois" color={BL}/></div></Card>
        <Card style={{padding:"18px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <button onClick={function(){setMonth(new Date(y,mo-1,1));}} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <div style={{fontSize:15,fontWeight:600,color:TXT}}>{MONTHS_F[mo]} {y}</div>
            <button onClick={function(){setMonth(new Date(y,mo+1,1));}} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {WDAYS.map(function(d,i){return <div key={i} style={{textAlign:"center",fontSize:11,color:MUT,paddingBottom:6,fontWeight:500}}>{d}</div>;})}
            {cells.map(function(date,i){
              if(!date)return <div key={i}/>;
              var k=date.toDateString();var e=entries[k];var planned=hasSess(date);
              var isToday=date.toDateString()===TODAY.toDateString();var isPast=date<TODAY;
              var bg="transparent",textColor=SUB,fw=400;
              if(e&&e.done){bg=OR;textColor="#fff";fw=700;}
              else if(planned&&isPast){bg=RE+"33";textColor=RE;}
              else if(planned){bg=OR+"22";textColor=OR;fw=600;}
              return <div key={i} onClick={function(){openDay(date);}} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:fw,background:bg,outline:isToday?"2px solid "+OR:"none",outlineOffset:1,color:textColor,cursor:"pointer"}}>{date.getDate()}</div>;
            })}
          </div>
        </Card>
        {sel?(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)setSel(null);}}>
            <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 24px 36px",animation:"slideUp .3s ease",maxHeight:"85vh",overflowY:"auto"}}>
              <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 20px"}}/>
              <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:20}}>{fmtDate(sel.date)}</div>
              <div onClick={function(){setForm(function(f){return Object.assign({},f,{done:!f.done});});}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:12,border:"1.5px solid "+(form.done?OR:BORD),background:form.done?OR+"15":SURF2,cursor:"pointer",marginBottom:14}}>
                <span style={{fontSize:14,fontWeight:500,color:TXT}}>Séance accomplie</span>
                <div style={{width:22,height:22,borderRadius:6,background:form.done?OR:"transparent",border:"2px solid "+(form.done?OR:BORD),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13}}>{form.done?"✓":""}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Distance (km)</label><input value={form.km} onChange={function(e){setForm(function(f){return Object.assign({},f,{km:e.target.value});});}} type="number" placeholder="12" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/></div>
                <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Durée (min)</label><input value={form.min} onChange={function(e){setForm(function(f){return Object.assign({},f,{min:e.target.value});});}} type="number" placeholder="60" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/></div>
              </div>
              {/* GPS / GPX */}
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <button onClick={function(){setShowGps(true);}} style={{flex:1,padding:"10px",borderRadius:10,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>📍 GPS en direct</button>
                <label style={{flex:1,padding:"10px",borderRadius:10,background:BL+"18",border:"1px solid "+BL+"44",color:BL,fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  📎 Import GPX
                  <input type="file" accept=".gpx" style={{display:"none"}} onChange={function(e){
                    var file=e.target.files&&e.target.files[0];if(!file)return;
                    var reader=new FileReader();
                    reader.onload=function(ev){
                      var track=parseGpx(ev.target.result);
                      if(track.length>0){
                        var km=calcTrackKm(track);
                        var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;
                        setForm(function(f){return Object.assign({},f,{track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):f.min});});
                      }
                    };reader.readAsText(file);e.target.value="";
                  }}/>
                </label>
              </div>
              {form.track&&form.track.length>1&&<div style={{marginBottom:14}}><RunMap track={form.track} height={160}/></div>}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:10}}>Ressenti</label>
                <div style={{display:"flex",gap:8}}>{feels.map(function(e,i){return <div key={i} onClick={function(){setForm(function(f){return Object.assign({},f,{feel:i});});}} style={{flex:1,textAlign:"center",padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(form.feel===i?OR:BORD),background:form.feel===i?OR+"15":SURF2,cursor:"pointer",fontSize:20}}>{e}</div>;})} </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <label style={{fontSize:12,color:MUT}}>Effort ressenti (RPE)</label>
                  <span style={{fontSize:13,fontWeight:700,color:(function(){var r=form.rpe||5;return r<=3?GR:r<=6?YE:r<=8?OR:RE;})()}}>{form.rpe||5}<span style={{fontSize:10,color:MUT,fontWeight:400}}>/10</span></span>
                </div>
                <input type="range" min={1} max={10} value={form.rpe||5} onChange={function(e){setForm(function(f){return Object.assign({},f,{rpe:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:OR}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:10,color:MUT}}>Facile</span>
                  <span style={{fontSize:10,color:MUT}}>Maximal</span>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Note</label>
                <textarea value={form.note} onChange={function(e){setForm(function(f){return Object.assign({},f,{note:e.target.value});});}} placeholder="Comment s'est passée la sortie ?" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",minHeight:80,resize:"none",fontFamily:"inherit"}}/>
              </div>
              <Btn label="Enregistrer" onClick={save} full/>
            </div>
          </div>
        ):null}
      </div>
    </div>
    {showGps&&<GpsTrackerModal onClose={function(){setShowGps(false);}} onSave={function(res){setForm(function(f){return Object.assign({},f,{track:res.track,km:res.km,min:res.min,done:true});});setShowGps(false);}}/>}
    </>
  );
}

function SuiviScreen(p){
  var entries=p.entries||{};
  var race=p.race;
  var today=new Date();
  var [showGps,setShowGps]=useState(false);

  function saveTrack(res){
    var key=today.toDateString();
    var prev=entries[key]||{};
    var wasNotDone=!prev.done;
    var updated=Object.assign({},prev,{done:true,track:res.track,km:res.km,min:res.min});
    p.onSetEntries&&p.onSetEntries(function(e){return Object.assign({},e,{[key]:updated});});
    if(wasNotDone&&p.onAddSession)p.onAddSession(parseFloat(res.km)||0);
  }

  // ── Calcul km par semaine (8 dernières semaines) ──
  var weeks=[];
  for(var w=7;w>=0;w--){
    var wStart=new Date(today);wStart.setDate(today.getDate()-today.getDay()+1-w*7);wStart.setHours(0,0,0,0);
    var wEnd=new Date(wStart);wEnd.setDate(wStart.getDate()+6);wEnd.setHours(23,59,59,999);
    var km=0;
    Object.entries(entries).forEach(function(e){
      var d=new Date(e[0]);if(d>=wStart&&d<=wEnd&&e[1].done)km+=parseFloat(e[1].km)||0;
    });
    var label=wStart.getDate()+"/"+(wStart.getMonth()+1);
    weeks.push({label:label,km:Math.round(km),current:w===0});
  }
  var thisWeekKm=weeks[7].km;
  var targetKm=p.profile.kmWeek||25;

  // ── Activités récentes ──
  var recent=Object.entries(entries).filter(function(e){return e[1].done;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);}).slice(0,5);

  // ── Dernière sortie avec track GPS ──
  var lastTracked=(Object.entries(entries).filter(function(e){return e[1].done&&e[1].track&&e[1].track.length>1;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);})[0])||null;

  // ── Race progress ──
  var raceWeeks=race?weeksUntil(race.date):null;
  var totalPlanWeeks=race?Math.round((new Date(race.date)-new Date())/(7*24*3600*1000)+4):null;
  var raceProgress=totalPlanWeeks?Math.max(0,Math.min(100,Math.round((1-raceWeeks/totalPlanWeeks)*100))):0;

  function share(){
    var txt="J'ai couru "+Math.round(Object.entries(entries).filter(function(e){return e[1].done;}).reduce(function(s,e){return s+(parseFloat(e[1].km)||0);},0))+" km au total avec FuelRun !"+(race?" Je prépare "+race.name+" !":"")+" Rejoins-moi.";
    if(navigator.share)navigator.share({title:"FuelRun",text:txt,url:window.location.href});
    else if(navigator.clipboard)navigator.clipboard.writeText(txt);
  }

  return(
    <><div><LogoBar/>
      <div style={{padding:"20px 16px 80px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:700,color:TXT}}>Suivi</div>
          <button onClick={share} style={{padding:"6px 14px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44",color:OR,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Partager</button>
        </div>

        {/* ── Stats ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:MUT,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Cette semaine</div>
            <div style={{fontSize:28,fontWeight:800,color:OR,lineHeight:1}}>{thisWeekKm}<span style={{fontSize:13,color:MUT,fontWeight:400}}> km</span></div>
            <div style={{marginTop:8,height:4,borderRadius:2,background:SURF2,overflow:"hidden"}}>
              <div style={{width:Math.min(100,Math.round(thisWeekKm/targetKm*100))+"%",height:"100%",background:OR,borderRadius:2,transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:10,color:MUT,marginTop:4}}>Objectif : {targetKm} km</div>
          </div>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:MUT,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Total</div>
            <div style={{fontSize:28,fontWeight:800,color:BL,lineHeight:1}}>{p.stats.km?Math.round(p.stats.km):0}<span style={{fontSize:13,color:MUT,fontWeight:400}}> km</span></div>
            <div style={{fontSize:10,color:MUT,marginTop:8}}>{p.stats.sessions||0} séance{p.stats.sessions!==1?"s":""} · {p.stats.streak||0}j streak</div>
          </div>
        </div>

        {/* ── Enregistrer une sortie ── */}
        <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Enregistrer une sortie</div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={function(){setShowGps(true);}} style={{flex:1,padding:"14px 10px",borderRadius:12,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <span style={{fontSize:24}}>📍</span>GPS en direct
            </button>
            <label style={{flex:1,padding:"14px 10px",borderRadius:12,background:BL+"18",border:"1px solid "+BL+"44",color:BL,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,textAlign:"center"}}>
              <span style={{fontSize:24}}>📎</span>Import GPX
              <input type="file" accept=".gpx" style={{display:"none"}} onChange={function(e){
                var file=e.target.files&&e.target.files[0];if(!file)return;
                var reader=new FileReader();
                reader.onload=function(ev){
                  var track=parseGpx(ev.target.result);
                  if(track.length>1){
                    var km=calcTrackKm(track);
                    var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;
                    saveTrack({track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):""});
                  }
                };reader.readAsText(file);e.target.value="";
              }}/>
            </label>
          </div>
        </div>

        {/* ── Carte dernière sortie GPS ── */}
        {lastTracked&&(
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5}}>Dernière sortie</div>
              <div style={{fontSize:11,color:SUB}}>{fmtDate(new Date(lastTracked[0]))} · {lastTracked[1].km} km</div>
            </div>
            <RunMap track={lastTracked[1].track} height={200}/>
            {lastTracked[1].min&&<div style={{marginTop:8,fontSize:12,color:SUB,textAlign:"center"}}>Durée : {lastTracked[1].min} min · Allure moy. : {fmtPaceSec((parseFloat(lastTracked[1].min)*60)/(parseFloat(lastTracked[1].km)||1))} /km</div>}
          </div>
        )}
        {/* ── Progression course ── */}
        {race&&(
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:TXT}}>{race.name}</div>
              <div style={{fontSize:12,color:OR,fontWeight:700}}>{raceWeeks} sem.</div>
            </div>
            <div style={{height:6,borderRadius:3,background:SURF2,overflow:"hidden",marginBottom:6}}>
              <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+OR+","+GR+")",borderRadius:3,transition:"width .5s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:MUT}}>Début</span>
              <span style={{fontSize:10,color:OR,fontWeight:600}}>{raceProgress}% accompli</span>
              <span style={{fontSize:10,color:MUT}}>{race.date}</span>
            </div>
          </div>
        )}

        {/* ── Charge d'entraînement ── */}
        {(function(){
          var cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-7);
          var last7=Object.entries(entries).filter(function(e){return e[1].done&&new Date(e[0])>=cutoff;});
          if(last7.length===0)return null;
          var load=last7.reduce(function(s,e){return s+(parseFloat(e[1].km)||0)*(e[1].rpe||5);},0);
          var avgRpe=last7.reduce(function(s,e){return s+(e[1].rpe||5);},0)/last7.length;
          var norm=Math.min(1,load/250);
          var col=norm<0.3?GR:norm<0.55?YE:norm<0.8?OR:RE;
          var lbl=norm<0.3?"Fraîcheur":norm<0.55?"Charge normale":norm<0.8?"Charge élevée":"Surcharge";
          return(
            <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Charge d'entraînement · 7 jours</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{height:8,borderRadius:4,background:SURF2,overflow:"hidden"}}>
                    <div style={{width:Math.round(norm*100)+"%",height:"100%",background:"linear-gradient(90deg,"+GR+","+col+")",borderRadius:4,transition:"width .5s"}}/>
                  </div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:col,flexShrink:0,minWidth:80,textAlign:"right"}}>{lbl}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:OR}}>{Math.round(load)}</div>
                  <div style={{fontSize:10,color:MUT,marginTop:3}}>Charge (UA)</div>
                </div>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:BL}}>{avgRpe.toFixed(1)}</div>
                  <div style={{fontSize:10,color:MUT,marginTop:3}}>RPE moyen</div>
                </div>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:GR}}>{last7.length}</div>
                  <div style={{fontSize:10,color:MUT,marginTop:3}}>Séances</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Activités récentes ── */}
        <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid "+BORD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5}}>Activités récentes</div>
            <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{fontSize:11,color:OR,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Ajouter</button>
          </div>
          {recent.length===0?(
            <div style={{padding:"24px 16px",textAlign:"center"}}>
              <div style={{fontSize:13,color:SUB,marginBottom:8}}>Aucune sortie enregistrée</div>
              <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{padding:"8px 18px",borderRadius:20,background:OR,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Enregistrer ma première sortie</button>
            </div>
          ):(
            recent.map(function(e,i){
              var d=new Date(e[0]);var data=e[1];
              return(
                <div key={i} style={{padding:"12px 16px",borderBottom:i<recent.length-1?"1px solid "+BORD:"none",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:10,background:OR+"18",border:"1px solid "+OR+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,color:OR,fontWeight:700}}>{Math.round(data.km||0)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:TXT}}>{data.km||0} km{data.min?" · "+data.min+" min":""}</div>
                    <div style={{fontSize:11,color:MUT,marginTop:2}}>{d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()}</div>
                  </div>
                  {data.feel!=null&&<div style={{fontSize:18}}>{"😤😓😐🙂💪".split("")[data.feel*2]||""}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    {showGps&&<GpsTrackerModal onClose={function(){setShowGps(false);}} onSave={function(res){saveTrack(res);setShowGps(false);}}/>}</>
  );
}

var GUIDE_STEPS=[
  {tab:"home",     title:"Ton tableau de bord",   desc:"Retrouve ici ta prochaine séance, ton objectif course et ton état de forme."},
  {tab:"courses",  title:"Trouve ta course",       desc:"Sélectionne une course objectif et laisse FuelRun générer ton plan personnalisé."},
  {tab:"training", title:"Ton plan d'entraînement",desc:"Toutes tes séances semaine par semaine, avec nutrition et recettes intégrées."},
  {tab:"suivi",    title:"Suis ta progression",    desc:"Visualise tes km, tes sorties récentes et ta progression vers la course."},
  {tab:"coach",    title:"Ton coach IA",           desc:"Pose toutes tes questions à ton coach personnel, disponible 24h/24."},
];

function OnboardingGuide(p){
  var [step,setStep]=useState(0);
  var current=GUIDE_STEPS[step];
  var tabIndex=NAV_IDS.indexOf(current.tab);
  var tabPct=tabIndex>=0?(tabIndex+0.5)/NAV_IDS.length*100:50;
  function next(){if(step<GUIDE_STEPS.length-1){setStep(step+1);p.onTab(GUIDE_STEPS[step+1].tab);}else{p.onDone();}}
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",pointerEvents:"auto"}} onClick={p.onDone}/>
      {/* Bulle */}
      <div style={{position:"absolute",bottom:90,left:"clamp(8px, calc("+tabPct+"% - 130px), calc(100% - 268px))",maxWidth:260,width:"calc(100% - 16px)",pointerEvents:"auto",animation:"fadeIn .3s ease"}}>
        <div style={{background:OR,borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:6}}>{current.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.6,marginBottom:14}}>{current.desc}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={p.onDone} style={{fontSize:11,color:"rgba(255,255,255,.7)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Passer</button>
            <button onClick={next} style={{padding:"7px 16px",borderRadius:20,background:"#fff",border:"none",color:OR,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{step<GUIDE_STEPS.length-1?"Suivant →":"Terminer"}</button>
          </div>
        </div>
        {/* Flèche vers le bas */}
        <div style={{width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid "+OR,margin:"0 auto"}}/>
      </div>
      {/* Indicateur de progression */}
      <div style={{position:"absolute",bottom:76,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,pointerEvents:"auto"}}>
        {GUIDE_STEPS.map(function(_,i){return <div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i===step?"#fff":"rgba(255,255,255,.3)",transition:"width .3s"}}/>;}) }
      </div>
    </div>
  );
}

function CoachScreen(p){
  var init="Salut "+(p.profile.name||"champion")+" ! Je suis ton coach FuelRun. "+(p.race?"Tu prépares "+p.race.name+" dans "+weeksUntil(p.race.date)+" semaines. Comment puis-je t'aider ?":"Dis-moi ton objectif et je t'aide !");
  var [messages,setMessages]=useState([{role:"model",content:init}]);
  var [input,setInput]=useState("");
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState("");
  var bottomRef=useRef(null);
  useEffect(function(){if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);

  function send(){
    if(!input.trim()||loading)return;
    var msg=input.trim();setInput("");setLoading(true);setError("");
    var newMsgs=messages.concat([{role:"user",content:msg}]);
    setMessages(newMsgs);
    var sys="Tu es un coach running expert et bienveillant. Profil : "+(p.profile.name||"Coureur")+", niveau "+(p.profile.level||"débutant")+"."+(p.race?" Objectif : "+p.race.name+", "+p.race.dist+" km dans "+weeksUntil(p.race.date)+" semaines.":"")+"\nRéponds en français, 3-4 phrases max, naturel et personnalisé.";
    var hist=newMsgs.map(function(m){return{role:m.role==="model"?"assistant":m.role,content:m.content};});
    fetch("https://api.mistral.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_KEY},
      body:JSON.stringify({model:"mistral-small-latest",messages:[{role:"system",content:sys}].concat(hist),max_tokens:400})
    }).then(function(r){return r.json();}).then(function(data){
      if(data.error){setError((data.error.message)||"Erreur API");setLoading(false);return;}
      var reply=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||"Désolé, réessaie.";
      setMessages(function(m){return m.concat([{role:"model",content:reply}]);});setLoading(false);
    }).catch(function(){
      setMessages(function(m){return m.concat([{role:"model",content:"Problème de connexion."}]);});setLoading(false);
    });
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 70px)"}}>
      <LogoBar/>
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid "+BORD,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:22,fontWeight:700,color:TXT}}>Coach IA</div>
          <div/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,"+OR+"44,"+OR+"11)",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏃</div>
          <div style={{fontSize:13,fontWeight:700,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Coach FuelRun <span style={{fontSize:11,fontWeight:400,color:GR}}>· En ligne · Disponible 7j/7</span></div>
        </div>
        {error?<div style={{marginTop:8,fontSize:12,color:RE}}>{error}</div>:null}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px"}}>
        {messages.map(function(m,i){var isUser=m.role==="user";return(<div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:12,gap:8}}>{!isUser?<div style={{width:28,height:28,borderRadius:"50%",background:OR+"20",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginTop:2}}>🏃</div>:null}<div style={{maxWidth:"78%",background:isUser?OR:SURF,borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:14,color:isUser?"#fff":TXT,lineHeight:1.6,border:isUser?"none":"1px solid "+BORD}}>{m.content}</div></div>);})}
        {loading?(<div style={{display:"flex",gap:8,marginBottom:12}}><div style={{width:28,height:28,borderRadius:"50%",background:OR+"20",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏃</div><div style={{background:SURF,borderRadius:"16px 16px 16px 4px",padding:"12px 14px",border:"1px solid "+BORD,display:"flex",gap:4}}>{[0,1,2].map(function(i){return <div key={i} style={{width:7,height:7,borderRadius:"50%",background:OR,animation:"pulse 1.2s "+(i*0.2)+"s infinite"}}/>;})}</div></div>):null}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"8px 16px 16px",borderTop:"1px solid "+BORD,flexShrink:0}}>
        {messages.length<=1&&!loading?(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {["Comment préparer ma prochaine séance ?","Que manger avant une course ?","J'ai mal aux jambes, que faire ?","Comment améliorer mon allure ?"].map(function(q,i){
              return <button key={i} onClick={function(){setInput(q);}} style={{padding:"6px 12px",borderRadius:20,background:SURF2,border:"1px solid "+BORD,color:SUB,fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{q}</button>;
            })}
          </div>
        ):null}
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")send();}} placeholder="Pose ta question au coach…" style={{flex:1,background:SURF,border:"1px solid "+BORD,borderRadius:12,padding:"12px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={send} disabled={!input.trim()||loading} style={{width:46,height:46,borderRadius:12,background:OR,border:"none",cursor:!input.trim()||loading?"not-allowed":"pointer",fontSize:18,opacity:!input.trim()||loading?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>↑</button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen(p){
  var [editing,setEditing]=useState(false);
  var [form,setForm]=useState({name:p.profile.name||"",age:p.profile.age||"",weight:p.profile.weight||"",height:p.profile.height||"",sex:p.profile.sex||"M",level:p.profile.level||"beginner",sessWeek:p.profile.sessWeek||3,kmWeek:p.profile.kmWeek||25});
  var [showVdot,setShowVdot]=useState(false);
  var [vdotDist,setVdotDist]=useState("10");
  var [vdotTime,setVdotTime]=useState("");
  var [vdotResult,setVdotResult]=useState(null);
  var [showResetModal,setShowResetModal]=useState(false);
  function save(){p.onUpdate(form);setEditing(false);}
  function field(label,key,type,placeholder){
    return(
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:MUT,display:"block",marginBottom:5}}>{label}</label>
        <input value={form[key]} onChange={function(e){setForm(function(f){return Object.assign({},f,{[key]:e.target.value});});}} type={type||"text"} placeholder={placeholder} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
      </div>
    );
  }
  var stats=[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km)+" km",color:BL},{label:"Streak",value:p.stats.streak+" j",color:YE}];
  return(
    <div><LogoBar/>
      <div style={{padding:"20px 16px 80px"}}>
        {/* ── EN-TÊTE ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,"+OR+"44,#1a0800)",border:"2px solid "+OR+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:OR}}>
              {(p.profile.name||"?").split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:TXT}}>{p.profile.name||"Coureur"}</div>
              <div style={{fontSize:13,color:SUB,marginTop:2}}>{LEVEL_LABELS[p.profile.level]||""}</div>
            </div>
          </div>
          <button onClick={function(){setEditing(!editing);}} style={{padding:"7px 16px",borderRadius:20,background:editing?SURF2:OR+"22",border:"1px solid "+(editing?BORD:OR+"44"),color:editing?SUB:OR,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {editing?"Annuler":"Modifier"}
          </button>
        </div>

        {/* ── STATS ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {stats.map(function(s,i){return(
            <div key={i} style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,color:MUT,marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
            </div>
          );})}
        </div>

        {!editing?(
          /* ── VUE LECTURE ── */
          <Card style={{marginBottom:16}}>
            {[
              {label:"Prénom",           value:p.profile.name},
              {label:"Âge",              value:p.profile.age+" ans"},
              {label:"Poids",            value:p.profile.weight+" kg"},
              {label:"Taille",           value:p.profile.height+" cm"},
              {label:"Sexe",             value:p.profile.sex==="F"?"Femme":"Homme"},
              {label:"Niveau",           value:LEVEL_LABELS[p.profile.level]||p.profile.level},
              {label:"Séances / sem.",   value:p.profile.sessWeek||3},
              {label:"Base km / sem.",   value:(p.profile.kmWeek||25)+" km"}
            ].map(function(it,i,arr){return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:i<arr.length-1?"1px solid "+BORD:"none"}}>
                <span style={{fontSize:13,color:SUB}}>{it.label}</span>
                <span style={{fontSize:13,fontWeight:600,color:TXT}}>{it.value}</span>
              </div>
            );})}
          </Card>
        ):(
          /* ── MODE ÉDITION ── */
          <div style={{marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:0}}>
              <div>{field("Prénom","name","text","Prénom")}</div>
              <div>{field("Âge","age","number","30")}</div>
              <div>{field("Poids (kg)","weight","number","70")}</div>
              <div>{field("Taille (cm)","height","number","175")}</div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:MUT,display:"block",marginBottom:5}}>Sexe</label>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"M"});});}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(form.sex==="M"?OR:BORD),background:form.sex==="M"?OR+"18":"transparent",color:form.sex==="M"?OR:SUB,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Homme</button>
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"F"});});}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(form.sex==="F"?OR:BORD),background:form.sex==="F"?OR+"18":"transparent",color:form.sex==="F"?OR:SUB,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Femme</button>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:MUT,display:"block",marginBottom:5}}>Niveau</label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {LEVELS.map(function(l){var on=form.level===l.id;return(
                  <div key={l.id} onClick={function(){setForm(function(f){return Object.assign({},f,{level:l.id});});}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"12":SURF,cursor:"pointer"}}>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:on?OR:TXT}}>{l.label}</div><div style={{fontSize:11,color:MUT}}>{l.sub}</div></div>
                    <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid "+(on?OR:BORD),background:on?OR:"transparent",flexShrink:0}}/>
                  </div>
                );})}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:MUT}}>Séances / semaine</label>
                <span style={{fontSize:12,fontWeight:700,color:OR}}>{form.sessWeek}</span>
              </div>
              <input type="range" min={2} max={7} value={form.sessWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{sessWeek:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:OR}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:MUT}}>Base kilométrique / semaine</label>
                <span style={{fontSize:12,fontWeight:700,color:BL}}>{form.kmWeek} km</span>
              </div>
              <input type="range" min={5} max={100} step={5} value={form.kmWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{kmWeek:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:BL}}/>
            </div>
            <Btn label="Enregistrer les modifications" onClick={save} full/>
          </div>
        )}

        {/* ── CALIBRATION ALLURES VDOT ── */}
        <Card style={{marginBottom:16}}>
          <div onClick={function(){setShowVdot(!showVdot);setVdotResult(null);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",cursor:"pointer"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:TXT}}>Calibrer mes allures</div>
              <div style={{fontSize:12,color:p.profile.vdotPaces?GR:SUB,marginTop:2}}>{p.profile.vdotPaces?"Allures personnalisées actives":"Basé sur le niveau de profil"}</div>
            </div>
            <div style={{fontSize:10,color:MUT,transform:showVdot?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
          </div>
          {showVdot&&(
            <div style={{padding:"0 18px 18px",borderTop:"1px solid "+BORD}}>
              <div style={{fontSize:12,color:SUB,marginTop:14,marginBottom:14,lineHeight:1.7}}>Entre une performance récente pour calculer tes allures optimales d'entraînement (méthode Jack Daniels).</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Distance</label>
                  <select value={vdotDist} onChange={function(e){setVdotDist(e.target.value);setVdotResult(null);}} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit",colorScheme:"dark"}}>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="21.1">Semi (21,1 km)</option>
                    <option value="42.2">Marathon (42,2 km)</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Temps (hh:mm:ss)</label>
                  <input value={vdotTime} onChange={function(e){setVdotTime(e.target.value);setVdotResult(null);}} placeholder="00:45:00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                </div>
              </div>
              {vdotResult&&(
                <div style={{background:OR+"10",border:"1px solid "+OR+"30",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:11,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Tes allures personnalisées</div>
                  {[{l:"Endurance",k:"easy",c:GR},{l:"Sortie longue",k:"long",c:BL},{l:"Seuil",k:"tempo",c:YE},{l:"Fractionné",k:"interval",c:OR},{l:"Récupération",k:"recovery",c:MUT}].map(function(pp,i){return(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<4?8:0}}>
                      <span style={{fontSize:13,color:SUB}}>{pp.l}</span>
                      <span style={{fontSize:14,fontWeight:700,color:pp.c}}>{vdotResult[pp.k]}/km</span>
                    </div>
                  );})}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <Btn label="Calculer" onClick={function(){
                  var parts=vdotTime.split(":").map(Number);
                  var secs=parts.length===3?parts[0]*3600+parts[1]*60+(parts[2]||0):parts.length===2?parts[0]*60+(parts[1]||0):0;
                  if(!secs||secs<60)return;
                  var vdot=calcVdot(parseFloat(vdotDist),secs);
                  setVdotResult(vdotToPaces(vdot));
                }} size="sm" style={{flex:1}}/>
                {vdotResult&&<Btn label="Appliquer" onClick={function(){
                  p.onUpdate(Object.assign({},p.profile,{vdotPaces:vdotResult}));
                  setVdotResult(null);setShowVdot(false);
                }} size="sm" style={{flex:1}}/>}
                {p.profile.vdotPaces&&<Btn label="Réinitialiser" onClick={function(){
                  var upd=Object.assign({},p.profile);delete upd.vdotPaces;p.onUpdate(upd);
                }} size="sm" variant="ghost" style={{flex:1}}/>}
              </div>
            </div>
          )}
        </Card>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10,marginTop:4}}>
          <button onClick={function(){
            var data={profile:p.profile,race:JSON.parse(localStorage.getItem("fr_race")||"null"),stats:JSON.parse(localStorage.getItem("fr_stats")||"{}"),wellbeing:JSON.parse(localStorage.getItem("fr_wellbeing")||"null")};
            var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="fuelrun-backup.json";a.click();URL.revokeObjectURL(url);
          }} style={{padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Exporter</button>
          <label style={{padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"center",display:"block"}}>
            Importer
            <input type="file" accept=".json" style={{display:"none"}} onChange={function(e){
              var file=e.target.files[0];if(!file)return;
              var reader=new FileReader();
              reader.onload=function(ev){try{
                var data=JSON.parse(ev.target.result);
                if(data.profile){localStorage.setItem("fr_profile",JSON.stringify(data.profile));}
                if(data.race){localStorage.setItem("fr_race",JSON.stringify(data.race));}
                if(data.stats){localStorage.setItem("fr_stats",JSON.stringify(data.stats));}
                if(data.wellbeing){localStorage.setItem("fr_wellbeing",JSON.stringify(data.wellbeing));}
                p.onUpdate(data.profile);
              }catch(err){alert("Fichier invalide");}};
              reader.readAsText(file);
            }}/>
          </label>
        </div>
        {p.user&&<div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:SURF2,border:"1px solid "+BORD}}><div style={{fontSize:11,color:MUT,marginBottom:2}}>Connecté avec</div><div style={{fontSize:13,color:TXT,fontWeight:600}}>{p.user.email||p.user.displayName||"Compte Google"}</div></div>}
        <button onClick={p.onSignOut} style={{width:"100%",background:"none",border:"1px solid "+BORD,borderRadius:12,padding:"13px",color:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Se déconnecter</button>
        <button onClick={p.onNewRace} style={{width:"100%",background:"none",border:"1px solid "+OR+"44",borderRadius:12,padding:"13px",color:OR,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Changer d'objectif course</button>
        <button onClick={function(){setShowResetModal(true);}} style={{width:"100%",background:"none",border:"1px solid "+RE+"44",borderRadius:12,padding:"13px",color:RE,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Réinitialiser mon profil</button>
      </div>
    </div>

    {/* ── Modal confirmation reset ── */}
    {showResetModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(e){if(e.target===e.currentTarget)setShowResetModal(false);}}>
        <div style={{background:SURF,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,animation:"fadeIn .2s ease"}}>
          <div style={{fontSize:24,textAlign:"center",marginBottom:12}}>⚠️</div>
          <div style={{fontSize:18,fontWeight:700,color:TXT,textAlign:"center",marginBottom:8}}>Réinitialiser le profil ?</div>
          <div style={{fontSize:13,color:SUB,textAlign:"center",lineHeight:1.6,marginBottom:24}}>Ton profil, ton plan et tes stats seront effacés. Tu pourras choisir une nouvelle course et repartir de zéro.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={function(){setShowResetModal(false);p.onReset();}} style={{width:"100%",padding:"14px",borderRadius:12,background:RE,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirmer et choisir une nouvelle course</button>
            <button onClick={function(){setShowResetModal(false);}} style={{width:"100%",padding:"14px",borderRadius:12,background:"none",border:"1px solid "+BORD,color:SUB,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
          </div>
        </div>
      </div>
    )}
  );
}

var NAV=[
  {id:"home",     label:"Accueil", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11L12 3l9 8v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>;}},
  {id:"courses",  label:"Courses", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 13 6 13s6-7.7 6-13c0-3.3-2.7-6-6-6z" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="8" r="2" stroke={c} strokeWidth="1.8"/></svg>;}},
  {id:"training", label:"Plan",    icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;}},
  {id:"suivi",    label:"Suivi",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}},
  {id:"coach",    label:"Coach",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 2H4a1 1 0 00-1 1v12a1 1 0 001 1h3l3 4 3-4h7a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="9" cy="9" r="1" fill={c}/><circle cx="12" cy="9" r="1" fill={c}/><circle cx="15" cy="9" r="1" fill={c}/></svg>;}},
];
var NAV_IDS=NAV.map(function(n){return n.id;});

function ls(key,fallback){try{var v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
function lsSet(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}

export default function App(){
  var [authState,setAuthState]=useState("loading"); // loading | unauth | onboarding | app
  var [user,setUser]=useState(null);
  var [profile,setProfileRaw]=useState(null);
  var [race,setRaceRaw]=useState(null);
  var [tab,setTab]=useState("home");
  var [stats,setStatsRaw]=useState({sessions:0,km:0,streak:0});
  var today=new Date().toISOString().slice(0,10);
  var [wellbeing,setWellbeingRaw]=useState(null);
  var [showCheckin,setShowCheckin]=useState(false);
  var [entries,setEntriesRaw]=useState(function(){return ls("fr_entries",{});});
  var [showGuide,setShowGuide]=useState(false);
  function setEntries(fn){setEntriesRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;lsSet("fr_entries",next);if(user)fsSave(user.uid,{entries:next});return next;});}

  // ── Firestore helpers ──
  function fsGet(uid){
    return getDoc(doc(db,"users",uid)).then(function(snap){return snap.exists()?snap.data():null;});
  }
  function fsSave(uid,data){
    return setDoc(doc(db,"users",uid),data,{merge:true});
  }

  // ── Auth state listener ──
  useEffect(function(){
    var unsub=onAuthStateChanged(auth,function(u){
      if(!u){setUser(null);setAuthState("unauth");return;}
      setUser(u);
      fsGet(u.uid).then(function(data){
        if(data&&data.profile){
          setProfileRaw(data.profile);
          setRaceRaw(data.race||null);
          setStatsRaw(data.stats||{sessions:0,km:0,streak:0});
          var wb=data.wellbeing;
          setWellbeingRaw(wb&&wb.date===today?wb.data:null);
          setAuthState("app");
        } else {
          setAuthState("onboarding");
        }
      }).catch(function(){setAuthState("onboarding");});
    });
    return unsub;
  },[]);

  // ── Setters avec sync Firestore ──
  function setProfile(v){setProfileRaw(v);if(user)fsSave(user.uid,{profile:v});}
  function setRace(v){setRaceRaw(v);if(user)fsSave(user.uid,{race:v});}
  function setStats(fn){setStatsRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{stats:next});return next;});}
  function setWellbeing(wb){setWellbeingRaw(wb);if(user)fsSave(user.uid,{wellbeing:wb?{date:today,data:wb}:null});}

  function addSession(km){setStats(function(s){return{sessions:s.sessions+1,km:s.km+km,streak:s.streak+1};});}

  // ── Notifications ──
  useEffect(function(){
    if(!profile||!("Notification" in window))return;
    if(Notification.permission==="default")Notification.requestPermission();
    var lastNotif=ls("fr_last_notif","");
    var todayStr=new Date().toISOString().slice(0,10);
    if(lastNotif===todayStr||Notification.permission!=="granted")return;
    var hour=new Date().getHours();
    if(hour>=7&&hour<=10){lsSet("fr_last_notif",todayStr);new Notification("FuelRun",{body:"Consulte ton plan et prépare ta séance du jour !",icon:"/favicon.svg"});}
  },[profile]);

  if(authState==="loading")return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <RunnerHero size={64}/>
        <div style={{fontSize:14,color:MUT}}>Chargement…</div>
      </div>
    </div>
  );

  if(authState==="unauth")return <Splash/>;

  if(authState==="onboarding"){return <Onboarding onDone={function(d){
    var prof={name:d.name,age:d.age,weight:d.weight,height:d.height,sex:d.sex,level:d.level,sessWeek:d.sessWeek,kmWeek:d.kmWeek};
    setProfile(prof);setRace(d.race);
    if(user)fsSave(user.uid,{profile:prof,race:d.race||null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setAuthState("app");if(d.race)setTab("training");
    if(!ls("fr_guide_done",false))setTimeout(function(){setShowGuide(true);},800);
  }}/>;}

  if(!profile)return null;

  function handleReset(){
    if(user)fsSave(user.uid,{profile:null,race:null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setProfileRaw(null);setRaceRaw(null);setStatsRaw({sessions:0,km:0,streak:0});
    setTab("courses");
  }

  function renderTab(){
    if(tab==="home")     return <HomeScreen profile={profile} race={race} stats={stats} onCheckin={function(){setShowCheckin(true);}} wellbeing={wellbeing}/>;
    if(tab==="training") return <TrainingScreen profile={profile} race={race} onGoToCourses={function(){setTab("courses");}}/>;
    if(tab==="courses")  return <CoursesScreen profile={profile} race={race} setRace={function(r){setRace(r);if(r)setTimeout(function(){setTab("training");},300);}}/>;
    if(tab==="suivi")    return <SuiviScreen profile={profile} race={race} stats={stats} entries={entries} onSetEntries={setEntries} onAddSession={addSession} onOpenJournal={function(){setTab("journal");}}/>;
    if(tab==="journal")  return <JournalScreen race={race} entries={entries} onSetEntries={setEntries} onAddSession={addSession}/>;
    if(tab==="coach")    return <CoachScreen profile={profile} race={race}/>;
    if(tab==="profile")  return <ProfileScreen profile={profile} stats={stats} onUpdate={function(form){var updated=Object.assign({},profile,form);setProfile(updated);}} onNewRace={function(){setRace(null);if(user)fsSave(user.uid,{race:null});setTab("courses");}} onReset={handleReset} onSignOut={function(){signOut(auth);}} user={user}/>;
    return null;
  }

  return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",justifyContent:"center",overflowX:"hidden"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:430,background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>{renderTab()}</div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:SURF,borderTop:"1px solid "+BORD,display:"flex",zIndex:100,paddingBottom:4}}>
          {NAV.map(function(n){var active=tab===n.id;var color=active?OR:MUT;return(
            <button key={n.id} onClick={function(){setTab(n.id);}} style={{flex:1,padding:"8px 2px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",background:"none",border:"none",position:"relative"}}>
              {n.icon(color)}
              <span style={{fontSize:9,fontWeight:active?600:400,color:color,letterSpacing:0.2}}>{n.label}</span>
              {active?<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2.5,background:OR,borderRadius:"0 0 3px 3px"}}/>:null}
            </button>
          );})}
        </div>
      </div>
      {showCheckin?<CheckinModal onDone={function(wb){setWellbeing(wb);setShowCheckin(false);}} onClose={function(){setShowCheckin(false);}}/>:null}
      {showGuide?<OnboardingGuide onDone={function(){lsSet("fr_guide_done",true);setShowGuide(false);}} onTab={function(t){setTab(t);}}/>:null}
    </div>
  );
}