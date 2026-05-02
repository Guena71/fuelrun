import { useState } from "react";
import { SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { RECIPES } from "../data/meals.js";
import { TYPE_COLORS } from "../data/training.js";
import { calcNutrition, planLevel, getRecipesTrial, RECIPES_TRIAL_DAYS } from "../utils/nutrition.js";
import { sessionHydration } from "../utils/adaptive.js";
import { durStr } from "../utils/date.js";
import { ls, lsSet } from "../utils/storage.js";
import { Card } from "./ui.jsx";

function paceStr(km,min){
  if(!km||!min||parseFloat(km)<=0||parseFloat(min)<=0)return null;
  var s=parseFloat(min)*60/parseFloat(km);
  return Math.floor(s/60)+"'"+String(Math.round(s%60)).padStart(2,"0")+'"';
}
function fmtKm(v){var n=parseFloat(v);if(isNaN(n))return"";return n===Math.round(n)?String(Math.round(n)):n.toFixed(1);}

function RecipeRow(p){
  var r=p.row;
  var [open,setOpen]=useState(false);
  return(
    <div style={{borderTop:"1px solid "+BORD}}>
      <div onClick={r.ingredients?function(){setOpen(!open);}:undefined} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:r.ingredients?"pointer":"default"}}>
        <div style={{fontSize:11,fontWeight:700,color:OR,width:68,flexShrink:0}}>{r.slot}</div>
        <div style={{flex:1,fontSize:12,fontWeight:500,color:TXT}}>{r.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span style={{fontSize:11,color:MUT}}>{r.kcal} kcal</span>
          {r.ingredients?<div style={{width:20,height:20,borderRadius:6,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:SUB,transform:open?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▼</div>:null}
        </div>
      </div>
      {open&&r.ingredients&&(
        <div style={{padding:"0 14px 10px",borderTop:"1px solid "+BORD}}>
          <div style={{fontSize:10,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,marginTop:8}}>Ingrédients</div>
          {r.ingredients.map(function(ing,i){return(<div key={i} style={{display:"flex",gap:6,paddingBottom:3}}><div style={{width:4,height:4,borderRadius:"50%",background:OR,flexShrink:0,marginTop:5}}/><span style={{fontSize:12,color:TXT}}>{ing}</span></div>);})}
          {r.steps&&<div style={{fontSize:10,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6,marginTop:8}}>Préparation</div>}
          {r.steps&&r.steps.map(function(st,i){return(<div key={i} style={{display:"flex",gap:8,marginBottom:4}}><div style={{width:16,height:16,borderRadius:"50%",background:OR+"22",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:OR,flexShrink:0}}>{i+1}</div><span style={{fontSize:12,color:SUB,lineHeight:1.5}}>{st}</span></div>);})}
        </div>
      )}
    </div>
  );
}

export function SessionCard(p){
  var s=p.session;
  var [open,setOpen]=useState(p.isNext||false);
  var [nutOpen,setNutOpen]=useState(false);
  var [saving,setSaving]=useState(false);

  // Done state : priorité à l'entry (journal) si fournie, sinon localStorage
  var entryDone=!!(p.entry&&p.entry.done);
  var doneKey="fr_done_"+s.date;
  var [localDone,setLocalDone]=useState(function(){return ls(doneKey,false);});
  var done=p.entry!==undefined?entryDone:localDone;

  function handleDone(e){
    e.stopPropagation();
    if(saving||done)return;
    if(p.onValidate){setSaving(true);p.onValidate(s);return;}
    // fallback localStorage (si pas de onValidate)
    var v=!localDone;setLocalDone(v);lsSet(doneKey,v);if(v&&p.isBoss&&p.onBossKill)p.onBossKill();
  }

  var sc=TYPE_COLORS[s.type]||OR;
  var isStrength=s.type==="strength";
  var n=calcNutrition(p.profile,s.type);
  var recipes=RECIPES[s.type]||[];
  var isPast=s.date&&s.date<new Date(new Date().setHours(0,0,0,0));

  // Données réelles si l'entrée est renseignée
  var actualKm=p.entry&&p.entry.km?parseFloat(p.entry.km):null;
  var actualMin=p.entry&&p.entry.min?parseFloat(p.entry.min):null;
  var actualPace=paceStr(actualKm,actualMin);
  var kmDiff=actualKm!=null&&s.km?actualKm-s.km:null;

  return(
    <Card style={{marginBottom:10,border:done?"1.5px solid "+GR:p.isNext?"1.5px solid "+sc:"1px solid "+BORD,opacity:(isPast&&!done)?0.5:1}}>
      {p.isBoss&&(
        <div style={{background:"linear-gradient(90deg,#ff4400cc,#ff8800aa)",padding:"5px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10}}>💥</span>
            <span style={{fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:0.8}}>Session Boss</span>
          </div>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.8)",fontWeight:600}}>+25 pts bonus si complétée</span>
        </div>
      )}
      {p.isNext&&!p.isBoss&&(
        <div style={{background:"linear-gradient(90deg,"+sc+"cc,"+sc+"88)",padding:"5px 14px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10}}>{isStrength?"💪":"⚡"}</span>
          <span style={{fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:0.8}}>{isStrength?"Séance de renforcement":"Prochaine séance"}</span>
        </div>
      )}
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={function(){setOpen(!open);}}>
          <div style={{width:44,height:44,borderRadius:11,background:sc+(p.isNext?"44":"20"),border:"1px solid "+sc+"44",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {isStrength?<span style={{fontSize:18}}>💪</span>:<>
              <div style={{fontSize:9,color:sc,fontWeight:700}}>{s.dayLabel}</div>
              <div style={{fontSize:9,color:sc}}>{s.date?s.date.getDate()+"/"+(s.date.getMonth()+1):""}</div>
            </>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:p.isNext?700:600,color:p.isNext?sc:TXT,marginBottom:3}}>{s.label}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {isStrength?(
                <><span style={{fontSize:12,color:sc,fontWeight:600}}>Renforcement</span>{s.duration&&<span style={{fontSize:12,color:SUB}}>· {s.duration}</span>}{s.exercises&&<span style={{fontSize:12,color:SUB}}>· {s.exercises.length} exercices</span>}</>
              ):(
                done&&actualKm!=null?(
                  // Affichage réel
                  <><span style={{fontSize:12,color:GR,fontWeight:600}}>{fmtKm(actualKm)} km</span>
                  {actualMin&&<span style={{fontSize:12,color:SUB}}>· {actualMin} min</span>}
                  {actualPace&&<span style={{fontSize:12,color:GR}}>· {actualPace}/km</span>}
                  {kmDiff!==null&&Math.abs(kmDiff)>=0.1&&<span style={{fontSize:11,color:kmDiff>=0?GR:RE,fontWeight:600}}>{kmDiff>=0?"+":""}{fmtKm(kmDiff)} km vs plan</span>}</>
                ):(
                  <>{s.type!=="race"?<span style={{fontSize:12,color:SUB}}>{s.km} km</span>:null}{s.pace?<span style={{fontSize:12,color:SUB}}>· {s.pace}/km</span>:null}{(s.type!=="race"&&s.pace)?<span style={{fontSize:12,color:sc,fontWeight:600}}>· {durStr(s.pace,s.km)}</span>:null}</>
                )
              )}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <button onClick={handleDone} disabled={saving||done} style={{width:28,height:28,borderRadius:8,background:done?GR+"22":SURF2,border:"1px solid "+(done?GR:BORD),display:"flex",alignItems:"center",justifyContent:"center",cursor:done||saving?"default":"pointer",fontSize:12,color:done?GR:MUT,opacity:saving?0.5:1}}>{saving?"…":done?"✓":"○"}</button>
            <div style={{width:24,height:24,borderRadius:8,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:SUB,transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
          </div>
        </div>

        {open&&(
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+BORD}}>
            {s.desc&&(
              <div style={{background:sc+"10",border:"1px solid "+sc+"25",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,color:sc,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>{isStrength?"Description":"Consignes"}</div>
                <div style={{fontSize:13,color:TXT,lineHeight:1.7}}>{s.desc}</div>
              </div>
            )}
            {isStrength&&s.exercises&&s.exercises.length>0&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:sc,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Exercices</div>
                {s.exercises.map(function(ex,ei){return(
                  <div key={ei} style={{marginBottom:6,padding:"10px 12px",borderRadius:10,background:sc+"0e",border:"1px solid "+sc+"22"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{fontSize:13,fontWeight:700,color:TXT}}>{ex.name}</div>
                      <div style={{fontSize:11,fontWeight:600,color:sc,background:sc+"18",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap",marginLeft:8,flexShrink:0}}>{ex.sets}</div>
                    </div>
                    <div style={{fontSize:11,color:MUT,fontStyle:"italic"}}>{ex.tip}</div>
                  </div>
                );})}
              </div>
            )}

            {/* Bloc réalisé : réel vs planifié */}
            {done&&(actualKm!=null||actualMin!=null)&&(
              <div style={{background:GR+"10",border:"1px solid "+GR+"30",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,color:GR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:10}}>Réalisé</div>
                <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:actualPace||s.pace?8:0}}>
                  {actualKm!=null&&<div>
                    <div style={{fontSize:18,fontWeight:800,color:kmDiff!=null&&kmDiff<-1?RE:GR}}>{fmtKm(actualKm)} km</div>
                    {s.km&&<div style={{fontSize:10,color:MUT}}>planifié {s.km} km{kmDiff!=null&&Math.abs(kmDiff)>=0.1?(" · "+(kmDiff>=0?"+":"")+fmtKm(kmDiff)+" km"):""}</div>}
                  </div>}
                  {actualMin!=null&&<div>
                    <div style={{fontSize:18,fontWeight:800,color:BL}}>{actualMin} min</div>
                    <div style={{fontSize:10,color:MUT}}>durée réelle</div>
                  </div>}
                  {actualPace&&<div>
                    <div style={{fontSize:18,fontWeight:800,color:OR}}>{actualPace}/km</div>
                    {s.pace&&<div style={{fontSize:10,color:MUT}}>planifié {s.pace}/km</div>}
                  </div>}
                </div>
                {p.entry&&p.entry.rpe&&<div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,color:MUT}}>Effort :</span>
                  <span style={{fontSize:11,fontWeight:700,color:p.entry.rpe<=3?GR:p.entry.rpe<=6?"#F59E0B":p.entry.rpe<=8?OR:RE}}>{p.entry.rpe}/10</span>
                </div>}
              </div>
            )}
            {/* Bouton Valider si pas encore fait */}
            {!done&&p.onValidate&&s.type!=="race"&&(
              <button onClick={function(){if(saving)return;setSaving(true);p.onValidate(s);}} disabled={saving} style={{width:"100%",marginBottom:12,padding:"10px",borderRadius:10,background:GR+"15",border:"1px solid "+GR+"44",color:GR,fontSize:13,fontWeight:600,cursor:saving?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:saving?0.5:1}}>
                {saving?"…":"✓ Valider avec mes vraies valeurs"}
              </button>
            )}

            {(function(){
              var isPro=planLevel(p.profile)>=2;
              var trial=isPro?{active:true,daysLeft:99}:getRecipesTrial();
              var canSeeRecipes=isPro||trial.active;
              var totalKcal=n.kcal||0;
              return(
                <div style={{borderRadius:12,border:"1px solid "+BORD,overflow:"hidden"}}>
                  <div onClick={function(){setNutOpen(!nutOpen);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:SURF2,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13}}>🥗</span>
                      <span style={{fontSize:12,fontWeight:600,color:TXT}}>Nutrition</span>
                      {!isPro&&trial.active&&<span style={{fontSize:9,fontWeight:700,color:GR,background:GR+"18",padding:"2px 6px",borderRadius:5}}>Essai {trial.daysLeft}j</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:700,color:OR}}>{totalKcal} kcal</span>
                      <div style={{width:22,height:22,borderRadius:7,background:"#0a0a0a",border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:SUB,transform:nutOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▼</div>
                    </div>
                  </div>
                  {nutOpen&&(
                    <div>
                      <div style={{display:"flex",gap:6,padding:"10px 12px",borderTop:"1px solid "+BORD}}>
                        {[{label:"Glucides",value:n.carbs+"g",color:BL},{label:"Protéines",value:n.prot+"g",color:GR},{label:"Lipides",value:n.fat+"g",color:YE}].map(function(m,i){
                          return <div key={i} style={{flex:1,background:SURF2,borderRadius:8,padding:"7px 4px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div><div style={{fontSize:9,color:MUT,marginTop:2}}>{m.label}</div></div>;
                        })}
                      </div>
                      {(function(){
                        if(isStrength||s.km<=0)return null;
                        var km=actualKm||s.km||0;
                        var hyd=sessionHydration(p.profile&&p.profile.weight,km);
                        if(hyd.dailyMl<=0)return null;
                        var dailyL=(hyd.dailyMl/1000).toFixed(1);
                        var duringMl=Math.round(hyd.duringMl/50)*50;
                        return(
                          <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderTop:"1px solid "+BORD}}>
                            <span style={{fontSize:14,flexShrink:0}}>🚰</span>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:600,color:BL}}>{dailyL} L aujourd'hui</span>
                              {duringMl>0&&<span style={{fontSize:11,color:MUT}}> · dont ~{duringMl} ml pendant la séance</span>}
                            </div>
                          </div>
                        );
                      })()}
                      {canSeeRecipes?(
                        <>
                          {!isPro&&<div style={{margin:"8px 12px 0",padding:"8px 12px",borderRadius:8,background:YE+"12",border:"1px solid "+YE+"33",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontSize:11,color:YE,fontWeight:600}}>⏳ Accès gratuit encore {trial.daysLeft} jour{trial.daysLeft>1?"s":""}</span>
                            <span onClick={function(e){e.stopPropagation();p.onShowPricing&&p.onShowPricing();}} style={{fontSize:10,fontWeight:700,color:OR,cursor:"pointer",textDecoration:"underline"}}>Passer Pro</span>
                          </div>}
                          {(function(){var src=recipes.length>0?recipes.map(function(r){return{slot:r.slot,name:r.name,kcal:r.kcal,ingredients:r.ingredients,steps:r.steps};}):n.meals.map(function(m){return{slot:m.time,name:m.food,kcal:m.kcal,ingredients:null,steps:null};});var seen=new Set();return src.filter(function(row){if(seen.has(row.slot))return false;seen.add(row.slot);return true;});})().map(function(row,ri){
                            return <RecipeRow key={ri} row={row}/>;
                          })}
                        </>
                      ):(
                        <div onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{margin:"8px 12px 12px",padding:"12px 14px",borderRadius:10,background:OR+"10",border:"1px solid "+OR+"33",cursor:"pointer"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>🔒</span><span style={{fontSize:12,fontWeight:600,color:TXT}}>Plan repas · Recettes détaillées</span></div>
                            <span style={{fontSize:10,fontWeight:700,color:OR,background:OR+"18",padding:"2px 8px",borderRadius:6}}>Pro →</span>
                          </div>
                          <div style={{fontSize:11,color:MUT}}>Ton essai de {RECIPES_TRIAL_DAYS} jours est terminé. Passe en Pro pour garder l'accès.</div>
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
