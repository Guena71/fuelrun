import { useState, useEffect, useRef, useMemo } from "react";
import { SURF, SURF2, BORD, TXT, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { weeksUntil, fmtDate, fmtS } from "../utils/date.js";
import { buildPlan, getPlanWeeks, getCourseReadiness } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { useRaces, suggestRaces } from "../utils/races.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card, Stat } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";
import { RaceStrategyModal } from "../components/RaceStrategyModal.jsx";
import { SessionCard } from "../components/SessionCard.jsx";

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
        <div className="px-4 pt-6">
          <div className="text-center mb-6">
            <div className="text-[18px] font-bold text-txt mb-1.5">Aucun plan actif</div>
            <div className="text-[13px] text-sub">Choisis une course pour générer ton plan d'entraînement.</div>
          </div>
          {sugg0.length>0?(
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[13px] font-bold text-txt">Courses recommandées</div>
                <div className="px-2 py-[2px] rounded-[20px]" style={{background:OR+"22",border:"1px solid "+OR+"44"}}><span className="text-[10px] font-bold" style={{color:OR}}>Pour ton niveau</span></div>
              </div>
              <div className="flex flex-col gap-2.5">
                {sugg0.map(function(r){
                  var col=r.type==="trail"?GR:BL;
                  var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(r);}} className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-surf border border-bord cursor-pointer">
                      <div className="w-[46px] h-[46px] rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{background:col+"18",border:"1px solid "+col+"33"}}>
                        <div className="text-[16px] font-extrabold leading-none" style={{color:col}}>{r.dist}</div>
                        <div className="text-[8px] font-semibold" style={{color:col}}>km</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-txt mb-[3px]">{r.name}{r.star?" ⭐":""}</div>
                        <div className="text-[11px] text-sub">{r.city} · dans {wks} semaines · {r.type==="trail"?"Trail":"Route"}</div>
                      </div>
                      <div className="text-[18px] text-mut shrink-0">›</div>
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
    <div className="px-6 py-10 text-center">
      <div className="text-[48px] mb-4">⚠️</div>
      <div className="text-[18px] font-bold mb-3" style={{color:RE}}>Délai trop court</div>
      <div className="text-[14px] text-sub leading-[1.8] mb-4">
        Il ne reste que <span className="font-semibold" style={{color:YE}}>{plan.availWeeks} semaine{plan.availWeeks>1?"s":""}</span> avant cette course.
        Un plan cohérent nécessite au minimum <span className="font-semibold" style={{color:OR}}>{plan.minViable} semaines</span>.
        Le plan idéal serait de <span className="font-semibold" style={{color:GR}}>{plan.idealWeeks} semaines</span>.
      </div>
      <div className="px-[18px] py-3.5 rounded-2xl text-[13px] text-sub leading-[1.7] mb-6"
        style={{background:YE+"12",border:"1px solid "+YE+"33"}}>
        Tu peux participer sans plan structuré, ou choisir une course plus lointaine.
      </div>
      {(function(){
        var sugg1=suggestRaces(p.profile,races,p.race&&p.race.type).filter(function(r){return r.id!==p.race.id;}).slice(0,3);
        if(!sugg1.length)return null;
        return(
          <div className="mb-4">
            <div className="text-[12px] font-bold text-mut uppercase tracking-[0.8px] mb-2.5">Courses adaptées à ton niveau</div>
            <div className="flex flex-col gap-2">
              {sugg1.map(function(r){
                var col=r.type==="trail"?GR:BL;
                var wks=weeksUntil(r.date);
                return(
                  <div key={r.id} onClick={function(){p.setRace(r);}} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-surf border border-bord cursor-pointer">
                    <div className="w-10 h-10 rounded-[10px] flex flex-col items-center justify-center shrink-0"
                      style={{background:col+"18"}}>
                      <div className="text-[14px] font-extrabold leading-none" style={{color:col}}>{r.dist}</div>
                      <div className="text-[8px] font-semibold" style={{color:col}}>km</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-txt mb-0.5">{r.name}{r.star?" ⭐":""}</div>
                      <div className="text-[11px] text-sub">{r.city} · dans {wks} sem.</div>
                    </div>
                    <div className="text-[16px] text-mut">›</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      <div className="flex flex-col gap-2.5">
        <Btn label="Voir toutes les courses" onClick={p.onGoToCourses} full/>
        <Btn label="Continuer sans plan structuré" onClick={function(){setForceNoPlan(true);}} variant="ghost" full/>
      </div>
    </div>
  );}
  if(forceNoPlan){var rd2=getCourseReadiness(p.race,p.profile,weeksUntil);return(
    <div><LogoBar/>
      <div className="px-4 pt-4">
        <div className="text-[18px] font-bold text-txt mb-1">{p.race.name}</div>
        <div className="text-[13px] text-sub mb-4">{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4"
          style={{background:rd2.color+"12",border:"1px solid "+rd2.color+"33"}}>
          <span className="text-[14px]">{rd2.icon}</span>
          <span className="text-[12px] font-bold" style={{color:rd2.color}}>{rd2.label}</span>
          <span className="text-[12px] text-sub"> · {rd2.msg}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {TIPS.map(function(tip,i){return(
            <div key={i} className="flex gap-3.5 px-4 py-3.5 bg-surf rounded-2xl border border-bord">
              <div className="text-[24px] shrink-0">{tip.icon}</div>
              <div>
                <div className="text-[14px] font-semibold text-txt mb-1">{tip.title}</div>
                <div className="text-[12px] text-sub leading-[1.6]">{tip.desc}</div>
              </div>
            </div>
          );})}
        </div>
        <div className="mt-4 mb-6"><Btn label="Choisir une autre course" onClick={function(){setForceNoPlan(false);p.onGoToCourses();}} variant="ghost" full/></div>
      </div>
    </div>
  );}
  if(planWeeks.length===0){return(<div className="px-6 py-[60px] text-center"><div className="text-[18px] font-semibold text-txt mb-2">Plan indisponible</div><Btn label="Choisir une autre course" onClick={p.onGoToCourses} full/></div>);}

  var rd=getCourseReadiness(p.race,p.profile,weeksUntil);
  return(
    <><div><LogoBar/>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[26px] font-extrabold text-txt tracking-[-0.4px]">{p.race.name}</div>
          <span className="px-2.5 py-[3px] rounded-[20px] text-[12px] font-semibold"
            style={{background:(p.race.type==="trail"?GR:BL)+"22",color:p.race.type==="trail"?GR:BL}}>{weeksUntil(p.race.date)} sem.</span>
        </div>
        <div className="text-[13px] text-sub mb-2.5">{p.race.dist} km · {p.race.city} · {fmtS(new Date(p.race.date))}</div>
        <div className="bg-surf2 rounded-xl px-3.5 py-3 mb-2.5 border border-bord">
          <div className="flex gap-4 mb-2">
            <div className="flex-1 text-center">
              <div className="text-[20px] font-extrabold" style={{color:OR}}>{planWeeks.length}</div>
              <div className="text-[10px] text-mut mt-0.5">Plan proposé</div>
            </div>
            <div className="w-px bg-bord"/>
            <div className="flex-1 text-center">
              <div className="text-[20px] font-extrabold" style={{color:plan.idealWeeks>plan.availWeeks?YE:GR}}>{plan.idealWeeks}</div>
              <div className="text-[10px] text-mut mt-0.5">Sem. idéales</div>
            </div>
            <div className="w-px bg-bord"/>
            <div className="flex-1 text-center">
              <div className="text-[20px] font-extrabold text-info">{weeksUntil(p.race.date)}</div>
              <div className="text-[10px] text-mut mt-0.5">Sem. restantes</div>
            </div>
          </div>
          <div className="text-[11px] text-sub text-center border-t border-bord pt-2">Début recommandé : <span className="text-txt font-semibold">{fmtDate(plan.planStart)}</span></div>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-2.5" style={{background:rd.color+"12",border:"1px solid "+rd.color+"33"}}>
          <span className="text-[14px]">{rd.icon}</span>
          <div className="flex-1"><span className="text-[12px] font-bold" style={{color:rd.color}}>{rd.label}</span><span className="text-[12px] text-sub"> · {rd.msg}</span></div>
        </div>
        <button onClick={function(){if(planLevel(p.profile)<2){setShowStrategyUpgrade(true);}else{setShowStrategy(true);}}}
          className="w-full mt-2.5 py-[11px] rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-1.5"
          style={{background:planLevel(p.profile)>=2?OR+"15":SURF2,border:"1px solid "+(planLevel(p.profile)>=2?OR+"44":BORD),color:planLevel(p.profile)>=2?OR:MUT}}>
          {planLevel(p.profile)<2&&<span className="text-[12px]">🔒</span>}Stratégie de course · Splits{planLevel(p.profile)<2&&<span className="text-[10px] font-bold ml-1" style={{color:OR}}>Pro</span>}
        </button>
      </div>
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto px-4 pb-4 touch-pan-x">
        {planWeeks.map(function(wk,i){
          var isA=i===activeIdx;var pc=wk.phaseColor;
          var locked=planLevel(p.profile)<1&&i>=FREE_PLAN_WEEKS;
          return(
          <div key={i} onClick={function(){locked?setShowPlanUpgrade(true):setSelWeek(i);}}
            className="shrink-0 w-[54px] text-center py-2.5 px-1 rounded-xl cursor-pointer relative"
            style={{border:"1.5px solid "+(isA?pc:BORD),background:isA?pc+"20":locked?SURF2:SURF,opacity:locked?0.5:wk.isPast?0.55:1}}>
            {wk.isCurrent&&!locked?<div className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[7px] font-bold rounded-[4px] px-[5px] py-[1px] whitespace-nowrap" style={{background:OR}}>now</div>:null}
            {i===planWeeks.length-1&&!locked?<div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">🏁</div>:null}
            {locked?<div className="text-[11px] mb-0.5">🔒</div>:<div className="text-[8px] font-bold uppercase tracking-[0.5px] mb-[3px]" style={{color:isA?pc:MUT}}>{wk.phaseLabel.slice(0,3)}</div>}
            <div className="text-[14px] font-bold" style={{color:locked?MUT:isA?pc:TXT}}>S{wk.num}</div>
            <div className="text-[9px] mt-[1px]" style={{color:locked?MUT:isA?pc:MUT}}>{locked?"—":wk.isRecup?"R":wk.km+"k"}</div>
          </div>
        );})}
      </div>
      {w?(
        <div key={activeIdx} className="px-4">
          {planLevel(p.profile)<1&&activeIdx>=FREE_PLAN_WEEKS?(
            <div className="text-center px-5 py-10">
              <div className="text-[40px] mb-4">🔒</div>
              <div className="text-[18px] font-bold text-txt mb-2">Plan complet — Essential</div>
              <div className="text-[13px] text-sub leading-[1.7] mb-2">
                Tu as accès aux <span className="font-bold" style={{color:OR}}>{FREE_PLAN_WEEKS} premières semaines</span> gratuitement.<br/>
                Passe en Essential pour débloquer les <span className="font-bold text-info">{planWeeks.length-FREE_PLAN_WEEKS} semaines restantes</span> et suivre ton plan jusqu'à la course.
              </div>
              <div className="text-[12px] text-mut mb-6">Semaine {activeIdx+1} sur {planWeeks.length}</div>
              <Btn label="Passer à Essential — 4,99 €/mois" onClick={function(){p.onShowPricing&&p.onShowPricing();}} full/>
              <button onClick={function(){setSelWeek(FREE_PLAN_WEEKS-1);}} className="mt-3 bg-transparent border-none text-mut text-[12px] cursor-pointer font-[inherit]">← Revenir à la semaine {FREE_PLAN_WEEKS}</button>
            </div>
          ):(
            <>
              <Card style={{marginBottom:12}}>
                <div className="px-[18px] py-4 border-b border-bord">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-[0.5px] mb-1" style={{color:w.phaseColor}}>{w.phaseLabel}{w.isRecup?" · Récupération":""}</div>
                      <div className="text-[20px] font-bold text-txt">Semaine {w.num}<span className="text-[14px] text-sub font-normal"> / {w.total}</span></div>
                    </div>
                    <div className="text-right"><div className="text-[13px] font-semibold text-txt">{fmtS(w.weekStart)}</div><div className="text-[12px] text-sub">au {fmtS(w.weekEnd)}</div></div>
                  </div>
                </div>
                <div className="flex px-[18px] py-3.5">
                  <Stat value={w.km+" km"} label="volume" color={w.phaseColor}/>
                  <div className="w-px bg-bord"/>
                  <Stat value={w.sessions.length} label="séances" color={BL}/>
                </div>
              </Card>
              {planLevel(p.profile)<1&&activeIdx===FREE_PLAN_WEEKS-1&&(
                <div onClick={function(){p.onShowPricing&&p.onShowPricing();}}
                  className="mb-3 px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center justify-between"
                  style={{background:BL+"12",border:"1px solid "+BL+"33"}}>
                  <span className="text-[12px] font-semibold text-info">📋 {planWeeks.length-FREE_PLAN_WEEKS} semaines de plan verrouillées</span>
                  <span className="text-[10px] font-bold px-2 py-[2px] rounded-[6px]" style={{color:BL,background:BL+"22"}}>Essential →</span>
                </div>
              )}
              {w.sessions.map(function(s,si){return <SessionCard key={si} session={s} profile={p.profile} isNext={!!(nextSessDate&&s.date&&s.date.getTime()===nextSessDate.getTime())} onShowPricing={p.onShowPricing}/>;})}
              <div className="flex gap-2.5 mb-6 mt-1">
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
    {showPlanUpgrade&&<UpgradeModal feature={"Plan complet · "+planWeeks.length+" semaines"} minPlanLabel="Essential" minPlanColor={BL} onClose={function(){setShowPlanUpgrade(false);}} onUpgrade={function(){setShowPlanUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
