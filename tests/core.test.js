import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, validateSave, tend, isGrown, awaken, objective, FLOWERS, PLOTS } from '../core.js';
import { blocked } from '../art.js';

test('a full first chapter can be completed, saved and restored', () => {
  const s = newState();
  assert.match(tend(s, 0), /Rowan/);
  s.metRowan = true; s.seeds = 3;
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
  const s = newState(); s.metRowan = true; s.seeds = 3;
  tend(s, 1); s.day++; assert.equal(isGrown(s, 1), false);
  tend(s, 1); assert.equal(isGrown(s, 1), false);
  s.day++; assert.equal(isGrown(s, 1), true);
});
test('planting and harvesting cannot duplicate seeds or produce', () => {
  const s = newState(); s.metRowan = true; s.seeds = 1;
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
