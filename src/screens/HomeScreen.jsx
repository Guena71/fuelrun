import { useState, useEffect, useMemo } from "react";
import { BG, SURF, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { TYPE_COLORS } from "../data/training.js";
import { weeksUntil, fmtS, durStr } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { weatherAdvice } from "../utils/weather.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { xpToLevel, getWeeklyContractKey, generateWeeklyChallenge, challengeProgress } from "../utils/gamification.js";
import { shareChallenge, shareRun } from "../utils/share.js";
import { planLevel } from "../utils/nutrition.js";
import { computeAdaptive } from "../utils/adaptive.js";

function wIcon(code){return code===0?"☀️":code<=3?"⛅":code<=48?"🌫️":code<=65?"🌧️":code<=77?"❄️":code<=82?"🌦️":"⛈️";}
function calcStreak(entries){var s=0,d=new Date();d.setHours(0,0,0,0);while(true){var k=d.toDateString();if(entries&&entries[k]&&entries[k].done){s++;d.setDate(d.getDate()-1);}else break;}return s;}

export function HomeScreen(p){
  var [weather,setWeather]=useState(null);
  var [hourly,setHourly]=useState(null);
  var [showWeather,setShowWeather]=useState(false);
  var [raceDayExpanded,setRaceDayExpanded]=useState(false);
  var gam=p.gamification||{xp:0,badges:[],contractsKept:0,bossKills:0};
  var level=xpToLevel(gam.xp||0);
  var weekKey=getWeeklyContractKey();
  var challenge=generateWeeklyChallenge(p.profile||{},weekKey);
  var chalDone=challengeProgress(p.entries||{},weekKey,challenge);
  var chalCompleted=chalDone>=challenge.target;
  var todayKey=new Date().toDateString();
  var todayDone=!!(p.entries&&p.entries[todayKey]&&p.entries[todayKey].done);

  useEffect(function(){
    var el=document.getElementById("main-scroll");
    if(!el)return;
    if(showWeather){el.style.overflow="hidden";el.style.touchAction="none";}
    else{el.style.overflow="";el.style.touchAction="";}
    return function(){el.style.overflow="";el.style.touchAction="";};
  },[showWeather]);

  useEffect(function(){
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(function(pos){
      var la=pos.coords.latitude.toFixed(4),lo=pos.coords.longitude.toFixed(4);
      fetch("https://api.open-meteo.com/v1/forecast?latitude="+la+"&longitude="+lo+"&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m&forecast_days=2&timezone=auto")
        .then(function(r){return r.json();})
        .then(function(d){
          if(d&&d.current)setWeather(d.current);
          if(d&&d.hourly)setHourly(d.hourly);
        }).catch(function(){});
    },function(){},{timeout:5000,maximumAge:300000});
  },[]);

  var _planDay=new Date(new Date().setHours(0,0,0,0)).toDateString();
  var plan=useMemo(function(){return p.race?buildPlan(p.race,p.profile):null;},[p.race,p.profile,_planDay]);
  var planWeeks=getPlanWeeks(plan);
  var raceWeeks=p.race?weeksUntil(p.race.date):null;
  var raceCol=p.race&&p.race.type==="trail"?GR:BL;
  var hour=new Date().getHours();
  var greeting=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";

  var curWeek=null;
  for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){curWeek=planWeeks[ci];break;}}
  if(!curWeek){for(var ci2=0;ci2<planWeeks.length;ci2++){if(!planWeeks[ci2].isPast){curWeek=planWeeks[ci2];break;}}}
  var nextSess=curWeek&&curWeek.sessions&&curWeek.sessions.length>0?curWeek.sessions.find(function(s){return s.type!=="rest";})||null:null;
  var sessType=nextSess?nextSess.type:"easy";
  var sessCol=TYPE_COLORS[sessType]||OR;

  var wpct=null;
  if(p.wellbeing){var wt=0;Object.values(p.wellbeing).forEach(function(v){wt+=v;});wpct=wt/16;}
  var wba=null;
  if(wpct!==null){
    var plannedLabel=nextSess?nextSess.label:"la séance prévue";
    if(wpct<=0.4){wba={text:"Repos conseillé",sub:"Fatigue détectée — récupération active recommandée.",icon:"🛌",color:RE,bg:RE+"12"};}
    else if(wpct<=0.6){wba={text:"Séance allégée",sub:"Réduis l'intensité de "+plannedLabel+" de 20–30%.",icon:"🚶",color:YE,bg:YE+"12"};}
    else if(wpct<=0.8){wba={text:"Bonne forme",sub:plannedLabel+" comme prévu. Tu es prêt.",icon:"✅",color:BL,bg:BL+"12"};}
    else{wba={text:"Super forme !",sub:"Parfait pour "+plannedLabel+" — donne tout.",icon:"🚀",color:GR,bg:GR+"12"};}
  }

  // Séance ajustée selon wellbeing
  var displaySess=nextSess;
  var sessAdjustedNote=null;
  if(nextSess&&wpct!==null&&wpct<0.6){
    var adjFactor=wpct<=0.4?0.3:0.7;
    var adjKm=Math.max(2,Math.round(nextSess.km*adjFactor));
    displaySess=Object.assign({},nextSess,{label:wpct<=0.4?"Repos actif recommandé":nextSess.label+" (allégé)",km:adjKm});
    sessAdjustedNote=wpct<=0.4?"Ton bilan : remplace la séance par "+adjKm+"km très facile":"Ton bilan : réduis à "+adjKm+"km aujourd'hui";
  }

  // Taper detection
  var isTaper=curWeek&&curWeek.phase==="taper";

  var raceProgress=p.race&&planWeeks.length>0?Math.max(2,Math.min(100,Math.round((1-raceWeeks/planWeeks.length)*100))):0;
  var streak=calcStreak(p.entries);

  // Race day detection
  var raceDay=p.race&&p.race.date&&new Date(p.race.date).toDateString()===new Date().toDateString();

  // Adaptive algorithm metrics (Pro)
  var adaptive=useMemo(function(){
    if(planLevel(p.profile)<2)return null;
    return computeAdaptive(p.entries||{},planWeeks,wpct);
  },[p.entries,planWeeks,wpct,p.profile]);

  // Score de forme / fatigue
  var fatigueScore=useMemo(function(){
    var td=new Date();td.setHours(0,0,0,0);
    var dow=td.getDay()===0?6:td.getDay()-1;
    var wkStart=new Date(td);wkStart.setDate(wkStart.getDate()-dow);
    var weekKms=[];
    for(var i=1;i<=3;i++){
      var wS=new Date(wkStart);wS.setDate(wS.getDate()-i*7);
      var wE=new Date(wS);wE.setDate(wE.getDate()+6);
      var wkm=0;
      Object.entries(p.entries||{}).forEach(function(pair){var d=new Date(pair[0]);if(pair[1].done&&d>=wS&&d<=wE)wkm+=parseFloat(pair[1].km)||0;});
      weekKms.push(wkm);
    }
    var rpeVals=Object.entries(p.entries||{}).filter(function(e){return e[1].done&&e[1].rpe;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);}).slice(0,5).map(function(e){return parseInt(e[1].rpe)||5;});
    var avgRpe=rpeVals.length?rpeVals.reduce(function(s,v){return s+v;},0)/rpeVals.length:5;
    var target=parseFloat((p.profile&&p.profile.kmWeek)||25);
    var nonZero=weekKms.filter(function(k){return k>0;});
    if(nonZero.length===0)return null;
    var avgKm=weekKms.reduce(function(s,v){return s+v;},0)/3;
    var ratio=target>0?avgKm/target:0;
    if(ratio>1.15&&avgRpe>=7.5)return{label:"Surcharge",color:RE,dot:"🔴",detail:"Volume élevé + effort intense — récupération nécessaire"};
    if(ratio>=0.8&&avgRpe<=7)return{label:"En forme",color:GR,dot:"🟢",detail:"Volume et effort bien équilibrés"};
    if(ratio<0.5)return{label:"Repos",color:BL,dot:"🔵",detail:"Volume faible ces dernières semaines"};
    return{label:"Surveille-toi",color:YE,dot:"🟡",detail:"Signes de fatigue possibles"};
  },[p.entries,p.profile]);

  return(
    <><div style={{paddingBottom:8}}>
      <LogoBar profile={p.profile} onProfile={function(){p.onGoToProfile&&p.onGoToProfile();}} onSignOut={p.onSignOut}/>

      {/* ── Hero header ───────────────────────────────── */}
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(150deg,#1c0f00 0%,#110900 45%,"+BG+" 100%)",padding:"16px 20px 20px"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:OR,opacity:0.05,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontSize:12,color:OR,fontWeight:600,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>{greeting}</div>
            <div style={{fontSize:28,fontWeight:800,color:TXT,letterSpacing:"-0.5px",lineHeight:1}}>{p.profile.name||"Champion"}</div>
          </div>
          {(function(){
            var now=new Date();
            var dayStr=now.toLocaleDateString("fr-FR",{weekday:"short"});
            var dateStr=now.toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
            var adv=weather?weatherAdvice(weather.weathercode||0,weather.temperature_2m||15,weather.windspeed_10m||0):null;
            return(
              <div onClick={adv?function(){setShowWeather(true);}:null} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:14,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",whiteSpace:"nowrap",cursor:adv?"pointer":"default"}}>
                <span style={{fontSize:13,fontWeight:600,color:OR,textTransform:"capitalize"}}>{dayStr}</span>
                <span style={{fontSize:13,fontWeight:700,color:TXT}}>{dateStr}</span>
                {adv&&<><span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>·</span><span style={{fontSize:20,lineHeight:1}}>{adv.icon}</span><span style={{fontSize:14,fontWeight:700,color:TXT}}>{Math.round(weather.temperature_2m||0)}°</span></>}
              </div>
            );
          })()}
        </div>

        {/* Badges */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {(function(){var lvl=planLevel(p.profile);var col=lvl>=2?OR:lvl>=1?BL:MUT;var label=lvl>=2?"Pro":lvl>=1?"Essentiel":"Gratuit";return(<span style={{fontSize:10,fontWeight:700,color:col,background:col+"18",border:"1px solid "+col+"44",borderRadius:20,padding:"3px 10px",textTransform:"uppercase",letterSpacing:0.8}}>{label}</span>);})()}
          {p.profile&&p.profile.vdotPaces&&<span style={{fontSize:10,fontWeight:700,color:GR,background:GR+"18",border:"1px solid "+GR+"44",borderRadius:20,padding:"3px 10px",letterSpacing:0.5}}>⚡ Mes allures</span>}
          {isTaper&&<span style={{fontSize:10,fontWeight:700,color:YE,background:YE+"18",border:"1px solid "+YE+"44",borderRadius:20,padding:"3px 10px",letterSpacing:0.5}}>🎯 Affûtage</span>}
        </div>

        {/* Streak + XP bar */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
            <span style={{fontSize:13}}>{level.emoji}</span>
            <span style={{fontSize:15,fontWeight:800,color:YE,lineHeight:1}}>{streak}</span>
            <span style={{fontSize:11,color:MUT}}>j 🔥</span>
          </div>
          <div style={{flex:1,height:4,background:"rgba(255,255,255,0.1)",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:level.progress+"%",height:"100%",background:"linear-gradient(90deg,"+OR+"99,"+OR+")",borderRadius:4,transition:"width 0.8s ease"}}/>
          </div>
          <span style={{fontSize:11,color:OR,fontWeight:600,whiteSpace:"nowrap"}}>{level.xp}{level.nextXP?" / "+level.nextXP:""} pts</span>
        </div>
      </div>

      <div style={{padding:"16px 16px 0"}}>

        {/* ── État de forme (unifié check-in + données) ── */}
        {(function(){
          var hasCheckin=p.wellbeing&&wpct!==null;
          var fs=null;
          if(fatigueScore&&planLevel(p.profile)>=1){
            fs=Object.assign({},fatigueScore);
            if(hasCheckin){
              if(wpct<=0.4&&fs.label==="En forme")
                fs={label:"Surcharge",color:RE,dot:"🔴",detail:"Volume soutenu + fatigue déclarée"};
              else if(wpct<=0.6&&fs.label==="En forme")
                fs={label:"Surveille-toi",color:YE,dot:"🟡",detail:"Bon volume mais fatigue signalée"};
              else if(wpct>0.8&&fs.label==="Repos")
                fs=Object.assign({},fs,{detail:"Volume faible · tu te sens bien, augmente progressivement"});
            }
          } else if(hasCheckin){
            fs={label:wba.text,color:wba.color,dot:wba.icon,detail:wba.sub};
          }
          var sources=[];
          if(fatigueScore&&planLevel(p.profile)>=1)sources.push("3 sem.");
          if(hasCheckin)sources.push("bilan");
          var moodBadge=hasCheckin?(wpct>0.8?"💪 Super":wpct>0.6?"✅ Bien":wpct>0.4?"😓 Fatigué":"🛌 Épuisé"):null;
          return(
            <div onClick={!hasCheckin?p.onCheckin:null} style={{borderRadius:14,background:fs?fs.color+"12":SURF,border:"1px solid "+(fs?fs.color+"33":OR+"33"),marginBottom:12,overflow:"hidden",cursor:!hasCheckin?"pointer":"default"}}>
              <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22,flexShrink:0}}>{fs?fs.dot:"🌡️"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>
                    État de forme{sources.length?" · "+sources.join(" + "):""}
                  </div>
                  {fs?(
                    <><div style={{fontSize:13,fontWeight:700,color:fs.color}}>{fs.label}</div>
                    <div style={{fontSize:11,color:SUB,marginTop:2}}>{fs.detail}</div></>
                  ):(
                    <><div style={{fontSize:13,fontWeight:600,color:TXT}}>Comment tu te sens aujourd'hui ?</div>
                    <div style={{fontSize:11,color:MUT,marginTop:1}}>Bilan rapide · 30 sec</div></>
                  )}
                </div>
                {hasCheckin&&moodBadge&&<div style={{fontSize:10,color:fs.color,fontWeight:700,background:fs.color+"18",padding:"3px 8px",borderRadius:6,flexShrink:0,whiteSpace:"nowrap"}}>{moodBadge}</div>}
                {!hasCheckin&&fs&&<button onClick={function(e){e.stopPropagation();p.onCheckin();}} style={{flexShrink:0,padding:"5px 10px",borderRadius:20,background:fs.color+"18",border:"1px solid "+fs.color+"44",color:fs.color,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Mon bilan ›</button>}
                {!hasCheckin&&!fs&&<span style={{color:OR,fontSize:16,flexShrink:0}}>›</span>}
              </div>
            </div>
          );
        })()}

        {(!p.profile.age||!p.profile.weight||!p.profile.height)&&(
          <div onClick={function(){p.onGoToProfile&&p.onGoToProfile();}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:OR+"10",border:"1px solid "+OR+"33",marginBottom:12,cursor:"pointer"}}>
            <span style={{fontSize:22,flexShrink:0}}>👤</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:TXT}}>Complète ton profil</div>
              <div style={{fontSize:11,color:MUT,marginTop:1}}>Âge, poids, taille — pour des plans plus précis</div>
            </div>
            <span style={{color:OR,fontSize:16}}>›</span>
          </div>
        )}

        {/* ── Conseil du jour (Essentiel+) ─────────── */}
        {p.dailyTip&&planLevel(p.profile)>=1&&(
          <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 14px",borderRadius:12,background:BL+"0e",border:"1px solid "+BL+"30",marginBottom:12}}>
            <span style={{fontSize:18,flexShrink:0}}>💡</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:BL,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Conseil du jour</div>
              <div style={{fontSize:13,color:TXT,lineHeight:1.5}}>{p.dailyTip}</div>
            </div>
            <button onClick={p.onDismissDailyTip} style={{background:"none",border:"none",color:MUT,fontSize:18,cursor:"pointer",padding:"0 0 0 4px",lineHeight:1,flexShrink:0}}>✕</button>
          </div>
        )}

        {/* ── Charge d'entraînement (Pro) ──────────── */}
        {adaptive&&(adaptive.CTL>2||adaptive.execRate!==null)&&(function(){
          var tsb=adaptive.TSB;
          var tsbColor=tsb>5?GR:tsb>-10?OR:RE;
          var tsbLabel=tsb>15?"Super fraîcheur":tsb>5?"Bien reposé":tsb>-10?"En forme":tsb>-20?"Fatigué":"Très chargé";
          var factorPct=Math.abs(Math.round((1-adaptive.factor)*100));
          var factorDown=adaptive.factor<0.93;
          var factorUp=adaptive.factor>1.07;
          return(
            <div style={{borderRadius:14,background:SURF,border:"1px solid "+BORD,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px 10px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>Charge d'entraînement</div>
                  <span style={{fontSize:9,fontWeight:700,color:OR,background:OR+"18",padding:"2px 7px",borderRadius:5}}>Pro</span>
                </div>
                <div style={{display:"flex",gap:0}}>
                  {adaptive.CTL>0&&<div style={{flex:1,textAlign:"center",paddingRight:8,borderRight:"1px solid "+BORD}}>
                    <div style={{fontSize:18,fontWeight:800,color:GR}}>{adaptive.CTL}</div>
                    <div style={{fontSize:9,color:MUT,marginTop:2}}>Forme de base</div>
                  </div>}
                  {adaptive.ATL>0&&<div style={{flex:1,textAlign:"center",padding:"0 8px",borderRight:"1px solid "+BORD}}>
                    <div style={{fontSize:18,fontWeight:800,color:adaptive.ATL>adaptive.CTL+15?RE:YE}}>{adaptive.ATL}</div>
                    <div style={{fontSize:9,color:MUT,marginTop:2}}>Fatigue récente</div>
                  </div>}
                  <div style={{flex:1,textAlign:"center",paddingLeft:8}}>
                    <div style={{fontSize:18,fontWeight:800,color:tsbColor}}>{tsb>0?"+":""}{tsb}</div>
                    <div style={{fontSize:9,color:tsbColor,marginTop:2,fontWeight:600}}>{tsbLabel}</div>
                  </div>
                </div>
                {(adaptive.execRate!==null||factorDown||factorUp)&&(
                  <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+BORD,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    {adaptive.execRate!==null&&(
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:adaptive.execRate>=80?GR:adaptive.execRate>=60?YE:RE}}/>
                        <span style={{fontSize:11,color:TXT,fontWeight:600}}>{adaptive.execRate}%</span>
                        <span style={{fontSize:11,color:MUT}}>des séances réalisées</span>
                      </div>
                    )}
                    {(factorDown||factorUp)&&(
                      <div style={{marginLeft:"auto",fontSize:11,color:factorDown?RE:GR,fontWeight:700,background:(factorDown?RE:GR)+"12",border:"1px solid "+(factorDown?RE:GR)+"33",padding:"2px 8px",borderRadius:6}}>
                        {factorDown?"↓ Réduis de "+factorPct+"%":"↑ Progresse de "+factorPct+"%"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Récap hebdomadaire (Essentiel+) ─────── */}
        {p.weeklyRecap&&planLevel(p.profile)>=1&&(
          <div style={{borderRadius:14,background:GR+"0a",border:"1px solid "+GR+"33",marginBottom:12,overflow:"hidden"}}>
            <div style={{padding:"11px 14px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
              <span style={{fontSize:18,flexShrink:0}}>📊</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:GR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Bilan de la semaine</div>
                <div style={{fontSize:13,color:TXT,lineHeight:1.55}}>{p.weeklyRecap}</div>
              </div>
              <button onClick={p.onDismissWeeklyRecap} style={{background:"none",border:"none",color:MUT,fontSize:18,cursor:"pointer",padding:"0 0 0 4px",lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          </div>
        )}

        {/* ── Feedback IA post-séance (Pro) ──────────── */}
        {p.autoFeedback&&planLevel(p.profile)>=2&&(
          <div style={{borderRadius:14,background:"linear-gradient(135deg,"+OR+"18,"+OR+"08)",border:"1px solid "+OR+"44",marginBottom:12,overflow:"hidden"}}>
            <div style={{padding:"12px 16px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{width:32,height:32,borderRadius:10,background:OR+"22",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🏃</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Analyse · {p.autoFeedback.label}</div>
                <div style={{fontSize:13,color:TXT,lineHeight:1.55}}>{p.autoFeedback.text}</div>
              </div>
              <button onClick={p.onDismissAutoFeedback} style={{background:"none",border:"none",color:MUT,fontSize:18,cursor:"pointer",padding:"0 0 0 4px",lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          </div>
        )}


        {/* ── Jour de Course ────────────────────────── */}
        {raceDay&&(
          <div style={{borderRadius:16,marginBottom:12,overflow:"hidden",background:"linear-gradient(135deg,"+OR+"22,"+GR+"11)",border:"2px solid "+OR+"88"}}>
            <div style={{padding:"16px 16px 12px"}}>
              <div style={{fontSize:10,color:OR,fontWeight:800,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>🎯 Aujourd'hui · Jour de Course</div>
              <div style={{fontSize:20,fontWeight:800,color:TXT,letterSpacing:"-0.3px",marginBottom:2}}>{p.race.name}</div>
              <div style={{fontSize:12,color:SUB}}>{p.race.dist} km · {p.race.type==="trail"?"Trail":"Route"}{p.race.city?" · "+p.race.city:""}</div>
            </div>
            <div onClick={function(){setRaceDayExpanded(function(v){return !v;});}} style={{padding:"0 16px 14px",cursor:"pointer"}}>
              {!raceDayExpanded?(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <span style={{fontSize:14}}>📋</span>
                  <span style={{fontSize:12,color:TXT,fontWeight:600}}>Voir les conseils course</span>
                  <span style={{marginLeft:"auto",color:OR,fontSize:14}}>↓</span>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(function(){
                    var d=parseFloat(p.race.dist)||0;
                    var tips=[];
                    tips.push({icon:"🐢",text:"Démarre 10% plus lentement que ton allure cible — tu récupéreras en fin de course."});
                    if(d>=10)tips.push({icon:"💧",text:"Bois à chaque ravitaillement, même si tu n'as pas soif."});
                    if(d>=21)tips.push({icon:"🍬",text:"Premier gel ou barre dès le km "+(Math.round(d*0.2))+" — n'attends pas d'avoir faim."});
                    if(d>=21)tips.push({icon:"⏱️",text:"Gel toutes les 45 min ensuite pour maintenir le glycogène."});
                    if(d>=42)tips.push({icon:"🔋",text:"Km 30-35 : c'est le mur — réduis l'allure de 5% et respire profondément."});
                    tips.push({icon:"🧠",text:"Divise la course en 3 tiers. Pense uniquement au tiers en cours."});
                    return tips.map(function(t,i){return(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",borderRadius:10,background:"rgba(255,255,255,0.05)"}}>
                        <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
                        <span style={{fontSize:12,color:TXT,lineHeight:1.5}}>{t.text}</span>
                      </div>
                    );});
                  })()}
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <button onClick={function(e){e.stopPropagation();p.onGoToCoach&&p.onGoToCoach();}} style={{flex:1,padding:"11px",borderRadius:10,background:OR+"22",border:"1px solid "+OR+"55",color:OR,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>💬 Parler au Coach</button>
                    <button onClick={function(e){e.stopPropagation();p.onGoToJournal&&p.onGoToJournal(p.race.dist);}} style={{flex:1,padding:"11px",borderRadius:10,background:GR+"22",border:"1px solid "+GR+"55",color:GR,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Valider ma course</button>
                  </div>
                  <div onClick={function(){setRaceDayExpanded(false);}} style={{textAlign:"center",color:MUT,fontSize:11,padding:"4px 0",cursor:"pointer"}}>↑ Réduire</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Challenge semaine ─────────────────────── */}
        <div style={{borderRadius:16,background:SURF,border:"1px solid "+(chalCompleted?GR+"55":BORD),marginBottom:12,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:22,flexShrink:0}}>{challenge.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Défi de la semaine</div>
              <div style={{fontSize:13,fontWeight:700,color:TXT}}>{challenge.label}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:800,color:chalCompleted?GR:OR}}>{chalDone}<span style={{fontSize:11,color:MUT,fontWeight:400}}>/{challenge.target}</span></div>
              <div style={{fontSize:10,color:OR,fontWeight:600}}>+{challenge.xp} pts</div>
            </div>
          </div>
          <div style={{height:4,background:OR+"18",borderRadius:4,overflow:"hidden",marginBottom:8}}>
            <div style={{width:Math.min(100,Math.round(chalDone/challenge.target*100))+"%",height:"100%",background:chalCompleted?"linear-gradient(90deg,"+GR+"88,"+GR+")":"linear-gradient(90deg,"+OR+"88,"+OR+")",borderRadius:4,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,color:chalCompleted?GR:MUT,fontWeight:chalCompleted?600:400}}>{chalCompleted?"✓ Relevé cette semaine !":"Se renouvelle chaque semaine"}</div>
            {chalCompleted&&<button onClick={function(){shareChallenge(challenge,chalDone);}} style={{padding:"4px 10px",borderRadius:8,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Partager 🚀</button>}
          </div>
        </div>

        {/* ── Séance du jour ────────────────────────── */}
        {nextSess&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+(sessAdjustedNote?RE+"44":BORD),marginBottom:12,overflow:"hidden"}}>
            <div style={{height:3,background:"linear-gradient(90deg,"+(sessAdjustedNote?RE:sessCol)+"99,"+(sessAdjustedNote?RE:sessCol)+")"}}/>
            <div style={{padding:"14px 16px"}}>
              <div style={{fontSize:10,color:sessAdjustedNote?RE:sessCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
                {displaySess.type==="strength"?"Renforcement cette semaine":sessAdjustedNote?"Séance ajustée":"Prochaine séance"}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sessAdjustedNote?6:12}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:TXT,letterSpacing:"-0.2px"}}>{displaySess.label}</div>
                  <div style={{fontSize:12,color:SUB,marginTop:3}}>
                    {displaySess.type==="strength"?displaySess.duration:displaySess.type!=="race"?displaySess.km+" km"+(displaySess.pace?" · "+displaySess.pace+"/km":""):"Course — "+displaySess.km+" km"}
                  </div>
                </div>
                {displaySess.pace&&displaySess.type!=="strength"&&displaySess.type!=="race"&&!sessAdjustedNote&&(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:sessCol}}>{durStr(displaySess.pace,displaySess.km)}</div>
                    <div style={{fontSize:9,color:MUT}}>durée est.</div>
                  </div>
                )}
              </div>
              {sessAdjustedNote&&<div style={{fontSize:11,color:RE,fontWeight:600,marginBottom:12,padding:"6px 10px",borderRadius:8,background:RE+"0e"}}>⚠ {sessAdjustedNote}</div>}
              {todayDone?(
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,padding:"10px",borderRadius:10,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:12,fontWeight:700,textAlign:"center"}}>✓ Séance validée</div>
                  <button onClick={function(){var e=p.entries&&p.entries[todayKey];shareRun(e&&e.km,e&&e.min,e&&e.sec);}} style={{padding:"10px 14px",borderRadius:10,background:OR+"18",border:"1px solid "+OR+"44",color:OR,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🚀</button>
                </div>
              ):(
                <button onClick={function(){p.onGoToSuivi&&p.onGoToSuivi();}} style={{width:"100%",padding:"11px",borderRadius:10,background:OR,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Valider dans Suivi →
                </button>
              )}
            </div>
            {p.race&&planWeeks.length>0&&(
              <div style={{borderTop:"1px solid "+BORD,padding:"10px 16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:600,color:raceCol}}>{p.race.name}</span>
                  <span style={{fontSize:11,color:MUT}}>{raceWeeks} sem. · {p.race.dist} km</span>
                </div>
                <div style={{height:3,background:raceCol+"18",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+raceCol+"88,"+raceCol+")",borderRadius:3}}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Objectif (sans séance planifiée) ─────── */}
        {!nextSess&&p.race&&planWeeks.length>0&&(
          <div style={{borderRadius:14,background:SURF,border:"1px solid "+BORD,marginBottom:12,padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:raceCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Objectif</div>
                <div style={{fontSize:14,fontWeight:700,color:TXT}}>{p.race.name}</div>
                <div style={{fontSize:11,color:SUB,marginTop:1}}>{fmtS(new Date(p.race.date))} · {raceWeeks} sem.</div>
              </div>
              <div style={{fontSize:24,fontWeight:800,color:raceCol,flexShrink:0,marginLeft:12}}>{p.race.dist}<span style={{fontSize:10,color:MUT,fontWeight:400,marginLeft:2}}>km</span></div>
            </div>
            <div style={{height:3,background:raceCol+"18",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+raceCol+"88,"+raceCol+")",borderRadius:3}}/>
            </div>
          </div>
        )}


      </div>
    </div>

    {/* ── Météo détail (bottom sheet) ───────────────── */}
    {showWeather&&hourly&&(function(){
      var now=new Date();var curHour=now.getHours();
      var todayStr=now.toLocaleDateString("sv-SE");
      var tom=new Date(now);tom.setDate(tom.getDate()+1);var tomStr=tom.toLocaleDateString("sv-SE");
      var allSlots=hourly.time.map(function(t,i){
        var dateStr=t.slice(0,10);var h=parseInt(t.slice(11,13));
        return{h:h,temp:Math.round(hourly.temperature_2m[i]),code:hourly.weathercode[i],rain:hourly.precipitation_probability[i]||0,wind:Math.round(hourly.windspeed_10m[i]),tomorrow:dateStr===tomStr,dateStr:dateStr};
      });
      var todaySlots=allSlots.filter(function(s){return s.dateStr===todayStr&&s.h>=curHour;});
      var tomSlots=allSlots.filter(function(s){return s.dateStr===tomStr&&s.h>=5&&s.h<=22;});
      var needed=Math.max(0,3-todaySlots.length);
      var hours=todaySlots.concat(tomSlots.slice(0,needed));
      var scores=hours.map(function(h){return(h.code<61?10:0)-(h.rain/10)+(h.temp>=10&&h.temp<=22?5:0)-(h.wind>20?3:0);});
      var bestScore=Math.max.apply(null,scores);
      var goodSet=new Set();
      scores.forEach(function(s,i){if(s>=8)goodSet.add(i);});
      if(goodSet.size===0&&bestScore>-Infinity)goodSet.add(scores.indexOf(bestScore));
      var goodCount=0;var goodIdxs=new Set();
      scores.forEach(function(_,i){if(goodSet.has(i)&&goodCount<3){goodIdxs.add(i);goodCount++;}});
      return(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={function(){setShowWeather(false);}}>
          <div onClick={function(e){e.stopPropagation();}} style={{background:BG,borderRadius:"20px 20px 0 0",border:"1px solid "+BORD,borderBottom:"none",padding:"12px 16px 40px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontSize:16,fontWeight:800,color:TXT}}>Météo du jour</div>
              <button onClick={function(){setShowWeather(false);}} style={{background:"none",border:"none",color:MUT,fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>
            {goodIdxs.size>1&&<div style={{fontSize:11,color:OR,fontWeight:600,marginBottom:8}}>{goodIdxs.size} créneaux recommandés pour courir</div>}
            {hours.map(function(h,i){var isGood=goodIdxs.has(i);var showTomLabel=h.tomorrow&&(i===0||!hours[i-1].tomorrow);return(
              <div key={i}>
                {showTomLabel&&<div style={{fontSize:11,color:MUT,fontWeight:600,padding:"4px 2px 2px"}}>Demain matin</div>}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:12,marginBottom:6,background:isGood?OR+"12":SURF,border:"1px solid "+(isGood?OR+"44":BORD)}}>
                  <span style={{fontSize:13,fontWeight:700,color:isGood?OR:MUT,width:34,flexShrink:0}}>{String(h.h).padStart(2,"0")}h</span>
                  <span style={{fontSize:18,flexShrink:0}}>{wIcon(h.code)}</span>
                  <span style={{fontSize:14,fontWeight:700,color:TXT,width:34,flexShrink:0}}>{h.temp}°</span>
                  <div style={{flex:1,display:"flex",gap:8}}>
                    {h.rain>0&&<span style={{fontSize:11,color:BL}}>💧{h.rain}%</span>}
                    {h.wind>10&&<span style={{fontSize:11,color:MUT}}>💨{h.wind}km/h</span>}
                  </div>
                  {isGood&&<span style={{fontSize:10,fontWeight:700,color:OR,background:OR+"18",padding:"2px 8px",borderRadius:6}}>Idéal</span>}
                </div>
              </div>
            );})}
          </div>
        </div>
      );
    })()}
    </>
  );
}
