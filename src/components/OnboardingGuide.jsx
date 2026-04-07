import { useState } from "react";
import { OR } from "../data/constants.js";

var GUIDE_STEPS=[
  {tab:"home",     title:"Ton tableau de bord",   desc:"Retrouve ici ta prochaine séance, ton objectif course et ton état de forme."},
  {tab:"courses",  title:"Trouve ta course",       desc:"Sélectionne une course objectif et laisse FuelRun générer ton plan personnalisé."},
  {tab:"training", title:"Ton plan d'entraînement",desc:"Toutes tes séances semaine par semaine, avec nutrition et recettes intégrées."},
  {tab:"suivi",    title:"Suis ta progression",    desc:"Visualise tes km, tes sorties récentes et ta progression vers la course."},
  {tab:"coach",    title:"Ton coach IA",           desc:"Pose toutes tes questions à ton coach personnel, disponible 24h/24."},
];
var NAV_IDS=["home","courses","training","suivi","coach"];

export function OnboardingGuide(p){
  var [step,setStep]=useState(0);
  var current=GUIDE_STEPS[step];
  var tabIndex=NAV_IDS.indexOf(current.tab);
  var tabPct=tabIndex>=0?(tabIndex+0.5)/NAV_IDS.length*100:50;
  function next(){if(step<GUIDE_STEPS.length-1){setStep(step+1);p.onTab("/"+GUIDE_STEPS[step+1].tab);}else{p.onDone();}}
  return(
    <div className="fixed inset-0 z-[500] pointer-events-none">
      <div className="absolute inset-0 bg-black/55 pointer-events-auto" onClick={p.onDone}/>
      <div className="pointer-events-auto anim-fadeIn" style={{
        position:"absolute",bottom:90,
        left:"clamp(8px, calc("+tabPct+"% - 130px), calc(100% - 268px))",
        maxWidth:260,width:"calc(100% - 16px)"
      }}>
        <div className="bg-brand rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,.4)]">
          <div className="text-[13px] font-bold text-white mb-1.5">{current.title}</div>
          <div className="text-[12px] text-white/85 leading-relaxed mb-3.5">{current.desc}</div>
          <div className="flex justify-between items-center">
            <button onClick={p.onDone} className="text-[11px] text-white/70 bg-transparent border-none cursor-pointer font-[inherit]">Passer</button>
            <button onClick={next} className="px-4 py-[7px] rounded-[20px] bg-white border-none text-brand text-[12px] font-bold cursor-pointer font-[inherit]">
              {step<GUIDE_STEPS.length-1?"Suivant →":"Terminer"}
            </button>
          </div>
        </div>
        <div style={{width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid "+OR,margin:"0 auto"}}/>
      </div>
      <div className="absolute bottom-[76px] left-1/2 -translate-x-1/2 flex gap-[5px] pointer-events-auto">
        {GUIDE_STEPS.map(function(_,i){
          return <div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i===step?"#fff":"rgba(255,255,255,.3)",transition:"width .3s"}}/>;
        })}
      </div>
    </div>
  );
}
