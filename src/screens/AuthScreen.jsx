import { useState } from "react";
import { auth, analytics, googleProvider, appleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, logEvent } from "../firebase.js";
import { SURF2, BORD, TXT, RE } from "../data/constants.js";
import { Btn } from "../components/ui.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";
import { LegalModal } from "../components/LegalModal.jsx";

var inputStyle={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 16px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"};
var errStyle={fontSize:13,color:RE,marginBottom:16,padding:"10px 14px",borderRadius:10,background:RE+"10",border:"1px solid "+RE+"30"};

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

  function handleApple(){
    setLoading(true);setError("");
    signInWithPopup(auth,appleProvider).then(function(r){
      logEvent(analytics,r.user.metadata.creationTime===r.user.metadata.lastSignInTime?"sign_up":"login",{method:"apple"});
    }).catch(function(e){
      var msg=e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request"?"Connexion annulée.":"Erreur Apple : "+e.message;
      setError(msg);setLoading(false);
    });
  }

  function handleForgot(){
    if(!email.trim()){setError("Entre ton e-mail ci-dessus.");return;}
    setLoading(true);setError("");
    sendPasswordResetEmail(auth,email).then(function(){
      setForgotSent(true);setLoading(false);
    }).catch(function(e){
      setError(e.code==="auth/user-not-found"?"Aucun compte avec cet e-mail.":"Erreur : "+e.message);
      setLoading(false);
    });
  }

  if(forgotMode){
    return(
      <div className="min-h-screen bg-bg flex flex-col px-6 pb-10">
        <LogoBar/>
        <div className="flex-1 flex flex-col justify-center pt-8">
          {forgotSent?(
            <>
              <div className="text-[48px] text-center mb-4">📧</div>
              <div className="text-[22px] font-extrabold text-txt text-center mb-2">E-mail envoyé !</div>
              <div className="text-sm text-sub text-center mb-8">Vérifie ta boîte de réception et clique sur le lien pour réinitialiser ton mot de passe.</div>
              <Btn label="Retour à la connexion" onClick={function(){setForgotMode(false);setForgotSent(false);setIsLogin(true);}} size="lg" full/>
            </>
          ):(
            <>
              <button onClick={function(){setForgotMode(false);setError("");}}
                className="bg-transparent border-none text-brand text-sm font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 p-0 mb-6">
                ← Retour
              </button>
              <div className="text-[28px] font-extrabold text-txt mb-1.5">Mot de passe oublié</div>
              <div className="text-sm text-sub mb-7">On t'envoie un lien de réinitialisation.</div>
              <div className={error?"mb-3":"mb-6"}>
                <label className="text-[12px] text-mut block mb-1.5">E-mail</label>
                <input value={email} onChange={function(e){setEmail(e.target.value);setError("");}} placeholder="votre@email.com" type="email" style={inputStyle}/>
              </div>
              {error&&<div style={errStyle}>{error}</div>}
              <Btn label={loading?"Envoi…":"Envoyer le lien"} onClick={handleForgot} size="lg" full/>
            </>
          )}
        </div>
        <LegalModal open={legal} onClose={function(){setLegal(null);}}/>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-bg flex flex-col px-6 pb-10">
      <LogoBar/>
      <div className="flex-1 flex flex-col justify-center pt-8">
        <div className="text-[28px] font-extrabold text-txt mb-1.5">{isLogin?"Bon retour !":"Créer un compte"}</div>
        <div className="text-sm text-sub mb-7">{isLogin?"Retrouve ton plan et tes stats.":"Gratuit · Sans carte bancaire"}</div>

        <button onClick={handleGoogle} disabled={loading}
          className="w-full py-[13px] rounded-xl bg-surf2 border border-bord text-txt text-sm font-semibold cursor-pointer font-[inherit] mb-2.5 flex items-center justify-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 40 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.2C37.3 38.8 44 33.8 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
          Continuer avec Google
        </button>

        <button onClick={handleApple} disabled={loading}
          className="w-full py-[13px] rounded-xl text-sm font-semibold cursor-pointer font-[inherit] mb-4 flex items-center justify-center gap-2.5"
          style={{background:"#fff",border:"1px solid #ddd",color:"#000"}}>
          <svg width="18" height="18" viewBox="0 0 814 1000"><path fill="#000" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-142.7-108.4c-33.7-55.7-52.3-117-52.3-175.2 0-201.3 130-307.1 257.7-307.1 69.1 0 126.4 45.3 170.1 45.3 42.1 0 108.2-47.2 183.1-47.2zm-126.7-153.2c34.4-39.7 60.3-95.2 60.3-150.6 0-7.8-.6-15.6-2-22.3-57.1 2.2-124.2 38.2-164.8 81.2-31.1 33.1-60.1 88.3-60.1 144.5 0 8.5 1.3 17 1.9 19.8 3.3.5 8.6 1.3 14 1.3 51.5.1 116.3-34.9 150.7-74z"/></svg>
          Continuer avec Apple
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex-1 h-px bg-bord"/><span className="text-[12px] text-mut">ou</span><div className="flex-1 h-px bg-bord"/>
        </div>

        <div className="mb-3">
          <label className="text-[12px] text-mut block mb-1.5">E-mail</label>
          <input value={email} onChange={function(e){setEmail(e.target.value);setError("");}} placeholder="votre@email.com" type="email" style={inputStyle}/>
        </div>
        <div className="mb-1">
          <label className="text-[12px] text-mut block mb-1.5">Mot de passe</label>
          <input value={password} onChange={function(e){setPassword(e.target.value);setError("");}} onKeyDown={function(e){if(e.key==="Enter")handleEmail();}} placeholder="••••••••" type="password" style={inputStyle}/>
        </div>

        {isLogin
          ?<div className={error?"text-right mb-2":"text-right mb-4"}>
            <span onClick={function(){setForgotMode(true);setForgotSent(false);setError("");}} className="text-[12px] text-brand cursor-pointer font-medium">Mot de passe oublié ?</span>
          </div>
          :<div className={error?"mb-2":"mb-4"}/>
        }
        {error&&<div style={errStyle}>{error}</div>}

        <Btn label={loading?"Chargement…":isLogin?"Se connecter":"Créer mon compte"} onClick={handleEmail} size="lg" full/>

        <div className="text-center mt-4 text-[13px] text-sub">
          {isLogin?"Pas encore de compte ? ":"Déjà un compte ? "}
          <span onClick={function(){setIsLogin(!isLogin);setError("");}} className="text-brand font-semibold cursor-pointer">
            {isLogin?"S'inscrire":"Se connecter"}
          </span>
        </div>
        <div className="text-center mt-7 text-[11px] text-mut leading-relaxed">
          En continuant, tu acceptes nos{" "}
          <span onClick={function(){setLegal("cgu");}} className="text-sub underline cursor-pointer">CGU</span>
          {" "}et notre{" "}
          <span onClick={function(){setLegal("confidentialite");}} className="text-sub underline cursor-pointer">Politique de confidentialité</span>
        </div>
      </div>
      <LegalModal open={legal} onClose={function(){setLegal(null);}}/>
    </div>
  );
}
