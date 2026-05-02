import { SUB, BL, OR } from "./constants.js";

export var PLANS=[
  {
    id:"gratuit", name:"Gratuit", price:"0", per:"toujours", color:SUB, tag:null,
    desc:"Découvre FuelRun et commence à t'entraîner.",
    items:[
      "3 premières semaines de plan d'entraînement",
      "1 objectif de course",
      "Journal des séances",
      "Points, badges et défis hebdomadaires",
      "7 messages Coach par jour",
    ],
    cta:"Commencer gratuitement"
  },
  {
    id:"essential", name:"Essentiel", price:"6,99", per:"/mois", color:BL, tag:"Populaire",
    desc:"Le suivi complet pour progresser régulièrement.",
    items:[
      "14 jours gratuits, puis 6,99 € / mois :",
      "Plan d'entraînement complet (toutes les semaines)",
      "Objectifs de course illimités",
      "Synchronisation Strava automatique",
      "Import tracés GPS (Garmin, Polar, Wahoo…)",
      "Score de forme et adaptation du plan",
      "Conseil du jour + récap hebdomadaire Coach",
      "30 messages Coach par jour",
    ],
    cta:"Essayer 14 jours gratuit"
  },
  {
    id:"pro", name:"Pro", price:"12,99", per:"/mois", color:OR, tag:"Recommandé",
    desc:"La préparation complète pour performer en compétition.",
    items:[
      "14 jours gratuits, puis 12,99 € / mois :",
      "Tout Essentiel, plus :",
      "Coach illimité 24h/24",
      "Calibration de tes allures de course (méthode scientifique)",
      "Stratégie de course et temps de passage",
      "Analyse IA automatique après chaque séance",
      "Recettes et plans repas sur-mesure",
    ],
    cta:"Essayer 14 jours gratuit"
  }
];
