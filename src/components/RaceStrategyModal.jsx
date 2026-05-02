import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE } from "../data/constants.js";
import { calcSplits } from "../utils/vdot.js";
import { Btn } from "./ui.jsx";

export function RaceStrategyModal(p){
  var [goalH,setGoalH]=useState(""); var [goalM,setGoalM]=useState(""); var [goalS,setGoalS]=useState("00");
  var [strategy,setStrategy]=useState("even");
  var [splits,setSplits]=useState(null);
  var dist=p.race?p.race.dist:42;
  function calc(){
    var h=parseInt(goalH)||0,m=parseInt(goalM)||0,s=parseInt(goalS)||0;
    var total=h*3600+m*60+s;
    if(total<60)return;
    setSplits(calcSplits(dist,total,strategy));
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,animation:"slideUp .3s ease",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>

        {/* Header fixe */}
        <div style={{padding:"20px 20px 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:TXT}}>Stratégie de course</div>
              <div style={{fontSize:13,color:SUB,marginTop:2}}>{p.race&&p.race.name} · {dist} km</div>
            </div>
            <button onClick={p.onClose} style={{width:32,height:32,borderRadius:10,background:SURF2,border:"1px solid "+BORD,color:MUT,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
          </div>

          {/* Temps objectif */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:MUT,marginBottom:8,fontWeight:600}}>Temps objectif</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {[{val:goalH,set:setGoalH,ph:"0",label:"h"},{val:goalM,set:setGoalM,ph:"30",label:"min"},{val:goalS,set:setGoalS,ph:"00",label:"sec"}].map(function(f,i){return(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <input value={f.val} onChange={function(e){f.set(e.target.value);setSplits(null);}} type="number" min={0} max={i===0?23:59} placeholder={f.ph} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 4px",color:TXT,fontSize:20,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
                  <div style={{fontSize:10,color:MUT,marginTop:4}}>{f.label}</div>
                </div>
              );})}
            </div>
          </div>

          {/* Stratégie */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:MUT,marginBottom:8,fontWeight:600}}>Stratégie d'allure</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){setStrategy("even");setSplits(null);}} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1.5px solid "+(strategy==="even"?OR:BORD),background:strategy==="even"?OR+"15":"transparent",color:strategy==="even"?OR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Allure régulière</button>
              <button onClick={function(){setStrategy("negative");setSplits(null);}} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1.5px solid "+(strategy==="negative"?GR:BORD),background:strategy==="negative"?GR+"15":"transparent",color:strategy==="negative"?GR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Accélération finale</button>
            </div>
            <div style={{fontSize:11,color:MUT,marginTop:6,lineHeight:1.5}}>{strategy==="negative"?"Tu démarres 2% plus lentement, puis tu accélères progressivement — idéal pour finir en force.":"La même vitesse du début à la fin — simple et efficace pour les débutants."}</div>
          </div>

          <Btn label="Calculer mes temps de passage" onClick={calc} full style={{marginBottom:14}}/>
        </div>

        {/* Table des splits — scrollable */}
        {splits&&(
          <div style={{overflowY:"auto",flex:1,minHeight:0,padding:"0 20px",paddingBottom:"calc(24px + env(safe-area-inset-bottom, 0px))"}}>
            <div style={{background:SURF2,borderRadius:12,overflow:"hidden",border:"1px solid "+BORD}}>
              <div style={{display:"flex",padding:"10px 14px",borderBottom:"1px solid "+BORD,background:SURF2}}>
                <div style={{flex:1,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>Point km</div>
                <div style={{width:80,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"center"}}>Allure /km</div>
                <div style={{width:80,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"right"}}>Temps</div>
              </div>
              {splits.map(function(sp,i){
                var isHalf=splits.length>2&&i===Math.floor(splits.length/2)-1;
                var isFinish=i===splits.length-1;
                var acol=strategy==="negative"?(i<splits.length/2?YE:GR):OR;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",padding:"11px 14px",borderBottom:i<splits.length-1?"1px solid "+BORD+"80":"none",background:isFinish?OR+"10":isHalf?BL+"08":"transparent"}}>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:isFinish?700:500,color:isFinish?OR:TXT}}>{sp.km} km</span>
                      {isHalf&&<span style={{fontSize:10,color:BL,fontWeight:700,background:BL+"18",padding:"1px 6px",borderRadius:4}}>Mi-course</span>}
                      {isFinish&&<span style={{fontSize:10,color:OR,fontWeight:700,background:OR+"18",padding:"1px 6px",borderRadius:4}}>Arrivée !</span>}
                    </div>
                    <div style={{width:80,fontSize:13,fontWeight:600,color:acol,textAlign:"center"}}>{sp.pace}</div>
                    <div style={{width:80,fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT,textAlign:"right"}}>{sp.elapsed}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Espace safe area si pas de splits */}
        {!splits&&<div style={{height:"calc(24px + env(safe-area-inset-bottom, 0px))",flexShrink:0}}/>}
      </div>
    </div>
  );
}
