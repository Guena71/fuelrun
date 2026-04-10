import { useState, useEffect, useMemo } from "react";
import { BG, SURF, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";

import { TYPE_COLORS } from "../data/training.js";
import { weeksUntil, fmtS, durStr } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";

import { weatherAdvice } from "../utils/weather.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { AnimCount } from "../components/AnimCount.jsx";
import { xpToLevel, getWeeklyContractKey, generateWeeklyChallenge, challengeProgress } from "../utils/gamification.js";
import { BADGE_DEFS } from "../data/badges.js";
import { shareBadge, shareChallenge, shareRun } from "../utils/share.js";

export function HomeScreen(p){
  var [weather,setWeather]=useState(null);
  var gam=p.gamification||{xp:0,badges:[],contractsKept:0,bossKills:0};
  var level=xpToLevel(gam.xp||0);
  var weekKey=getWeeklyContractKey();
  var challenge=generateWeeklyChallenge(p.profile||{},weekKey);
  var chalDone=challengeProgress(p.entries||{},weekKey,challenge);
  var chalCompleted=chalDone>=challenge.target;
  var earnedBadges=(gam.badges||[]).slice(-3).map(function(b){return BADGE_DEFS.find(function(d){return d.id===b.id;});}).filter(Boolean);
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
          {[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km),color:BL},{label:"Jours 🔥",value:p.stats.streak,color:YE}].map(function(st,i){
            return(<div key={i} style={{background:"rgba(255,255,255,0.045)",backdropFilter:"blur(8px)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:24,fontWeight:800,lineHeight:1}}><AnimCount value={st.value} color={st.color}/></div>
              <div style={{fontSize:9,color:MUT,marginTop:5,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5}}>{st.label}</div>
            </div>);
          })}
        </div>
        <div style={{marginBottom:10,padding:"10px 14px",borderRadius:14,background:"rgba(255,255,255,0.045)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:15}}>{level.emoji}</span>
              <span style={{fontSize:12,fontWeight:700,color:TXT}}>{level.name}</span>
            </div>
            <span style={{fontSize:11,color:OR,fontWeight:600}}>{level.xp} XP{level.nextXP?" / "+level.nextXP+" XP":""}</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.1)",borderRadius:6,overflow:"hidden"}}>
            <div style={{width:level.progress+"%",height:"100%",background:"linear-gradient(90deg,"+OR+"99,"+OR+")",borderRadius:6,transition:"width 0.8s ease"}}/>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 16px 0"}}>
        {p.race&&planWeeks.length>0&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+BORD,marginBottom:14,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:10,color:raceCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Mon prochain objectif</div>
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

        <div style={{borderRadius:16,background:SURF,border:"1px solid "+(chalCompleted?GR+"66":BORD),marginBottom:14,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>{challenge.icon}</span>
              <div>
                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Challenge de la semaine</div>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>{challenge.label}</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:800,color:chalCompleted?GR:OR}}>{chalDone}<span style={{fontSize:11,color:MUT,fontWeight:400}}>/{challenge.target}</span></div>
              <div style={{fontSize:10,color:OR,fontWeight:600}}>+{challenge.xp} XP</div>
            </div>
          </div>
          <div style={{height:5,background:OR+"18",borderRadius:6,overflow:"hidden"}}>
            <div style={{width:Math.min(100,Math.round(chalDone/challenge.target*100))+"%",height:"100%",background:chalCompleted?"linear-gradient(90deg,"+GR+"99,"+GR+")":"linear-gradient(90deg,"+OR+"99,"+OR+")",borderRadius:6,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
            <div style={{fontSize:11,color:chalCompleted?GR:MUT,fontWeight:chalCompleted?600:400}}>{chalCompleted?"✓ Challenge relevé cette semaine !":"En cours · se renouvelle chaque semaine"}</div>
            {chalCompleted&&<button onClick={function(){shareChallenge(challenge,chalDone);}} style={{padding:"4px 10px",borderRadius:8,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Partager 🚀</button>}
          </div>
        </div>

        {earnedBadges.length>0&&(
          <div style={{borderRadius:16,background:SURF,border:"1px solid "+BORD,marginBottom:14,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:MUT,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Badges récents</div>
            <div style={{display:"flex",gap:10}}>
              {earnedBadges.map(function(def){return(
                <div key={def.id} onClick={function(){shareBadge(def);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1,cursor:"pointer"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:OR+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{def.emoji}</div>
                  <div style={{fontSize:9,color:TXT,fontWeight:600,textAlign:"center",lineHeight:1.2}}>{def.name}</div>
                  <div style={{fontSize:9,color:OR}}>Partager</div>
                </div>
              );})}
            </div>
          </div>
        )}

        {(function(){
          var coachTips={
            easy:[
              "Zone 2 : tu dois pouvoir tenir une conversation complète sans t'essouffler. Si tu halètes, ralentis. C'est cette allure lente et régulière qui développe ton moteur aérobie sur le long terme.",
              "La sortie facile est la reine de l'entraînement. 80% de ton volume doit se faire ici. Ne cède pas à la tentation d'aller plus vite — tu construis tes fondations aujourd'hui.",
              "Pense à ta foulée : attaque mi-pied, cadence autour de 170-180 pas/min. Une foulée courte et rapide fatigue moins que de grandes enjambées. Essaie de te sentir léger.",
              "Profite de cette sortie pour travailler ta respiration : inspire 3 foulées, expire 2. Ce rythme stabilise ta fréquence cardiaque et optimise l'apport en oxygène.",
            ],
            long:[
              "Démarre 20% plus lentement que ton allure habituelle. Le but des 10 premiers km : rester en zone 2. Les derniers km se courent avec l'énergie que tu as préservée au départ.",
              "Hydratation toutes les 20 min, même si tu n'as pas soif. La déshydratation arrive avant la sensation de soif. Prévois aussi une source de glucides si tu dépasses 1h30 de course.",
              "La sortie longue améliore ta capacité à brûler les graisses comme carburant. Plus tu accumules ces sorties, plus tu seras efficace en fin de course. C'est un investissement.",
              "Divise mentalement ta sortie en 3 tiers. Premier tiers : très facile. Deuxième tiers : confortable. Dernier tiers : tu peux augmenter légèrement si tu te sens bien.",
            ],
            interval:[
              "Échauffement obligatoire : 15 min en zone 2 minimum avant la première répétition. Un muscle froid blessé est hors service pour 3 semaines. La récup entre les séries est aussi importante que l'effort.",
              "Pendant les répétitions, vise 95% de ton effort maximal — pas 100%. À 100% tu accumules de la fatigue sans bénéfice supplémentaire. La régularité entre les répétitions prime.",
              "Après chaque intervalle, ta fréquence cardiaque doit redescendre sous 65% de ta FC max avant de repartir. Si elle ne redescend pas, tes récupérations sont trop courtes.",
              "Le fractionné améliore ta VO2max et ta vitesse à l'allure marathon. 6 semaines de séances régulières suffisent pour sentir une vraie différence sur tes chronos.",
            ],
            tempo:[
              "L'allure tempo est l'allure de ta course sur 1h environ. Elle doit être inconfortable mais contrôlée — tu peux prononcer des mots isolés, pas des phrases.",
              "Ne pars jamais trop vite sur une séance tempo. Les 5 premières minutes semblent toujours faciles — c'est un piège. Pars 5 à 10 secondes plus lentement que ta cible.",
              "Le tempo améliore ton seuil lactique : le point où ton corps commence à accumuler de l'acide lactique. Repousser ce seuil, c'est courir plus vite en étant moins fatigué.",
              "Après une séance tempo réussie, tu dois finir épuisé mais pas vidé. Si tu pourrais faire encore 10 min, tu étais trop lent. Si tu termines en décomposition, tu étais trop rapide.",
            ],
            recovery:[
              "Aujourd'hui l'objectif n'est pas de progresser mais de récupérer activement. Le mouvement à très basse intensité accélère l'élimination des déchets métaboliques dans tes muscles.",
              "Petite foulée, allure de promenade. Si ton cardio monte au-dessus de 65% de ta FC max, marche. Cette séance doit être agréable — écoute un podcast, profite du paysage.",
              "La récupération est où la progression se construit vraiment. L'entraînement crée du stress, le repos crée l'adaptation. Aujourd'hui tu deviens meilleur en faisant peu.",
            ],
            race:[
              "C'est le jour J ! La règle d'or : pars plus lentement que tu ne le penses nécessaire. Les 5 premiers km doivent sembler trop faciles. Tous les coureurs qui explosent sont partis trop vite.",
              "Confiance en ton plan. Tu as fait le travail. Aujourd'hui tu récoltes. Ne change rien à ta stratégie nutritionnelle, ne teste rien de nouveau.",
              "Gère ton énergie mentale. Les km difficiles sont normaux pour tout le monde. Décompose la distance en petits blocs et reste dans l'instant présent.",
            ],
          };
          var dayIdx=new Date().getDay();
          var tipsForType=coachTips[sessType]||["Écoute ton corps aujourd'hui. La régularité sur plusieurs mois fait plus que l'intensité d'une seule séance. Chaque kilomètre compte, même les jours sans motivation."];
          var tip=tipsForType[dayIdx%tipsForType.length];
          return(
            <div style={{borderRadius:18,background:SURF,border:"1px solid "+BORD,marginBottom:14,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",background:"linear-gradient(135deg,"+OR+"10,transparent)",borderBottom:"1px solid "+BORD}}>
                <div style={{fontSize:10,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2}}>Programme d'aujourd'hui</div>
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
                      {todayDone?(
                        <div style={{display:"flex",gap:8}}>
                          <div style={{flex:1,padding:"9px",borderRadius:10,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:12,fontWeight:700,textAlign:"center"}}>✓ Séance validée</div>
                          <button onClick={function(){var e=p.entries&&p.entries[todayKey];shareRun(e&&e.km,e&&e.min);}} style={{padding:"9px 12px",borderRadius:10,background:OR+"18",border:"1px solid "+OR+"44",color:OR,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🚀</button>
                        </div>
                      ):(
                        <button onClick={function(){p.onGoToSuivi&&p.onGoToSuivi();}} style={{width:"100%",padding:"9px",borderRadius:10,background:OR,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.2}}>
                          Valider dans Suivi →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
