import { fmtTime, fmtPaceSec } from "./date.js";

export function calcVdot(distKm,timeSec){
  var t=timeSec/60;
  var v=(distKm*1000)/t;
  var pct=0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t);
  var vo2=-4.60+0.182258*v+0.000104*v*v;
  return vo2/pct;
}

export function vdotToPaces(vdot){
  function p(pct){
    var tv=pct*vdot;
    var a=0.000104,b=0.182258,c=-(4.60+tv);
    var v=(-b+Math.sqrt(b*b-4*a*c))/(2*a);
    var s=60000/v;
    var mn=Math.floor(s/60),sc=Math.round(s%60);
    if(sc>=60){mn++;sc=0;}
    return mn+":"+String(sc).padStart(2,"0");
  }
  return{easy:p(0.65),long:p(0.62),tempo:p(0.88),interval:p(0.975),recovery:p(0.57)};
}

export function calcSplits(distKm,goalSec,strategy){
  var avgSec=goalSec/distKm;
  var unit=distKm<=21?1:distKm<=50?5:10;
  var n=Math.floor(distKm/unit);
  var splits=[];var elapsed=0;
  for(var i=0;i<n;i++){
    var frac=(i+0.5)/n;
    var factor=strategy==="negative"?(frac<0.5?1.02:0.98):1.0;
    var pace=avgSec*factor;
    elapsed+=pace*unit;
    splits.push({km:(i+1)*unit,pace:fmtPaceSec(pace),elapsed:fmtTime(Math.round(elapsed))});
  }
  var rem=distKm-n*unit;
  if(rem>0.05){elapsed+=avgSec*rem;splits.push({km:distKm,pace:fmtPaceSec(avgSec),elapsed:fmtTime(Math.round(goalSec))});}
  return splits;
}
