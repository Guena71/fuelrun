import { useState } from "react";
import { SURF2, BORD, TXT, MUT, OR, GR, BL, YE } from "../data/constants.js";
import { calcSplits } from "../utils/vdot.js";
import { Btn } from "./ui.jsx";

var inputStyle={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 8px",color:TXT,fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"inherit"};

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
    <div className="fixed inset-0 bg-black/75 z-[300] flex items-end justify-center"
      onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div className="bg-surf rounded-t-[20px] w-full max-w-[430px] px-5 pb-9 pt-6 anim-slideUp max-h-[88vh] overflow-y-auto">
        <div className="w-10 h-1 rounded bg-bord mx-auto mb-5"/>
        <div className="text-lg font-bold text-txt mb-1">Stratégie de course</div>
        <div className="text-[13px] text-sub mb-5">{p.race&&p.race.name} · {dist} km</div>

        <div className="mb-3.5">
          <label className="text-[12px] text-mut block mb-2">Temps objectif</label>
          <div className="flex gap-2 items-center">
            {[
              {val:goalH,set:function(v){setGoalH(v);setSplits(null);},ph:"00",lbl:"heures"},
              {val:goalM,set:function(v){setGoalM(v);setSplits(null);},ph:"30",lbl:"minutes",max:59},
              {val:goalS,set:function(v){setGoalS(v);setSplits(null);},ph:"00",lbl:"secondes",max:59},
            ].reduce(function(acc,f,i){
              if(i>0)acc.push(<span key={"sep"+i} className="text-xl text-mut font-bold">:</span>);
              acc.push(
                <div key={i} className="flex-1 text-center">
                  <input value={f.val} onChange={function(e){f.set(e.target.value);}} type="number" min={0} max={f.max} placeholder={f.ph} style={inputStyle}/>
                  <div className="text-[10px] text-mut mt-1">{f.lbl}</div>
                </div>
              );
              return acc;
            },[])}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[12px] text-mut block mb-2">Stratégie d'allure</label>
          <div className="flex gap-2">
            <button onClick={function(){setStrategy("even");setSplits(null);}} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer font-[inherit]"
              style={{border:"1.5px solid "+(strategy==="even"?OR:BORD),background:strategy==="even"?OR+"15":"transparent",color:strategy==="even"?OR:MUT}}>
              Allure régulière
            </button>
            <button onClick={function(){setStrategy("negative");setSplits(null);}} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer font-[inherit]"
              style={{border:"1.5px solid "+(strategy==="negative"?GR:BORD),background:strategy==="negative"?GR+"15":"transparent",color:strategy==="negative"?GR:MUT}}>
              Split négatif
            </button>
          </div>
          <div className="text-[11px] text-mut mt-1.5 leading-relaxed">
            {strategy==="negative"
              ?"2% plus lent en première moitié, 2% plus rapide en seconde — la méthode des champions."
              :"Même allure du début à la fin — fiable pour les débutants."}
          </div>
        </div>

        <Btn label="Générer mes splits" onClick={calc} full style={{marginBottom:16}}/>

        {splits&&(
          <div className="bg-surf2 rounded-xl overflow-hidden border border-bord">
            <div className="flex px-3.5 py-2.5 border-b border-bord">
              <div className="flex-1 text-[11px] text-mut font-bold uppercase tracking-[0.5px]">km</div>
              <div className="w-[70px] text-[11px] text-mut font-bold uppercase tracking-[0.5px] text-center">Allure</div>
              <div className="w-[70px] text-[11px] text-mut font-bold uppercase tracking-[0.5px] text-right">Temps</div>
            </div>
            {splits.map(function(sp,i){
              var isHalf=Math.abs(sp.km-dist/2)<unit/2;
              var isFinish=sp.km===dist;
              return(
                <div key={i} className="flex items-center px-3.5 py-2.5"
                  style={{borderBottom:i<splits.length-1?"1px solid "+BORD+"80":"none",background:isFinish?OR+"10":isHalf?BL+"08":"transparent"}}>
                  <div className="flex-1">
                    <span style={{fontSize:13,fontWeight:isFinish?700:400,color:isFinish?OR:TXT}}>{sp.km} km</span>
                    {isHalf&&<span className="text-[10px] font-semibold ml-1.5" style={{color:BL}}>Mi-course</span>}
                    {isFinish&&<span className="text-[10px] font-semibold ml-1.5 text-brand">Arrivée</span>}
                  </div>
                  <div className="w-[70px] text-[13px] font-semibold text-center"
                    style={{color:strategy==="negative"?(i<splits.length/2?YE:GR):OR}}>{sp.pace}/km</div>
                  <div className="w-[70px] text-[13px] text-right"
                    style={{fontWeight:isFinish?700:400,color:isFinish?OR:TXT}}>{sp.elapsed}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
