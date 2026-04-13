import { useState, useEffect, useRef, useMemo } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { weeksUntil, fmtDate, fmtS } from "../utils/date.js";
import { buildPlan, getPlanWeeks, getCourseReadiness } from "../utils/plan.js";
import { planLevel, calcNutrition, getRecipesTrial, RECIPES_TRIAL_DAYS } from "../utils/nutrition.js";
import { RECIPES } from "../data/meals.js";
import { useRaces, suggestRaces } from "../utils/races.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card, Stat } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";
import { RaceStrategyModal } from "../components/RaceStrategyModal.jsx";
import { SessionCard } from "../components/SessionCard.jsx";
import { getBossSession } from "../utils/gamification.js";
import { STRENGTH_SESSIONS } from "../data/training.js";

var FREE_PLAN_WEEKS=3;

function StrengthCard({profile,weekIdx}){
  var [open,setOpen]=useState(false);
  var [nutOpen,setNutOpen]=useState(false);
  var lvl=(profile&&profile.level)||"beginner";
  var pool=STRENGTH_SESSIONS[lvl]||STRENGTH_SESSIONS.beginner||[];
  if(!pool.length)return null;
  var sess=pool[weekIdx%pool.length];
  var n=calcNutrition(profile,"strength");
  var recipes=RECIPES["strength"]||[];
  var isPro=planLevel(profile)>=2;
  var trial=isPro?{active:true,daysLeft:99}:getRecipesTrial();
  var canSeeRecipes=isPro||trial.active;
  return(
    <div style={{marginBottom:10,borderRadius:14,background:"#A855F715",border:"1px solid #A855F733",overflow:"hidden"}}>
      <div onClick={function(){setOpen(function(v){return !v;});}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"#A855F725",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💪</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#A855F7",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Renforcement musculaire · complémentaire</div>
          <div style={{fontSize:13,fontWeight:700,color:TXT}}>{sess.name}</div>
          <div style={{fontSize:11,color:SUB}}>{sess.duration} · {sess.exercises.length} exercices</div>
        </div>
        <div style={{color:"#A855F7",fontSize:18,flexShrink:0,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>›</div>
      </div>
      {open&&(
        <div style={{padding:"0 16px 14px"}}>
          <div style={{fontSize:12,color:SUB,marginBottom:10,lineHeight:1.5}}>{sess.desc}</div>
          {sess.exercises.map(function(ex,ei){return(
            <div key={ei} style={{marginBottom:8,padding:"10px 12px",borderRadius:10,background:"rgba(168,85,247,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>{ex.name}</div>
                <div style={{fontSize:11,fontWeight:600,color:"#A855F7",background:"#A855F718",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap",marginLeft:8}}>{ex.sets}</div>
              </div>
              <div style={{fontSize:11,color:MUT,fontStyle:"italic"}}>{ex.tip}</div>
            </div>
          );})}
          <div style={{borderRadius:12,border:"1px solid "+BORD,overflow:"hidden",marginTop:4}}>
            <div onClick={function(e){e.stopPropagation();setNutOpen(function(v){return !v;});}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:SURF2,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13}}>🥗</span>
                <span style={{fontSize:12,fontWeight:600,color:TXT}}>Nutrition jour de renforcement</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:OR}}>{n.kcal} kcal</span>
                <div style={{width:22,height:22,borderRadius:7,background:"#0a0a0a",border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:SUB,transform:nutOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
              </div>
            </div>
            {nutOpen&&(
              <div>
                <div style={{display:"flex",gap:6,padding:"10px 12px",borderTop:"1px solid "+BORD}}>
                  {[{label:"Glucides",value:n.carbs+"g",color:BL},{label:"Protéines",value:n.prot+"g",color:GR},{label:"Lipides",value:n.fat+"g",color:YE}].map(function(m,i){
                    return <div key={i} style={{flex:1,background:SURF2,borderRadius:8,padding:"7px 4px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div><div style={{fontSize:9,color:MUT,marginTop:2}}>{m.label}</div></div>;
                  })}
                </div>
                {canSeeRecipes?(
                  recipes.map(function(r,ri){return(
                    <div key={ri} style={{borderTop:"1px solid "+BORD,padding:"9px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:11,fontWeight:700,color:OR,width:90,flexShrink:0}}>{r.slot}</div>
                        <div style={{flex:1,fontSize:12,fontWeight:500,color:TXT}}>{r.name}</div>
                        <span style={{fontSize:11,color:MUT,marginLeft:6}}>{r.kcal} kcal</span>
                      </div>
                    </div>
                  );})
                ):(
                  <div style={{margin:"8px 12px 12px",padding:"12px 14px",borderRadius:10,background:OR+"10",border:"1px solid "+OR+"33"}}>
                    <div style={{fontSize:11,color:MUT}}>Recettes détaillées disponibles en Pro · Essai {RECIPES_TRIAL_DAYS} jours gratuit.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  var scrollRef=useRef(null);
  var races=useRaces();
  var raceId=p.race?p.race.id:null;
  useEffect(function(){setForceNoPlan(false);setSelWeek(null);},[raceId]);
  useEffect(function(){if(scrollRef.current&&selWeek!==null){var el=scrollRef.current.children[selWeek];if(el)el.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});}},[selWeek]);
  var _planDay2=new Date(new Date().setHours(0,0,0,0)).toDateString();
  var plan=useMemo(function(){return p.race?buildPlan(p.race,p.profile):null;},[p.race,p.profile,_planDay2]);
  var planWeeks=getPlanWeeks(plan);
  var activeIdx=selWeek!==null?Math.max(0,Math.min(selWeek,planWeeks.length-1)):0;
  if(selWeek===null&&planWeeks.length>0){for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){activeIdx=ci;break;}}}
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
  return(
    <><div><LogoBar/>
      <div style={{padding:"16px 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>{p.race.name}</div>
          <span style={{padding:"3px 10px",borderRadius:20,background:(p.race.type==="trail"?GR:BL)+"22",color:p.race.type==="trail"?GR:BL,fontSize:12,fontWeight:600}}>{weeksUntil(p.race.date)} sem.</span>
        </div>
        <div style={{fontSize:13,color:SUB,marginBottom:10}}>{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
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
        <button onClick={function(){if(planLevel(p.profile)<2){setShowStrategyUpgrade(true);}else{setShowStrategy(true);}}} style={{width:"100%",marginTop:10,padding:"11px",borderRadius:12,background:planLevel(p.profile)>=2?OR+"15":SURF2,border:"1px solid "+(planLevel(p.profile)>=2?OR+"44":BORD),color:planLevel(p.profile)>=2?OR:MUT,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {planLevel(p.profile)<2&&<span style={{fontSize:12}}>🔒</span>}Stratégie de course · Splits{planLevel(p.profile)<2&&<span style={{fontSize:10,color:OR,fontWeight:700,marginLeft:4}}>Pro</span>}
        </button>
      </div>
      <div ref={scrollRef} style={{display:"flex",gap:6,overflowX:"auto",padding:"0 16px 16px",touchAction:"pan-x"}}>
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
      {w?(
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
              <Btn label="Passer à Essentiel — 4,99 €/mois" onClick={function(){p.onShowPricing&&p.onShowPricing();}} full/>
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
              {(function(){var boss=getBossSession(w.sessions.filter(function(s){return s.type!=="rest";}));return w.sessions.map(function(s,si){return <SessionCard key={si} session={s} profile={p.profile} isNext={!!(nextSessDate&&s.date&&s.date.getTime()===nextSessDate.getTime())} isBoss={!!(boss&&s===boss)} onBossKill={p.onBossKill} onShowPricing={p.onShowPricing}/>;});}())}
              <StrengthCard profile={p.profile} weekIdx={activeIdx}/>
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
    {showStrategyUpgrade&&<UpgradeModal feature="Stratégie de course · Splits" minPlanLabel="Pro" minPlanColor={OR} onClose={function(){setShowStrategyUpgrade(false);}} onUpgrade={function(){setShowStrategyUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    {showPlanUpgrade&&<UpgradeModal feature={"Plan complet · "+planWeeks.length+" semaines"} minPlanLabel="Essentiel" minPlanColor={BL} onClose={function(){setShowPlanUpgrade(false);}} onUpgrade={function(){setShowPlanUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
