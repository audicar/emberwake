import test from 'node:test';
import assert from 'node:assert/strict';
import {Thumbstick,movementInput} from '../controls.js';
import {newState} from '../core.js';
import {WoodlandEncounter} from '../combat.js';
import {MillChapter} from '../chapter.js';

test('a floating stick has a dead zone, gradual speed and a circular limit',()=>{
  const s=new Thumbstick();s.start(7,120,400);s.move(7,124,402);assert.equal(s.x,0);assert.equal(s.y,0);
  s.move(7,144,400);assert.equal(s.x,.5);assert.equal(s.y,0);
  s.move(7,220,500);assert.ok(Math.abs(Math.hypot(s.x,s.y)-1)<1e-12);assert.ok(Math.abs(Math.hypot(s.knobX,s.knobY)-42)<1e-12);
  s.move(7,120,350);assert.equal(s.x,0);assert.equal(s.y,-1);
});
test('a second thumb cannot steal or release the movement pointer',()=>{
  const s=new Thumbstick();s.start(1,100,200);s.move(1,142,200);
  assert.equal(s.start(2,300,200),false);assert.equal(s.move(2,200,100),false);assert.equal(s.release(2),false);assert.equal(s.x,1);
  assert.equal(s.release(1),true);assert.equal(s.x,0);assert.equal(s.pointerId,null);
  s.start(3,20,80);assert.equal(s.x,0);s.move(3,20,38);assert.equal(s.y,-1);s.reset();assert.equal(s.y,0);
});
test('keyboard diagonals and stick movement have equal top speed without snapping analogue angles',()=>{
  const keys=new Set(['right','up']),digital=movementInput(keys);
  assert.ok(Math.abs(Math.hypot(digital.x,digital.y)-1)<1e-12);
  assert.deepEqual(movementInput(keys,{x:.3,y:.4}),{x:.3,y:.4});
  assert.deepEqual(movementInput(keys,{x:0,y:0}),digital);
});
test('both encounters accept gentle analogue movement and stop on release',()=>{
  const state=newState();state.chapter.stage=4;state.chapter.region='trail';
  for(const game of [new WoodlandEncounter(newState()),new MillChapter(state)]) {
    Object.assign(game.player,{x:100,y:450});const start={...game.player};
    game.update(.05,new Set(),{x:.3,y:.4});
    assert.ok(Math.abs(game.player.x-start.x-1.14)<1e-9);assert.ok(Math.abs(game.player.y-start.y-1.52)<1e-9);
    const stopped={...game.player};game.update(.05,new Set(),{x:0,y:0});assert.equal(game.player.x,stopped.x);assert.equal(game.player.y,stopped.y);
  }
});
