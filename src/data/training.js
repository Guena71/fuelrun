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

export var TYPE_COLORS={easy:GR,interval:BL,tempo:YE,long:OR,recovery:MUT,race:OR,strength:"#A855F7"};

export var STRENGTH_SESSIONS={
  starter:[
    {name:"Gainage débutant",duration:"20 min",desc:"Renforce les muscles stabilisateurs pour prévenir les blessures.",exercises:[
      {name:"Planche avant",sets:"3×20 s",tip:"Dos plat, abdos gainés, respire normalement."},
      {name:"Planche latérale",sets:"3×15 s chaque côté",tip:"Hanches alignées, ne laisse pas le bassin tomber."},
      {name:"Pont fessier",sets:"3×12 rép",tip:"Pousse dans les talons, contracte les fessiers en haut."},
      {name:"Bird-dog",sets:"3×8 rép chaque côté",tip:"Allonge bras et jambe opposés simultanément, ventre rentré."},
      {name:"Dead bug",sets:"3×8 rép chaque côté",tip:"Dos plaqué au sol, abaisse lentement bras et jambe."}
    ]},
    {name:"Renforcement membres inférieurs",duration:"25 min",desc:"Isole les muscles propulseurs du coureur.",exercises:[
      {name:"Squat au poids du corps",sets:"3×15 rép",tip:"Pieds écartés largeur d'épaules, genoux dans l'axe des orteils."},
      {name:"Fente avant alternée",sets:"3×10 rép/jambe",tip:"Grand pas en avant, genou arrière proche du sol."},
      {name:"Élévation de mollets",sets:"3×20 rép",tip:"Montée lente, descente contrôlée, cherche l'amplitude max."},
      {name:"Hip hinge",sets:"3×12 rép",tip:"Pousse les hanches vers l'arrière, dos droit, regard au sol."},
      {name:"Fente latérale",sets:"3×8 rép/côté",tip:"Pied d'appui stable, descend sur un genou fléchi."}
    ]}
  ],
  beginner:[
    {name:"Circuit force — tronc et hanches",duration:"30 min",desc:"Améliore la stabilité du bassin et la tenue en fin de course.",exercises:[
      {name:"Planche dynamique",sets:"3×30 s",tip:"Déplace les mains d'avant en arrière en gardant les hanches stables."},
      {name:"Squat sauté",sets:"3×10 rép",tip:"Réception douce, genoux légèrement fléchis."},
      {name:"Abduction hanches",sets:"3×15 rép/côté",tip:"Mouvement contrôlé, ne laisse pas l'élastique claquer."},
      {name:"Step-up sur chaise",sets:"3×12 rép/jambe",tip:"Pousse sur la jambe d'appui, garde le buste droit."},
      {name:"Superman",sets:"3×10 rép",tip:"Soulève bras et jambes simultanément, maintiens 2 s en haut."}
    ]},
    {name:"Gainage avancé",duration:"30 min",desc:"Prépare le corps aux charges de l'entraînement intermédiaire.",exercises:[
      {name:"Planche avec rotation",sets:"3×8/côté",tip:"Rotation contrôlée des hanches, garde les épaules stables."},
      {name:"Nordic curl assisté",sets:"3×5 rép",tip:"Descente lente (3 s), utilise les mains pour remonter si besoin."},
      {name:"Glute bridge unilatéral",sets:"3×10/jambe",tip:"Hanches parallèles au sol, contracte le fessier en haut."},
      {name:"Wall sit",sets:"3×30 s",tip:"Cuisses parallèles au sol, dos plaqué au mur."},
      {name:"Bear crawl",sets:"3×10 m",tip:"Genoux à 2 cm du sol, avance en croisant bras/jambes opposés."}
    ]}
  ],
  intermediate:[
    {name:"Force fonctionnelle",duration:"35 min",desc:"Développe la puissance propulsive et l'économie de course.",exercises:[
      {name:"Goblet squat",sets:"4×12 rép",tip:"Coudes pointés vers le bas, descend jusqu'à ce que les coudes touchent les genoux."},
      {name:"Fente bulgare",sets:"4×8 rép/jambe",tip:"Pied arrière sur un banc, descend lentement sur 3 s."},
      {name:"Deadlift roumain",sets:"4×10 rép",tip:"Dos neutre, charge proche des jambes, poussée des hanches vers l'avant."},
      {name:"Pistol squat progressif",sets:"3×6 rép/jambe",tip:"Utilise une chaise pour l'équilibre si besoin."},
      {name:"Box jump",sets:"4×8 rép",tip:"Réception en douceur avec les deux pieds, genoux fléchis."}
    ]},
    {name:"Circuit HIIT — puissance",duration:"35 min",desc:"Améliore la vitesse de pointe et la résistance à la fatigue.",exercises:[
      {name:"Burpee avec saut",sets:"4×8 rép",tip:"Enchaîne le burpee et un sprint de 5 m."},
      {name:"Mountain climber rapide",sets:"4×20 s",tip:"Vitesse maximale, hanches basses, core engagé."},
      {name:"Planche pike",sets:"3×10 rép",tip:"Monte les hanches vers le haut en gardant les jambes tendues."},
      {name:"Squat jump avec pause",sets:"4×8 rép",tip:"Descend lentement (3 s), explose vers le haut."},
      {name:"Copenhagen plank",sets:"3×20 s/côté",tip:"Appuie le pied intérieur sur le banc, soulève la hanche."}
    ]}
  ],
  advanced:[
    {name:"Force maximale coureur",duration:"45 min",desc:"Gains de force spécifiques qui se traduisent en vitesse de course.",exercises:[
      {name:"Back squat",sets:"5×5 rép (85% 1RM)",tip:"Descend sous le parallèle, explosivité à la montée."},
      {name:"Deadlift conventionnel",sets:"4×4 rép (87% 1RM)",tip:"Dos neutre du sol à la hanche."},
      {name:"Hip thrust lourd",sets:"4×8 rép",tip:"Épaules sur un banc, poussée explosive en haut."},
      {name:"Nordic curl",sets:"4×6 rép",tip:"Ischio-jambiers excentriques — prévention blessures clé."},
      {name:"Single leg RDL",sets:"3×8/jambe",tip:"Équilibre et force simultanément — essentiel pour la foulée."}
    ]},
    {name:"Pliométrie avancée",duration:"40 min",desc:"Développe la raideur tendineuse et le cycle étirement-détente.",exercises:[
      {name:"Drop jump",sets:"5×6 rép",tip:"Tombe d'une boîte, rebondit immédiatement — contact minimal avec le sol."},
      {name:"Bounding",sets:"4×20 m",tip:"Grandes foulées bondissantes, cherche la distance à chaque appui."},
      {name:"Skipping A avancé",sets:"4×20 m",tip:"Montée de genoux explosive, bras en opposition."},
      {name:"Lateral bound",sets:"4×8 rép/côté",tip:"Sauts latéraux sur une jambe, stabilise à chaque réception."},
      {name:"Depth jump",sets:"4×5 rép",tip:"Saute d'une boîte haute, rebond immédiat le plus haut possible."}
    ]}
  ],
  expert:[
    {name:"Force olympique",duration:"50 min",desc:"Programme élite pour optimiser l'économie et la vitesse maximale.",exercises:[
      {name:"Power clean",sets:"5×3 rép (75% 1RM)",tip:"Mouvement explosif du sol à la position de catch — technique avant tout."},
      {name:"Back squat lourd",sets:"5×3 rép (90% 1RM)",tip:"Tempo 31X0 — descend 3 s, explose à la montée."},
      {name:"Hip thrust barre",sets:"4×6 rép",tip:"Pause 1 s en haut pour maximiser l'activation des fessiers."},
      {name:"Nordic curl lesté",sets:"4×6 rép",tip:"Charge additionnelle pour progresser sur l'excentrique."},
      {name:"Single leg box squat",sets:"4×6 rép/jambe",tip:"Descend en contrôle total sur une boîte basse."}
    ]},
    {name:"Pliométrie élite",duration:"45 min",desc:"Développe le cycle élastique et la résistance neuromusculaire.",exercises:[
      {name:"Bounding avec parachute",sets:"5×30 m",tip:"Résistance légère — focus sur la poussée au sol."},
      {name:"Reactive drop jump",sets:"5×5 rép",tip:"Rebond en moins de 150 ms."},
      {name:"Bulgarian split squat sauté",sets:"4×6/jambe",tip:"Explosive en montée, contrôlée en descente (3 s)."},
      {name:"Pallof press",sets:"3×12/côté",tip:"Résistance rotative — stabilité à haute vitesse."},
      {name:"Copenhagen plank avec abduction",sets:"3×30 s/côté",tip:"Lève la jambe inférieure pour surcharger les adducteurs."}
    ]}
  ]
};
