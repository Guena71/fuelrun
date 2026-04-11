import { useState, useEffect, useRef } from "react";
import { db, doc, setDoc, getDoc } from "../firebase.js";
import { SURF, BORD, TXT, SUB, MUT, OR, GR, BL, RE } from "../data/constants.js";
import { weeksUntil } from "../utils/date.js";
import { buildPlan, getPlanWeeks } from "../utils/plan.js";
import { planLevel } from "../utils/nutrition.js";
import { xpToLevel, getWeeklyContractKey, generateWeeklyChallenge, challengeProgress, contractProgress } from "../utils/gamification.js";
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

  function send(overrideMsg){
    var msg=overrideMsg!=null?overrideMsg.trim():input.trim();
    if(!msg||loading)return;
    if(maxMsg!==Infinity&&dailyCount>=maxMsg){setShowCoachUpgrade(true);return;}
    if(overrideMsg==null)setInput("");setLoading(true);setError("");
    var newMsgs=messages.concat([{role:"user",content:msg}]);
    setMessages(newMsgs);
    // === Contexte enrichi ===
    // Wellbeing
    var wellStr="non renseigné";if(p.wellbeing){var wTot=0;var wVals=Object.values(p.wellbeing);for(var wi=0;wi<wVals.length;wi++)wTot+=wVals[wi];var wPct=wTot/(4*4);wellStr=wPct<=0.4?"en état de fatigue (repos conseillé)":wPct<=0.6?"légèrement fatigué":wPct<=0.8?"en bonne forme":"en super forme";}
    // Plan
    var planCtx=p.race?buildPlan(p.race,p.profile):null;var planWCtx=getPlanWeeks(planCtx);var curWCtx=null;var curWIdx=0;for(var cix=0;cix<planWCtx.length;cix++){if(planWCtx[cix].isCurrent){curWCtx=planWCtx[cix];curWIdx=cix;break;}}if(!curWCtx){for(var cix2=0;cix2<planWCtx.length;cix2++){if(!planWCtx[cix2].isPast){curWCtx=planWCtx[cix2];curWIdx=cix2;break;}}}
    // Séances semaine en cours avec statut fait/à faire
    var weekSessLines="aucune";if(curWCtx&&curWCtx.sessions){weekSessLines=curWCtx.sessions.filter(function(s){return s.type!=="rest";}).map(function(s){var done=!!(p.entries&&p.entries[s.date?s.date.toDateString():""]&&p.entries[s.date.toDateString()].done);return(s.dayLabel||"")+": "+s.label+" "+s.km+"km"+(s.pace?" à "+s.pace+"/km":"")+(done?" ✓":"  (à faire)");}).join("\n  ");}
    // Comptage séances réalisées sur tout le plan
    var totalPlanSess=0,donePlanSess=0;planWCtx.forEach(function(w){if(w.isPast||w.isCurrent){w.sessions.forEach(function(s){if(s.type!=="rest"){totalPlanSess++;var k=s.date?s.date.toDateString():"";if(p.entries&&p.entries[k]&&p.entries[k].done)donePlanSess++;}});}});
    // 30 derniers jours d'entrées
    var cut30=new Date();cut30.setDate(cut30.getDate()-30);var recentLines=[];if(p.entries){Object.entries(p.entries).sort(function(a,b){return new Date(a[0])-new Date(b[0]);}).forEach(function(kv){var k=kv[0],e=kv[1];if(e.done&&new Date(k)>=cut30){var d=new Date(k);recentLines.push((d.getDate()+"/"+(d.getMonth()+1))+": "+( parseFloat(e.km)||0).toFixed(1)+"km"+(e.min?" en "+e.min+"min":""));}});}
    // Gamification
    var gam=p.gamification||{xp:0,badges:[],contract:null,contractsKept:0};var level=xpToLevel(gam.xp||0);
    var weekKey=getWeeklyContractKey();var contract=gam.contract&&gam.contract.weekKey===weekKey?gam.contract:null;var contractDoneCount=contract?contractProgress(p.entries||{},weekKey):0;
    // Contexte depuis quel écran
    var ctxLine=p.context?"Contexte : l'utilisateur t'ouvre depuis "+p.context+". Commence par un message adapté à ce contexte.\n":"";
    var sys="Tu es le coach de FuelRun, expert en running, trail et entraînement. Tu connais parfaitement cet athlète et son plan.\n"+ctxLine+"\n== PROFIL ==\n"+(p.profile.name||"Coureur")+", "+(p.profile.age||"30")+" ans, "+(p.profile.weight||"70")+" kg, niveau "+(p.profile.level||"débutant")+(p.profile.gender?"," +p.profile.gender:"")+"\nNiveau : "+level.emoji+" "+level.name+" ("+( gam.xp||0)+" XP) · Série : "+(p.stats&&p.stats.streak||0)+" jour(s) consécutif(s) · Total : "+(p.stats&&Math.round(p.stats.km)||0)+" km en "+(p.stats&&p.stats.sessions||0)+" séances\n\n== OBJECTIF ==\n"+(p.race?""+p.race.name+", "+p.race.dist+"km ("+(p.race.type==="trail"?"trail":"route")+") — dans "+weeksUntil(p.race.date)+" semaine(s)":"Pas de course configurée")+"\n\n== PLAN ==\nSemaine "+(curWIdx+1)+"/"+planWCtx.length+" · "+donePlanSess+"/"+totalPlanSess+" séances réalisées depuis le début\nSéances cette semaine :\n  "+weekSessLines+"\n\n== 30 DERNIERS JOURS ==\n"+(recentLines.length>0?recentLines.slice(-12).join(" | "):"Aucune activité enregistrée")+"\n\n== ÉTAT ==\nForme : "+wellStr+"\n"+(contract?"Contrat semaine : "+contractDoneCount+"/"+contract.target+" séances réalisées":"Pas de contrat cette semaine")+"\n\nRéponds en français, ton naturel et direct, 2-4 phrases max, conseils concrets basés sur ces données précises.";
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
      p.onMessage&&p.onMessage();
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
          <div style={{fontSize:26,fontWeight:800,color:TXT,letterSpacing:"-0.4px"}}>Coach</div>
          {remaining!==null&&<div style={{fontSize:11,fontWeight:600,color:remaining<=2?RE:remaining<=5?"#F59E0B":MUT,background:SURF,padding:"3px 8px",borderRadius:8,border:"1px solid "+BORD}}>{remaining} msg restants</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,"+OR+"44,"+OR+"11)",border:"1px solid "+OR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏃</div>
          <div style={{fontSize:13,fontWeight:700,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Coach FuelRun <span style={{fontSize:11,fontWeight:400,color:GR}}>· En ligne · Disponible 7j/7</span></div>
        </div>
        {(function(){
          var wk=getWeeklyContractKey();
          var chal=generateWeeklyChallenge(p.profile||{},wk);
          var prog=challengeProgress(p.entries||{},wk,chal);
          var done=prog>=chal.target;
          var pct=Math.min(100,Math.round(prog/chal.target*100));
          var chalMsg="Coach, j'ai un challenge cette semaine : "+chal.label+". J'en suis à "+prog+"/"+chal.target+". Donne-moi des conseils pour le réussir !";
          return(
            <div style={{padding:"10px 12px",borderRadius:10,background:done?GR+"12":OR+"0e",border:"1px solid "+(done?GR+"44":OR+"22")}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>{chal.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:done?GR:OR,textTransform:"uppercase",letterSpacing:0.5}}>Challenge de la semaine</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:done?GR:OR}}>{prog}/{chal.target}{done?" ✓":""}</span>
              </div>
              <div style={{fontSize:12,color:TXT,marginBottom:6}}>{chal.label}</div>
              <div style={{height:3,background:OR+"20",borderRadius:4,overflow:"hidden",marginBottom:8}}>
                <div style={{width:pct+"%",height:"100%",background:done?GR:OR,borderRadius:4,transition:"width 0.5s"}}/>
              </div>
              {!done&&<button onClick={function(){send(chalMsg);}} style={{width:"100%",padding:"6px",borderRadius:8,background:OR+"18",border:"1px solid "+OR+"33",color:OR,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                💬 Demander des conseils au coach →
              </button>}
            </div>
          );
        })()}
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
          <button onClick={function(){send();}} disabled={!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)} style={{width:46,height:46,borderRadius:12,background:maxMsg!==Infinity&&dailyCount>=maxMsg?MUT:OR,border:"none",cursor:!input.trim()||loading||(maxMsg!==Infinity&&dailyCount>=maxMsg)?"not-allowed":"pointer",fontSize:18,opacity:!input.trim()||loading?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{maxMsg!==Infinity&&dailyCount>=maxMsg?"🔒":"↑"}</button>
        </div>
        {maxMsg!==Infinity&&dailyCount>=maxMsg&&(
          <div onClick={function(){setShowCoachUpgrade(true);}} style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:OR+"15",border:"1px solid "+OR+"33",cursor:"pointer",textAlign:"center"}}>
            <span style={{fontSize:12,color:OR,fontWeight:600}}>Limite journalière atteinte · Passer à un plan supérieur</span>
          </div>
        )}
      </div>
      {showCoachUpgrade&&<UpgradeModal feature={"Coach · Limite atteinte"} minPlanLabel={lvl<1?"Essentiel":"Pro"} minPlanColor={lvl<1?BL:OR} onClose={function(){setShowCoachUpgrade(false);}} onUpgrade={function(){setShowCoachUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    </div>
  );
}
