import { useState, useEffect, useMemo } from "react";
import { BG, BORD, OR, GR, BL, YE, RE } from "../data/constants.js";
import { QUOTES } from "../data/quotes.js";
import { RECIPES } from "../data/meals.js";
import { TYPE_COLORS } from "../data/training.js";
import { weeksUntil, fmtS, durStr } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { calcNutrition, planLevel, getRecipesTrial } from "../utils/nutrition.js";
import { weatherAdvice } from "../utils/weather.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { AnimCount } from "../components/AnimCount.jsx";

export function HomeScreen(p){
  var [weather,setWeather]=useState(null);
  var [showRecipes,setShowRecipes]=useState(false);
  var todayKey=new Date().toDateString();
  var todayDone=!!(p.entries&&p.entries[todayKey]&&p.entries[todayKey].done);
  useEffect(function(){
    if(!navigator.geolocation)return;
    navigator.geolocation.getCurrentPosition(function(pos){
      var la=pos.coords.latitude.toFixed(4),lo=pos.coords.longitude.toFixed(4);
      fetch("https://api.open-meteo.com/v1/forecast?latitude="+la+"&longitude="+lo+"&current=temperature_2m,weathercode,windspeed_10m")
        .then(function(r){return r.json();})
        .then(function(d){if(d&&d.current)setWeather(d.current);})
        .catch(function(){});
    },function(){},{timeout:5000,maximumAge:300000});
  },[]);
  var _planDay=new Date(new Date().setHours(0,0,0,0)).toDateString();
  var plan=useMemo(function(){return p.race?buildPlan(p.race,p.profile):null;},[p.race,p.profile,_planDay]);
  var planWeeks=getPlanWeeks(plan);
  var raceWeeks=p.race?weeksUntil(p.race.date):null;
  var raceCol=p.race&&p.race.type==="trail"?GR:BL;
  var hour=new Date().getHours();
  var greeting=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";
  var curWeek=null;
  for(var ci=0;ci<planWeeks.length;ci++){if(planWeeks[ci].isCurrent){curWeek=planWeeks[ci];break;}}
  if(!curWeek){for(var ci2=0;ci2<planWeeks.length;ci2++){if(!planWeeks[ci2].isPast){curWeek=planWeeks[ci2];break;}}}
  var nextSess=curWeek&&curWeek.sessions&&curWeek.sessions.length>0?curWeek.sessions[0]:null;
  var sessType=nextSess?nextSess.type:"easy";
  var sessCol=TYPE_COLORS[sessType]||OR;
  var wba=null;
  if(p.wellbeing){var tot=0;var vals=Object.values(p.wellbeing);for(var vi=0;vi<vals.length;vi++)tot+=vals[vi];var wpct=tot/(4*4);if(wpct<=0.4)wba={text:"Repos aujourd'hui",sub:"Ton corps a besoin de récupérer.",icon:"🛌",color:RE,bg:RE+"12"};else if(wpct<=0.6)wba={text:"Séance légère conseillée",sub:"Ne force pas trop.",icon:"🚶",color:YE,bg:YE+"12"};else if(wpct<=0.8)wba={text:"Séance normale",sub:"Tu es en bonne forme.",icon:"✅",color:BL,bg:BL+"12"};else wba={text:"Super forme !",sub:"Profites-en, donne tout.",icon:"🚀",color:GR,bg:GR+"12"};}
  var quoteIdx=Math.floor(Date.now()/(30*60*1000))%QUOTES.length;
  var quote=QUOTES[quoteIdx];
  var raceProgress=p.race&&planWeeks.length>0?Math.max(2,Math.min(100,Math.round((1-raceWeeks/planWeeks.length)*100))):0;
  return(
    <div className="pb-2">
      <LogoBar profile={p.profile} onProfile={function(){p.onGoToProfile&&p.onGoToProfile();}} onSignOut={p.onSignOut}/>
      <div className="relative overflow-hidden px-5 pt-4 pb-0"
        style={{background:"linear-gradient(150deg,#1c0f00 0%,#110900 45%,"+BG+" 100%)"}}>
        <div className="absolute top-[-60px] right-[-60px] w-60 h-60 rounded-full pointer-events-none" style={{background:OR,opacity:0.05}}/>
        <div className="absolute bottom-[-30px] left-[-30px] w-[140px] h-[140px] rounded-full pointer-events-none" style={{background:BL,opacity:0.04}}/>
        <div className="mb-6">
          <div className="text-[12px] font-semibold uppercase tracking-[1.2px] mb-1.5" style={{color:OR}}>{greeting}</div>
          <div className="text-[30px] font-extrabold text-txt tracking-[-0.5px] leading-none">{p.profile.name||"Champion"}</div>
          <div className="mt-2.5">
            <button onClick={function(){p.onGoToProfile&&p.onGoToProfile();}}
              className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-[20px] cursor-pointer font-[inherit]"
              style={{background:OR+"18",border:"1px solid "+OR+"35"}}>
              <span className="text-[11px] font-semibold" style={{color:OR}}>Modifier ton profil</span>
              <span className="text-[10px]" style={{color:OR}}>✎</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-2.5">
          {[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km),color:BL},{label:"Streak",value:p.stats.streak,color:YE}].map(function(st,i){
            return(<div key={i} className="rounded-2xl px-2.5 py-3.5 text-center" style={{background:"rgba(255,255,255,0.045)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div className="text-[24px] font-extrabold leading-none"><AnimCount value={st.value} color={st.color}/></div>
              <div className="text-[9px] text-mut mt-[5px] font-medium uppercase tracking-[0.5px]">{st.label}</div>
            </div>);
          })}
        </div>
        {p.stats.sessions>0&&(
          <button onClick={function(){
            var txt="J'ai parcouru "+Math.round(p.stats.km)+" km en "+p.stats.sessions+" séance"+(p.stats.sessions>1?"s":"")+" avec FuelRun !"+(p.race?" Je prépare "+p.race.name+" !":"")+" Rejoins-moi sur l'app.";
            if(navigator.share){navigator.share({title:"FuelRun",text:txt,url:window.location.href});}
            else{navigator.clipboard&&navigator.clipboard.writeText(txt);}
          }} className="w-full mb-2.5 px-2.5 py-2.5 rounded-xl text-txt text-[12px] font-semibold cursor-pointer font-[inherit] tracking-[0.3px]"
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
            Partager mes stats
          </button>
        )}
        <div className="px-4 py-3.5 rounded-2xl text-center mb-0"
          style={{background:OR+"12",border:"1px solid "+OR+"25"}}>
          <div className="text-[13px] text-txt leading-[1.7] italic font-medium">"{quote.text}"</div>
          <div className="text-[11px] font-bold mt-2 tracking-[0.3px]" style={{color:OR}}>{'\u2014'} {quote.author} {'\u2014'}</div>
        </div>
      </div>

      <div className="px-4 pt-3.5">
        {p.race&&planWeeks.length>0&&(
          <div className="rounded-2xl bg-surf border border-bord mb-3.5 px-4 py-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1px] mb-[3px]" style={{color:raceCol}}>Objectif</div>
                <div className="text-[14px] font-bold text-txt leading-tight">{p.race.name}</div>
                <div className="text-[11px] text-sub mt-0.5">{p.race.city} · 🏁 {fmtS(new Date(p.race.date))}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-[24px] font-extrabold leading-none" style={{color:raceCol}}>{p.race.dist}<span className="text-[11px] font-medium text-mut ml-0.5">km</span></div>
                <div className="text-[9px] text-mut uppercase tracking-[0.5px]">{p.race.type==="trail"?"Trail":"Route"}</div>
              </div>
            </div>
            <div className="h-[5px] rounded-[6px] overflow-hidden mb-[5px]" style={{background:raceCol+"18"}}>
              <div className="h-full rounded-[6px]" style={{width:raceProgress+"%",background:"linear-gradient(90deg,"+raceCol+"99,"+raceCol+")"}}/>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-mut">Sem. 1</span>
              <span className="text-[10px] font-semibold" style={{color:raceCol}}>{raceProgress}% · dans {raceWeeks} sem.</span>
              <span className="text-[10px] text-mut">Sem. {planWeeks.length}</span>
            </div>
          </div>
        )}

        {(function(){
          var n=p.race&&curWeek?calcNutrition(p.profile,sessType):null;
          var isPro=planLevel(p.profile)>=2;
          var homeTrial=isPro?{active:true,daysLeft:99}:getRecipesTrial();
          var coachTips={
            easy:"Zone 2, tu dois pouvoir parler confortablement. C'est cette allure qui construit ta base aérobie.",
            long:"Démarre doucement et garde de l'énergie pour les derniers kms. Hydrate-toi toutes les 20 min.",
            interval:"Échauffement 15 min impératif. Récupère bien entre les répétitions — la qualité prime.",
            tempo:"Allure inconfortable mais contrôlée. Ne pars pas trop vite les 5 premières minutes.",
            recovery:"Très basse intensité, petite foulée. L'objectif : circuler le sang, pas performer.",
            race:"C'est le jour J ! Démarre plus lentement que prévu. Fais confiance à ton plan.",
          };
          var tip=coachTips[sessType]||"Écoute ton corps aujourd'hui. La régularité prime sur l'intensité.";
          return(
            <div className="rounded-[18px] bg-surf border border-bord mb-3.5 overflow-hidden">
              <div className="px-4 py-3 border-b border-bord" style={{background:"linear-gradient(135deg,"+OR+"10,transparent)"}}>
                <div className="text-[10px] font-bold uppercase tracking-[1.2px]" style={{color:OR}}>Aujourd'hui</div>
              </div>
              <div className="flex border-b border-bord">
                <div className="w-[3px] shrink-0" style={{background:OR}}/>
                <div className="flex-1 px-4 py-3.5">
                  <div className="text-[10px] text-mut font-bold uppercase tracking-[1px] mb-1.5">Séance</div>
                  <div className="flex items-center justify-between">
                    <div>
                      {nextSess?(
                        <div>
                          <div className="text-[15px] font-extrabold text-txt tracking-[-0.2px]">{nextSess.label}</div>
                          <div className="text-[12px] text-sub mt-0.5">
                            {nextSess.type!=="race"?nextSess.km+" km":""}{nextSess.pace?" · "+nextSess.pace+"/km":""}
                          </div>
                        </div>
                      ):(
                        <div className="text-[14px] font-semibold text-sub">Repos — récupération active</div>
                      )}
                    </div>
                    {nextSess&&nextSess.pace&&(
                      <div className="text-right">
                        <div className="text-[18px] font-extrabold" style={{color:sessCol}}>{durStr(nextSess.pace,nextSess.km)}</div>
                        <div className="text-[9px] text-mut">durée est.</div>
                      </div>
                    )}
                  </div>
                  {nextSess&&(
                    <div className="mt-2.5">
                      <button onClick={function(){
                        if(todayDone)return;
                        p.onGoToJournal&&p.onGoToJournal(nextSess.km||0);
                      }} className="w-full py-2.5 rounded-[10px] text-[12px] font-bold font-[inherit] tracking-[0.2px]"
                        style={{background:todayDone?GR+"18":OR,border:todayDone?"1px solid "+GR+"44":"none",color:todayDone?GR:"#fff",cursor:todayDone?"default":"pointer"}}>
                        {todayDone?"✓ Séance validée":"Valider cette séance"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {n&&(
                <div className="flex border-b border-bord">
                  <div className="w-[3px] shrink-0" style={{background:OR}}/>
                  <div className="flex-1 px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] text-mut font-bold uppercase tracking-[1px]">Nutrition</div>
                      {!isPro&&(
                        <div onClick={function(){p.onShowPricing&&p.onShowPricing();}} className="px-2 py-[3px] rounded-[6px] cursor-pointer" style={{background:OR+"18",border:"1px solid "+OR+"33"}}>
                          <span className="text-[9px] font-bold" style={{color:OR}}>Plan repas Pro</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 items-baseline">
                      <span className="text-[15px] font-extrabold" style={{color:OR}}>{n.kcal} kcal</span>
                      <span className="text-[11px] text-mut">G {n.carbs}g · P {n.prot}g · L {n.fat}g</span>
                    </div>
                    {(isPro||homeTrial.active)&&n.meals.length>0&&(
                      <div className="mt-2.5">
                        {!isPro&&homeTrial.active&&(
                          <div className="flex items-center justify-between py-[5px] mb-1.5">
                            <span className="text-[10px] font-semibold" style={{color:YE}}>⏳ Accès essai — {homeTrial.daysLeft} jour{homeTrial.daysLeft>1?"s":""} restant{homeTrial.daysLeft>1?"s":""}</span>
                            <span onClick={function(){p.onShowPricing&&p.onShowPricing();}} className="text-[10px] font-bold cursor-pointer underline" style={{color:OR}}>Passer Pro</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0">
                          {n.meals.slice(0,3).map(function(m,i){return(
                            <div key={i} className="flex items-center gap-2 py-1.5" style={{borderTop:i>0?"1px solid "+BORD:"none"}}>
                              <span className="text-[10px] font-semibold text-mut w-16 shrink-0">{m.time}</span>
                              <span className="flex-1 text-[12px] text-txt">{m.food}</span>
                              <span className="text-[11px] font-semibold shrink-0" style={{color:OR}}>{m.kcal} kcal</span>
                            </div>
                          );})}
                        </div>
                        {(RECIPES[sessType]||[]).length>0&&(
                          <div className="mt-2">
                            <button onClick={function(){setShowRecipes(!showRecipes);}}
                              className="w-full py-[7px] rounded-lg bg-surf2 border border-bord text-sub text-[11px] font-semibold cursor-pointer font-[inherit]">
                              {showRecipes?"Masquer les recettes ↑":"Voir les recettes détaillées ↓"}
                            </button>
                            {showRecipes&&(RECIPES[sessType]||[]).map(function(r,ri){return(
                              <div key={ri} className="mt-2 bg-surf2 rounded-[10px] p-3 border border-bord">
                                <div className="text-[12px] font-bold text-txt mb-0.5">{r.name}</div>
                                <div className="text-[10px] text-mut mb-2">{r.slot} · {r.time} · {r.kcal} kcal</div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1" style={{color:OR}}>Ingrédients</div>
                                <div className="flex flex-col gap-0.5 mb-2">
                                  {r.ingredients.map(function(ing,ii){return(
                                    <div key={ii} className="text-[11px] text-sub flex gap-1.5">
                                      <span className="shrink-0" style={{color:OR}}>·</span>{ing}
                                    </div>
                                  );})}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1" style={{color:OR}}>Préparation</div>
                                {r.steps.map(function(step,si){return(
                                  <div key={si} className="flex gap-2 mb-1">
                                    <span className="text-[10px] font-bold shrink-0 w-[14px]" style={{color:OR}}>{si+1}.</span>
                                    <span className="text-[11px] text-txt leading-[1.5]">{step}</span>
                                  </div>
                                );})}
                              </div>
                            );})}
                          </div>
                        )}
                      </div>
                    )}
                    {!isPro&&!homeTrial.active&&(
                      <div onClick={function(){p.onShowPricing&&p.onShowPricing();}}
                        className="mt-2 px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between"
                        style={{background:OR+"10",border:"1px solid "+OR+"30"}}>
                        <div className="flex items-center gap-1.5"><span className="text-[11px]">🔒</span><span className="text-[11px] text-mut">Plan repas · Recettes — essai terminé</span></div>
                        <span className="text-[10px] font-bold" style={{color:OR}}>Pro →</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex">
                <div className="w-[3px] shrink-0" style={{background:OR}}/>
                <div className="flex-1 px-4 py-3.5">
                  <div className="text-[10px] text-mut font-bold uppercase tracking-[1px] mb-1.5">Conseil du coach</div>
                  <div className="text-[13px] text-txt leading-[1.6]">{tip}</div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="rounded-[18px] bg-surf border border-bord mb-3.5 overflow-hidden">
          {p.wellbeing?(
            <div className="flex items-center gap-3.5 px-[18px] py-4 border-b" style={{background:wba.bg,borderBottomColor:wba.color+"20"}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] shrink-0" style={{background:wba.color+"25"}}>
                {wba.icon}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold" style={{color:wba.color}}>{wba.text}</div>
                <div className="text-[12px] text-sub mt-0.5">{wba.sub}</div>
              </div>
            </div>
          ):(
            <div onClick={p.onCheckin} className="flex items-center gap-3.5 px-[18px] py-4 border-b border-bord cursor-pointer">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] shrink-0" style={{background:OR+"18"}}>🌡️</div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-txt">Comment tu te sens ?</div>
                <div className="text-[12px] text-sub mt-0.5">Check-in rapide · 30 sec</div>
              </div>
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[16px] shrink-0" style={{background:OR+"18",color:OR}}>›</div>
            </div>
          )}
        </div>

        {weather&&(function(){
          var adv=weatherAdvice(weather.weathercode||0,weather.temperature_2m||15,weather.windspeed_10m||0);
          return(
            <div className="rounded-2xl bg-surf border border-bord px-4 py-3.5 mb-3.5">
              <div className="flex items-center gap-3.5">
                <div className="text-[34px] leading-none shrink-0">{adv.icon}</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[1px] mb-[3px]" style={{color:adv.color}}>Météo · Conseil séance</div>
                  <div className="text-[13px] font-semibold text-txt mb-1">{adv.desc} · {Math.round(weather.temperature_2m||0)}°C{weather.windspeed_10m>10?" · "+Math.round(weather.windspeed_10m)+" km/h":""}</div>
                  <div className="text-[12px] text-sub leading-[1.5]">{adv.tip}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
