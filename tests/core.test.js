import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, validateSave, tend, isGrown, awaken, objective, FLOWERS, PLOTS } from '../core.js';
import { blocked, riverX, VILLAGE_BRIDGE } from '../art.js';
import { STYLES } from '../core.js';

test('a full first chapter can be completed, saved and restored', () => {
  const s = newState();
  assert.match(tend(s, 0), /Rowan/);
  s.metRowan = true; s.rowanRiver = true; s.receivedSeeds = true; s.seeds = 3;
  tend(s, 0); assert.equal(s.seeds, 2);
  tend(s, 0); assert.equal(s.plots[0].watered, true);
  assert.equal(isGrown(s, 0), false);
  assert.match(objective(s), /Sleep/);
  s.day++; assert.equal(isGrown(s, 0), true);
  tend(s, 0); assert.equal(s.moonroot, 1); assert.equal(s.harvested, true);
  assert.equal(awaken(s), false);
  s.flowers = FLOWERS.map(f => f.id);
  assert.equal(awaken(s), true); assert.equal(s.moonroot, 0);
  assert.equal(awaken(s), false);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
});
test('unwatered plants do not grow; watering later still works', () => {
  const s = newState(); s.metRowan = true; s.rowanRiver = true; s.receivedSeeds = true; s.seeds = 3;
  tend(s, 1); s.day++; assert.equal(isGrown(s, 1), false);
  tend(s, 1); assert.equal(isGrown(s, 1), false);
  s.day++; assert.equal(isGrown(s, 1), true);
});
test('planting and harvesting cannot duplicate seeds or produce', () => {
  const s = newState(); s.metRowan = true; s.rowanRiver = true; s.receivedSeeds = true; s.seeds = 1;
  tend(s, 0); tend(s, 0); tend(s, 0);
  assert.equal(s.seeds, 0); assert.equal(s.moonroot, 0);
  s.day++; tend(s, 0); tend(s, 0);
  assert.equal(s.moonroot, 1); assert.equal(s.plots[0], null);
});
test('save import rejects corrupt data, unsupported versions and invalid collections', () => {
  for (const change of [{version:2},{x:NaN},{y:-10},{day:-1},{minutes:9000},{name:''},{name:'x'.repeat(21)},{flowers:['f1','f1']},{flowers:['fake']},{plots:[]},{appearance:{skin:999}},{plots:[{planted:100,watered:true},null,null]}]) {
    assert.throws(() => validateSave({...newState(), ...change}));
  }
});
test('save import drops unknown properties and never interprets character names as markup', () => {
  const s = newState(); s.name = '<b>Lina</b>';
  const restored = validateSave({...s, unexpected: 'discard me'});
  assert.equal(restored.name, '<b>Lina</b>');
  assert.equal('unexpected' in restored, false);
});
test('older saves gain a body choice without changing progress or existing appearance indices', () => {
  const old = newState({ hairStyle: 2, outfit: 2, accessory: 1 });
  delete old.appearance.gender;
  old.day = 4; old.metRowan = true; old.flowers = ['f1'];
  const restored = validateSave(JSON.parse(JSON.stringify(old)));
  assert.equal(restored.appearance.gender, 0);
  assert.equal(restored.appearance.hairStyle, 2);
  assert.equal(restored.appearance.outfit, 2);
  assert.equal(restored.day, 4);
  assert.deepEqual(restored.flowers, ['f1']);
});
test('both body choices and all new wardrobe options survive save export and import', () => {
  for(let gender=0;gender<2;gender++)for(let hairStyle=0;hairStyle<STYLES.hairStyle.length;hairStyle++)for(let outfit=0;outfit<STYLES.outfit.length;outfit++)for(let accessory=0;accessory<STYLES.accessory.length;accessory++) {
    const s = newState({gender, hairStyle, outfit, accessory});
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
  }
  assert.throws(()=>validateSave(newState({gender:2})));
});
test('every story interaction can be reached from spawn without crossing scenery', () => {
  const start = [272,278], step=4, queue=[start], visited=new Set([start.join(',')]);
  for(let head=0;head<queue.length;head++){
    const [x,y]=queue[head];
    for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(!visited.has(key)&&!blocked(nx,ny)){visited.add(key);queue.push([nx,ny]);}
    }
  }
  const targets=[['Rowan',236,311],['Mira',402,222],['cottage',160,235],['wardrobe',368,203],['shrine',720,193],...FLOWERS.map(f=>[f.id,f.x,f.y]),...PLOTS.map((p,i)=>[`plot ${i}`,p.x,p.y])];
  for(const [name,x,y] of targets)assert.ok(queue.some(([qx,qy])=>Math.hypot(qx-x,qy-y)<25),`${name} must be reachable`);
  assert.equal(blocked(578,220),true,'river blocks movement away from the bridge');
  assert.equal(blocked(580,312),false,'the bridge can be crossed');
});
test('the bridge has forgiving approaches and grassy riverbanks stay walkable',()=>{
  const b=VILLAGE_BRIDGE;
  for(const y of [b.y+3,b.y+b.h-5])for(let x=b.x;x<=b.x+b.w;x++)assert.equal(blocked(x,y),false,'both edges of the visible deck can be crossed');
  for(let y=294;y<=370;y++)assert.equal(blocked(596,y),false,'the east-bank return reaches the bridge without an invisible snag');
  for(const y of [220,370,480]) {
    const centre=riverX(Math.floor(y/4)*4);
    assert.equal(blocked(centre+28,y),false,'grass beside the water is walkable');
    assert.equal(blocked(centre+20,y),true,'water outside the bridge remains solid');
  }
});
