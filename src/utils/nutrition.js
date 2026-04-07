import { MEALS_MAP } from "../data/meals.js";

export var RECIPES_TRIAL_DAYS=14;

export function getRecipesTrial(){
  var key="fr_recipes_trial_start";
  var stored=localStorage.getItem(key);
  if(!stored){var now=Date.now();localStorage.setItem(key,now);return{active:true,daysLeft:RECIPES_TRIAL_DAYS};}
  var elapsed=Math.floor((Date.now()-parseInt(stored,10))/(1000*60*60*24));
  var left=Math.max(0,RECIPES_TRIAL_DAYS-elapsed);
  return{active:left>0,daysLeft:left};
}

export function planLevel(profile){
  var p=(profile&&profile.plan)||"gratuit";
  if(p==="elite"||p==="pro")return 2;
  if(p==="essential")return 1;
  return 0;
}

export function calcNutrition(profile,sessType){
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
