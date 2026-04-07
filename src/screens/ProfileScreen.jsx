import { useState, useRef } from "react";
import { auth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "../firebase.js";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, YE, RE } from "../data/constants.js";
import { LEVELS, LEVEL_LABELS } from "../data/training.js";
import { PLANS } from "../data/plans.js";
import { calcVdot, vdotToPaces } from "../utils/vdot.js";
import { planLevel } from "../utils/nutrition.js";
import { LogoBar } from "../components/HeroScreen.jsx";
import { Btn, Card } from "../components/ui.jsx";
import { UpgradeModal } from "../components/UpgradeModal.jsx";
import { LegalModal } from "../components/LegalModal.jsx";

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
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:MUT,display:"block",marginBottom:5}}>{label}</label>
        <input value={form[key]} onChange={function(e){setForm(function(f){return Object.assign({},f,{[key]:e.target.value});});}} type={type||"text"} placeholder={placeholder} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
      </div>
    );
  }
  var stats=[{label:"Séances",value:p.stats.sessions,color:OR},{label:"Kilomètres",value:Math.round(p.stats.km)+" km",color:BL},{label:"Streak",value:p.stats.streak+" j",color:YE}];
  return(
    <><div><LogoBar/>
      <div style={{padding:"20px 16px 80px"}}>
        <button onClick={function(){p.onBack&&p.onBack();}} style={{background:"none",border:"none",color:OR,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,padding:"0 0 16px 0"}}>← Accueil</button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,"+OR+"44,#1a0800)",border:"2px solid "+OR+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:OR}}>
              {(p.profile.name||"?").split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:TXT}}>{p.profile.name||"Coureur"}</div>
              <button onClick={function(){cycleLevel();}} style={{fontSize:13,color:OR,marginTop:4,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:8,background:OR+"15",border:"1px solid "+OR+"33",fontFamily:"inherit"}}>
                {LEVEL_LABELS[p.profile.level]||""} <span style={{fontSize:10}}>↻</span>
              </button>
            </div>
          </div>
          {editing&&(
            <button onClick={function(){setEditing(false);setForm({name:p.profile.name||"",age:p.profile.age||"",weight:p.profile.weight||"",height:p.profile.height||"",sex:p.profile.sex||"M",sessWeek:p.profile.sessWeek||3,kmWeek:p.profile.kmWeek||25});}} style={{padding:"7px 16px",borderRadius:20,background:SURF2,border:"1px solid "+BORD,color:SUB,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Annuler
            </button>
          )}
        </div>

        {(function(){
          var pl=PLANS.find(function(x){return x.id===(p.profile.plan||"gratuit");});
          if(!pl)return null;
          return(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,background:pl.color+"14",border:"1px solid "+pl.color+"33",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>⭐</span>
                <div><div style={{fontSize:12,color:MUT}}>Formule actuelle</div><div style={{fontSize:14,fontWeight:700,color:pl.color}}>{pl.name}</div></div>
              </div>
              <button onClick={function(){p.onShowPricing&&p.onShowPricing();}} style={{padding:"6px 14px",borderRadius:8,background:pl.id==="gratuit"?OR:SURF2,border:"1px solid "+(pl.id==="gratuit"?OR:BORD),color:pl.id==="gratuit"?"#fff":SUB,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{pl.id==="gratuit"?"Upgrader":"Changer"}</button>
            </div>
          );
        })()}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {stats.map(function(s,i){return(
            <div key={i} style={{background:SURF,border:"1px solid "+BORD,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,color:MUT,marginTop:4,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
            </div>
          );})}
        </div>

        <div ref={levelRef} style={{marginBottom:14}}>
          <div style={{fontSize:12,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Niveau</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {LEVELS.map(function(l){var on=(p.profile.level||"beginner")===l.id;return(
              <button key={l.id} onClick={function(){p.onUpdate({level:l.id});}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:10,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"18":"transparent",cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:14}}>{l.emoji}</span>
                <span style={{fontSize:12,fontWeight:on?700:400,color:on?OR:SUB}}>{l.label}</span>
              </button>
            );})}
          </div>
        </div>

        {!editing?(
          <Card onClick={function(){setEditing(true);}} style={{marginBottom:16,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px 8px",borderBottom:"1px solid "+BORD}}>
              <span style={{fontSize:11,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Mes informations</span>
              <span style={{fontSize:11,color:OR,fontWeight:600}}>Modifier ✎</span>
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
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",borderBottom:i<arr.length-1?"1px solid "+BORD:"none"}}>
                <span style={{fontSize:13,color:SUB}}>{it.label}</span>
                <span style={{fontSize:13,fontWeight:600,color:TXT}}>{it.value}</span>
              </div>
            );})}
          </Card>
        ):(
          <div style={{marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:0}}>
              <div>{field("Prénom","name","text","Prénom")}</div>
              <div>{field("Âge","age","number","30")}</div>
              <div>{field("Poids (kg)","weight","number","70")}</div>
              <div>{field("Taille (cm)","height","number","175")}</div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:MUT,display:"block",marginBottom:5}}>Sexe</label>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"M"});});}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(form.sex==="M"?OR:BORD),background:form.sex==="M"?OR+"18":"transparent",color:form.sex==="M"?OR:SUB,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Homme</button>
                <button onClick={function(){setForm(function(f){return Object.assign({},f,{sex:"F"});});}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(form.sex==="F"?OR:BORD),background:form.sex==="F"?OR+"18":"transparent",color:form.sex==="F"?OR:SUB,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Femme</button>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:MUT}}>Séances / semaine</label>
                <span style={{fontSize:12,fontWeight:700,color:OR}}>{form.sessWeek}</span>
              </div>
              <input type="range" min={2} max={7} value={form.sessWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{sessWeek:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:OR}}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:MUT}}>Base kilométrique / semaine</label>
                <span style={{fontSize:12,fontWeight:700,color:BL}}>{form.kmWeek} km</span>
              </div>
              <input type="range" min={5} max={100} step={5} value={form.kmWeek} onChange={function(e){setForm(function(f){return Object.assign({},f,{kmWeek:parseInt(e.target.value)});});}} style={{width:"100%",accentColor:BL}}/>
            </div>
            <Btn label="Enregistrer les modifications" onClick={save} full/>
          </div>
        )}

        <Card style={{marginBottom:16}}>
          <div onClick={function(){if(planLevel(p.profile)<2){setShowVdotUpgrade(true);}else{setShowVdot(!showVdot);setVdotResult(null);}}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",cursor:"pointer"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,fontWeight:600,color:TXT}}>Calibrer mes allures</span>
                {planLevel(p.profile)<2&&<span style={{fontSize:9,fontWeight:700,color:OR,background:OR+"18",padding:"2px 6px",borderRadius:6}}>Pro</span>}
              </div>
              <div style={{fontSize:12,color:planLevel(p.profile)>=2&&p.profile.vdotPaces?GR:SUB,marginTop:2}}>{planLevel(p.profile)>=2&&p.profile.vdotPaces?"Allures personnalisées actives":"Basé sur le niveau de profil"}</div>
            </div>
            <div style={{fontSize:10,color:MUT,transform:showVdot?"rotate(180deg)":"rotate(0deg)"}}>{planLevel(p.profile)<2?"🔒":"▼"}</div>
          </div>
          {showVdot&&(
            <div style={{padding:"0 18px 18px",borderTop:"1px solid "+BORD}}>
              <div style={{fontSize:12,color:SUB,marginTop:14,marginBottom:14,lineHeight:1.7}}>Entre une performance récente pour calculer tes allures optimales d'entraînement (méthode Jack Daniels).</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Distance</label>
                  <select value={vdotDist} onChange={function(e){setVdotDist(e.target.value);setVdotResult(null);}} style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit",colorScheme:"dark"}}>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="21.1">Semi (21,1 km)</option>
                    <option value="42.2">Marathon (42,2 km)</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Temps (hh:mm:ss)</label>
                  <input value={vdotTime} onChange={function(e){setVdotTime(e.target.value);setVdotResult(null);}} placeholder="00:45:00" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"11px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                </div>
              </div>
              {vdotResult&&(
                <div style={{background:OR+"10",border:"1px solid "+OR+"30",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:11,color:OR,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Tes allures personnalisées</div>
                  {[{l:"Endurance",k:"easy",c:GR},{l:"Sortie longue",k:"long",c:BL},{l:"Seuil",k:"tempo",c:YE},{l:"Fractionné",k:"interval",c:OR},{l:"Récupération",k:"recovery",c:MUT}].map(function(pp,i){return(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<4?8:0}}>
                      <span style={{fontSize:13,color:SUB}}>{pp.l}</span>
                      <span style={{fontSize:14,fontWeight:700,color:pp.c}}>{vdotResult[pp.k]}/km</span>
                    </div>
                  );})}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
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

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10,marginTop:4}}>
          <button onClick={function(){
            var data={version:2,exportedAt:new Date().toISOString(),profile:p.profile,race:p.race,stats:p.stats,entries:p.entries||{}};
            var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="fuelrun-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(url);
          }} style={{padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Exporter</button>
          <label style={{padding:"13px",borderRadius:12,background:SURF2,border:"1px solid "+BORD,color:TXT,fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"center",display:"block"}}>
            Importer
            <input type="file" accept=".json" style={{display:"none"}} onChange={function(e){
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
        {p.user&&<div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:SURF2,border:"1px solid "+BORD}}><div style={{fontSize:11,color:MUT,marginBottom:2}}>Connecté avec</div><div style={{fontSize:13,color:TXT,fontWeight:600}}>{p.user.email||p.user.displayName||"Compte Google"}</div></div>}
        {isEmailUser&&<button onClick={function(){setShowPwdModal(true);setPwdCurrent("");setPwdNew("");setPwdConfirm("");setPwdError("");setPwdDone(false);}} style={{width:"100%",background:"none",border:"1px solid "+BORD,borderRadius:12,padding:"13px",color:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Changer mon mot de passe</button>}
        <button onClick={p.pushEnabled?p.onDisablePush:p.onEnablePush} style={{width:"100%",background:"none",border:"1px solid "+(p.pushEnabled?GR:BORD),borderRadius:12,padding:"13px",color:p.pushEnabled?GR:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span>{p.pushEnabled?"🔔":"🔕"}</span>{p.pushEnabled?"Notifications activées":"Activer les notifications"}
        </button>
        <button onClick={p.onSignOut} style={{width:"100%",background:"none",border:"1px solid "+BORD,borderRadius:12,padding:"13px",color:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Se déconnecter</button>
        <button onClick={p.onNewRace} style={{width:"100%",background:"none",border:"1px solid "+OR+"44",borderRadius:12,padding:"13px",color:OR,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Changer d'objectif course</button>
        <button onClick={function(){setShowResetModal(true);}} style={{width:"100%",background:"none",border:"1px solid "+RE+"44",borderRadius:12,padding:"13px",color:RE,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Réinitialiser mon profil</button>
        <button onClick={function(){setShowDeleteModal(true);}} style={{width:"100%",background:RE,border:"none",borderRadius:12,padding:"13px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Supprimer mon compte</button>
        <div style={{textAlign:"center",marginTop:20,marginBottom:4,fontSize:11,color:MUT,lineHeight:1.8}}>
          <span onClick={function(){setLegalOpen("cgu");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>CGU</span>
          {"  ·  "}
          <span onClick={function(){setLegalOpen("confidentialite");}} style={{color:SUB,textDecoration:"underline",cursor:"pointer"}}>Confidentialité</span>
        </div>
      </div>
    </div>

    {showResetModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(e){if(e.target===e.currentTarget)setShowResetModal(false);}}>
        <div style={{background:SURF,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,animation:"fadeIn .2s ease"}}>
          <div style={{fontSize:24,textAlign:"center",marginBottom:12}}>⚠️</div>
          <div style={{fontSize:18,fontWeight:700,color:TXT,textAlign:"center",marginBottom:8}}>Réinitialiser le profil ?</div>
          <div style={{fontSize:13,color:SUB,textAlign:"center",lineHeight:1.6,marginBottom:24}}>Ton profil, ton plan et tes stats seront effacés. Tu pourras choisir une nouvelle course et repartir de zéro.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={function(){setShowResetModal(false);p.onReset();}} style={{width:"100%",padding:"14px",borderRadius:12,background:RE,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirmer et choisir une nouvelle course</button>
            <button onClick={function(){setShowResetModal(false);}} style={{width:"100%",padding:"14px",borderRadius:12,background:"none",border:"1px solid "+BORD,color:SUB,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
          </div>
        </div>
      </div>
    )}
    {showPwdModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(e){if(e.target===e.currentTarget)setShowPwdModal(false);}}>
        <div style={{background:SURF,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,animation:"fadeIn .2s ease"}}>
          {pwdDone?(
            <>
              <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>✅</div>
              <div style={{fontSize:17,fontWeight:700,color:TXT,textAlign:"center",marginBottom:8}}>Mot de passe modifié</div>
              <div style={{fontSize:13,color:SUB,textAlign:"center",marginBottom:24}}>Ton nouveau mot de passe est actif.</div>
              <button onClick={function(){setShowPwdModal(false);}} style={{width:"100%",padding:"14px",borderRadius:12,background:OR,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Fermer</button>
            </>
          ):(
            <>
              <div style={{fontSize:17,fontWeight:700,color:TXT,marginBottom:20}}>Changer mon mot de passe</div>
              {[["Mot de passe actuel",pwdCurrent,setPwdCurrent],["Nouveau mot de passe",pwdNew,setPwdNew],["Confirmer le nouveau",pwdConfirm,setPwdConfirm]].map(function(f,i){
                return(
                  <div key={i} style={{marginBottom:12}}>
                    <label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>{f[0]}</label>
                    <input type="password" value={f[1]} onChange={function(e){f[2](e.target.value);setPwdError("");}} placeholder="••••••••" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"12px 14px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                  </div>
                );
              })}
              {pwdError&&<div style={{fontSize:13,color:RE,marginBottom:12,padding:"8px 12px",borderRadius:8,background:RE+"10"}}>{pwdError}</div>}
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={function(){setShowPwdModal(false);}} style={{flex:1,padding:"13px",borderRadius:12,background:"none",border:"1px solid "+BORD,color:SUB,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
                <button onClick={handleChangePwd} disabled={pwdLoading} style={{flex:1,padding:"13px",borderRadius:12,background:OR,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{pwdLoading?"Enregistrement…":"Enregistrer"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    {showDeleteModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(e){if(e.target===e.currentTarget)setShowDeleteModal(false);}}>
        <div style={{background:SURF,borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,animation:"fadeIn .2s ease"}}>
          <div style={{fontSize:24,textAlign:"center",marginBottom:12}}>🗑️</div>
          <div style={{fontSize:18,fontWeight:700,color:TXT,textAlign:"center",marginBottom:8}}>Supprimer mon compte ?</div>
          <div style={{fontSize:13,color:SUB,textAlign:"center",lineHeight:1.6,marginBottom:24}}>Toutes tes données (profil, plan, séances) seront définitivement effacées. Cette action est irréversible.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={function(){setShowDeleteModal(false);p.onDeleteAccount&&p.onDeleteAccount();}} style={{width:"100%",padding:"14px",borderRadius:12,background:RE,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Oui, supprimer définitivement</button>
            <button onClick={function(){setShowDeleteModal(false);}} style={{width:"100%",padding:"14px",borderRadius:12,background:"none",border:"1px solid "+BORD,color:SUB,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
          </div>
        </div>
      </div>
    )}
    {showVdotUpgrade&&<UpgradeModal feature="Calibrer mes allures" minPlanLabel="Pro" minPlanColor={OR} onClose={function(){setShowVdotUpgrade(false);}} onUpgrade={function(){setShowVdotUpgrade(false);p.onShowPricing&&p.onShowPricing();}}/>}
    <LegalModal open={legalOpen} onClose={function(){setLegalOpen(null);}}/>
    </>
  );
}
