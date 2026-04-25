import { useState } from "react";
import { BG, SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
import { RACES } from "../data/races.js";
import { LEVELS } from "../data/training.js";
import { weeksUntil } from "../utils/date.js";
import { Btn, Chip, Card } from "../components/ui.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";

export function Onboarding(p){
  var [step,setStep]=useState(0);
  var [name,setName]=useState("");
  var [level,setLevel]=useState("");
  var [selected,setSelected]=useState(null);
  var [tab,setTab]=useState("route");
  var [search,setSearch]=useState("");
  var [custom,setCustom]=useState([]);
  var [showCustom,setShowCustom]=useState(false);
  var [cn,setCn]=useState("");var [cd,setCd]=useState("");var [cdt,setCdt]=useState("");var [ct,setCt]=useState("route");

  function confirmCustom(){
    if(!cn||!cd||!cdt)return;
    var r={id:Date.now(),name:cn,dist:parseFloat(cd),type:ct,date:cdt,city:"Personnalisé",custom:true};
    setCustom(function(prev){return [r].concat(prev);});
    setSelected(r);setShowCustom(false);setCn("");setCd("");setCdt("");
  }

  function done(race){
    p.onDone({name:name,age:"",weight:"",height:"",sex:"M",level:level,sessWeek:3,kmWeek:25,race:race||null});
  }

  var canNext=step===0?!!name.trim():step===1?!!level:true;
  var todayStr=new Date().toISOString().slice(0,10);
  var allRaces=RACES.concat(custom).filter(function(r){return r.date>=todayStr;});
  var filtered=allRaces.filter(function(r){
    if(r.type!==tab)return false;
    if(!search)return true;
    var q=search.toLowerCase();
    return r.name.toLowerCase().includes(q)||r.city.toLowerCase().includes(q);
  });

  function renderStep(){
    // Étape 0 — Prénom
    if(step===0){return(
      <div>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:8,letterSpacing:"-0.3px"}}>Quel est ton prénom ?</div>
        <div style={{fontSize:15,color:SUB,marginBottom:32}}>On personnalise tout pour toi.</div>
        <input
          value={name}
          onChange={function(e){setName(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter"&&name.trim())setStep(1);}}
          placeholder="Prénom"
          autoFocus
          style={{width:"100%",background:SURF2,border:"1.5px solid "+(name?OR:BORD),borderRadius:14,padding:"16px 18px",color:TXT,fontSize:20,fontWeight:600,outline:"none",fontFamily:"inherit"}}
        />
        <div style={{marginTop:16,fontSize:13,color:MUT,lineHeight:1.6}}>
          Âge, poids et autres informations se configurent dans ton profil après l'inscription.
        </div>
      </div>
    );}

    // Étape 1 — Niveau
    if(step===1){return(
      <div>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:8,letterSpacing:"-0.3px"}}>Ton niveau de coureur ?</div>
        <div style={{fontSize:15,color:SUB,marginBottom:24}}>Sois honnête, c'est pour adapter ton plan.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {LEVELS.map(function(l){var on=level===l.id;return(
            <div key={l.id} onClick={function(){setLevel(l.id);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"15":SURF,cursor:"pointer"}}>
              <span style={{fontSize:24}}>{l.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:on?OR:TXT}}>{l.label}</div><div style={{fontSize:12,color:MUT,marginTop:2}}>{l.sub}</div></div>
              <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(on?OR:BORD),background:on?OR:"transparent",flexShrink:0}}/>
            </div>
          );})}
        </div>
      </div>
    );}

    // Étape 2 — Course (optionnelle)
    return(
      <div>
        <div style={{fontSize:28,fontWeight:800,color:TXT,marginBottom:4,letterSpacing:"-0.3px"}}>Ta prochaine course ?</div>
        <div style={{fontSize:15,color:SUB,marginBottom:16}}>Optionnel — tu peux en choisir une plus tard.</div>
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher une course…" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <Chip label="Route" active={tab==="route"} onClick={function(){setTab("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTab("trail");}}/>
          <Chip label="+ La mienne" active={false} color={BL} onClick={function(){setShowCustom(true);}}/>
        </div>
        {showCustom?(<Card style={{padding:16,marginBottom:14}}>
          <input value={cn} onChange={function(e){setCn(e.target.value);}} placeholder="Nom de la course" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",marginBottom:8,fontFamily:"inherit"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <input value={cd} onChange={function(e){setCd(e.target.value);}} type="number" placeholder="Distance km" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <input value={cdt} onChange={function(e){setCdt(e.target.value);}} type="date" style={{background:SURF2,border:"1px solid "+BORD,borderRadius:10,padding:"10px 12px",color:TXT,fontSize:14,outline:"none",colorScheme:"dark",fontFamily:"inherit"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <Chip label="Route" active={ct==="route"} onClick={function(){setCt("route");}}/>
            <Chip label="Trail" active={ct==="trail"} color={GR} onClick={function(){setCt("trail");}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn label="Ajouter" onClick={confirmCustom} size="sm" disabled={!cn||!cd||!cdt} style={{flex:1}}/>
            <Btn label="Annuler" onClick={function(){setShowCustom(false);}} variant="ghost" size="sm" style={{flex:1}}/>
          </div>
        </Card>):null}
        <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(function(r){
            var on=selected&&selected.id===r.id;var col=r.type==="trail"?GR:BL;
            return(
              <div key={r.id} onClick={function(){setSelected(on?null:r);}} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"12":SURF,cursor:"pointer"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:on?OR:TXT}}>{r.name}{r.star?" ⭐":""}</div>
                  <div style={{display:"flex",gap:8,marginTop:3}}>
                    <span style={{fontSize:12,color:MUT}}>{r.city}</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,fontWeight:600,color:col+"cc"}}>{r.dist} km</span>
                    <span style={{fontSize:12,color:MUT}}>·</span>
                    <span style={{fontSize:12,color:MUT}}>{weeksUntil(r.date)} sem.</span>
                  </div>
                </div>
                {on?<div style={{color:OR,fontSize:16,fontWeight:700}}>✓</div>:null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <LogoBar/>
      <div style={{padding:"12px 24px 0"}}>
        <div style={{display:"flex",gap:4,marginBottom:4}}>
          {[0,1,2].map(function(i){return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?OR:SURF2}}/>;})}</div>
        <div style={{fontSize:12,color:MUT,marginTop:6,textAlign:"right"}}>{step+1} / 3</div>
      </div>
      <div style={{flex:1,padding:"32px 24px 120px",overflowY:"auto"}}>{renderStep()}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"16px 24px 28px",background:"linear-gradient(to top,"+BG+" 70%,transparent)",display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:10}}>
          {step>0?<Btn label="Retour" onClick={function(){setStep(function(s){return s-1;});}} variant="ghost" style={{flex:1}}/>:null}
          <Btn
            label={step===2?(selected?"Lancer FuelRun":"Lancer sans course"):"Continuer"}
            onClick={function(){
              if(step===2){done(selected);}
              else{setStep(function(s){return s+1;});}
            }}
            disabled={!canNext}
            style={{flex:2}}
          />
        </div>
        {step===2&&(
          <button onClick={function(){done(null);}} style={{background:"none",border:"none",color:MUT,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"center",padding:"4px 0"}}>
            Passer cette étape →
          </button>
        )}
      </div>
    </div>
  );
}
