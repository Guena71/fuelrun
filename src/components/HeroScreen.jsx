import { MUT, OR } from "../data/constants.js";
import { RunnerHero } from "./RunnerHero.jsx";
import { Btn } from "./ui.jsx";

export function LogoBar(p){
  return(
    <div className="flex items-center px-6 pt-3">
      <div className="anim-bounce" style={{filter:"drop-shadow(0 0 12px "+OR+"60)"}}><RunnerHero size={56}/></div>
      <span className="text-[30px] font-extrabold text-txt tracking-[-0.5px] ml-3.5">FuelRun</span>
      {p.onSignOut&&(
        <button onClick={p.onSignOut} title="Se déconnecter"
          className="ml-auto w-9 h-9 rounded-[10px] bg-surf2 border border-bord flex items-center justify-center cursor-pointer shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={MUT} strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke={MUT} strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}

export function HeroScreen(p){
  return(
    <div className="min-h-screen bg-bg flex flex-col px-6 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 pt-10">
        <div className="anim-run"><RunnerHero size={160}/></div>
        <div className="text-[38px] font-extrabold text-txt tracking-[-0.5px]">FuelRun</div>
        <div className="text-base text-sub max-w-[280px] leading-relaxed">Entraînement · Nutrition · Performance</div>
        <div className="px-5 py-3 rounded-xl border max-w-[320px]"
          style={{background:OR+"12",borderColor:OR+"30"}}>
          <div className="text-sm font-semibold italic text-brand">Pas besoin d'être rapide, l'important est de commencer !</div>
        </div>
        <div className="mt-6 w-full max-w-[340px] flex flex-col gap-2.5">
          <Btn label="Commencer" onClick={p.onCommencer} size="lg" full/>
          <Btn label="J'ai déjà un compte" onClick={p.onLogin} variant="ghost" size="md" full/>
        </div>
      </div>
      <div className="text-center text-[11px] text-mut">En continuant, vous acceptez les conditions d'utilisation.</div>
    </div>
  );
}
