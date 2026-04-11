import { useState } from "react";
import { OR } from "../data/constants.js";

var GUIDE_STEPS=[
  {tab:"home",     title:"Ton tableau de bord",   desc:"Retrouve ici ta prochaine séance, ton objectif course et ton état de forme."},
  {tab:"courses",  title:"Trouve ta course",       desc:"Sélectionne une course objectif et laisse FuelRun générer ton plan personnalisé."},
  {tab:"training", title:"Ton plan d'entraînement",desc:"Toutes tes séances semaine par semaine, avec nutrition et recettes intégrées."},
  {tab:"suivi",    title:"Suis ta progression",    desc:"Visualise tes km, tes sorties récentes et ta progression vers la course."},
  {tab:"coach",    title:"Ton coach",           desc:"Pose toutes tes questions à ton coach personnel, disponible 24h/24."},
];
var NAV_IDS=["home","courses","training","suivi","coach"];

export function OnboardingGuide(p){
  var [step,setStep]=useState(0);
  var current=GUIDE_STEPS[step];
  var tabIndex=NAV_IDS.indexOf(current.tab);
  var tabPct=tabIndex>=0?(tabIndex+0.5)/NAV_IDS.length*100:50;
  function next(){if(step<GUIDE_STEPS.length-1){setStep(step+1);p.onTab(GUIDE_STEPS[step+1].tab);}else{p.onDone();}}
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",pointerEvents:"auto"}} onClick={p.onDone}/>
      <div style={{position:"absolute",bottom:90,left:"clamp(8px, calc("+tabPct+"% - 130px), calc(100% - 268px))",maxWidth:260,width:"calc(100% - 16px)",pointerEvents:"auto",animation:"fadeIn .3s ease"}}>
        <div style={{background:OR,borderRadius:14,padding:"14px 16px",boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:6}}>{current.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.6,marginBottom:14}}>{current.desc}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={p.onDone} style={{fontSize:11,color:"rgba(255,255,255,.7)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Passer</button>
            <button onClick={next} style={{padding:"7px 16px",borderRadius:20,background:"#fff",border:"none",color:OR,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{step<GUIDE_STEPS.length-1?"Suivant →":"Terminer"}</button>
          </div>
        </div>
        <div style={{width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid "+OR,margin:"0 auto"}}/>
      </div>
      <div style={{position:"absolute",bottom:76,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,pointerEvents:"auto"}}>
        {GUIDE_STEPS.map(function(_,i){return <div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,background:i===step?"#fff":"rgba(255,255,255,.3)",transition:"width .3s"}}/>;}) }
      </div>
    </div>
  );
}
