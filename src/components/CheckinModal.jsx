import { useState } from "react";
import { SURF2, OR } from "../data/constants.js";

var WB_QS=[
  {id:"sleep",     label:"Sommeil cette nuit", emoji:"😴",opts:[{l:"Moins de 5 h",v:1},{l:"5–6 h",v:2},{l:"7–8 h",v:3},{l:"Plus de 8 h",v:4}]},
  {id:"stress",    label:"Niveau de stress",   emoji:"🧠",opts:[{l:"Très élevé",v:1}, {l:"Élevé",v:2},  {l:"Normal",v:3},{l:"Relax",v:4}]},
  {id:"legs",      label:"Tes jambes",          emoji:"🦵",opts:[{l:"Très lourdes",v:1},{l:"Fatiguées",v:2},{l:"Normales",v:3},{l:"Légères",v:4}]},
  {id:"motivation",label:"Motivation",          emoji:"🔥",opts:[{l:"Zéro",v:1},      {l:"Bof",v:2},    {l:"Bonne",v:3}, {l:"À fond",v:4}]}
];

export function CheckinModal(p){
  var [step,setStep]=useState(0);var [answers,setAnswers]=useState({});
  var q=WB_QS[step];
  function answer(v){var na=Object.assign({},answers,{[q.id]:v});setAnswers(na);if(step<WB_QS.length-1)setStep(function(s){return s+1;});else p.onDone(na);}
  return(
    <div className="fixed inset-0 bg-black/75 z-[200] flex items-end justify-center"
      onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div className="bg-surf rounded-t-[20px] w-full max-w-[430px] px-6 pb-9 pt-6 anim-slideUp">
        <div className="w-10 h-1 rounded bg-bord mx-auto mb-6"/>
        <div className="flex gap-1 mb-6">
          {WB_QS.map(function(_,i){return <div key={i} className="flex-1 h-[3px] rounded" style={{background:i<=step?OR:SURF2}}/>;}) }
        </div>
        <div className="text-center mb-6">
          <div className="text-[40px] mb-2.5">{q.emoji}</div>
          <div className="text-xl font-bold text-txt">{q.label}</div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {q.opts.map(function(o,i){return(
            <button key={i} onClick={function(){answer(o.v);}}
              className="px-2.5 py-3.5 rounded-xl border border-bord bg-surf2 text-txt text-sm font-medium cursor-pointer font-[inherit]">
              {o.l}
            </button>
          );})}
        </div>
      </div>
    </div>
  );
}
