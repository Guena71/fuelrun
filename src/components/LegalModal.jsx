import { SURF, SURF2, BORD, TXT, SUB, OR } from "../data/constants.js";

var LEGAL_CGU=`CONDITIONS GÉNÉRALES D'UTILISATION

Dernière mise à jour : avril 2026

1. OBJET
FuelRun est une application de coaching sportif personnalisé pour la course à pied. Les présentes CGU régissent l'utilisation de l'application par tout utilisateur inscrit.

2. ACCÈS AU SERVICE
L'application est accessible depuis tout appareil connecté à Internet. L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à maintenir la confidentialité de ses identifiants.

3. FORMULES ET ABONNEMENTS
• Gratuit : accès limité (3 semaines de plan, essai recettes 14 jours)
• Essentiel (4,99 €/mois) : plan complet, nutrition de base
• Pro (9,99 €/mois) : toutes fonctionnalités, coach IA illimité, recettes premium
• Elite (19,99 €/mois) : coaching personnalisé avancé

Les abonnements sont sans engagement et résiliables à tout moment depuis les paramètres. Aucun remboursement ne sera effectué pour une période déjà facturée.

4. PROPRIÉTÉ INTELLECTUELLE
Tous les contenus de FuelRun (plans d'entraînement, recettes, textes, design) sont la propriété exclusive de FuelRun. Toute reproduction sans autorisation est interdite.

5. RESPONSABILITÉ
FuelRun est un outil d'aide à l'entraînement. Il ne remplace pas un avis médical professionnel. L'utilisateur pratique à ses propres risques. FuelRun ne saurait être tenu responsable de blessures ou dommages résultant de l'utilisation du service.

6. MODIFICATION DES CGU
FuelRun se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par notification dans l'application.

7. DROIT APPLICABLE
Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux français.

Contact : contact@fuelrun.app`;

var LEGAL_PRIVACY=`POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : avril 2026

1. RESPONSABLE DU TRAITEMENT
FuelRun — contact@fuelrun.app

2. DONNÉES COLLECTÉES
Dans le cadre de l'utilisation de l'application, FuelRun collecte :
• Données de compte : adresse e-mail, méthode d'authentification
• Profil sportif : prénom, âge, poids, taille, sexe, niveau de pratique
• Données d'entraînement : séances, distances, temps, statistiques
• Données de course : objectifs, résultats
• Données techniques : identifiant anonyme Firebase, logs d'erreur

3. FINALITÉS DU TRAITEMENT
Les données sont utilisées pour :
• Personnaliser le plan d'entraînement et les recommandations nutritionnelles
• Calculer les statistiques et le suivi de progression
• Assurer le fonctionnement du service et la synchronisation multi-appareils
• Répondre aux demandes de support

4. BASE LÉGALE
Le traitement est fondé sur l'exécution du contrat (service souscrit) et, pour les communications, sur votre consentement.

5. HÉBERGEMENT ET SOUS-TRAITANTS
Les données sont hébergées sur Firebase (Google LLC, USA) dans le cadre du programme EU-US Data Privacy Framework, offrant un niveau de protection adéquat.

6. DURÉE DE CONSERVATION
Les données sont conservées pendant toute la durée d'utilisation du compte. En cas de suppression du compte, les données sont effacées sous 30 jours.

7. VOS DROITS (RGPD)
Conformément au RGPD, vous disposez des droits suivants :
• Droit d'accès à vos données
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la portabilité (export JSON disponible dans l'application)
• Droit d'opposition au traitement

Pour exercer vos droits, contactez : contact@fuelrun.app

8. SÉCURITÉ
L'accès aux données est protégé par authentification Firebase. Les données en transit sont chiffrées (HTTPS/TLS).

9. COOKIES
L'application utilise le stockage local (localStorage) uniquement pour les préférences utilisateur et le cache applicatif. Aucun cookie publicitaire n'est utilisé.

Contact DPO : contact@fuelrun.app`;

export function LegalModal(p){
  if(!p.open)return null;
  var content=p.open==="cgu"?LEGAL_CGU:LEGAL_PRIVACY;
  var title=p.open==="cgu"?"Conditions Générales d'Utilisation":"Politique de Confidentialité";
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.85)",display:"flex",flexDirection:"column"}}>
      <div style={{background:SURF,flex:1,display:"flex",flexDirection:"column",marginTop:48,borderRadius:"24px 24px 0 0",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 16px",borderBottom:"1px solid "+BORD,flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:700,color:TXT}}>{title}</div>
          <button onClick={p.onClose} style={{background:SURF2,border:"none",color:TXT,fontSize:20,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"20px"}}>
          {content.split("\n").map(function(line,i){
            var isSec=line.match(/^\d+\./);
            var isBullet=line.startsWith("•");
            return line===""
              ?<div key={i} style={{height:8}}/>
              :<div key={i} style={{fontSize:isSec?14:13,fontWeight:isSec?700:400,color:isSec?TXT:isBullet?SUB:SUB,marginBottom:isSec?6:3,paddingLeft:isBullet?12:0,lineHeight:1.6}}>{line}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
