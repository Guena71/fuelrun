import { useState, useEffect, useMemo } from "react";
import { BG, SURF, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { TYPE_COLORS } from "../data/training.js";
import { weeksUntil, fmtS, durStr } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { weatherAdvice } from "../utils/weather.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { AnimCount } from "../components/AnimCount.jsx";
import { xpToLevel, getWeeklyContractKey, generateWeeklyChallenge, challengeProgress } from "../utils/gamification.js";
import { shareChallenge, shareRun } from "../utils/share.js";
import { planLevel } from "../utils/nutrition.js";

function wIcon(code){return code===0?"☀️":code<=3?"⛅":code<=48?"🌫️":code<=65?"🌧️":code<=77?"❄️":code<=82?"🌦️":"⛈️";}
function calcStreak(entries){var s=0,d=new Date();d.setHours(0,0,0,0);while(true){var k=d.toDateString();if(entries&&entries[k]&&entries[k].done){s++;d.setDate(d.getDate()-1);}else break;}return s;}
function calcStats(entries){var sessions=0,km=0;Object.values(entries||{}).forEach(function(e){if(e.done){sessions++;km+=parseFloat(e.km)||0;}});return{sessions:sessions,km:km};}

export function HomeScreen(p){
  var [weather,setWeather]=useState(null);
  var [hourly,setHourly]=useState(null);
  var [showWeather,setShowWeather]=useState(false);
  var gam=p.gamification||{xp:0,badges:[],contractsKept:0,bossKills:0};
  var level=xpToLevel(gam.xp||0);
  var weekKey=getWeeklyContractKey();
  var challenge=generateWeeklyChallenge(p.profile||{},weekKey);
  var chalDone=challengeProgress(p.entries||{},weekKey,challenge);
  var chalCompleted=chalDone>=challenge.target;
  var todayKey=new Date().toDateString();
  var todayDone=!!(p.entries&&p.entries[todayKey]&&p.entries[todayKey].done);

  useEffect(function(){
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(function(pos){
      var la=pos.coords.latitude.toFixed(4),lo=pos.coords.longitude.toFixed(4);
      fetch("https://api.open-meteo.com/v1/forecast?latitude="+la+"&longitude="+lo+"&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m&forecast_days=1&timezone=auto")
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

  var wba=null;
  if(p.wellbeing){
    var tot=0;var vals=Object.values(p.wellbeing);
    for(var vi=0;vi<vals.length;vi++)tot+=vals[vi];
    var wpct=tot/(4*4);
    var plannedLabel=nextSess?nextSess.label:"la séance prévue";
    if(wpct<=0.4){wba={text:"Repos conseillé",sub:"Fatigue détectée — récupération active recommandée.",icon:"🛌",color:RE,bg:RE+"12"};}
    else if(wpct<=0.6){wba={text:"Séance allégée",sub:"Réduis l'intensité de "+plannedLabel+" de 20–30%.",icon:"🚶",color:YE,bg:YE+"12"};}
    else if(wpct<=0.8){wba={text:"Bonne forme",sub:plannedLabel+" comme prévu. Tu es prêt.",icon:"✅",color:BL,bg:BL+"12"};}
    else{wba={text:"Super forme !",sub:"Parfait pour "+plannedLabel+" — donne tout.",icon:"🚀",color:GR,bg:GR+"12"};}
  }

  var raceProgress=p.race&&planWeeks.length>0?Math.max(2,Math.min(100,Math.round((1-raceWeeks/planWeeks.length)*100))):0;
  var stats=calcStats(p.entries);
  var streak=calcStreak(p.entries);

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

        {/* Plan badge + edit profile */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
          {(function(){var lvl=planLevel(p.profile);var col=lvl>=2?OR:lvl>=1?BL:MUT;var label=lvl>=2?"Pro":lvl>=1?"Essentiel":"Gratuit";return(<span style={{fontSize:10,fontWeight:700,color:col,background:col+"18",border:"1px solid "+col+"44",borderRadius:20,padding:"3px 10px",textTransform:"uppercase",letterSpacing:0.8}}>{label}</span>);})()}
          <button onClick={function(){p.onGoToProfile&&p.onGoToProfile();}} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:11,color:MUT,fontWeight:500}}>Modifier le profil</span>
          </button>
        </div>

        {/* Stats strip */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[{label:"Séances",value:stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(stats.km),color:BL},{label:"Jours 🔥",value:streak,color:YE}].map(function(st,i){
            return(
              <div key={i} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontSize:22,fontWeight:800,lineHeight:1}}><AnimCount value={st.value} color={st.color}/></div>
                <div style={{fontSize:9,color:MUT,marginTop:4,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5}}>{st.label}</div>
              </div>
            );
          })}
        </div>

        {/* XP bar */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13}}>{level.emoji}</span>
          <div style={{flex:1,height:4,background:"rgba(255,255,255,0.1)",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:level.progress+"%",height:"100%",background:"linear-gradient(90deg,"+OR+"99,"+OR+")",borderRadius:4,transition:"width 0.8s ease"}}/>
          </div>
          <span style={{fontSize:11,color:OR,fontWeight:600,whiteSpace:"nowrap"}}>{level.xp}{level.nextXP?" / "+level.nextXP:""} XP</span>
        </div>
      </div>

      <div style={{padding:"16px 16px 0"}}>

        {/* ── Wellbeing ─────────────────────────────── */}
        {p.wellbeing?(
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:wba.bg,border:"1px solid "+wba.color+"30",marginBottom:12}}>
            <span style={{fontSize:22,flexShrink:0}}>{wba.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:wba.color}}>{wba.text}</div>
              <div style={{fontSize:11,color:SUB,marginTop:1}}>{wba.sub}</div>
            </div>
          </div>
        ):(
          <div onClick={p.onCheckin} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:SURF,border:"1px solid "+OR+"33",marginBottom:12,cursor:"pointer"}}>
            <span style={{fontSize:22,flexShrink:0}}>🌡️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:TXT}}>Comment tu te sens aujourd'hui ?</div>
              <div style={{fontSize:11,color:MUT,marginTop:1}}>Check-in rapide · 30 sec</div>
            </div>
            <span style={{color:OR,fontSize:16}}>›</span>
          </div>
        )}

        {/* ── Séance du jour ────────────────────────── */}
        {nextSess&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+BORD,marginBottom:12,overflow:"hidden"}}>
            <div style={{height:3,background:"linear-gradient(90deg,"+sessCol+"99,"+sessCol+")"}}/>
            <div style={{padding:"14px 16px"}}>
              <div style={{fontSize:10,color:sessCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
                {nextSess.type==="strength"?"Renforcement cette semaine":"Prochaine séance"}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:TXT,letterSpacing:"-0.2px"}}>{nextSess.label}</div>
                  <div style={{fontSize:12,color:SUB,marginTop:3}}>
                    {nextSess.type==="strength"?nextSess.duration:nextSess.type!=="race"?nextSess.km+" km"+(nextSess.pace?" · "+nextSess.pace+"/km":""):"Course — "+nextSess.km+" km"}
                  </div>
                </div>
                {nextSess.pace&&nextSess.type!=="strength"&&nextSess.type!=="race"&&(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:sessCol}}>{durStr(nextSess.pace,nextSess.km)}</div>
                    <div style={{fontSize:9,color:MUT}}>durée est.</div>
                  </div>
                )}
              </div>
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
          </div>
        )}

        {/* ── Objectif course ───────────────────────── */}
        {p.race&&planWeeks.length>0&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+BORD,marginBottom:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:10,color:raceCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Objectif</div>
                <div style={{fontSize:15,fontWeight:700,color:TXT}}>{p.race.name}</div>
                <div style={{fontSize:11,color:SUB,marginTop:2}}>{p.race.city} · {fmtS(new Date(p.race.date))}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                <div style={{fontSize:26,fontWeight:800,color:raceCol,lineHeight:1}}>{p.race.dist}<span style={{fontSize:11,fontWeight:500,color:MUT,marginLeft:2}}>km</span></div>
                <div style={{fontSize:9,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{p.race.type==="trail"?"Trail":"Route"} · {raceWeeks} sem.</div>
              </div>
            </div>
            <div style={{height:4,background:raceCol+"18",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+raceCol+"88,"+raceCol+")",borderRadius:4}}/>
            </div>
          </div>
        )}

        {/* ── Challenge semaine ─────────────────────── */}
        <div style={{borderRadius:16,background:SURF,border:"1px solid "+(chalCompleted?GR+"55":BORD),marginBottom:12,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:22,flexShrink:0}}>{challenge.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Challenge de la semaine</div>
              <div style={{fontSize:13,fontWeight:700,color:TXT}}>{challenge.label}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:800,color:chalCompleted?GR:OR}}>{chalDone}<span style={{fontSize:11,color:MUT,fontWeight:400}}>/{challenge.target}</span></div>
              <div style={{fontSize:10,color:OR,fontWeight:600}}>+{challenge.xp} XP</div>
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

      </div>
    </div>

    {/* ── Météo détail (bottom sheet) ───────────────── */}
    {showWeather&&hourly&&(function(){
      var now=new Date();var curHour=now.getHours();
      var hours=hourly.time.map(function(t,i){return{h:parseInt(t.slice(11,13)),temp:Math.round(hourly.temperature_2m[i]),code:hourly.weathercode[i],rain:hourly.precipitation_probability[i]||0,wind:Math.round(hourly.windspeed_10m[i])};}).filter(function(h){return h.h>=curHour;});
      var bestIdx=0;var bestScore=-Infinity;
      hours.forEach(function(h,i){var score=(h.code<61?10:0)-(h.rain/10)+(h.temp>=10&&h.temp<=22?5:0)-(h.wind>20?3:0);if(score>bestScore){bestScore=score;bestIdx=i;}});
      return(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={function(){setShowWeather(false);}}>
          <div onClick={function(e){e.stopPropagation();}} style={{background:BG,borderRadius:"20px 20px 0 0",border:"1px solid "+BORD,borderBottom:"none",padding:"0 0 32px",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px"}}>
              <div style={{fontSize:16,fontWeight:800,color:TXT}}>Météo du jour</div>
              <button onClick={function(){setShowWeather(false);}} style={{background:"none",border:"none",color:MUT,fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>
            <div style={{overflowY:"auto",padding:"0 16px"}}>
              {hours.map(function(h,i){var isBest=i===bestIdx;return(
                <div key={h.h} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,marginBottom:6,background:isBest?OR+"12":SURF,border:"1px solid "+(isBest?OR+"44":BORD)}}>
                  <span style={{fontSize:13,fontWeight:700,color:isBest?OR:MUT,width:36,flexShrink:0}}>{String(h.h).padStart(2,"0")}h</span>
                  <span style={{fontSize:20,flexShrink:0}}>{wIcon(h.code)}</span>
                  <span style={{fontSize:15,fontWeight:700,color:TXT,width:36,flexShrink:0}}>{h.temp}°</span>
                  <div style={{flex:1,display:"flex",gap:8}}>
                    {h.rain>0&&<span style={{fontSize:11,color:BL}}>💧{h.rain}%</span>}
                    {h.wind>10&&<span style={{fontSize:11,color:MUT}}>💨{h.wind}km/h</span>}
                  </div>
                  {isBest&&<span style={{fontSize:10,fontWeight:700,color:OR,background:OR+"18",padding:"2px 8px",borderRadius:6}}>Idéal</span>}
                </div>
              );})}
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
