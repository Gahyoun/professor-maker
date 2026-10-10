// Presentation-only motion. None of these helpers read or change simulation state.
export function motionAllowed(){
 return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function animate(element,frames,options){
 if(!element?.animate||!motionAllowed())return null;
 const animation=element.animate(frames,{easing:'cubic-bezier(.2,.8,.2,1)',...options});
 animation.finished.then(()=>animation.cancel(),()=>{});
 return animation;
}

export function enterPage(main,{focus=false}={}){
 if(!main)return;
 if(focus)main.focus({preventScroll:true});
 // Animate contents, not the sticky room's containing block.
 const content=main.querySelector('.page-title:not(.home-page-title)')??main.querySelector('.portal-hero');
 animate(content,[{opacity:.6,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220});
 const decision=main.querySelector('#decision');
 animate(decision,[{opacity:.7,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,delay:40});
}

export function enterDialog(dialog,{alreadyOpen=false,direction=1}={}){
 const paper=dialog?.querySelector('.letter-paper');
 if(paper){
  animate(paper,[{opacity:.65,transform:`translateX(${direction*8}px)`},{opacity:1,transform:'translateX(0)'}],{duration:210});
 }else if(!alreadyOpen){
  animate(dialog,[{opacity:.7,transform:'translateY(8px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:180});
 }
}

export function enterWeek(stage,{first=false,monthLabel=''}={}){
 const header=stage?.querySelector('.week-scene-header');
 const outcome=stage?.querySelector('.week-outcome');
 animate(header,[{opacity:.7,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
 animate(outcome,[{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,delay:150});
 if(!first||!motionAllowed()||!stage)return;
 const cue=document.createElement('div');
 cue.className='month-cue';cue.setAttribute('aria-hidden','true');
 const month=document.createElement('strong');month.textContent=monthLabel;
 const caption=document.createElement('span');caption.textContent='이번 달의 일정';
 cue.append(caption,month);stage.append(cue);
 const animation=animate(cue,[
  {opacity:0,transform:'translateX(-18px)',offset:0},
  {opacity:1,transform:'translateX(0)',offset:.2},
  {opacity:1,transform:'translateX(0)',offset:.75},
  {opacity:0,transform:'translateX(12px)',offset:1}
 ],{duration:650});
 if(animation)animation.finished.then(()=>cue.remove(),()=>cue.remove());else cue.remove();
}

// A skip button remains available to keyboard users while other controls are inert.
export function focusPlayback(stage){
 const skip=stage?.querySelector('[data-skip-weeks]');
 skip?.focus({preventScroll:true});
}
