import { useState } from "react";
import { SURF2, BORD, MUT, OR, GR, BL } from "../data/constants.js";
import { stravaAuthUrl } from "../utils/strava.js";
import { weeksUntil, fmtDate, fmtPaceSec } from "../utils/date.js";
import { planLevel } from "../utils/nutrition.js";
import { parseGpx, calcTrackKm, RunMap } from "../components/gps.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

export function SuiviScreen(p){
  var entries=p.entries||{};
  var race=p.race;
  var today=new Date();
  var [showGpxUpgrade,setShowGpxUpgrade]=useState(false);

  function saveTrack(res){
    var key=today.toDateString();
    var prev=entries[key]||{};
    var wasNotDone=!prev.done;
    var updated=Object.assign({},prev,{done:true,track:res.track,km:res.km,min:res.min});
    p.onSetEntries&&p.onSetEntries(function(e){return Object.assign({},e,{[key]:updated});});
    if(wasNotDone&&p.onAddSession)p.onAddSession(parseFloat(res.km)||0);
  }

  var weeks=[];
  for(var w=7;w>=0;w--){
    var wStart=new Date(today);wStart.setDate(today.getDate()-today.getDay()+1-w*7);wStart.setHours(0,0,0,0);
    var wEnd=new Date(wStart);wEnd.setDate(wStart.getDate()+6);wEnd.setHours(23,59,59,999);
    var km=0;
    Object.entries(entries).forEach(function(e){
      var d=new Date(e[0]);if(d>=wStart&&d<=wEnd&&e[1].done)km+=parseFloat(e[1].km)||0;
    });
    var label=wStart.getDate()+"/"+(wStart.getMonth()+1);
    weeks.push({label:label,km:Math.round(km),current:w===0});
  }
  var thisWeekKm=weeks[7].km;
  var targetKm=p.profile.kmWeek||25;

  var recent=Object.entries(entries).filter(function(e){return e[1].done;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);}).slice(0,5);

  var lastTracked=(Object.entries(entries).filter(function(e){return e[1].done&&e[1].track&&e[1].track.length>1;}).sort(function(a,b){return new Date(b[0])-new Date(a[0]);})[0])||null;

  var raceWeeks=race?weeksUntil(race.date):null;
  var totalPlanWeeks=race?Math.round((new Date(race.date)-new Date())/(7*24*3600*1000)+4):null;
  var raceProgress=totalPlanWeeks?Math.max(0,Math.min(100,Math.round((1-raceWeeks/totalPlanWeeks)*100))):0;

  function share(){
    var txt="J'ai couru "+Math.round(Object.entries(entries).filter(function(e){return e[1].done;}).reduce(function(s,e){return s+(parseFloat(e[1].km)||0);},0))+" km au total avec FuelRun !"+(race?" Je prépare "+race.name+" !":"")+" Rejoins-moi.";
    if(navigator.share)navigator.share({title:"FuelRun",text:txt,url:window.location.href});
    else if(navigator.clipboard)navigator.clipboard.writeText(txt);
  }

  return(
    <><div><LogoBar/>
      <div className="px-4 pt-5 pb-20">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[26px] font-extrabold text-txt tracking-[-0.4px]">Suivi</div>
          <button onClick={share} className="px-3.5 py-1.5 rounded-[20px] text-[12px] font-semibold cursor-pointer font-[inherit]"
            style={{background:OR+"22",border:"1px solid "+OR+"44",color:OR}}>Partager</button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="bg-surf border border-bord rounded-2xl px-4 py-3.5">
            <div className="text-[11px] text-mut mb-1 uppercase tracking-[0.5px]">Cette semaine</div>
            <div className="text-[28px] font-extrabold leading-none" style={{color:OR}}>{thisWeekKm}<span className="text-[13px] text-mut font-normal"> km</span></div>
            <div className="mt-2 h-1 rounded bg-surf2 overflow-hidden">
              <div className="h-full rounded transition-all duration-500" style={{width:Math.min(100,Math.round(thisWeekKm/targetKm*100))+"%",background:OR}}/>
            </div>
            <div className="text-[10px] text-mut mt-1">Objectif : {targetKm} km</div>
          </div>
          <div className="bg-surf border border-bord rounded-2xl px-4 py-3.5">
            <div className="text-[11px] text-mut mb-1 uppercase tracking-[0.5px]">Total</div>
            <div className="text-[28px] font-extrabold leading-none text-info">{p.stats.km?Math.round(p.stats.km):0}<span className="text-[13px] text-mut font-normal"> km</span></div>
            <div className="text-[10px] text-mut mt-2">{p.stats.sessions||0} séance{p.stats.sessions!==1?"s":""} · {p.stats.streak||0}j streak</div>
          </div>
        </div>

        {(function(){
          var maxKm=Math.max.apply(null,weeks.map(function(wk){return wk.km||0;}));
          if(maxKm===0)return null;
          return(
            <div className="bg-surf border border-bord rounded-2xl p-4 mb-3.5">
              <div className="text-[12px] font-semibold text-mut uppercase tracking-[0.5px] mb-3.5">Volume · 8 semaines</div>
              <div className="flex items-end gap-[3px] h-20">
                {weeks.map(function(wk,i){
                  var barH=Math.max(4,Math.round((wk.km/maxKm)*60));
                  var col=wk.current?OR:wk.km>=targetKm?GR:SURF2;
                  var border=wk.current?"2px solid "+OR:wk.km>=targetKm?"2px solid "+GR:"1px solid "+BORD;
                  return(
                    <div key={i} className="flex-1 flex flex-col items-center gap-[3px]">
                      {wk.km>0&&<div className="text-[8px] leading-none" style={{color:wk.current?OR:MUT,fontWeight:wk.current?700:400}}>{wk.km}</div>}
                      <div className="flex-1 flex items-end w-full">
                        <div className="w-full transition-all duration-500" style={{height:barH,background:col,border:border,borderRadius:"3px 3px 0 0"}}/>
                      </div>
                      <div className="text-[8px]" style={{color:wk.current?OR:MUT,fontWeight:wk.current?600:400}}>{wk.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-2.5">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px]" style={{background:OR}}/><span className="text-[10px] text-mut">Semaine en cours</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-[2px]" style={{background:GR}}/><span className="text-[10px] text-mut">Objectif atteint</span></div>
              </div>
            </div>
          );
        })()}

        <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}}
          className="w-full mb-3.5 px-[18px] py-3.5 rounded-2xl flex items-center justify-between cursor-pointer font-[inherit]"
          style={{background:"linear-gradient(135deg,"+OR+"22,"+OR+"0a)",border:"1.5px solid "+OR+"44"}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
              style={{background:OR+"22",border:"1px solid "+OR+"44"}}>📓</div>
            <div className="text-left">
              <div className="text-[14px] font-bold text-txt">Journal d'entraînement</div>
              <div className="text-[12px] text-sub mt-0.5">Calendrier · Ressenti · RPE · Notes</div>
            </div>
          </div>
          <div className="text-[20px] font-light" style={{color:OR}}>›</div>
        </button>

        {race&&(
          <div className="bg-surf border border-bord rounded-2xl p-4 mb-3.5">
            <div className="flex justify-between items-center mb-2.5">
              <div className="text-[13px] font-semibold text-txt">{race.name}</div>
              <div className="text-[12px] font-bold" style={{color:OR}}>{raceWeeks} sem.</div>
            </div>
            <div className="h-1.5 rounded-[3px] bg-surf2 overflow-hidden mb-1.5">
              <div className="h-full rounded-[3px] transition-all duration-500"
                style={{width:raceProgress+"%",background:"linear-gradient(90deg,"+OR+","+GR+")"}}/>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-mut">Début</span>
              <span className="text-[10px] font-semibold" style={{color:OR}}>{raceProgress}% accompli</span>
              <span className="text-[10px] text-mut">{race.date}</span>
            </div>
          </div>
        )}

        {(function(){
          var cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-7);
          var last7=Object.entries(entries).filter(function(e){return e[1].done&&new Date(e[0])>=cutoff;});
          if(last7.length===0)return null;
          var load=last7.reduce(function(s,e){return s+(parseFloat(e[1].km)||0)*(e[1].rpe||5);},0);
          var avgRpe=last7.reduce(function(s,e){return s+(e[1].rpe||5);},0)/last7.length;
          var norm=Math.min(1,load/250);
          var col=norm<0.3?GR:norm<0.55?"#F59E0B":norm<0.8?OR:"#EF4444";
          var lbl=norm<0.3?"Fraîcheur":norm<0.55?"Charge normale":norm<0.8?"Charge élevée":"Surcharge";
          return(
            <div className="bg-surf border border-bord rounded-2xl p-4 mb-3.5">
              <div className="text-[12px] font-semibold text-mut uppercase tracking-[0.5px] mb-3">Charge d'entraînement · 7 jours</div>
              <div className="flex items-center gap-3.5 mb-2.5">
                <div className="flex-1"><div className="h-2 rounded bg-surf2 overflow-hidden"><div className="h-full rounded transition-all duration-500" style={{width:Math.round(norm*100)+"%",background:"linear-gradient(90deg,"+GR+","+col+")"}}/></div></div>
                <div className="text-[13px] font-bold shrink-0 min-w-[80px] text-right" style={{color:col}}>{lbl}</div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-surf2 rounded-[10px] p-2.5 text-center"><div className="text-[16px] font-bold" style={{color:OR}}>{Math.round(load)}</div><div className="text-[10px] text-mut mt-[3px]">Charge (UA)</div></div>
                <div className="flex-1 bg-surf2 rounded-[10px] p-2.5 text-center"><div className="text-[16px] font-bold text-info">{avgRpe.toFixed(1)}</div><div className="text-[10px] text-mut mt-[3px]">RPE moyen</div></div>
                <div className="flex-1 bg-surf2 rounded-[10px] p-2.5 text-center"><div className="text-[16px] font-bold text-success">{last7.length}</div><div className="text-[10px] text-mut mt-[3px]">Séances</div></div>
              </div>
            </div>
          );
        })()}

        {!p.stravaProfile?(
          <a href={stravaAuthUrl()}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl mb-3.5 no-underline"
            style={{background:"#FC4C02",border:"none"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-white">Connecter Strava</div>
              <div className="text-[11px]" style={{color:"rgba(255,255,255,0.8)"}}>Importe tes courses automatiquement</div>
            </div>
            <div className="text-white text-[18px]">›</div>
          </a>
        ):(
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3.5 bg-surf border border-bord">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:"#FC4C02"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-txt">Strava connecté{p.stravaProfile.athleteName?" · "+p.stravaProfile.athleteName:""}</div>
            </div>
            <button onClick={p.onStravaSync}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer font-[inherit]"
              style={{background:"#FC4C02"+"22",color:"#FC4C02"}}>
              🔄 Sync
            </button>
          </div>
        )}

        <div className="bg-surf border border-bord rounded-2xl overflow-hidden mb-3.5">
          <div className="px-4 py-3.5 border-b border-bord flex justify-between items-center">
            <div className="text-[13px] font-bold text-txt">Mes sorties</div>
            <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} className="text-[11px] font-bold bg-transparent border-none cursor-pointer font-[inherit]" style={{color:OR}}>Journal complet →</button>
          </div>
          <div className="px-4 py-3 border-b border-bord">
            {planLevel(p.profile)>=1?(
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] cursor-pointer"
                style={{background:BL+"12",border:"1px solid "+BL+"33"}}>
                <span className="text-[16px]">📎</span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold" style={{color:BL}}>Importer un tracé GPX</div>
                  <div className="text-[11px] text-mut mt-[1px]">Garmin, Polar, Wahoo…</div>
                </div>
                <span className="text-[12px] font-bold" style={{color:BL}}>+</span>
                <input type="file" accept=".gpx" className="hidden" onChange={function(e){
                  var file=e.target.files&&e.target.files[0];if(!file)return;
                  var reader=new FileReader();
                  reader.onload=function(ev){
                    var track=parseGpx(ev.target.result);
                    if(track.length>1){var km=calcTrackKm(track);var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;saveTrack({track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):""});}
                  };reader.readAsText(file);e.target.value="";
                }}/>
              </label>
            ):(
              <div onClick={function(){setShowGpxUpgrade(true);}} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] cursor-pointer"
                style={{background:SURF2,border:"1px solid "+BORD}}>
                <span className="text-[16px]">🔒</span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-mut">Importer un tracé GPX</div>
                  <div className="text-[11px] text-mut mt-[1px]">Garmin, Polar, Wahoo…</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-[2px] rounded-[6px]" style={{color:BL,background:BL+"18"}}>Essential</span>
              </div>
            )}
          </div>
          {lastTracked&&(
            <div className="px-4 py-3 border-b border-bord">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-mut font-semibold uppercase tracking-[0.5px]">Dernière sortie tracée</div>
                <div className="text-[11px] text-sub">{fmtDate(new Date(lastTracked[0]))} · {lastTracked[1].km} km</div>
              </div>
              <RunMap track={lastTracked[1].track} height={160}/>
              {lastTracked[1].min&&<div className="mt-1.5 text-[11px] text-sub text-center">Durée : {lastTracked[1].min} min · Allure : {fmtPaceSec((parseFloat(lastTracked[1].min)*60)/(parseFloat(lastTracked[1].km)||1))} /km</div>}
            </div>
          )}
          {recent.length===0?(
            <div className="px-4 py-6 text-center">
              <div className="text-[13px] text-sub mb-2.5">Aucune sortie enregistrée</div>
              <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} className="px-5 py-2.5 rounded-[20px] text-white text-[12px] font-bold cursor-pointer border-none font-[inherit]" style={{background:OR}}>Enregistrer ma première sortie</button>
            </div>
          ):(
            recent.map(function(e,i){
              var d=new Date(e[0]);var data=e[1];
              return(
                <div key={i} onClick={function(){p.onOpenJournal&&p.onOpenJournal();}}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                  style={{borderBottom:i<recent.length-1?"1px solid "+BORD:"none"}}>
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-extrabold"
                    style={{background:OR+"18",border:"1px solid "+OR+"33",color:OR}}>
                    {Math.round(data.km||0)}<span className="text-[8px] font-medium ml-[1px]">km</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-txt">{data.km||0} km{data.min?" · "+data.min+" min":""}</div>
                    <div className="text-[11px] text-mut mt-0.5">{d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()}{data.rpe?" · RPE "+data.rpe:""}</div>
                  </div>
                  {data.feel!=null&&<div className="text-[18px]">{[..."😤😓😐🙂💪"][data.feel]||""}</div>}
                  <div className="text-[14px] text-mut">›</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    {showGpxUpgrade&&<UpgradeModal feature="Import GPX" minPlanLabel="Essential" minPlanColor={BL} onClose={function(){setShowGpxUpgrade(false);}} onUpgrade={function(){setShowGpxUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
