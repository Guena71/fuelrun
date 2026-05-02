import { useState } from "react";
import { auth, analytics, googleProvider, appleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, logEvent } from "../firebase.js";
import { BG, SURF2, BORD, TXT, SUB, MUT, OR, RE } from "../data/constants.js";
import { Btn } from "../components/ui.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { LegalModal } from "../components/LegalModal.jsx";

export function AuthScreen(){
  var [isLogin,setIsLogin]=useState(false);
  var [email,setEmail]=useState("");
  var [password,setPassword]=useState("");
  var [error,setError]=useState("");
  var [loading,setLoading]=useState(false);
  var [forgotMode,setForgotMode]=useState(false);
  var [forgotSent,setForgotSent]=useState(false);
  var [legal,setLegal]=useState(null);


  function handleEmail(){
    if(!email.trim()||!password.trim()){setError("Remplis tous les champs.");return;}
    setLoading(true);setError("");
    var fn=isLogin?signInWithEmailAndPassword:createUserWithEmailAndPassword;
    fn(auth,email,password).then(function(){
      logEvent(analytics,isLogin?"login":"sign_up",{method:"email"});
    }).catch(function(e){
      var msg=e.code==="auth/email-already-in-use"?"Email déjà utilisé.":e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Mot de passe incorrect.":e.code==="auth/user-not-found"?"Compte introuvable.":e.code==="auth/weak-password"?"Mot de passe trop court (6 car. min).":"Erreur : "+e.message;
      setError(msg);setLoading(false);
    });
  }

  function handleGoogle(){
    setLoading(true);setError("");
    signInWithPopup(auth,googleProvider).then(function(r){
      logEvent(analytics,r.user.metadata.creationTime===r.user.metadata.lastSignInTime?"sign_up":"login",{method:"google"});
    }).catch(function(e){setError(e.message);setLoading(false);});
  }

  var isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  var isPWA=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;

  function handleApple(){
    if(isIOS&&isPWA){
      setError("Apple Sign-In n'est pas disponible dans l'app installée sur iOS. Utilise l'e-mail ou ouvre fuelrun.vercel.app dans Safari.");
      return;
    }
    setLoading(true);setError("");
    signInWithPopup(auth,appleProvider).then(function(r){
      logEvent(analytics,r.user.metadata.creationTime===r.user.metadata.lastSignInTime?"sign_up":"login",{method:"apple"});
    }).catch(function(e){
      setLoading(false);
      if(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request")return;
      setError("Erreur Apple ["+e.code+"] : "+e.message);
    });
  }

  function handleForgot(){
    if(!email.trim()){setError("Entre ton e-mail ci-dessus.");return;}
    setLoading(true);setError("");
    sendPasswordResetEmail(auth,email,{url:"https://fuelrun.vercel.app",handleCodeInApp:false}).then(function(){
      setForgotSent(true);setLoading(false);
    }).catch(function(e){
      var msg=e.code==="auth/user-not-found"||e.code==="auth/invalid-email"?"Aucun compte avec cet e-mail.":"Erreur : "+e.message;
      setError(msg);setLoading(false);
    });
  }

  if(forgotMode){
    return(
      <div style={{height:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 24px",overflow:"hidden"}}>

        <LogoBar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
          {forgotSent?(
            <>
              <div style={{fontSize:48,textAlign:"center",marginBottom:16}}>📧</div>
              <div style={{fontSize:22,fontWeight:800,color:TXT,textAlign:"center",marginBottom:8}}>E-mail envoyé !</div>
              <div style={{fontSize:14,color:SUB,textAlign:"center",marginBottom:32}}>Vérifie ta boîte de réception et clique sur le lien pour réinitialiser ton mot de passe.</div>
              <Btn label="Retour à la connexion" onClick={function(){setForgotMode(false);setForgotSent(false);setIsLogin(true);}} size="lg" full/>
            </>
          ):(
            <>
              <button onClick={function(){setForgotMode(false);setError("");}} style={{background:"none",border:"none",color:OR,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:0,marginBottom:24}}>← Retour</button>
              <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:6}}>Mot de passe oublié</div>
              <div style={{fontSize:14,color:SUB,marginBottom:28}}>On t'envoie un lien de réinitialisation.</div>
              <div style={{marginBottom:error?12:24}}>
                <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>E-mail</label>
                <input value={email} onChange={function(e){setEmail(e.target.value);setError("");}} placeholder="votre@email.com" type="email" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              </div>
              {error?<div style={{fontSize:13,color:RE,marginBottom:16,padding:"10px 14px",borderRadius:10,background:RE+"10",border:"1px solid "+RE+"30"}}>{error}</div>:null}
              <Btn label={loading?"Envoi…":"Envoyer le lien"} onClick={handleForgot} size="lg" full/>
            </>
          )}
        </div>
        <LegalModal open={legal} onClose={function(){setLegal(null);}}/>
      </div>
    );
  }

  return(
    <div style={{height:"100vh",background:BG,display:"flex",flexDirection:"column",padding:"0 24px 24px",overflow:"hidden"}}>

      <LogoBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:6}}>{isLogin?"Bon retour !":"Créer un compte"}</div>
        <div style={{fontSize:14,color:SUB,marginBottom:28}}>{isLogin?"Retrouve ton plan et tes stats.":"Gratuit · Sans carte bancaire"}</div>

        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 40 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.2C37.3 38.8 44 33.8 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
          Continuer avec Google
        </button>

        <button onClick={handleApple} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:"#fff",border:"1px solid #ddd",color:"#000",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="14" height="18" viewBox="0 0 384 512" fill="#000"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
          Continuer avec Apple
        </button>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:BORD}}/><span style={{fontSize:12,color:MUT}}>ou</span><div style={{flex:1,height:1,background:BORD}}/>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>E-mail</label>
          <input value={email} onChange={function(e){setEmail(e.target.value);setError("");}} placeholder="votre@email.com" type="email" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        </div>
        <div style={{marginBottom:4}}>
          <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Mot de passe</label>
          <input value={password} onChange={function(e){setPassword(e.target.value);setError("");}} onKeyDown={function(e){if(e.key==="Enter")handleEmail();}} placeholder="••••••••" type="password" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        </div>
        {isLogin?<div style={{textAlign:"right",marginBottom:error?8:16}}><span onClick={function(){setForgotMode(true);setForgotSent(false);setError("");}} style={{fontSize:12,color:OR,cursor:"pointer",fontWeight:500}}>Mot de passe oublié ?</span></div>:<div style={{marginBottom:error?8:16}}/>}
        {error?<div style={{fontSize:13,color:RE,marginBottom:16,padding:"10px 14px",borderRadius:10,background:RE+"10",border:"1px solid "+RE+"30"}}>{error}</div>:null}

        <Btn label={loading?"Chargement…":isLogin?"Se connecter":"Créer mon compte"} onClick={handleEmail} size="lg" full/>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:SUB}}>
          {isLogin?"Pas encore de compte ? ":"Déjà un compte ? "}
          <span onClick={function(){setIsLogin(!isLogin);setError("");}} style={{color:OR,fontWeight:600,cursor:"pointer"}}>{isLogin?"S'inscrire":"Se connecter"}</span>
        </div>
        <div style={{textAlign:"center",marginTop:28,fontSize:11,color:MUT,lineHeight:1.6}}>
          En continuant, tu acceptes nos{" "}
          <span onClick={function(){setLegal("cgu");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>CGU</span>
          {" "}et notre{" "}
          <span onClick={function(){setLegal("confidentialite");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>Politique de confidentialité</span>
          {" · "}
          <span onClick={function(){setLegal("mentions");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>Mentions légales</span>
        </div>
      </div>
      <LegalModal open={legal} onClose={function(){setLegal(null);}}/>
    </div>
  );
}
