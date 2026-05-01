import { useState, useEffect } from "react";
function stripMd(t){return(t||"").replace(/\*+/g,"").replace(/_([^_\n]*)_/g,"$1").replace(/  +/g," ").trim();}
// Capture synchronously at module load — before any effect or replaceState can clear the URL
var _checkoutPlan=(function(){try{var p=new URLSearchParams(window.location.search);if(p.get("checkout")==="success")return p.get("plan")||"essential";}catch(e){}return null;})();
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { auth, db, analytics, signOut, onAuthStateChanged, getRedirectResult, logEvent, doc, setDoc, getDoc, deleteDoc, deleteUser } from "./firebase.js";
import { BG, SURF, BORD, OR, GR, RE } from "./data/constants.js";
import { ls, lsSet } from "./utils/storage.js";
import { checkNewBadges, getWeeklyContractKey, sessionXP, xpToLevel, generateWeeklyChallenge, challengeProgress } from "./utils/gamification.js";
import { planLevel } from "./utils/nutrition.js";
import { stravaExchange, fetchStravaRuns, stravaActivitiesToEntries } from "./utils/strava.js";
import { RunnerHero } from "./components/RunnerHero.jsx";
import { CheckinModal } from "./components/CheckinModal.jsx";
import { OnboardingGuide } from "./components/OnboardingGuide.jsx";
import { HeroScreen } from "./components/HeroScreen.jsx";
import { AuthScreen } from "./screens/AuthScreen.jsx";
import { PricingScreen } from "./screens/PricingScreen.jsx";
import { Onboarding } from "./screens/Onboarding.jsx";
import { FirstRunScreen } from "./screens/FirstRunScreen.jsx";
import { HomeScreen } from "./screens/HomeScreen.jsx";
import { TrainingScreen } from "./screens/TrainingScreen.jsx";
import { CoursesScreen } from "./screens/CoursesScreen.jsx";
import { JournalScreen } from "./screens/JournalScreen.jsx";
import { SuiviScreen } from "./screens/SuiviScreen.jsx";
import { CoachScreen } from "./screens/CoachScreen.jsx";
import { ProfileScreen } from "./screens/ProfileScreen.jsx";

var NAV=[
  {path:"/home",     label:"Accueil", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11L12 3l9 8v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>;}},
  {path:"/coach",    label:"Coach",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 2H4a1 1 0 00-1 1v12a1 1 0 001 1h3l3 4 3-4h7a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="9" cy="9" r="1" fill={c}/><circle cx="12" cy="9" r="1" fill={c}/><circle cx="15" cy="9" r="1" fill={c}/></svg>;}},
  {path:"/courses",  label:"Courses", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 13 6 13s6-7.7 6-13c0-3.3-2.7-6-6-6z" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="8" r="2" stroke={c} strokeWidth="1.8"/></svg>;}},
  {path:"/training", label:"Plan",    icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;}},
  {path:"/suivi",    label:"Suivi",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}},
];

function StravaCallbackScreen({onCode,onError}){
  var nav=useNavigate();
  useEffect(function(){
    var params=new URLSearchParams(window.location.search);
    var code=params.get("code");
    var error=params.get("error");
    if(error||!code){onError();nav("/profile",{replace:true});return;}
    onCode(code).finally(function(){nav("/profile",{replace:true});});
  },[]);
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0a",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"0 24px",textAlign:"center"}}>
        <div style={{fontSize:48}}>🔄</div>
        <div style={{fontSize:16,fontWeight:600,color:"#f0f0f0"}}>Connexion à Strava…</div>
        <div style={{fontSize:13,color:"#666"}}>Synchronisation de tes activités</div>
      </div>
    </div>
  );
}

function Splash(){
  var [step,setStep]=useState(function(){return ls("fr_returning",false)?2:0;});
  if(step===0)return <HeroScreen onCommencer={function(){setStep(1);}} onLogin={function(){setStep(2);}}/>;
  if(step===1)return <PricingScreen onStart={function(){setStep(2);}}/>;
  return <AuthScreen/>;
}

export default function App(){
  var navigate=useNavigate();
  var location=useLocation();
  var [authState,setAuthState]=useState("loading");
  var [user,setUser]=useState(null);
  var [profile,setProfileRaw]=useState(null);
  var [races,setRacesRaw]=useState([]);
  var [activeRaceId,setActiveRaceIdRaw]=useState(null);
  var [stats,setStatsRaw]=useState({sessions:0,km:0,streak:0});
  var today=new Date().toISOString().slice(0,10);
  var [wellbeing,setWellbeingRaw]=useState(null);
  var [showCheckin,setShowCheckin]=useState(false);
  var [entries,setEntriesRaw]=useState(function(){return ls("fr_entries",{});});
  var [showGuide,setShowGuide]=useState(false);
  var [showPricing,setShowPricing]=useState(false);
  var [journalPreselect,setJournalPreselect]=useState(null);
  var [toast,setToast]=useState(null);
  var [planAdaptModal,setPlanAdaptModal]=useState(null); // {oldKm, newKm, weeks}
  var [autoFeedback,setAutoFeedback]=useState(null); // {text, label, ts}
  var [weeklyRecap,setWeeklyRecap]=useState(function(){var wk=getWeeklyContractKey();return ls("fr_recap_week",null)===wk?ls("fr_recap_text",null):null;});
  var [dailyTip,setDailyTip]=useState(function(){return ls("fr_tip_date",null)===new Date().toISOString().slice(0,10)?ls("fr_tip_text",null):null;});
  var [gamification,setGamRaw]=useState({xp:0,badges:[],contract:null,contractsKept:0,bossKills:0});
  var [xpPopup,setXpPopup]=useState(null);
  // Plan détecté depuis l'URL Stripe au tout premier rendu (synchrone, avant les effets)
  var [checkoutPlan,setCheckoutPlan]=useState(function(){try{var _p=new URLSearchParams(window.location.search);if(_p.get("checkout")==="success")return _p.get("plan")||"essential";}catch(e){}return null;});
  // race dérivée de races + activeRaceId
  var race=races.find(function(r){return r.id===activeRaceId;})||races[0]||null;

  function showToast(msg,type){setToast({msg:msg,type:type||"ok"});setTimeout(function(){setToast(null);},3500);}

  function saveRaces(arr,aid){
    setRacesRaw(arr);
    setActiveRaceIdRaw(aid);
    if(user)fsSave(user.uid,{races:arr,activeRaceId:aid});
  }
  function addRace(r){
    var already=races.some(function(x){return x.id===r.id;});
    if(already){setActiveRaceIdRaw(r.id);if(user)fsSave(user.uid,{activeRaceId:r.id});return;}
    var next=races.concat([r]);
    saveRaces(next,r.id);
  }
  function removeRace(id){
    var next=races.filter(function(r){return r.id!==id;});
    var aid=activeRaceId===id?(next.length>0?next[0].id:null):activeRaceId;
    saveRaces(next,aid);
  }
  function setActiveRace(id){
    setActiveRaceIdRaw(id);
    if(user)fsSave(user.uid,{activeRaceId:id});
  }

  // ── Strava state (stored inside profile.strava) ──
  var stravaProfile=profile?profile.strava||null:null;

  async function handleStravaCallback(code){
    try{
      var data=await stravaExchange({grant_type:"authorization_code",code:code});
      var sp={
        accessToken:data.access_token,
        refreshToken:data.refresh_token,
        expiresAt:data.expires_at,
        athleteId:data.athlete?data.athlete.id:null,
        athleteName:data.athlete?(data.athlete.firstname+" "+data.athlete.lastname).trim():null,
        athleteAvatar:data.athlete?data.athlete.profile_medium:null,
      };
      var newProfile=Object.assign({},profile,{strava:sp});
      setProfile(newProfile);
      showToast("Strava connecté ✓ — synchronisation en cours…","ok");
      // Auto-sync recent runs
      var runs=await fetchStravaRuns(sp,function(refreshed){
        var up=Object.assign({},newProfile,{strava:refreshed});
        setProfile(up);
      });
      var newEntries=stravaActivitiesToEntries(runs);
      setEntries(function(prev){return Object.assign({},newEntries,prev);});// prev wins (manual data priority)
      adaptKmWeek(Object.assign({},newEntries,entries));
      showToast(runs.length+" sorties Strava importées ✓","ok");
      logEvent(analytics,"strava_connected",{runs:runs.length});
    }catch(e){
      showToast("Erreur Strava : "+e.message,"err");
    }
  }

  async function syncStrava(){
    if(!stravaProfile)return;
    try{
      showToast("Synchronisation Strava…","ok");
      var runs=await fetchStravaRuns(stravaProfile,function(refreshed){
        setProfile(Object.assign({},profile,{strava:refreshed}));
      });
      var newEntries=stravaActivitiesToEntries(runs);
      setEntries(function(prev){return Object.assign({},newEntries,prev);});
      adaptKmWeek(Object.assign({},newEntries,entries));
      showToast(runs.length+" sorties synchronisées ✓","ok");
    }catch(e){
      showToast("Erreur sync Strava : "+e.message,"err");
    }
  }

  function disconnectStrava(){
    var newProfile=Object.assign({},profile);
    delete newProfile.strava;
    setProfile(newProfile);
    showToast("Strava déconnecté","ok");
  }


  // Nettoyage URL Stripe au montage
  useEffect(function(){
    var co=new URLSearchParams(window.location.search).get("checkout");
    if(co==="success"||co==="cancel"){
      window.history.replaceState(null,"",window.location.pathname);
    }
    if(co==="success"){
      lsSet("fr_plan_sync_ts",0); // reset cooldown pour que l'auto-sync s'exécute
      if(_checkoutPlan)logEvent(analytics,"purchase",{plan:_checkoutPlan});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Retour du portail Stripe — synchroniser le plan actif
  useEffect(function(){
    var params=new URLSearchParams(location.search);
    if(params.get("portal")!=="done")return;
    if(!user||!profile)return;
    navigate(location.pathname,{replace:true});
    user.getIdToken().then(function(token){
      return fetch("/api/create-checkout-session",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({syncplan:true,uid:user.uid})
      });
    }).then(function(r){return r.json();}).then(function(data){
      if(data.plan&&data.plan!==profile.plan){
        setProfile(Object.assign({},profile,{plan:data.plan}));
        showToast("Formule mise à jour : "+data.plan+" ✓","ok");
      }
    }).catch(function(){});
  },[location.search,user,profile]);

  // Sync automatique du plan Stripe — attend que le profil soit chargé
  useEffect(function(){
    if(!user||!profile||location.pathname!=="/profile")return;
    var last=ls("fr_plan_sync_ts",0);
    if(Date.now()-last<120000)return; // cooldown 2 min
    lsSet("fr_plan_sync_ts",Date.now());
    user.getIdToken().then(function(token){
      return fetch("/api/create-checkout-session",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({syncplan:true,uid:user.uid})
      });
    }).then(function(r){return r.json();}).then(function(data){
      if(!data.plan)return;
      var lvl={gratuit:0,essential:1,pro:2};
      setProfileRaw(function(prev){
        if(!prev||prev.plan===data.plan)return prev;
        // Ne jamais rétrograder depuis l'auto-sync (les downgrades passent par le webhook/portail)
        if((lvl[data.plan]||0)<=(lvl[prev.plan]||0))return prev;
        var updated=Object.assign({},prev,{plan:data.plan});
        fsSave(user.uid,{profile:updated});
        showToast("Formule "+data.plan+" activée ✓","ok");
        return updated;
      });
    }).catch(function(){});
  },[location.pathname,user,profile]);

  // Applique le plan dès que le profil est chargé après un paiement + redirige vers profil
  useEffect(function(){
    if(!profile||!checkoutPlan)return;
    var plan=checkoutPlan;
    setCheckoutPlan(null);
    if(profile.plan!==plan)setProfile(Object.assign({},profile,{plan:plan}));
    showToast("Formule "+plan+" activée — 14 jours offerts ✓","ok");
    navigate("/profile",{replace:true});
  },[profile,checkoutPlan]);

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
    getRedirectResult(auth).then(function(r){
      if(r)logEvent(analytics,r.user.metadata.creationTime===r.user.metadata.lastSignInTime?"sign_up":"login",{method:"apple"});
    }).catch(function(e){
      showToast("Erreur Apple : "+e.code+" — "+e.message,"err");
    });
  },[]);

  useEffect(function(){
    var unsub=onAuthStateChanged(auth,function(u){
      if(!u){setUser(null);setAuthState("unauth");return;}
      lsSet("fr_returning",true);
      setUser(u);
      fsGet(u.uid).then(function(data){
        if(data&&data.profile){
          var prof=data.profile;
          // Applique le plan Stripe — utilise la variable module capturée avant tout replaceState
          if(_checkoutPlan){
            var _plan=_checkoutPlan;
            _checkoutPlan=null;
            if(prof.plan!==_plan){
              prof=Object.assign({},prof,{plan:_plan});
              setDoc(doc(db,"users",u.uid),{profile:prof},{merge:true}).catch(function(){});
            }
          }
          setProfileRaw(prof);
          // Migration : ancien champ race unique → tableau races
          if(data.races&&data.races.length>=0){
            setRacesRaw(data.races||[]);
            setActiveRaceIdRaw(data.activeRaceId||(data.races&&data.races[0]&&data.races[0].id)||null);
          } else if(data.race){
            setRacesRaw([data.race]);
            setActiveRaceIdRaw(data.race.id||null);
          }
          setStatsRaw(data.stats||{sessions:0,km:0,streak:0});
          var wb=data.wellbeing;
          setWellbeingRaw(wb&&wb.date===today?wb.data:null);
          if(data.gamification)setGamRaw(data.gamification);
          if(data.entries)setEntriesRaw(function(prev){return Object.assign({},data.entries,prev);});
          setAuthState("app");
        } else {
          setAuthState("onboarding");
        }
      }).catch(function(){setAuthState("onboarding");});
    });
    return unsub;
  },[]);

  function setProfile(v){setProfileRaw(v);if(user)fsSave(user.uid,{profile:v});}
  function setStats(fn){setStatsRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{stats:next});return next;});}
  function setWellbeing(wb){setWellbeingRaw(wb);if(user)fsSave(user.uid,{wellbeing:wb?{date:today,data:wb}:null});}
  function setGamification(fn){setGamRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{gamification:next});return next;});}

  function addXP(amount,label){
    setGamification(function(g){return Object.assign({},g,{xp:(g.xp||0)+amount});});
    setXpPopup({amount:amount,label:label||"",ts:Date.now()});
    setTimeout(function(){setXpPopup(null);},2000);
  }

  // Moyenne glissante des km/semaine sur les 8 dernières semaines complètes
  function rollingKmWeek(allEntries){
    var today=new Date();today.setHours(0,0,0,0);
    var dow=today.getDay()===0?6:today.getDay()-1;
    var thisWeekStart=new Date(today);thisWeekStart.setDate(thisWeekStart.getDate()-dow);
    var weekKms=[];
    for(var i=1;i<=8;i++){
      var wStart=new Date(thisWeekStart);wStart.setDate(wStart.getDate()-i*7);
      var wEnd=new Date(wStart);wEnd.setDate(wEnd.getDate()+6);
      var wkm=0;
      Object.entries(allEntries||{}).forEach(function(pair){var d=new Date(pair[0]);if(pair[1].done&&d>=wStart&&d<=wEnd)wkm+=parseFloat(pair[1].km)||0;});
      if(wkm>0)weekKms.push(wkm);
    }
    if(weekKms.length<3)return null;
    return {km:Math.round(weekKms.reduce(function(s,w){return s+w;},0)/weekKms.length),weeks:weekKms.length};
  }

  function adaptKmWeek(allEntries){
    var result=rollingKmWeek(allEntries);
    if(!result)return;
    var adapted=result.km;
    var current=parseFloat((profile&&profile.kmWeek)||25);
    if(Math.abs(adapted-current)/current>0.15){
      setProfile(Object.assign({},profile,{kmWeek:adapted}));
      setPlanAdaptModal({oldKm:current,newKm:adapted,weeks:result.weeks});
    }
  }

  function addSession(km,session,entry){
    var xp=session?sessionXP(session):50;
    setStats(function(s){
      var yesterday=new Date(new Date().setHours(0,0,0,0));
      yesterday.setDate(yesterday.getDate()-1);
      var yestKey=yesterday.toDateString();
      var hadYesterday=!!(entries&&entries[yestKey]&&entries[yestKey].done);
      return{sessions:s.sessions+1,km:s.km+(parseFloat(km)||0),streak:hadYesterday?s.streak+1:1};
    });
    addXP(xp,"Séance validée");
    logEvent(analytics,"session_logged",{km:km});
    // Vérifier si le challenge de la semaine est accompli
    var wk=getWeeklyContractKey();
    var chal=generateWeeklyChallenge(profile,wk);
    var fakeEntries=Object.assign({},entries,{[new Date().toDateString()]:{done:true,km:km}});
    if(!gamification.challengeCredited){
      var prog=challengeProgress(fakeEntries,wk,chal);
      if(prog>=chal.target){
        setGamification(function(g){return Object.assign({},g,{contractsKept:(g.contractsKept||0)+1,challengeCredited:true});});
        addXP(chal.xp,"Défi relevé !");
        showToast("🏆 Défi de la semaine relevé ! +"+chal.xp+" pts","ok");
      }
    }
    // Adapter le plan si la moyenne glissante diverge du profil
    adaptKmWeek(fakeEntries);
    // Analyse IA automatique post-séance (Pro uniquement)
    if(user&&session&&entry&&parseFloat(km)>0&&planLevel(profile)>=2){
      var diff=parseFloat(km)-(parseFloat(session.km)||0);
      var diffStr=diff>0.5?"+"+diff.toFixed(1)+"km vs prévu":diff<-0.5?diff.toFixed(1)+"km vs prévu":"dans les clous";
      var prompt="Séance '"+session.label+"' · Prévu: "+(session.km||"?")+"km"+(session.pace?" à "+session.pace+"/km":"")+". Réalisé: "+parseFloat(km).toFixed(1)+"km"+(entry.min?" en "+entry.min+"min":"")+" · Effort ressenti "+entry.rpe+"/10 · "+diffStr+". Donne un feedback court.";
      var sys="Tu es coach FuelRun. Feedback sincère, direct, motivant en 2-3 phrases max basé sur les données. Pas de généralités.";
      user.getIdToken().then(function(token){
        return fetch("/api/coach",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({system:sys,messages:[{role:"user",content:prompt}]})});
      }).then(function(r){return r.json();}).then(function(data){
        var text=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||null;
        if(text)setAutoFeedback({text:stripMd(text),label:session.label,ts:Date.now()});
      }).catch(function(){});
    }
  }

  // Récap hebdomadaire automatique (Essentiel+)
  useEffect(function(){
    if(!user||!profile||planLevel(profile)<1)return;
    var wk=getWeeklyContractKey();
    if(ls("fr_recap_week",null)===wk)return;
    var td=new Date();td.setHours(0,0,0,0);
    var dow=td.getDay()===0?6:td.getDay()-1;
    var wkS=new Date(td);wkS.setDate(wkS.getDate()-dow);
    var lwS=new Date(wkS);lwS.setDate(lwS.getDate()-7);
    var lwE=new Date(wkS);lwE.setDate(lwE.getDate()-1);
    var wKm=0,wSess=0,wRpes=[];
    Object.entries(entries||{}).forEach(function(pair){var d=new Date(pair[0]),e=pair[1];if(e.done&&d>=lwS&&d<=lwE){wKm+=parseFloat(e.km)||0;wSess++;if(e.rpe)wRpes.push(parseInt(e.rpe)||5);}});
    lsSet("fr_recap_week",wk);
    if(wSess===0)return;
    var avgRpe=wRpes.length?Math.round(wRpes.reduce(function(s,v){return s+v;},0)/wRpes.length*10)/10:null;
    var raceCtx=race?" Prépare "+race.name+" "+race.dist+"km.":"";
    var prompt=profile.name+", bilan semaine passée : "+wSess+" séance(s), "+Math.round(wKm)+"km (objectif "+profile.kmWeek+"km/sem)"+(avgRpe?", effort ressenti moyen "+avgRpe+"/10":"")+raceCtx+". Bilan + conseils semaine.";
    var sys="Coach FuelRun. Récap hebdo : 1 bilan concis, 1 point fort ou à corriger, 1 objectif pour cette semaine. 3 phrases max, direct et motivant.";
    user.getIdToken().then(function(tok){return fetch("/api/coach",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({system:sys,messages:[{role:"user",content:prompt}]})}).then(function(r){return r.json();}).then(function(data){var text=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||null;if(text){var clean=stripMd(text);lsSet("fr_recap_text",clean);setWeeklyRecap(clean);}}).catch(function(){});}).catch(function(){});
  },[user,profile]);

  // Conseil du jour automatique (Essentiel+)
  useEffect(function(){
    if(!user||!profile||planLevel(profile)<1)return;
    var td=new Date().toISOString().slice(0,10);
    if(ls("fr_tip_date",null)===td)return;
    lsSet("fr_tip_date",td);
    var raceCtx=race?", prépare "+race.name+" ("+race.dist+"km)":"";
    var prompt="Coureur "+profile.name+", niveau "+profile.level+", base "+profile.kmWeek+"km/sem"+raceCtx+". Conseil du jour.";
    var sys="Coach FuelRun. UN conseil pratique du jour en 1-2 phrases. Varie : nutrition, récupération, échauffement, mental, hydratation, technique. Concret, actionnable aujourd'hui.";
    user.getIdToken().then(function(tok){return fetch("/api/coach",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({system:sys,messages:[{role:"user",content:prompt}]})}).then(function(r){return r.json();}).then(function(data){var text=((data.choices||[])[0]||{}).message&&data.choices[0].message.content||null;if(text){var clean=stripMd(text);lsSet("fr_tip_text",clean);setDailyTip(clean);}}).catch(function(){});}).catch(function(){});
  },[user,profile]);

  function onBossKill(){
    setGamification(function(g){return Object.assign({},g,{bossKills:(g.bossKills||0)+1});});
    addXP(25,"Session boss !");
  }

  var VAPID_PUBLIC_KEY="BDnhMkrmir_7UMOVXnPOeMYv_e4h5lrvKLmb-I9VJyMUZPZDm7x9g1fqhFNZj7-csn6jAV6LuzCfJwRSpdLtO7k";
  var [pushEnabled,setPushEnabled]=useState(ls("fr_push_enabled",false));

  function urlBase64ToUint8Array(b64){
    var padding="=".repeat((4-b64.length%4)%4);
    var base64=(b64+padding).replace(/-/g,"+").replace(/_/g,"/");
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

  // ── Loading ──
  if(authState==="loading")return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <RunnerHero size={64}/>
        <div style={{fontSize:13,color:"#686868"}}>Chargement…</div>
      </div>
    </div>
  );

  if(authState==="unauth")return <Splash/>;

  if(authState==="onboarding"){return <Onboarding onDone={function(d){
    var prof={name:d.name,age:d.age,weight:d.weight,height:d.height,sex:d.sex,level:d.level,sessWeek:d.sessWeek,kmWeek:d.kmWeek,plan:ls("fr_pending_plan","gratuit")};
    var initRaces=d.race?[d.race]:[];
    var initActiveId=d.race?d.race.id:null;
    setProfile(prof);setRacesRaw(initRaces);setActiveRaceIdRaw(initActiveId);
    if(user){
      fsSave(user.uid,{email:user.email||null,profile:prof,races:initRaces,activeRaceId:initActiveId,stats:{sessions:0,km:0,streak:0},wellbeing:null});
      // Email de bienvenue (fire-and-forget)
      user.getIdToken&&user.getIdToken().then(function(tok){
        fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({type:"welcome",name:prof.name})}).catch(function(){});
      }).catch(function(){});
    }
    if(d.level==="starter"){setAuthState("firstrun");return;}
    setAuthState("app");
    navigate(d.race?"/training":"/home",{replace:true});
    if(!ls("fr_guide_done",false))setTimeout(function(){setShowGuide(true);},800);
  }}/>;}

  if(authState==="firstrun"){return <FirstRunScreen onStart={function(){
    setAuthState("app");
    navigate("/home",{replace:true});
    if(!ls("fr_guide_done",false))setTimeout(function(){setShowGuide(true);},800);
  }}/>;}


  if(!profile)return null;

  function handleReset(){
    if(user)fsSave(user.uid,{profile:null,races:[],activeRaceId:null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setProfileRaw(null);setRacesRaw([]);setActiveRaceIdRaw(null);setStatsRaw({sessions:0,km:0,streak:0});
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
  var curPath=location.pathname;
  return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",justifyContent:"center",overflowX:"hidden",maxWidth:"100vw"}}>
      <div style={{width:"100%",maxWidth:430,background:BG,height:"100vh",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
        <div id="main-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",paddingBottom:80,isolation:"isolate"}}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace/>}/>
            <Route path="/home" element={
              <HomeScreen profile={profile} race={race} stats={stats} entries={entries} wellbeing={wellbeing}
                gamification={gamification}
                user={user}
                autoFeedback={autoFeedback}
                onDismissAutoFeedback={function(){setAutoFeedback(null);}}
                weeklyRecap={stripMd(weeklyRecap)}
                onDismissWeeklyRecap={function(){setWeeklyRecap(null);}}
                dailyTip={stripMd(dailyTip)}
                onDismissDailyTip={function(){setDailyTip(null);}}
                onCheckin={function(){setShowCheckin(true);}}
                onShowPricing={goPrice}
                onGoToProfile={function(){navigate("/profile");}}
                onGoToJournal={function(km){setJournalPreselect({date:new Date(),km:km});navigate("/journal");}}
                onGoToSuivi={function(){navigate("/suivi");}}
                onGoToCoach={function(){navigate("/coach");}}
                onSignOut={function(){signOut(auth);}}
              />
            }/>
            <Route path="/courses" element={
              <CoursesScreen profile={profile} race={race} races={races}
                onAddRace={addRace}
                onRemoveRace={removeRace}
                onSetActiveRace={setActiveRace}
                onShowPricing={goPrice}
              />
            }/>
            <Route path="/training" element={
              <TrainingScreen profile={profile} race={race} setRace={function(r){if(r)addRace(r);else saveRaces([],null);}}
                entries={entries}
                wellbeing={wellbeing}
                onSetEntries={setEntries}
                onAddSession={addSession}
                gamification={gamification}
                onGoToCourses={function(){navigate("/courses");}}
                onShowPricing={goPrice}
                onBossKill={onBossKill}
              />
            }/>
            <Route path="/suivi" element={
              <SuiviScreen profile={profile} race={race} stats={stats} entries={entries}
                wellbeing={wellbeing}
                gamification={gamification}
                stravaProfile={stravaProfile}
                onStravaSync={syncStrava}
                onSetEntries={setEntries}
                onAddSession={addSession}
                onOpenJournal={function(){navigate("/journal");}}
                onShowPricing={goPrice}
              />
            }/>
            <Route path="/journal" element={
              <JournalScreen race={race} profile={profile} entries={entries}
                onSetEntries={setEntries}
                onAddSession={addSession}
                onShowPricing={goPrice}
                preselect={journalPreselect}
                onClearPreselect={function(){setJournalPreselect(null);}}
              />
            }/>
            <Route path="/coach" element={
              <CoachScreen profile={profile} race={race} user={user} entries={entries} wellbeing={wellbeing}
                gamification={gamification} stats={stats}
                context={null}
                onShowPricing={goPrice}
              />
            }/>
            <Route path="/profile" element={
              <ProfileScreen profile={profile} race={race} stats={stats} entries={entries} user={user}
                pushEnabled={pushEnabled}
                stravaProfile={stravaProfile}
                onStravaSync={syncStrava}
                onStravaDisconnect={disconnectStrava}
                onBack={function(){navigate("/home");}}
                onToast={showToast}
                onUpdate={function(form){setProfile(Object.assign({},profile,form));}}
                onNewRace={function(){navigate("/courses");}}
                onReset={handleReset}
                onSignOut={function(){signOut(auth);}}
                onDeleteAccount={handleDeleteAccount}
                onShowPricing={goPrice}
                onEnablePush={enablePush}
                onDisablePush={disablePush}
                onImport={function(data){
                  setProfile(data.profile);
                  if(data.race){var ir=[data.race];setRacesRaw(ir);setActiveRaceIdRaw(data.race.id);}
                  if(data.stats)setStatsRaw(data.stats);
                  if(data.entries)setEntries(data.entries);
                  if(user){var importRaces=data.race?[data.race]:[];var importAid=data.race?data.race.id:null;fsSave(user.uid,{profile:data.profile,races:importRaces,activeRaceId:importAid,stats:data.stats||{sessions:0,km:0,streak:0},entries:data.entries||{}});}
                  showToast("Import réussi ✓","ok");
                }}
                onSaveError={function(msg){showToast(msg,"err");}}
              />
            }/>
            <Route path="/strava-callback" element={<StravaCallbackScreen onCode={handleStravaCallback} onError={function(){showToast("Connexion Strava annulée","err");}}/>}/>
            <Route path="*" element={<Navigate to="/home" replace/>}/>
          </Routes>
        </div>

        {/* ── Bottom nav bar ── */}
        {NAV.some(function(n){return n.path===curPath;})&&(
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:SURF,borderTop:"1px solid "+BORD,display:"flex",zIndex:100,paddingBottom:"max(4px, env(safe-area-inset-bottom, 4px))"}}>
            {NAV.map(function(n){var active=curPath===n.path;var color=active?OR:"#686868";return(
              <button key={n.path} onClick={function(){navigate(n.path);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,paddingTop:8,paddingBottom:4,cursor:"pointer",background:"transparent",border:"none",position:"relative"}}>
                {n.icon(color)}
                <span style={{fontSize:9,fontWeight:active?600:400,color:color,letterSpacing:0.2}}>{n.label}</span>
                {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2.5,background:OR,borderRadius:"0 0 3px 3px"}}/>}
              </button>
            );})}
          </div>
        )}
      </div>

      {showPricing&&(
        <div style={{position:"fixed",inset:0,background:BG,zIndex:450,overflowY:"auto"}}>
          <PricingScreen user={user} currentPlan={profile?profile.plan:"gratuit"} onClose={function(){setShowPricing(false);}} onUpgrade={function(plan){
            setProfile(Object.assign({},profile,{plan:plan}));
            setShowPricing(false);
            showToast("Formule "+plan+" activée ✓","ok");
            navigate("/profile",{replace:true});
          }} onStart={function(){
            var chosen=ls("fr_pending_plan","gratuit");
            setProfile(Object.assign({},profile,{plan:chosen}));
            setShowPricing(false);
            showToast("Formule mise à jour ✓","ok");
          }}/>
        </div>
      )}
      {showCheckin?<CheckinModal onDone={function(wb){setWellbeing(wb);setShowCheckin(false);}} onClose={function(){setShowCheckin(false);}}/>:null}
      {showGuide?<OnboardingGuide onDone={function(){lsSet("fr_guide_done",true);setShowGuide(false);}} onTab={function(path){navigate(path);}}/>:null}
      {xpPopup&&(
        <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:700,pointerEvents:"none",animation:"slideUp .3s ease"}}>
          <div style={{background:"linear-gradient(135deg,"+OR+"ee,"+OR+"bb)",color:"#fff",borderRadius:20,padding:"8px 18px",fontSize:14,fontWeight:700,boxShadow:"0 4px 16px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
            <span style={{fontSize:18}}>⭐</span>+{xpPopup.amount} pts{xpPopup.label?" · "+xpPopup.label:""}
          </div>
        </div>
      )}
      {toast&&(
        <div style={{position:"fixed",bottom:82,left:"50%",transform:"translateX(-50%)",zIndex:600,pointerEvents:"none",width:"calc(100% - 48px)",maxWidth:382}}>
          <div style={{background:toast.type==="err"?RE:GR,color:"#fff",borderRadius:12,padding:"12px 18px",fontSize:13,fontWeight:600,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.4)",animation:"slideUp .3s ease"}}>
            {toast.msg}
          </div>
        </div>
      )}
      {planAdaptModal&&(
        <div style={{position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={function(){setPlanAdaptModal(null);}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}}/>
          <div style={{position:"relative",width:"100%",maxWidth:430,background:"#1a1a1a",borderRadius:"20px 20px 0 0",padding:"28px 24px 40px",boxShadow:"0 -8px 40px rgba(0,0,0,0.6)"}} onClick={function(e){e.stopPropagation();}}>
            <div style={{width:40,height:4,background:"#444",borderRadius:2,margin:"0 auto 24px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:28}}>🔄</span>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:"#f0f0f0"}}>Plan mis à jour</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Basé sur tes {planAdaptModal.weeks} dernières semaines réelles</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,margin:"24px 0",padding:"20px",background:"#252525",borderRadius:14}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,color:"#888",marginBottom:4}}>Avant</div>
                <div style={{fontSize:28,fontWeight:700,color:"#686868"}}>{planAdaptModal.oldKm}</div>
                <div style={{fontSize:11,color:"#686868"}}>km / sem</div>
              </div>
              <div style={{fontSize:24,color:OR}}>→</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,color:"#888",marginBottom:4}}>Maintenant</div>
                <div style={{fontSize:28,fontWeight:700,color:OR}}>{planAdaptModal.newKm}</div>
                <div style={{fontSize:11,color:OR}}>km / sem</div>
              </div>
            </div>
            <div style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:24,lineHeight:1.5}}>
              Ton plan d'entraînement a été recalibré pour correspondre à ton volume réel.
            </div>
            <button onClick={function(){setPlanAdaptModal(null);}} style={{width:"100%",padding:"15px",background:OR,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              Compris ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
