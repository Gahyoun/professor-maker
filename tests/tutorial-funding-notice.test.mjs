import test from 'node:test';
import assert from 'node:assert/strict';
import {SCREEN_GUIDE_STEPS,initialScreenGuide,validScreenGuide,screenGuideForRun,moveScreenGuide} from '../dist/tutorial.js';
import {monthlyFundingNotice} from '../dist/funding-notice.js';
test('First run guide is independent, resumable, skippable, replayable and existing runs opt in',()=>{
 const state={started:true,creationSeed:73},copy=structuredClone(state);
 const first=screenGuideForRun(initialScreenGuide(),state,{newRun:true});assert.equal(first.status,'active');assert.equal(first.step,0);
 let next=moveScreenGuide(first,'next');assert.equal(next.step,1);assert.deepEqual(screenGuideForRun(next,state),next);assert.deepEqual(moveScreenGuide(next,'back'),first);
 assert.equal(moveScreenGuide(next,'skip').status,'skipped');assert.equal(moveScreenGuide(moveScreenGuide(next,'skip'),'start').step,0);
 next={...next,step:SCREEN_GUIDE_STEPS.length-1};assert.equal(moveScreenGuide(next,'next').status,'complete');
 assert.equal(screenGuideForRun(first,{started:true,creationSeed:74},{newRun:true}).status,'available');
 assert.equal(screenGuideForRun(initialScreenGuide(),state).status,'available');assert.ok(validScreenGuide(next));assert.deepEqual(state,copy);
 assert.match(SCREEN_GUIDE_STEPS[0].body,/8년/);assert.match(SCREEN_GUIDE_STEPS.find(s=>s.id==='funding').body,/3월·9월/);
});
test('New awards keep gross deposit distinct from annual amount and debt repayment',()=>{
 const state={month:13,grants:{titleIndex:1,portfolio:[]},lastReport:{month:13,fundingResults:[{source:'renewal',awarded:true,annual:345,titleIndex:1}]},history:[{month:13,kind:'annual-grant',amount:207},{month:13,kind:'advance-repayment',amount:135},{month:12,kind:'annual-grant',amount:300}]};
 const copy=structuredClone(state),notice=monthlyFundingNotice(state);assert.equal(notice.results[0].annual,345);assert.equal(notice.results[0].paid,207);assert.equal(notice.gross,207);assert.equal(notice.repaid,135);assert.deepEqual(notice.payments,[]);assert.deepEqual(state,copy);
});
test('Portfolio awards and scheduled payments are separate; stale results disappear',()=>{
 const state={month:13,grants:{titleIndex:0,portfolio:[{id:1,titleIndex:1}]},lastReport:{month:13,fundingResults:[{source:'portfolio',awarded:true,annual:173,titleIndex:2}]},history:[{month:13,kind:'portfolio-payment',grantId:1,amount:173},{month:13,kind:'annual-grant',amount:345}]};
 const notice=monthlyFundingNotice(state);assert.equal(notice.results[0].paid,173);assert.equal(notice.payments.length,2);assert.equal(notice.gross,691);
 state.month=14;assert.deepEqual(monthlyFundingNotice(state),{results:[],payments:[],gross:0,repaid:0});
});
