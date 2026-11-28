import { drawCharacter, drawTree } from './art.js?v=0.8.0';
import { drawDragon } from './dragon.js?v=0.8.0';
import { WOODS, WOODS_TREES, OBSTACLES, HATCHLING } from './combat.js?v=0.8.0';

let ground;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(Math.round(x),Math.round(y),w,h);};
function terrain() {
  if(ground)return ground;
  ground=document.createElement('canvas');ground.width=WOODS.width;ground.height=WOODS.height;
  const c=ground.getContext('2d');r(c,0,0,832,576,'#809d77');r(c,0,0,832,98,'#8eafa0');
  for(let x=0;x<832;x+=16){const h=Math.floor(24+Math.sin(x/61)*12);r(c,x,h,16,90-h,'#557c67');r(c,x,h+25,16,84-h,'#3c6655');}
  r(c,0,94,832,22,'#557b5b');
  for(let y=120;y<576;y+=8)for(let x=0;x<832;x+=8){const n=(x*17+y*31)%73;if(n<10)r(c,x,y,3,1,'#a7ba8c');if(n===21){r(c,x,y,1,3,'#5e845f');r(c,x+2,y+1,1,2,'#5e845f');}}
  for(const [x,y,w,h] of [[276,370,26,175],[288,330,208,25],[467,211,28,138],[480,210,158,24],[608,160,25,65],[238,238,25,117],[246,342,49,20]]){
    r(c,x-2,y-2,w+4,h+4,'#9aae81');r(c,x,y,w,h,'#b8b188');
    for(let py=y+3;py<y+h;py+=9)for(let px=x+3;px<x+w;px+=11)if((px+py)%3===0)r(c,px,py,3,1,'#a69e77');
  }
  for(let y=-24;y<24;y+=3){const half=Math.floor(Math.sqrt(1-y*y/(26*26))*53);r(c,113-half,422+y,half*2,3,'#5e8d86');r(c,116-half,422+y,half*2-6,2,'#8bb4a5');}
  for(let i=0;i<10;i++)r(c,76+i*7,410+i%3*8,11,1,'#c2d8b6');
  for(const o of OBSTACLES){r(c,o.x-2,o.y+o.h-2,o.w+4,5,'#49684755');r(c,o.x,o.y,o.w,o.h,o.h<20?'#77634c':'#79867a');r(c,o.x+3,o.y+2,o.w-6,3,o.h<20?'#af9063':'#acb59a');r(c,o.x+9,o.y+6,4,3,'#617f56');}
  r(c,323,447,37,8,'#765b45');r(c,327,448,30,2,'#b28e60');r(c,325,444,7,3,'#8a9d64');
  // An old stone nest, a camp lantern and small patches of woodland flowers.
  for(const [x,y,w,h] of [[580,194,79,18],[588,182,62,12],[596,174,47,9]]){r(c,x,y,w,h,'#879781');r(c,x+3,y,w-6,3,'#bac0a0');}
  r(c,307,498,4,17,'#75644d');r(c,302,494,14,10,'#9d8e61');r(c,305,495,8,7,'#e4ca8b');r(c,307,496,4,4,'#fff0b8');
  for(const [bx,by] of [[201,411],[364,481],[463,360],[550,224],[280,180]])for(let i=0;i<7;i++){const x=bx+(i*11)%28,y=by+(i*7)%17;r(c,x,y,1,5,'#5f8456');r(c,x-1,y-2,3,3,i%2?'#d1b8c0':'#e5d4ab');}
  return ground;
}
function ring(c,x,y,radius,colour) {
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2;r(c,x+Math.cos(a)*radius,y+Math.sin(a)*radius,3,2,colour);}
}
function bramble(c,e,time) {
  if(e.hp<=0)return;
  c.save();c.translate(Math.round(e.x),Math.round(e.y));
  const bob=Math.sin(time*5+e.x)>0?-1:0;c.translate(0,bob);
  r(c,-8,0,16,2,'#284a3a33');r(c,-8,-13,16,12,'#3c6550');r(c,-6,-16,12,17,e.flash>0?'#f1d39e':'#789a67');
  r(c,-10,-12,4,6,'#5d8156');r(c,6,-12,4,6,'#5d8156');r(c,-6,-20,3,6,'#c0b88b');r(c,3,-20,3,6,'#c0b88b');
  r(c,-4,-11,3,3,'#e6bd80');r(c,2,-11,3,3,'#e6bd80');r(c,-3,-11,1,3,'#354a3d');r(c,3,-11,1,3,'#354a3d');r(c,-2,-5,4,2,'#405f48');
  r(c,-11,-29,22,3,'#243e32');r(c,-10,-28,20*e.hp/e.maxHp,1,'#d3b57b');c.restore();
}
export function drawWilds(c,encounter,state,time,camera,map=false) {
  c.save();c.translate(-camera.x,-camera.y);c.drawImage(terrain(),0,0);
  if(!state.guardianFreed){for(const e of encounter.targets())if(e.phase==='windup')ring(c,e.x,e.y,e.boss?76:32,'#e0a779');}
  const sprites=WOODS_TREES.map(t=>({y:t.y,draw:()=>drawTree(c,t)}));
  for(const e of encounter.enemies)sprites.push({y:e.y,draw:()=>bramble(c,e,encounter.time)});
  const g=encounter.guardian;
  sprites.push({y:g.y,draw:()=>{
    drawDragon(c,g.x,g.y,{green:true,scale:2,time:encounter.time,calm:state.guardianFreed||g.hp<=0});
    if(!state.guardianFreed&&g.hp>0){r(c,g.x-13,g.y-29,27,5,'#6f5266');r(c,g.x-2,g.y-31,5,9,'#baa1ad');
      r(c,g.x-27,g.y-70,54,5,'#263e34');r(c,g.x-26,g.y-69,52*g.hp/g.maxHp,3,'#d1a174');}
  }});
  if(!state.dragonBonded)sprites.push({y:HATCHLING.y,draw:()=>drawDragon(c,HATCHLING.x,HATCHLING.y,{time:encounter.time})});
  else sprites.push({y:encounter.companion.y,draw:()=>drawDragon(c,encounter.companion.x,encounter.companion.y,{direction:encounter.companion.direction,time:encounter.time})});
  const p=encounter.player;
  sprites.push({y:p.y,draw:()=>{
    if(p.invulnerable>0&&!map&&Math.floor(encounter.time*14)%2===0)c.globalAlpha=.55;
    drawCharacter(c,p.x,p.y,state.appearance,p.direction,p.walk);c.globalAlpha=1;
    if(encounter.swing&&!map){const offsets={up:[0,-36],down:[0,6],left:[-22,-16],right:[22,-16]},[dx,dy]=offsets[encounter.swing.direction];
      for(let i=-2;i<=2;i++){const vertical=dx!==0;r(c,p.x+dx+(vertical?Math.abs(i)*2:i*6),p.y+dy+(vertical?i*5:Math.abs(i)*2),vertical?3:5,vertical?5:3,'#f5dca3');}}
  }});
  sprites.sort((a,b)=>a.y-b.y).forEach(s=>s.draw());
  if(!map){for(const bolt of encounter.projectiles){r(c,bolt.x-4,bolt.y-3,8,6,'#da9766');r(c,bolt.x-2,bolt.y-2,5,4,'#ffe0a0');}
    for(const e of encounter.effects){if(e.kind==='stomp')ring(c,e.x,e.y,e.radius,'#f0cb8d');else for(let i=0;i<7;i++){const a=i*Math.PI*2/7,spread=(.8-e.life)*22;r(c,e.x+Math.cos(a)*spread,e.y+Math.sin(a)*spread,3,3,e.kind==='hurt'?'#ddaa98':e.kind==='leaves'?'#b2c68a':'#f4d49b');}}
  }
  c.restore();
}
