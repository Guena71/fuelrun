import { useState } from "react";
import { SURF, BORD, TXT, SUB, MUT, OR } from "../data/constants.js";

export function WeeklyContractModal({onCommit,onClose}){
  var [target,setTarget]=useState(3);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"28px 24px 40px",animation:"slideUp .3s ease"}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 20px"}}/>
        <div style={{fontSize:22,fontWeight:800,color:TXT,marginBottom:6}}>🤝 Contrat de la semaine</div>
        <div style={{fontSize:13,color:SUB,lineHeight:1.6,marginBottom:24}}>
          Engage-toi sur un nombre de séances pour cette semaine. Si tu tiens parole, tu gagnes <span style={{color:OR,fontWeight:700}}>+50 pts</span> et un badge.
        </div>
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,color:MUT}}>Séances cette semaine</span>
            <span style={{fontSize:24,fontWeight:800,color:OR}}>{target}</span>
          </div>
          <input type="range" min={1} max={7} value={target} onChange={function(e){setTarget(parseInt(e.target.value));}} style={{width:"100%",accentColor:OR}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontSize:10,color:MUT}}>1</span>
            <span style={{fontSize:10,color:MUT}}>7</span>
          </div>
        </div>
        <div style={{background:OR+"12",border:"1px solid "+OR+"33",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🎯</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:OR}}>Objectif : {target} séance{target>1?"s":""}</div>
            <div style={{fontSize:11,color:MUT}}>Récompense si tenu : +50 pts + badge 🤝</div>
          </div>
        </div>
        <button onClick={function(){onCommit(target);}} style={{width:"100%",padding:"15px",borderRadius:14,background:OR,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Je m'engage !
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:14,background:"none",border:"none",color:MUT,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
          Pas cette semaine
        </button>
      </div>
    </div>
  );
}
