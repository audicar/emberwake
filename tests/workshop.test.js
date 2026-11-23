import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkshopSequence, WORKSHOP, appointmentNames } from '../workshop-script.js';
import { newState, validateSave } from '../core.js';

test('the workshop preserves the agreed conversation and ends without another player line',()=>{
  const scene=new WorkshopSequence(),seen=[];
  while(!scene.finished){seen.push(scene.beat);scene.update(4);assert.equal(scene.advance(),true);}
  assert.deepEqual(seen.filter(s=>s.speaker==='player').map(s=>s.text),['You said that last season.']);
  assert.equal(seen.at(-1).text,'');assert.equal(seen.at(-1).shot,'silence');
  assert.match(seen.at(-2).text,/You’re the only one I can trust/);
  assert.equal(scene.advance(),false);
});
test('the quiet final beat cannot be advanced immediately, but can be skipped',()=>{
  const scene=new WorkshopSequence(WORKSHOP.steps.length-1);
  assert.equal(scene.advance(),false);scene.update(1);assert.equal(scene.advance(),false);
  scene.update(3);assert.equal(scene.advance(),true);assert.equal(scene.finished,true);
  const skipped=new WorkshopSequence(0);skipped.skip();assert.equal(skipped.finished,true);
  assert.equal(skipped.advance(),false);
});
test('opening progress round-trips while existing saves do not replay it',()=>{
  for(let workshopStep=0;workshopStep<WORKSHOP.steps.length;workshopStep++) {
    const s=newState();s.workshopStep=workshopStep;
    const restored=validateSave(JSON.parse(JSON.stringify(s)));
    assert.equal(new WorkshopSequence(restored.workshopStep).step,workshopStep);
  }
  const older=newState();delete older.workshopStep;
  assert.equal(validateSave(older).workshopStep,null);
  for(const value of [-1,6,1.5,'1',false])assert.throws(()=>validateSave({...older,workshopStep:value}));
});
test('the promotion list never contains the chosen character name',()=>{
  for(const name of ['Elin','tomas',' CORA ','Bram','Lina']) {
    const names=appointmentNames(name);assert.equal(names.length,2);
    assert.ok(names.every(n=>n.toLowerCase()!==name.trim().toLowerCase()));
  }
});
