import { SURF2, BORD, TXT, SUB, MUT, OR } from "../data/constants.js";
import { RunnerHero } from "./RunnerHero.jsx";
import { Btn } from "./ui.jsx";

export function LogoBar(p){
  return(
    <div style={{display:"flex",alignItems:"center",padding:"12px 24px 0"}}>
      <div style={{animation:"bounce 1.8s ease-in-out infinite",filter:"drop-shadow(0 0 12px "+OR+"60)"}}><RunnerHero size={56}/></div>
      <span style={{fontSize:30,fontWeight:800,color:TXT,letterSpacing:"-0.5px",marginLeft:14}}>FuelRun</span>
      {p.onSignOut&&(
        <button onClick={p.onSignOut} title="Se déconnecter" style={{marginLeft:"auto",width:36,height:36,borderRadius:10,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={MUT} strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke={MUT} strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}

export function HeroScreen(p){
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0a",display:"flex",flexDirection:"column",padding:"0 24px 40px"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:16,paddingTop:40}}>
        <div style={{animation:"run 2.5s ease-in-out infinite"}}><RunnerHero size={160}/></div>
        <div style={{fontSize:38,fontWeight:800,color:TXT,letterSpacing:"-0.5px"}}>FuelRun</div>
        <div style={{fontSize:16,color:SUB,maxWidth:280,lineHeight:1.8}}>Entraînement · Nutrition · Performance</div>
        <div style={{padding:"12px 20px",background:OR+"12",borderRadius:12,border:"1px solid "+OR+"30",maxWidth:320}}>
          <div style={{fontSize:14,color:OR,fontWeight:600,fontStyle:"italic"}}>Pas besoin d'être rapide, l'important est de commencer !</div>
        </div>
        <div style={{marginTop:24,width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:10}}>
          <Btn label="Commencer" onClick={p.onCommencer} size="lg" full/>
          <Btn label="J'ai déjà un compte" onClick={p.onLogin} variant="ghost" size="md" full/>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:11,color:MUT}}>En continuant, vous acceptez les conditions d'utilisation.</div>
    </div>
  );
}
