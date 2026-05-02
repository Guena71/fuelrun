// IF proxy from RPE (1→0.55, 5→0.75, 10→1.0)
function sessIF(rpe){return 0.5+Math.max(1,Math.min(10,parseInt(rpe)||5))*0.05;}

// TSS = (duration_min × IF²) / 60 × 100
function sessTSS(km,durationMin,rpe){
  var IF=sessIF(rpe);
  var dur=durationMin?parseFloat(durationMin):(km>0?km/10*60:30);
  return dur*IF*IF/60*100;
}

// {dateString: TSS} from entries journal
function buildDailyTSS(entries){
  var map={};
  Object.entries(entries||{}).forEach(function(pair){
    var key=pair[0],entry=pair[1];
    if(!entry.done)return;
    var km=parseFloat(entry.km)||0;
    var min=parseFloat(entry.min)||0;
    if(km===0&&min===0)return;
    map[key]=(map[key]||0)+sessTSS(km,min,entry.rpe);
  });
  return map;
}

// CTL = 42-day EMA of daily TSS (fitness/forme de base)
// ATL = 7-day EMA of daily TSS (fatigue récente)
// TSB = CTL - ATL (fraîcheur: positive = reposé, negative = chargé)
function computeLoad(dtss){
  var today=new Date();today.setHours(0,0,0,0);
  var CTL=0,ATL=0;
  for(var i=89;i>=0;i--){
    var d=new Date(today);d.setDate(d.getDate()-i);
    var tss=dtss[d.toDateString()]||0;
    CTL+=(tss-CTL)/42;
    ATL+=(tss-ATL)/7;
  }
  return{CTL:Math.round(CTL),ATL:Math.round(ATL),TSB:Math.round(CTL-ATL)};
}

// Execution rate: % of past plan sessions actually logged (last N weeks)
function computeExecRate(entries,planWeeks,n){
  var nW=n||4;
  var pastW=planWeeks.filter(function(wk){return wk.isPast;}).slice(-nW);
  var planned=0,done=0;
  pastW.forEach(function(wk){
    wk.sessions.forEach(function(s){
      if(!s.date||s.type==="rest"||s.type==="race")return;
      planned++;
      var e=entries[s.date.toDateString()];
      if(e&&e.done)done++;
    });
  });
  return planned===0?null:Math.round(done/planned*100);
}

// Adaptation factor: 1.0 = no change, <1.0 = reduce volume, >1.0 = increase
function computeFactor(tsb,execRate,wellbeingPct){
  var f=1.0;
  if(tsb<-30)f*=0.70;
  else if(tsb<-20)f*=0.82;
  else if(tsb<-10)f*=0.92;
  else if(tsb>30)f*=1.12;
  else if(tsb>15)f*=1.06;
  if(execRate!==null){
    if(execRate<50)f*=0.85;
    else if(execRate<70)f*=0.93;
    else if(execRate>=90)f*=1.05;
  }
  if(wellbeingPct!=null){
    if(wellbeingPct<=0.4)f*=0.82;
    else if(wellbeingPct<=0.6)f*=0.93;
    else if(wellbeingPct>=0.85)f*=1.04;
  }
  return Math.round(f*100)/100;
}

// Main function: returns {CTL, ATL, TSB, execRate, factor}
export function computeAdaptive(entries,planWeeks,wellbeingPct){
  var dtss=buildDailyTSS(entries);
  var load=computeLoad(dtss);
  var rate=computeExecRate(entries,planWeeks,4);
  var factor=computeFactor(load.TSB,rate,wellbeingPct);
  return{CTL:load.CTL,ATL:load.ATL,TSB:load.TSB,execRate:rate,factor:factor};
}

// Hydration target for a session (in ml)
export function sessionHydration(weightKg,sessionKm){
  var w=parseFloat(weightKg)||70;
  var km=parseFloat(sessionKm)||0;
  var base=Math.round(w*35/100)*100; // round to 100ml
  var running=Math.round(km*55/50)*50; // ~55ml/km, round to 50ml
  return{dailyMl:base+running,duringMl:running};
}
