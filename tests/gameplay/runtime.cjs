'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function instrument(html){
 const marker='            createBoard();';assert.equal(html.split(marker).length,2);
 const hook=`
            window.__pachinkoQA={
                drop(x=400){if(ball)return false;ball=new Ball(x,-20);gameMessage="Bouncin'!";messageIsWin=false;return true;},
                frame:gameLoop,shake:triggerScreenShake,win:handleWin,
                draw:typeof renderGame==='function'?renderGame:null,
                clock:()=>typeof lastFrameTime==='undefined'?0:lastFrameTime,
                resetClock:()=>{if(typeof resetFrameClock==='function')resetFrameClock();},
                setBall(values){ball=new Ball(400,-20);Object.assign(ball,values);},
                snapshot:()=>JSON.parse(JSON.stringify({ball,pegs,particles,prizeDividers,totalScore,currentScore,gameMessage,messageIsWin,messageTimer,screenShake,audioInitialized}))
            };
`;
 return html.replace(marker,hook+marker);
}
function runtime(html,{seed=1234}={}){
 const source=[...instrument(html).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function gameLoop('));assert(source);
 let matrix=[1,0,0,1,0,0],stack=[],underflows=0,calls=0,randomCalls=0;const listeners={};
 const noop=()=>{},gradient={addColorStop:noop};
 const methods={
  save(){stack.push([...matrix]);},restore(){if(stack.length)matrix=stack.pop();else underflows++;},
  translate(x,y){matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;},
  rotate(r){const c=Math.cos(r),s=Math.sin(r),[a,b,d,e]=matrix;matrix[0]=a*c+d*s;matrix[1]=b*c+e*s;matrix[2]=d*c-a*s;matrix[3]=e*c-b*s;},
  scale(x,y){matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},
  createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,
 };
 const ctx=new Proxy(methods,{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
 const element={getContext:()=>ctx,addEventListener:noop,classList:{add:noop,remove:noop},getBoundingClientRect:()=>({left:0,width:800})};
 const document={hidden:false,getElementById:()=>element,addEventListener(n,f){if(n==='DOMContentLoaded')f();else(listeners[n]??=[]).push(f);}};
 const window={AudioContext:function(){throw Error('Audio initialization is forbidden in this test');}},math=Object.create(Math);math.random=()=>{randomCalls++;return((seed=(seed*1664525+1013904223)>>>0)/4294967296);};
 vm.runInContext(source,vm.createContext({window,document,Math:math,performance:{now:()=>0},requestAnimationFrame:()=>{calls++;}}));
 return {qa:window.__pachinkoQA,snapshot:()=>JSON.parse(JSON.stringify(window.__pachinkoQA.snapshot())),canvas:()=>({depth:stack.length,underflows,matrix:[...matrix]}),random:()=>({seed,calls:randomCalls}),raf:()=>calls,visibility(hidden){document.hidden=hidden;for(const f of listeners.visibilitychange||[])f();}};
}
module.exports={instrument,runtime};
