import { useState } from "react";
import { BG, SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL, CSS } from "../data/constants.js";
import { RACES } from "../data/races.js";
import { LEVELS } from "../data/training.js";
import { weeksUntil } from "../utils/date.js";
import { Btn, Chip, Card } from "../components/ui.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";

export function Onboarding(p){
  var [step,setStep]=useState(0);
  var [name,setName]=useState("");var [age,setAge]=useState("");var [weight,setWeight]=useState("");var [height,setHeight]=useState("");var [sex,setSex]=useState("M");
  var [level,setLevel]=useState("");var [sessWeek,setSessWeek]=useState(3);var [kmWeek,setKmWeek]=useState(25);
  var [selected,setSelected]=useState(null);var [tab,setTab]=useState("route");var [search,setSearch]=useState("");
  var [custom,setCustom]=useState([]);var [showCustom,setShowCustom]=useState(false);
  var [cn,setCn]=useState("");var [cd,setCd]=useState("");var [cdt,setCdt]=useState("");var [ct,setCt]=useState("route");

  function confirmCustom(){
    if(!cn||!cd||!cdt)return;
    var r={id:Date.now(),name:cn,dist:parseFloat(cd),type:ct,date:cdt,city:"Personnalisé",custom:true};
    setCustom(function(prev){return [r].concat(prev);});
    setSelected(r);setShowCustom(false);setCn("");setCd("");setCdt("");
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
    if(step===0){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Faisons connaissance</div>
        <div style={{fontSize:15,color:SUB,marginBottom:24}}>Quelques infos pour personnaliser ton plan.</div>
        <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Prénom" style={{width:"100%",background:SURF2,border:"1.5px solid "+(name?OR:BORD),borderRadius:12,padding:"14px 16px",color:TXT,fontSize:16,outline:"none",fontFamily:"inherit",marginBottom:16}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Âge</label><input value={age} onChange={function(e){setAge(e.target.value);}} type="number" placeholder="30" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Poids (kg)</label><input value={weight} onChange={function(e){setWeight(e.target.value);}} type="number" placeholder="70" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Taille (cm)</label><input value={height} onChange={function(e){setHeight(e.target.value);}} type="number" placeholder="175" style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"}}/></div>
          <div><label style={{fontSize:12,color:MUT,display:"block",marginBottom:6}}>Sexe</label>
            <div style={{display:"flex",gap:8,height:46}}>
              <button onClick={function(){setSex("M");}} style={{flex:1,borderRadius:12,border:"1.5px solid "+(sex==="M"?OR:BORD),background:sex==="M"?OR+"22":"transparent",color:sex==="M"?OR:SUB,fontWeight:sex==="M"?600:400,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Homme</button>
              <button onClick={function(){setSex("F");}} style={{flex:1,borderRadius:12,border:"1.5px solid "+(sex==="F"?OR:BORD),background:sex==="F"?OR+"22":"transparent",color:sex==="F"?OR:SUB,fontWeight:sex==="F"?600:400,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Femme</button>
            </div>
          </div>
        </div>
      </div>
    );}
    if(step===1){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ton niveau ?</div>
        <div style={{fontSize:15,color:SUB,marginBottom:24}}>Sois honnête, c'est juste pour ton plan.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {LEVELS.map(function(l){var on=level===l.id;return(
            <div key={l.id} onClick={function(){setLevel(l.id);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:"1.5px solid "+(on?OR:BORD),background:on?OR+"15":SURF,cursor:"pointer"}}>
              <span style={{fontSize:24}}>{l.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:on?OR:TXT}}>{l.label}</div><div style={{fontSize:12,color:MUT,marginTop:2}}>{l.sub}</div></div>
              <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid "+(on?OR:BORD),background:on?OR:"transparent"}}/>
            </div>
          );})}
        </div>
      </div>
    );}
    if(step===2){return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ta disponibilité</div>
        <div style={{fontSize:15,color:SUB,marginBottom:32}}>Le plan s'adapte à ton emploi du temps.</div>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <span style={{fontSize:15,color:TXT,fontWeight:500}}>Séances par semaine</span>
            <span style={{fontSize:26,fontWeight:700,color:OR}}>{sessWeek}</span>
          </div>
          <input type="range" min={2} max={7} value={sessWeek} onChange={function(e){setSessWeek(parseInt(e.target.value));}} style={{width:"100%",accentColor:OR,background:MUT}}/>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <span style={{fontSize:15,color:TXT,fontWeight:500}}>Kilomètres actuels / semaine</span>
            <span style={{fontSize:26,fontWeight:700,color:BL}}>{kmWeek} km</span>
          </div>
          <input type="range" min={5} max={100} step={5} value={kmWeek} onChange={function(e){setKmWeek(parseInt(e.target.value));}} style={{width:"100%",accentColor:BL,background:MUT}}/>
        </div>
      </div>
    );}
    return(
      <div>
        <div style={{fontSize:26,fontWeight:700,color:TXT,marginBottom:8}}>Ton objectif</div>
        <div style={{fontSize:15,color:SUB,marginBottom:16}}>Choisis une course ou ajoutes-en une.</div>
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher..." style={{width:"100%",background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"11px 14px",color:TXT,fontSize:14,outline:"none",marginBottom:12,fontFamily:"inherit"}}/>
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
        <div style={{maxHeight:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
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
      <style>{CSS}</style>
      <LogoBar/>
      <div style={{padding:"12px 24px 0"}}>
        <div style={{display:"flex",gap:4,marginBottom:4}}>{[0,1,2,3].map(function(i){return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?OR:SURF2}}/>;}) }</div>
        <div style={{fontSize:12,color:MUT,marginTop:6,textAlign:"right"}}>{step+1} / 4</div>
      </div>
      <div style={{flex:1,padding:"32px 24px 100px",overflowY:"auto"}}>{renderStep()}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"16px 24px 28px",background:"linear-gradient(to top,"+BG+" 70%,transparent)",display:"flex",gap:10}}>
        {step>0?<Btn label="Retour" onClick={function(){setStep(function(s){return s-1;});}} variant="ghost" style={{flex:1}}/>:null}
        <Btn label={step===3?"Lancer FuelRun":"Continuer"} onClick={function(){if(step===3)p.onDone({name:name,age:age,weight:weight,height:height,sex:sex,level:level,sessWeek:sessWeek,kmWeek:kmWeek,race:selected});else setStep(function(s){return s+1;});}} disabled={!canNext} style={{flex:2}}/>
      </div>
    </div>
  );
}
