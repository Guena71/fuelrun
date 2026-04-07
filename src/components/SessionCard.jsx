import { useState } from "react";
import { SURF2, BORD, TXT, MUT, OR, GR, BL, YE } from "../data/constants.js";
import { RECIPES } from "../data/meals.js";
import { TYPE_COLORS } from "../data/training.js";
import { calcNutrition, planLevel, getRecipesTrial, RECIPES_TRIAL_DAYS } from "../utils/nutrition.js";
import { durStr } from "../utils/date.js";
import { ls, lsSet } from "../utils/storage.js";
import { Card } from "./ui.jsx";

function RecipeRow(p){
  var r=p.row;
  var [open,setOpen]=useState(false);
  return(
    <div className="border-t border-bord">
      <div onClick={r.ingredients?function(){setOpen(!open);}:undefined}
        className="flex items-center gap-2.5 px-3.5 py-[9px]"
        style={{cursor:r.ingredients?"pointer":"default"}}>
        <div className="text-[11px] font-bold text-brand w-[68px] shrink-0">{r.slot}</div>
        <div className="flex-1 text-[12px] font-medium text-txt">{r.name}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-mut">{r.kcal} kcal</span>
          {r.ingredients&&(
            <div className="w-5 h-5 rounded-[6px] bg-surf2 border border-bord flex items-center justify-center text-[9px] text-sub shrink-0"
              style={{transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
          )}
        </div>
      </div>
      {open&&r.ingredients&&(
        <div className="px-3.5 pb-2.5 border-t border-bord">
          <div className="text-[10px] text-mut font-bold uppercase tracking-[0.5px] mb-1.5 mt-2">Ingrédients</div>
          {r.ingredients.map(function(ing,i){return(
            <div key={i} className="flex gap-1.5 pb-[3px]">
              <div className="w-1 h-1 rounded-full bg-brand shrink-0 mt-[5px]"/>
              <span className="text-[12px] text-txt">{ing}</span>
            </div>
          );})}
          {r.steps&&<div className="text-[10px] text-mut font-bold uppercase tracking-[0.5px] mb-1.5 mt-2">Préparation</div>}
          {r.steps&&r.steps.map(function(st,i){return(
            <div key={i} className="flex gap-2 mb-1">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                style={{background:OR+"22",border:"1px solid "+OR+"44",color:OR}}>{i+1}</div>
              <span className="text-[12px] text-sub leading-snug">{st}</span>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

export function SessionCard(p){
  var s=p.session;
  var [open,setOpen]=useState(p.isNext||false);
  var [nutOpen,setNutOpen]=useState(false);
  var doneKey="fr_done_"+s.date;
  var [done,setDoneRaw]=useState(function(){return ls(doneKey,false);});
  function toggleDone(e){e.stopPropagation();var v=!done;setDoneRaw(v);lsSet(doneKey,v);}
  var sc=TYPE_COLORS[s.type]||OR;
  var n=calcNutrition(p.profile,s.type);
  var recipes=RECIPES[s.type]||[];
  var isPast=s.date&&s.date<new Date(new Date().setHours(0,0,0,0));
  return(
    <Card style={{
      marginBottom:10,
      border:done?"1.5px solid "+GR:p.isNext?"1.5px solid "+sc:"1px solid "+BORD,
      opacity:(isPast&&!done)?0.5:1
    }}>
      {p.isNext&&(
        <div className="flex items-center gap-1.5 px-3.5 py-[5px]"
          style={{background:"linear-gradient(90deg,"+sc+"cc,"+sc+"88)"}}>
          <span className="text-[10px]">⚡</span>
          <span className="text-[10px] font-bold text-white uppercase tracking-[0.8px]">Prochaine séance</span>
        </div>
      )}
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={function(){setOpen(!open);}}>
          <div className="w-11 h-11 rounded-[11px] flex flex-col items-center justify-center shrink-0"
            style={{background:sc+(p.isNext?"44":"20"),border:"1px solid "+sc+"44"}}>
            <div className="text-[9px] font-bold" style={{color:sc}}>{s.dayLabel}</div>
            <div className="text-[9px]" style={{color:sc}}>{s.date?s.date.getDate()+"/"+(s.date.getMonth()+1):""}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-[3px]" style={{fontWeight:p.isNext?700:600,color:p.isNext?sc:TXT}}>{s.label}</div>
            <div className="flex gap-2 flex-wrap">
              {s.type!=="race"&&<span className="text-[12px] text-sub">{s.km} km</span>}
              {s.pace&&<span className="text-[12px] text-sub">· {s.pace}/km</span>}
              {s.type!=="race"&&s.pace&&<span className="text-[12px] font-semibold" style={{color:sc}}>· {durStr(s.pace,s.km)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggleDone}
              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-[12px]"
              style={{background:done?GR+"22":SURF2,border:"1px solid "+(done?GR:BORD),color:done?GR:MUT}}>
              {done?"✓":"○"}
            </button>
            <div className="w-6 h-6 rounded-lg bg-surf2 border border-bord flex items-center justify-center text-[10px] text-sub"
              style={{transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
          </div>
        </div>

        {open&&(
          <div className="mt-3 pt-3 border-t border-bord">
            {s.desc&&(
              <div className="rounded-xl px-3.5 py-3 mb-3" style={{background:sc+"10",border:"1px solid "+sc+"25"}}>
                <div className="text-[10px] font-bold uppercase tracking-[0.8px] mb-1.5" style={{color:sc}}>Consignes</div>
                <div className="text-[13px] text-txt leading-relaxed">{s.desc}</div>
              </div>
            )}
            {(function(){
              var isPro=planLevel(p.profile)>=2;
              var trial=isPro?{active:true,daysLeft:99}:getRecipesTrial();
              var canSeeRecipes=isPro||trial.active;
              var totalKcal=n.kcal||0;
              return(
                <div className="rounded-xl border border-bord overflow-hidden">
                  <div onClick={function(){setNutOpen(!nutOpen);}}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-surf2 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px]">🥗</span>
                      <span className="text-[12px] font-semibold text-txt">Nutrition</span>
                      {!isPro&&trial.active&&(
                        <span className="text-[9px] font-bold text-success px-1.5 py-0.5 rounded-[5px]"
                          style={{background:GR+"18"}}>Essai {trial.daysLeft}j</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-brand">{totalKcal} kcal</span>
                      <div className="w-[22px] h-[22px] rounded-[7px] bg-bg border border-bord flex items-center justify-center text-[9px] text-sub shrink-0"
                        style={{transform:nutOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
                    </div>
                  </div>
                  {nutOpen&&(
                    <div>
                      <div className="flex gap-1.5 px-3 py-2.5 border-t border-bord">
                        {[{label:"Glucides",value:n.carbs+"g",color:BL},{label:"Protéines",value:n.prot+"g",color:GR},{label:"Lipides",value:n.fat+"g",color:YE}].map(function(m,i){
                          return(
                            <div key={i} className="flex-1 bg-surf2 rounded-lg py-[7px] px-1 text-center">
                              <div className="text-[13px] font-bold" style={{color:m.color}}>{m.value}</div>
                              <div className="text-[9px] text-mut mt-0.5">{m.label}</div>
                            </div>
                          );
                        })}
                      </div>
                      {canSeeRecipes?(
                        <>
                          {!isPro&&(
                            <div className="mx-3 mt-2 px-3 py-2 rounded-lg flex items-center justify-between"
                              style={{background:YE+"12",border:"1px solid "+YE+"33"}}>
                              <span className="text-[11px] font-semibold" style={{color:YE}}>⏳ Accès gratuit encore {trial.daysLeft} jour{trial.daysLeft>1?"s":""}</span>
                              <span onClick={function(e){e.stopPropagation();p.onShowPricing&&p.onShowPricing();}}
                                className="text-[10px] font-bold text-brand cursor-pointer underline">Passer Pro</span>
                            </div>
                          )}
                          {(recipes.length>0
                            ?recipes.map(function(r){return{slot:r.slot,name:r.name,kcal:r.kcal,ingredients:r.ingredients,steps:r.steps};})
                            :n.meals.map(function(m){return{slot:m.time,name:m.food,kcal:m.kcal,ingredients:null,steps:null};})
                          ).map(function(row,ri){return <RecipeRow key={ri} row={row}/>;}) }
                        </>
                      ):(
                        <div onClick={function(){p.onShowPricing&&p.onShowPricing();}}
                          className="mx-3 my-2 px-3.5 py-3 rounded-[10px] cursor-pointer"
                          style={{background:OR+"10",border:"1px solid "+OR+"33"}}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px]">🔒</span>
                              <span className="text-[12px] font-semibold text-txt">Plan repas · Recettes détaillées</span>
                            </div>
                            <span className="text-[10px] font-bold text-brand px-2 py-[2px] rounded-[6px]"
                              style={{background:OR+"18"}}>Pro →</span>
                          </div>
                          <div className="text-[11px] text-mut">Ton essai de {RECIPES_TRIAL_DAYS} jours est terminé. Passe en Pro pour garder l'accès.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}
