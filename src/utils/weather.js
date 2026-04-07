import { BL, YE, MUT, RE } from "../data/constants.js";

export function weatherAdvice(code,temp,wind){
  var desc,color;
  if(code===0)     {desc="Ciel dégagé";color=YE;}
  else if(code<=3) {desc="Nuageux";color=BL;}
  else if(code<=48){desc="Brouillard";color=MUT;}
  else if(code<=55){desc="Bruine";color=BL;}
  else if(code<=65){desc="Pluie";color=BL;}
  else if(code<=77){desc="Neige";color=BL;}
  else if(code<=82){desc="Averses";color=BL;}
  else             {desc="Orage";color=RE;}
  var tip;
  if(code>=95)     tip="Orage — entraînement en salle recommandé.";
  else if(code>=71)tip="Sols glissants — réduis ton allure, sois prudent.";
  else if(code>=61)tip="Pluie — tenue imperméable, evite les chaussures légères.";
  else if(temp<0)  tip="Froid extrême — 3 couches, échauffement long.";
  else if(temp<5)  tip="Froid — bonnet et gants obligatoires.";
  else if(temp<15) tip="Température idéale pour la performance.";
  else if(temp<20) tip="Bonne température — hydratation normale.";
  else if(temp<25) tip="Chaud — bois 200 ml toutes les 20 min.";
  else if(temp<30) tip="Très chaud — ralentis de 10-15 sec/km.";
  else             tip="Chaleur extrême — sors tôt le matin seulement.";
  if(wind>30&&code<61)tip+=" Vent fort, planifie ton parcours en conséquence.";
  var icon=code===0?"☀":code<=3?"⛅":code<=48?"🌫":code<=65?"🌧":code<=77?"❄":code<=82?"🌦":"⛈";
  return{desc:desc,tip:tip,color:color,icon:icon};
}
