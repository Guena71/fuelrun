import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
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
      <div style={{padding:"20px 16px 80px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>Suivi</div>
          <button onClick={share} style={{padding:"6px 14px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44",color:OR,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Partager</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:MUT,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Cette semaine</div>
            <div style={{fontSize:28,fontWeight:800,color:OR,lineHeight:1}}>{thisWeekKm}<span style={{fontSize:13,color:MUT,fontWeight:400}}> km</span></div>
            <div style={{marginTop:8,height:4,borderRadius:2,background:SURF2,overflow:"hidden"}}>
              <div style={{width:Math.min(100,Math.round(thisWeekKm/targetKm*100))+"%",height:"100%",background:OR,borderRadius:2,transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:10,color:MUT,marginTop:4}}>Objectif : {targetKm} km</div>
          </div>
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:MUT,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Total</div>
            <div style={{fontSize:28,fontWeight:800,color:BL,lineHeight:1}}>{p.stats.km?Math.round(p.stats.km):0}<span style={{fontSize:13,color:MUT,fontWeight:400}}> km</span></div>
            <div style={{fontSize:10,color:MUT,marginTop:8}}>{p.stats.sessions||0} séance{p.stats.sessions!==1?"s":""} · {p.stats.streak||0}j streak</div>
          </div>
        </div>

        {(function(){
          var maxKm=Math.max.apply(null,weeks.map(function(wk){return wk.km||0;}));
          if(maxKm===0)return null;
          return(
            <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:14}}>Volume · 8 semaines</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
                {weeks.map(function(wk,i){
                  var barH=Math.max(4,Math.round((wk.km/maxKm)*60));
                  var col=wk.current?OR:wk.km>=targetKm?GR:SURF2;
                  var border=wk.current?"2px solid "+OR:wk.km>=targetKm?"2px solid "+GR:"1px solid "+BORD;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      {wk.km>0&&<div style={{fontSize:8,color:wk.current?OR:MUT,fontWeight:wk.current?700:400,lineHeight:1}}>{wk.km}</div>}
                      <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}>
                        <div style={{width:"100%",height:barH,background:col,border:border,borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
                      </div>
                      <div style={{fontSize:8,color:wk.current?OR:MUT,fontWeight:wk.current?600:400}}>{wk.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:12,marginTop:10}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:OR}}/><span style={{fontSize:10,color:MUT}}>Semaine en cours</span></div>
                <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:GR}}/><span style={{fontSize:10,color:MUT}}>Objectif atteint</span></div>
              </div>
            </div>
          );
        })()}

        <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{width:"100%",marginBottom:14,padding:"14px 18px",borderRadius:14,background:"linear-gradient(135deg,"+OR+"22,"+OR+"0a)",border:"1.5px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:OR+"22",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📓</div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:14,fontWeight:700,color:TXT}}>Journal d'entraînement</div>
              <div style={{fontSize:12,color:SUB,marginTop:2}}>Calendrier · Ressenti · RPE · Notes</div>
            </div>
          </div>
          <div style={{fontSize:20,color:OR,fontWeight:300}}>›</div>
        </button>

        {race&&(
          <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:TXT}}>{race.name}</div>
              <div style={{fontSize:12,color:OR,fontWeight:700}}>{raceWeeks} sem.</div>
            </div>
            <div style={{height:6,borderRadius:3,background:SURF2,overflow:"hidden",marginBottom:6}}>
              <div style={{width:raceProgress+"%",height:"100%",background:"linear-gradient(90deg,"+OR+","+GR+")",borderRadius:3,transition:"width .5s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:MUT}}>Début</span>
              <span style={{fontSize:10,color:OR,fontWeight:600}}>{raceProgress}% accompli</span>
              <span style={{fontSize:10,color:MUT}}>{race.date}</span>
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
            <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Charge d'entraînement · 7 jours</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                <div style={{flex:1}}><div style={{height:8,borderRadius:4,background:SURF2,overflow:"hidden"}}><div style={{width:Math.round(norm*100)+"%",height:"100%",background:"linear-gradient(90deg,"+GR+","+col+")",borderRadius:4,transition:"width .5s"}}/></div></div>
                <div style={{fontSize:13,fontWeight:700,color:col,flexShrink:0,minWidth:80,textAlign:"right"}}>{lbl}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:OR}}>{Math.round(load)}</div><div style={{fontSize:10,color:MUT,marginTop:3}}>Charge (UA)</div></div>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:BL}}>{avgRpe.toFixed(1)}</div><div style={{fontSize:10,color:MUT,marginTop:3}}>RPE moyen</div></div>
                <div style={{flex:1,background:SURF2,borderRadius:10,padding:"10px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:GR}}>{last7.length}</div><div style={{fontSize:10,color:MUT,marginTop:3}}>Séances</div></div>
              </div>
            </div>
          );
        })()}

        <div style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,overflow:"hidden",marginBottom:14}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid "+BORD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:TXT}}>Mes sorties</div>
            <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{fontSize:11,color:OR,fontWeight:700,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Journal complet →</button>
          </div>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+BORD}}>
            {planLevel(p.profile)>=1?(
              <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:BL+"12",border:"1px solid "+BL+"33",cursor:"pointer"}}>
                <span style={{fontSize:16}}>📎</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:BL}}>Importer un tracé GPX</div>
                  <div style={{fontSize:11,color:MUT,marginTop:1}}>Garmin, Polar, Wahoo…</div>
                </div>
                <span style={{fontSize:12,color:BL,fontWeight:700}}>+</span>
                <input type="file" accept=".gpx" style={{display:"none"}} onChange={function(e){
                  var file=e.target.files&&e.target.files[0];if(!file)return;
                  var reader=new FileReader();
                  reader.onload=function(ev){
                    var track=parseGpx(ev.target.result);
                    if(track.length>1){var km=calcTrackKm(track);var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;saveTrack({track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):""});}
                  };reader.readAsText(file);e.target.value="";
                }}/>
              </label>
            ):(
              <div onClick={function(){setShowGpxUpgrade(true);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:SURF2,border:"1px solid "+BORD,cursor:"pointer"}}>
                <span style={{fontSize:16}}>🔒</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:MUT}}>Importer un tracé GPX</div><div style={{fontSize:11,color:MUT,marginTop:1}}>Garmin, Polar, Wahoo…</div></div>
                <span style={{fontSize:10,fontWeight:700,color:BL,background:BL+"18",padding:"2px 8px",borderRadius:6}}>Essential</span>
              </div>
            )}
          </div>
          {lastTracked&&(
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+BORD}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:11,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Dernière sortie tracée</div>
                <div style={{fontSize:11,color:SUB}}>{fmtDate(new Date(lastTracked[0]))} · {lastTracked[1].km} km</div>
              </div>
              <RunMap track={lastTracked[1].track} height={160}/>
              {lastTracked[1].min&&<div style={{marginTop:6,fontSize:11,color:SUB,textAlign:"center"}}>Durée : {lastTracked[1].min} min · Allure : {fmtPaceSec((parseFloat(lastTracked[1].min)*60)/(parseFloat(lastTracked[1].km)||1))} /km</div>}
            </div>
          )}
          {recent.length===0?(
            <div style={{padding:"24px 16px",textAlign:"center"}}>
              <div style={{fontSize:13,color:SUB,marginBottom:10}}>Aucune sortie enregistrée</div>
              <button onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{padding:"9px 20px",borderRadius:20,background:OR,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Enregistrer ma première sortie</button>
            </div>
          ):(
            recent.map(function(e,i){
              var d=new Date(e[0]);var data=e[1];
              return(
                <div key={i} onClick={function(){p.onOpenJournal&&p.onOpenJournal();}} style={{padding:"12px 16px",borderBottom:i<recent.length-1?"1px solid "+BORD:"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                  <div style={{width:38,height:38,borderRadius:10,background:OR+"18",border:"1px solid "+OR+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,color:OR,fontWeight:800}}>{Math.round(data.km||0)}<span style={{fontSize:8,fontWeight:500,marginLeft:1}}>km</span></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:TXT}}>{data.km||0} km{data.min?" · "+data.min+" min":""}</div>
                    <div style={{fontSize:11,color:MUT,marginTop:2}}>{d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()}{data.rpe?" · RPE "+data.rpe:""}</div>
                  </div>
                  {data.feel!=null&&<div style={{fontSize:18}}>{[..."😤😓😐🙂💪"][data.feel]||""}</div>}
                  <div style={{fontSize:14,color:MUT}}>›</div>
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
