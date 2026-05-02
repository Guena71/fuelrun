import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SURF, SURF2, BORD, TXT, MUT, OR, GR, BL, RE } from "../data/constants.js";
import { MONTHS_F, WDAYS } from "../data/constants.js";
import { getToday, fmtDate } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { parseGpx, calcTrackKm, RunMap, GpsTrackerModal } from "../components/gps.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card, Stat } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

export function JournalScreen(p){
  var navigate=useNavigate();
  var [month,setMonth]=useState(new Date());
  var entries=p.entries||{};
  function setEntries(fn){p.onSetEntries&&p.onSetEntries(fn);}
  var [sel,setSel]=useState(null);
  var [form,setForm]=useState({done:false,km:"",min:"",sec:"",feel:null,note:""});
  var [showGps,setShowGps]=useState(false);
  var [showGpxUpgradeJ,setShowGpxUpgradeJ]=useState(false);
  var y=month.getFullYear();var mo=month.getMonth();
  var dc=new Date(y,mo+1,0).getDate();
  var fd=(function(){var d=new Date(y,mo,1).getDay();return d===0?6:d-1;})();
  var cells=Array(fd).fill(null).concat(Array(dc).fill(0).map(function(_,i){return new Date(y,mo,i+1);}));
  var plan=p.race?buildPlan(p.race,{}):null;
  var planWeeks=getPlanWeeks(plan);
  function hasSess(d){for(var wi=0;wi<planWeeks.length;wi++){for(var si=0;si<planWeeks[wi].sessions.length;si++){var s=planWeeks[wi].sessions[si];if(s.date&&s.date.toDateString()===d.toDateString()&&s.type!=="race")return true;}}return false;}
  var doneE=Object.entries(entries).filter(function(e){return e[1].done;});
  var totalKm=doneE.reduce(function(s,e){return s+(parseFloat(e[1].km)||0);},0);
  function openDay(d,defaultKm){var k=d.toDateString();var e=entries[k]||{};setSel({date:d,key:k});setForm({done:!!e.done,km:e.km||(defaultKm!=null?String(defaultKm):""),min:e.min||"",sec:e.sec||"",feel:e.feel!=null?e.feel:null,rpe:e.rpe||5,note:e.note||"",track:e.track||null});}
  useEffect(function(){if(p.preselect){openDay(p.preselect.date,p.preselect.km);p.onClearPreselect&&p.onClearPreselect();}},[]);
  function save(){var was=!entries[sel.key]||!entries[sel.key].done;setEntries(function(prev){return Object.assign({},prev,{[sel.key]:Object.assign({},form)});});if(form.done&&was&&p.onAddSession)p.onAddSession(parseFloat(form.km)||5);setSel(null);}
  var feels=["😤","😓","😐","🙂","💪"];
  return(
    <><div><LogoBar/>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={function(){navigate("/suivi");}} style={{background:"none",border:"none",color:OR,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",padding:0}}>← Retour</button>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>Journal</div>
        </div>
        <Card style={{marginBottom:14}}><div style={{display:"flex",padding:"14px 18px"}}><Stat value={doneE.length} label="séances" color={OR}/><div style={{width:1,background:BORD}}/><Stat value={Math.round(totalKm)+" km"} label="ce mois" color={BL}/></div></Card>
        <Card style={{padding:"18px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <button onClick={function(){setMonth(new Date(y,mo-1,1));}} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <div style={{fontSize:15,fontWeight:600,color:TXT}}>{MONTHS_F[mo]} {y}</div>
            <button onClick={function(){setMonth(new Date(y,mo+1,1));}} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,width:32,height:32,cursor:"pointer",color:TXT,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {WDAYS.map(function(d,i){return <div key={i} style={{textAlign:"center",fontSize:11,color:MUT,paddingBottom:6,fontWeight:500}}>{d}</div>;})}
            {cells.map(function(date,i){
              if(!date)return <div key={i}/>;
              var k=date.toDateString();var e=entries[k];var planned=hasSess(date);
              var _td=getToday();var isToday=date.toDateString()===_td.toDateString();var isPast=date<_td;
              var bg="transparent",textColor=MUT,fw=400;
              if(e&&e.done){bg=OR;textColor="#fff";fw=700;}
              else if(planned&&isPast){bg=RE+"33";textColor=RE;}
              else if(planned){bg=OR+"22";textColor=OR;fw=600;}
              return <div key={i} onClick={function(){openDay(date);}} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:fw,background:bg,outline:isToday?"2px solid "+OR:"none",outlineOffset:1,color:textColor,cursor:"pointer"}}>{date.getDate()}</div>;
            })}
          </div>
        </Card>
        {sel?(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(e){if(e.target===e.currentTarget)setSel(null);}}>
            <div style={{background:SURF,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 24px 36px",animation:"slideUp .3s ease",maxHeight:"85vh",overflowY:"auto"}}>
              <div style={{width:40,height:4,borderRadius:2,background:BORD,margin:"0 auto 16px"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontSize:18,fontWeight:700,color:TXT}}>{fmtDate(sel.date)}</div>
                <button onClick={function(){setSel(null);}} style={{width:32,height:32,borderRadius:9,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:MUT,flexShrink:0}}>✕</button>
              </div>
              <div onClick={function(){setForm(function(f){return Object.assign({},f,{done:!f.done});});}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 16px",borderRadius:14,border:"2px solid "+(form.done?OR:BORD),background:form.done?"linear-gradient(135deg,"+OR+"22,"+OR+"08)":SURF2,cursor:"pointer",marginBottom:16,transition:"all .2s"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:form.done?OR:TXT}}>{form.done?"✅ Séance accomplie !":"Marquer comme accomplie"}</div>
                  <div style={{fontSize:11,color:form.done?OR+"aa":MUT,marginTop:3}}>{form.done?"Bravo, continue comme ça !":"Coche ici une fois ta séance terminée"}</div>
                </div>
                <div style={{width:28,height:28,borderRadius:8,background:form.done?OR:"transparent",border:"2px solid "+(form.done?OR:BORD),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,flexShrink:0,transition:"all .2s"}}>{form.done?"✓":""}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Distance (km)</label><input value={form.km} onChange={function(e){setForm(function(f){return Object.assign({},f,{km:e.target.value});});}} type="number" placeholder="12" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/></div>
                <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Durée (min)</label><input value={form.min} onChange={function(e){setForm(function(f){return Object.assign({},f,{min:e.target.value});});}} type="number" placeholder="60" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/></div>
              </div>
              {planLevel(p.profile)>=1?(
                <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:10,background:BL+"18",border:"1px solid "+BL+"44",color:BL,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>
                  📎 Importer un tracé GPX (Garmin, Polar…)
                  <input type="file" accept=".gpx" style={{display:"none"}} onChange={function(e){
                    var file=e.target.files&&e.target.files[0];if(!file)return;
                    var reader=new FileReader();
                    reader.onload=function(ev){try{
                      var track=parseGpx(ev.target.result);
                      if(track.length>0){
                        var km=calcTrackKm(track);
                        var secDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/1000):null;
                        var minDur=secDur?Math.round(secDur/60):null;
                        setForm(function(f){return Object.assign({},f,{track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):f.min,sec:secDur?String(secDur):f.sec,done:true});});
                      }
                    }catch(e){alert("Fichier GPX invalide ou corrompu.");}}
                    ;reader.readAsText(file);e.target.value="";
                  }}/>
                </label>
              ):(
                <div onClick={function(){setShowGpxUpgradeJ(true);}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:10,background:SURF2,border:"1px solid "+BORD,color:MUT,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:14}}>
                  🔒 Importer un tracé GPX <span style={{fontSize:10,color:BL,fontWeight:700,marginLeft:4}}>Essentiel+</span>
                </div>
              )}
              {form.track&&form.track.length>1&&<div style={{marginBottom:14}}><RunMap track={form.track} height={160}/></div>}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:10}}>Ressenti</label>
                <div style={{display:"flex",gap:8}}>{feels.map(function(e,i){return <div key={i} onClick={function(){setForm(function(f){return Object.assign({},f,{feel:i});});}} style={{flex:1,textAlign:"center",padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(form.feel===i?OR:BORD),background:form.feel===i?OR+"15":SURF2,cursor:"pointer",fontSize:20}}>{e}</div>;})} </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <label style={{fontSize:12,color:MUT}}>Effort ressenti</label>
                  <span style={{fontSize:13,fontWeight:700,color:(function(){var r=form.rpe||5;return r<=3?GR:r<=6?"#F59E0B":r<=8?OR:RE;})()}}>{form.rpe||5}<span style={{fontSize:10,color:MUT,fontWeight:400}}>/10</span></span>
                </div>
                <input type="range" min={1} max={10} value={form.rpe||5} onChange={function(e){setForm(function(f){return Object.assign({},f,{rpe:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:OR}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:10,color:MUT}}>Facile</span>
                  <span style={{fontSize:10,color:MUT}}>Maximal</span>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Note</label>
                <textarea value={form.note} onChange={function(e){setForm(function(f){return Object.assign({},f,{note:e.target.value});});}} placeholder="Comment s'est passée la sortie ?" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",minHeight:80,resize:"none",fontFamily:"inherit"}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn label="Annuler" onClick={function(){setSel(null);}} variant="ghost" style={{flex:1}}/>
                <Btn label="Enregistrer" onClick={save} style={{flex:2}}/>
              </div>
            </div>
          </div>
        ):null}
      </div>
    </div>
    {showGps&&<GpsTrackerModal onClose={function(){setShowGps(false);}} onSave={function(res){setForm(function(f){return Object.assign({},f,{track:res.track,km:res.km,min:res.min,sec:res.sec||"",done:true});});setShowGps(false);}}/>}
    {showGpxUpgradeJ&&<UpgradeModal feature="Import GPX" minPlanLabel="Essentiel" minPlanColor={BL} onClose={function(){setShowGpxUpgradeJ(false);}} onUpgrade={function(){setShowGpxUpgradeJ(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
