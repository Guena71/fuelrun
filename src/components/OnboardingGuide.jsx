import { useState } from "react";
import { TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
import { RunnerHero } from "./RunnerHero.jsx";

var SLIDES=[
  {
    icon:null,runner:true,
    title:"Bienvenue sur FuelRun",
    desc:"Ton application de running personnalisée — plan d'entraînement, nutrition et coaching adaptés à ton niveau.",
    cta:"Commencer",
  },
  {
    icon:"🏁",
    title:"Choisis ta course objectif",
    desc:"Sélectionne un 10 km, un semi, un marathon ou un trail. FuelRun génère ton plan semaine par semaine jusqu'au jour J.",
    cta:"Suivant",
  },
  {
    icon:"💪",
    title:"Entraîne-toi intelligemment",
    desc:"Chaque semaine : séances de course, renforcement musculaire et nutrition adaptés à ta forme du moment.",
    cta:"Suivant",
  },
  {
    icon:"🏃",
    title:"Suis ta progression",
    desc:"Enregistre tes sorties, valide tes séances et pose tes questions à ton coach disponible 24h/24.",
    cta:"C'est parti !",
  },
];

export function OnboardingGuide(p){
  var [step,setStep]=useState(0);
  var slide=SLIDES[step];
  var isLast=step===SLIDES.length-1;

  function next(){
    if(isLast){p.onDone();}
    else{setStep(step+1);}
  }

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={p.onDone}/>
      <div onClick={function(e){e.stopPropagation();}} style={{position:"relative",background:"#111111",borderRadius:"24px 24px 0 0",border:"1px solid rgba(255,255,255,0.1)",borderBottom:"none",padding:"32px 24px 48px",display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>

        {/* Drag handle */}
        <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.15)",marginBottom:32}}/>

        {/* Icon / Illustration */}
        <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {slide.runner?(
            <div style={{animation:"bounce 1.8s ease-in-out infinite",filter:"drop-shadow(0 0 24px "+OR+"60)"}}>
              <RunnerHero size={100}/>
            </div>
          ):(
            <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,"+OR+"22,"+OR+"08)",border:"1px solid "+OR+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
              {slide.icon}
            </div>
          )}
        </div>

        {/* Text */}
        <div style={{fontSize:22,fontWeight:800,color:TXT,textAlign:"center",letterSpacing:"-0.3px",marginBottom:12,lineHeight:1.2}}>{slide.title}</div>
        <div style={{fontSize:14,color:SUB,textAlign:"center",lineHeight:1.7,maxWidth:320,marginBottom:32}}>{slide.desc}</div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {SLIDES.map(function(_,i){return(
            <div key={i} style={{height:4,borderRadius:2,background:i===step?OR:"rgba(255,255,255,0.15)",width:i===step?24:8,transition:"all 0.3s ease"}}/>
          );})}
        </div>

        {/* Buttons */}
        <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={next} style={{width:"100%",padding:"15px",borderRadius:14,background:OR,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.2}}>
            {slide.cta}
          </button>
          {!isLast&&(
            <button onClick={p.onDone} style={{width:"100%",padding:"10px",borderRadius:14,background:"none",border:"none",color:MUT,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
              Passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
