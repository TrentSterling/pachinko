'use strict';
const{instrument}=require('./runtime.cjs');
function install(hook){
 let seed=1234,calls=0;Math.random=()=>{calls++;return((seed=(seed*1664525+1013904223)>>>0)/4294967296);};window.__pachinkoRng=()=>({seed,calls});
 window.requestAnimationFrame=()=>0;
 const getContext=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(...args){const ctx=getContext.apply(this,args);if(this.id==='gameCanvas'&&ctx&&!ctx.__pachinkoTracked){ctx.__pachinkoTracked=true;let depth=0,underflows=0;const save=ctx.save,restore=ctx.restore;ctx.save=function(){depth++;return save.call(this);};ctx.restore=function(){if(depth)depth--;else underflows++;return restore.call(this);};window.__pachinkoCanvas=()=>({depth,underflows,matrix:Array.from(ctx.getTransform().toFloat64Array())});}return ctx;};
 const add=document.addEventListener;
 document.addEventListener=function(type,callback,options){if(type==='DOMContentLoaded'&&typeof callback==='function'&&callback.toString().includes('function gameLoop(')){const s=callback.toString(),marker='            createBoard();';if(s.split(marker).length!==2)throw Error('QA exposure anchor changed');callback=(0,eval)('('+s.replace(marker,hook+marker)+')');}return add.call(this,type,callback,options);};
 window.__pachinkoVisibility=hidden=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});window.__pachinkoQA.resetClock();};
}
const marker='            createBoard();';
const initSource='('+install.toString()+')('+JSON.stringify(instrument(marker).replace(marker,''))+');';
function fixture(hz=60){
 const q=window.__pachinkoQA,base=q.clock()||0,check=(condition,message)=>{if(!condition)throw Error(message);};
 check(document.readyState==='complete','page initialization incomplete');const initialRandom=window.__pachinkoRng();
 const identity=()=>{const c=window.__pachinkoCanvas();check(c.depth===0&&c.underflows===0,'unbalanced canvas');const m=c.matrix;check(m.every((v,i)=>v===(i%5===0?1:0)),'canvas transform leaked');check(!q.snapshot().audioInitialized,'audio initialized');};
 q.drop();for(let i=1;i<=hz*10;i++)q.frame(base+i*1000/hz);identity();const complete=q.snapshot(),random=window.__pachinkoRng();check(!complete.ball&&complete.totalScore>0,'drop did not finish');
 let now=base+10000;for(let i=0;i<100;i++){q.shake(i%3+1,5);now+=1000/60;q.frame(now);identity();}for(let i=0;i<20;i++){now+=1000/60;q.frame(now);}identity();check(!q.snapshot().screenShake.active,'shake did not end');
 q.drop();let state=JSON.stringify(q.snapshot());now+=10000;q.frame(now);check(JSON.stringify(q.snapshot())===state,'long stall caught up');identity();
 window.__pachinkoVisibility(true);now+=50000;q.frame(now);check(JSON.stringify(q.snapshot())===state,'hidden simulation advanced');window.__pachinkoVisibility(false);now+=50000;q.frame(now);check(JSON.stringify(q.snapshot())===state,'resume caught up');identity();
 for(let i=0;i<10;i++){now+=1000/60;q.frame(now);}const before=JSON.stringify(q.snapshot()),rng=JSON.stringify(window.__pachinkoRng());for(let i=0;i<30;i++)q.draw();check(JSON.stringify(q.snapshot())===before&&JSON.stringify(window.__pachinkoRng())===rng,'drawing changed simulation');identity();
 return {hz,initialRandom,complete,random,checks:['complete-drop','100-retriggered-shakes','shake-end','long-stall','hidden','resume','render-purity','canvas-identity','audio-uninitialized']};
}
module.exports={initSource,fixture};
