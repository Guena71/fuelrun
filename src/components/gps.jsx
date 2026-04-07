import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { SURF2, OR, GR, BL, YE, RE } from "../data/constants.js";
import { fmtTime, fmtPaceSec } from "../utils/date.js";

export function parseGpx(text){
  var doc=new DOMParser().parseFromString(text,"application/xml");
  var pts=doc.querySelectorAll("trkpt,rtept,wpt");
  var track=[];
  pts.forEach(function(pt){
    var lat=parseFloat(pt.getAttribute("lat")),lon=parseFloat(pt.getAttribute("lon"));
    var t=pt.querySelector("time");
    if(!isNaN(lat)&&!isNaN(lon))track.push({lat:lat,lon:lon,ts:t?new Date(t.textContent).getTime():null});
  });
  return track;
}

export function calcTrackKm(track){
  if(!track||track.length<2)return 0;
  var d=0;
  for(var i=1;i<track.length;i++){
    var R=6371,dLat=(track[i].lat-track[i-1].lat)*Math.PI/180,dLon=(track[i].lon-track[i-1].lon)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(track[i-1].lat*Math.PI/180)*Math.cos(track[i].lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    d+=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  return Math.round(d*100)/100;
}

export function RunMap({track,height}){
  var ref=useRef(null);
  var mapInst=useRef(null);
  useEffect(function(){
    if(!track||track.length<2||!ref.current)return;
    if(mapInst.current){mapInst.current.remove();mapInst.current=null;}
    var map=L.map(ref.current,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,touchZoom:false,doubleClickZoom:false});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
    var coords=track.map(function(p){return[p.lat,p.lon];});
    L.polyline(coords,{color:OR,weight:4,opacity:0.9}).addTo(map);
    L.circleMarker(coords[0],{radius:6,fillColor:"#22c55e",fillOpacity:1,color:"#fff",weight:2}).addTo(map);
    L.circleMarker(coords[coords.length-1],{radius:6,fillColor:RE,fillOpacity:1,color:"#fff",weight:2}).addTo(map);
    map.fitBounds(L.polyline(coords).getBounds(),{padding:[16,16]});
    mapInst.current=map;
    return function(){if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[track]);
  return <div ref={ref} style={{height:height||200,borderRadius:12,overflow:"hidden",background:SURF2}}/>;
}

export function GpsTrackerModal({onSave,onClose}){
  var [status,setStatus]=useState("idle");
  var [track,setTrack]=useState([]);
  var [elapsed,setElapsed]=useState(0);
  var [,setSpd]=useState(0);
  var watchId=useRef(null);
  var timerRef=useRef(null);
  var startTs=useRef(null);
  var elapsedBase=useRef(0);

  function startTracking(){
    setStatus("running");
    startTs.current=Date.now();
    watchId.current=navigator.geolocation.watchPosition(function(pos){
      setTrack(function(t){return t.concat([{lat:pos.coords.latitude,lon:pos.coords.longitude,ts:Date.now()}]);});
      setSpd(Math.round((pos.coords.speed||0)*3.6*10)/10);
    },function(){},{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    timerRef.current=setInterval(function(){setElapsed(elapsedBase.current+Math.floor((Date.now()-startTs.current)/1000));},1000);
  }
  function pauseTracking(){
    setStatus("paused");
    elapsedBase.current=elapsed;
    if(watchId.current!=null)navigator.geolocation.clearWatch(watchId.current);
    clearInterval(timerRef.current);
  }
  function stopTracking(){pauseTracking();setStatus("done");}
  useEffect(function(){return function(){if(watchId.current!=null)navigator.geolocation.clearWatch(watchId.current);clearInterval(timerRef.current);};},[]); // eslint-disable-line

  var km=calcTrackKm(track);
  var pace=km>0&&elapsed>0?fmtPaceSec(elapsed/km):"--:--";

  return(
    <div className="fixed inset-0 bg-bg z-[300] flex flex-col pb-8">
      <div className="flex items-center justify-between px-5 py-4 border-b border-bord">
        <button onClick={onClose}
          className="bg-surf2 border border-bord rounded-lg px-3.5 py-1.5 text-sub text-[13px] cursor-pointer font-[inherit]">
          Annuler
        </button>
        <div className="text-sm font-semibold text-txt">Enregistrement GPS</div>
        <div className="w-[70px]"/>
      </div>

      <div className="flex-1 px-4 pt-3">
        {track.length>1
          ?<RunMap track={track} height={220}/>
          :<div className="h-[220px] rounded-xl bg-surf2 border border-bord flex items-center justify-center flex-col gap-2">
            <span className="text-[40px]">📍</span>
            <span className="text-[12px] text-sub">En attente du GPS…</span>
          </div>
        }
      </div>

      <div className="flex justify-around px-6 py-5">
        {[{label:"Durée",val:fmtTime(elapsed),col:OR},{label:"Distance",val:km.toFixed(2)+" km",col:BL},{label:"Allure",val:pace+" /km",col:GR}].map(function(s,i){
          return(
            <div key={i} className="text-center">
              <div className="text-[22px] font-extrabold" style={{color:s.col}}>{s.val}</div>
              <div className="text-[10px] text-mut uppercase tracking-[0.5px] mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 px-6">
        {status==="idle"&&(
          <button onClick={startTracking}
            className="w-20 h-20 rounded-full border-none cursor-pointer text-[28px] text-white"
            style={{background:GR,boxShadow:"0 0 24px "+GR+"60"}}>▶</button>
        )}
        {status==="running"&&<>
          <button onClick={pauseTracking} className="w-[72px] h-[72px] rounded-full border-none cursor-pointer text-2xl text-white" style={{background:YE}}>⏸</button>
          <button onClick={stopTracking}  className="w-[72px] h-[72px] rounded-full border-none cursor-pointer text-2xl text-white" style={{background:RE}}>⏹</button>
        </>}
        {status==="paused"&&<>
          <button onClick={startTracking} className="w-[72px] h-[72px] rounded-full border-none cursor-pointer text-2xl text-white" style={{background:GR}}>▶</button>
          <button onClick={stopTracking}  className="w-[72px] h-[72px] rounded-full border-none cursor-pointer text-2xl text-white" style={{background:RE}}>⏹</button>
        </>}
        {status==="done"&&(
          <button onClick={function(){onSave({track:track,km:String(km.toFixed(2)),min:String(Math.round(elapsed/60))});}}
            className="px-10 py-4 rounded-2xl border-none cursor-pointer text-base font-bold text-white bg-brand font-[inherit]">
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}
