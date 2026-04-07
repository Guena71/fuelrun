import { MONTHS_F, MONTHS_S } from "../data/constants.js";

export function getToday(){return new Date(new Date().setHours(0,0,0,0));}
export function addDays(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r;}
export function startOfWeek(d){var r=new Date(d);var day=r.getDay()===0?6:r.getDay()-1;r.setDate(r.getDate()-day);r.setHours(0,0,0,0);return r;}
export function fmtDate(d){return d.getDate()+" "+MONTHS_F[d.getMonth()];}
export function fmtS(d){return d.getDate()+" "+MONTHS_S[d.getMonth()];}
export function weeksUntil(date){return Math.max(1,Math.ceil((new Date(date)-getToday())/(7*86400000)));}
export function durStr(pace,km){var p=(pace||"5:30").split(":");var tot=Math.round((parseInt(p[0])+(parseInt(p[1]||0)/60))*(km||0));return Math.floor(tot/60)+"h"+String(tot%60).padStart(2,"0");}
export function fmtTime(secs){var h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=Math.round(secs%60);if(h>0)return h+"h"+String(m).padStart(2,"0")+"'"+String(s).padStart(2,"0");return m+"'"+String(s).padStart(2,"0");}
export function fmtPaceSec(sPerKm){var mn=Math.floor(sPerKm/60),sc=Math.round(sPerKm%60);if(sc>=60){mn++;sc=0;}return mn+":"+String(sc).padStart(2,"0");}
