import { useState } from "react";
import { SURF, SURF2, BORD, TXT, OR } from "../data/constants.js";

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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)p.onClose();}}>
      <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 24px 36px",animation:"slideUp .3s ease"}}>
        <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 24px"}}/>
        <div style={{display:"flex",gap:4,marginBottom:24}}>{WB_QS.map(function(_,i){return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?OR:SURF2}}/>;}) }</div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:10}}>{q.emoji}</div>
          <div style={{fontSize:20,fontWeight:700,color:TXT}}>{q.label}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {q.opts.map(function(o,i){return <button key={i} onClick={function(){answer(o.v);}} style={{padding:"14px 10px",borderRadius:12,border:"1px solid "+BORD,background:SURF2,color:TXT,fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{o.l}</button>;})}
        </div>
      </div>
    </div>
  );
}
