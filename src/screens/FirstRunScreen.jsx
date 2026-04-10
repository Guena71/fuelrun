import { useState } from "react";
import { BG, SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
import { LogoBar } from "../components/HeroScreen.jsx";

var TIPS=[
  {icon:"🐢", title:"Commence lentement", desc:"Tu dois pouvoir parler en courant. C'est le bon rythme pour débuter."},
  {icon:"💧", title:"Hydrate-toi", desc:"Bois un grand verre d'eau 30 min avant de partir."},
  {icon:"⏱️", title:"La durée, pas la distance", desc:"20 minutes à allure libre. Peu importe les km parcourus."},
];

var STEPS=[
  {min:"0–5 min",  label:"Marche rapide",  color:GR,  desc:"Échauffement. Fais monter ta fréquence cardiaque doucement."},
  {min:"5–15 min", label:"Course légère",   color:OR,  desc:"Allure confortable. Tu dois pouvoir parler en faisant de courtes phrases."},
  {min:"15–20 min",label:"Retour au calme", color:BL,  desc:"Ralentis progressivement. Termine par 2 min de marche."},
];

export function FirstRunScreen({onStart}){
  var [ready,setReady]=useState(false);

  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <LogoBar/>
      <div style={{flex:1,padding:"24px 24px 120px",overflowY:"auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:52,marginBottom:12}}>🔥</div>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.5px",marginBottom:8}}>
            Ton premier défi
          </div>
          <div style={{fontSize:14,color:SUB,lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>
            Chaque grand coureur a eu une première sortie.<br/>La tienne commence aujourd'hui.
          </div>
        </div>

        {/* Challenge card */}
        <div style={{background:"linear-gradient(135deg,"+OR+"22,"+OR+"08)",border:"1.5px solid "+OR+"44",borderRadius:16,padding:"18px 16px",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{fontSize:22}}>🏃</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:OR,textTransform:"uppercase",letterSpacing:0.6}}>Challenge #1</div>
              <div style={{fontSize:16,fontWeight:800,color:TXT}}>Course de découverte</div>
            </div>
            <div style={{marginLeft:"auto",background:OR+"22",border:"1px solid "+OR+"44",borderRadius:10,padding:"4px 10px"}}>
              <div style={{fontSize:11,fontWeight:700,color:OR}}>+150 XP</div>
            </div>
          </div>

          {/* Déroulé */}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {STEPS.map(function(s,i){return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,background:SURF2,border:"1px solid "+BORD}}>
                <div style={{width:4,height:36,borderRadius:2,background:s.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:12,fontWeight:700,color:s.color}}>{s.min}</span>
                    <span style={{fontSize:12,fontWeight:600,color:TXT}}>{s.label}</span>
                  </div>
                  <div style={{fontSize:11,color:SUB,lineHeight:1.4}}>{s.desc}</div>
                </div>
              </div>
            );})}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:OR+"12"}}>
            <span style={{fontSize:14}}>🎯</span>
            <span style={{fontSize:12,color:OR,fontWeight:600}}>Objectif : 20 minutes · Allure libre · Peu importe la distance</span>
          </div>
        </div>

        {/* Tips */}
        <div style={{fontSize:13,fontWeight:700,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>
          3 conseils pour réussir
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {TIPS.map(function(t,i){return(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",borderRadius:12,background:SURF,border:"1px solid "+BORD}}>
              <span style={{fontSize:22,flexShrink:0}}>{t.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:TXT,marginBottom:2}}>{t.title}</div>
                <div style={{fontSize:12,color:SUB,lineHeight:1.5}}>{t.desc}</div>
              </div>
            </div>
          );})}
        </div>

        {/* Checkbox engagement */}
        <div
          onClick={function(){setReady(function(r){return !r;});}}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:"1.5px solid "+(ready?OR:BORD),background:ready?OR+"12":SURF,cursor:"pointer",marginBottom:8}}
        >
          <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(ready?OR:BORD),background:ready?OR:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
            {ready&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}
          </div>
          <span style={{fontSize:13,color:ready?OR:SUB,fontWeight:ready?600:400}}>Je m'engage à faire ma première sortie cette semaine</span>
        </div>

      </div>

      {/* CTA fixe */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"16px 24px 32px",background:"linear-gradient(to top,"+BG+" 70%,transparent)"}}>
        <button
          onClick={onStart}
          style={{width:"100%",padding:"16px",borderRadius:14,background:OR,border:"none",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px "+OR+"55",letterSpacing:0.2}}
        >
          {ready?"Je relève le défi ! 🔥":"C'est parti →"}
        </button>
        <div style={{textAlign:"center",marginTop:10,fontSize:11,color:MUT}}>
          Tu retrouveras ce défi dans l'onglet Accueil
        </div>
      </div>
    </div>
  );
}
