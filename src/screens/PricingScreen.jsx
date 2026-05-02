import { useState } from "react";
import { analytics, logEvent } from "../firebase.js";
import { BG, SURF2, BORD, TXT, SUB, MUT, OR, BL } from "../data/constants.js";
import { PLANS } from "../data/plans.js";
import { lsSet } from "../utils/storage.js";
import { LogoBar } from "../components/HeroScreen.jsx";

export function PricingScreen(p){
  var [checkoutLoading,setCheckoutLoading]=useState(null);
  var user=p.user||null;

  function handlePlan(pl){
    lsSet("fr_pending_plan",pl.id||"gratuit");
    logEvent(analytics,"purchase_started",{plan:pl.id||"gratuit",price:pl.price});
    if(pl.id==="gratuit"||!pl.id){p.onStart&&p.onStart();return;}
    if(!user){p.onStart&&p.onStart();return;}
    setCheckoutLoading(pl.id);
    fetch("/api/create-checkout-session",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({plan:pl.id,uid:user.uid})
    }).then(function(r){return r.json();}).then(function(data){
      if(data.url){window.location.href=data.url;}
      else if(data.upgraded){setCheckoutLoading(null);p.onUpgrade?p.onUpgrade(data.plan):p.onStart&&p.onStart();}
      else{setCheckoutLoading(null);alert("Erreur : "+data.error);}
    }).catch(function(){setCheckoutLoading(null);alert("Erreur réseau, réessaie.");});
  }

  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 40px",overflowY:"auto"}}>
      
      {p.onClose?(
        <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:"max(20px, env(safe-area-inset-top, 20px))"}}>
          <button onClick={p.onClose} style={{background:"none",border:"none",color:OR,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:0}}>← Retour</button>
        </div>
      ):<LogoBar/>}
      <div style={{paddingTop:p.onClose?12:28,marginBottom:20}}>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:6}}>Choisir ma formule</div>
        <div style={{fontSize:14,color:SUB}}>Sans engagement · Résiliable à tout moment</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {PLANS.map(function(pl,i){
          var isLoading=checkoutLoading===pl.id;
          var accent=i===2?OR:i===1?BL:null;
          return(
            <div key={i} onClick={function(){if(!checkoutLoading)handlePlan(pl);}} style={{position:"relative",background:accent?accent+"18":SURF2,border:"2px solid "+(accent||BORD),borderRadius:16,padding:"16px 18px",cursor:checkoutLoading?"not-allowed":"pointer",opacity:checkoutLoading&&!isLoading?0.6:1,boxShadow:accent?"0 0 0 1px "+accent+"33":undefined}}>
              {pl.tag?<div style={{position:"absolute",top:-10,right:16,background:pl.color,color:"#fff",fontSize:10,fontWeight:700,borderRadius:6,padding:"2px 10px"}}>{pl.tag}</div>:null}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontSize:17,fontWeight:800,color:accent||TXT}}>{pl.name}</div>
                <div><span style={{fontSize:22,fontWeight:800,color:pl.color}}>{pl.price==="0"?"0 €":pl.price+"€"}</span><span style={{fontSize:11,color:MUT,marginLeft:3}}>{pl.per}</span></div>
              </div>
              <div style={{fontSize:12,color:SUB,marginBottom:10}}>{pl.desc}</div>
              <div style={{height:1,background:BORD,marginBottom:10}}/>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                {pl.items.map(function(it,j){
                  var isHeader=it.endsWith(":");
                  return(<div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                    {isHeader
                      ?<span style={{fontSize:11,fontWeight:700,color:pl.color,textTransform:"uppercase",letterSpacing:0.5}}>{it}</span>
                      :<><div style={{width:16,height:16,borderRadius:"50%",background:pl.color+"22",border:"1px solid "+pl.color+"44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:5,height:5,borderRadius:"50%",background:pl.color}}/></div><span style={{fontSize:13,color:i===0?SUB:TXT}}>{it}</span></>
                    }
                  </div>);
                })}
              </div>
              <div style={{background:accent||SURF2,borderRadius:10,padding:"10px",textAlign:"center",border:!accent?"1px solid "+BORD:"none"}}>
                <span style={{fontSize:13,fontWeight:600,color:accent?"#fff":SUB}}>{isLoading?"Redirection…":pl.cta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
