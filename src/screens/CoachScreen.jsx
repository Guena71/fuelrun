import { useState, useEffect, useRef } from "react";
import { db, doc, setDoc, getDoc } from "../firebase.js";
import { SURF, BORD, TXT, MUT, OR, BL, RE } from "../data/constants.js";
import { weeksUntil } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { ls, lsSet } from "../utils/storage.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

export function CoachScreen(p){
  var init="Salut "+(p.profile.name||"champion")+" ! Je suis ton coach FuelRun. "+(p.race?"Tu prépares "+p.race.name+" dans "+weeksUntil(p.race.date)+" semaines. Comment puis-je t'aider ?":"Dis-moi ton objectif et je t'aide !");
  var [messages,setMessages]=useState([{role:"model",content:init}]);
  var [input,setInput]=useState("");
  var [loading,setLoading]=useState(false);
  var [histLoaded,setHistLoaded]=useState(false);
  var [error,setError]=useState("");
  var [showCoachUpgrade,setShowCoachUpgrade]=useState(false);
  var msgsRef=useRef(null);
  var todayKey=new Date().toISOString().slice(0,10);
  var countKey="fr_coach_count_"+todayKey;
  var [dailyCount,setDailyCount]=useState(function(){return ls(countKey,0);});
  var lvl=planLevel(p.profile);
  var maxMsg=lvl>=2?Infinity:lvl>=1?30:5;
  var remaining=maxMsg===Infinity?null:Math.max(0,maxMsg-dailyCount);
  useEffect(function(){if(msgsRef.current)msgsRef.current.scrollTop=msgsRef.current.scrollHeight;},[messages]);

  useEffect(function(){
    if(!p.user||histLoaded)return;
    getDoc(doc(db,"users",p.user.uid)).then(function(snap){
      if(snap.exists()){var data=snap.data();if(data.coachHistory&&Array.isArray(data.coachHistory)&&data.coachHistory.length>0)setMessages(data.coachHistory);}
      setHistLoaded(true);
    }).catch(function(){setHistLoaded(true);});
  },[p.user]);

  function saveHistory(msgs){
    if(!p.user)return;
    setDoc(doc(db,"users",p.user.uid),{coachHistory:msgs.slice(-40)},{merge:true}).catch(function(){});
  }

  function send(){
    if(!input.trim()||loading)return;
    if(maxMsg!==Infinity&&dailyCount>=maxMsg){setShowCoachUpgrade(true);return;}
    var msg=input.trim();setInput("");setLoading(true);setError("");
    var newMsgs=messages.concat([{role:"user",content:msg}]);
    setMessages(newMsgs);
    var recentKm=0;var recentSess=0;if(p.entries){var cut7=new Date();cut7.setDate(cut7.getDate()-7);Object.entries(p.entries).forEach(function(e){if(e[1].done&&new Date(e[0])>=cut7){recentKm+=parseFloat(e[1].km)||0;recentSess++;}});}
    var wellStr="";if(p.wellbeing){var wTot=0;var wVals=Object.values(p.wellbeing);for(var wi=0;wi<wVals.length;wi++)wTot+=wVals[wi];var wPct=wTot/(4*4);wellStr=wPct<=0.4?"en état de fatigue":wPct<=0.6?"légèrement fatigué":wPct<=0.8?"en bonne forme":"en super forme";}
    var planCtx=p.race?buildPlan(p.race,p.profile):null;var planWCtx=getPlanWeeks(planCtx);var curWCtx=null;for(var cix=0;cix<planWCtx.length;cix++){if(planWCtx[cix].isCurrent){curWCtx=planWCtx[cix];break;}}if(!curWCtx){for(var cix2=0;cix2<planWCtx.length;cix2++){if(!planWCtx[cix2].isPast){curWCtx=planWCtx[cix2];break;}}}
    var todaySessCtx=curWCtx&&curWCtx.sessions&&curWCtx.sessions.length>0?curWCtx.sessions[0]:null;
    var sys="Tu es un coach running expert et bienveillant. Profil : "+(p.profile.name||"Coureur")+", "+(p.profile.age||"30")+" ans, "+(p.profile.weight||"70")+" kg, niveau "+(p.profile.level||"débutant")+"."+(p.race?" Objectif : "+p.race.name+", "+p.race.dist+" km dans "+weeksUntil(p.race.date)+" semaines.":"")+(todaySessCtx?" Séance du jour : "+todaySessCtx.label+" ("+todaySessCtx.km+" km à "+todaySessCtx.pace+"/km).":" Pas de séance planifiée aujourd'hui.")+"\n7 derniers jours : "+recentSess+" séance"+(recentSess!==1?"s":"")+", "+Math.round(recentKm)+" km."+(wellStr?" Coureur "+wellStr+".":" État non renseigné.")+"\nRéponds en français, 3-4 phrases max, naturel, précis, personnalisé.";
    var hist=newMsgs.map(function(m){return{role:m.role==="model"?"assistant":m.role,content:m.content};});
    fetch("/api/coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:sys,messages:hist})})
      .then(function(r){return r.json();}).then(function(data){
        if(data.error){setError(data.error.message||data.error||"Erreur API");setLoading(false);return;}
        var reply=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||"Désolé, réessaie.";
        var updated=newMsgs.concat([{role:"model",content:reply}]);
        setMessages(updated);saveHistory(updated);
        var nc=dailyCount+1;setDailyCount(nc);lsSet(countKey,nc);setLoading(false);
      }).catch(function(){setMessages(function(m){return m.concat([{role:"model",content:"Problème de connexion."}]);});setLoading(false);});
  }

  var limitColor=remaining<=2?RE:remaining<=5?"#F59E0B":MUT;

  return(
    <div className="flex flex-col overflow-x-hidden max-w-full" style={{height:"calc(100vh - 70px)"}}>
      <LogoBar/>
      <div className="px-4 pb-3 border-b border-bord shrink-0 overflow-x-hidden" style={{paddingTop:16}}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[26px] font-extrabold text-txt tracking-[-0.4px]">Coach IA</div>
          {remaining!==null&&(
            <div className="text-[11px] font-semibold px-2 py-[3px] rounded-lg border border-bord bg-surf"
              style={{color:limitColor}}>{remaining} msg restants</div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{background:"linear-gradient(135deg,"+OR+"44,"+OR+"11)",border:"1px solid "+OR+"44"}}>🏃</div>
          <div className="text-[13px] font-bold text-txt whitespace-nowrap overflow-hidden text-ellipsis">
            Coach FuelRun <span className="text-[11px] font-normal text-success">· En ligne · Disponible 7j/7</span>
          </div>
        </div>
        {error&&<div className="mt-2 text-[12px] text-danger">{error}</div>}
      </div>

      <div ref={msgsRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-2">
        {messages.map(function(m,i){
          var isUser=m.role==="user";
          return(
            <div key={i} className="flex mb-3 gap-2" style={{justifyContent:isUser?"flex-end":"flex-start"}}>
              {!isUser&&(
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
                  style={{background:OR+"20",border:"1px solid "+OR+"44"}}>🏃</div>
              )}
              <div className="max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed break-words overflow-wrap-anywhere"
                style={{
                  background:isUser?OR:SURF,
                  borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",
                  color:isUser?"#fff":TXT,
                  border:isUser?"none":"1px solid "+BORD,
                }}>{m.content}</div>
            </div>
          );
        })}
        {loading&&(
          <div className="flex gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{background:OR+"20",border:"1px solid "+OR+"44"}}>🏃</div>
            <div className="rounded-[16px_16px_16px_4px] px-3.5 py-3 flex gap-1 border border-bord bg-surf">
              {[0,1,2].map(function(i){return(
                <div key={i} className="w-[7px] h-[7px] rounded-full bg-brand anim-pulse" style={{animationDelay:i*0.2+"s"}}/>
              );})}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-2 pb-4 border-t border-bord shrink-0">
        {messages.length<=1&&!loading&&(
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {["Comment préparer ma prochaine séance ?","Que manger avant une course ?","J'ai mal aux jambes, que faire ?","Comment améliorer mon allure ?"].map(function(q,i){
              return(
                <button key={i} onClick={function(){setInput(q);}}
                  className="px-3 py-1.5 rounded-[20px] bg-surf2 border border-bord text-sub text-[11px] cursor-pointer font-[inherit] whitespace-nowrap">
                  {q}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")send();}}
            placeholder="Pose ta question au coach…"
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none font-[inherit]"
            style={{background:SURF,border:"1px solid "+BORD,color:TXT}}/>
          <button onClick={send}
            disabled={!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)}
            className="w-[46px] h-[46px] rounded-xl border-none flex items-center justify-center text-white text-lg shrink-0"
            style={{
              background:maxMsg!==Infinity&&dailyCount>=maxMsg?MUT:OR,
              cursor:!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)?"not-allowed":"pointer",
              opacity:!input.trim()||loading?0.4:1,
            }}>
            {maxMsg!==Infinity&&dailyCount>=maxMsg?"🔒":"↑"}
          </button>
        </div>
        {maxMsg!==Infinity&&dailyCount>=maxMsg&&(
          <div onClick={function(){setShowCoachUpgrade(true);}}
            className="mt-2 px-3 py-2.5 rounded-[10px] cursor-pointer text-center"
            style={{background:OR+"15",border:"1px solid "+OR+"33"}}>
            <span className="text-[12px] text-brand font-semibold">Limite journalière atteinte · Passer à un plan supérieur</span>
          </div>
        )}
      </div>

      {showCoachUpgrade&&<UpgradeModal feature={"Coach IA · Limite atteinte"} minPlanLabel={lvl<1?"Essential":"Pro"} minPlanColor={lvl<1?BL:OR} onClose={function(){setShowCoachUpgrade(false);}} onUpgrade={function(){setShowCoachUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </div>
  );
}
