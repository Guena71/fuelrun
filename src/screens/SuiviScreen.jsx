import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
import { stravaAuthUrl } from "../utils/strava.js";
import { fmtDate, fmtPaceSec, fmtDuration } from "../utils/date.js";
import { planLevel } from "../utils/nutrition.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { parseGpx, calcTrackKm, RunMap, MapModal } from "../components/gps.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

function calcStats(entries){var sessions=0,km=0;Object.values(entries||{}).forEach(function(e){if(e.done){sessions++;km+=parseFloat(e.km)||0;}});return{sessions:sessions,km:km};}
function calcStreak(entries){var s=0,d=new Date();d.setHours(0,0,0,0);while(true){var k=d.toDateString();if(entries&&entries[k]&&entries[k].done){s++;d.setDate(d.getDate()-1);}else break;}return s;}

export function SuiviScreen(p){
  var entries=p.entries||{};
  var today=new Date();
  var [showGpxUpgrade,setShowGpxUpgrade]=useState(false);
  var [showMapModal,setShowMapModal]=useState(false);
  var todayKey=today.toDateString();
  var todayDone=!!(entries[todayKey]&&entries[todayKey].done);

  var plan=p.race?buildPlan(p.race,p.profile||{}):null;
  var planWeeks=getPlanWeeks(plan);
  var todaySess=null;
  for(var wi=0;wi<planWeeks.length;wi++){
    for(var si=0;si<planWeeks[wi].sessions.length;si++){
      var s=planWeeks[wi].sessions[si];
      if(s.date&&s.date.toDateString()===todayKey&&s.type!=="race"){todaySess=s;break;}
    }
    if(todaySess)break;
  }

  function validateToday(){
    var km=todaySess?todaySess.km||5:5;
    var prev=entries[todayKey]||{};
    p.onSetEntries&&p.onSetEntries(function(e){return Object.assign({},e,{[todayKey]:Object.assign({},prev,{done:true,km:String(km),min:""})});});
    p.onAddSession&&p.onAddSession(km);
  }

  function saveTrack(res){
    var prev=entries[todayKey]||{};
    var wasNotDone=!prev.done;
    p.onSetEntries&&p.onSetEntries(function(e){return Object.assign({},e,{[todayKey]:Object.assign({},prev,{done:true,track:res.track,km:res.km,min:res.min})});});
    if(wasNotDone&&p.onAddSession)p.onAddSession(parseFloat(res.km)||0);
  }

  // Weekly volumes (8 weeks)
  var weeks=[];
  for(var w=7;w>=0;w--){
    var wStart=new Date(today);wStart.setDate(today.getDate()-today.getDay()+1-w*7);wStart.setHours(0,0,0,0);
    var wEnd=new Date(wStart);wEnd.setDate(wStart.getDate()+6);wEnd.setHours(23,59,59,999);
    var wkm=0;
    Object.entries(entries).forEach(function(e){var d=new Date(e[0]);if(d>=wStart&&d<=wEnd&&e[1].done)wkm+=parseFloat(e[1].km)||0;});
    weeks.push({label:wStart.getDate()+"/"+(wStart.getMonth()+1),km:Math.round(wkm),current:w===0});
  }
  var thisWeekKm=weeks[7].km;
  var targetKm=p.profile.kmWeek||25;
  var stats=calcStats(entries);
  var streak=calcStreak(entries);
  var recent=Object.entries(entries).filter(function(e){return e[1].done;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);}).slice(0,5);
  var lastTracked=(Object.entries(entries).filter(function(e){return e[1].done&&e[1].track&&e[1].track.length>1;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);})[0])||null;

  function share(){
    var txt="J'ai couru "+Math.round(stats.km)+" km au total avec FuelRun !"+(p.race?" Je prépare "+p.race.name+" !":"")+" Rejoins-moi.";
    if(navigator.share)navigator.share({title:"FuelRun",text:txt,url:window.location.href});
    else if(navigator.clipboard)navigator.clipboard.writeText(txt);
  }

  var maxKm=Math.max.apply(null,weeks.map(function(wk){return wk.km||0;}));

  return(
    <><div><LogoBar/>
      <div style={{padding:"16px 16px 80px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>Suivi</div>
          <button onClick={share} style={{padding:"6px 14px",borderRadius:20,background:OR+"18",border:"1px solid "+OR+"40",color:OR,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Partager</button>
        </div>

        {/* Séance du jour */}
        {(todaySess||!todayDone)&&(
          <div style={{borderRadius:14,marginBottom:12,overflow:"hidden",background:todayDone?GR+"12":OR+"0e",border:"1.5px solid "+(todayDone?GR:OR)+"44"}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:22,flexShrink:0}}>{todayDone?"✅":"🏃"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:todayDone?GR:OR}}>
                  {todayDone?"Séance validée !":todaySess?todaySess.label:"Séance du jour"}
                </div>
                <div style={{fontSize:11,color:SUB,marginTop:2}}>
                  {todayDone?"Bravo, continue comme ça 💪":todaySess?(todaySess.type==="strength"?(todaySess.duration||"Renforcement"):todaySess.km+" km · "+(todaySess.pace||"allure libre")):"Enregistre ta sortie"}
                </div>
              </div>
              {!todayDone&&(
                <button onClick={validateToday} style={{flexShrink:0,padding:"8px 14px",borderRadius:10,background:OR,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Valider ✓</button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:OR,lineHeight:1}}>{thisWeekKm}</div>
            <div style={{fontSize:9,color:MUT,marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>km semaine</div>
            <div style={{marginTop:6,height:3,borderRadius:2,background:SURF2,overflow:"hidden"}}>
              <div style={{width:Math.min(100,Math.round(thisWeekKm/targetKm*100))+"%",height:"100%",background:OR,borderRadius:2,transition:"width .5s"}}/>
            </div>
          </div>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:BL,lineHeight:1}}>{Math.round(stats.km)}</div>
            <div style={{fontSize:9,color:MUT,marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>km total</div>
            <div style={{fontSize:10,color:MUT,marginTop:6}}>{stats.sessions} séances</div>
          </div>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#F59E0B",lineHeight:1}}>{streak}</div>
            <div style={{fontSize:9,color:MUT,marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>jours 🔥</div>
            <div style={{fontSize:10,color:MUT,marginTop:6}}>en cours</div>
          </div>
        </div>

        {/* Volume chart */}
        {maxKm>0&&(
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"14px 14px 10px",marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Volume · 8 semaines</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:64}}>
              {weeks.map(function(wk,i){
                var barH=Math.max(3,Math.round((wk.km/maxKm)*50));
                var col=wk.current?OR:wk.km>=targetKm?GR:SURF2;
                return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    {wk.km>0&&<div style={{fontSize:7,color:wk.current?OR:MUT,fontWeight:wk.current?700:400}}>{wk.km}</div>}
                    <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}>
                      <div style={{width:"100%",height:barH,background:col,borderRadius:"3px 3px 0 0",border:wk.current?"1.5px solid "+OR:wk.km>=targetKm?"1.5px solid "+GR:"none",transition:"height .4s"}}/>
                    </div>
                    <div style={{fontSize:7,color:wk.current?OR:MUT,fontWeight:wk.current?600:400}}>{wk.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mes sorties */}
        <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,overflow:"hidden",marginBottom:12}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+BORD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:TXT}}>Mes sorties</div>
            <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{fontSize:11,color:OR,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Journal complet →</button>
          </div>

          {/* Strava + GPX dans une même ligne */}
          <div style={{padding:"10px 16px",borderBottom:"1px solid "+BORD,display:"flex",gap:8}}>
            {!p.stravaProfile?(
              <a href={stravaAuthUrl()} style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:"#FC4C02",textDecoration:"none"}}>
                <span style={{fontSize:16}}>🔗</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Connecter Strava</div>
                </div>
              </a>
            ):(
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:GR+"0e",border:"1px solid "+GR+"33"}}>
                <div style={{width:24,height:24,borderRadius:6,background:"#FC4C02",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔗</div>
                <div style={{flex:1,fontSize:12,fontWeight:600,color:TXT}}>Strava connecté</div>
                <button onClick={p.onStravaSync} style={{padding:"4px 10px",borderRadius:8,background:GR+"18",border:"1px solid "+GR+"44",color:GR,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sync</button>
              </div>
            )}
            {planLevel(p.profile)>=1?(
              <label style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:BL+"0e",border:"1px solid "+BL+"33",cursor:"pointer"}}>
                <span style={{fontSize:16}}>📎</span>
                <div style={{fontSize:12,fontWeight:600,color:BL}}>Importer GPX</div>
                <input type="file" accept=".gpx" style={{display:"none"}} onChange={function(e){
                  var file=e.target.files&&e.target.files[0];if(!file)return;
                  var reader=new FileReader();
                  reader.onload=function(ev){var track=parseGpx(ev.target.result);if(track.length>1){var km=calcTrackKm(track);var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;saveTrack({track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):""});}};
                  reader.readAsText(file);e.target.value="";
                }}/>
              </label>
            ):(
              <div onClick={function(){setShowGpxUpgrade(true);}} style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:10,background:SURF2,border:"1px solid "+BORD,cursor:"pointer"}}>
                <span style={{fontSize:16}}>🔒</span>
                <div style={{fontSize:12,fontWeight:600,color:MUT}}>Importer GPX</div>
                <span style={{fontSize:9,fontWeight:700,color:BL,background:BL+"18",padding:"2px 6px",borderRadius:4}}>Ess.</span>
              </div>
            )}
          </div>

          {/* Dernière carte tracée */}
          {lastTracked&&(
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+BORD}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:11,color:MUT,fontWeight:600}}>Dernière sortie tracée</div>
                <div style={{fontSize:11,color:SUB}}>{fmtDate(new Date(lastTracked[0]))} · {lastTracked[1].km} km</div>
              </div>
              <RunMap track={lastTracked[1].track} height={140} onClick={function(){setShowMapModal(true);}}/>
              {lastTracked[1].min&&<div style={{marginTop:6,fontSize:11,color:SUB,textAlign:"center"}}>{fmtDuration(lastTracked[1].min,lastTracked[1].sec)} · {fmtPaceSec((parseFloat(lastTracked[1].min)*60)/(parseFloat(lastTracked[1].km)||1))} /km</div>}
            </div>
          )}

          {/* Liste des sorties récentes */}
          {recent.length===0?(
            <div style={{padding:"24px 16px",textAlign:"center"}}>
              <div style={{fontSize:13,color:MUT,marginBottom:12}}>Aucune sortie enregistrée</div>
              <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{padding:"9px 20px",borderRadius:20,background:OR,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Enregistrer ma première sortie</button>
            </div>
          ):(
            recent.map(function(e,i){
              var d=new Date(e[0]);var data=e[1];
              return(
                <div key={i} onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{padding:"11px 16px",borderBottom:i<recent.length-1?"1px solid "+BORD:"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:OR+"15",border:"1px solid "+OR+"30",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:OR,fontWeight:800}}>{Math.round(data.km||0)}<span style={{fontSize:7,fontWeight:500,marginLeft:1}}>km</span></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:TXT}}>{data.km||0} km{data.min?" · "+fmtDuration(data.min,data.sec):""}</div>
                    <div style={{fontSize:11,color:MUT,marginTop:1}}>{d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()}{data.rpe?" · RPE "+data.rpe:""}</div>
                  </div>
                  {data.feel!=null&&<div style={{fontSize:16}}>{[..."😤😓😐🙂💪"][data.feel]||""}</div>}
                  <div style={{fontSize:13,color:MUT}}>›</div>
                </div>
              );
            })
          )}
        </div>


      </div>
    </div>
    {showMapModal&&lastTracked&&<MapModal track={lastTracked[1].track} onClose={function(){setShowMapModal(false);}}/>}
    {showGpxUpgrade&&<UpgradeModal feature="Import GPX" minPlanLabel="Essentiel" minPlanColor={BL} onClose={function(){setShowGpxUpgrade(false);}} onUpgrade={function(){setShowGpxUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
