import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, RE } from "../data/constants.js";
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
      function(err){
        setLocLoading(false);
        if(err.code===1){setLocError("Permission refusée");}
        else{setLocError("Géolocalisation indisponible");}
        setShowCityFallback(true);
      },
      {timeout:8000,maximumAge:60000}
    );
  }

  var all=custom.concat(races);
  var filtered=all.filter(function(r){if(r.type!==tab)return false;if(search&&!r.name.toLowerCase().includes(search.toLowerCase())&&!r.city.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  var sorted=filtered.slice().sort(function(a,b){
    if(a.custom&&!b.custom)return -1;
    if(!a.custom&&b.custom)return 1;
    if(nearMe&&userPos){return haversineKm(userPos.lat,userPos.lng,a.lat,a.lng)-haversineKm(userPos.lat,userPos.lng,b.lat,b.lng);}
    return new Date(a.date)-new Date(b.date);
  });
  function addCustom(){if(!n||!d||!dt)return;var r={id:Date.now(),name:n,dist:parseFloat(d),type:tp,date:dt,city:"Personnalisé",custom:true};setCustom(function(prev){return [r].concat(prev);});setTabPersist(tp);p.onAddCustom?p.onAddCustom(r):p.setRace(r);setShowAdd(false);setN("");setD("");setDt("");}
  return(
    <div><LogoBar/>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px",marginBottom:16}}>Courses</div>
        {(function(){
          var sugg=suggestRaces(p.profile,races,tab);
          if(!sugg.length)return null;
          return(
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:TXT}}>Pour toi</div>
                <div style={{padding:"2px 8px",borderRadius:20,background:OR+"22",border:"1px solid "+OR+"44"}}><span style={{fontSize:10,color:OR,fontWeight:700}}>Basé sur ton profil</span></div>
              </div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,touchAction:"pan-x"}}>
                {sugg.map(function(r){
                  var on=p.race&&p.race.id===r.id;
                  var col=r.type==="trail"?GR:BL;
                  var wks=weeksUntil(r.date);
                  return(
                    <div key={r.id} onClick={function(){p.setRace(on?null:r);}} style={{flexShrink:0,width:160,borderRadius:16,background:on?col+"18":SURF,border:"1.5px solid "+(on?col:BORD),padding:"14px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                      {r.star?<div style={{position:"absolute",top:8,right:8,fontSize:11}}>⭐</div>:null}
                      <div style={{fontSize:11,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>{r.type==="trail"?"Trail":"Route"}</div>
                      <div style={{fontSize:13,fontWeight:700,color:TXT,lineHeight:1.3,marginBottom:4}}>{r.name}</div>
                      <div style={{fontSize:12,color:SUB,marginBottom:8}}>{r.city}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:14,fontWeight:800,color:col}}>{r.dist}<span style={{fontSize:10,fontWeight:500,marginLeft:2}}>km</span></span>
                        <span style={{fontSize:10,color:MUT}}>{wks} sem.</span>
                      </div>
                      <a href={regUrl(r)} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{display:"block",textAlign:"center",fontSize:10,fontWeight:700,color:col,background:col+"18",border:"1px solid "+col+"33",borderRadius:6,padding:"4px 6px",textDecoration:"none"}}>S'inscrire →</a>
                      {on?<div style={{position:"absolute",bottom:10,right:10,width:18,height:18,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>✓</div>:null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher une course ou une ville…" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"12px 16px",color:TXT,fontSize:14,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          <Chip label="Route" active={tab==="route"} onClick={function(){setTabPersist("route");setTp("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTabPersist("trail");setTp("trail");}}/>
          <button onClick={function(){if(nearMe){setNearMe(false);setShowCityFallback(false);}else{requestLocation();}}} style={{display:"flex",alignItems:"center",gap:5,background:nearMe?OR+"22":"none",border:"1px solid "+(nearMe?OR:BORD),borderRadius:20,padding:"7px 14px",color:nearMe?OR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {locLoading?"⏳":"📍"}{locLoading?"Localisation...":nearMe?"Près de moi ✓":"Près de moi"}
          </button>
          {locError?<span style={{fontSize:11,color:RE}}>{locError}</span>:null}
          <button onClick={function(){setShowAdd(true);}} style={{marginLeft:"auto",background:"none",border:"1px solid "+BORD,borderRadius:20,padding:"7px 14px",color:BL,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ Ajouter</button>
        </div>
        {showCityFallback?(
          <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
            <input value={cityInput} onChange={function(e){setCityInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")applyCity();}} placeholder="Ta ville (ex: Lyon, Paris…)" style={{flex:1,background:SURF2,border:"1px solid "+OR+"55",borderRadius:10,padding:"10px 12px",color:TXT,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={applyCity} style={{background:OR,border:"none",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
            <button onClick={function(){setShowCityFallback(false);setLocError(null);}} style={{background:"none",border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:MUT,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        ):null}
        {showAdd?(
          <Card style={{padding:16,marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:12}}>Ma course</div>
            <input value={n} onChange={function(e){setN(e.target.value);}} placeholder="Nom" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",marginBottom:8,fontFamily:"inherit"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <input value={d} onChange={function(e){setD(e.target.value);}} type="number" placeholder="Distance km" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <input value={dt} onChange={function(e){setDt(e.target.value);}} type="date" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",colorScheme:"dark",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <Chip label="Route" active={tp==="route"} onClick={function(){setTp("route");}}/>
              <Chip label="Trail" active={tp==="trail"} color={GR} onClick={function(){setTp("trail");}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn label="Ajouter" onClick={addCustom} size="sm" disabled={!n||!d||!dt} style={{flex:1}}/>
              <Btn label="Annuler" onClick={function(){setShowAdd(false);}} variant="ghost" size="sm" style={{flex:1}}/>
            </div>
          </Card>
        ):null}
        <div style={{display:"flex",flexDirection:"column",gap:8,paddingBottom:24}}>
          {sorted.map(function(r){var on=p.race&&p.race.id===r.id;var wks=weeksUntil(r.date);var col=r.type==="trail"?GR:BL;var distFromUser=(nearMe&&userPos&&r.lat!=null)?haversineKm(userPos.lat,userPos.lng,r.lat,r.lng):null;return(
            <Card key={r.id} onClick={function(){p.setRace(r);}} style={{cursor:"pointer",borderColor:on?col:BORD,background:on?col+"0f":SURF}}>
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:14,fontWeight:600,color:on?col:TXT}}>{r.name}</span>{r.star?<span style={{fontSize:11}}>⭐</span>:null}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:12,color:SUB}}>{r.city}</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,fontWeight:600,color:col+"cc"}}>{r.dist} km</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,color:on?col:SUB,fontWeight:on?600:400}}>{wks} sem.</span>
                    {distFromUser!=null?<><span style={{fontSize:12,color:MUT}}>·</span><span style={{fontSize:12,color:OR,fontWeight:600}}>📍 {distFromUser} km</span></>:null}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                  {on?<div style={{color:col,fontWeight:700,fontSize:16}}>✓</div>:<div style={{color:MUT,fontSize:18}}>›</div>}
                  {!r.custom&&(
                    <a href={regUrl(r)} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{fontSize:10,fontWeight:700,color:col,background:col+"18",border:"1px solid "+col+"44",borderRadius:6,padding:"3px 8px",textDecoration:"none",whiteSpace:"nowrap"}}>S'inscrire →</a>
                  )}
                </div>
              </div>
            </Card>
          );})}
          {sorted.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:SUB}}><div style={{fontSize:14,fontWeight:600,color:TXT,marginBottom:6}}>Aucune course trouvée</div></div>):null}
        </div>
      </div>
    </div>
  );
}
