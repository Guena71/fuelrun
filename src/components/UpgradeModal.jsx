import { useEffect } from "react";
import { SURF, BORD, TXT, SUB, OR } from "../data/constants.js";
import { logEvent, analytics } from "../firebase.js";

export function UpgradeModal({feature,minPlanLabel,minPlanColor,onClose,onUpgrade}){
  var col=minPlanColor||OR;
  useEffect(function(){logEvent(analytics,"upgrade_viewed",{feature:feature,plan:minPlanLabel});},[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:SURF,borderRadius:22,padding:"32px 24px 24px",width:"100%",maxWidth:360,textAlign:"center",border:"1px solid "+BORD}}>
        <div style={{fontSize:44,marginBottom:14}}>🔒</div>
        <div style={{fontSize:18,fontWeight:800,color:TXT,marginBottom:8}}>{feature}</div>
        <div style={{fontSize:13,color:SUB,marginBottom:8,lineHeight:1.7}}>Cette fonctionnalité est disponible à partir du plan <span style={{color:col,fontWeight:700}}>{minPlanLabel}</span>.</div>
        <div style={{fontSize:12,color:col,fontWeight:600,marginBottom:20,padding:"8px 12px",borderRadius:8,background:col+"15",border:"1px solid "+col+"30"}}>14 jours gratuits · Sans carte bancaire requise</div>
        <button onClick={onUpgrade} style={{width:"100%",padding:"14px",borderRadius:12,background:col,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Essayer 14 jours gratuit</button>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,background:"transparent",border:"1px solid "+BORD,color:SUB,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Plus tard</button>
      </div>
    </div>
  );
}
