import { useState, useEffect } from "react";
import { RACES } from "../data/races.js";
import { weeksUntil } from "./date.js";

export function haversineKm(lat1,lng1,lat2,lng2){
  var R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

export function useRaces(){
  var today=new Date().toISOString().slice(0,10);
  var [races,setRaces]=useState(function(){return RACES.filter(function(r){return r.date>=today;});});
  useEffect(function(){
    fetch("/races.json")
      .then(function(res){return res.json();})
      .then(function(data){setRaces(data.filter(function(r){return r.date>=today;}));})
      .catch(function(){});
  },[]);
  return races;
}

export function suggestRaces(profile,races,preferredType){
  var level=(profile&&profile.level)||"beginner";
  var kmW=parseFloat((profile&&profile.kmWeek)||20);
  var type=preferredType||"both";
  var minWeeks=level==="beginner"?6:level==="intermediate"?8:10;
  var today=Date.now();
  var idealRoute=kmW<25?10:kmW<40?21:42;
  var maxRoute=level==="beginner"?21:level==="intermediate"?42:100;
  var idealTrail=kmW<25?20:kmW<40?35:60;
  var maxTrail=level==="beginner"?30:level==="intermediate"?60:200;
  return races.filter(function(r){
    if(type!=="both"&&r.type!==type)return false;
    var wks=weeksUntil(r.date);
    var maxD=r.type==="trail"?maxTrail:maxRoute;
    return wks>=minWeeks&&r.dist<=maxD&&new Date(r.date).getTime()>today;
  }).map(function(r){
    var score=0;
    var ideal=r.type==="trail"?idealTrail:idealRoute;
    var diff=Math.abs(r.dist-ideal);
    score+=diff===0?4:diff<=10?2:diff<=20?1:0;
    if(r.star)score+=2;
    var wks=weeksUntil(r.date);
    if(wks>=minWeeks&&wks<=minWeeks+8)score+=2;
    if(type!=="both")score+=1;
    return{race:r,score:score};
  }).sort(function(a,b){return b.score-a.score;}).slice(0,4).map(function(x){return x.race;});
}
