import { useState, useEffect } from "react";
import { SURF2, BORD, TXT, MUT, OR, GR, BL, RE } from "../data/constants.js";
import { MONTHS_F, WDAYS } from "../data/constants.js";
import { getToday, fmtDate } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { parseGpx, calcTrackKm, RunMap, GpsTrackerModal } from "../components/gps.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card, Stat } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

var inputSt={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"};

export function JournalScreen(p){
  var [month,setMonth]=useState(new Date());
  var entries=p.entries||{};
  function setEntries(fn){p.onSetEntries&&p.onSetEntries(fn);}
  var [sel,setSel]=useState(null);
  var [form,setForm]=useState({done:false,km:"",min:"",feel:null,note:""});
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
  function openDay(d,defaultKm){var k=d.toDateString();var e=entries[k]||{};setSel({date:d,key:k});setForm({done:!!e.done,km:e.km||(defaultKm!=null?String(defaultKm):""),min:e.min||"",feel:e.feel!=null?e.feel:null,rpe:e.rpe||5,note:e.note||"",track:e.track||null});}
  useEffect(function(){if(p.preselect){openDay(p.preselect.date,p.preselect.km);p.onClearPreselect&&p.onClearPreselect();}},[]);
  function save(){var was=!entries[sel.key]||!entries[sel.key].done;setEntries(function(prev){return Object.assign({},prev,{[sel.key]:Object.assign({},form)});});if(form.done&&was&&p.onAddSession)p.onAddSession(parseFloat(form.km)||5);setSel(null);}
  var feels=["😤","😓","😐","🙂","💪"];
  var rpeColor=function(r){return r<=3?GR:r<=6?"#F59E0B":r<=8?OR:RE;};
  return(
    <><div><LogoBar/>
      <div className="px-4 pt-5">
        <div className="text-[26px] font-extrabold text-txt tracking-[-0.4px] mb-4">Journal</div>
        <Card style={{marginBottom:14}}>
          <div className="flex px-[18px] py-3.5">
            <Stat value={doneE.length} label="séances" color={OR}/>
            <div className="w-px bg-bord"/>
            <Stat value={Math.round(totalKm)+" km"} label="ce mois" color={BL}/>
          </div>
        </Card>
        <Card style={{padding:"18px 16px",marginBottom:16}}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={function(){setMonth(new Date(y,mo-1,1));}}
              className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-txt text-base"
              style={{background:SURF2,border:"1px solid "+BORD}}>‹</button>
            <div className="text-[15px] font-semibold text-txt">{MONTHS_F[mo]} {y}</div>
            <button onClick={function(){setMonth(new Date(y,mo+1,1));}}
              className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-txt text-base"
              style={{background:SURF2,border:"1px solid "+BORD}}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WDAYS.map(function(d,i){return <div key={i} className="text-center text-[11px] text-mut pb-1.5 font-medium">{d}</div>;})}
            {cells.map(function(date,i){
              if(!date)return <div key={i}/>;
              var k=date.toDateString();var e=entries[k];var planned=hasSess(date);
              var _td=getToday();var isToday=date.toDateString()===_td.toDateString();var isPast=date<_td;
              var bg="transparent",textColor,fw=400;
              if(e&&e.done){bg=OR;textColor="#fff";fw=700;}
              else if(planned&&isPast){bg=RE+"33";textColor=RE;}
              else if(planned){bg=OR+"22";textColor=OR;fw=600;}
              else{textColor="#a0a0a0";}
              return <div key={i} onClick={function(){openDay(date);}} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:fw,background:bg,outline:isToday?"2px solid "+OR:"none",outlineOffset:1,color:textColor,cursor:"pointer"}}>{date.getDate()}</div>;
            })}
          </div>
        </Card>
        {sel?(
          <div className="fixed inset-0 bg-black/75 z-[200] flex items-end justify-center" onClick={function(e){if(e.target===e.currentTarget)setSel(null);}}>
            <div className="bg-surf rounded-t-[20px] w-full max-w-[430px] px-6 pb-9 pt-6 anim-slideUp max-h-[85vh] overflow-y-auto">
              <div className="w-10 h-1 rounded bg-bord mx-auto mb-4"/>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[18px] font-bold text-txt">{fmtDate(sel.date)}</div>
                <button onClick={function(){setSel(null);}} className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer text-[16px] shrink-0"
                  style={{background:SURF2,border:"1px solid "+BORD,color:MUT}}>✕</button>
              </div>
              <div onClick={function(){setForm(function(f){return Object.assign({},f,{done:!f.done});});}}
                className="flex justify-between items-center px-4 py-[18px] rounded-2xl cursor-pointer mb-4 transition-all"
                style={{border:"2px solid "+(form.done?OR:BORD),background:form.done?"linear-gradient(135deg,"+OR+"22,"+OR+"08)":SURF2}}>
                <div>
                  <div className="text-[15px] font-bold" style={{color:form.done?OR:TXT}}>{form.done?"✅ Séance accomplie !":"Marquer comme accomplie"}</div>
                  <div className="text-[11px] mt-[3px]" style={{color:form.done?OR+"aa":MUT}}>{form.done?"Bravo, continue comme ça !":"Coche ici une fois ta séance terminée"}</div>
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-base shrink-0 transition-all"
                  style={{background:form.done?OR:"transparent",border:"2px solid "+(form.done?OR:BORD)}}>{form.done?"✓":""}</div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <div>
                  <label className="text-[12px] text-mut block mb-1.5">Distance (km)</label>
                  <input value={form.km} onChange={function(e){setForm(function(f){return Object.assign({},f,{km:e.target.value});});}} type="number" placeholder="12" style={inputSt}/>
                </div>
                <div>
                  <label className="text-[12px] text-mut block mb-1.5">Durée (min)</label>
                  <input value={form.min} onChange={function(e){setForm(function(f){return Object.assign({},f,{min:e.target.value});});}} type="number" placeholder="60" style={inputSt}/>
                </div>
              </div>
              {planLevel(p.profile)>=1?(
                <label className="flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-[10px] font-semibold text-[12px] cursor-pointer mb-3.5"
                  style={{background:BL+"18",border:"1px solid "+BL+"44",color:BL}}>
                  📎 Importer un tracé GPX (Garmin, Polar…)
                  <input type="file" accept=".gpx" className="hidden" onChange={function(e){
                    var file=e.target.files&&e.target.files[0];if(!file)return;
                    var reader=new FileReader();
                    reader.onload=function(ev){
                      var track=parseGpx(ev.target.result);
                      if(track.length>0){
                        var km=calcTrackKm(track);
                        var minDur=track[0].ts&&track[track.length-1].ts?Math.round((track[track.length-1].ts-track[0].ts)/60000):null;
                        setForm(function(f){return Object.assign({},f,{track:track,km:String(km.toFixed(2)),min:minDur?String(minDur):f.min,done:true});});
                      }
                    };reader.readAsText(file);e.target.value="";
                  }}/>
                </label>
              ):(
                <div onClick={function(){setShowGpxUpgradeJ(true);}} className="flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-[10px] text-[12px] font-semibold cursor-pointer mb-3.5"
                  style={{background:SURF2,border:"1px solid "+BORD,color:MUT}}>
                  🔒 Importer un tracé GPX <span className="text-[10px] font-bold ml-1" style={{color:BL}}>Essential+</span>
                </div>
              )}
              {form.track&&form.track.length>1&&<div className="mb-3.5"><RunMap track={form.track} height={160}/></div>}
              <div className="mb-3.5">
                <label className="text-[12px] text-mut block mb-2.5">Ressenti</label>
                <div className="flex gap-2">
                  {feels.map(function(e,i){return <div key={i} onClick={function(){setForm(function(f){return Object.assign({},f,{feel:i});});}}
                    className="flex-1 text-center py-2.5 rounded-[10px] cursor-pointer text-[20px]"
                    style={{border:"1.5px solid "+(form.feel===i?OR:BORD),background:form.feel===i?OR+"15":SURF2}}>{e}</div>;})}
                </div>
              </div>
              <div className="mb-3.5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[12px] text-mut">Effort ressenti (RPE)</label>
                  <span className="text-[13px] font-bold" style={{color:rpeColor(form.rpe||5)}}>{form.rpe||5}<span className="text-[10px] text-mut font-normal">/10</span></span>
                </div>
                <input type="range" min={1} max={10} value={form.rpe||5} onChange={function(e){setForm(function(f){return Object.assign({},f,{rpe:parseInt(e.target.value)});});}} className="w-full" style={{accentColor:OR}}/>
                <div className="flex justify-between mt-[3px]">
                  <span className="text-[10px] text-mut">Facile</span>
                  <span className="text-[10px] text-mut">Maximal</span>
                </div>
              </div>
              <div className="mb-5">
                <label className="text-[12px] text-mut block mb-1.5">Note</label>
                <textarea value={form.note} onChange={function(e){setForm(function(f){return Object.assign({},f,{note:e.target.value});});}} placeholder="Comment s'est passée la sortie ?"
                  className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit] min-h-[80px] resize-none"
                  style={{background:SURF2,border:"1px solid "+BORD,color:TXT}}/>
              </div>
              <div className="flex gap-2.5">
                <Btn label="Annuler" onClick={function(){setSel(null);}} variant="ghost" style={{flex:1}}/>
                <Btn label="Enregistrer" onClick={save} style={{flex:2}}/>
              </div>
            </div>
          </div>
        ):null}
      </div>
    </div>
    {showGps&&<GpsTrackerModal onClose={function(){setShowGps(false);}} onSave={function(res){setForm(function(f){return Object.assign({},f,{track:res.track,km:res.km,min:res.min,done:true});});setShowGps(false);}}/>}
    {showGpxUpgradeJ&&<UpgradeModal feature="Import GPX" minPlanLabel="Essential" minPlanColor={BL} onClose={function(){setShowGpxUpgradeJ(false);}} onUpgrade={function(){setShowGpxUpgradeJ(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </>
  );
}
