import { OR, BORD, SUB } from "../data/constants.js";

export function Btn(p){
  var szClass={sm:"px-[14px] py-2 text-[13px]",md:"px-[18px] py-[13px] text-[15px]",lg:"px-[22px] py-4 text-base"}[p.size||"md"];
  var base="inline-flex items-center justify-center rounded-xl font-semibold border-none font-[inherit] transition-opacity";
  var varClass=p.variant==="ghost"
    ?"bg-transparent text-sub border border-bord"
    :"bg-brand text-white";
  return(
    <button
      onClick={p.disabled?undefined:p.onClick}
      className={[base,szClass,varClass,p.full?"w-full":"",p.disabled?"opacity-40 cursor-not-allowed":"cursor-pointer"].join(" ")}
      style={p.style}
    >{p.label}</button>
  );
}

export function Chip(p){
  var col=p.color||OR;
  return(
    <button onClick={p.onClick} style={{
      padding:"7px 16px",borderRadius:20,
      border:"1.5px solid "+(p.active?col:BORD),
      background:p.active?col+"22":"transparent",
      color:p.active?col:SUB,
      fontSize:13,fontWeight:p.active?600:400,
      cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"
    }}>{p.label}</button>
  );
}

export function Card(p){
  return(
    <div onClick={p.onClick} className="bg-surf rounded-2xl border border-bord overflow-hidden" style={p.style}>
      {p.children}
    </div>
  );
}

export function Stat(p){
  return(
    <div className="flex-1 text-center">
      <div className="text-[22px] font-bold leading-none" style={{color:p.color||OR}}>{p.value}</div>
      <div className="text-[11px] text-mut mt-1">{p.label}</div>
    </div>
  );
}
