import { useState } from "react";
import { SURF, SURF2, BORD, TXT, SUB, MUT, OR, GR, BL } from "../data/constants.js";
import { RACES } from "../data/races.js";
import { LEVELS } from "../data/training.js";
import { weeksUntil } from "../utils/date.js";
import { Btn, Chip, Card } from "../components/ui.jsx";
import { LogoBar } from "../components/HeroScreen.jsx";

var inputSm={background:SURF2,border:"1px solid "+BORD,borderRadius:12,padding:"13px 14px",color:TXT,fontSize:15,outline:"none",fontFamily:"inherit"};

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
        <div className="text-[26px] font-bold text-txt mb-2">Faisons connaissance</div>
        <div className="text-[15px] text-sub mb-6">Quelques infos pour personnaliser ton plan.</div>
        <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="Prénom"
          className="w-full rounded-xl px-4 py-[14px] text-base outline-none font-[inherit] mb-4"
          style={{background:SURF2,border:"1.5px solid "+(name?OR:BORD),color:TXT}}/>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="text-[12px] text-mut block mb-1.5">Âge</label>
            <input value={age} onChange={function(e){setAge(e.target.value);}} type="number" placeholder="30" className="w-full" style={inputSm}/>
          </div>
          <div>
            <label className="text-[12px] text-mut block mb-1.5">Poids (kg)</label>
            <input value={weight} onChange={function(e){setWeight(e.target.value);}} type="number" placeholder="70" className="w-full" style={inputSm}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[12px] text-mut block mb-1.5">Taille (cm)</label>
            <input value={height} onChange={function(e){setHeight(e.target.value);}} type="number" placeholder="175" className="w-full" style={inputSm}/>
          </div>
          <div>
            <label className="text-[12px] text-mut block mb-1.5">Sexe</label>
            <div className="flex gap-2 h-[46px]">
              {["M","F"].map(function(s){var on=sex===s;return(
                <button key={s} onClick={function(){setSex(s);}}
                  className="flex-1 rounded-xl cursor-pointer font-[inherit] text-sm"
                  style={{border:"1.5px solid "+(on?OR:BORD),background:on?OR+"22":"transparent",color:on?OR:SUB,fontWeight:on?600:400}}>
                  {s==="M"?"Homme":"Femme"}
                </button>
              );})}
            </div>
          </div>
        </div>
      </div>
    );}
    if(step===1){return(
      <div>
        <div className="text-[26px] font-bold text-txt mb-2">Ton niveau ?</div>
        <div className="text-[15px] text-sub mb-6">Sois honnête, c'est juste pour ton plan.</div>
        <div className="flex flex-col gap-2">
          {LEVELS.map(function(l){var on=level===l.id;return(
            <div key={l.id} onClick={function(){setLevel(l.id);}}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl cursor-pointer"
              style={{border:"1.5px solid "+(on?OR:BORD),background:on?OR+"15":SURF}}>
              <span className="text-2xl">{l.emoji}</span>
              <div className="flex-1">
                <div className="text-[15px] font-semibold" style={{color:on?OR:TXT}}>{l.label}</div>
                <div className="text-[12px] text-mut mt-0.5">{l.sub}</div>
              </div>
              <div className="w-[18px] h-[18px] rounded-full" style={{border:"2px solid "+(on?OR:BORD),background:on?OR:"transparent"}}/>
            </div>
          );})}
        </div>
      </div>
    );}
    if(step===2){return(
      <div>
        <div className="text-[26px] font-bold text-txt mb-2">Ta disponibilité</div>
        <div className="text-[15px] text-sub mb-8">Le plan s'adapte à ton emploi du temps.</div>
        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-3.5">
            <span className="text-[15px] text-txt font-medium">Séances par semaine</span>
            <span className="text-[26px] font-bold text-brand">{sessWeek}</span>
          </div>
          <input type="range" min={2} max={7} value={sessWeek} onChange={function(e){setSessWeek(parseInt(e.target.value));}} className="w-full" style={{accentColor:OR,background:MUT}}/>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-3.5">
            <span className="text-[15px] text-txt font-medium">Kilomètres actuels / semaine</span>
            <span className="text-[26px] font-bold text-info">{kmWeek} km</span>
          </div>
          <input type="range" min={5} max={100} step={5} value={kmWeek} onChange={function(e){setKmWeek(parseInt(e.target.value));}} className="w-full" style={{accentColor:BL,background:MUT}}/>
        </div>
      </div>
    );}
    return(
      <div>
        <div className="text-[26px] font-bold text-txt mb-2">Ton objectif</div>
        <div className="text-[15px] text-sub mb-4">Choisis une course ou ajoutes-en une.</div>
        <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Rechercher..."
          className="w-full rounded-xl px-3.5 py-[11px] text-sm outline-none font-[inherit] mb-3"
          style={{background:SURF2,border:"1px solid "+BORD,color:TXT}}/>
        <div className="flex gap-2 mb-3.5">
          <Chip label="Route" active={tab==="route"} onClick={function(){setTab("route");}}/>
          <Chip label="Trail" active={tab==="trail"} color={GR} onClick={function(){setTab("trail");}}/>
          <Chip label="+ La mienne" active={false} color={BL} onClick={function(){setShowCustom(true);}}/>
        </div>
        {showCustom&&(
          <Card style={{padding:16,marginBottom:14}}>
            <input value={cn} onChange={function(e){setCn(e.target.value);}} placeholder="Nom de la course"
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit] mb-2"
              style={{background:SURF2,border:"1px solid "+BORD,color:TXT}}/>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={cd} onChange={function(e){setCd(e.target.value);}} type="number" placeholder="Distance km"
                className="rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit]"
                style={{background:SURF2,border:"1px solid "+BORD,color:TXT}}/>
              <input value={cdt} onChange={function(e){setCdt(e.target.value);}} type="date"
                className="rounded-[10px] px-3 py-2.5 text-sm outline-none font-[inherit]"
                style={{background:SURF2,border:"1px solid "+BORD,color:TXT,colorScheme:"dark"}}/>
            </div>
            <div className="flex gap-2 mb-3">
              <Chip label="Route" active={ct==="route"} onClick={function(){setCt("route");}}/>
              <Chip label="Trail" active={ct==="trail"} color={GR} onClick={function(){setCt("trail");}}/>
            </div>
            <div className="flex gap-2">
              <Btn label="Ajouter" onClick={confirmCustom} size="sm" disabled={!cn||!cd||!cdt} style={{flex:1}}/>
              <Btn label="Annuler" onClick={function(){setShowCustom(false);}} variant="ghost" size="sm" style={{flex:1}}/>
            </div>
          </Card>
        )}
        <div className="max-h-[340px] overflow-y-auto flex flex-col gap-2">
          {filtered.map(function(r){
            var on=selected&&selected.id===r.id;var col=r.type==="trail"?GR:BL;
            return(
              <div key={r.id} onClick={function(){setSelected(on?null:r);}}
                className="flex items-center gap-3 px-4 py-[13px] rounded-2xl cursor-pointer"
                style={{border:"1.5px solid "+(on?OR:BORD),background:on?OR+"12":SURF}}>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{color:on?OR:TXT}}>{r.name}{r.star?" ⭐":""}</div>
                  <div className="flex gap-2 mt-[3px]">
                    <span className="text-[12px] text-mut">{r.city}</span>
                    <span className="text-[12px] text-mut">·</span>
                    <span className="text-[12px] font-semibold" style={{color:col+"cc"}}>{r.dist} km</span>
                    <span className="text-[12px] text-mut">·</span>
                    <span className="text-[12px] text-mut">{weeksUntil(r.date)} sem.</span>
                  </div>
                </div>
                {on&&<div className="text-brand text-base font-bold">✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-bg flex flex-col">
      <LogoBar/>
      <div className="px-6 pt-3">
        <div className="flex gap-1 mb-1">
          {[0,1,2,3].map(function(i){return <div key={i} className="flex-1 h-[3px] rounded" style={{background:i<=step?OR:SURF2}}/>;}) }
        </div>
        <div className="text-[12px] text-mut mt-1.5 text-right">{step+1} / 4</div>
      </div>
      <div className="flex-1 px-6 pt-8 pb-24 overflow-y-auto">{renderStep()}</div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pb-7 pt-4 flex gap-2.5"
        style={{background:"linear-gradient(to top,#0a0a0a 70%,transparent)"}}>
        {step>0&&<Btn label="Retour" onClick={function(){setStep(function(s){return s-1;});}} variant="ghost" style={{flex:1}}/>}
        <Btn label={step===3?"Lancer FuelRun":"Continuer"}
          onClick={function(){
            if(step===3)p.onDone({name:name,age:age,weight:weight,height:height,sex:sex,level:level,sessWeek:sessWeek,kmWeek:kmWeek,race:selected});
            else setStep(function(s){return s+1;});
          }}
          disabled={!canNext} style={{flex:2}}/>
      </div>
    </div>
  );
}
