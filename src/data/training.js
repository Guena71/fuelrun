import { GR, BL, OR, YE, MUT } from "./constants.js";

// ── Tables de planification ──────────────────────────────────────────────
export var DIST_BRACKETS=[10,21,42,80,999];
export var IDEAL_WEEKS_TABLE={starter:[12,18,24,32,36],beginner:[10,14,20,28,32],intermediate:[8,12,16,22,28],advanced:[6,10,14,18,24],expert:[6,8,12,16,20]};
export var PEAK_KM_TABLE={starter:[35,45,55,70,80],beginner:[45,55,65,85,100],intermediate:[55,65,80,100,120],advanced:[65,75,95,120,150],expert:[75,90,110,140,180]};

// ── Niveaux ──────────────────────────────────────────────────────────────
export var LEVELS=[
  {id:"starter",  label:"Je démarre",    sub:"Mes premiers kilomètres",           emoji:"🌱"},
  {id:"beginner", label:"Débutant",       sub:"Moins d'un an de pratique",         emoji:"🏃"},
  {id:"intermediate",label:"Intermédiaire",sub:"1 à 3 ans, quelques courses",      emoji:"🔥"},
  {id:"advanced", label:"Avancé",         sub:"Compétiteur régulier",              emoji:"⚡"},
  {id:"expert",   label:"Expert",         sub:"Performances de haut niveau",       emoji:"🏆"}
];
export var LEVEL_LABELS={starter:"Démarrage",beginner:"Débutant",intermediate:"Intermédiaire",advanced:"Avancé",expert:"Expert"};

// ── Allures par niveau ───────────────────────────────────────────────────
export var PACES={
  starter:    {easy:"8:00",tempo:"7:00",interval:"6:30",long:"8:30",recovery:"9:00"},
  beginner:   {easy:"6:30",tempo:"5:45",interval:"5:15",long:"7:00",recovery:"7:30"},
  intermediate:{easy:"5:30",tempo:"4:50",interval:"4:20",long:"5:50",recovery:"6:20"},
  advanced:   {easy:"4:50",tempo:"4:10",interval:"3:45",long:"5:10",recovery:"5:30"},
  expert:     {easy:"4:20",tempo:"3:45",interval:"3:20",long:"4:40",recovery:"5:00"}
};

// ── Phases d'entraînement ────────────────────────────────────────────────
export var PHASE_DEFS=[
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

export var TYPE_COLORS={easy:GR,interval:BL,tempo:YE,long:OR,recovery:MUT,race:OR};
