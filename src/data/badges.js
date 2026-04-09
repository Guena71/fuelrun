// Chaque badge : { id, emoji, name, desc, check(ctx) }
// ctx = { stats, entries, gamification, planWeeks, race }

export var BADGE_DEFS=[
  {
    id:"first_session",
    emoji:"👟",
    name:"Premier pas",
    desc:"Valide ta première séance",
    check:function(ctx){return ctx.stats.sessions>=1;},
  },
  {
    id:"session_5",
    emoji:"🔥",
    name:"5 séances",
    desc:"Complète 5 séances au total",
    check:function(ctx){return ctx.stats.sessions>=5;},
  },
  {
    id:"session_20",
    emoji:"💪",
    name:"20 séances",
    desc:"Complète 20 séances au total",
    check:function(ctx){return ctx.stats.sessions>=20;},
  },
  {
    id:"session_50",
    emoji:"🏅",
    name:"50 séances",
    desc:"Complète 50 séances — coureur confirmé",
    check:function(ctx){return ctx.stats.sessions>=50;},
  },
  {
    id:"streak_3",
    emoji:"⚡",
    name:"Enchaînement",
    desc:"3 jours de suite avec une séance",
    check:function(ctx){return ctx.stats.streak>=3;},
  },
  {
    id:"streak_7",
    emoji:"🌟",
    name:"Semaine parfaite",
    desc:"7 jours consécutifs de séances",
    check:function(ctx){return ctx.stats.streak>=7;},
  },
  {
    id:"km_100",
    emoji:"💯",
    name:"100 km",
    desc:"Cumule 100 km au compteur",
    check:function(ctx){return ctx.stats.km>=100;},
  },
  {
    id:"km_500",
    emoji:"🗺️",
    name:"500 km",
    desc:"Cumule 500 km — tu as fait le tour de la Bretagne",
    check:function(ctx){return ctx.stats.km>=500;},
  },
  {
    id:"km_1000",
    emoji:"🌍",
    name:"1 000 km",
    desc:"Cumule 1 000 km — une légende",
    check:function(ctx){return ctx.stats.km>=1000;},
  },
  {
    id:"contract_1",
    emoji:"🤝",
    name:"Parole tenue",
    desc:"Respecte ton premier contrat hebdomadaire",
    check:function(ctx){return (ctx.gamification.contractsKept||0)>=1;},
  },
  {
    id:"contract_4",
    emoji:"📋",
    name:"Régularité",
    desc:"Tiens 4 contrats hebdomadaires",
    check:function(ctx){return (ctx.gamification.contractsKept||0)>=4;},
  },
  {
    id:"boss_1",
    emoji:"💥",
    name:"Boss Slayer",
    desc:"Complète la session boss de la semaine",
    check:function(ctx){return (ctx.gamification.bossKills||0)>=1;},
  },
  {
    id:"boss_5",
    emoji:"🗡️",
    name:"Chasseur d'élite",
    desc:"Complète 5 sessions boss",
    check:function(ctx){return (ctx.gamification.bossKills||0)>=5;},
  },
  {
    id:"race_goal",
    emoji:"🏁",
    name:"Objectif atteint",
    desc:"Termine ta course objectif",
    check:function(ctx){
      if(!ctx.race)return false;
      var raceKey=new Date(ctx.race.date).toDateString();
      return !!(ctx.entries&&ctx.entries[raceKey]&&ctx.entries[raceKey].done);
    },
  },
  {
    id:"level_2",
    emoji:"🔥",
    name:"Coureur confirmé",
    desc:"Atteins le niveau Coureur (500 XP)",
    check:function(ctx){return (ctx.gamification.xp||0)>=500;},
  },
  {
    id:"level_3",
    emoji:"⚡",
    name:"Compétiteur",
    desc:"Atteins le niveau Compétiteur (1500 XP)",
    check:function(ctx){return (ctx.gamification.xp||0)>=1500;},
  },
  {
    id:"level_4",
    emoji:"🏆",
    name:"Elite",
    desc:"Atteins le niveau Elite (3500 XP)",
    check:function(ctx){return (ctx.gamification.xp||0)>=3500;},
  },
];
