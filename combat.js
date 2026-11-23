export const WOODS = { width: 832, height: 576 };
export const TRAIL = { x: 288, y: 512 };
export const HATCHLING = { x: 350, y: 455 };
export const GUARDIAN = { x: 620, y: 200 };
export const OBSTACLES = [{ x: 136, y: 300, w: 72, h: 15 }, { x: 494, y: 400, w: 38, h: 29 }, { x: 397, y: 166, w: 50, h: 18 }];
export const WOODS_TREES = [
  ...[145,200,255,310,365,420,475,530].flatMap(y=>[{x:35,y},{x:79,y:y+12},{x:790,y},{x:749,y:y+14}]),
  ...[135,230,325,420,515,710].map(x=>({x,y:122})),
  ...[140,210,400,475,550,640,710].map(x=>({x,y:544})),
  {x:168,y:200},{x:375,y:300},{x:545,y:350},{x:697,y:385},{x:422,y:465},{x:655,y:485},{x:573,y:135},
];
const vectors = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export function woodsBlocked(x,y) {
  return x<38 || x>794 || y<122 || y>542 || OBSTACLES.some(o=>x>o.x-5&&x<o.x+o.w+5&&y>o.y-4&&y<o.y+o.h+4) || WOODS_TREES.some(t=>Math.abs(x-t.x)<10&&Math.abs(y-t.y)<7) || ((x-113)/52)**2+((y-422)/26)**2<1;
}
function move(actor,dx,dy) {
  // Small steps keep a dash from crossing a solid obstacle between frames.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));
  for(let i=0;i<steps;i++) {
    if(!woodsBlocked(actor.x+dx/steps,actor.y))actor.x+=dx/steps;
    if(!woodsBlocked(actor.x,actor.y+dy/steps))actor.y+=dy/steps;
  }
}

export class WoodlandEncounter {
  constructor(state,events={}) {
    this.state=state;
    this.events={toast:()=>{},say:()=>{},changed:()=>{},home:()=>{},...events};
    this.active=true; this.time=0;
    this.player={x:288,y:500,direction:'up',walk:0,hp:6,maxHp:6,invulnerable:0,dash:0,dashCooldown:0,attackCooldown:0,dragonCooldown:0};
    this.companion={x:270,y:518,direction:'up'};
    this.enemies=state.guardianFreed?[]:[
      {id:'bramble-1',x:320,y:342,homeX:320,homeY:342,hp:2,maxHp:2},
      {id:'bramble-2',x:480,y:304,homeX:480,homeY:304,hp:2,maxHp:2},
      {id:'bramble-3',x:248,y:226,homeX:248,homeY:226,hp:2,maxHp:2},
    ].map(e=>({...e,phase:'idle',timer:0,flash:0}));
    this.guardian={id:'guardian',...GUARDIAN,hp:state.guardianFreed?0:8,maxHp:8,phase:'idle',timer:0,flash:0,boss:true};
    this.projectiles=[];this.effects=[];this.swing=null;
  }
  get guardianAwake() { return this.state.dragonBonded&&this.enemies.every(e=>e.hp<=0); }
  targets() { return [...this.enemies,...(this.guardianAwake&&!this.state.guardianFreed?[this.guardian]:[])].filter(e=>e.hp>0); }
  objective() {
    if(!this.state.dragonBonded)return 'Follow the little cry beside the fallen log.';
    if(this.state.guardianFreed)return 'Briarwood is quiet. Head home whenever you like.';
    const remaining=this.enemies.filter(e=>e.hp>0).length;
    if(remaining)return `Clear the bramble sprites · ${3-remaining}/3`;
    return this.guardian.hp>0?'Break the guardian’s binding. Watch for its warning circle.':'Approach the guardian and press E to free it.';
  }
  hint() {
    if(!this.state.dragonBonded&&distance(this.player,HATCHLING)<38)return 'Help the hatchling';
    if(this.guardian.hp<=0&&distance(this.player,GUARDIAN)<55)return this.state.guardianFreed?'Talk to the guardian':'Free the guardian';
    if(distance(this.player,TRAIL)<36)return 'Return to Hearthvale';
    return null;
  }
  interact() {
    const hint=this.hint();
    if(hint==='Help the hatchling') {
      this.events.say('A wayward hatchling',[
        'A little dragon has caught its wing beneath a fallen branch. You lift the wood and sit back. After a long moment, it edges forward and presses its warm forehead into your hand.',
        'It follows when you stand, then stops whenever you look back. On the third try, you hold out your hand. This time it stays beside you.',
        'The hatchling will follow you. Press C to call its ember breath in a fight. Z swings your blade; X dodges an incoming attack.',
      ],()=>{this.state.dragonBonded=true;this.companion={x:this.player.x-18,y:this.player.y+10,direction:'up'};this.events.changed();this.events.toast('A first bond · Your hatchling is ready to help.');});
      return true;
    }
    if(hint==='Free the guardian') {
      this.events.say('guardian',[
        'The dark band around the dragon’s neck crumbles. It lowers its head. Your hatchling steps forward, very bravely, and touches its nose.',
        'Someone taught these thorns to bind us, says a voice in your thoughts. The hatchling checks that you are still beside it. It has chosen well, the guardian says. Take it home, Emberkeeper.',
      ],()=>{this.state.guardianFreed=true;this.events.changed();this.events.toast('The guardian is free · Briarwood welcomes you.');});return true;
    }
    if(hint==='Talk to the guardian'){this.events.say('guardian',['The trees remember kindness. So will I. Take good care of your little friend.']);return true;}
    if(hint==='Return to Hearthvale'){this.events.say('The path home',['Warm tea and your own garden are waiting. Head back to Hearthvale?'],()=>this.leave(false),'Head home');return true;}
    return false;
  }
  leave(defeated=false) { if(!this.active)return;this.active=false;this.events.home(defeated); }
  damageEnemy(enemy,amount) {
    if(enemy.hp<=0)return;
    enemy.hp=Math.max(0,enemy.hp-amount);enemy.flash=.18;
    this.effects.push({x:enemy.x,y:enemy.y-12,life:.3,kind:'hit'});
    if(enemy.hp===0) {
      enemy.phase='idle';
      this.effects.push({x:enemy.x,y:enemy.y-8,life:.7,kind:'leaves'});
      if(enemy.boss)this.events.toast('The binding is broken. Walk closer and press E.');
      else if(this.enemies.every(e=>e.hp<=0))this.events.toast('The clearing falls quiet. A larger dragon stirs to the north-east.');
    }
  }
  command(key) {
    if(!this.active)return false;
    const p=this.player;
    if(key==='z'&&p.attackCooldown<=0&&p.dash<=0) {
      p.attackCooldown=.34;this.swing={direction:p.direction,life:.18};
      const [fx,fy]=vectors[p.direction];
      for(const enemy of this.targets()) {
        const dx=enemy.x-p.x,dy=enemy.y-p.y,d=Math.hypot(dx,dy);
        if(d<42&&(d<12||(dx*fx+dy*fy)/d>.1))this.damageEnemy(enemy,1);
      }
      return true;
    }
    if(key==='x'&&p.dashCooldown<=0) {
      p.dash=.22;p.dashCooldown=1.05;p.invulnerable=Math.max(p.invulnerable,.3);p.dashDirection=p.direction;return true;
    }
    if(key==='c'&&p.dragonCooldown<=0) {
      if(!this.state.dragonBonded){this.events.toast('The little cry is coming from beside the fallen log.');return false;}
      const target=this.targets().filter(e=>distance(p,e)<185).sort((a,b)=>distance(p,a)-distance(p,b))[0];
      if(!target){this.events.toast('Move within calling distance of a bramble sprite or the guardian.');return false;}
      p.dragonCooldown=3.2;
      this.projectiles.push({x:this.companion.x,y:this.companion.y-9,target,life:2});return true;
    }
    return false;
  }
  hurt() {
    const p=this.player;
    if(p.invulnerable>0||!this.active)return false;
    p.hp--;p.invulnerable=1.1;
    this.effects.push({x:p.x,y:p.y-12,life:.3,kind:'hurt'});
    if(p.hp<=0)this.leave(true);
    return true;
  }
  update(dt,keys=new Set()) {
    if(!this.active)return;
    dt=Math.min(dt,.05);this.time+=dt;const p=this.player;
    for(const field of ['invulnerable','dashCooldown','attackCooldown','dragonCooldown'])p[field]=Math.max(0,p[field]-dt);
    if(this.swing){this.swing.life-=dt;if(this.swing.life<=0)this.swing=null;}
    this.effects=this.effects.filter(e=>(e.life-=dt)>0);
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
    if(p.dash>0){p.dash=Math.max(0,p.dash-dt);[dx,dy]=vectors[p.dashDirection];move(p,dx*220*dt,dy*220*dt);}
    else if(dx||dy){p.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const n=Math.hypot(dx,dy);move(p,dx/n*76*dt,dy/n*76*dt);}
    p.walk=dx||dy?(p.walk||0)+dt*11:0;
    const companionDistance=distance(p,this.companion);
    if(companionDistance>23){const n=companionDistance;move(this.companion,(p.x-this.companion.x)/n*100*dt,(p.y-this.companion.y)/n*100*dt);this.companion.direction=p.direction;}
    if(companionDistance>165){this.companion.x=p.x-16;this.companion.y=p.y+12;}
    for(const bolt of this.projectiles) {
      bolt.life-=dt;const tx=bolt.target.x,ty=bolt.target.y-12,d=Math.hypot(tx-bolt.x,ty-bolt.y);
      if(d<12){this.damageEnemy(bolt.target,2);bolt.life=0;}
      else {bolt.x+=(tx-bolt.x)/d*210*dt;bolt.y+=(ty-bolt.y)/d*210*dt;}
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0&&b.target.hp>0);
    for(const enemy of this.targets()) {
      enemy.flash=Math.max(0,enemy.flash-dt);const d=distance(p,enemy),range=enemy.boss?76:32;
      if(enemy.phase==='windup') {
        enemy.timer-=dt;
        if(enemy.timer<=0){if(d<range)this.hurt();enemy.phase='recover';enemy.timer=enemy.boss?1.45:1;this.effects.push({x:enemy.x,y:enemy.y,life:.25,kind:'stomp',radius:range});}
      }else if(enemy.phase==='recover'){enemy.timer-=dt;if(enemy.timer<=0)enemy.phase='idle';}
      else if(d<range){enemy.phase='windup';enemy.timer=enemy.boss?.95:.6;}
      else if(d<160){const speed=enemy.boss?19:27;move(enemy,(p.x-enemy.x)/d*speed*dt,(p.y-enemy.y)/d*speed*dt);}
      if(!this.active)return;
    }
  }
}
