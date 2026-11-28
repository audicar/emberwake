import { FLOWERS, PLOTS, isGrown } from './core.js?v=0.8.1';
import { drawCharacter } from './character.js?v=0.8.1';
export { drawCharacter } from './character.js?v=0.8.1';
import { CAST } from './cast.js?v=0.8.1';
import { drawDragon } from './dragon.js?v=0.8.1';
import { rowanPosition } from './settling.js?v=0.8.1';
export { tree as drawTree };
export const WORLD = { width: 832, height: 576 };
export const VILLAGE_BRIDGE = { x: 540, y: 292, w: 91, h: 51 };
export const BUILDINGS = [{ x: 112, y: 144, w: 96, h: 80, name: 'Your cottage', roof: '#ad6a52' }, { x: 320, y: 112, w: 96, h: 80, name: 'Mira’s stitches', roof: '#67778a' }, { x: 112, y: 352, w: 64, h: 64, name: 'The potting shed', roof: '#a77f4f' }];
const trees = [];
const hash = (x, y) => { let n = Math.imul(x + 37, 374761393) + Math.imul(y + 61, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return (n ^ n >>> 16) >>> 0; };
for (let y = 100; y < 550; y += 40) for (let x = 20; x < 820; x += 36) {
  const edge = x < 76 || x > 790 || y > 510 || y < 115;
  if (edge && hash(x, y) % 4 !== 0 && !(x > 260 && x < 340 && y > 500) && !(x > 640 && x < 770 && y < 130)) trees.push({ x: x + hash(y, x) % 11, y, size: 1 + hash(x, y) % 3 / 10 });
}
trees.push({ x: 497, y: 151, size: 1.3 }, { x: 110, y: 288, size: 1.2 }, { x: 370, y: 430, size: 1.15 }, { x: 519, y: 334, size: 1.1 }, { x: 673, y: 445, size: 1.2 }, { x: 766, y: 250, size: 1.1 });
export function riverX(y) { return 578 + Math.floor(Math.sin(y / 90) * 13); }
export function blocked(x, y, riverstep=false) {
  if (x < 22 || x > 810 || y < 120 || y > 545) return true;
  const bridge=VILLAGE_BRIDGE;
  const onDeck=x>=bridge.x&&x<=bridge.x+bridge.w&&y>=bridge.y+2&&y<=bridge.y+bridge.h-4;
  // Match the painted water, leaving the grassy bank free to walk on.
  if (!riverstep&&Math.abs(x - riverX(Math.floor(y/4)*4)) < 26 && !onDeck) return true;
  if (BUILDINGS.some(b => x > b.x - 5 && x < b.x + b.w + 5 && y > b.y + 20 && y < b.y + b.h + 2)) return true;
  if (trees.some(t => Math.abs(x - t.x) < 10 && Math.abs(y - t.y) < 7)) return true;
  // The shrine and well have physical bases, but are approachable from every side.
  if (x > 698 && x < 742 && y > 153 && y < 181) return true;
  if (x > 327 && x < 350 && y > 250 && y < 269) return true;
  return false;
}
function rect(c, x, y, w, h, colour) { c.fillStyle = colour; c.fillRect(Math.round(x), Math.round(y), w, h); }
function ellipse(c, x, y, rx, ry, colour) { c.fillStyle = colour; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function paintTree(c, t) {
  const { x, y } = t;
  const blossom=hash(x,y)%7===0;
  c.save();c.translate(Math.round(x),Math.round(y));
  // Stepped leaf clusters keep the outline organic without smoothing the pixels.
  const oval=(cx,cy,rx,ry,colour)=>{for(let row=-ry;row<=ry;row+=2){const half=Math.floor(Math.sqrt(Math.max(0,1-row*row/(ry*ry)))*rx/2)*2;rect(c,cx-half,cy+row,half*2,2,colour);}};
  ellipse(c,1,0,23,7,'#365e462b');rect(c,-5,-31,10,31,'#72584b');rect(c,-3,-28,4,28,'#ac8260');rect(c,1,-16,2,15,'#c39a6b');rect(c,-10,-23,8,4,'#72584b');rect(c,3,-29,9,4,'#72584b');
  const dark=blossom?'#ac7b83':'#42664e',mid=blossom?'#ce979e':'#648864',lit=blossom?'#e7b9ba':'#86a378',shine=blossom?'#f3d0c6':'#a4b687';
  oval(0,-33,28,22,dark);oval(-12,-37,17,15,dark);oval(13,-37,17,14,dark);oval(0,-49,19,13,dark);
  oval(-2,-36,26,19,mid);oval(-11,-41,17,14,lit);oval(5,-50,18,11,lit);oval(15,-35,13,12,mid);oval(0,-27,20,10,mid);
  for(let i=0;i<26;i++){const px=hash(x+i,y)%42-22,py=hash(x,y+i)%29-53;if(px*px/600+(py+38)*(py+38)/400<1){rect(c,px,py,4,2,i%3?lit:shine);if(i%4===0)rect(c,px+2,py-2,2,2,shine);}}
  rect(c,-16,-31,3,2,dark);rect(c,8,-24,4,2,dark);rect(c,-3,-20,4,2,dark);rect(c,16,-42,3,2,lit);
  if(blossom){for(const [px,py] of [[-18,-42],[8,-51],[-3,-31],[21,-34]]){rect(c,px,py,3,3,'#f9d8ca');rect(c,px+1,py+1,1,1,'#e4b98c');}rect(c,-16,3,2,1,'#e3b0b0');rect(c,13,5,2,1,'#e3b0b0');}
  c.restore();
}
// Cache detailed foliage once; the walking loop only blits the small sprites.
const treeCache = new Map();
function tree(c, t) {
  const key = `${t.x},${t.y}`;
  let sprite = treeCache.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas'); sprite.width = 68; sprite.height = 80;
    const brush = sprite.getContext('2d'); brush.translate(34-t.x,68-t.y);
    paintTree(brush,t); treeCache.set(key,sprite);
  }
  c.drawImage(sprite,Math.round(t.x)-34,Math.round(t.y)-68);
}
function house(c,b) {
  const { x, y, w, h } = b;
  rect(c,x-5,y+h-3,w+14,10,'#365b3e55'); rect(c,x,y+24,w,h-24,'#c1b28b'); rect(c,x+5,y+27,w-10,h-29,'#e2d1a4');
  rect(c,x,y+26,5,h-26,'#8a805f'); rect(c,x+w-5,y+25,5,h-25,'#8a805f'); rect(c,x,y+h-8,w,4,'#a19069');
  for(let j=0;j<4;j++) { const off=j*8; rect(c,x-8+off,y+24-j*8,w+16-off*2,9,b.roof); rect(c,x-8+off,y+30-j*8,w+16-off*2,2,'#543f3d66'); for(let k=0;k<8;k++)rect(c,x+off+k*12+(j%2)*5,y+26-j*8,1,4,'#e8b57a44'); }
  rect(c,x-9,y+33,w+18,4,'#5b5545'); rect(c,x+w-22,y-4,10,22,'#958875'); rect(c,x+w-24,y-6,14,4,'#c4b79b');
  const doorX=x+w/2-9; rect(c,doorX-3,y+h-31,24,32,'#8a7957');rect(c,doorX,y+h-29,18,29,'#5c6250');rect(c,doorX+3,y+h-26,12,21,'#74806a');rect(c,doorX+13,y+h-16,2,2,'#efc77d');rect(c,doorX-5,y+h,28,5,'#bcb298');
  for (const wx of [x+14,x+w-29]) { rect(c,wx-2,y+43,19,21,'#8e8060');rect(c,wx,y+45,15,15,'#6d9291');rect(c,wx+2,y+47,5,5,'#d9dfb1');rect(c,wx+6,y+45,2,15,'#c8b990');rect(c,wx,y+51,15,2,'#c8b990');rect(c,wx-3,y+62,22,4,'#8c6549'); for(let i=0;i<4;i++){rect(c,wx+i*4,y+60,3,3,'#7e9859');rect(c,wx+i*4,y+58,2,2,i%2?'#e7b57b':'#b8a2a3');} }
}
function flowers(c,x,y,colour) { rect(c,x,y-4,1,5,'#526f41');rect(c,x-2,y-6,5,3,colour);rect(c,x-1,y-7,3,5,colour);rect(c,x,y-5,1,1,'#f6dda0'); }
function drawKitchenGarden(c,state) {
  // Clods feather the turned earth into the lawn. The front lip stays visible at the gardener's feet.
  for(let x=238;x<323;x+=4){
    const edge=Math.min(x-238,322-x);
    const taper=Math.max(0,7-edge);
    const top=330+taper+hash(x,1)%3, bottom=362-taper-hash(x,2)%3;
    rect(c,x,top,4,bottom-top,'#97845e');
    rect(c,x,top+1,4,2,'#b49c72');
    rect(c,x,bottom-2,4,2,'#847a54');
  }
  for(const [i,{x,y}] of PLOTS.entries()){
    const plant=state.plots[i], damp=plant?.watered;
    const earth=damp?'#695848':'#9c7451', ridge=damp?'#897359':'#c49b72';
    rect(c,x-10,y-9,20,23,earth);
    rect(c,x-8,y-11,16,26,earth);
    for(let row=0;row<3;row++){
      const offset=(i+row)%3;
      rect(c,x-8+offset,y-7+row*8,12-offset,2,ridge);
      rect(c,x+4,y-6+row*8,4,1,ridge);
    }
    if(!plant)continue;
    // A second pair of cotyledons on the near side makes a tended row visible under the player.
    for(const [dx,dy] of [[-3,-2],[4,11]]){
      const sx=x+dx,sy=y+dy;
      if(isGrown(state,i)){
        rect(c,sx-3,sy-3,7,6,'#e8d9ac');rect(c,sx-2,sy+3,4,2,'#bdab83');
        rect(c,sx-2,sy-8,3,6,'#52794e');rect(c,sx-6,sy-10,5,4,'#8caf66');
        rect(c,sx+1,sy-12,5,5,'#6d9256');rect(c,sx+2,sy-12,3,1,'#c8d48e');
      }else{
        rect(c,sx,sy-2,2,4,'#496b43');rect(c,sx-4,sy-5,4,3,'#7ca455');
        rect(c,sx-4,sy-5,3,1,'#c2ce83');rect(c,sx+2,sy-6,4,4,'#a8bd67');
      }
    }
    if(damp){rect(c,x-8,y+11,4,1,'#acada0');rect(c,x-6,y+12,2,1,'#87928a');}
  }
  // Leave the front gate open where the lane meets the beds.
  for(const start of [216,300]){
    rect(c,start,372,44,3,'#aa9068');
    for(let x=start;x<start+45;x+=14){
      rect(c,x,368,4,12,'#ac956f');rect(c,x+1,366,2,2,'#d9bd88');rect(c,x,368,2,8,'#cfb387');
    }
  }
  for(const [x,y] of [[231,339],[236,358],[326,348],[330,362],[222,369]])flowers(c,x,y,'#dfc58e');
}
export function drawWorld(c, s, time, camera, companion = null, rowan = null, {showRowan = true} = {}) {
  c.save();c.translate(-camera.x,-camera.y);
  rect(c,0,0,832,576,'#95a97b');
  // The distant ridge is kept in the map, so it remains still when the camera follows you.
  rect(c,0,0,832,82,'#99b2a0');
  for(let x=0;x<832;x+=16){const peak=27+Math.floor(Math.sin(x/90)*16+Math.sin(x/34)*9);rect(c,x,peak,16,90-peak,'#6e8f79');rect(c,x,peak+19,16,84-peak,'#507762');}
  rect(c,0,87,832,19,'#456b4e');rect(c,0,106,832,12,'#5e8150');
  // Deterministic ground detail, without an image download or a large tileset.
  for(let y=120;y<576;y+=8)for(let x=0;x<832;x+=8){const n=hash(x,y); if(n%7===0)rect(c,x+n%5,y,3,1,'#b2bf8c');else if(n%11===0){rect(c,x,y,1,3,'#819c70');rect(c,x+2,y+1,1,2,'#819c70');}else if(n%97===0)flowers(c,x,y,'#c5b985');}
  const path=(x,y,w,h)=>{
    rect(c,x+3,y-2,w-6,h+4,'#adba8e');rect(c,x-2,y+3,w+4,h-6,'#adba8e');
    rect(c,x+3,y,w-6,h,'#d5c69e');rect(c,x,y+3,w,h-6,'#d5c69e');
    for(let py=y+3;py<y+h;py+=7)for(let px=x+3;px<x+w;px+=8)
      if(hash(px,py)%3===0)rect(c,px,py,3,1,'#c0ae87');
    for(let pos=5;pos<(w>h?w:h)-4;pos+=9){
      const side=hash(x+pos,y)%2;
      const px=w>h?x+pos:x+side*(w-2),py=w>h?y+side*(h-1):y+pos;
      rect(c,px,py,w>h?4:2,w>h?2:4,'#bcc198');
    }
  };
  path(146,227,46,44);path(161,256,389,29);path(268,182,33,254);path(280,232,100,30);path(358,196,28,47);path(285,296,327,28);path(628,296,94,28);path(700,192,29,130);
  // Small flower drifts along path edges make the village feel tended.
  for(const [bx,by] of [[207,251],[307,286],[480,287],[653,332],[92,244],[188,453]]){
    for(let i=0;i<9;i++){const px=bx+hash(bx+i,by)%24-12,py=by+hash(bx,by+i)%16-8;flowers(c,px,py,i%3===0?'#eed9c5':i%3===1?'#d7acc0':'#e8c998');}
  }
  path(278,436,24,98);
  if(s.chapter?.stage>=4&&s.chapter.stage<11){path(478,448,24,45);rect(c,487,466,3,22,'#806e50');rect(c,477,458,27,12,'#d1bd8c');rect(c,482,462,16,2,'#6f7653');}
  rect(c,312,490,3,22,'#806e50');rect(c,302,482,25,12,'#c9b487');rect(c,307,486,15,2,'#7c7654');
  if(!s.awakened){for(let i=0;i<4;i++){rect(c,277+i*7,501-i%2*3,4,17,'#54734c');rect(c,274+i*7,505-i%2*3,9,4,'#839d68');}}
  ellipse(c,452,215,15,9,'#b0b98a');
  drawKitchenGarden(c,s);
  // River banks, gently moving reflections and a wooden bridge.
  for(let y=100;y<576;y+=4){const rx=riverX(y);rect(c,rx-32,y,64,4,'#87a47c');rect(c,rx-26,y,52,4,'#5a8e92');rect(c,rx-21,y,42,4,'#83b1ad');rect(c,rx-23,y,3,4,'#b8bc89');if(hash(y,1)%3===0){const offset=Math.floor(time/700+y/8)%25;rect(c,rx-16+offset,y,11,1,'#c0d9c6');}}
  const bridge=VILLAGE_BRIDGE;
  path(bridge.x-15,bridge.y+2,19,bridge.h-4);path(bridge.x+bridge.w-1,bridge.y+2,24,bridge.h-4);
  // A broad landing on either bank keeps the return route easy to read.
  path(640,bridge.y+4,19,68);
  rect(c,bridge.x,bridge.y,bridge.w,bridge.h,'#614f3a');
  for(let x=bridge.x+1;x<bridge.x+bridge.w;x+=7){rect(c,x,bridge.y+2,6,bridge.h-4,'#c2a274');rect(c,x+1,bridge.y+3,4,2,'#ddbd87');}
  rect(c,bridge.x-3,bridge.y-2,bridge.w+7,3,'#a7875c');rect(c,bridge.x-3,bridge.y+bridge.h-3,bridge.w+7,3,'#8e704f');
  for(const x of [bridge.x,bridge.x+bridge.w-3]){rect(c,x,bridge.y-9,4,12,'#d6b884');rect(c,x,bridge.y+bridge.h-11,4,13,'#d6b884');}
  // Shrine: a mossed stone doorway and a little offering bowl.
  rect(c,686,179,67,8,'#b3b59a');rect(c,694,173,51,6,'#d2ceb1');rect(c,702,139,9,35,'#929d87');rect(c,730,139,9,35,'#929d87');rect(c,701,135,39,8,'#bbc1a5');rect(c,707,128,27,7,'#a6b399');rect(c,713,123,15,5,'#ced0ae');rect(c,714,148,13,20,s.awakened?'#e3b976':'#5b7970');rect(c,718,153,5,10,s.awakened?'#fff0b3':'#b0ba8c');rect(c,698,169,10,4,'#6c8b60');rect(c,732,136,8,4,'#799366');rect(c,711,185,20,4,'#7d8371');rect(c,713,182,16,4,'#bac1a2');
  // A small dragon-like silhouette in the ridge, increasingly visible after the offering.
  const glow=s.awakened?'#eccb89':'#789a79';rect(c,682,74,63,12,'#4c735d');rect(c,732,66,24,17,'#4c735d');rect(c,744,60,5,10,'#4c735d');rect(c,732,61,4,10,'#4c735d');rect(c,749,76,4,2,glow);rect(c,673,80,16,4,'#4c735d');
  // Well, signs, benches, crates, hedges and cottage garden.
  ellipse(c,338,263,16,7,'#506b4e66');rect(c,327,248,23,17,'#969b80');rect(c,330,249,17,5,'#3d5b51');rect(c,326,237,3,20,'#8b7855');rect(c,348,237,3,20,'#8b7855');rect(c,323,233,32,5,'#af8760');rect(c,327,229,24,4,'#ba9667');
  rect(c,429,274,3,16,'#796c4e');rect(c,416,269,29,12,'#cdbb8a');rect(c,421,273,17,2,'#7e785a');
  for(const [x,y] of [[444,240],[658,357]]){rect(c,x,y,30,4,'#bb9b6d');rect(c,x,y-7,30,5,'#cdb082');rect(c,x+3,y+4,3,5,'#78694d');rect(c,x+24,y+4,3,5,'#78694d');}
  for(const [x,y] of [[100,235],[212,231]]){rect(c,x,y,8,8,'#ac8061');rect(c,x-2,y-4,12,7,'#5b824d');flowers(c,x+4,y-2,'#dbb28f');}
  for(const [x,y] of [[192,389],[202,396]]){rect(c,x,y,10,10,'#a88d62');rect(c,x+2,y+2,6,6,'#94774f');rect(c,x+4,y,2,10,'#bea071');}
  for(const f of FLOWERS)if(!s.flowers.includes(f.id)){rect(c,f.x-4,f.y-5,9,1,'#f8e6ae');rect(c,f.x,f.y-9,1,9,'#f8e6ae');flowers(c,f.x,f.y,'#eee0a3');rect(c,f.x-4,f.y-4,2,2,'#eee0a3');rect(c,f.x+3,f.y-4,2,2,'#eee0a3');if(Math.sin(time/450+f.x)>0.7)rect(c,f.x+5,f.y-12,1,2,'#fff0bd');}
  const hatchlingVisible=s.chapter?.stage!==10;
  const rowanHere={...CAST.rowan,...(rowan||rowanPosition(s))};
  const sprites=[...trees.map(t=>({y:t.y,draw:()=>tree(c,t)})),...BUILDINGS.map(b=>({y:b.y+b.h,draw:()=>house(c,b)})),...[...(showRowan?[rowanHere]:[]),CAST.mira].map(person=>({y:person.y,draw:()=>drawCharacter(c,person.x,person.y,person.appearance,person.direction||'down',person.walk||0)})),...(s.dragonBonded&&hatchlingVisible?[{y:(companion?.y??s.y+12),draw:()=>drawDragon(c,companion?.x??s.x-18,companion?.y??s.y+12,{direction:s.direction,time:time/1000})}]:[]),{y:s.y,draw:()=>drawCharacter(c,s.x,s.y,s.appearance,s.direction,s.walk||0)}];
  sprites.sort((a,b)=>a.y-b.y).forEach(spr=>spr.draw());
  if(showRowan&&((s.metRowan&&!s.receivedSeeds)||s.chapter?.stage===3)&&(!rowan||rowan.arrived)) {
    // His own fishing spot, with the float in the water on the right.
    for(let i=0;i<13;i++)rect(c,rowanHere.x+5+i*2,rowanHere.y-18-i,2,1,'#8c7351');
    rect(c,rowanHere.x+30,rowanHere.y-30,1,27,'#d2cfac');rect(c,rowanHere.x+28,rowanHere.y-3,5,2,'#d6ac7b');
  }
  // Chimney smoke and butterflies are purely decorative.
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){for(const b of BUILDINGS){for(let i=0;i<3;i++){const phase=(time/90+i*10)%38;rect(c,b.x+b.w-17+Math.sin(phase/9)*3,b.y-10-phase,4+Math.floor(phase/10),3,'#e0deba40');}}for(let i=0;i<5;i++){const x=205+i*79+Math.sin(time/2400+i)*15,y=390+Math.sin(time/1800+i*5)*23;rect(c,x,y,Math.floor(time/150)%2?3:1,2,i%2?'#edc895':'#e8e7b6');}}
  // Evening is gentle: there is no time limit, exhaustion or forced bedtime.
  const shade=Math.max(0,(s.minutes-1050)/1200);if(shade){c.fillStyle=`rgba(33,43,77,${Math.min(shade,.25)})`;c.fillRect(0,0,832,576);}
  c.restore();
}
