import { useState, useEffect, useMemo } from "react";
import { BG, SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
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
    <div style={{paddingBottom:8}}>
      <LogoBar profile={p.profile} onProfile={function(){p.onGoToProfile&&p.onGoToProfile();}} onSignOut={p.onSignOut}/>
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(150deg,#1c0f00 0%,#110900 45%,"+BG+" 100%)",padding:"16px 20px 0px"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:OR,opacity:0.05,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:BL,opacity:0.04,pointerEvents:"none"}}/>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,color:OR,fontWeight:600,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>{greeting}</div>
          <div style={{fontSize:30,fontWeight:800,color:TXT,letterSpacing:"-0.5px",lineHeight:1}}>{p.profile.name||"Champion"}</div>
          <div style={{marginTop:10}}>
            <button onClick={function(){p.onGoToProfile&&p.onGoToProfile();}} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:OR+"18",border:"1px solid "+OR+"35",cursor:"pointer",fontFamily:"inherit"}}>
              <span style={{fontSize:11,color:OR,fontWeight:600}}>Modifier ton profil</span>
              <span style={{fontSize:10,color:OR}}>✎</span>
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          {[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km),color:BL},{label:"Streak",value:p.stats.streak,color:YE}].map(function(st,i){
            return(<div key={i} style={{background:"rgba(255,255,255,0.045)",backdropFilter:"blur(8px)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:24,fontWeight:800,lineHeight:1}}><AnimCount value={st.value} color={st.color}/></div>
              <div style={{fontSize:9,color:MUT,marginTop:5,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5}}>{st.label}</div>
            </div>);
          })}
        </div>
        {p.stats.sessions>0&&(
          <button onClick={function(){
            var txt="J'ai parcouru "+Math.round(p.stats.km)+" km en "+p.stats.sessions+" séance"+(p.stats.sessions>1?"s":"")+" avec FuelRun !"+(p.race?" Je prépare "+p.race.name+" !":"")+" Rejoins-moi sur l'app.";
            if(navigator.share){navigator.share({title:"FuelRun",text:txt,url:window.location.href});}
            else{navigator.clipboard&&navigator.clipboard.writeText(txt);}
          }} style={{width:"100%",marginBottom:10,padding:"10px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:TXT,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.3}}>
            Partager mes stats
          </button>
        )}
        <div style={{padding:"14px 16px",borderRadius:14,background:OR+"12",border:"1px solid "+OR+"25",textAlign:"center"}}>
          <div style={{fontSize:13,color:TXT,lineHeight:1.7,fontStyle:"italic",fontWeight:500}}>"{quote.text}"</div>
          <div style={{fontSize:11,color:OR,fontWeight:700,marginTop:8,letterSpacing:0.3}}>{'\u2014'} {quote.author} {'\u2014'}</div>
        </div>
      </div>

      <div style={{padding:"14px 16px 0"}}>
        {p.race&&planWeeks.length>0&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+BORD,marginBottom:14,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:10,color:raceCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Objectif</div>
                <div style={{fontSize:14,fontWeight:700,color:TXT,lineHeight:1.2}}>{p.race.name}</div>
                <div style={{fontSize:11,color:SUB,marginTop:2}}>{p.race.city} · 🏁 {fmtS(new Date(p.race.date))}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                <div style={{fontSize:24,fontWeight:800,color:raceCol,lineHeight:1}}>{p.race.dist}<span style={{fontSize:11,fontWeight:500,color:MUT,marginLeft:2}}>km</span></div>
                <div style={{fontSize:9,color:MUT,textTransform:"uppercase",letterSpacing:0.5}}>{p.race.type==="trail"?"Trail":"Route"}</div>
              </div>
            </div>
            <div style={{height:5,background:raceCol+"18",borderRadius:6,overflow:"hidden",marginBottom:5}}>
              <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+raceCol+"99,"+raceCol+")",borderRadius:6}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:MUT}}>Sem. 1</span>
              <span style={{fontSize:10,color:raceCol,fontWeight:600}}>{raceProgress}% · dans {raceWeeks} sem.</span>
              <span style={{fontSize:10,color:MUT}}>Sem. {planWeeks.length}</span>
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
            <div style={{borderRadius:18,background:SURF,border:"1px solid "+BORD,marginBottom:14,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",background:"linear-gradient(135deg,"+OR+"10,transparent)",borderBottom:"1px solid "+BORD}}>
                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2}}>Aujourd'hui</div>
              </div>
              <div style={{display:"flex",borderBottom:"1px solid "+BORD}}>
                <div style={{width:3,background:OR,flexShrink:0}}/>
                <div style={{flex:1,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Séance</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      {nextSess?(
                        <div>
                          <div style={{fontSize:15,fontWeight:800,color:TXT,letterSpacing:"-0.2px"}}>{nextSess.label}</div>
                          <div style={{fontSize:12,color:SUB,marginTop:2}}>
                            {nextSess.type!=="race"?nextSess.km+" km":""}{nextSess.pace?" · "+nextSess.pace+"/km":""}
                          </div>
                        </div>
                      ):(
                        <div style={{fontSize:14,fontWeight:600,color:SUB}}>Repos — récupération active</div>
                      )}
                    </div>
                    {nextSess&&nextSess.pace&&(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:800,color:sessCol}}>{durStr(nextSess.pace,nextSess.km)}</div>
                        <div style={{fontSize:9,color:MUT}}>durée est.</div>
                      </div>
                    )}
                  </div>
                  {nextSess&&(
                    <div style={{marginTop:10}}>
                      <button onClick={function(){
                        if(todayDone)return;
                        p.onGoToJournal&&p.onGoToJournal(nextSess.km||0);
                      }} style={{width:"100%",padding:"9px",borderRadius:10,background:todayDone?GR+"18":OR,border:todayDone?"1px solid "+GR+"44":"none",color:todayDone?GR:"#fff",fontSize:12,fontWeight:700,cursor:todayDone?"default":"pointer",fontFamily:"inherit",letterSpacing:0.2}}>
                        {todayDone?"✓ Séance validée":"Valider cette séance"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {n&&(
                <div style={{display:"flex",borderBottom:"1px solid "+BORD}}>
                  <div style={{width:3,background:OR,flexShrink:0}}/>
                  <div style={{flex:1,padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:10,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Nutrition</div>
                      {!isPro&&(
                        <div onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{padding:"3px 8px",borderRadius:6,background:OR+"18",border:"1px solid "+OR+"33",cursor:"pointer"}}>
                          <span style={{fontSize:9,fontWeight:700,color:OR}}>Plan repas Pro</span>
                        </div>
                      )}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                      <span style={{fontSize:15,fontWeight:800,color:OR}}>{n.kcal} kcal</span>
                      <span style={{fontSize:11,color:MUT}}>G {n.carbs}g · P {n.prot}g · L {n.fat}g</span>
                    </div>
                    {(isPro||homeTrial.active)&&n.meals.length>0&&(
                      <div style={{marginTop:10}}>
                        {!isPro&&homeTrial.active&&(
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",marginBottom:6}}>
                            <span style={{fontSize:10,color:YE,fontWeight:600}}>⏳ Accès essai — {homeTrial.daysLeft} jour{homeTrial.daysLeft>1?"s":""} restant{homeTrial.daysLeft>1?"s":""}</span>
                            <span onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{fontSize:10,color:OR,fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>Passer Pro</span>
                          </div>
                        )}
                        <div style={{display:"flex",flexDirection:"column",gap:0}}>
                          {n.meals.slice(0,3).map(function(m,i){return(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:i>0?"1px solid "+BORD:"none"}}>
                              <span style={{fontSize:10,fontWeight:600,color:MUT,width:64,flexShrink:0}}>{m.time}</span>
                              <span style={{flex:1,fontSize:12,color:TXT}}>{m.food}</span>
                              <span style={{fontSize:11,fontWeight:600,color:OR,flexShrink:0}}>{m.kcal} kcal</span>
                            </div>
                          );})}
                        </div>
                        {(RECIPES[sessType]||[]).length>0&&(
                          <div style={{marginTop:8}}>
                            <button onClick={function(){setShowRecipes(!showRecipes);}} style={{width:"100%",padding:"7px",borderRadius:8,background:SURF2,border:"1px solid "+BORD,color:SUB,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                              {showRecipes?"Masquer les recettes ↑":"Voir les recettes détaillées ↓"}
                            </button>
                            {showRecipes&&(RECIPES[sessType]||[]).map(function(r,ri){return(
                              <div key={ri} style={{marginTop:8,background:SURF2,borderRadius:10,padding:"12px",border:"1px solid "+BORD}}>
                                <div style={{fontSize:12,fontWeight:700,color:TXT,marginBottom:2}}>{r.name}</div>
                                <div style={{fontSize:10,color:MUT,marginBottom:8}}>{r.slot} · {r.time} · {r.kcal} kcal</div>
                                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Ingrédients</div>
                                <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:8}}>
                                  {r.ingredients.map(function(ing,ii){return(
                                    <div key={ii} style={{fontSize:11,color:SUB,display:"flex",gap:6}}>
                                      <span style={{color:OR,flexShrink:0}}>·</span>{ing}
                                    </div>
                                  );})}
                                </div>
                                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Préparation</div>
                                {r.steps.map(function(step,si){return(
                                  <div key={si} style={{display:"flex",gap:8,marginBottom:4}}>
                                    <span style={{fontSize:10,fontWeight:700,color:OR,flexShrink:0,width:14}}>{si+1}.</span>
                                    <span style={{fontSize:11,color:TXT,lineHeight:1.5}}>{step}</span>
                                  </div>
                                );})}
                              </div>
                            );})}
                          </div>
                        )}
                      </div>
                    )}
                    {!isPro&&!homeTrial.active&&(
                      <div onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:OR+"10",border:"1px solid "+OR+"30",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11}}>🔒</span><span style={{fontSize:11,color:MUT}}>Plan repas · Recettes — essai terminé</span></div>
                        <span style={{fontSize:10,fontWeight:700,color:OR}}>Pro →</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{display:"flex"}}>
                <div style={{width:3,background:OR,flexShrink:0}}/>
                <div style={{flex:1,padding:"14px 16px"}}>
                  <div style={{fontSize:10,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Conseil du coach</div>
                  <div style={{fontSize:13,color:TXT,lineHeight:1.6}}>{tip}</div>
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{borderRadius:18,background:SURF,border:"1px solid "+BORD,marginBottom:14,overflow:"hidden"}}>
          {p.wellbeing?(
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:wba.bg,borderBottom:"1px solid "+wba.color+"20"}}>
              <div style={{width:44,height:44,borderRadius:12,background:wba.color+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{wba.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:wba.color}}>{wba.text}</div>
                <div style={{fontSize:12,color:SUB,marginTop:2}}>{wba.sub}</div>
              </div>
            </div>
          ):(
            <div onClick={p.onCheckin} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderBottom:"1px solid "+BORD,cursor:"pointer"}}>
              <div style={{width:44,height:44,borderRadius:12,background:OR+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌡️</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:TXT}}>Comment tu te sens ?</div>
                <div style={{fontSize:12,color:SUB,marginTop:2}}>Check-in rapide · 30 sec</div>
              </div>
              <div style={{width:30,height:30,borderRadius:"50%",background:OR+"18",display:"flex",alignItems:"center",justifyContent:"center",color:OR,fontSize:16,flexShrink:0}}>›</div>
            </div>
          )}
        </div>

        {weather&&(function(){
          var adv=weatherAdvice(weather.weathercode||0,weather.temperature_2m||15,weather.windspeed_10m||0);
          return(
            <div style={{borderRadius:14,background:SURF,border:"1px solid "+BORD,padding:"14px 16px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:34,lineHeight:1,flexShrink:0}}>{adv.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:adv.color,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Météo · Conseil séance</div>
                  <div style={{fontSize:13,fontWeight:600,color:TXT,marginBottom:4}}>{adv.desc} · {Math.round(weather.temperature_2m||0)}°C{weather.windspeed_10m>10?" · "+Math.round(weather.windspeed_10m)+" km/h":""}</div>
                  <div style={{fontSize:12,color:SUB,lineHeight:1.5}}>{adv.tip}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
