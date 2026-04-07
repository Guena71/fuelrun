export function ls(key,fallback){try{var v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
export function lsSet(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
