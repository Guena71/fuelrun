// ─── XP par type de séance ───────────────────────────────────────────────────
var XP_BY_TYPE={
  easy:40, recovery:30, long:80, tempo:60, interval:70, race:120, rest:0
};

export function sessionXP(session){
  var base=XP_BY_TYPE[session.type]||40;
  var kmBonus=Math.floor((parseFloat(session.km)||0)*2);
  return base+kmBonus;
}

// ─── Niveaux ─────────────────────────────────────────────────────────────────
export var LEVELS=[
  {name:"Débutant",   emoji:"🌱", min:0,    max:499},
  {name:"Coureur",    emoji:"👟", min:500,  max:1499},
  {name:"Compétiteur",emoji:"🔥", min:1500, max:3499},
  {name:"Elite",      emoji:"⚡", min:3500, max:6999},
  {name:"Champion",   emoji:"🏆", min:7000, max:Infinity},
];

export function xpToLevel(xp){
  var lv=LEVELS.find(function(l){return xp>=l.min&&xp<=l.max;})||LEVELS[0];
  var idx=LEVELS.indexOf(lv);
  var next=LEVELS[idx+1]||null;
  var progress=next?Math.round(((xp-lv.min)/(next.min-lv.min))*100):100;
  return {name:lv.name,emoji:lv.emoji,xp:xp,progress:progress,nextXP:next?next.min:null,idx:idx};
}

// ─── Semaine ISO ──────────────────────────────────────────────────────────────
export function getWeekKey(date){
  var d=new Date(date||Date.now());
  d.setHours(0,0,0,0);
  var day=d.getDay()||7;
  d.setDate(d.getDate()+4-day);
  var y=d.getFullYear();
  var w=Math.ceil(((d-new Date(y,0,1))/86400000+1)/7);
  return y+"-W"+(w<10?"0":"")+w;
}

// ─── Session boss de la semaine (la plus longue) ──────────────────────────────
export function getBossSession(sessions){
  if(!sessions||!sessions.length)return null;
  return sessions.reduce(function(best,s){
    return (parseFloat(s.km)||0)>(parseFloat(best.km)||0)?s:best;
  },sessions[0]);
}

// ─── Badges : vérifier les nouveaux ──────────────────────────────────────────
import { BADGE_DEFS } from "../data/badges.js";

export function checkNewBadges(ctx){
  // ctx: { stats, entries, gamification, planWeeks, race }
  var earned=ctx.gamification.badges.map(function(b){return b.id;});
  var newBadges=[];
  BADGE_DEFS.forEach(function(def){
    if(earned.includes(def.id))return;
    if(def.check(ctx))newBadges.push({id:def.id,earnedAt:Date.now()});
  });
  return newBadges;
}

// ─── Clé semaine courante ─────────────────────────────────────────────────────
export function getWeeklyContractKey(){return getWeekKey();}

// ─── Séances validées cette semaine ──────────────────────────────────────────
export function contractProgress(entries,weekKey){
  var count=0;
  var wStart=weekKeyToMonday(weekKey);
  var wEnd=new Date(wStart);wEnd.setDate(wEnd.getDate()+6);
  Object.entries(entries||{}).forEach(function(pair){
    var d=new Date(pair[0]);
    if(pair[1].done&&d>=wStart&&d<=wEnd)count++;
  });
  return count;
}

// ─── Km cumulés cette semaine ─────────────────────────────────────────────────
export function weeklyKm(entries,weekKey){
  var wStart=weekKeyToMonday(weekKey);
  var wEnd=new Date(wStart);wEnd.setDate(wEnd.getDate()+6);
  var total=0;
  Object.entries(entries||{}).forEach(function(pair){
    var d=new Date(pair[0]);
    if(pair[1].done&&d>=wStart&&d<=wEnd)total+=parseFloat(pair[1].km)||0;
  });
  return Math.round(total*10)/10;
}

// ─── Challenge hebdomadaire auto ──────────────────────────────────────────────
var CHALLENGE_POOL=[
  {type:"sessions",icon:"🏃",xp:60, label:function(t){return t+" séances cette semaine";},       targets:{débutant:2,intermédiaire:3,avancé:4}},
  {type:"km",      icon:"📏",xp:80, label:function(t){return "Cumule "+t+" km cette semaine";},   targets:{débutant:12,intermédiaire:25,avancé:40}},
  {type:"sessions",icon:"💪",xp:75, label:function(t){return t+" séances — tiens la cadence !";}, targets:{débutant:3,intermédiaire:4,avancé:5}},
  {type:"km",      icon:"🗺️",xp:90, label:function(t){return "Dépasse les "+t+" km au compteur";},targets:{débutant:15,intermédiaire:30,avancé:50}},
];

export function generateWeeklyChallenge(profile,weekKey){
  var wn=parseInt((weekKey||"").split("-W")[1])||1;
  var def=CHALLENGE_POOL[wn%CHALLENGE_POOL.length];
  var lvl=(profile&&profile.level)||"débutant";
  var target=def.targets[lvl]||def.targets["débutant"];
  return {weekKey:weekKey,type:def.type,icon:def.icon,label:def.label(target),target:target,xp:def.xp};
}

export function challengeProgress(entries,weekKey,challenge){
  if(!challenge)return 0;
  if(challenge.type==="km")return weeklyKm(entries,weekKey);
  return contractProgress(entries,weekKey);
}

function weekKeyToMonday(key){
  var parts=key.split("-W");
  var y=parseInt(parts[0]);var w=parseInt(parts[1]);
  var jan4=new Date(y,0,4);
  var dayOfWeek=jan4.getDay()||7;
  var monday=new Date(jan4);
  monday.setDate(jan4.getDate()-dayOfWeek+1+(w-1)*7);
  monday.setHours(0,0,0,0);
  return monday;
}
