import { OR } from "../data/constants.js";

export function RunnerHero(p){
  var sz=p.size||160;
  return(<svg width={sz} height={sz} viewBox="0 0 160 160" fill="none"><circle cx="80" cy="80" r="76" fill={OR} fillOpacity="0.07"/><circle cx="80" cy="80" r="58" fill={OR} fillOpacity="0.05"/><path d="M80 24 L126 110 L34 110 Z" fill={OR} fillOpacity="0.9"/><path d="M80 24 L93 52 L80 46 L67 52 Z" fill="#fff" fillOpacity="0.18"/><path d="M34 110 L56 74 L78 110 Z" fill={OR} fillOpacity="0.4"/><path d="M14 126 Q80 114 146 126" stroke={OR} strokeWidth="4.5" strokeLinecap="round" fill="none"/></svg>);
}
