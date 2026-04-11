import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SURF2, BORD, TXT, SUB, MUT, OR } from "../data/constants.js";
import { RunnerHero } from "./RunnerHero.jsx";
import { Btn } from "./ui.jsx";

var QUOTES=[
  "Pas besoin d'être rapide, l'important est de commencer !",
  "Chaque kilomètre parcouru est une victoire sur celui que tu étais hier.",
  "Le seul mauvais entraînement, c'est celui qu'on n'a pas fait.",
  "Tu n'as pas à être le meilleur. Tu as juste à être meilleur qu'avant.",
];

export function LogoBar(p){
  var navigate=useNavigate();
  return(
    <div style={{display:"flex",alignItems:"center",padding:"12px 24px 0"}}>
      <div onClick={function(){navigate("/home");}} style={{display:"flex",alignItems:"center",cursor:"pointer"}}>
        <div style={{animation:"bounce 1.8s ease-in-out infinite",filter:"drop-shadow(0 0 12px "+OR+"60)"}}><RunnerHero size={56}/></div>
        <span style={{fontSize:38,fontWeight:800,color:TXT,letterSpacing:"-0.5px",marginLeft:14}}>FuelRun</span>
      </div>
      {p.onSignOut&&(
        <button onClick={p.onSignOut} title="Se déconnecter" style={{marginLeft:"auto",width:36,height:36,borderRadius:10,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={MUT} strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke={MUT} strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}

export function HeroScreen(p){
  var [quoteIdx,setQuoteIdx]=useState(0);
  var [fade,setFade]=useState(true);

  useEffect(function(){
    var timer=setInterval(function(){
      setFade(false);
      setTimeout(function(){
        setQuoteIdx(function(i){return (i+1)%QUOTES.length;});
        setFade(true);
      },500);
    },5000);
    return function(){clearInterval(timer);};
  },[]);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1c0a00 0%,#120600 30%,#0a0a0a 65%,#0a0a0a 100%)",display:"flex",flexDirection:"column",padding:"0 24px 40px",position:"relative",overflow:"hidden"}}>
      {/* Halos décoratifs */}
      <div style={{position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:OR,opacity:0.07,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:80,left:-60,width:200,height:200,borderRadius:"50%",background:OR,opacity:0.04,pointerEvents:"none"}}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:16,paddingTop:40,position:"relative"}}>
        <div style={{animation:"run 2.5s ease-in-out infinite",filter:"drop-shadow(0 0 24px "+OR+"50)"}}><RunnerHero size={160}/></div>
        <div style={{fontSize:42,fontWeight:800,color:TXT,letterSpacing:"-1px",lineHeight:1}}>FuelRun</div>
        <div style={{fontSize:15,color:SUB,maxWidth:280,lineHeight:1.8,letterSpacing:0.2}}>Entraînement · Nutrition · Performance · Coaching</div>

        {/* Citation rotative */}
        <div style={{padding:"14px 20px",background:OR+"12",borderRadius:14,border:"1px solid "+OR+"28",maxWidth:320,minHeight:68,display:"flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.4s ease",opacity:fade?1:0}}>
          <div style={{fontSize:13,color:OR,fontWeight:600,fontStyle:"italic",lineHeight:1.6}}>"{QUOTES[quoteIdx]}"</div>
        </div>

        {/* CTA */}
        <div style={{marginTop:16,width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{position:"relative"}}>
            <Btn label="Commencer gratuitement" onClick={p.onCommencer} size="lg" full/>
            <div style={{marginTop:6,fontSize:11,color:OR,fontWeight:600,textAlign:"center"}}>14 jours gratuits · Sans carte bancaire</div>
          </div>
          <Btn label="J'ai déjà un compte" onClick={p.onLogin} variant="ghost" size="md" full/>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:11,color:MUT,position:"relative"}}>En continuant, vous acceptez les <span style={{color:MUT,textDecoration:"underline"}}>conditions d'utilisation</span>.</div>
    </div>
  );
}
