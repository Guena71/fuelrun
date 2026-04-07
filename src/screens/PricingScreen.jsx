import { useState } from "react";
import { analytics, logEvent } from "../firebase.js";
import { SURF2, BORD, TXT, SUB, MUT, OR } from "../data/constants.js";
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
      else{setCheckoutLoading(null);alert("Erreur : "+data.error);}
    }).catch(function(){setCheckoutLoading(null);alert("Erreur réseau, réessaie.");});
  }

  return(
    <div className="min-h-screen bg-bg flex flex-col px-6 pb-10 overflow-y-auto">
      {p.onClose?(
        <div className="flex items-center gap-3 pt-4">
          <button onClick={p.onClose}
            className="bg-transparent border-none text-brand text-sm font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 p-0">
            ← Retour
          </button>
        </div>
      ):<LogoBar/>}
      <div style={{paddingTop:p.onClose?12:28}} className="mb-5">
        <div className="text-[28px] font-extrabold text-txt mb-1.5">Choisir ma formule</div>
        <div className="text-sm text-sub">Sans engagement · Résiliable à tout moment</div>
      </div>
      <div className="flex flex-col gap-3">
        {PLANS.map(function(pl,i){
          var isLoading=checkoutLoading===pl.id;
          var isPrimary=i===2;
          return(
            <div key={i} onClick={function(){if(!checkoutLoading)handlePlan(pl);}
            } className="relative rounded-2xl px-[18px] py-4 cursor-pointer"
              style={{
                background:isPrimary?OR+"10":SURF2,
                border:"1.5px solid "+(isPrimary?OR:BORD),
                cursor:checkoutLoading?"not-allowed":"pointer",
                opacity:checkoutLoading&&!isLoading?0.6:1
              }}>
              {pl.tag&&(
                <div className="absolute -top-2.5 right-4 text-white text-[10px] font-bold rounded-[6px] px-2.5 py-[2px]"
                  style={{background:pl.color}}>{pl.tag}</div>
              )}
              <div className="flex items-center justify-between mb-1">
                <div className="text-[17px] font-extrabold" style={{color:isPrimary?OR:TXT}}>{pl.name}</div>
                <div>
                  <span className="text-[22px] font-extrabold" style={{color:pl.color}}>{pl.price==="0"?"0 €":pl.price+"€"}</span>
                  <span className="text-[11px] text-mut ml-[3px]">{pl.per}</span>
                </div>
              </div>
              <div className="text-[12px] text-sub mb-2.5">{pl.desc}</div>
              <div className="h-px bg-bord mb-2.5"/>
              <div className="flex flex-col gap-1.5 mb-3">
                {pl.items.map(function(it,j){
                  var isHeader=it.endsWith(":");
                  return(
                    <div key={j} className="flex items-center gap-2">
                      {isHeader
                        ?<span className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{color:pl.color}}>{it}</span>
                        :<>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{background:pl.color+"22",border:"1px solid "+pl.color+"44"}}>
                            <div className="w-[5px] h-[5px] rounded-full" style={{background:pl.color}}/>
                          </div>
                          <span className="text-[13px]" style={{color:i===0?SUB:TXT}}>{it}</span>
                        </>
                      }
                    </div>
                  );
                })}
              </div>
              <div className="rounded-[10px] py-2.5 text-center"
                style={{background:isPrimary?OR:SURF2,border:!isPrimary?"1px solid "+BORD:"none"}}>
                <span className="text-[13px] font-semibold" style={{color:isPrimary?"#fff":MUT}}>
                  {isLoading?"Redirection…":pl.cta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
