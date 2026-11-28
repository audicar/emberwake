// The second chapter is serialisable; drawing and browser controls live elsewhere.
export const LOWER_TRAIL={x:490,y:486};
export const CHAPTER_QUESTS=[
  ['morningWater','A morning by the water','Rest at your cottage after welcoming the hatchling home. In the morning, approach its blanket and press E.','main'],
  ['riverRescue','The answering call','Follow the lower woodland path with Rowan and find the dragon calling from the old mill.','main'],
  ['pathBack','The path back','Learn what your third blessing has awakened, then return to your cottage.','main'],
];
export const CLUES={tracks:'Fresh cart tracks lead towards the mill, although the path was closed.',pins:'Iron pins have been hammered through the living thorns. Someone made these restraints.',rope:'A clean length of binding rope lies beside a recent camp. The work is continuing.',stone:'The new wardstone draws magic from the captive dragon. Its channels have not been connected to a settlement.',north:'The equipment bears a north-road survey mark. Fresh cart tracks continue towards the ridge.'};
export const TOPICS=['fishing','village','days'];
export const ANCHORS=[{id:'west',x:320,y:235},{id:'east',x:710,y:240},{id:'ember',x:580,y:470}];
export const MILL_ENEMIES=[{id:'m1',x:335,y:292},{id:'m2',x:400,y:236},{id:'m3',x:704,y:324},{id:'m4',x:754,y:210},{id:'m5',x:550,y:432},{id:'m6',x:626,y:482}];
export const CHAPTER_TREES=[...Array.from({length:12},(_,i)=>[{x:31,y:125+i*36},{x:800,y:125+i*36}]).flat(),{x:196,y:277},{x:350,y:345},{x:350,y:160},{x:210,y:200},{x:167,y:480}];
export const REGION_NAMES={trail:'Lower Briarwood',mill:'The old watermill',return:'The downstream crossing'};
const entries={trail:{x:96,y:500},mill:{x:96,y:500},return:{x:700,y:430}};
const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function newChapter(){return {stage:0,region:null,checkpoint:'trail',x:96,y:500,topics:[],clues:[],cleared:[],anchors:[3,3,3],brake:false,crossed:false};}
export function blessingCount(state){return Number(!!state.dragonBonded)+Number(!!state.guardianFreed)+Number((state.chapter?.stage||0)>=7);}
export function hasRiverstep(state){return blessingCount(state)>=3;}
export function validateChapter(value,state){
  const c=newChapter();if(value===undefined)return c;
  if(!value||typeof value!=='object'||!Number.isInteger(value.stage)||value.stage<0||value.stage>11)throw new Error('The saved chapter is invalid.');
  if(![null,'trail','mill','return'].includes(value.region)||!['trail','mill','return'].includes(value.checkpoint))throw new Error('The saved woodland route is invalid.');
  if(!Number.isFinite(value.x)||!Number.isFinite(value.y)||value.x<38||value.x>794||value.y<120||value.y>542)throw new Error('The saved woodland position is invalid.');
  for(const [key,allowed] of [['topics',TOPICS],['clues',Object.keys(CLUES)],['cleared',MILL_ENEMIES.map(e=>e.id)]]) {
    if(!Array.isArray(value[key])||value[key].some(v=>!allowed.includes(v))||new Set(value[key]).size!==value[key].length)throw new Error('The saved chapter notes are invalid.');
    c[key]=[...value[key]];
  }
  if(!Array.isArray(value.anchors)||value.anchors.length!==3||value.anchors.some(n=>!Number.isInteger(n)||n<0||n>3)||typeof value.brake!=='boolean'||typeof value.crossed!=='boolean')throw new Error('The saved mill progress is invalid.');
  Object.assign(c,{stage:value.stage,region:value.region,checkpoint:value.checkpoint,x:value.x,y:value.y,anchors:[...value.anchors],brake:value.brake,crossed:value.crossed});
  if((c.stage>0&&!state.homecoming)||(c.region&&c.stage<4)||(c.region==='mill'&&c.stage<5)||(c.region==='return'&&c.stage<8)||(c.brake&&c.stage<6)||(c.anchors.some(n=>n<3)&&!c.brake)||(c.cleared.length&&c.stage<6)||(c.stage>=7&&(!c.brake||c.anchors.some(n=>n>0)))||(c.stage>=9&&!c.crossed)||(c.crossed&&c.stage<9)||(c.stage===11&&c.region))throw new Error('The saved chapter order is invalid.');
  return c;
}
export function beginMorning(state){if(state.homecoming&&state.chapter.stage===0){state.chapter.stage=1;return true;}return false;}
export function chapterQuest(state,key){
  const s=state.chapter?.stage||0;
  const descriptions={
    morningWater:s===0?'Your hatchling has a home. Go inside your cottage, press E beside the bed and sleep. Tomorrow can begin slowly.':s===1?'The hatchling is investigating its blanket in the south-east corner of your cottage. Approach it and press E.':s===2?'Rowan is passing your cottage on his way to the river. Step outside and press E to join him. M shows his position.':'Meet Rowan on the west bank, south of the bridge. Press E to talk or sit together. Your hatchling seems interested in the water.',
    riverRescue:s===4?'The hatchling heard a dragon downstream. Take the lower path from the sign on the west bank, south of Rowan’s fishing spot (M). Rowan knows the route. Inspect fresh tracks and iron pins with E, then reach the old mill.':s===5?'A dragon is bound beneath the mill wheel. Bring Rowan to the brake in the western courtyard and press E. He can secure the wheel before you approach.':'Rowan is holding the mill brake. Clear the bramble creatures, cut the west and east anchors, then use C on the ember knot to the south. Left-click/Z attacks; right-click/X dodges. Approach the freed dragon with E. The wardstone and equipment contain clues.',
    pathBack:s===7?'Your third Dragon Blessing awakened Riverstep. Return west from the mill to Lower Briarwood and speak to the guardian in the central clearing with E.':s===8?'The guardian named you an Emberkeeper: you were born able to carry the blessings. Follow the downstream route from the Lower Briarwood entrance. Face left at the marked stones and right-click or press X to Riverstep across the narrow channel.':s===9?'You crossed the channel. Your hatchling is looking towards the river dragon. Press E nearby and let it choose where to go.':'Rowan is walking home with you. Leave the downstream crossing by the western lantern, then enter your cottage. The north-road survey marks and fresh cart tracks are recorded below.',
  };
  const base=CHAPTER_QUESTS.find(q=>q[0]===key);return base?[key,base[1],descriptions[key],base[3]]:null;
}
export function chapterComplete(state,key){return (state.chapter?.stage||0)>={morningWater:4,riverRescue:7,pathBack:11}[key];}
export function riverWater(x,y){return x>390&&x<432&&y>120&&y<542;}
export function chapterBlocked(region,x,y,riverstep=false){
  if(x<38||x>794||y<122||y>542)return true;
  if(region==='return')return riverWater(x,y)&&!(riverstep&&y>408&&y<453);
  if(CHAPTER_TREES.some(t=>Math.abs(x-t.x)<11&&Math.abs(y-t.y)<8))return true;
  if(region==='mill')return (x>480&&x<638&&y>168&&y<271)||(x>650&&x<680&&y<374&&y>120);
  return (x>140&&x<216&&y>318&&y<340)||(x>535&&x<588&&y>305&&y<325);
}
export function findChapterRoute(region,from,to){
  const start={x:Math.round(from.x/8)*8,y:Math.round(from.y/8)*8},queue=[start],parents=new Map([[`${start.x},${start.y}`,null]]);
  for(let head=0;head<queue.length;head++){
    const p=queue[head],key=`${p.x},${p.y}`;
    if(distance(p,to)<25){const route=[];let k=key;while(k){const [x,y]=k.split(',').map(Number);route.unshift({x,y});k=parents.get(k);}return route;}
    for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(!parents.has(k)&&!chapterBlocked(region,x,y)){parents.set(k,key);queue.push({x,y});}}
  }
  return [];
}

export class MillChapter {
  constructor(state,events={}){
    this.state=state;this.events={say:()=>{},toast:()=>{},changed:()=>{},home:()=>{},...events};
    const c=state.chapter;c.region=c.region||c.checkpoint;
    if(chapterBlocked(c.region,c.x,c.y)){Object.assign(c,entries[c.region]);}
    this.active=true;this.time=0;this.player={x:c.x,y:c.y,direction:'up',walk:0,hp:8,maxHp:8,invulnerable:0,dash:0,dashCooldown:0,attackCooldown:0,dragonCooldown:0};
    this.companion={x:c.x-18,y:c.y+15,direction:'up'};this.rowan={x:c.region==='return'?337:c.x+20,y:c.region==='return'?430:c.y+18,direction:'up',walk:0};
    this.enemies=MILL_ENEMIES.map(e=>({...e,hp:c.cleared.includes(e.id)?0:3,maxHp:3,phase:'idle',timer:0,flash:0}));
    this.effects=[];this.projectiles=[];this.swing=null;this.sweep={phase:'idle',timer:2};this.departureOffered=false;this.safe={x:c.x,y:c.y};this.rowanRoute=[];this.routeClock=0;this.bindingHintCooldown=0;
  }
  get region(){return this.state.chapter.region;}
  get title(){return REGION_NAMES[this.region];}
  get fighting(){return this.region==='mill'&&this.state.chapter.stage===6;}
  get hatchlingPresent(){return this.state.chapter.stage!==10;}
  changed(){this.state.chapter.x=this.player.x;this.state.chapter.y=this.player.y;this.events.changed();}
  note(id){if(!this.state.chapter.clues.includes(id)){this.state.chapter.clues.push(id);this.changed();}}
  move(actor,dx,dy,water=false){
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
    for(let i=0;i<steps;i++){if(!chapterBlocked(this.region,actor.x+dx/steps,actor.y,water))actor.x+=dx/steps;if(!chapterBlocked(this.region,actor.x,actor.y+dy/steps,water))actor.y+=dy/steps;}
  }
  transition(region,point=entries[region]){
    Object.assign(this.state.chapter,{region,checkpoint:region,...point});Object.assign(this.player,point,{dash:0});this.safe={...point};
    this.companion={x:point.x-18,y:point.y+15,direction:'up'};this.rowan={x:region==='return'?337:point.x+20,y:region==='return'?430:point.y+18,direction:'up',walk:0};this.changed();
    this.rowanRoute=[];this.routeClock=0;
  }
  landmarks(){
    if(this.region==='mill')return [['Lower path',96,505],['Mill brake',420,375],['West anchor',320,235],['East anchor',710,240],['Ember knot',580,470],['Bound dragon',570,330],['Wardstone',460,210]];
    if(this.region==='return')return [['Path home',96,430],['Riverstep stones',457,430],['Rowan',337,430]];
    return [['Hearthvale / downstream',96,500],['Old picnic spot',245,400],['Cart tracks',290,315],['Fallen pins',570,440],['Old mill',735,180],...(this.state.chapter.stage>=7?[['Guardian',490,250]]:[])];
  }
  objective(){
    const c=this.state.chapter;
    if(this.region==='return')return c.stage>=10?'Follow Rowan to the western lantern, then home.':c.stage===9?'Your hatchling is looking towards the river dragon. Press E.':'Face left at the marked stones. Right-click or X: Riverstep across.';
    if(this.region==='trail')return c.stage>=7?'Speak to the guardian in the central clearing, then take the downstream route.':'Follow the lower path to the old mill. E examines tracks and other discoveries.';
    if(c.stage>=7)return 'A dragon is free. Explore the wardstone, then return west to the guardian.';
    if(!c.brake)return 'Reach the brake in the western courtyard with Rowan. Press E.';
    const remaining=c.anchors.filter(n=>n>0).length;
    return remaining?`Break the bindings · ${3-remaining}/3. Blade for stone anchors; C for the ember knot.`:'The bindings are broken. Approach the river dragon and press E.';
  }
  nearby(){
    const c=this.state.chapter,p=this.player;
    let things;
    if(this.region==='trail')things=[{id:'exit',x:96,y:500,label:c.stage>=8?'Take the downstream route':'Return to Hearthvale'},{id:'picnic',x:245,y:400,label:'Look at the old picnic spot'},{id:'tracks',x:290,y:315,label:'Examine the cart tracks'},{id:'glide',x:440,y:250,label:'Watch your hatchling'},{id:'pins',x:570,y:440,label:'Inspect the iron pins'},{id:'rope',x:700,y:330,label:'Examine the abandoned rope'},{id:'mill',x:735,y:180,label:'Approach the watermill'},...(c.stage>=7?[{id:'guardian',x:490,y:250,label:'Speak to the guardian'}]:[])];
    else if(this.region==='mill')things=[{id:'exit',x:96,y:500,label:'Return to the lower path'},{id:'brake',x:420,y:375,label:c.brake?'Talk to Rowan':'Secure the mill brake'},{id:'dragon',x:570,y:330,label:c.stage>=7?'Listen to the river dragon':'Approach the bound dragon'},{id:'stone',x:460,y:210,label:'Examine the wardstone'},{id:'north',x:420,y:460,label:'Read the survey crate'},{id:'ladder',x:735,y:375,label:'Look across the millrace'},...ANCHORS.map((a,i)=>({...a,id:`anchor${i}`,label:c.anchors[i]>0?'Examine this binding':'Inspect the broken anchor'}))];
    else things=[{id:'home',x:96,y:430,label:'Take the path home'},{id:'stones',x:455,y:430,label:'Read the crossing stones'},{id:'rowan',x:337,y:430,label:'Talk to Rowan'},...(c.stage===9?[{id:'departure',x:p.x+4,y:p.y+4,label:'Let your hatchling choose'}]:[])];
    return things.map(t=>({...t,d:distance(p,t)})).filter(t=>t.d<39).sort((a,b)=>a.d-b.d)[0];
  }
  hint(){return this.nearby()?.label||null;}
  interact(){
    const target=this.nearby();if(!target)return false;const id=target.id,c=this.state.chapter,say=this.events.say;
    if(this.region==='trail') {
      if(id==='exit'){if(c.stage>=8)this.transition('return');else say('rowan',['We can head back whenever you like. I’ll remember where we got to.'],()=>this.leave(),'Head back','Keep exploring');}
      if(id==='picnic')say('rowan',['My aunt used to bring me here. I once said I could jump that whole log.','I could not. She had to walk home with one very muddy nephew.','I still like coming down here. Just with more realistic ambitions.']);
      if(['tracks','pins','rope'].includes(id)){this.note(id);say(id==='tracks'?'Fresh cart tracks':id==='pins'?'Iron pins':'A length of binding rope',[CLUES[id],id==='rope'?'Rowan turns the rope over. “That knot’s meant to tighten when something pulls. Whoever tied it expected a struggle.”':'Your hatchling waits close to your leg. The answering call comes from further downstream.']);}
      if(id==='glide'){this.glide={time:0};say('Your hatchling',['It climbs a low stump, spreads both wings and launches itself towards you.','For three glorious seconds, it is flying. Then it lands against your shoulder and clings there, looking extremely pleased with itself.','Rowan politely examines the trees until you have both recovered your dignity.'],()=>{this.glide=null;});}
      if(id==='mill')say('rowan',['There. Under the wheel. Those vines are holding its wings down.','The old brake is in the western courtyard. I can secure the wheel with this rope. Let’s look before we touch anything.'],()=>{c.stage=Math.max(c.stage,5);this.transition('mill');},'Take the lower steps','Stay on the path');
      if(id==='guardian') {
        if(c.stage===7)say('guardian',['Three blessings. And you carry them all.','You were born an Emberkeeper. Every blessing wakes a little more of what is already inside you. Other people may be blessed; your kind can keep the gifts together.','I wondered when you first heard me. You answered before I made a sound.'],()=>say('rowan',['You look as though someone just told you something enormous.','Wait. You heard words? I only heard it rumble.','We can work out the rest tomorrow. There’s a shorter way home downstream. I’ll take the old service bridge and meet you on the other bank.'],()=>{c.stage=8;this.changed();},'Head towards the downstream path'));
        else say('guardian',['The blessings were freely given. Remember that when you look at those bindings.','I will listen for the wheels on the north road. For tonight, take your little friend home.']);
      }
    } else if(this.region==='mill') {
      if(id==='exit')this.transition('trail',{x:735,y:180});
      if(id==='brake')say('rowan',c.brake?['The brake is holding. I’ve had plenty of practice untangling fishing line; this is just rather larger.','Clear the creatures near each anchor. Cut the two stone bindings, then call your hatchling’s fire at the southern knot.']:['I can loop the rope around the brake lever. The wheel should hold while you reach the anchors.','I’ll stay here. If you need to fall back, the lower steps are clear.','The two stone anchors can be cut. That tight knot to the south needs your hatchling’s ember breath.'],()=>{c.brake=true;c.stage=Math.max(c.stage,6);this.rowan={x:432,y:390,direction:'up',walk:0};this.changed();},c.brake?'Back to the clearing':'Hold the brake','A moment');
      if(id==='dragon') {
        if(c.stage>=7)say('riverDragon',['The current knows the way home. Your little friend remembers me.','Go gently across the water, Emberkeeper. We shall meet again.']);
        else if(c.anchors.some(n=>n>0))say('The bound dragon',['A thorn loop tightens when it tries to move. Three lines run from its wings to the anchors.','Its eye follows your hatchling. For a moment, it stops struggling.']);
        else say('The final binding',['You raise the blade towards the last loop. The dragon flinches.','You lower it, loosen the knot with your hands and step back. Your hatchling presses its forehead against the dragon’s jaw.'],()=>say('riverDragon',['You stayed. Even when I was afraid of you.','The dragon touches its brow to your palm. Water rises from the millrace and circles your wrist before sinking into your skin.','A third Dragon Blessing. Riverstep awakens: face a direction and right-click or press X to glide farther. It can carry you over a narrow stream.'],()=>{c.stage=7;this.note('stone');this.note('north');this.changed();this.events.toast('Dragon Blessings · 3. Riverstep awakened.');},'Receive the blessing'));
      }
      if(id==='stone'){this.note('stone');say('The new wardstone',[CLUES.stone,'Straight channels have been cut through the old stone. Each thorn line has been fastened into an iron socket.','This was built to hold the dragon here. The open conduit ends beside a survey peg.']);}
      if(id==='north'){this.note('north');say('A survey crate',[CLUES.north,'Inside are spare pins, a stone-cutting chisel and a folded instruction: “Northern survey. Test the supply before extending the line.”']);}
      if(id==='ladder')say('The millrace',['A narrow footbridge crosses the millrace to the south. The eastern anchor is on the far bank.','The old ladder has rotted through. The bridge is the safe way around.']);
      if(id.startsWith('anchor')){const i=Number(id.at(-1));say('A thorn binding',[c.anchors[i]<=0?'The broken anchor lies quiet.':!c.brake?'The wheel shifts dangerously. Ask Rowan to secure the brake first.':i===2?'The knot is too tightly woven for a blade. Clear the creatures, move within calling distance and press C.':'The stone eye holds a living thorn rope. Clear the nearby bramble creatures, face it and attack with left-click or Z.']);}
    } else {
      if(id==='stones')say('The crossing stones',['The carved ripples point across the narrow channel. Face left from this bank, then right-click or press X.','Riverstep carries you about twice as far as an ordinary dodge. Start close to the water; the marked stones show the crossing.']);
      if(id==='rowan')say('rowan',[c.stage>=10?'We can wait a minute. There’s no need to hurry away.':'The service bridge is intact further up. Your route looks considerably more impressive.','The western lantern marks the path to Hearthvale.']);
      if(id==='departure')this.departure();
      if(id==='home') {if(c.stage<10)this.events.toast('Your hatchling is waiting by the crossing. Press E beside it.');else say('rowan',['Ready? I’ll walk back with you.','At the village lane, Rowan gives the sky one last hopeful glance, then matches his pace to yours.'],()=>this.leave(),'Walk home','Wait a little longer');}
    }
    return true;
  }
  departure(){
    const c=this.state.chapter;if(c.stage!==9)return;
    const go=()=>{this.flight={x:this.companion.x,y:this.companion.y,time:0};c.stage=10;this.changed();this.events.say('rowan',['We can wait a minute.','He settles on the low wall beside you. The gap in the trees stays quiet. After a while, he gets up when you do.'],null,'Walk when you are ready');};
    this.events.say('Your hatchling',['The river dragon rises above the trees and calls. Your hatchling scrambles onto a stone, spreads its wings, then looks back at you.'],go,'Go on','I’ll be at the cottage',go);
  }
  targets(){
    if(!this.fighting)return [];
    const c=this.state.chapter;
    return [...this.enemies.filter(e=>e.hp>0),...ANCHORS.map((a,i)=>({...a,anchor:i,hp:c.anchors[i],maxHp:3})).filter(a=>a.hp>0)];
  }
  damage(target,amount,fire=false){
    const c=this.state.chapter;
    if(target.anchor!==undefined){const i=target.anchor;if(!c.brake)return false;if(this.enemies.some(e=>e.hp>0&&distance(e,target)<125)){this.bindingHint('Bramble roots shield this binding. Clear the nearby creatures first.');return false;}if(i===2&&!fire){this.bindingHint('The southern knot needs ember breath · C.');return false;}c.anchors[i]=Math.max(0,c.anchors[i]-amount);this.changed();if(c.anchors.every(n=>n===0))this.events.toast('The bindings fall loose. Approach the river dragon and press E.');}
    else {target.hp=Math.max(0,target.hp-amount);target.flash=.2;if(target.hp===0&&!c.cleared.includes(target.id)){c.cleared.push(target.id);this.changed();}}
    this.effects.push({x:target.x,y:target.y-10,life:.4,kind:'leaves'});return true;
  }
  bindingHint(message){if(this.bindingHintCooldown<=0){this.events.toast(message);this.bindingHintCooldown=2.5;}}
  command(key){
    const p=this.player;if(!this.active)return false;
    if(key==='x'&&p.dashCooldown<=0){p.dash=hasRiverstep(this.state)? .3:.22;p.dashCooldown=1.05;p.invulnerable=Math.max(p.invulnerable,.36);p.dashDirection=p.direction;return true;}
    if(key==='z'&&p.attackCooldown<=0&&p.dash<=0){p.attackCooldown=.34;this.swing={direction:p.direction,life:.18};const [fx,fy]=vectors[p.direction];for(const e of this.targets()){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<43&&(d<12||(dx*fx+dy*fy)/d>.1))this.damage(e,1);}return true;}
    if(key==='c'&&p.dragonCooldown<=0){const target=this.targets().filter(e=>distance(e,p)<185&&!(e.anchor!==undefined&&this.enemies.some(n=>n.hp>0&&distance(n,e)<125))).sort((a,b)=>distance(a,p)-distance(b,p))[0];if(!target){this.events.toast(this.fighting?'Move closer to a creature or exposed binding.':'Your hatchling watches for your next cue.');return false;}p.dragonCooldown=3.2;this.projectiles.push({x:this.companion.x,y:this.companion.y-9,target,life:2});return true;}
    return false;
  }
  hurt(){const p=this.player;if(p.invulnerable>0||!this.active)return;p.hp--;p.invulnerable=1.15;if(p.hp<=0)this.leave(true);}
  animate(dt){if(this.flight)this.flight.time+=dt;if(this.glide)this.glide.time+=dt;}
  leave(defeated=false){if(!this.active)return;this.changed();this.active=false;this.state.chapter.region=null;this.events.home(defeated);}
  update(dt,keys=new Set()){
    if(!this.active)return;dt=Math.max(0,Math.min(dt,.05));this.time+=dt;const p=this.player,c=this.state.chapter;
    this.bindingHintCooldown=Math.max(0,this.bindingHintCooldown-dt);
    for(const k of ['invulnerable','dashCooldown','attackCooldown','dragonCooldown'])p[k]=Math.max(0,p[k]-dt);
    if(this.swing){this.swing.life-=dt;if(this.swing.life<=0)this.swing=null;}
    this.effects=this.effects.filter(e=>(e.life-=dt)>0);
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
    if(p.dash>0){const dashDt=Math.min(dt,p.dash);p.dash=Math.max(0,p.dash-dashDt);[dx,dy]=vectors[p.dashDirection];const speed=hasRiverstep(this.state)?300:220;this.move(p,dx*speed*dashDt,dy*speed*dashDt,hasRiverstep(this.state));if(hasRiverstep(this.state))this.effects.push({x:p.x,y:p.y,life:.25,kind:'ripple'});if(p.dash===0&&chapterBlocked(this.region,p.x,p.y))Object.assign(p,this.safe);}
    else if(dx||dy){p.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const n=Math.hypot(dx,dy);this.move(p,dx/n*76*dt,dy/n*76*dt);}
    if(!chapterBlocked(this.region,p.x,p.y))this.safe={x:p.x,y:p.y};p.walk=dx||dy?(p.walk||0)+dt*11:0;
    if(this.hatchlingPresent){const d=distance(p,this.companion);if(d>24){this.move(this.companion,(p.x-this.companion.x)/d*95*dt,(p.y-this.companion.y)/d*95*dt,hasRiverstep(this.state));this.companion.direction=p.direction;}if(d>150)Object.assign(this.companion,{x:p.x-16,y:p.y+12});}
    if(c.brake&&this.region==='mill')Object.assign(this.rowan,{x:432,y:390,direction:'up',walk:0});
    else if(this.region!=='return'){
      const d=distance(p,this.rowan);this.routeClock-=dt;
      if(d>35){if(this.routeClock<=0){this.rowanRoute=findChapterRoute(this.region,this.rowan,p);this.routeClock=.8;}const target=this.rowanRoute[0];if(target){const dx=target.x-this.rowan.x,dy=target.y-this.rowan.y,n=Math.hypot(dx,dy);if(n<3)this.rowanRoute.shift();else {const step=Math.min(n,83*dt);this.move(this.rowan,dx/n*step,dy/n*step);this.rowan.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';this.rowan.walk+=dt*8;}}}else this.rowan.walk=0;
    }
    for(const bolt of this.projectiles){bolt.life-=dt;const d=distance(bolt,{x:bolt.target.x,y:bolt.target.y-10});if(d<12){this.damage(bolt.target,bolt.target.anchor===2?3:2,true);bolt.life=0;}else {bolt.x+=(bolt.target.x-bolt.x)/d*220*dt;bolt.y+=(bolt.target.y-10-bolt.y)/d*220*dt;}}
    this.projectiles=this.projectiles.filter(b=>b.life>0);
    if(this.fighting){
      for(const e of this.enemies.filter(e=>e.hp>0)){e.flash=Math.max(0,e.flash-dt);const d=distance(e,p);if(e.phase==='windup'){e.timer-=dt;if(e.timer<=0){if(d<33)this.hurt();e.phase='recover';e.timer=1.2;}}else if(e.phase==='recover'){e.timer-=dt;if(e.timer<=0)e.phase='idle';}else if(d<33){e.phase='windup';e.timer=.85;}else if(d<145&&distance(e,MILL_ENEMIES.find(n=>n.id===e.id))<120)this.move(e,(p.x-e.x)/d*26*dt,(p.y-e.y)/d*26*dt);}
      this.sweep.timer-=dt;
      if(this.sweep.phase==='idle'&&this.sweep.timer<=0&&distance(p,{x:570,y:330})<125){this.sweep.phase='warning';this.sweep.timer=1.35;}
      else if(this.sweep.phase==='warning'&&this.sweep.timer<=0){if(distance(p,{x:570,y:330})<85)this.hurt();this.effects.push({x:570,y:330,life:.35,kind:'sweep'});this.sweep.phase='idle';this.sweep.timer=3;}
    }
    if(this.region==='return'&&c.stage===8&&p.x<385&&p.y>408&&p.y<453&&hasRiverstep(this.state)){c.crossed=true;c.stage=9;this.changed();this.events.toast('Riverstep · You made it across. Your hatchling looks towards the trees.');}
    c.x=p.x;c.y=p.y;
  }
}
