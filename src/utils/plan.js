import { DIST_BRACKETS, IDEAL_WEEKS_TABLE, PEAK_KM_TABLE, PHASE_DEFS, PACES } from "../data/training.js";
import { YE } from "../data/constants.js";
import { addDays, startOfWeek, weeksUntil, getToday } from "./date.js";

export function idealPlanWeeks(dist,level){var row=IDEAL_WEEKS_TABLE[level]||IDEAL_WEEKS_TABLE.beginner;for(var i=0;i<DIST_BRACKETS.length;i++){if(dist<=DIST_BRACKETS[i])return row[i];}return row[row.length-1];}
export function getPeakKm(dist,level){var row=PEAK_KM_TABLE[level]||PEAK_KM_TABLE.beginner;for(var i=0;i<DIST_BRACKETS.length;i++){if(dist<=DIST_BRACKETS[i])return row[i];}return row[row.length-1];}
export function getPlanWeeks(plan){if(!plan||plan.tooShort||!Array.isArray(plan.weeks))return [];return plan.weeks;}

export function getCourseReadiness(race,profile,weeksUntilFn){
  var lvl=(profile&&profile.level)||"beginner";
  var dist=race.dist||42;
  var av=weeksUntilFn(race.date);
  var ideal=idealPlanWeeks(dist,lvl);
  var RE="#EF4444",YE2="#F59E0B",GR="#22C55E";
  if(av<4)           return{color:RE,icon:"🔴",label:"Trop proche",         msg:"Moins de 4 semaines."};
  if(av<ideal*0.5)   return{color:RE,icon:"🔴",label:"Délai insuffisant",   msg:"Il faudrait au moins "+ideal+" semaines."};
  if(av<ideal*0.8)   return{color:YE2,icon:"🟡",label:"Faisable avec effort",msg:"Délai serré ("+av+" sem. sur "+ideal+" idéales)."};
  return              {color:GR,icon:"🟢",label:"Objectif réalisable",      msg:"Profil et délai compatibles !"};
}

export function buildPlan(race,profile){
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
      var _today=getToday();allWeeks.push({num:wi+1,total:totalWeeks,idealWeeks:idealWeeks,availWeeks:availWeeks,phase:phaseId,phaseLabel:phase.label,phaseColor:phase.color,weekStart:wStart,weekEnd:addDays(wStart,6),km:realKm,isRecup:isRecup,isCurrent:wStart.toDateString()===startOfWeek(_today).toDateString(),isPast:addDays(wStart,6)<_today,sessions:sessions});
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
    var _today2=getToday();allWeeks.push({num:wi+1,total:totalWeeks,idealWeeks:idealWeeks,availWeeks:availWeeks,phase:"taper",phaseLabel:"Affûtage",phaseColor:YE,weekStart:wStart2,weekEnd:addDays(wStart2,6),km:realKm2,isRecup:false,isCurrent:wStart2.toDateString()===startOfWeek(_today2).toDateString(),isPast:addDays(wStart2,6)<_today2,sessions:sessions2});
    wi++;
  }
  return{weeks:allWeeks,planStart:planStart,raceDate:raceDate,idealWeeks:idealWeeks,availWeeks:availWeeks};
}
