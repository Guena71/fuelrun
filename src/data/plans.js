import { SUB, BL, OR } from "./constants.js";

export var PLANS=[
  {
    id:"gratuit", name:"Gratuit", price:"0", per:"toujours", color:SUB, tag:null,
    desc:"Commence à t'entraîner, découvre les fonctionnalités.",
    items:[
      "Essais inclus :",
      "3 premières semaines de plan d'entraînement offertes",
      "Recettes et nutrition complète pendant 14 jours offerts",
      "Après l'essai :",
      "1 objectif de course",
      "Nutrition du jour (calories et macros)",
      "Journal des séances",
      "5 messages Coach IA par jour",
    ],
    cta:"Commencer gratuitement"
  },
  {
    id:"essential", name:"Essential", price:"4,99", per:"/mois", color:BL, tag:"Populaire",
    desc:"Le suivi complet pour progresser régulièrement.",
    items:[
      "14 jours gratuits, puis 4,99 € par mois :",
      "Courses et objectifs illimités",
      "Plan d'entraînement complet sur toutes les semaines",
      "Journal avec suivi de la fatigue et de l'effort perçu",
      "Nutrition du jour pour toutes tes courses",
      "30 messages Coach IA par jour",
      "Import de tracés GPS (Garmin, Polar, Wahoo…)",
    ],
    cta:"Essayer 14 jours gratuit"
  },
  {
    id:"pro", name:"Pro", price:"9,99", per:"/mois", color:OR, tag:"Recommandé",
    desc:"La préparation complète pour performer en compétition.",
    items:[
      "14 jours gratuits, puis 9,99 € par mois :",
      "Tout Essential, plus :",
      "Coach IA illimité 24h sur 24",
      "Allures personnalisées et zones d'entraînement",
      "Stratégie de course et temps par kilomètre",
      "Recettes premium et plans repas sur-mesure",
      "Prédictions de temps et analyse de performance détaillée",
    ],
    cta:"Essayer 14 jours gratuit"
  }
];
