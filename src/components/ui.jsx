import { SURF, BORD, SUB, OR, MUT } from "../data/constants.js";

export function Btn(p){
  var sz={sm:{padding:"8px 14px",fontSize:13},md:{padding:"13px 18px",fontSize:15},lg:{padding:"16px 22px",fontSize:16}}[p.size||"md"];
  var vr={primary:{background:OR,color:"#fff"},ghost:{background:"transparent",border:"1px solid "+BORD,color:SUB}}[p.variant||"primary"];
  return(<button onClick={p.disabled?undefined:p.onClick} style={Object.assign({display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:12,fontWeight:600,cursor:p.disabled?"not-allowed":"pointer",border:"none",opacity:p.disabled?0.4:1,fontFamily:"inherit",width:p.full?"100%":undefined},sz,vr,p.style||{})}>{p.label}</button>);
}

export function Chip(p){var col=p.color||OR;return(<button onClick={p.onClick} style={{padding:"7px 16px",borderRadius:20,border:"1.5px solid "+(p.active?col:BORD),background:p.active?col+"22":"transparent",color:p.active?col:SUB,fontSize:13,fontWeight:p.active?600:400,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{p.label}</button>);}

export function Card(p){return(<div onClick={p.onClick} style={Object.assign({background:SURF,borderRadius:16,border:"1px solid "+BORD,overflow:"hidden"},p.style||{})}>{p.children}</div>);}

export function Stat(p){return(<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:p.color||OR,lineHeight:1}}>{p.value}</div><div style={{fontSize:11,color:MUT,marginTop:4}}>{p.label}</div></div>);}
