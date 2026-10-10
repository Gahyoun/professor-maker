// Grammar for generated names and discipline labels. No simulation RNG.
function finalConsonant(word){
 const last=Array.from(String(word).trim().normalize('NFC')).at(-1),code=last?.codePointAt(0);
 if(code>=0xac00&&code<=0xd7a3)return (code-0xac00)%28;
 return 0;
}
export function particle(word,pair){
 const final=finalConsonant(word),[closed,open]=pair.split('/');
 return pair==='으로/로'?(final&&final!==8?closed:open):(final?closed:open);
}
export function withParticle(word,pair){return String(word)+particle(word,pair);}
export function formatStudentName(text,name,locale='ko'){
 if(name==null)return String(text);
 if(locale!=='ko')return String(text).replaceAll('{name}',()=>String(name));
 const pairs={'은':'은/는','는':'은/는','이':'이/가','가':'이/가','을':'을/를','를':'을/를','과':'과/와','와':'과/와','으로':'으로/로','로':'으로/로'};
 return String(text).replace(/\{name\}(이었다|였다|이라고|라고|이라는|라는|으로|로|은|는|이|가|을|를|과|와)?/g,(_,suffix='')=>{
  if(['이었다','였다'].includes(suffix))return String(name)+(finalConsonant(name)?'이었다':'였다');
  if(['이라고','라고'].includes(suffix))return String(name)+(finalConsonant(name)?'이라고':'라고');
  if(['이라는','라는'].includes(suffix))return String(name)+(finalConsonant(name)?'이라는':'라는');
  return String(name)+(pairs[suffix]?particle(name,pairs[suffix]):suffix);
 });
}
