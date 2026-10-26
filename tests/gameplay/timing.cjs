'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{runtime}=require('./runtime.cjs'),source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
function advance(r,hz,seconds,start=0){for(let i=1;i<=Math.round(hz*seconds);i++)r.qa.frame(start+i*1000/hz);}
function identity(r){assert.deepEqual(r.canvas(),{depth:0,underflows:0,matrix:[1,0,0,1,0,0]});assert.equal(r.snapshot().audioInitialized,false);}
test('seeded complete-drop outcomes match at30/60/90/120/144Hz',()=>{
 for(const seed of[1,1234,7451]){let expected;
  for(const hz of[30,60,90,120,144]){const r=runtime(source,{seed});r.qa.drop();advance(r,hz,30);const state={world:r.snapshot(),random:r.random()};assert.equal(state.world.ball,null);assert(state.world.totalScore>0);if(expected)assert.deepEqual(state,expected,'cadence '+hz+' seed '+seed);else expected=state;identity(r);}
 }
});
test('render-only calls preserve simulation and random stream',()=>{const r=runtime(source);r.qa.drop();advance(r,60,.5);r.qa.win(1000);r.qa.shake(10,5);const state=r.snapshot(),random=r.random();for(let i=0;i<100;i++)r.qa.draw();assert.deepEqual(r.snapshot(),state);assert.deepEqual(r.random(),random);identity(r);});
test('one-frame and retriggered shakes always restore the canvas',()=>{const r=runtime(source);for(let i=1;i<=300;i++){r.qa.shake(i%3+1,5);r.qa.frame(i*1000/60);identity(r);}advance(r,60,1,5000);identity(r);assert.equal(r.snapshot().screenShake.active,false);});
test('moderate frame gaps are bounded and long stalls discard elapsed debt',()=>{
 for(const gap of[50,100,200]){const r=runtime(source),reference=runtime(source);r.qa.drop();reference.qa.drop();r.qa.frame(gap);const ticks=Math.min(6,Math.floor((gap+1e-7)/(1000/60)));advance(reference,60,ticks/60);assert.deepEqual(r.snapshot(),reference.snapshot());identity(r);}
 for(const gap of[251,500,10000]){const r=runtime(source);r.qa.drop();const state=r.snapshot();r.qa.frame(gap);assert.deepEqual(r.snapshot(),state);r.qa.frame(gap+1000/60);assert.equal(r.snapshot().ball.vy,.2);identity(r);}
});
test('visibility reset pauses physics and resumes without catch-up',()=>{const r=runtime(source);r.qa.drop();advance(r,60,.25);r.qa.shake(3,2);const state=r.snapshot(),random=r.random();r.visibility(true);r.qa.frame(100000);assert.deepEqual(r.snapshot(),state);assert.deepEqual(r.random(),random);r.visibility(false);r.qa.frame(200000);assert.deepEqual(r.snapshot(),state);r.qa.frame(200000+1000/60);assert.equal(r.snapshot().screenShake.duration,2);identity(r);});
test('clock reset clears partial debt and leaves a balanced frame',()=>{const r=runtime(source);r.qa.drop();r.qa.frame(10);r.qa.shake(1,2);r.qa.resetClock();r.qa.frame(500);assert.equal(r.snapshot().ball.vy,0);r.qa.frame(500+1000/60);assert.equal(r.snapshot().ball.vy,.2);identity(r);});
test('collisions and repeated prizes never leak canvas state',()=>{const r=runtime(source);const peg=r.snapshot().pegs[0];for(let i=1;i<=50;i++){r.qa.setBall({x:peg.x,y:peg.y-peg.radius-14,vx:0,vy:2});r.qa.frame(i*1000/60);identity(r);r.qa.win(100);r.qa.draw();identity(r);}assert(r.snapshot().totalScore>=5000);});
