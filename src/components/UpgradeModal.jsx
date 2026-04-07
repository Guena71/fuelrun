import { useEffect } from "react";
import { BORD, OR } from "../data/constants.js";
import { logEvent, analytics } from "../firebase.js";

export function UpgradeModal({feature,minPlanLabel,minPlanColor,onClose,onUpgrade}){
  var col=minPlanColor||OR;
  useEffect(function(){logEvent(analytics,"upgrade_viewed",{feature:feature,plan:minPlanLabel});},[]);
  return(
    <div className="fixed inset-0 bg-black/[.82] z-[500] flex items-center justify-center px-6"
      onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div className="bg-surf rounded-[22px] px-6 pt-8 pb-6 w-full max-w-[360px] text-center border border-bord">
        <div className="text-[44px] mb-3.5">🔒</div>
        <div className="text-lg font-extrabold text-txt mb-2">{feature}</div>
        <div className="text-[13px] text-sub mb-2 leading-relaxed">
          Cette fonctionnalité est disponible à partir du plan{" "}
          <span className="font-bold" style={{color:col}}>{minPlanLabel}</span>.
        </div>
        <div className="text-[12px] font-semibold mb-5 px-3 py-2 rounded-lg border"
          style={{color:col,background:col+"15",borderColor:col+"30"}}>
          14 jours gratuits · Sans carte bancaire requise
        </div>
        <button onClick={onUpgrade}
          className="w-full py-3.5 rounded-xl border-none text-white text-[15px] font-bold cursor-pointer font-[inherit] mb-2.5"
          style={{background:col}}>
          Essayer 14 jours gratuit
        </button>
        <button onClick={onClose}
          className="w-full py-[11px] rounded-xl bg-transparent text-sub text-[13px] cursor-pointer font-[inherit]"
          style={{border:"1px solid "+BORD}}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
