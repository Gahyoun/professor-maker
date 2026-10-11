// Read-only notice data. Deposits are gross amounts, before pooling or debt repayment.
export function monthlyFundingNotice(state){
 const history=(state.history??[]).filter(h=>h.month===state.month);
 const results=state.lastReport?.month===state.month?(state.lastReport.fundingResults??[]):[];
 const annual=history.filter(h=>h.kind==='annual-grant');
 const selections=results.map(r=>({...r,paid:r.awarded?(r.source==='portfolio'?r.annual:annual.reduce((n,h)=>n+h.amount,0)):0}));
 const renewed=selections.some(r=>r.source==='renewal'&&r.awarded);
 const payments=history.filter(h=>h.kind==='portfolio-payment'||h.kind==='annual-grant'&&!renewed).map(h=>({amount:h.amount,titleIndex:h.kind==='portfolio-payment'?state.grants?.portfolio?.find(g=>g.id===h.grantId)?.titleIndex:state.grants?.titleIndex}));
 const gross=selections.reduce((n,r)=>n+r.paid,0)+payments.reduce((n,h)=>n+h.amount,0);
 const repaid=history.filter(h=>h.kind==='advance-repayment').reduce((n,h)=>n+h.amount,0);
 return {results:selections,payments,gross,repaid};
}
