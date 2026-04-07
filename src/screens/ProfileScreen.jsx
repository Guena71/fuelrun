import { useState, useRef } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "../firebase.js";
import { SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { LEVELS, LEVEL_LABELS } from "../data/training.js";
import { PLANS } from "../data/plans.js";
import { calcVdot, vdotToPaces } from "../utils/vdot.js";
import { planLevel } from "../utils/nutrition.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";
import { LegalModal } from "../components/LegalModal.jsx";

var inputSt={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"};
var inputPwd={width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 14px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"};

export function ProfileScreen(p){
  var [editing,setEditing]=useState(false);
  var [form,setForm]=useState({name:p.profile.name||"",age:p.profile.age||"",weight:p.profile.weight||"",height:p.profile.height||"",sex:p.profile.sex||"M",level:p.profile.level||"beginner",sessWeek:p.profile.sessWeek||3,kmWeek:p.profile.kmWeek||25});
  var [showVdot,setShowVdot]=useState(false);
  var [vdotDist,setVdotDist]=useState("10");
  var [vdotTime,setVdotTime]=useState("");
  var [vdotResult,setVdotResult]=useState(null);
  var [showResetModal,setShowResetModal]=useState(false);
  var [showDeleteModal,setShowDeleteModal]=useState(false);
  var [showVdotUpgrade,setShowVdotUpgrade]=useState(false);
  var [legalOpen,setLegalOpen]=useState(null);
  var [showPwdModal,setShowPwdModal]=useState(false);
  var [pwdCurrent,setPwdCurrent]=useState("");
  var [pwdNew,setPwdNew]=useState("");
  var [pwdConfirm,setPwdConfirm]=useState("");
  var [pwdError,setPwdError]=useState("");
  var [pwdLoading,setPwdLoading]=useState(false);
  var [pwdDone,setPwdDone]=useState(false);
  var levelRef=useRef(null);
  function save(){p.onUpdate(form);setEditing(false);}
  var isEmailUser=p.user&&p.user.providerData&&p.user.providerData.some(function(pd){return pd.providerId==="password";});
  function handleChangePwd(){
    if(!pwdCurrent||!pwdNew||!pwdConfirm){setPwdError("Remplis tous les champs.");return;}
    if(pwdNew.length<6){setPwdError("Le nouveau mot de passe doit faire au moins 6 caractères.");return;}
    if(pwdNew!==pwdConfirm){setPwdError("Les mots de passe ne correspondent pas.");return;}
    setPwdLoading(true);setPwdError("");
    var cred=EmailAuthProvider.credential(p.user.email,pwdCurrent);
    reauthenticateWithCredential(p.user,cred).then(function(){
      return updatePassword(p.user,pwdNew);
    }).then(function(){
      setPwdDone(true);setPwdLoading(false);
    }).catch(function(e){
      var msg=e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Mot de passe actuel incorrect.":"Erreur : "+e.message;
      setPwdError(msg);setPwdLoading(false);
    });
  }
  function cycleLevel(){var ids=LEVELS.map(function(l){return l.id;});var cur=p.profile.level||"beginner";var idx=ids.indexOf(cur);var next=ids[(idx+1)%ids.length];p.onUpdate({level:next});if(p.onToast){var lbl=LEVELS.find(function(l){return l.id===next;});p.onToast((lbl?lbl.emoji+" "+lbl.label:"Niveau mis à jour")+" ✓");}}
  function field(label,key,type,placeholder){
    return(
      <div className="mb-3">
        <label className="text-[12px] text-mut block mb-[5px]">{label}</label>
        <input value={form[key]} onChange={function(e){setForm(function(f){return Object.assign({},f,{[key]:e.target.value});});}} type={type||"text"} placeholder={placeholder} style={inputSt}/>
      </div>
    );
  }
  var stats=[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km)+" km",color:BL},{label:"Streak",value:p.stats.streak+" j",color:YE}];
  return(
    <><div><LogoBar/>
      <div className="px-4 pt-5 pb-20">
        <button onClick={function(){p.onBack&&p.onBack();}}
          className="bg-transparent border-none text-[13px] font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 pb-4"
          style={{color:OR}}>← Accueil</button>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[22px] font-bold"
              style={{background:"linear-gradient(135deg,"+OR+"44,#1a0800)",border:"2px solid "+OR+"55",color:OR}}>
              {(p.profile.name||"?").split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div className="text-[20px] font-bold text-txt">{p.profile.name||"Coureur"}</div>
              <button onClick={function(){cycleLevel();}}
                className="text-[13px] mt-1 cursor-pointer inline-flex items-center gap-1 px-2 py-[2px] rounded-lg font-[inherit]"
                style={{color:OR,background:OR+"15",border:"1px solid "+OR+"33"}}>
                {LEVEL_LABELS[p.profile.level]||""} <span className="text-[10px]">↻</span>
              </button>
            </div>
          </div>
          {editing&&(
            <button onClick={function(){setEditing(false);setForm({name:p.profile.name||"",age:p.profile.age||"",weight:p.profile.weight||"",height:p.profile.height||"",sex:p.profile.sex||"M",sessWeek:p.profile.sessWeek||3,kmWeek:p.profile.kmWeek||25});}}
              className="px-4 py-[7px] rounded-[20px] text-[12px] font-semibold cursor-pointer font-[inherit]"
              style={{background:SURF2,border:"1px solid "+BORD,color:SUB}}>
              Annuler
            </button>
          )}
        </div>

        {(function(){
          var pl=PLANS.find(function(x){return x.id===(p.profile.plan||"gratuit");});
          if(!pl)return null;
          return(
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-3.5"
              style={{background:pl.color+"14",border:"1px solid "+pl.color+"33"}}>
              <div className="flex items-center gap-2">
                <span className="text-[16px]">⭐</span>
                <div>
                  <div className="text-[12px] text-mut">Formule actuelle</div>
                  <div className="text-[14px] font-bold" style={{color:pl.color}}>{pl.name}</div>
                </div>
              </div>
              <button onClick={function(){p.onShowPricing&&p.onShowPricing();}}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer font-[inherit]"
                style={{background:pl.id==="gratuit"?OR:SURF2,border:"1px solid "+(pl.id==="gratuit"?OR:BORD),color:pl.id==="gratuit"?"#fff":SUB}}>
                {pl.id==="gratuit"?"Upgrader":"Changer"}
              </button>
            </div>
          );
        })()}

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {stats.map(function(s,i){return(
            <div key={i} className="bg-surf border border-bord rounded-2xl px-2 py-3 text-center">
              <div className="text-[20px] font-extrabold" style={{color:s.color}}>{s.value}</div>
              <div className="text-[10px] text-mut mt-1 uppercase tracking-[0.5px]">{s.label}</div>
            </div>
          );})}
        </div>

        <div ref={levelRef} className="mb-3.5">
          <div className="text-[12px] text-mut font-semibold uppercase tracking-[0.5px] mb-2">Niveau</div>
          <div className="flex gap-1.5 flex-wrap">
            {LEVELS.map(function(l){var on=(p.profile.level||"beginner")===l.id;return(
              <button key={l.id} onClick={function(){p.onUpdate({level:l.id});}}
                className="flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] cursor-pointer font-[inherit]"
                style={{border:"1.5px solid "+(on?OR:BORD),background:on?OR+"18":"transparent"}}>
                <span className="text-[14px]">{l.emoji}</span>
                <span className="text-[12px]" style={{fontWeight:on?700:400,color:on?OR:SUB}}>{l.label}</span>
              </button>
            );})}
          </div>
        </div>

        {!editing?(
          <Card onClick={function(){setEditing(true);}} style={{marginBottom:16,cursor:"pointer"}}>
            <div className="flex justify-between items-center px-[18px] py-2.5 border-b border-bord">
              <span className="text-[11px] text-mut font-semibold uppercase tracking-[0.5px]">Mes informations</span>
              <span className="text-[11px] font-semibold" style={{color:OR}}>Modifier ✎</span>
            </div>
            {[
              {label:"Prénom",           value:p.profile.name},
              {label:"Âge",              value:p.profile.age+" ans"},
              {label:"Poids",            value:p.profile.weight+" kg"},
              {label:"Taille",           value:p.profile.height+" cm"},
              {label:"Sexe",             value:p.profile.sex==="F"?"Femme":"Homme"},
              {label:"Séances / sem.",   value:p.profile.sessWeek||3},
              {label:"Base km / sem.",   value:(p.profile.kmWeek||25)+" km"}
            ].map(function(it,i,arr){return(
              <div key={i} className="flex justify-between items-center px-[18px] py-3.5"
                style={{borderBottom:i<arr.length-1?"1px solid "+BORD:"none"}}>
                <span className="text-[13px] text-sub">{it.label}</span>
                <span className="text-[13px] font-semibold text-txt">{it.value}</span>
              </div>
            );})}
          </Card>
        ):(
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div>{field("Prénom","name","text","Prénom")}</div>
              <div>{field("Âge","age","number","30")}</div>
              <div>{field("Poids (kg)","weight","number","70")}</div>
              <div>{field("Taille (cm)","height","number","175")}</div>
            </div>
            <div className="mb-3">
              <label className="text-[12px] text-mut block mb-[5px]">Sexe</label>
              <div className="flex gap-2">
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"M"});});}}
                  className="flex-1 py-2.5 rounded-[10px] font-semibold cursor-pointer font-[inherit] text-[13px]"
                  style={{border:"1.5px solid "+(form.sex==="M"?OR:BORD),background:form.sex==="M"?OR+"18":"transparent",color:form.sex==="M"?OR:SUB}}>Homme</button>
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"F"});});}}
                  className="flex-1 py-2.5 rounded-[10px] font-semibold cursor-pointer font-[inherit] text-[13px]"
                  style={{border:"1.5px solid "+(form.sex==="F"?OR:BORD),background:form.sex==="F"?OR+"18":"transparent",color:form.sex==="F"?OR:SUB}}>Femme</button>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px] text-mut">Séances / semaine</label>
                <span className="text-[12px] font-bold" style={{color:OR}}>{form.sessWeek}</span>
              </div>
              <input type="range" min={2} max={7} value={form.sessWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{sessWeek:parseInt(e.target.value)});});}} className="w-full" style={{accentColor:OR}}/>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <label className="text-[12px] text-mut">Base kilométrique / semaine</label>
                <span className="text-[12px] font-bold text-info">{form.kmWeek} km</span>
              </div>
              <input type="range" min={5} max={100} step={5} value={form.kmWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{kmWeek:parseInt(e.target.value)});});}} className="w-full" style={{accentColor:BL}}/>
            </div>
            <Btn label="Enregistrer les modifications" onClick={save} full/>
          </div>
        )}

        <Card style={{marginBottom:16}}>
          <div onClick={function(){if(planLevel(p.profile)<2){setShowVdotUpgrade(true);}else{setShowVdot(!showVdot);setVdotResult(null);}}}
            className="flex items-center justify-between px-[18px] py-3.5 cursor-pointer">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-txt">Calibrer mes allures</span>
                {planLevel(p.profile)<2&&<span className="text-[9px] font-bold px-1.5 py-[2px] rounded-[6px]" style={{color:OR,background:OR+"18"}}>Pro</span>}
              </div>
              <div className="text-[12px] mt-0.5" style={{color:planLevel(p.profile)>=2&&p.profile.vdotPaces?GR:SUB}}>{planLevel(p.profile)>=2&&p.profile.vdotPaces?"Allures personnalisées actives":"Basé sur le niveau de profil"}</div>
            </div>
            <div className="text-[10px] text-mut" style={{transform:showVdot?"rotate(180deg)":"rotate(0deg)"}}>{planLevel(p.profile)<2?"🔒":"▼"}</div>
          </div>
          {showVdot&&(
            <div className="px-[18px] pb-[18px] border-t border-bord">
              <div className="text-[12px] text-sub mt-3.5 mb-3.5 leading-[1.7]">Entre une performance récente pour calculer tes allures optimales d'entraînement (méthode Jack Daniels).</div>
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <div>
                  <label className="text-[12px] text-mut block mb-1.5">Distance</label>
                  <select value={vdotDist} onChange={function(e){setVdotDist(e.target.value);setVdotResult(null);}} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit",colorScheme:"dark"}}>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="21.1">Semi (21,1 km)</option>
                    <option value="42.2">Marathon (42,2 km)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-mut block mb-1.5">Temps (hh:mm:ss)</label>
                  <input value={vdotTime} onChange={function(e){setVdotTime(e.target.value);setVdotResult(null);}} placeholder="00:45:00" style={inputSt}/>
                </div>
              </div>
              {vdotResult&&(
                <div className="rounded-xl px-4 py-3.5 mb-3.5" style={{background:OR+"10",border:"1px solid "+OR+"30"}}>
                  <div className="text-[11px] font-bold uppercase tracking-[0.5px] mb-2.5" style={{color:OR}}>Tes allures personnalisées</div>
                  {[{l:"Endurance",k:"easy",c:GR},{l:"Sortie longue",k:"long",c:BL},{l:"Seuil",k:"tempo",c:YE},{l:"Fractionné",k:"interval",c:OR},{l:"Récupération",k:"recovery",c:MUT}].map(function(pp,i){return(
                    <div key={i} className="flex justify-between items-center" style={{marginBottom:i<4?8:0}}>
                      <span className="text-[13px] text-sub">{pp.l}</span>
                      <span className="text-[14px] font-bold" style={{color:pp.c}}>{vdotResult[pp.k]}/km</span>
                    </div>
                  );})}
                </div>
              )}
              <div className="flex gap-2">
                <Btn label="Calculer" onClick={function(){
                  var parts=vdotTime.split(":").map(Number);
                  var secs=parts.length===3?parts[0]*3600+parts[1]*60+(parts[2]||0):parts.length===2?parts[0]*60+(parts[1]||0):0;
                  if(!secs||secs<60)return;
                  var vdot=calcVdot(parseFloat(vdotDist),secs);
                  setVdotResult(vdotToPaces(vdot));
                }} size="sm" style={{flex:1}}/>
                {vdotResult&&<Btn label="Appliquer" onClick={function(){
                  p.onUpdate(Object.assign({},p.profile,{vdotPaces:vdotResult}));
                  setVdotResult(null);setShowVdot(false);
                }} size="sm" style={{flex:1}}/>}
                {p.profile.vdotPaces&&<Btn label="Réinitialiser" onClick={function(){
                  var upd=Object.assign({},p.profile);delete upd.vdotPaces;p.onUpdate(upd);
                }} size="sm" variant="ghost" style={{flex:1}}/>}
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-2.5 mb-2.5 mt-1">
          <button onClick={function(){
            var data={version:2,exportedAt:new Date().toISOString(),profile:p.profile,race:p.race,stats:p.stats,entries:p.entries||{}};
            var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="fuelrun-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);
          }} className="py-3.5 rounded-xl text-txt text-[13px] font-semibold cursor-pointer font-[inherit]"
            style={{background:SURF2,border:"1px solid "+BORD}}>Exporter</button>
          <label className="py-3.5 rounded-xl text-txt text-[13px] font-semibold cursor-pointer text-center block"
            style={{background:SURF2,border:"1px solid "+BORD}}>
            Importer
            <input type="file" accept=".json" className="hidden" onChange={function(e){
              var file=e.target.files[0];if(!file)return;
              var reader=new FileReader();
              reader.onload=function(ev){try{
                var data=JSON.parse(ev.target.result);
                if(!data.profile)throw new Error("Fichier invalide");
                p.onImport(data);
              }catch(err){p.onSaveError("Fichier invalide ou corrompu");}};
              reader.readAsText(file);e.target.value="";
            }}/>
          </label>
        </div>

        {p.user&&<div className="mb-2.5 px-3.5 py-2.5 rounded-[10px]" style={{background:SURF2,border:"1px solid "+BORD}}>
          <div className="text-[11px] text-mut mb-0.5">Connecté avec</div>
          <div className="text-[13px] font-semibold text-txt">{p.user.email||p.user.displayName||"Compte Google"}</div>
        </div>}

        {isEmailUser&&<button onClick={function(){setShowPwdModal(true);setPwdCurrent("");setPwdNew("");setPwdConfirm("");setPwdError("");setPwdDone(false);}}
          className="w-full bg-transparent py-3.5 rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] mb-2.5"
          style={{border:"1px solid "+BORD,color:SUB}}>Changer mon mot de passe</button>}

        <button onClick={p.pushEnabled?p.onDisablePush:p.onEnablePush}
          className="w-full bg-transparent py-3.5 rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] mb-2.5 flex items-center justify-center gap-2"
          style={{border:"1px solid "+(p.pushEnabled?GR:BORD),color:p.pushEnabled?GR:SUB}}>
          <span>{p.pushEnabled?"🔔":"🔕"}</span>{p.pushEnabled?"Notifications activées":"Activer les notifications"}
        </button>

        <button onClick={p.onSignOut}
          className="w-full bg-transparent py-3.5 rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] mb-2.5"
          style={{border:"1px solid "+BORD,color:SUB}}>Se déconnecter</button>

        <button onClick={p.onNewRace}
          className="w-full bg-transparent py-3.5 rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] mb-2.5"
          style={{border:"1px solid "+OR+"44",color:OR}}>Changer d'objectif course</button>

        <button onClick={function(){setShowResetModal(true);}}
          className="w-full bg-transparent py-3.5 rounded-xl text-[13px] font-semibold cursor-pointer font-[inherit] mb-2.5"
          style={{border:"1px solid "+RE+"44",color:RE}}>Réinitialiser mon profil</button>

        <button onClick={function(){setShowDeleteModal(true);}}
          className="w-full py-3.5 rounded-xl text-white text-[13px] font-bold cursor-pointer font-[inherit] border-none"
          style={{background:RE}}>Supprimer mon compte</button>

        <div className="text-center mt-5 mb-1 text-[11px] text-mut leading-[1.8]">
          <span onClick={function(){setLegalOpen("cgu");}} className="text-sub underline cursor-pointer">CGU</span>
          {"  ·  "}
          <span onClick={function(){setLegalOpen("confidentialite");}} className="text-sub underline cursor-pointer">Confidentialité</span>
        </div>
      </div>
    </div>

    {showResetModal&&(
      <div className="fixed inset-0 bg-black/75 z-[300] flex items-center justify-center p-6"
        onClick={function(e){if(e.target===e.currentTarget)setShowResetModal(false);}}>
        <div className="bg-surf rounded-[20px] px-6 py-7 w-full max-w-[380px] anim-fadeIn">
          <div className="text-[24px] text-center mb-3">⚠️</div>
          <div className="text-[18px] font-bold text-txt text-center mb-2">Réinitialiser le profil ?</div>
          <div className="text-[13px] text-sub text-center leading-[1.6] mb-6">Ton profil, ton plan et tes stats seront effacés. Tu pourras choisir une nouvelle course et repartir de zéro.</div>
          <div className="flex flex-col gap-2.5">
            <button onClick={function(){setShowResetModal(false);p.onReset();}}
              className="w-full py-3.5 rounded-xl text-white text-[14px] font-bold cursor-pointer font-[inherit] border-none"
              style={{background:RE}}>Confirmer et choisir une nouvelle course</button>
            <button onClick={function(){setShowResetModal(false);}}
              className="w-full py-3.5 rounded-xl text-[14px] font-semibold cursor-pointer font-[inherit] bg-transparent"
              style={{border:"1px solid "+BORD,color:SUB}}>Annuler</button>
          </div>
        </div>
      </div>
    )}

    {showPwdModal&&(
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" style={{background:"rgba(0,0,0,.85)"}}
        onClick={function(e){if(e.target===e.currentTarget)setShowPwdModal(false);}}>
        <div className="bg-surf rounded-[20px] px-6 py-7 w-full max-w-[380px] anim-fadeIn">
          {pwdDone?(
            <>
              <div className="text-[32px] text-center mb-3">✅</div>
              <div className="text-[17px] font-bold text-txt text-center mb-2">Mot de passe modifié</div>
              <div className="text-[13px] text-sub text-center mb-6">Ton nouveau mot de passe est actif.</div>
              <button onClick={function(){setShowPwdModal(false);}}
                className="w-full py-3.5 rounded-xl text-white text-[14px] font-bold cursor-pointer font-[inherit] border-none"
                style={{background:OR}}>Fermer</button>
            </>
          ):(
            <>
              <div className="text-[17px] font-bold text-txt mb-5">Changer mon mot de passe</div>
              {[["Mot de passe actuel",pwdCurrent,setPwdCurrent],["Nouveau mot de passe",pwdNew,setPwdNew],["Confirmer le nouveau",pwdConfirm,setPwdConfirm]].map(function(f,i){
                return(
                  <div key={i} className="mb-3">
                    <label className="text-[12px] text-mut block mb-1.5">{f[0]}</label>
                    <input type="password" value={f[1]} onChange={function(e){f[2](e.target.value);setPwdError("");}} placeholder="••••••••" style={inputPwd}/>
                  </div>
                );
              })}
              {pwdError&&<div className="text-[13px] mb-3 px-3 py-2 rounded-lg" style={{color:RE,background:RE+"10"}}>{pwdError}</div>}
              <div className="flex gap-2.5 mt-1">
                <button onClick={function(){setShowPwdModal(false);}}
                  className="flex-1 py-3.5 rounded-xl bg-transparent text-[13px] font-semibold cursor-pointer font-[inherit]"
                  style={{border:"1px solid "+BORD,color:SUB}}>Annuler</button>
                <button onClick={handleChangePwd} disabled={pwdLoading}
                  className="flex-1 py-3.5 rounded-xl text-white text-[13px] font-bold cursor-pointer font-[inherit] border-none"
                  style={{background:OR}}>{pwdLoading?"Enregistrement…":"Enregistrer"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    )}

    {showDeleteModal&&(
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" style={{background:"rgba(0,0,0,.85)"}}
        onClick={function(e){if(e.target===e.currentTarget)setShowDeleteModal(false);}}>
        <div className="bg-surf rounded-[20px] px-6 py-7 w-full max-w-[380px] anim-fadeIn">
          <div className="text-[24px] text-center mb-3">🗑️</div>
          <div className="text-[18px] font-bold text-txt text-center mb-2">Supprimer mon compte ?</div>
          <div className="text-[13px] text-sub text-center leading-[1.6] mb-6">Toutes tes données (profil, plan, séances) seront définitivement effacées. Cette action est irréversible.</div>
          <div className="flex flex-col gap-2.5">
            <button onClick={function(){setShowDeleteModal(false);p.onDeleteAccount&&p.onDeleteAccount();}}
              className="w-full py-3.5 rounded-xl text-white text-[14px] font-bold cursor-pointer font-[inherit] border-none"
              style={{background:RE}}>Oui, supprimer définitivement</button>
            <button onClick={function(){setShowDeleteModal(false);}}
              className="w-full py-3.5 rounded-xl bg-transparent text-[14px] font-semibold cursor-pointer font-[inherit]"
              style={{border:"1px solid "+BORD,color:SUB}}>Annuler</button>
          </div>
        </div>
      </div>
    )}

    {showVdotUpgrade&&<UpgradeModal feature="Calibrer mes allures" minPlanLabel="Pro" minPlanColor={OR} onClose={function(){setShowVdotUpgrade(false);}} onUpgrade={function(){setShowVdotUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    <LegalModal open={legalOpen} onClose={function(){setLegalOpen(null);}}/>
    </>
  );
}
