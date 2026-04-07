// ── Palette de couleurs ──────────────────────────────────────────────────
export var BG="#0a0a0a",SURF="#161616",SURF2="#222222",BORD="#383838";
export var TXT="#f0f0f0",SUB="#a0a0a0",MUT="#686868";
export var OR="#FF5A1F",GR="#22C55E",BL="#3B82F6",PU="#A855F7",YE="#F59E0B",RE="#EF4444";

// ── CSS global injecté ──────────────────────────────────────────────────
export var CSS=[
  "*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}",
  "html{overflow-x:hidden;overscroll-behavior:none;max-width:100vw;position:relative;}",
  "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;overflow-x:hidden;overscroll-behavior:none;max-width:100vw;position:relative;}",
  "#root{overflow-x:hidden;max-width:100vw;position:relative;}",
  "input,select,textarea{font-size:16px!important;}",
  "@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}",
  "@keyframes run{0%{transform:translateX(-4px)}50%{transform:translateX(4px)}100%{transform:translateX(-4px)}}",
  "@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
  "input,textarea,button{font-family:inherit;}",
  "input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;outline:none;cursor:pointer;}",
  "input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;cursor:pointer;background:#f0f0f0;}",
  "::-webkit-scrollbar{width:0;height:0;}"
].join("");

// ── Localisation date ────────────────────────────────────────────────────
export var MONTHS_F=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
export var MONTHS_S=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
export var WDAYS=["L","M","M","J","V","S","D"];
