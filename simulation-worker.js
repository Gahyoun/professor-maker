import {simulateMonth,decide} from './engine.js';
self.onmessage=e=>{const {id,type,state,plan,options,choice}=e.data;try{if(type!=='month'&&type!=='decision')throw new Error('Unknown simulation operation');const next=type==='month'?simulateMonth(state,plan,options):decide(state,choice);self.postMessage({id,state:next});}catch(error){self.postMessage({id,error:error.message});}};
