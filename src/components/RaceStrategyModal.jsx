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
  var unit=dist<=21?1:dist<=50?5:10;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 20px 36px",animation:"slideUp .3s ease",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 20px"}}/>
        <div style={{fontSize:18,fontWeight:700,color:TXT,marginBottom:4}}>Stratégie de course</div>
        <div style={{fontSize:13,color:SUB,marginBottom:20}}>{p.race&&p.race.name} · {dist} km</div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:8}}>Temps objectif</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalH} onChange={function(e){setGoalH(e.target.value);setSplits(null);}} type="number" min={0} placeholder="00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>heures</div>
            </div>
            <span style={{fontSize:20,color:MUT,fontWeight:700}}>:</span>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalM} onChange={function(e){setGoalM(e.target.value);setSplits(null);}} type="number" min={0} max={59} placeholder="30" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>minutes</div>
            </div>
            <span style={{fontSize:20,color:MUT,fontWeight:700}}>:</span>
            <div style={{flex:1,textAlign:"center"}}>
              <input value={goalS} onChange={function(e){setGoalS(e.target.value);setSplits(null);}} type="number" min={0} max={59} placeholder="00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:10,color:MUT,marginTop:4}}>secondes</div>
            </div>
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:8}}>Stratégie d'allure</label>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){setStrategy("even");setSplits(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(strategy==="even"?OR:BORD),background:strategy==="even"?OR+"15":"transparent",color:strategy==="even"?OR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Allure régulière
            </button>
            <button onClick={function(){setStrategy("negative");setSplits(null);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(strategy==="negative"?GR:BORD),background:strategy==="negative"?GR+"15":"transparent",color:strategy==="negative"?GR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Split négatif
            </button>
          </div>
          <div style={{fontSize:11,color:MUT,marginTop:6,lineHeight:1.6}}>{strategy==="negative"?"2% plus lent en première moitié, 2% plus rapide en seconde — la méthode des champions.":"Même allure du début à la fin — fiable pour les débutants."}</div>
        </div>

        <Btn label="Générer mes splits" onClick={calc} full style={{marginBottom:16}}/>

        {splits&&(
          <div style={{background:SURF2,borderRadius:12,overflow:"hidden",border:"1px solid "+BORD}}>
            <div style={{display:"flex",padding:"10px 14px",borderBottom:"1px solid "+BORD}}>
              <div style={{flex:1,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>km</div>
              <div style={{width:70,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"center"}}>Allure</div>
              <div style={{width:70,fontSize:11,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,textAlign:"right"}}>Temps</div>
            </div>
            {splits.map(function(sp,i){
              var isHalf=Math.abs(sp.km-dist/2)<unit/2;
              var isFinish=sp.km===dist;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<splits.length-1?"1px solid "+BORD+"80":"none",background:isFinish?OR+"10":isHalf?BL+"08":"transparent"}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT}}>{sp.km} km</span>
                    {isHalf&&<span style={{fontSize:10,color:BL,fontWeight:600,marginLeft:6}}>Mi-course</span>}
                    {isFinish&&<span style={{fontSize:10,color:OR,fontWeight:600,marginLeft:6}}>Arrivée</span>}
                  </div>
                  <div style={{width:70,fontSize:13,fontWeight:600,color:strategy==="negative"?(i<splits.length/2?YE:GR):OR,textAlign:"center"}}>{sp.pace}/km</div>
                  <div style={{width:70,fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT,textAlign:"right"}}>{sp.elapsed}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
