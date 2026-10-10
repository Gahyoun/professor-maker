// Read student letters across page breaks, stopping at their signatures.
// A professor's later reply belongs to a different speaker and letter.
export function studentLetterBodies(pages){
 const text=pages.join('\n\n'),bodies=[];
 const greeting=/(?:^|\n)(?:(?:지도)?교수님께\.|Dear Professor[,.])/gm;
 let match;
 while((match=greeting.exec(text))){
  const start=match.index,end=text.slice(start).search(/\n[―—][ \t]*[^\n]+(?:\n|$)/u);
  if(end<0)continue;
  bodies.push(text.slice(start,start+end).trim());
  greeting.lastIndex=start+end;
 }
 return bodies;
}

export function studentLetterProseIssues(pages){
 const bodies=studentLetterBodies(pages);
 const promises=body=>body.split(/(?<=[.!?])\s+|\n+/u).filter(sentence=>/^다음(?:에(?:는)?\s|\s+학회(?:에서|에서는)\s)/.test(sentence.trim())).length;
 return {
  incompleteClosings:bodies.filter(body=>!/[.?!。！？]$/.test(body)).length,
  nextPromises:Math.max(0,...bodies.map(promises))
 };
}
