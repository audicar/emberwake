import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, validateSave } from '../core.js';
import { WoodlandEncounter, woodsBlocked, HATCHLING, GUARDIAN } from '../combat.js';

function advance(encounter,seconds,keys=new Set()) { for(let elapsed=0;elapsed<seconds;elapsed+=1/60)encounter.update(1/60,keys); }
test('old saves gain adventure defaults and completed bonds survive a save round trip',()=>{
  const old=newState();delete old.hasBlade;delete old.dragonBonded;delete old.guardianFreed;
  const restored=validateSave(old);assert.equal(restored.dragonBonded,false);assert.equal(restored.guardianFreed,false);
  const complete=newState();complete.hasBlade=true;complete.dragonBonded=true;complete.guardianFreed=true;
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(complete))),complete);
  assert.throws(()=>validateSave({...old,guardianFreed:true}));
  assert.throws(()=>validateSave({...old,dragonBonded:'yes'}));
});
test('melee attacks respect facing and cooldown',()=>{
  const e=new WoodlandEncounter(newState());e.player.x=320;e.player.y=376;e.player.direction='down';
  assert.equal(e.command('z'),true);assert.equal(e.enemies[0].hp,2,'an enemy behind the player is not hit');
  assert.equal(e.command('z'),false,'attack cannot repeat during cooldown');
  advance(e,.36);e.player.direction='up';e.command('z');assert.equal(e.enemies[0].hp,1);
  advance(e,.36);e.command('z');assert.equal(e.enemies[0].hp,0);
});
test('dodges protect the player and cannot pass through a log',()=>{
  const e=new WoodlandEncounter(newState());e.player.x=170;e.player.y=330;e.player.direction='up';
  assert.equal(e.command('x'),true);assert.equal(e.hurt(),false);assert.equal(e.command('x'),false);
  advance(e,.25);assert.ok(e.player.y>=319,'dash stops at the log');assert.equal(woodsBlocked(e.player.x,e.player.y),false);
  advance(e,.1);assert.equal(e.hurt(),true);assert.equal(e.player.hp,5);
});
test('dragon commands require a bond and obey range and cooldown',()=>{
  const state=newState();const e=new WoodlandEncounter(state);
  assert.equal(e.command('c'),false);state.dragonBonded=true;
  e.player.y=540;
  assert.equal(e.command('c'),false,'no target is close enough at the trail entrance');
  e.player.x=320;e.player.y=440;e.companion.x=310;e.companion.y=445;
  assert.equal(e.command('c'),true);assert.equal(e.command('c'),false);
  advance(e,.8);assert.equal(e.enemies[0].hp,0,'ember breath breaks a sprite in one hit');
  assert.equal(e.guardian.hp,8,'the dormant guardian cannot be targeted early');
});
test('enemy attacks have a wind-up and dodging avoids the strike',()=>{
  const e=new WoodlandEncounter(newState());e.player.x=320;e.player.y=360;
  e.update(1/60);assert.equal(e.enemies[0].phase,'windup');assert.equal(e.player.hp,6);
  advance(e,.3);assert.equal(e.player.hp,6);
  e.player.direction='down';e.command('x');advance(e,.5);assert.equal(e.player.hp,6);
});
test('bonding, breaking the binding and freeing the guardian complete in order',()=>{
  const state=newState();let finish;
  const e=new WoodlandEncounter(state,{say:(speaker,lines,callback)=>{finish=callback;}});
  Object.assign(e.player,HATCHLING);assert.equal(e.interact(),true);assert.equal(state.dragonBonded,false);
  finish();assert.equal(state.dragonBonded,true);assert.equal(e.guardianAwake,false);
  e.enemies.forEach(enemy=>enemy.hp=0);assert.equal(e.guardianAwake,true);
  e.damageEnemy(e.guardian,8);assert.equal(state.guardianFreed,false,'a defeated guardian still needs to be freed');
  Object.assign(e.player,GUARDIAN);e.interact();finish();assert.equal(state.guardianFreed,true);
  const returnVisit=new WoodlandEncounter(state);assert.equal(returnVisit.targets().length,0);
});
test('defeat returns home once and retains the save’s items and bond',()=>{
  const state=newState();state.dragonBonded=true;state.seeds=2;let calls=0;
  const e=new WoodlandEncounter(state,{home:defeated=>{assert.equal(defeated,true);calls++;}});
  for(let i=0;i<9;i++){e.player.invulnerable=0;e.hurt();}
  assert.equal(calls,1);assert.equal(e.player.hp,0);assert.equal(state.seeds,2);assert.equal(state.dragonBonded,true);
});
test('a guardian that moved during the fight is freed where it stands',()=>{
  const state=newState();state.dragonBonded=true;let finish;
  const e=new WoodlandEncounter(state,{say:(_speaker,_lines,done)=>{finish=done;}});
  e.enemies.forEach(enemy=>enemy.hp=0);
  Object.assign(e.guardian,{x:500,y:280});e.damageEnemy(e.guardian,8);
  Object.assign(e.player,{x:500,y:310});
  assert.equal(e.hint(),'Free the guardian');assert.equal(e.interact(),true);finish();
  assert.equal(state.guardianFreed,true);assert.equal(e.hint(),'Talk to the guardian');
  Object.assign(e.player,GUARDIAN);assert.equal(e.hint(),null,'the old nest is not an invisible interaction');
});
test('the hatchling, guardian and each bramble sprite are reachable from camp',()=>{
  const queue=[[288,500]],seen=new Set(['288,500']);
  for(let head=0;head<queue.length;head++){const [x,y]=queue[head];for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&!woodsBlocked(nx,ny)){seen.add(key);queue.push([nx,ny]);}}}
  const e=new WoodlandEncounter(newState());
  for(const target of [HATCHLING,GUARDIAN,...e.enemies])assert.ok(queue.some(([x,y])=>Math.hypot(x-target.x,y-target.y)<20));
});
