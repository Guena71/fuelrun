import { useState, useEffect, useRef } from "react";
import { db, doc, setDoc, getDoc } from "../firebase.js";
import { SURF, BORD, TXT, SUB, MUT, OR, GR, BL, RE } from "../data/constants.js";
import { weeksUntil } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { ls, lsSet } from "../utils/storage.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";

export function CoachScreen(p){
  var init="Salut "+(p.profile.name||"champion")+" ! Je suis ton coach FuelRun. "+(p.race?"Tu prépares "+p.race.name+" dans "+weeksUntil(p.race.date)+" semaines. Comment puis-je t'aider ?":"Dis-moi ton objectif et je t'aide !");
  var [messages,setMessages]=useState([{role:"model",content:init}]);
  var [input,setInput]=useState("");
  var [loading,setLoading]=useState(false);
  var [histLoaded,setHistLoaded]=useState(false);
  var [error,setError]=useState("");
  var [showCoachUpgrade,setShowCoachUpgrade]=useState(false);
  var msgsRef=useRef(null);
  var todayKey=new Date().toISOString().slice(0,10);
  var countKey="fr_coach_count_"+todayKey;
  var [dailyCount,setDailyCount]=useState(function(){return ls(countKey,0);});
  var lvl=planLevel(p.profile);
  var maxMsg=lvl>=2?Infinity:lvl>=1?30:5;
  var remaining=maxMsg===Infinity?null:Math.max(0,maxMsg-dailyCount);
  useEffect(function(){if(msgsRef.current)msgsRef.current.scrollTop=msgsRef.current.scrollHeight;},[messages]);

  useEffect(function(){
    if(!p.user||histLoaded)return;
    getDoc(doc(db,"users",p.user.uid)).then(function(snap){
      if(snap.exists()){
        var data=snap.data();
        if(data.coachHistory&&Array.isArray(data.coachHistory)&&data.coachHistory.length>0){
          setMessages(data.coachHistory);
        }
      }
      setHistLoaded(true);
    }).catch(function(){setHistLoaded(true);});
  },[p.user]);

  function saveHistory(msgs){
    if(!p.user)return;
    var trimmed=msgs.slice(-40);
    setDoc(doc(db,"users",p.user.uid),{coachHistory:trimmed},{merge:true}).catch(function(){});
  }

  function send(){
    if(!input.trim()||loading)return;
    if(maxMsg!==Infinity&&dailyCount>=maxMsg){setShowCoachUpgrade(true);return;}
    var msg=input.trim();setInput("");setLoading(true);setError("");
    var newMsgs=messages.concat([{role:"user",content:msg}]);
    setMessages(newMsgs);
    var recentKm=0;var recentSess=0;if(p.entries){var cut7=new Date();cut7.setDate(cut7.getDate()-7);Object.entries(p.entries).forEach(function(e){if(e[1].done&&new Date(e[0])>=cut7){recentKm+=parseFloat(e[1].km)||0;recentSess++;}});}
    var wellStr="";if(p.wellbeing){var wTot=0;var wVals=Object.values(p.wellbeing);for(var wi=0;wi<wVals.length;wi++)wTot+=wVals[wi];var wPct=wTot/(4*4);wellStr=wPct<=0.4?"en état de fatigue":wPct<=0.6?"légèrement fatigué":wPct<=0.8?"en bonne forme":"en super forme";}
    var planCtx=p.race?buildPlan(p.race,p.profile):null;var planWCtx=getPlanWeeks(planCtx);var curWCtx=null;for(var cix=0;cix<planWCtx.length;cix++){if(planWCtx[cix].isCurrent){curWCtx=planWCtx[cix];break;}}if(!curWCtx){for(var cix2=0;cix2<planWCtx.length;cix2++){if(!planWCtx[cix2].isPast){curWCtx=planWCtx[cix2];break;}}}
    var todaySessCtx=curWCtx&&curWCtx.sessions&&curWCtx.sessions.length>0?curWCtx.sessions[0]:null;
    var sys="Tu es un coach running expert et bienveillant. Profil : "+(p.profile.name||"Coureur")+", "+(p.profile.age||"30")+" ans, "+(p.profile.weight||"70")+" kg, niveau "+(p.profile.level||"débutant")+"."+(p.race?" Objectif : "+p.race.name+", "+p.race.dist+" km dans "+weeksUntil(p.race.date)+" semaines.":"")+(todaySessCtx?" Séance du jour : "+todaySessCtx.label+" ("+todaySessCtx.km+" km à "+todaySessCtx.pace+"/km).":" Pas de séance planifiée aujourd'hui.")+"\n7 derniers jours : "+recentSess+" séance"+(recentSess!==1?"s":"")+", "+Math.round(recentKm)+" km."+(wellStr?" Coureur "+wellStr+".":" État non renseigné.")+"\nRéponds en français, 3-4 phrases max, naturel, précis, personnalisé.";
    var hist=newMsgs.map(function(m){return{role:m.role==="model"?"assistant":m.role,content:m.content};});
    fetch("/api/coach",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({system:sys,messages:hist})
    }).then(function(r){return r.json();}).then(function(data){
      if(data.error){setError(data.error.message||data.error||"Erreur API");setLoading(false);return;}
      var reply=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||"Désolé, réessaie.";
      var updated=newMsgs.concat([{role:"model",content:reply}]);
      setMessages(updated);
      saveHistory(updated);
      var nc=dailyCount+1;setDailyCount(nc);lsSet(countKey,nc);
      setLoading(false);
    }).catch(function(){
      setMessages(function(m){return m.concat([{role:"model",content:"Problème de connexion."}]);});setLoading(false);
    });
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 70px)",overflowX:"hidden",maxWidth:"100%"}}>
      <LogoBar/>
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid "+BORD,flexShrink:0,overflowX:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>Coach IA</div>
          {remaining!==null&&<div style={{fontSize:11,fontWeight:600,color:remaining<=2?RE:remaining<=5?"#F59E0B":MUT,background:SURF,padding:"3px 8px",borderRadius:8,border:"1px solid "+BORD}}>{remaining} msg restants</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,"+OR+"44,"+OR+"11)",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏃</div>
          <div style={{fontSize:13,fontWeight:700,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Coach FuelRun <span style={{fontSize:11,fontWeight:400,color:GR}}>· En ligne · Disponible 7j/7</span></div>
        </div>
        {error?<div style={{marginTop:8,fontSize:12,color:RE}}>{error}</div>:null}
      </div>
      <div ref={msgsRef} style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"16px 16px 8px"}}>
        {messages.map(function(m,i){var isUser=m.role==="user";return(<div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:12,gap:8}}>{!isUser?<div style={{width:28,height:28,borderRadius:"50%",background:OR+"20",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginTop:2}}>🏃</div>:null}<div style={{maxWidth:"78%",background:isUser?OR:SURF,borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:14,color:isUser?"#fff":TXT,lineHeight:1.6,border:isUser?"none":"1px solid "+BORD,wordBreak:"break-word",overflowWrap:"break-word"}}>{m.content}</div></div>);})}
        {loading?(<div style={{display:"flex",gap:8,marginBottom:12}}><div style={{width:28,height:28,borderRadius:"50%",background:OR+"20",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏃</div><div style={{background:SURF,borderRadius:"16px 16px 16px 4px",padding:"12px 14px",border:"1px solid "+BORD,display:"flex",gap:4}}>{[0,1,2].map(function(i){return <div key={i} style={{width:7,height:7,borderRadius:"50%",background:OR,animation:"pulse 1.2s "+(i*0.2)+"s infinite"}}/>;})}</div></div>):null}
      </div>
      <div style={{padding:"8px 16px 16px",borderTop:"1px solid "+BORD,flexShrink:0}}>
        {messages.length<=1&&!loading?(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {["Comment préparer ma prochaine séance ?","Que manger avant une course ?","J'ai mal aux jambes, que faire ?","Comment améliorer mon allure ?"].map(function(q,i){
              return <button key={i} onClick={function(){setInput(q);}} style={{padding:"6px 12px",borderRadius:20,background:"#222222",border:"1px solid "+BORD,color:SUB,fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{q}</button>;
            })}
          </div>
        ):null}
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")send();}} placeholder="Pose ta question au coach…" style={{flex:1,background:SURF,border:"1px solid "+BORD,borderRadius:12,padding:"12px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={send} disabled={!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)} style={{width:46,height:46,borderRadius:12,background:maxMsg!==Infinity&&dailyCount>=maxMsg?MUT:OR,border:"none",cursor:!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)?"not-allowed":"pointer",fontSize:18,opacity:!input.trim()||loading?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{maxMsg!==Infinity&&dailyCount>=maxMsg?"🔒":"↑"}</button>
        </div>
        {maxMsg!==Infinity&&dailyCount>=maxMsg&&(
          <div onClick={function(){setShowCoachUpgrade(true);}} style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:OR+"15",border:"1px solid "+OR+"33",cursor:"pointer",textAlign:"center"}}>
            <span style={{fontSize:12,color:OR,fontWeight:600}}>Limite journalière atteinte · Passer à un plan supérieur</span>
          </div>
        )}
      </div>
      {showCoachUpgrade&&<UpgradeModal feature={"Coach IA · Limite atteinte"} minPlanLabel={lvl<1?"Essential":"Pro"} minPlanColor={lvl<1?BL:OR} onClose={function(){setShowCoachUpgrade(false);}} onUpgrade={function(){setShowCoachUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </div>
  );
}
