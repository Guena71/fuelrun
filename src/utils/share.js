var APP_URL="https://fuelrun.vercel.app";

export async function share(text){
  var payload={title:"FuelRun",text:text,url:APP_URL};
  if(navigator.share){
    try{await navigator.share(payload);return true;}catch(e){if(e.name==="AbortError")return false;}
  }
  // Fallback : copie dans le presse-papiers
  try{
    await navigator.clipboard.writeText(text+"\n"+APP_URL);
    return "copied";
  }catch(e){return false;}
}

export function shareBadge(badge){
  return share(
    "🏅 J'ai débloqué le badge \""+badge.name+"\" sur FuelRun !\n"+
    badge.emoji+" "+badge.desc+"\n"+
    "👟 Rejoins-moi sur FuelRun"
  );
}

export function shareChallenge(challenge,done){
  return share(
    "🔥 Challenge relevé sur FuelRun !\n"+
    challenge.icon+" "+challenge.label+"\n"+
    "✅ "+done+"/"+challenge.target+" · +"+challenge.xp+" XP\n"+
    "👟 Rejoins-moi sur FuelRun"
  );
}

export function shareRun(km,min){
  var pace=min&&km?Math.round((parseFloat(min)/parseFloat(km))*60):"";
  var paceStr=pace?Math.floor(pace/60)+"'"+(pace%60<10?"0"+pace%60:pace%60)+'"/km':"";
  return share(
    "🏃 Nouvelle sortie sur FuelRun !\n"+
    "📍 "+parseFloat(km).toFixed(1)+" km"+(min?" · "+min+" min":"")+(paceStr?" · "+paceStr:"")+"\n"+
    "👟 Rejoins-moi sur FuelRun"
  );
}
