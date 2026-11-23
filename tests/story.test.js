import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, activeMainQuest, completedMainQuests, awaken } from '../core.js';
import { HOME_ENTRY, HOME_BED, homeBlocked, homeInteraction } from '../home.js';

test('the main story exposes one consequential quest at a time',()=>{
  const s=newState(),current=()=>activeMainQuest(s)?.[0]??null;
  assert.equal(current(),'metRowan');
  s.metMira=true;assert.equal(current(),'metRowan','optional village life does not advance the main story');
  s.metRowan=true;assert.equal(current(),'harvested');
  s.harvested=true;s.moonroot=1;assert.equal(current(),'flowers');
  assert.equal(awaken(s),false);
  s.flowers=['f1','f2','f3'];assert.equal(current(),'awakened');
  assert.equal(awaken(s),true);assert.equal(current(),'dragonBonded');
  s.dragonBonded=true;assert.equal(current(),'guardianFreed');
  s.guardianFreed=true;assert.equal(current(),'homecoming');s.homecoming=true;assert.equal(current(),null);assert.equal(completedMainQuests(s).length,7);
});
test('older out-of-order progress does not expose multiple active story quests',()=>{
  const s=newState();s.dragonBonded=true;s.guardianFreed=true;
  assert.equal(activeMainQuest(s)[0],'metRowan');assert.equal(completedMainQuests(s).length,0);
});
test('the cottage bed, wardrobe and exit can be reached from the front door',()=>{
  const queue=[[HOME_ENTRY.x,HOME_ENTRY.y]],seen=new Set([`${HOME_ENTRY.x},${HOME_ENTRY.y}`]);
  for(let head=0;head<queue.length;head++){const [x,y]=queue[head];for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&!homeBlocked(nx,ny)){seen.add(key);queue.push([nx,ny]);}}}
  for(const p of [HOME_BED,{x:274,y:244},{x:416,y:474}])assert.ok(queue.some(([x,y])=>Math.hypot(x-p.x,y-p.y)<15));
  assert.equal(homeInteraction(HOME_BED).type,'bed');assert.equal(homeInteraction(HOME_ENTRY).type,'exit');
  assert.equal(homeBlocked(568,240),true,'the bed is solid furniture');
});
