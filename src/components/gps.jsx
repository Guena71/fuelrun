import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { BG, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
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
    <div style={{position:"fixed",inset:0,background:BG,zIndex:300,display:"flex",flexDirection:"column",padding:"0 0 32px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid "+BORD}}>
        <button onClick={onClose} style={{background:SURF2,border:"1px solid "+BORD,borderRadius:8,padding:"6px 14px",color:SUB,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
        <div style={{fontSize:14,fontWeight:600,color:TXT}}>Enregistrement GPS</div>
        <div style={{width:70}}/>
      </div>
      <div style={{flex:1,padding:"12px 16px 0"}}>
        {track.length>1
          ?<RunMap track={track} height={220}/>
          :<div style={{height:220,borderRadius:12,background:SURF2,border:"1px solid "+BORD,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><span style={{fontSize:40}}>📍</span><span style={{fontSize:12,color:SUB}}>En attente du GPS…</span></div>
        }
      </div>
      <div style={{display:"flex",justifyContent:"space-around",padding:"20px 24px"}}>
        {[{label:"Durée",val:fmtTime(elapsed),col:OR},{label:"Distance",val:km.toFixed(2)+" km",col:BL},{label:"Allure",val:pace+" /km",col:GR}].map(function(s,i){
          return <div key={i} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.col}}>{s.val}</div><div style={{fontSize:10,color:MUT,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.label}</div></div>;
        })}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:16,padding:"0 24px"}}>
        {status==="idle"&&<button onClick={startTracking} style={{width:80,height:80,borderRadius:"50%",background:GR,border:"none",cursor:"pointer",fontSize:28,boxShadow:"0 0 24px "+GR+"60",color:"#fff"}}>▶</button>}
        {status==="running"&&<>
          <button onClick={pauseTracking} style={{width:72,height:72,borderRadius:"50%",background:YE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏸</button>
          <button onClick={stopTracking} style={{width:72,height:72,borderRadius:"50%",background:RE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏹</button>
        </>}
        {status==="paused"&&<>
          <button onClick={startTracking} style={{width:72,height:72,borderRadius:"50%",background:GR,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>▶</button>
          <button onClick={stopTracking} style={{width:72,height:72,borderRadius:"50%",background:RE,border:"none",cursor:"pointer",fontSize:24,color:"#fff"}}>⏹</button>
        </>}
        {status==="done"&&<button onClick={function(){onSave({track:track,km:String(km.toFixed(2)),min:String(Math.round(elapsed/60)),sec:String(elapsed)});}} style={{padding:"16px 40px",borderRadius:14,background:OR,border:"none",cursor:"pointer",fontSize:16,fontWeight:700,color:"#fff",fontFamily:"inherit"}}>Enregistrer</button>}
      </div>
    </div>
  );
}
