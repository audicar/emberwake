import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateSave,activeMainQuest} from '../core.js';
import {homeBlocked,homeInteraction,HOME_ENTRY} from '../home.js';
import {blocked} from '../art.js';
import {COTTAGE_MEMORIES,rememberCottageObject,createRowanActor,updateRowan,finishRowanIntroduction,finishRiverVisit,receiveGardenSeeds,ROWAN_SPOTS} from '../settling.js';

test('cottage memories persist without becoming chores or advancing the day',()=>{
  const state=newState(),before={day:state.day,minutes:state.minutes,quest:activeMainQuest(state)[0],seeds:state.seeds};
  for(const key of Object.keys(COTTAGE_MEMORIES))rememberCottageObject(state,key);
  const restored=validateSave(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.payPacketRead,true);assert.equal(restored.workNotebookRead,true);assert.equal(restored.clockUnwound,true);
  assert.deepEqual({day:state.day,minutes:state.minutes,quest:activeMainQuest(state)[0],seeds:state.seeds},before);
  assert.throws(()=>rememberCottageObject(state,'missing'));
});
test('the new objects and the bed remain reachable through clear passages',()=>{
  const queue=[[HOME_ENTRY.x,HOME_ENTRY.y]],seen=new Set([queue[0].join(',')]);
  for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]) {
    const [x,y]=queue[i],nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
    if(!seen.has(key)&&!homeBlocked(nx,ny)){seen.add(key);queue.push([nx,ny]);}
  }
  for(const [type,x,y] of [['payPacket',470,362],['workNotebook',310,442],['alarmClock',470,250],['bed',508,270],['bed',602,270]]) {
    assert.ok(queue.some(([qx,qy])=>Math.hypot(qx-x,qy-y)<5),`${type} has a clear approach`);
    assert.equal(homeInteraction({x,y})?.type,type,`${type} is not obscured by another interaction`);
  }
  for(const [x,y] of [[260,440],[493,250],[497,371]])assert.equal(homeBlocked(x,y),true,'visible furniture stays solid');
});
test('company comes before gardening and seeds are given once, on request',()=>{
  const state=newState();finishRowanIntroduction(state);
  assert.equal(state.metRowan,true);assert.equal(state.seeds,0);assert.equal(state.receivedSeeds,false);
  assert.equal(activeMainQuest(state)[0],'rowanRiver');assert.equal(receiveGardenSeeds(state),false);
  finishRiverVisit(state);assert.equal(state.seeds,0);assert.match(activeMainQuest(state)[2],/ask Rowan/);
  assert.equal(receiveGardenSeeds(state),true);assert.equal(state.seeds,3);
  assert.equal(receiveGardenSeeds(state),false);assert.equal(state.seeds,3);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))),state);
});
test('Rowan walks to the river and garden without crossing scenery',()=>{
  const state=newState(),actor=createRowanActor(state);finishRowanIntroduction(state);
  for(const place of ['river','garden']) {
    if(place==='garden'){finishRiverVisit(state);receiveGardenSeeds(state);}
    for(let i=0;i<2400;i++) {
      const {x,y}=actor;updateRowan(actor,state,1/60,blocked);
      assert.equal(blocked(actor.x,actor.y),false);
      assert.ok(Math.hypot(actor.x-x,actor.y-y)<1.1,'Rowan walks rather than teleporting');
      if(actor.arrived&&actor.place===place)break;
    }
    assert.equal(actor.arrived,true);assert.equal(actor.x,ROWAN_SPOTS[place].x);assert.equal(actor.y,ROWAN_SPOTS[place].y);
  }
});
test('older stories keep their seeds and progress without replaying the introduction',()=>{
  const old=newState();old.metRowan=true;old.harvested=true;old.moonroot=1;old.seeds=2;
  for(const key of ['rowanRiver','receivedSeeds','payPacketRead','workNotebookRead','clockUnwound'])delete old[key];
  const restored=validateSave(old);
  assert.equal(restored.rowanRiver,true);assert.equal(restored.receivedSeeds,true);assert.equal(restored.seeds,2);
  assert.equal(activeMainQuest(restored)[0],'flowers');assert.equal(restored.clockUnwound,false);
  assert.equal(createRowanActor(restored).place,'garden');
  for(const key of ['rowanRiver','receivedSeeds','payPacketRead','workNotebookRead','clockUnwound'])assert.throws(()=>validateSave({...old,[key]:'yes'}));
});
