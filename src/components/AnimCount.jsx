import { useState, useEffect } from "react";
import { TXT } from "../data/constants.js";

export function AnimCount(p){
  var [disp,setDisp]=useState(0);
  useEffect(function(){var frame,start=null,to=parseFloat(p.value)||0;if(to===0)return;function step(ts){if(!start)start=ts;var pct=Math.min((ts-start)/600,1);setDisp(Math.round(to*pct));if(pct<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);return function(){cancelAnimationFrame(frame);};},[p.value]);
  return <span style={{color:p.color||TXT}}>{disp}</span>;
}
