import { useState, useEffect, useRef, useMemo } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { weeksUntil, fmtDate, fmtS } from "../utils/date.js";
import { buildPlan, getPlanWeeks, getCourseReadiness } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { computeAdaptive } from "../utils/adaptive.js";
import { useRaces, suggestRaces } from "../utils/races.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card, Stat } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";
import { RaceStrategyModal } from "../components/RaceStrategyModal.jsx";
import { SessionCard } from "../components/SessionCard.jsx";
import { getBossSession } from "../utils/gamification.js";
var FREE_PLAN_WEEKS=3;

var TIPS=[
  {icon:"🏃",title:"Maintiens ton volume habituel",   desc:"Continue à courir à ton rythme actuel sans augmenter la charge."},
  {icon:"😴",title:"Privilégie la récupération",      desc:"Dors bien, évite les efforts intenses dans les 3 jours avant la course."},
  {icon:"🥗",title:"Charge en glucides J−2/J−1",     desc:"Pâtes, riz, pain complet — fais le plein d'énergie avant le départ."},
  {icon:"💧",title:"Hydratation ++",                   desc:"Bois régulièrement les jours précédant la course."},
  {icon:"👟",title:"Pas de nouveautés",               desc:"N'essaie pas de nouvelles chaussures ou tenues le jour J."}
];

export function TrainingScreen(p){
  var [selWeek,setSelWeek]=useState(null);
  var [forceNoPlan,setForceNoPlan]=useState(false);
  var [showStrategy,setShowStrategy]=useState(false);
  var [showStrategyUpgrade,setShowStrategyUpgrade]=useState(false);
  var [showPlanUpgrade,setShowPlanUpgrade]=useState(false);
  var [viewMode,setViewMode]=useState("list");
  var [calOffset,setCalOffset]=useState(0);
  var [validateSess,setValidateSess]=useState(null);
  var [validateIsBoss,setValidateIsBoss]=useState(false);
  var [valForm,setValForm]=useState({km:"",min:"",rpe:5});
  useEffect(function(){
    if(validateSess){
      var km=validateSess.km||0;
      var wpct2=null;
      if(p.wellbeing&&validateSess.date&&validateSess.date.toDateString()===new Date().toDateString()){
        var wt2=0;Object.values(p.wellbeing).forEach(function(v){wt2+=v;});wpct2=wt2/16;
      }
      if(wpct2!==null&&wpct2<0.6){
        var af=wpct2<=0.4?0.3:0.7;
        km=Math.max(2,Math.round((validateSess.km||0)*af));
      }
      setValForm({km:String(km),min:"",rpe:5});
    }else{setValForm({km:"",min:"",rpe:5});setValidateIsBoss(false);}
  },[validateSess]);
  function saveValidation(){
    if(!validateSess||!validateSess.date)return;
    var km=parseFloat(valForm.km)||validateSess.km;
    var min=valForm.min?parseFloat(valForm.min):null;
    var dateKey=validateSess.date.toDateString();
    p.onSetEntries&&p.onSetEntries(function(prev){return Object.assign({},prev,{[dateKey]:Object.assign({},prev[dateKey]||{},{done:true,km:String(km),min:min?String(min):undefined,rpe:valForm.rpe})});});
    p.onAddSession&&p.onAddSession(km,validateSess,{km:String(km),min:min?String(min):undefined,rpe:valForm.rpe});
    if(validateIsBoss&&p.onBossKill)p.onBossKill();
    setValidateSess(null);
  }
  var scrollRef=useRef(null);
  var races=useRaces();
  var raceId=p.race?p.race.id:null;
  useEffect(function(){setForceNoPlan(false);setSelWeek(null);},[raceId]);
  var _planDay2=new Date(new Date().setHours(0,0,0,0)).toDateString();
  var plan=useMemo(function(){return p.race?buildPlan(p.race,p.profile):null;},[p.race,p.profile,_planDay2]);
  var planWeeks=getPlanWeeks(plan);
  var adaptive=useMemo(function(){
    if(planLevel(p.profile)<2||planWeeks.length===0)return null;
    var wpct=null;
    if(p.wellbeing){var wt=0;Object.values(p.wellbeing).forEach(function(v){wt+=v;});wpct=wt/16;}
    return computeAdaptive(p.entries||{},planWeeks,wpct);
  },[p.entries,p.wellbeing,planWeeks,p.profile]);
  var sessMap={};planWeeks.forEach(function(wk,wi){wk.sessions.forEach(function(s){if(s.date){var k=s.date.toISOString().slice(0,10);sessMap[k]={sess:s,weekIdx:wi};}});});
  var activeIdx=selWeek!==null?Math.max(0,Math.min(selWeek,planWeeks.length-1)):0;
  if(selWeek===null&&planWeeks.length>0){for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){activeIdx=ci;break;}}}
  useEffect(function(){if(scrollRef.current&&planWeeks.length>0){var el=scrollRef.current.children[activeIdx];if(el)el.scrollIntoView({behavior:selWeek===null?"instant":"smooth",block:"nearest",inline:"center"});}},[selWeek,planWeeks.length]);
  var w=planWeeks.length>0?planWeeks[activeIdx]:null;
  var today=new Date(new Date().setHours(0,0,0,0));
  var nextSessDate=null;
  for(var wi=0;wi<planWeeks.length;wi++){
    var wk=planWeeks[wi];
    for(var si=0;si<wk.sessions.length;si++){
      var ss=wk.sessions[si];
      if(ss.date&&ss.date>=today){nextSessDate=ss.date;break;}
    }
    if(nextSessDate)break;
  }

  if(!p.race){
    var sugg0=suggestRaces(p.profile,races,"both");
    return(
      <div><LogoBar/>
        <div style={{padding:"24px 16px 0"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:6}}>Aucun plan actif</div>
            <div style={{fontSize:13,color:SUB}}>Choisis une course pour générer ton plan d'entraînement.</div>
          </div>
          {sugg0.length>0?(
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>Courses recommandées</div>
                <div style={{padding:"2px 8px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44"}}><span style={{fontSize:10,color:OR,fontWeight:700}}>Pour ton niveau</span></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {sugg0.map(function(r){
                  var col=r.type==="trail"?GR:BL;
                  var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(r);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,background:SURF,border:"1px solid "+BORD,cursor:"pointer"}}>
                      <div style={{width:46,height:46,borderRadius:12,background:col+"18",border:"1px solid "+col+"33",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <div style={{fontSize:16,fontWeight:800,color:col,lineHeight:1}}>{r.dist}</div>
                        <div style={{fontSize:8,color:col,fontWeight:600}}>km</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:3}}>{r.name}{r.star?" ⭐":""}</div>
                        <div style={{fontSize:11,color:SUB}}>{r.city} · dans {wks} semaines · {r.type==="trail"?"Trail":"Route"}</div>
                      </div>
                      <div style={{color:MUT,fontSize:18,flexShrink:0}}>›</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):null}
          <Btn label="Voir toutes les courses" onClick={p.onGoToCourses} variant="ghost" full/>
        </div>
      </div>
    );
  }
  if(plan&&plan.tooShort&&!forceNoPlan){return(
    <div style={{padding:"40px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <div style={{fontSize:18,fontWeight:700,color:RE,marginBottom:12}}>Délai trop court</div>
      <div style={{fontSize:14,color:SUB,lineHeight:1.8,marginBottom:16}}>
        Il ne reste que <span style={{color:YE,fontWeight:600}}>{plan.availWeeks} semaine{plan.availWeeks>1?"s":""}</span> avant cette course.
        Un plan cohérent nécessite au minimum <span style={{color:OR,fontWeight:600}}>{plan.minViable} semaines</span>.
        Le plan idéal serait de <span style={{color:GR,fontWeight:600}}>{plan.idealWeeks} semaines</span>.
      </div>
      <div style={{padding:"14px 18px",background:YE+"12",borderRadius:14,border:"1px solid "+YE+"33",fontSize:13,color:SUB,lineHeight:1.7,marginBottom:24}}>
        Tu peux participer sans plan structuré, ou choisir une course plus lointaine.
      </div>
      {(function(){
        var sugg1=suggestRaces(p.profile,races,p.race&&p.race.type).filter(function(r){return r.id!==p.race.id;}).slice(0,3);
        if(!sugg1.length)return null;
        return(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:MUT,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Courses adaptées à ton niveau</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sugg1.map(function(r){
                var col=r.type==="trail"?GR:BL;
                var wks=weeksUntil(r.date);
                return(
                  <div key={r.id} onClick={function(){p.setRace(r);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:SURF,border:"1px solid "+BORD,cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:col+"18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:col,lineHeight:1}}>{r.dist}</div>
                      <div style={{fontSize:8,color:col,fontWeight:600}}>km</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:TXT,marginBottom:2}}>{r.name}{r.star?" ⭐":""}</div>
                      <div style={{fontSize:11,color:SUB}}>{r.city} · dans {wks} sem.</div>
                    </div>
                    <div style={{color:MUT,fontSize:16}}>›</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn label="Voir toutes les courses" onClick={p.onGoToCourses} full/>
        <Btn label="Continuer sans plan structuré" onClick={function(){setForceNoPlan(true);}} variant="ghost" full/>
      </div>
    </div>
  );}
  if(forceNoPlan){var rd2=getCourseReadiness(p.race,p.profile,weeksUntil);return(
    <div><LogoBar/>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:4}}>{p.race.name}</div>
        <div style={{fontSize:13,color:SUB,marginBottom:16}}>{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:rd2.color+"12",border:"1px solid "+rd2.color+"33",marginBottom:16}}>
          <span style={{fontSize:14}}>{rd2.icon}</span><span style={{fontSize:12,fontWeight:700,color:rd2.color}}>{rd2.label}</span><span style={{fontSize:12,color:SUB}}> · {rd2.msg}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {TIPS.map(function(tip,i){return(<div key={i} style={{display:"flex",gap:14,padding:"14px 16px",background:SURF,borderRadius:14,border:"1px solid "+BORD}}><div style={{fontSize:24,flexShrink:0}}>{tip.icon}</div><div><div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:4}}>{tip.title}</div><div style={{fontSize:12,color:SUB,lineHeight:1.6}}>{tip.desc}</div></div></div>);})}
        </div>
        <div style={{marginTop:16,marginBottom:24}}><Btn label="Choisir une autre course" onClick={function(){setForceNoPlan(false);p.onGoToCourses();}} variant="ghost" full/></div>
      </div>
    </div>
  );}
  if(planWeeks.length===0){return(<div style={{padding:"60px 24px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:600,color:TXT,marginBottom:8}}>Plan indisponible</div><Btn label="Choisir une autre course" onClick={p.onGoToCourses} full/></div>);}

  var rd=getCourseReadiness(p.race,p.profile,weeksUntil);
  var curWeekTr=planWeeks.find(function(wk){return wk.isCurrent;})||null;
  var isTaperNow=curWeekTr&&curWeekTr.phase==="taper";
  return(
    <><div><LogoBar/>
      <div style={{padding:"16px 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>{p.race.name}</div>
          <span style={{padding:"3px 10px",borderRadius:20,background:(p.race.type==="trail"?GR:BL)+"22",color:p.race.type==="trail"?GR:BL,fontSize:12,fontWeight:600}}>{weeksUntil(p.race.date)} sem.</span>
        </div>
        <div style={{fontSize:13,color:SUB,marginBottom:10}}>{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <button onClick={function(){if(planLevel(p.profile)<2){setShowStrategyUpgrade(true);}else{setShowStrategy(true);}}} style={{width:"100%",marginBottom:10,padding:"13px 16px",borderRadius:12,background:planLevel(p.profile)>=2?"linear-gradient(135deg,"+OR+"22,"+OR+"0a)":SURF2,border:"1.5px solid "+(planLevel(p.profile)>=2?OR+"66":BORD),color:planLevel(p.profile)>=2?OR:MUT,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>🏁</span>
            <span>Stratégie · Temps de passage</span>
          </div>
          {planLevel(p.profile)<2?<span style={{fontSize:10,color:OR,fontWeight:700,background:OR+"18",padding:"2px 8px",borderRadius:6}}>Pro</span>:<span style={{fontSize:16,color:OR}}>→</span>}
        </button>
        <div style={{background:SURF2,borderRadius:12,padding:"12px 14px",marginBottom:10,border:"1px solid "+BORD}}>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:OR}}>{planWeeks.length}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>Plan proposé</div></div>
            <div style={{width:1,background:BORD}}/>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:plan.idealWeeks>plan.availWeeks?YE:GR}}>{plan.idealWeeks}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>Sem. idéales</div></div>
            <div style={{width:1,background:BORD}}/>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:BL}}>{weeksUntil(p.race.date)}</div><div style={{fontSize:10,color:MUT,marginTop:2}}>Sem. restantes</div></div>
          </div>
          <div style={{fontSize:11,color:SUB,textAlign:"center",borderTop:"1px solid "+BORD,paddingTop:8}}>Début recommandé : <span style={{color:TXT,fontWeight:600}}>{fmtDate(plan.planStart)}</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:rd.color+"12",border:"1px solid "+rd.color+"33",marginBottom:10}}>
          <span style={{fontSize:14}}>{rd.icon}</span>
          <div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:rd.color}}>{rd.label}</span><span style={{fontSize:12,color:SUB}}> · {rd.msg}</span></div>
        </div>
        {isTaperNow&&(
          <div style={{marginTop:10,padding:"12px 16px",borderRadius:12,background:YE+"12",border:"1px solid "+YE+"44",display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:20,flexShrink:0}}>🎯</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:YE,marginBottom:3}}>Phase d'affûtage — tu approches du but !</div>
              <div style={{fontSize:12,color:SUB,lineHeight:1.5}}>Réduis le volume, conserve quelques séances à l'allure course. La forme monte, ne sabote pas en forçant.</div>
            </div>
          </div>
        )}
        {adaptive&&(adaptive.CTL>2||adaptive.execRate!==null)&&(function(){
          var tsb=adaptive.TSB;
          var tsbCol=tsb>5?GR:tsb>-10?OR:RE;
          var factorPct=Math.abs(Math.round((1-adaptive.factor)*100));
          var factorDown=adaptive.factor<0.93;var factorUp=adaptive.factor>1.07;
          return(
            <div style={{marginTop:10,padding:"11px 14px",borderRadius:12,background:OR+"08",border:"1px solid "+OR+"22"}}>
              <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Analyse de charge · Pro</div>
              <div style={{display:"flex",gap:0}}>
                {adaptive.CTL>0&&<div style={{flex:1,textAlign:"center",paddingRight:8,borderRight:"1px solid "+BORD}}>
                  <div style={{fontSize:15,fontWeight:800,color:GR}}>{adaptive.CTL}</div>
                  <div style={{fontSize:9,color:MUT,marginTop:1}}>Forme</div>
                </div>}
                {adaptive.ATL>0&&<div style={{flex:1,textAlign:"center",padding:"0 8px",borderRight:"1px solid "+BORD}}>
                  <div style={{fontSize:15,fontWeight:800,color:adaptive.ATL>adaptive.CTL+15?RE:YE}}>{adaptive.ATL}</div>
                  <div style={{fontSize:9,color:MUT,marginTop:1}}>Fatigue</div>
                </div>}
                <div style={{flex:1,textAlign:"center",padding:"0 8px",borderRight:adaptive.execRate!==null?"1px solid "+BORD:"none"}}>
                  <div style={{fontSize:15,fontWeight:800,color:tsbCol}}>{tsb>0?"+":""}{tsb}</div>
                  <div style={{fontSize:9,color:tsbCol,marginTop:1,fontWeight:600}}>{tsb>5?"Frais":tsb>-10?"Équilibré":"Chargé"}</div>
                </div>
                {adaptive.execRate!==null&&<div style={{flex:1,textAlign:"center",paddingLeft:8}}>
                  <div style={{fontSize:15,fontWeight:800,color:adaptive.execRate>=80?GR:adaptive.execRate>=60?YE:RE}}>{adaptive.execRate}%</div>
                  <div style={{fontSize:9,color:MUT,marginTop:1}}>Réalisé</div>
                </div>}
              </div>
              {(factorDown||factorUp)&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid "+BORD,fontSize:11,fontWeight:600,color:factorDown?RE:GR}}>
                  {factorDown?"↓ Réduis le volume de "+factorPct+"% cette semaine":"↑ Tu peux progresser de "+factorPct+"% cette semaine"}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      <div style={{display:"flex",gap:4,background:SURF2,borderRadius:8,padding:2,margin:"0 16px 12px",width:"fit-content"}}>
        <button onClick={function(){setViewMode("list");}} style={{padding:"5px 12px",borderRadius:6,background:viewMode==="list"?SURF:"transparent",border:"none",color:viewMode==="list"?TXT:MUT,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Semaines</button>
        <button onClick={function(){setViewMode("calendar");}} style={{padding:"5px 12px",borderRadius:6,background:viewMode==="calendar"?SURF:"transparent",border:"none",color:viewMode==="calendar"?TXT:MUT,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Calendrier</button>
      </div>
      {viewMode==="calendar"?(function(){
        var now2=new Date();
        var vm=now2.getMonth()+calOffset;var vy=now2.getFullYear();
        while(vm>11){vy++;vm-=12;}while(vm<0){vy--;vm+=12;}
        var firstDay=new Date(vy,vm,1);var lastDay=new Date(vy,vm+1,0);
        var startDow=(firstDay.getDay()+6)%7;
        var monthLabel=firstDay.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
        var days2=[];
        for(var di=0;di<startDow;di++)days2.push(null);
        for(var di2=1;di2<=lastDay.getDate();di2++)days2.push(di2);
        while(days2.length%7!==0)days2.push(null);
        var todayStr2=new Date().toISOString().slice(0,10);
        var dotC={easy:GR,long:OR,tempo:BL,interval:RE,strength:YE,race:OR};
        return(
          <div style={{padding:"0 16px 24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button onClick={function(){setCalOffset(function(o){return o-1;});}} style={{background:SURF,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>‹</button>
              <div style={{fontSize:14,fontWeight:700,color:TXT,textTransform:"capitalize"}}>{monthLabel}</div>
              <button onClick={function(){setCalOffset(function(o){return o+1;});}} style={{background:SURF,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {["L","M","M","J","V","S","D"].map(function(d,i){return <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:MUT,padding:"4px 0"}}>{d}</div>;})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {days2.map(function(d,i){
                if(!d)return <div key={i}/>;
                var ds=[vy,String(vm+1).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
                var entry=sessMap[ds];
                var isToday=ds===todayStr2;
                var dc=entry?dotC[entry.sess.type]:null;
                return(
                  <div key={i}
                    onClick={entry&&entry.sess.type!=="rest"?function(){setSelWeek(entry.weekIdx);setViewMode("list");}:null}
                    style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:8,background:isToday?OR+"18":dc?dc+"15":"transparent",border:isToday?"1.5px solid "+OR+"66":"1px solid transparent",cursor:entry&&entry.sess.type!=="rest"?"pointer":"default",gap:1}}>
                    <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?OR:TXT,lineHeight:1}}>{d}</div>
                    {dc&&entry.sess.type!=="rest"&&<div style={{width:5,height:5,borderRadius:"50%",background:dc}}/>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:10}}>
              {[{label:"Footing",col:GR},{label:"Longue",col:OR},{label:"Tempo",col:BL},{label:"Fractions",col:RE},{label:"Renforcement",col:YE}].map(function(item,i){
                return <div key={i} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:8,height:8,borderRadius:"50%",background:item.col}}/><span style={{fontSize:11,color:MUT}}>{item.label}</span></div>;
              })}
            </div>
          </div>
        );
      })():null}
      <div ref={scrollRef} style={{display:viewMode==="calendar"?"none":"flex",gap:6,overflowX:"auto",padding:"0 16px 16px",touchAction:"pan-x"}}>
        {planWeeks.map(function(wk,i){
          var isA=i===activeIdx;var pc=wk.phaseColor;
          var locked=planLevel(p.profile)<1&&i>=FREE_PLAN_WEEKS;
          return(
          <div key={i} onClick={function(){locked?setShowPlanUpgrade(true):setSelWeek(i);}} style={{flexShrink:0,width:54,textAlign:"center",padding:"10px 4px",borderRadius:12,border:"1.5px solid "+(isA?pc:locked?BORD:BORD),background:isA?pc+"20":locked?SURF2:SURF,cursor:"pointer",position:"relative",opacity:locked?0.5:wk.isPast?0.55:1}}>
            {wk.isCurrent&&!locked?<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:OR,color:"#fff",fontSize:7,fontWeight:700,borderRadius:4,padding:"1px 5px",whiteSpace:"nowrap"}}>now</div>:null}
            {i===planWeeks.length-1&&!locked?<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:10}}>🏁</div>:null}
            {locked?<div style={{fontSize:11,marginBottom:2}}>🔒</div>:<div style={{fontSize:8,color:isA?pc:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3}}>{wk.phaseLabel.slice(0,3)}</div>}
            <div style={{fontSize:14,fontWeight:700,color:locked?MUT:isA?pc:TXT}}>S{wk.num}</div>
            <div style={{fontSize:9,color:locked?MUT:isA?pc:MUT,marginTop:1}}>{locked?"—":wk.isRecup?"R":wk.km+"k"}</div>
          </div>
        );})}
      </div>
      {viewMode!=="calendar"&&w?(
        <div key={activeIdx} style={{padding:"0 16px"}}>
          {planLevel(p.profile)<1&&activeIdx>=FREE_PLAN_WEEKS?(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:16}}>🔒</div>
              <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:8}}>Plan complet — Essentiel</div>
              <div style={{fontSize:13,color:SUB,lineHeight:1.7,marginBottom:8}}>
                Tu as accès aux <span style={{color:OR,fontWeight:700}}>{FREE_PLAN_WEEKS} premières semaines</span> gratuitement.<br/>
                Passe en Essentiel pour débloquer les <span style={{color:BL,fontWeight:700}}>{planWeeks.length-FREE_PLAN_WEEKS} semaines restantes</span> et suivre ton plan jusqu'à la course.
              </div>
              <div style={{fontSize:12,color:MUT,marginBottom:24}}>Semaine {activeIdx+1} sur {planWeeks.length}</div>
              <Btn label="Passer à Essentiel — 6,99 €/mois" onClick={function(){p.onShowPricing&&p.onShowPricing();}} full/>
              <button onClick={function(){setSelWeek(FREE_PLAN_WEEKS-1);}} style={{marginTop:12,background:"none",border:"none",color:MUT,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Revenir à la semaine {FREE_PLAN_WEEKS}</button>
            </div>
          ):(
            <>
              <Card style={{marginBottom:12}}>
                <div style={{padding:"16px 18px",borderBottom:"1px solid "+BORD}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:12,color:w.phaseColor,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{w.phaseLabel}{w.isRecup?" · Récupération":""}</div>
                      <div style={{fontSize:20,fontWeight:700,color:TXT}}>Semaine {w.num}<span style={{fontSize:14,color:SUB,fontWeight:400}}> / {w.total}</span></div>
                    </div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:TXT}}>{fmtS(w.weekStart)}</div><div style={{fontSize:12,color:SUB}}>au {fmtS(w.weekEnd)}</div></div>
                  </div>
                </div>
                <div style={{display:"flex",padding:"14px 18px"}}>
                  <Stat value={w.km+" km"} label="volume" color={w.phaseColor}/>
                  <div style={{width:1,background:BORD}}/>
                  <Stat value={w.sessions.length} label="séances" color={BL}/>
                </div>
              </Card>
              {planLevel(p.profile)<1&&activeIdx===FREE_PLAN_WEEKS-1&&(
                <div onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{marginBottom:12,padding:"10px 14px",borderRadius:12,background:BL+"12",border:"1px solid "+BL+"33",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:BL,fontWeight:600}}>📋 {planWeeks.length-FREE_PLAN_WEEKS} semaines de plan verrouillées</span>
                  <span style={{fontSize:10,fontWeight:700,color:BL,background:BL+"22",padding:"2px 8px",borderRadius:6}}>Essentiel →</span>
                </div>
              )}
              {(function(){var boss=getBossSession(w.sessions.filter(function(s){return s.type!=="rest";}));return w.sessions.map(function(s,si){var entry=p.entries&&s.date?p.entries[s.date.toDateString()]:null;var isBossS=!!(boss&&s===boss);return <SessionCard key={si} session={s} profile={p.profile} entry={entry} onValidate={s.type!=="race"?function(sess){setValidateSess(sess);setValidateIsBoss(isBossS);}:null} isNext={!!(nextSessDate&&s.date&&s.date.getTime()===nextSessDate.getTime())} isBoss={isBossS} onBossKill={p.onBossKill} onShowPricing={p.onShowPricing}/>;});}())}
              <div style={{display:"flex",gap:10,marginBottom:24,marginTop:4}}>
                <Btn label="Précédente" onClick={function(){setSelWeek(Math.max(0,activeIdx-1));}} disabled={activeIdx===0} variant="ghost" style={{flex:1}} size="sm"/>
                <Btn label="Suivante" onClick={function(){var next=activeIdx+1;if(planLevel(p.profile)<1&&next>=FREE_PLAN_WEEKS){setShowPlanUpgrade(true);}else{setSelWeek(Math.min(planWeeks.length-1,next));}}} disabled={activeIdx===planWeeks.length-1} variant="ghost" style={{flex:1}} size="sm"/>
              </div>
            </>
          )}
        </div>
      ):null}
    </div>
    {showStrategy&&<RaceStrategyModal race={p.race} onClose={function(){setShowStrategy(false);}}/>}
    {showStrategyUpgrade&&<UpgradeModal feature="Stratégie de course · Temps de passage" minPlanLabel="Pro" minPlanColor={OR} onClose={function(){setShowStrategyUpgrade(false);}} onUpgrade={function(){setShowStrategyUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    {showPlanUpgrade&&<UpgradeModal feature={"Plan complet · "+planWeeks.length+" semaines"} minPlanLabel="Essentiel" minPlanColor={BL} onClose={function(){setShowPlanUpgrade(false);}} onUpgrade={function(){setShowPlanUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    {validateSess&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)setValidateSess(null);}}>
        <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,animation:"slideUp .3s ease",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"20px 24px 0",flexShrink:0}}>
            <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 16px"}}/>
            <div style={{fontSize:16,fontWeight:700,color:TXT,marginBottom:4}}>Valider la séance</div>
          </div>
          <div style={{overflowY:"auto",padding:"0 24px 12px",flex:1,minHeight:0}}>
            {(function(){
              if(!validateSess||!p.wellbeing||!validateSess.date||validateSess.date.toDateString()!==new Date().toDateString())
                return <div style={{fontSize:12,color:MUT,marginBottom:16}}>{validateSess.label} · planifié {validateSess.km} km{validateSess.pace?" à "+validateSess.pace+"/km":""}</div>;
              var wt3=0;Object.values(p.wellbeing).forEach(function(v){wt3+=v;});var wp3=wt3/16;
              if(wp3>=0.6)return <div style={{fontSize:12,color:MUT,marginBottom:16}}>{validateSess.label} · planifié {validateSess.km} km{validateSess.pace?" à "+validateSess.pace+"/km":""}</div>;
              var adjK=Math.max(2,Math.round((validateSess.km||0)*(wp3<=0.4?0.3:0.7)));
              var adjMsg=wp3<=0.4?"Repos actif conseillé · "+adjK+" km max":"Allégée selon ton état · "+adjK+" km recommandés";
              return(<><div style={{fontSize:12,color:MUT,marginBottom:8}}>{validateSess.label} · planifié {validateSess.km} km</div><div style={{fontSize:11,color:RE,fontWeight:600,marginBottom:14,padding:"6px 10px",borderRadius:8,background:RE+"0e",border:"1px solid "+RE+"30"}}>⚠ {adjMsg}</div></>);
            })()}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <div>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Distance réelle (km)</label>
                <input value={valForm.km} onChange={function(e){setValForm(function(f){return Object.assign({},f,{km:e.target.value});});}} type="number" step="0.1" placeholder={String(validateSess.km)} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:15,fontWeight:600,outline:"none",fontFamily:"inherit"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Durée réelle (min)</label>
                <input value={valForm.min} onChange={function(e){setValForm(function(f){return Object.assign({},f,{min:e.target.value});});}} type="number" placeholder="60" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:15,fontWeight:600,outline:"none",fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{marginBottom:4}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:MUT}}>Effort ressenti</label>
                <span style={{fontSize:13,fontWeight:700,color:valForm.rpe<=3?GR:valForm.rpe<=6?YE:valForm.rpe<=8?OR:RE}}>{valForm.rpe}/10</span>
              </div>
              <input type="range" min={1} max={10} value={valForm.rpe} onChange={function(e){setValForm(function(f){return Object.assign({},f,{rpe:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:OR}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{fontSize:10,color:MUT}}>Facile</span>
                <span style={{fontSize:10,color:MUT}}>Maximal</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,padding:"12px 24px",paddingBottom:"calc(16px + env(safe-area-inset-bottom, 0px))",borderTop:"1px solid "+BORD,flexShrink:0}}>
            <Btn label="Annuler" onClick={function(){setValidateSess(null);}} variant="ghost" style={{flex:1}}/>
            <Btn label="Enregistrer" onClick={saveValidation} style={{flex:2}}/>
          </div>
        </div>
      </div>
    )}
</>
  );
}
