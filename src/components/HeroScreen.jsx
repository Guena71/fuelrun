import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SURF2, BORD, TXT, SUB, MUT, OR } from "../data/constants.js";
import { RunnerHero } from "./RunnerHero.jsx";
import { Btn } from "./ui.jsx";
import { LegalModal } from "./LegalModal.jsx";

var QUOTES=[
  "Pas besoin d'être rapide, l'important est de commencer !",
  "Chaque kilomètre parcouru est une victoire sur celui que tu étais hier.",
  "Le seul mauvais entraînement, c'est celui qu'on n'a pas fait.",
  "Tu n'as pas à être le meilleur. Tu as juste à être meilleur qu'avant.",
];

var SLIDES=[
  {icon:"📅",title:"Plan sur mesure",desc:"De 5 km au marathon — ton programme semaine par semaine, adapté à ton niveau et ta date de course.",color:"#FF6B2B"},
  {icon:"🥗",title:"Nutrition ciblée",desc:"Calories, glucides, protéines et recettes adaptés à chaque type de séance. Rien à calculer.",color:"#22C55E"},
  {icon:"💪",title:"Renforcement intégré",desc:"Séances de renforcement musculaire incluses dans ton plan pour prévenir les blessures et progresser.",color:"#3B82F6"},
  {icon:"🏃",title:"Coach 24h/24",desc:"Pose tes questions à n'importe quelle heure — ton coach connaît ton plan, ton niveau et ton objectif.",color:"#A855F7"},
];

export function LogoBar(p){
  var navigate=useNavigate();
  var initials=p.profile?(p.profile.name||"").split(" ").map(function(w){return w[0]||"";}).join("").slice(0,2).toUpperCase()||"?":"";
  return(
    <div style={{display:"flex",alignItems:"center",paddingTop:"max(16px, env(safe-area-inset-top, 16px))",paddingBottom:12,paddingLeft:20,paddingRight:20,flexShrink:0}}>
      <div onClick={function(){navigate("/home");}} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
        <div style={{animation:"bounce 1.8s ease-in-out infinite",filter:"drop-shadow(0 0 10px "+OR+"60)"}}><RunnerHero size={44}/></div>
        <span style={{fontSize:34,fontWeight:800,color:TXT,letterSpacing:"-0.5px"}}>FuelRun</span>
      </div>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {p.onProfile&&(
          <button onClick={p.onProfile} title="Mon profil" style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,"+OR+"44,#1a0800)",border:"2px solid "+OR+"55",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={{fontSize:13,fontWeight:700,color:OR}}>{initials}</span>
          </button>
        )}
        {p.onSignOut&&(
          <button onClick={p.onSignOut} title="Se déconnecter" style={{width:38,height:38,borderRadius:10,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={MUT} strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke={MUT} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function HeroScreen(p){
  var [quoteIdx,setQuoteIdx]=useState(0);
  var [fade,setFade]=useState(true);
  var [slide,setSlide]=useState(null);
  var [legal,setLegal]=useState(null);

  useEffect(function(){
    var timer=setInterval(function(){
      setFade(false);
      setTimeout(function(){
        setQuoteIdx(function(i){return (i+1)%QUOTES.length;});
        setFade(true);
      },400);
    },4500);
    return function(){clearInterval(timer);};
  },[]);

  /* ── Feature slides ─────────────────────────────────────────────────── */
  if(slide!==null){
    var sl=SLIDES[slide];
    var isLast=slide===SLIDES.length-1;
    return(
      <div style={{height:"100vh",background:"linear-gradient(160deg,#1c0a00 0%,#120600 30%,#0a0a0a 65%,#0a0a0a 100%)",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:sl.color,opacity:0.07,pointerEvents:"none"}}/>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:24,flexShrink:0}}>
          <LogoBar/>
          <button onClick={function(){setSlide(null);}} style={{background:"none",border:"none",color:MUT,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Passer</button>
        </div>
        {/* Content centré */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px",textAlign:"center"}}>
          <div style={{width:88,height:88,borderRadius:26,background:sl.color+"18",border:"2px solid "+sl.color+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,marginBottom:24,boxShadow:"0 0 40px "+sl.color+"22"}}>
            {sl.icon}
          </div>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.5px",marginBottom:12,lineHeight:1.2}}>{sl.title}</div>
          <div style={{fontSize:14,color:SUB,maxWidth:300,lineHeight:1.7}}>{sl.desc}</div>
        </div>
        {/* Dots */}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20,flexShrink:0}}>
          {SLIDES.map(function(_,i){
            return <div key={i} style={{width:i===slide?24:8,height:8,borderRadius:4,background:i===slide?sl.color:sl.color+"30",transition:"all 0.3s ease"}}/>;
          })}
        </div>
        {/* CTA — espace constant sur tous les slides */}
        <div style={{padding:"0 24px 32px",display:"flex",flexDirection:"column",gap:10,flexShrink:0}}>
          {isLast
            ? <Btn label="C'est parti !" onClick={p.onCommencer} size="lg" full/>
            : <Btn label="Suivant →" onClick={function(){setSlide(slide+1);}} size="lg" full/>
          }
          <div style={{height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {!isLast&&(
              <button onClick={p.onCommencer} style={{background:"none",border:"none",color:MUT,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Commencer sans voir tout →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Page principale ────────────────────────────────────────────────── */
  return(
    <div style={{height:"100vh",background:"linear-gradient(160deg,#1c0a00 0%,#120600 30%,#0a0a0a 65%,#0a0a0a 100%)",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:OR,opacity:0.07,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:80,left:-60,width:200,height:200,borderRadius:"50%",background:OR,opacity:0.04,pointerEvents:"none"}}/>

      {/* Contenu centré */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 24px",gap:0,position:"relative"}}>
        <div style={{animation:"run 2.5s ease-in-out infinite",filter:"drop-shadow(0 0 32px "+OR+"60)",marginBottom:12}}><RunnerHero size={96}/></div>
        <div style={{fontSize:44,fontWeight:800,color:TXT,letterSpacing:"-1.5px",lineHeight:1,marginBottom:6}}>FuelRun</div>
        <div style={{fontSize:15,fontWeight:600,color:SUB,maxWidth:300,lineHeight:1.5,marginBottom:16,letterSpacing:"-0.1px"}}>
          De débutant à finisher —<br/>Ton plan d'entraînement intelligent
        </div>

        {/* Citation */}
        <div style={{width:"100%",maxWidth:360,margin:"0 0 14px",padding:"12px 18px",background:OR+"0e",borderRadius:12,border:"1px solid "+OR+"22",minHeight:52,display:"flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.4s ease",opacity:fade?1:0}}>
          <div style={{fontSize:12,color:OR,fontWeight:600,fontStyle:"italic",lineHeight:1.5,textAlign:"center"}}>"{QUOTES[quoteIdx]}"</div>
        </div>

        {/* Social proof */}
        <div style={{marginBottom:18}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{display:"flex"}}>{["#FF5A1F","#3B82F6","#22C55E","#F59E0B","#A855F7"].map(function(bg,i){return <div key={i} style={{width:20,height:20,borderRadius:"50%",background:bg,border:"2px solid #0a0a0a",marginLeft:i>0?-5:0,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center"}}>{["🏃","⚡","🔥","🏆","💪"][i]}</div>;})}</div>
            <div style={{fontSize:11,color:SUB,marginLeft:3}}><span style={{color:TXT,fontWeight:700}}>5 niveaux</span> · 5 km → 100 km · trail et route</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:8}}>
          <Btn label="Commencer gratuitement" onClick={function(){setSlide(0);}} size="lg" full/>
          <div style={{fontSize:11,color:OR,fontWeight:600,textAlign:"center"}}>Gratuit pour toujours · Plan Pro 14 jours offerts</div>
          <Btn label="J'ai déjà un compte" onClick={p.onLogin} variant="ghost" size="md" full/>
        </div>

        {/* Legal */}
        <div style={{textAlign:"center",fontSize:11,color:MUT,marginTop:14,lineHeight:1.6}}>
          En continuant, tu acceptes nos{" "}
          <span onClick={function(){setLegal("cgu");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>CGU</span>
          {" "}et notre{" "}
          <span onClick={function(){setLegal("confidentialite");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>Politique de confidentialité</span>
        </div>
      </div>
      <LegalModal open={legal} onClose={function(){setLegal(null);}}/>
    </div>
  );
}
