export var MEALS_MAP={
  easy:    [{time:"Matin",      food:"Porridge + fruits rouges"},          {time:"Midi",         food:"Riz + poulet + légumes"},      {time:"Soir",      food:"Pâtes + saumon + salade"}],
  long:    [{time:"Matin J−3h", food:"Flocons d'avoine + banane + miel"},  {time:"Pendant",      food:"1 gel toutes les 45 min + eau"},{time:"Récup 30min",food:"Boisson protéines + banane"}],
  interval:[{time:"Matin",      food:"Toast + œufs + jus d'orange"},       {time:"Midi",         food:"Quinoa + légumes"},            {time:"Soir",      food:"Poulet + patate douce"}],
  recovery:[{time:"Matin",      food:"Smoothie protéine + fruits"},        {time:"Midi",         food:"Salade + pain complet"},       {time:"Soir",      food:"Soupe + poisson blanc + riz"}],
  tempo:   [{time:"Matin",      food:"Toast + beurre d'amande + banane"},  {time:"Midi",         food:"Pâtes + thon + tomates"},      {time:"Soir",      food:"Riz + poulet + brocolis"}],
  rest:    [{time:"Matin",      food:"Yaourt grec + granola + miel"},      {time:"Midi",         food:"Salade composée + protéines"}, {time:"Soir",      food:"Légumes rôtis + poisson"}],
  race:    [{time:"Matin J−3h", food:"Riz ou pâtes blanches + banane"},    {time:"Pendant",      food:"Gels + eau régulièrement"},    {time:"Récup",     food:"Boisson récup + fruits + protéines"}]
};

export var RECIPES={
  easy:[
    {name:"Overnight oats protéinés",slot:"Matin",time:"5 min + nuit",kcal:420,
     ingredients:["80 g flocons d'avoine","200 ml lait entier","120 g yaourt grec","1 c. à soupe de graines de chia","1 banane","1 c. à soupe de miel","Quelques noix concassées"],
     steps:["La veille au soir, mélanger les flocons, le lait, le yaourt et les graines de chia dans un bocal.","Fermer et réfrigérer toute la nuit.","Au matin, garnir de rondelles de banane, de miel et de noix.","Consommer froid directement dans le bocal."]},
    {name:"Wrap poulet avocat roquette",slot:"Midi",time:"15 min",kcal:540,
     ingredients:["2 tortillas de blé complet","150 g filet de poulet","1 avocat mûr","1 poignée de roquette","1 c. à soupe de tzatziki","Jus de citron vert","Paprika fumé"],
     steps:["Assaisonner le poulet de paprika, sel et poivre, cuire 6 min à la poêle.","Trancher le poulet et l'avocat.","Étaler le tzatziki sur chaque tortilla.","Garnir de poulet, avocat, roquette et citron vert.","Rouler serré et couper en deux en diagonale."]},
    {name:"Pâtes complètes saumon épinards",slot:"Soir",time:"20 min",kcal:560,
     ingredients:["180 g pâtes complètes","130 g saumon frais","80 g épinards frais","1 échalote","10 cl crème légère","1 c. à soupe d'huile d'olive","Aneth, zeste de citron","Sel, poivre"],
     steps:["Cuire les pâtes al dente selon paquet.","Faire revenir l'échalote 2 min à l'huile d'olive.","Ajouter le saumon en dés, cuire 4 min.","Incorporer les épinards et la crème, chauffer 2 min.","Mélanger avec les pâtes, finir avec l'aneth et le zeste de citron."]}
  ],
  long:[
    {name:"Riz de l'athlète banane-miel",slot:"Matin J−3h",time:"15 min",kcal:580,
     ingredients:["220 g riz blanc à sushi","1 banane","2 c. à soupe de miel","1 pincée de sel","1 c. à café de cannelle","200 ml eau"],
     steps:["Cuire le riz à l'eau salée jusqu'à absorption complète (~12 min).","Laisser tiédir 5 minutes.","Ajouter le miel et la cannelle, mélanger délicatement.","Garnir de rondelles de banane.","Manger exactement 3h avant le départ — ne pas raccourcir ce délai."]},
    {name:"Boules énergie dattes-coco-gingembre",slot:"Pendant (toutes les 45 min)",time:"15 min",kcal:210,
     ingredients:["200 g dattes Medjool dénoyautées","60 g flocons d'avoine","40 g noix de coco râpée","1 c. à café de gingembre frais râpé","1 pincée de sel","Zeste d'un citron"],
     steps:["Mixer les dattes jusqu'à obtenir une pâte homogène.","Ajouter les flocons, la noix de coco, le gingembre, le sel et le zeste.","Mixer par impulsions jusqu'à mélange homogène.","Former 10 boules d'environ 30 g chacune.","Conserver dans une boîte hermétique — consommer 1 boule toutes les 40-45 min d'effort."]},
    {name:"Shake récupération 4:1",slot:"Récup — dans les 30 min",time:"5 min",kcal:440,
     ingredients:["300 ml lait entier","1 grande banane","30 g protéines en poudre (vanille ou chocolat)","1 c. à soupe de beurre de cacahuète","1 c. à café de miel","1 pincée de fleur de sel"],
     steps:["Mettre tous les ingrédients dans un blender.","Mixer 30 secondes à vitesse maximum.","Boire immédiatement — la fenêtre anabolique est ouverte 20 à 30 min après l'effort.","Ratio glucides/protéines 4:1 optimal pour la resynthèse du glycogène."]},
    {name:"Risotto poulet-épinards récupération",slot:"Soir",time:"30 min",kcal:620,
     ingredients:["200 g riz arborio","200 g filet de poulet","100 g épinards frais","1 oignon","80 cl bouillon de volaille","40 g parmesan râpé","2 c. à soupe d'huile d'olive","Sel, poivre"],
     steps:["Faire revenir l'oignon haché 3 min à l'huile d'olive.","Ajouter le riz, nacrer 2 min en remuant.","Verser le bouillon chaud louche par louche en remuant constamment (~18 min).","En parallèle, griller le poulet assaisonné et trancher.","Incorporer les épinards et le parmesan en fin de cuisson.","Servir avec le poulet posé dessus."]}
  ],
  interval:[
    {name:"Toast avocat-œuf poché-saumon fumé",slot:"Matin (90 min avant)",time:"15 min",kcal:480,
     ingredients:["2 tranches de pain de seigle","2 œufs frais","1 avocat mûr","60 g saumon fumé","1 c. à soupe de vinaigre blanc","Ciboulette ciselée","Piment d'Espelette","Fleur de sel"],
     steps:["Porter l'eau à frémissement avec le vinaigre. Former un tourbillon et plonger les œufs 3 min.","Toaster le pain de seigle.","Écraser l'avocat à la fourchette avec une pincée de fleur de sel.","Étaler l'avocat, poser le saumon fumé puis l'œuf poché.","Finir avec ciboulette et piment d'Espelette."]},
    {name:"Buddha bowl quinoa-edamame-betterave",slot:"Midi",time:"20 min",kcal:580,
     ingredients:["160 g quinoa tricolore","100 g edamame surgelés","150 g betterave cuite","1 avocat","50 g feta","2 c. à soupe de graines de courge","Sauce tahini : 2 c. à soupe tahini, 1 citron, 1 c. à café d'ail","Sel, poivre"],
     steps:["Cuire le quinoa 12 min dans de l'eau salée, égoutter et refroidir.","Cuire les edamame 3 min à l'eau bouillante.","Préparer la sauce tahini : mixer le tahini, le jus de citron, l'ail et 3 c. à soupe d'eau.","Disposer tous les ingrédients en sections dans un bol.","Napper de sauce tahini et parsemer de graines de courge."]},
    {name:"Wok bœuf-légumes-nouilles soba",slot:"Soir",time:"20 min",kcal:560,
     ingredients:["160 g nouilles soba","200 g filet de bœuf tranché fin","150 g brocolis","1 poivron rouge","2 carottes","3 c. à soupe de sauce soja","1 c. à soupe de gingembre frais","1 c. à café d'huile de sésame","Graines de sésame"],
     steps:["Cuire les soba 5 min, rincer à l'eau froide, réserver.","Faire chauffer un wok à feu vif avec un filet d'huile.","Saisir le bœuf 2 min, réserver.","Faire sauter les légumes 5 min en gardant du croquant.","Remettre le bœuf, les soba, la sauce soja et le gingembre.","Mélanger 1 min, finir avec l'huile de sésame et les graines."]}
  ],
  tempo:[
    {name:"Pancakes avoine-banane sans gluten",slot:"Matin (2h avant)",time:"20 min",kcal:430,
     ingredients:["120 g flocons d'avoine mixés","2 œufs","1 banane écrasée","150 ml lait","1 c. à café de levure","1 pincée de sel","Miel et baies pour servir"],
     steps:["Mixer les flocons d'avoine en farine grossière.","Mélanger avec les œufs, la banane écrasée, le lait, la levure et le sel.","Laisser reposer 5 minutes — la pâte doit être épaisse mais coulante.","Cuire dans une poêle anti-adhésive légèrement huilée, 2 min par face.","Servir avec un filet de miel et quelques baies fraîches."]},
    {name:"Pâtes pesto rucola-noix-parmesan",slot:"Midi",time:"15 min",kcal:620,
     ingredients:["200 g pâtes linguine","50 g roquette","30 g noix","30 g parmesan","1 gousse d'ail","4 c. à soupe d'huile d'olive","Jus d'un demi-citron","Sel, poivre"],
     steps:["Cuire les pâtes al dente.","Pendant ce temps, mixer la roquette, les noix, le parmesan, l'ail, l'huile et le citron en pesto grossier.","Réserver 2 c. à soupe d'eau de cuisson avant d'égoutter.","Mélanger les pâtes égouttées avec le pesto et un peu d'eau de cuisson.","Poivrer généreusement, servir immédiatement."]},
    {name:"Saumon en croûte d'herbes et purée de patate douce",slot:"Soir",time:"25 min",kcal:580,
     ingredients:["200 g filet de saumon","400 g patate douce","2 c. à soupe de chapelure","1 c. à soupe de persil haché","1 c. à café de moutarde de Dijon","1 c. à soupe d'huile d'olive","20 g beurre","Sel, poivre, muscade"],
     steps:["Préchauffer le four à 200 °C.","Cuire la patate douce en cubes vapeur 15 min, écraser avec le beurre, sel et muscade.","Badigeonner le saumon de moutarde, recouvrir du mélange chapelure-persil.","Enfourner 12 min jusqu'à ce que la croûte soit dorée.","Servir le saumon sur la purée avec un filet d'huile d'olive."]}
  ],
  recovery:[
    {name:"Chia pudding coco-mangue-curcuma",slot:"Matin",time:"5 min + nuit",kcal:370,
     ingredients:["4 c. à soupe de graines de chia","200 ml lait de coco","100 ml lait d'amande","1 mangue fraîche","1/2 c. à café de curcuma","1 c. à café de miel","1 pincée de poivre noir (active le curcuma)"],
     steps:["La veille, mélanger les graines de chia, les deux laits, le curcuma, le poivre et le miel.","Bien remuer et réfrigérer toute la nuit.","Le matin, remuer à nouveau — la texture doit être épaisse comme un pudding.","Garnir de dés de mangue fraîche.","Le curcuma + poivre noir est un puissant anti-inflammatoire naturel pour accélérer la récupération."]},
    {name:"Soupe lentilles-corail-coco au curry",slot:"Midi",time:"25 min",kcal:400,
     ingredients:["200 g lentilles corail","1 boîte lait de coco (400 ml)","400 ml bouillon légumes","1 oignon","2 gousses d'ail","1 c. à soupe de curry","1 c. à café de cumin","1 c. à soupe d'huile d'olive","Coriandre fraîche","Pain complet pour accompagner"],
     steps:["Faire revenir l'oignon et l'ail 3 min dans l'huile d'olive.","Ajouter le curry et le cumin, torréfier 1 min en remuant.","Incorporer les lentilles rincées, le bouillon et le lait de coco.","Cuire à feu doux 18-20 min jusqu'à ce que les lentilles soient fondantes.","Mixer partiellement pour une texture onctueuse avec des morceaux.","Garnir de coriandre fraîche."]},
    {name:"Cabillaud vapeur, légumes rôtis et huile d'olive",slot:"Soir",time:"25 min",kcal:380,
     ingredients:["200 g dos de cabillaud","200 g courgettes","150 g poivrons colorés","100 g tomates cerises","3 c. à soupe d'huile d'olive extra-vierge","1 citron","Thym, romarin","Fleur de sel, poivre"],
     steps:["Préchauffer le four à 200 °C.","Couper les légumes en morceaux, arroser de 2 c. à soupe d'huile, thym, romarin, sel et poivre.","Rôtir 20 min au four en retournant à mi-cuisson.","Cuire le cabillaud à la vapeur 8-10 min selon épaisseur.","Servir le poisson sur les légumes, arroser d'huile d'olive crue et de jus de citron.","L'huile crue préserve les Oméga-3 et les polyphénols anti-inflammatoires."]}
  ],
  race:[
    {name:"Riz de l'athlète — protocole race day",slot:"Matin J−3h précises",time:"15 min",kcal:650,
     ingredients:["280 g riz blanc japonais (sushi)","2 c. à soupe d'huile d'olive","30 g parmesan râpé","1 pincée de sel fin","1 c. à café de sauce soja","Basilic frais (optionnel)"],
     steps:["Cuire le riz à l'eau avec 1 pincée de sel jusqu'à absorption complète (~13 min).","Laisser reposer 5 min à couvert.","Incorporer l'huile d'olive et la sauce soja en mélangeant délicatement.","Parsemer de parmesan.","Manger exactement 3h avant le départ, ni plus tôt ni plus tard.","Ne pas changer ce repas le jour J — rester sur ses habitudes prouvées."]},
    {name:"Boules énergie course — gingembre-sel-citron",slot:"Pendant (toutes les 40 min)",time:"15 min",kcal:185,
     ingredients:["180 g dattes Medjool","40 g flocons d'avoine","1/2 c. à café de gingembre en poudre","1 pincée généreuse de sel (électrolytes)","Zeste d'un citron","1 c. à café de jus de citron"],
     steps:["Dénoyauter les dattes, mixer en pâte lisse.","Ajouter flocons, gingembre, sel et zeste.","Mixer en impulsions jusqu'à mélange homogène.","Former 8 boules de 30 g, filmer individuellement.","Consommer 1 boule toutes les 40 min avec quelques gorgées d'eau.","Le sel compense les pertes en sodium par la sueur."]},
    {name:"Shake de récupération golden milk protéiné",slot:"Récup — dans les 20 min",time:"5 min",kcal:390,
     ingredients:["300 ml lait entier chaud","30 g protéines whey vanille","1 banane","1 c. à café de curcuma","1/2 c. à café de cannelle","1 c. à café de miel","1 pincée de poivre noir"],
     steps:["Chauffer le lait sans faire bouillir.","Mixer avec tous les ingrédients 30 secondes.","Boire immédiatement dans les 20 minutes après la ligne d'arrivée.","Le curcuma + poivre relance la récupération musculaire.","Compléter avec un repas solide 90 min plus tard (riz, poulet, légumes)."]}
  ]
};
