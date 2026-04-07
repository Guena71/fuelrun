import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, OR, GR, BL } from "../data/constants.js";
import { weeksUntil } from "../utils/date.js";
import { regUrl } from "../data/races.js";
import { ls, lsSet } from "../utils/storage.js";
import { useRaces, suggestRaces, haversineKm } from "../utils/races.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Chip, Card } from "../components/ui.jsx";

var CITY_COORDS={
  "paris":{lat:48.86,lng:2.35},"lyon":{lat:45.75,lng:4.83},"marseille":{lat:43.30,lng:5.37},
  "bordeaux":{lat:44.84,lng:-0.58},"nantes":{lat:47.22,lng:-1.55},"toulouse":{lat:43.60,lng:1.44},
  "nice":{lat:43.70,lng:7.27},"strasbourg":{lat:48.57,lng:7.75},"lille":{lat:50.63,lng:3.06},
  "rennes":{lat:48.11,lng:-1.68},"annecy":{lat:45.90,lng:6.12},"chamonix":{lat:45.92,lng:6.87},
  "grenoble":{lat:45.19,lng:5.72},"montpellier":{lat:43.61,lng:3.88},"tours":{lat:47.39,lng:0.69},
  "dijon":{lat:47.32,lng:5.04},"reims":{lat:49.25,lng:4.03},"metz":{lat:49.12,lng:6.18},
  "brussels":{lat:50.85,lng:4.35},"london":{lat:51.50,lng:-0.12},"berlin":{lat:52.52,lng:13.40},
  "madrid":{lat:40.42,lng:-3.70},"barcelona":{lat:41.39,lng:2.15},"rome":{lat:41.90,lng:12.49},
  "amsterdam":{lat:52.37,lng:4.90},"zurich":{lat:47.38,lng:8.54},"geneve":{lat:46.20,lng:6.15}
};

var inputStyle={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"};

export function CoursesScreen(p){
  var races=useRaces();
  var [tab,setTab]=useState(function(){return ls("fr_courses_tab","route");});
  function setTabPersist(v){lsSet("fr_courses_tab",v);setTab(v);}
  var [search,setSearch]=useState("");var [custom,setCustom]=useState([]);var [showAdd,setShowAdd]=useState(false);
  var [n,setN]=useState("");var [d,setD]=useState("");var [dt,setDt]=useState("");var [tp,setTp]=useState(function(){return ls("fr_courses_tab","route");});
  var [userPos,setUserPos]=useState(null);var [locLoading,setLocLoading]=useState(false);var [locError,setLocError]=useState(null);var [nearMe,setNearMe]=useState(false);
  var [showCityFallback,setShowCityFallback]=useState(false);var [cityInput,setCityInput]=useState("");

  function applyCity(){
    var key=cityInput.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    var coords=CITY_COORDS[key];
    if(!coords){setLocError("Ville non reconnue, essaie une grande ville proche");return;}
    setUserPos(coords);setNearMe(true);setShowCityFallback(false);setLocError(null);
  }
  function requestLocation(){
    if(!navigator.geolocation){setShowCityFallback(true);return;}
    setLocLoading(true);setLocError(null);setShowCityFallback(false);
    navigator.geolocation.getCurrentPosition(
      function(pos){setUserPos({lat:pos.coords.latitude,lng:pos.coords.longitude});setLocLoading(false);setNearMe(true);},
      function(err){setLocLoading(false);if(err.code===1)setLocError("Permission refusée");else setLocError("Géolocalisation indisponible");setShowCityFallback(true);},
      {timeout:8000,maximumAge:60000}
    );
  }
  var all=custom.concat(races);
  var filtered=all.filter(function(r){if(r.type!==tab)return false;if(search&&!r.name.toLowerCase().includes(search.toLowerCase())&&!r.city.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  var sorted=filtered.slice().sort(function(a,b){
    if(a.custom&&!b.custom)return -1;if(!a.custom&&b.custom)return 1;
    if(nearMe&&userPos)return haversineKm(userPos.lat,userPos.lng,a.lat,a.lng)-haversineKm(userPos.lat,userPos.lng,b.lat,b.lng);
    return new Date(a.date)-new Date(b.date);
  });
  function addCustom(){if(!n||!d||!dt)return;var r={id:Date.now(),name:n,dist:parseFloat(d),type:tp,date:dt,city:"Personnalisé",custom:true};setCustom(function(prev){return [r].concat(prev);});setTabPersist(tp);p.onAddCustom?p.onAddCustom(r):p.setRace(r);setShowAdd(false);setN("");setD("");setDt("");}

  return(
    <div>
      <LogoBar/>
      <div className="px-4 pt-5">
        <div className="text-[26px] font-extrabold text-txt tracking-[-0.4px] mb-4">Courses</div>

        {/* Suggestions personnalisées */}
        {(function(){
          var sugg=suggestRaces(p.profile,races,tab);
          if(!sugg.length)return null;
          return(
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="text-[13px] font-bold text-txt">Pour toi</div>
                <div className="px-2 py-[2px] rounded-[20px]" style={{background:OR+"22",border:"1px solid "+OR+"44"}}>
                  <span className="text-[10px] text-brand font-bold">Basé sur ton profil</span>
                </div>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 touch-pan-x">
                {sugg.map(function(r){
                  var on=p.race&&p.race.id===r.id;var col=r.type==="trail"?GR:BL;var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(on?null:r);}}
                      className="shrink-0 w-40 rounded-2xl p-3.5 cursor-pointer relative overflow-hidden"
                      style={{background:on?col+"18":SURF,border:"1.5px solid "+(on?col:BORD)}}>
                      {r.star&&<div className="absolute top-2 right-2 text-[11px]">⭐</div>}
                      <div className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1.5" style={{color:col}}>{r.type==="trail"?"Trail":"Route"}</div>
                      <div className="text-[13px] font-bold text-txt leading-tight mb-1">{r.name}</div>
                      <div className="text-[12px] text-sub mb-2">{r.city}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-extrabold" style={{color:col}}>{r.dist}<span className="text-[10px] font-medium ml-0.5">km</span></span>
                        <span className="text-[10px] text-mut">{wks} sem.</span>
                      </div>
                      <a href={regUrl(r)} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}}
                        className="block text-center text-[10px] font-bold rounded-[6px] px-1.5 py-1 no-underline"
                        style={{color:col,background:col+"18",border:"1px solid "+col+"33"}}>S'inscrire →</a>
                      {on&&<div className="absolute bottom-2.5 right-2.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{background:col}}>✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher une course ou une ville…"
          className="w-full bg-surf2 border border-bord rounded-xl px-4 py-3 text-sm outline-none font-[inherit] mb-3 text-txt"/>
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <Chip label="Route" active={tab==="route"} onClick={function(){setTabPersist("route");setTp("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTabPersist("trail");setTp("trail");}}/>
          <button onClick={function(){if(nearMe){setNearMe(false);setShowCityFallback(false);}else{requestLocation();}}}
            className="flex items-center gap-[5px] rounded-[20px] px-3.5 py-[7px] text-[13px] font-semibold cursor-pointer font-[inherit]"
            style={{background:nearMe?OR+"22":"none",border:"1px solid "+(nearMe?OR:BORD),color:nearMe?OR:SUB}}>
            {locLoading?"⏳":"📍"}{locLoading?"Localisation...":nearMe?"Près de moi ✓":"Près de moi"}
          </button>
          {locError&&<span className="text-[11px] text-danger">{locError}</span>}
          <button onClick={function(){setShowAdd(true);}} className="ml-auto bg-transparent border border-bord rounded-[20px] px-3.5 py-[7px] text-info text-[13px] font-semibold cursor-pointer font-[inherit]">+ Ajouter</button>
        </div>

        {showCityFallback&&(
          <div className="flex gap-2 mb-3 items-center">
            <input value={cityInput} onChange={function(e){setCityInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")applyCity();}} placeholder="Ta ville (ex: Lyon, Paris…)"
              className="flex-1 rounded-[10px] px-3 py-2.5 text-[13px] outline-none font-[inherit] text-txt"
              style={{background:SURF2,border:"1px solid "+OR+"55"}}/>
            <button onClick={applyCity} className="bg-brand border-none rounded-[10px] px-3.5 py-2.5 text-white text-[13px] font-semibold cursor-pointer font-[inherit]">OK</button>
            <button onClick={function(){setShowCityFallback(false);setLocError(null);}} className="bg-transparent border border-bord rounded-[10px] px-3 py-2.5 text-mut text-[13px] cursor-pointer font-[inherit]">✕</button>
          </div>
        )}

        {showAdd&&(
          <Card style={{padding:16,marginBottom:14}}>
            <div className="text-sm font-semibold text-txt mb-3">Ma course</div>
            <input value={n} onChange={function(e){setN(e.target.value);}} placeholder="Nom" className="mb-2" style={inputStyle}/>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={d} onChange={function(e){setD(e.target.value);}} type="number" placeholder="Distance km" style={inputStyle}/>
              <input value={dt} onChange={function(e){setDt(e.target.value);}} type="date" style={Object.assign({},inputStyle,{colorScheme:"dark"})}/>
            </div>
            <div className="flex gap-2 mb-3">
              <Chip label="Route" active={tp==="route"} onClick={function(){setTp("route");}}/>
              <Chip label="Trail" active={tp==="trail"} color={GR} onClick={function(){setTp("trail");}}/>
            </div>
            <div className="flex gap-2">
              <Btn label="Ajouter" onClick={addCustom} size="sm" disabled={!n||!d||!dt} style={{flex:1}}/>
              <Btn label="Annuler" onClick={function(){setShowAdd(false);}} variant="ghost" size="sm" style={{flex:1}}/>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-2 pb-6">
          {sorted.map(function(r){
            var on=p.race&&p.race.id===r.id;var wks=weeksUntil(r.date);var col=r.type==="trail"?GR:BL;
            var distFromUser=(nearMe&&userPos&&r.lat!=null)?haversineKm(userPos.lat,userPos.lng,r.lat,r.lng):null;
            return(
              <Card key={r.id} onClick={function(){p.setRace(r);}} style={{cursor:"pointer",borderColor:on?col:BORD,background:on?col+"0f":SURF}}>
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-semibold" style={{color:on?col:TXT}}>{r.name}</span>
                      {r.star&&<span className="text-[11px]">⭐</span>}
                    </div>
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <span className="text-[12px] text-sub">{r.city}</span>
                      <span className="text-[12px] text-mut">·</span>
                      <span className="text-[12px] font-semibold" style={{color:col+"cc"}}>{r.dist} km</span>
                      <span className="text-[12px] text-mut">·</span>
                      <span className="text-[12px]" style={{color:on?col:SUB,fontWeight:on?600:400}}>{wks} sem.</span>
                      {distFromUser!=null&&<><span className="text-[12px] text-mut">·</span><span className="text-[12px] text-brand font-semibold">📍 {distFromUser} km</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {on?<div className="text-base font-bold" style={{color:col}}>✓</div>:<div className="text-lg text-mut">›</div>}
                    {!r.custom&&(
                      <a href={regUrl(r)} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}}
                        className="text-[10px] font-bold rounded-[6px] px-2 py-[3px] no-underline whitespace-nowrap"
                        style={{color:col,background:col+"18",border:"1px solid "+col+"44"}}>S'inscrire →</a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {sorted.length===0&&(
            <div className="text-center py-10">
              <div className="text-sm font-semibold text-txt mb-1.5">Aucune course trouvée</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
