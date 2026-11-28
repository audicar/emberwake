import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkshopSequence, WORKSHOP, promotionNames } from '../workshop-script.js';
import { newState, validateSave } from '../core.js';

test('the workshop preserves the conversation and gives the invitation a silent response',()=>{
  const scene=new WorkshopSequence(),seen=[];
  while(!scene.finished){seen.push(scene.beat);scene.update(Math.max(5,scene.beat.minSeconds||0));assert.equal(scene.advance(),true);}
  assert.deepEqual(seen.slice(0,7).map(s=>s.shot),['first-spring','promise','new-idea','trusted','shared-method','winter-late','establish']);
  assert.match(seen[1].text,/You’ve got a future here/);
  assert.match(seen[6].text,/Four years/);
  assert.match(seen[7].text,/Your name isn’t there/);assert.match(seen[8].text,/your promotion/);
  assert.deepEqual(seen.filter(s=>s.speaker==='player').map(s=>s.text),['You said that last season.']);
  assert.deepEqual(seen.filter(s=>s.scene!=='journey').slice(-5).map(s=>s.shot),['silence','finished-order','find-letter','letter','fold-letter']);
  assert.equal(seen.filter(s=>s.scene!=='journey').at(-1).text,'');assert.match(seen[11].text,/You’re the only one I can trust/);
  assert.equal(scene.advance(),false);
});
test('the quiet final beat cannot be advanced immediately, but can be skipped',()=>{
  const scene=new WorkshopSequence(WORKSHOP.order.at(-1));
  assert.equal(scene.advance(),false);scene.update(1);assert.equal(scene.advance(),false);
  scene.update(3);assert.equal(scene.advance(),true);assert.equal(scene.finished,true);
  const skipped=new WorkshopSequence(0);skipped.skip();assert.equal(skipped.finished,true);
  assert.equal(skipped.advance(),false);
});
test('finishing an animation keeps its moment on screen until a second press',()=>{
  for(const step of WORKSHOP.order) {
    const scene=new WorkshopSequence(step),shot=scene.beat.shot;
    if(scene.ready){assert.equal(scene.finishMoment(),false);continue;}
    assert.equal(scene.finishMoment(),true);assert.equal(scene.ready,true);
    assert.equal(scene.beat.shot,shot);assert.equal(scene.finished,false);
    assert.equal(scene.finishMoment(),false);assert.equal(scene.advance(),true);
  }
  const scene=new WorkshopSequence();scene.skip();assert.equal(scene.finishMoment(),false);
});
test('opening progress round-trips while existing saves do not replay it',()=>{
  for(let workshopStep=0;workshopStep<WORKSHOP.steps.length;workshopStep++) {
    const s=newState();s.workshopStep=workshopStep;
    const restored=validateSave(JSON.parse(JSON.stringify(s)));
    assert.equal(new WorkshopSequence(restored.workshopStep).step,workshopStep);
  }
  const older=newState();delete older.workshopStep;
  assert.equal(validateSave(older).workshopStep,null);
  for(const value of [-1,WORKSHOP.steps.length,1.5,'1',false])assert.throws(()=>validateSave({...older,workshopStep:value}));
  for(const [step,shot] of ['notice','conversation','conversation','conversation','request','silence'].entries()) {
    assert.equal(new WorkshopSequence(step).beat.shot,shot,'older in-progress saves retain their scene');
  }
});
test('the letter retains the agreed short invitation and can be read at the player’s pace',()=>{
  assert.equal(WORKSHOP.invitation.salutation,'My love,');
  assert.equal(WORKSHOP.invitation.paragraphs[1],'You don’t need to know what comes next before you get here.');
  assert.equal(WORKSHOP.invitation.signature,'Aunt Wren');
  const scene=new WorkshopSequence(8);assert.equal(scene.ready,true);scene.update(600);
  assert.equal(scene.step,8,'reading does not auto-advance');scene.advance();assert.equal(scene.beat.shot,'fold-letter');
});
test('the promotion list never contains the chosen character name',()=>{
  for(const name of ['Elin','tomas',' CORA ','Bram','Lina']) {
    const names=promotionNames(name);assert.equal(names.length,2);
    assert.ok(names.every(n=>n.toLowerCase()!==name.trim().toLowerCase()));
  }
});
test('the workshop leads into a resumable journey before the cottage handover',()=>{
  let scene=new WorkshopSequence(9);scene.update(3);scene.advance();
  assert.equal(scene.step,WORKSHOP.journey.firstStep);assert.equal(scene.isJourney,true);
  const shots=[];
  while(!scene.finished) {
    const saved=validateSave({...newState(),workshopStep:scene.step});
    scene=new WorkshopSequence(saved.workshopStep);
    shots.push(scene.beat.shot);assert.equal(scene.advance(),false,'each travelling shot has a short pause');
    scene.update(scene.beat.minSeconds);assert.equal(scene.advance(),true);
  }
  assert.deepEqual(shots,['coach-letter','open-road','woodland-window','cottage-arrival']);
  assert.equal(scene.beat.nextLabel,'Step inside');
});
