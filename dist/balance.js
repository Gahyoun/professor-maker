// Fictional simulation tuning; the owner editor lives outside the player service.
export const GAME_BALANCE = {
  abilityGrowthScale: .5,
  policyGrowthScale: .2,
  graduateResilienceDecay: .14,
  earlyDoctoralResilienceDecay: .22,
  undergradResilienceDecay: .03,
  restResilienceRecovery: .28,
  conversationResilienceRecovery: .18,
  praiseEfficiency: 1.08,
  critiqueEfficiency: 1.08,
  mismatchedFeedbackEfficiency: .92,
  undergraduateMistakeRate: .12,
  masterMistakeRate: .05,
  doctoralMistakeRate: .015,
  projectProgressScale: .5,
  randomEventProbability: .18
};
export function validBalance(value){
 const limits={abilityGrowthScale:[0,1],policyGrowthScale:[0,1],graduateResilienceDecay:[0,1],earlyDoctoralResilienceDecay:[0,1],undergradResilienceDecay:[0,.5],restResilienceRecovery:[0,2],conversationResilienceRecovery:[0,2],praiseEfficiency:[1,1.5],critiqueEfficiency:[1,1.5],mismatchedFeedbackEfficiency:[.5,1],undergraduateMistakeRate:[0,.3],masterMistakeRate:[0,.3],doctoralMistakeRate:[0,.3],projectProgressScale:[.5,1.5],randomEventProbability:[0,.5]};
 return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===Object.keys(limits).length&&Object.entries(limits).every(([k,[lo,hi]])=>Number.isFinite(value[k])&&value[k]>=lo&&value[k]<=hi);
}
