import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { auth, db, analytics, signOut, onAuthStateChanged, getRedirectResult, logEvent, doc, setDoc, getDoc, deleteDoc, deleteUser } from "./firebase.js";
import { BG, SURF, BORD, OR, GR, RE } from "./data/constants.js";
import { ls, lsSet } from "./utils/storage.js";
import { checkNewBadges, getWeeklyContractKey, sessionXP, xpToLevel, generateWeeklyChallenge, challengeProgress } from "./utils/gamification.js";
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
  {path:"/training", label:"Plan",    icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>;}},
  {path:"/suivi",    label:"Suivi",   icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}},
  {path:"/courses",  label:"Courses", icon:function(c){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 13 6 13s6-7.7 6-13c0-3.3-2.7-6-6-6z" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="8" r="2" stroke={c} strokeWidth="1.8"/></svg>;}},
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
  var [step,setStep]=useState(0);
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
  var [race,setRaceRaw]=useState(null);
  var [stats,setStatsRaw]=useState({sessions:0,km:0,streak:0});
  var today=new Date().toISOString().slice(0,10);
  var [wellbeing,setWellbeingRaw]=useState(null);
  var [showCheckin,setShowCheckin]=useState(false);
  var [entries,setEntriesRaw]=useState(function(){return ls("fr_entries",{});});
  var [showGuide,setShowGuide]=useState(false);
  var [showPricing,setShowPricing]=useState(false);
  var [journalPreselect,setJournalPreselect]=useState(null);
  var [toast,setToast]=useState(null);
  var [gamification,setGamRaw]=useState({xp:0,badges:[],contract:null,contractsKept:0,bossKills:0});
  var [xpPopup,setXpPopup]=useState(null);
  var [coachContext,setCoachContext]=useState(null);
  function showToast(msg,type){setToast({msg:msg,type:type||"ok"});setTimeout(function(){setToast(null);},3500);}

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


  // Stripe return URL handling
  useEffect(function(){
    var params=new URLSearchParams(window.location.search);
    var checkout=params.get("checkout");
    if(checkout==="success"){
      var plan=params.get("plan")||"pro";
      lsSet("fr_checkout_plan",plan);
      showToast("Abonnement "+plan+" activé — 14 jours gratuits !","ok");
      logEvent(analytics,"purchase",{plan:plan});
      navigate(location.pathname,{replace:true});
    }
    if(checkout==="cancel"){
      navigate(location.pathname,{replace:true});
    }
  },[]);

  // Applique le plan dès que le profil est chargé après un paiement
  useEffect(function(){
    if(!profile)return;
    var pendingPlan=ls("fr_checkout_plan",null);
    if(!pendingPlan)return;
    lsSet("fr_checkout_plan",null);
    var updated=Object.assign({},profile,{plan:pendingPlan});
    setProfile(updated);
    showToast("Plan "+pendingPlan+" déverrouillé ✓","ok");
  },[profile]);

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
      setUser(u);
      fsGet(u.uid).then(function(data){
        if(data&&data.profile){
          setProfileRaw(data.profile);
          setRaceRaw(data.race||null);
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
  function setRace(v){setRaceRaw(v);if(user)fsSave(user.uid,{race:v});}
  function setStats(fn){setStatsRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{stats:next});return next;});}
  function setWellbeing(wb){setWellbeingRaw(wb);if(user)fsSave(user.uid,{wellbeing:wb?{date:today,data:wb}:null});}
  function setGamification(fn){setGamRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;if(user)fsSave(user.uid,{gamification:next});return next;});}

  function addXP(amount,label){
    setGamification(function(g){return Object.assign({},g,{xp:(g.xp||0)+amount});});
    setXpPopup({amount:amount,label:label||"",ts:Date.now()});
    setTimeout(function(){setXpPopup(null);},2000);
  }

  function addSession(km,session){
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
    if(!gamification.challengeCredited){
      // +1 session / +km simulé car la nouvelle entrée n'est pas encore dans l'état
      var fakeEntries=Object.assign({},entries,{[new Date().toDateString()]:{done:true,km:km}});
      var prog=challengeProgress(fakeEntries,wk,chal);
      if(prog>=chal.target){
        setGamification(function(g){return Object.assign({},g,{contractsKept:(g.contractsKept||0)+1,challengeCredited:true});});
        addXP(chal.xp,"Challenge relevé !");
        showToast("🏆 Challenge de la semaine relevé ! +"+chal.xp+" XP","ok");
      }
    }
  }

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
    setProfile(prof);setRace(d.race);
    if(user){
      fsSave(user.uid,{email:user.email||null,profile:prof,race:d.race||null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
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
    if(user)fsSave(user.uid,{profile:null,race:null,stats:{sessions:0,km:0,streak:0},wellbeing:null});
    setProfileRaw(null);setRaceRaw(null);setStatsRaw({sessions:0,km:0,streak:0});
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
  function openCoach(ctx){setCoachContext(ctx||null);navigate("/coach");}
  var CONTEXT_LABELS={"/home":"l'accueil","/courses":"la page Courses","/training":"la page Plan d'entraînement","/suivi":"la page Suivi","/journal":"le Journal"};

  return(
    <div style={{background:BG,minHeight:"100vh",display:"flex",justifyContent:"center",overflowX:"hidden",maxWidth:"100vw"}}>
      <div style={{width:"100%",maxWidth:430,background:BG,height:"100vh",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",overflowX:"hidden",touchAction:"pan-y",paddingBottom:80,isolation:"isolate"}}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace/>}/>
            <Route path="/home" element={
              <HomeScreen profile={profile} race={race} stats={stats} entries={entries} wellbeing={wellbeing}
                gamification={gamification}
                onCheckin={function(){setShowCheckin(true);}}
                onShowPricing={goPrice}
                onGoToProfile={function(){navigate("/profile");}}
                onGoToJournal={function(km){setJournalPreselect({date:new Date(),km:km});navigate("/journal");}}
                onGoToSuivi={function(){navigate("/suivi");}}
                onSignOut={function(){signOut(auth);}}
              />
            }/>
            <Route path="/courses" element={
              <CoursesScreen profile={profile} race={race}
                setRace={function(r){setRace(r);if(r)setTimeout(function(){navigate("/training");},300);}}
                onAddCustom={function(r){setRace(r);}}
              />
            }/>
            <Route path="/training" element={
              <TrainingScreen profile={profile} race={race} setRace={setRace}
                entries={entries}
                gamification={gamification}
                onGoToCourses={function(){navigate("/courses");}}
                onShowPricing={goPrice}
                onBossKill={onBossKill}
              />
            }/>
            <Route path="/suivi" element={
              <SuiviScreen profile={profile} race={race} stats={stats} entries={entries}
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
                context={coachContext}
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
                onNewRace={function(){setRace(null);if(user)fsSave(user.uid,{race:null});navigate("/courses");}}
                onReset={handleReset}
                onSignOut={function(){signOut(auth);}}
                onDeleteAccount={handleDeleteAccount}
                onShowPricing={goPrice}
                onEnablePush={enablePush}
                onDisablePush={disablePush}
                onImport={function(data){
                  setProfile(data.profile);
                  if(data.race)setRace(data.race);
                  if(data.stats)setStatsRaw(data.stats);
                  if(data.entries)setEntries(data.entries);
                  if(user)fsSave(user.uid,{profile:data.profile,race:data.race||null,stats:data.stats||{sessions:0,km:0,streak:0},entries:data.entries||{}});
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
        {/* ── Floating coach button (visible on all non-coach tabs) ── */}
        {curPath!=="/coach"&&NAV.some(function(n){return n.path===curPath;})&&(
          <button className="coach-fab" onClick={function(){openCoach(CONTEXT_LABELS[curPath]||null);}} style={{position:"fixed",bottom:72,right:"calc(50% - 215px + 16px)",width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,"+OR+","+OR+"bb)",border:"none",cursor:"pointer",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
            🏃
          </button>
        )}
      </div>

      {showPricing&&(
        <div style={{position:"fixed",inset:0,background:BG,zIndex:450,overflowY:"auto"}}>
          <PricingScreen user={user} onClose={function(){setShowPricing(false);}} onStart={function(){
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
            <span style={{fontSize:18}}>⭐</span>+{xpPopup.amount} XP{xpPopup.label?" · "+xpPopup.label:""}
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
    </div>
  );
}
