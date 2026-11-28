import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, validateSave, activeMainQuest, completedMainQuests, awaken } from '../core.js';
import { HOME_ENTRY, HOME_START, HOME_BED, homeBlocked, homeInteraction } from '../home.js';

test('the main story exposes one consequential quest at a time',()=>{
  const s=newState(),current=()=>activeMainQuest(s)?.[0]??null;
  assert.equal(current(),'metRowan');
  s.metMira=true;assert.equal(current(),'metRowan','optional village life does not advance the main story');
  s.metRowan=true;assert.equal(current(),'rowanRiver');
  s.rowanRiver=true;assert.equal(current(),'harvested');s.receivedSeeds=true;
  s.harvested=true;s.moonroot=1;assert.equal(current(),'flowers');
  assert.equal(awaken(s),false);
  s.flowers=['f1','f2','f3'];assert.equal(current(),'awakened');
  assert.equal(awaken(s),true);assert.equal(current(),'dragonBonded');
  s.dragonBonded=true;assert.equal(current(),'guardianFreed');
  s.guardianFreed=true;assert.equal(current(),'homecoming');s.homecoming=true;assert.equal(current(),'morningWater');assert.equal(completedMainQuests(s).length,8);
});
test('older out-of-order progress does not expose multiple active story quests',()=>{
  const s=newState();s.dragonBonded=true;s.guardianFreed=true;
  assert.equal(activeMainQuest(s)[0],'metRowan');assert.equal(completedMainQuests(s).length,0);
});
test('cottage furniture and both sides of the bed are reachable from the front door',()=>{
  const queue=[[HOME_ENTRY.x,HOME_ENTRY.y]],seen=new Set([`${HOME_ENTRY.x},${HOME_ENTRY.y}`]);
  for(let head=0;head<queue.length;head++){const [x,y]=queue[head];for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&!homeBlocked(nx,ny)){seen.add(key);queue.push([nx,ny]);}}}
  const access=[HOME_START,HOME_BED,{x:508,y:270},{x:602,y:270},{x:268,y:288},{x:296,y:352},{x:365,y:259},{x:441,y:370},{x:416,y:474}];
  for(const p of access)assert.ok(!homeBlocked(p.x,p.y)&&queue.some(([x,y])=>Math.hypot(x-p.x,y-p.y)<5),`furniture access at ${p.x},${p.y} must be clear and reachable`);
  assert.equal(homeInteraction(HOME_BED).type,'bed');assert.equal(homeInteraction(HOME_ENTRY).type,'exit');
  for(const p of [{x:508,y:270},{x:602,y:270}])assert.equal(homeInteraction(p).type,'bed','the bed works from either side');
  assert.equal(homeInteraction({x:268,y:288}).type,'wardrobe');
  assert.equal(homeInteraction({x:296,y:352}).type,'books');
  assert.equal(homeInteraction({x:365,y:259}).type,'kettle');
  assert.equal(homeInteraction({x:441,y:370}).type,'notes');
  assert.equal(homeBlocked(568,240),true,'the bed is solid furniture');
});
test('saving indoors keeps the player indoors while older saves remain outdoors',()=>{
  const s=newState();s.insideHome=true;
  assert.equal(validateSave(JSON.parse(JSON.stringify(s))).insideHome,true);
  delete s.insideHome;assert.equal(validateSave(s).insideHome,false);
  assert.throws(()=>validateSave({...s,insideHome:'yes'}));
});
test('visible tabletops, chair backs and bookcases block movement from above',()=>{
  for(const p of [{x:390,y:340},{x:390,y:355},{x:390,y:375},{x:385,y:396},{x:256,y:305},{x:256,y:325},{x:555,y:317}]) {
    assert.equal(homeBlocked(p.x,p.y),true,`visible furniture at ${p.x},${p.y} must be solid`);
  }
  for(const p of [{x:390,y:330},{x:441,y:350},{x:335,y:350}])assert.equal(homeBlocked(p.x,p.y),false,'passages around the table remain clear');
});
