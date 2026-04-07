import { useState, useEffect } from "react";
import { auth, db, analytics, signOut, onAuthStateChanged, logEvent, doc, setDoc, getDoc, deleteDoc, deleteUser } from "./firebase.js";
import { BG, SURF, BORD, OR, GR, RE, CSS } from "./data/constants.js";
import { ls, lsSet } from "./utils/storage.js";
import { RunnerHero } from "./components/RunnerHero.jsx";
import { CheckinModal } from "./components/CheckinModal.jsx";
import { OnboardingGuide } from "./components/OnboardingGuide.jsx";
import { HeroScreen } from "./components/HeroScreen.jsx";
import { AuthScreen } from "./screens/AuthScreen.jsx";
import { PricingScreen } from "./screens/PricingScreen.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";
import { HomeScreen } from "./screens/HomeScreen.jsx";
import { TrainingScreen } from "./screens/TrainingScreen.jsx";
import { CoursesScreen } from "./screens/CoursesScreen.jsx";
import { JournalScreen } from "./screens/JournalScreen.jsx";
import { SuiviScreen } from "./screens/SuiviScreen.jsx";
import { CoachScreen } from "./screens/CoachScreen.jsx";
import { ProfileScreen } from "./screens/ProfileScreen.jsx";

var NAV=[
  {id:"home",     label:"Accueil", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11L12 3l9 8v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>;}},
  {id:"courses",  label:"Courses", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 13 6 13s6-7.7 6-13c0-3.3-2.7-6-6-6z" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="8" r="2" stroke={c} strokeWidth="1.8"/></svg>;}},
  {id:"training", label:"Plan",    icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;}},
  {id:"suivi",    label:"Suivi",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}},
  {id:"coach",    label:"Coach",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 2H4a1 1 0 00-1 1v12a1 1 0 001 1h3l3 4 3-4h7a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="9" cy="9" r="1" fill={c}/><circle cx="12" cy="9" r="1" fill={c}/><circle cx="15" cy="9" r="1" fill={c}/></svg>;}},
];

function Splash(){
  var [step,setStep]=useState(0);
  if(step===0)return <HeroScreen onCommencer={function(){setStep(1);}} onLogin={function(){setStep(2);}}/>;
  if(step===1)return <PricingScreen onStart={function(){setStep(2);}}/>;
  return <AuthScreen/>;
}

export default function App(){
  var [authState,setAuthState]=useState("loading");
  var [user,setUser]=useState(null);
  var [profile,setProfileRaw]=useState(null);
  var [race,setRaceRaw]=useState(null);
  var [tab,setTab]=useState("home");
  var [stats,setStatsRaw]=useState({sessions:0,km:0,streak:0});
  var today=new Date().toISOString().slice(0,10);
  var [wellbeing,setWellbeingRaw]=useState(null);
  var [showCheckin,setShowCheckin]=useState(false);
  var [entries,setEntriesRaw]=useState(function(){return ls("fr_entries",{});});
  var [showGuide,setShowGuide]=useState(false);
  var [showPricing,setShowPricing]=useState(false);
  var [journalPreselect,setJournalPreselect]=useState(null);
  var [toast,setToast]=useState(null);
  function showToast(msg,type){setToast({msg:msg,type:type||"ok"});setTimeout(function(){setToast(null);},3500);}

  useEffect(function(){
    var params=new URLSearchParams(window.location.search);
    var checkout=params.get("checkout");
    if(checkout==="success"){
      var plan=params.get("plan")||"pro";
      showToast("Abonnement "+plan+" activé — 14 jours gratuits !","ok");
      logEvent(analytics,"purchase",{plan:plan});
      window.history.replaceState({},"",window.location.pathname);
    }
    if(checkout==="cancel"){
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  function setEntries(fn){setEntriesRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;lsSet("fr_entries",next);if(user)fsSave(user.uid,{entries:next});return next;});}

  function fsGet(uid){
    return getDoc(doc(db,"users",uid)).then(function(snap){return snap.exists()?snap.data():null;});
  }
  function fsSave(uid,data){
    return setDoc(doc(db,"users",uid),data,{merge:true}).catch(function(){
      showToast("Erreur de sauvegarde — vérifie ta connexion","err");
    });
  }

  useEffect(function(){
    var unsub=onAuthStateChanged(auth,function(u){
      if(!u){setUser(null);setAuthState("unauth");return;}
      setUser(u);
      fsGet(u.uid).then(function(data){
        if(data&&data.profile){
          setProfileRaw(data.profile);
          setRaceRaw(data.race||null);
          setStatsRaw(data.stats||{sessions:0,km:0,streak:0});
          var wb=data.wellbeing;
          setWellbeingRaw(wb&&wb.date===today?wb.data:null);
          setAuthState("app");
        } else {
          setAuthState("onboarding");
        }
      }).catch(function(){setAuthState("onboarding");});
    });
    return unsub;
  },[]);

  function setProfile(v){setProfileRaw(v);if(user)fsSave(user.uid,{profile:v});}
  function setRace(v){setRaceRaw(v);if(user)fsSave(user.uid,{race:v});}
  function setStats(fn){setStatsRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{stats:next});return next;});}
  function setWellbeing(wb){setWellbeingRaw(wb);if(user)fsSave(user.uid,{wellbeing:wb?{date:today,data:wb}:null});}

  function addSession(km){
    setStats(function(s){
      var yesterday=new Date(new Date().setHours(0,0,0,0));
      yesterday.setDate(yesterday.getDate()-1);
      var yestKey=yesterday.toDateString();
      var hadYesterday=!!(entries&&entries[yestKey]&&entries[yestKey].done);
      return{sessions:s.sessions+1,km:s.km+km,streak:hadYesterday?s.streak+1:1};
    });
    logEvent(analytics,"session_logged",{km:km});
  }

  var VAPID_PUBLIC_KEY="BDnhMkrmir_7UMOVXnPOeMYv_e4h5lrvKLmb-I9VJyMUZPZDm7x9g1fqhFNZj7-csn6jAV6LuzCfJwRSpdLtO7k";
  var [pushEnabled,setPushEnabled]=useState(ls("fr_push_enabled",false));

  function urlBase64ToUint8Array(base64String){
    var padding="=".repeat((4-base64String.length%4)%4);
    var base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
    var raw=window.atob(base64);
    var arr=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
    return arr;
  }

  async function enablePush(){
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){showToast("Notifications non supportées sur ce navigateur","err");return;}
    try{
      var perm=await Notification.requestPermission();
      if(perm!=="granted"){showToast("Autorise les notifications dans les paramètres","err");return;}
      var reg=await navigator.serviceWorker.ready;
      var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
      await setDoc(doc(db,"push_subscriptions",user.uid),{uid:user.uid,subscription:sub.toJSON(),updatedAt:Date.now()});
      lsSet("fr_push_enabled",true);setPushEnabled(true);
      showToast("Notifications activées ✓","ok");
      logEvent(analytics,"push_enabled");
    }catch(e){showToast("Erreur : "+e.message,"err");}
  }

  async function disablePush(){
    try{
      var reg=await navigator.serviceWorker.ready;
      var sub=await reg.pushManager.getSubscription();
      if(sub)await sub.unsubscribe();
      if(user)await deleteDoc(doc(db,"push_subscriptions",user.uid));
      lsSet("fr_push_enabled",false);setPushEnabled(false);
      showToast("Notifications désactivées","ok");
    }catch(e){showToast("Erreur : "+e.message,"err");}
  }

  if(authState==="loading")return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <RunnerHero size={64}/>
        <div style={{fontSize:14,color:"#686868"}}>Chargement…</div>
      </div>
    </div>
  );

  if(authState==="unauth")return <Splash/>;

  if(authState==="onboarding"){return <Onboarding onDone={function(d){
    var prof={name:d.name,age:d.age,weight:d.weight,height:d.height,sex:d.sex,level:d.level,sessWeek:d.sessWeek,kmWeek:d.kmWeek,plan:ls("fr_pending_plan","gratuit")};
    setProfile(prof);setRace(d.race);
    if(user)fsSave(user.uid,{profile:prof,race:d.race||null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setAuthState("app");if(d.race)setTab("training");
    if(!ls("fr_guide_done",false))setTimeout(function(){setShowGuide(true);},800);
  }}/>;}

  if(!profile)return null;

  function handleReset(){
    if(user)fsSave(user.uid,{profile:null,race:null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setProfileRaw(null);setRaceRaw(null);setStatsRaw({sessions:0,km:0,streak:0});
    setTab("home");
    setAuthState("onboarding");
  }

  function handleDeleteAccount(){
    if(!user)return;
    var uid=user.uid;
    deleteDoc(doc(db,"users",uid)).catch(function(){});
    Object.keys(localStorage).filter(function(k){return k.startsWith("fr_");}).forEach(function(k){localStorage.removeItem(k);});
    deleteUser(user).catch(function(){signOut(auth);});
  }

  var goPrice=function(){setShowPricing(true);};

  function renderTab(){
    if(tab==="home")     return <HomeScreen profile={profile} race={race} stats={stats} onCheckin={function(){setShowCheckin(true);}} wellbeing={wellbeing} onShowPricing={goPrice} onGoToProfile={function(){setTab("profile");}} onReset={handleReset} entries={entries} onGoToJournal={function(km){setJournalPreselect({date:new Date(),km:km});setTab("journal");}} onSignOut={function(){signOut(auth);}}/>;
    if(tab==="training") return <TrainingScreen profile={profile} race={race} setRace={setRace} onGoToCourses={function(){setTab("courses");}} onShowPricing={goPrice}/>;
    if(tab==="courses")  return <CoursesScreen profile={profile} race={race} setRace={function(r){setRace(r);if(r)setTimeout(function(){setTab("training");},300);}} onAddCustom={function(r){setRace(r);}}/>;
    if(tab==="suivi")    return <SuiviScreen profile={profile} race={race} stats={stats} entries={entries} onSetEntries={setEntries} onAddSession={addSession} onOpenJournal={function(){setTab("journal");}} onShowPricing={goPrice}/>;
    if(tab==="journal")  return <JournalScreen race={race} profile={profile} entries={entries} onSetEntries={setEntries} onAddSession={addSession} onShowPricing={goPrice} preselect={journalPreselect} onClearPreselect={function(){setJournalPreselect(null);}}/>;
    if(tab==="coach")    return <CoachScreen profile={profile} race={race} user={user} onShowPricing={goPrice} entries={entries} wellbeing={wellbeing}/>;
    if(tab==="profile")  return <ProfileScreen profile={profile} race={race} stats={stats} entries={entries} onBack={function(){setTab("home");}} onToast={showToast} onUpdate={function(form){var updated=Object.assign({},profile,form);setProfile(updated);}} onNewRace={function(){setRace(null);if(user)fsSave(user.uid,{race:null});setTab("courses");}} onReset={handleReset} onSignOut={function(){signOut(auth);}} onDeleteAccount={handleDeleteAccount} user={user} onShowPricing={goPrice} pushEnabled={pushEnabled} onEnablePush={enablePush} onDisablePush={disablePush} onImport={function(data){setProfile(data.profile);if(data.race)setRace(data.race);if(data.stats)setStatsRaw(data.stats);if(data.entries)setEntries(data.entries);if(user)fsSave(user.uid,{profile:data.profile,race:data.race||null,stats:data.stats||{sessions:0,km:0,streak:0},entries:data.entries||{}});showToast("Import réussi ✓","ok");}} onSaveError={function(msg){showToast(msg,"err");}}/>;
    return null;
  }

  return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",justifyContent:"center",overflowX:"hidden",maxWidth:"100vw"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:430,background:BG,height:"100vh",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
        <div key={tab} style={{flex:1,overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",paddingBottom:80}}>{renderTab()}</div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:SURF,borderTop:"1px solid "+BORD,display:"flex",zIndex:100,paddingBottom:4}}>
          {NAV.map(function(n){var active=tab===n.id;var color=active?OR:"#686868";return(
            <button key={n.id} onClick={function(){setTab(n.id);}} style={{flex:1,padding:"8px 2px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",background:"none",border:"none",position:"relative"}}>
              {n.icon(color)}
              <span style={{fontSize:9,fontWeight:active?600:400,color:color,letterSpacing:0.2}}>{n.label}</span>
              {active?<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2.5,background:OR,borderRadius:"0 0 3px 3px"}}/>:null}
            </button>
          );})}
        </div>
      </div>
      {showPricing&&(
        <div style={{position:"fixed",inset:0,background:BG,zIndex:450,overflowY:"auto"}}>
          <PricingScreen user={user} onClose={function(){setShowPricing(false);}} onStart={function(){
            var chosen=ls("fr_pending_plan","gratuit");
            var updated=Object.assign({},profile,{plan:chosen});
            setProfile(updated);
            setShowPricing(false);
            showToast("Formule mise à jour ✓","ok");
          }}/>
        </div>
      )}
      {showCheckin?<CheckinModal onDone={function(wb){setWellbeing(wb);setShowCheckin(false);}} onClose={function(){setShowCheckin(false);}}/>:null}
      {showGuide?<OnboardingGuide onDone={function(){lsSet("fr_guide_done",true);setShowGuide(false);}} onTab={function(t){setTab(t);}}/>:null}
      {toast&&(
        <div style={{position:"fixed",bottom:82,left:"50%",transform:"translateX(-50%)",zIndex:600,pointerEvents:"none",width:"calc(100% - 48px)",maxWidth:382}}>
          <div style={{background:toast.type==="err"?RE:GR,color:"#fff",borderRadius:12,padding:"12px 18px",fontSize:13,fontWeight:600,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.4)",animation:"slideUp .25s ease"}}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
