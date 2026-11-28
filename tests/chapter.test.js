import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,validateSave,activeMainQuest,completedMainQuests} from '../core.js';
import {MillChapter,newChapter,beginMorning,blessingCount,hasRiverstep,chapterBlocked,findChapterRoute,ANCHORS,CLUES} from '../chapter.js';
function opening(){const s=newState();Object.assign(s,{metRowan:true,rowanRiver:true,receivedSeeds:true,harvested:true,flowers:['f1','f2','f3'],awakened:true,dragonBonded:true,guardianFreed:true,homecoming:true,hasBlade:true});return s;}
function gameAt(stage=4,region='trail'){const s=opening();s.chapter.stage=stage;s.chapter.region=region;s.chapter.checkpoint=region;const lines=[];const game=new MillChapter(s,{say:(speaker,text,done)=>{lines.push({speaker,text});done?.();}});return {s,game,lines};}
function at(game,id){const point=game.region==='trail'?{exit:[96,500],mill:[735,180],guardian:[490,250],tracks:[290,315],pins:[570,440],rope:[700,330]}:game.region==='mill'?{brake:[420,375],dragon:[570,330],stone:[460,210],north:[420,460],exit:[96,500]}:{departure:[365,430],home:[96,430]};const [x,y]=point[id];Object.assign(game.player,{x,y});assert.equal(game.nearby().id,id);assert.equal(game.interact(),true);}
function advance(game,seconds,keys=new Set()){for(let n=0;n<seconds*60;n++)game.update(1/60,keys);}
test('old completed saves gain two blessings and wait for a real night of rest',()=>{
  const old=opening();delete old.chapter;const restored=validateSave(old);
  assert.equal(blessingCount(restored),2);assert.equal(hasRiverstep(restored),false);assert.equal(restored.chapter.stage,0);
  assert.equal(activeMainQuest(restored)[0],'morningWater');assert.match(activeMainQuest(restored)[2],/sleep/);
  assert.equal(beginMorning(newState()),false);assert.equal(beginMorning(restored),true);assert.equal(beginMorning(restored),false);
  assert.match(activeMainQuest(restored)[2],/blanket/);
});
test('new chapter progress and every persistent discovery round-trip strictly',()=>{
  const {s,game}=gameAt();at(game,'tracks');at(game,'pins');at(game,'rope');at(game,'mill');at(game,'brake');at(game,'stone');at(game,'north');
  game.damage(game.enemies[0],3);game.damage(game.enemies[1],3);game.damage({...ANCHORS[0],anchor:0},1);
  const copy=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(copy,s);
  const resumed=new MillChapter(copy);assert.equal(resumed.region,'mill');assert.equal(resumed.enemies[0].hp,0);assert.equal(copy.chapter.anchors[0],2);assert.deepEqual(copy.chapter.clues,Object.keys(CLUES));
  for(const change of [{stage:99},{stage:'4'},{region:'somewhere'},{topics:['unknown']},{clues:['pins','pins']},{cleared:['fake']},{anchors:[0,0]},{brake:'yes'},{x:NaN},{x:999},{stage:7,brake:false},{stage:9,crossed:false},{stage:1,brake:true}])assert.throws(()=>validateSave({...s,chapter:{...s.chapter,...change}}));
});
test('the mill needs Rowan’s brake, cleared guards and ember breath at the final knot',()=>{
  const {s,game}=gameAt();at(game,'mill');assert.equal(game.damage({...ANCHORS[0],anchor:0},3),false);
  at(game,'brake');assert.equal(s.chapter.stage,6);assert.equal(game.damage({...ANCHORS[0],anchor:0},3),false);
  for(const e of game.enemies)game.damage(e,3);
  game.damage({...ANCHORS[0],anchor:0},3);game.damage({...ANCHORS[1],anchor:1},3);
  assert.equal(game.damage({...ANCHORS[2],anchor:2},3),false);
  Object.assign(game.player,{x:580,y:500,direction:'up'});advance(game,.1);assert.equal(game.command('c'),true);advance(game,1);
  assert.deepEqual(s.chapter.anchors,[0,0,0]);assert.equal(blessingCount(s),2);
  at(game,'dragon');assert.equal(s.chapter.stage,7);assert.equal(blessingCount(s),3);assert.equal(hasRiverstep(s),true);
  at(game,'dragon');assert.equal(blessingCount(s),3,'repeat conversation cannot duplicate a blessing');
});
test('shielded bindings explain failed hits without flooding held attacks',()=>{
  const {game}=gameAt();const messages=[];game.events.toast=text=>messages.push(text);
  at(game,'mill');at(game,'brake');const target={...ANCHORS[0],anchor:0};
  game.damage(target,1);game.damage(target,1);assert.equal(messages.length,1);assert.match(messages[0],/nearby creatures/);
  advance(game,2.6);game.damage(target,1);assert.equal(messages.length,2);
  game.enemies.forEach(e=>e.hp=0);assert.equal(game.damage(target,1),true);
});
test('the complete rescue leads through revelation, a real crossing and the choice to let go',()=>{
  const {s,game,lines}=gameAt();at(game,'mill');at(game,'brake');
  for(const e of game.enemies)game.damage(e,3);for(let i=0;i<3;i++)game.damage({...ANCHORS[i],anchor:i},3,true);at(game,'dragon');
  assert.equal(activeMainQuest(s)[0],'pathBack');at(game,'exit');at(game,'guardian');assert.equal(s.chapter.stage,8);assert.ok(lines.some(l=>l.speaker==='guardian'&&l.text.some(t=>t.includes('born an Emberkeeper'))));
  at(game,'exit');assert.equal(game.region,'return');Object.assign(game.player,{x:455,y:430,direction:'left'});
  advance(game,1,new Set(['left']));assert.ok(game.player.x>=432,'walking cannot cross the water');assert.equal(s.chapter.stage,8);
  game.command('x');advance(game,.4);assert.ok(game.player.x<390);assert.equal(s.chapter.stage,9);assert.equal(s.chapter.crossed,true);
  at(game,'departure');assert.equal(s.chapter.stage,10);assert.equal(game.hatchlingPresent,false);at(game,'home');assert.equal(s.chapter.region,null);
  s.insideHome=true;s.chapter.stage=11;assert.equal(activeMainQuest(s),null);assert.equal(completedMainQuests(s).length,11);assert.equal(validateSave(s).chapter.stage,11);
});
test('Riverstep respects solid banks and returns safely from an undershot crossing',()=>{
  const {s,game}=gameAt(8,'return');s.chapter.brake=true;s.chapter.anchors=[0,0,0];
  Object.assign(game.player,{x:500,y:430,direction:'left'});game.command('x');advance(game,.4);
  assert.equal(chapterBlocked('return',game.player.x,game.player.y),false);assert.ok(game.player.x>=432);assert.equal(s.chapter.stage,8);
  Object.assign(game.player,{x:455,y:320,direction:'left',dashCooldown:0});game.command('x');advance(game,.4);assert.ok(game.player.x>=432,'the power cannot phase through an unmarked bank');
});
test('all story points can be approached without crossing scenery',()=>{
  for(const region of ['trail','mill']) {
    const {game}=gameAt(region==='mill'?5:4,region);
    for(const [name,x,y] of game.landmarks())assert.ok(findChapterRoute(region,{x:96,y:500},{x,y}).length,`${region}: ${name} is reachable`);
  }
  assert.equal(chapterBlocked('mill',550,220),true,'the mill building is solid');
  assert.equal(chapterBlocked('return',410,430),true);assert.equal(chapterBlocked('return',410,430,true),false);
});
test('Rowan walks around obstacles rather than jumping to MC',()=>{
  const {game}=gameAt();Object.assign(game.player,{x:290,y:315});
  let previous={...game.rowan};for(let n=0;n<600;n++){game.update(1/60);assert.equal(chapterBlocked('trail',game.rowan.x,game.rowan.y),false);assert.ok(Math.hypot(game.rowan.x-previous.x,game.rowan.y-previous.y)<2);previous={...game.rowan};}
  assert.ok(Math.hypot(game.rowan.x-game.player.x,game.rowan.y-game.player.y)<40);
});
test('sweeps are telegraphed and defeat retains permanent rescue progress',()=>{
  const {s,game}=gameAt();at(game,'mill');at(game,'brake');for(const e of game.enemies)game.damage(e,3);
  Object.assign(game.player,{x:570,y:350});game.sweep.timer=0;game.update(.05);assert.equal(game.sweep.phase,'warning');assert.equal(game.player.hp,8);
  advance(game,1.5);assert.equal(game.player.hp,7);game.damage({...ANCHORS[0],anchor:0},3);game.player.hp=1;game.player.invulnerable=0;game.hurt();
  assert.equal(game.active,false);assert.equal(s.chapter.region,null);assert.equal(s.chapter.anchors[0],0);assert.equal(s.chapter.cleared.length,6);assert.equal(validateSave(s).chapter.stage,6);
});
