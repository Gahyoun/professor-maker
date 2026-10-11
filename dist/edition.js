export const EDITION=typeof document!=='undefined'&&document.documentElement.lang==='en'?'en':'ko';
export const editionStorageKey=(key,locale=EDITION)=>locale==='en'?(String(key).startsWith('pm-')?'pm-us-'+String(key).slice(3):'pm-us:'+key):key;
export const campusEditionHref=locale=>locale==='en'?'./en.html':'./index.html';
// Both editions use the same modeled budget units. This is a local game scale,
// not a currency exchange rate or a promise of an institution's actual costs.
export const currencyFormat=(amount,locale=EDITION)=>locale==='en'?'$'+Math.round(Number(amount)*250).toLocaleString('en-US'):Math.round(Number(amount)*10).toLocaleString('ko-KR')+'만원';
