import { PALETTES, FLOWERS, PLOTS, isGrown } from './core.js';
export const WORLD = { width: 832, height: 576 };
export const BUILDINGS = [{ x: 112, y: 144, w: 96, h: 80, name: 'Your cottage', roof: '#ad6a52' }, { x: 320, y: 112, w: 96, h: 80, name: 'Mira’s stitches', roof: '#67778a' }, { x: 112, y: 352, w: 64, h: 64, name: 'The potting shed', roof: '#a77f4f' }];
const trees = [];
const hash = (x, y) => { let n = Math.imul(x + 37, 374761393) + Math.imul(y + 61, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return (n ^ n >>> 16) >>> 0; };
for (let y = 100; y < 550; y += 40) for (let x = 20; x < 820; x += 36) {
  const edge = x < 76 || x > 790 || y > 510 || y < 115;
  if (edge && hash(x, y) % 4 !== 0 && !(x > 260 && x < 340 && y > 500) && !(x > 640 && x < 770 && y < 130)) trees.push({ x: x + hash(y, x) % 11, y, size: 1 + hash(x, y) % 3 / 10 });
}
trees.push({ x: 466, y: 159, size: 1.3 }, { x: 110, y: 288, size: 1.2 }, { x: 370, y: 430, size: 1.15 }, { x: 519, y: 334, size: 1.1 }, { x: 673, y: 445, size: 1.2 }, { x: 766, y: 250, size: 1.1 });
export function riverX(y) { return 578 + Math.floor(Math.sin(y / 90) * 13); }
export function blocked(x, y) {
  if (x < 22 || x > 810 || y < 120 || y > 545) return true;
  if (Math.abs(x - riverX(y)) < 30 && !(y > 299 && y < 326)) return true;
  if (BUILDINGS.some(b => x > b.x - 5 && x < b.x + b.w + 5 && y > b.y + 20 && y < b.y + b.h + 2)) return true;
  if (trees.some(t => Math.abs(x - t.x) < 10 && Math.abs(y - t.y) < 7)) return true;
  // The shrine and well have physical bases, but are approachable from every side.
  if (x > 698 && x < 742 && y > 153 && y < 181) return true;
  if (x > 327 && x < 350 && y > 250 && y < 269) return true;
  return false;
}
function rect(c, x, y, w, h, colour) { c.fillStyle = colour; c.fillRect(Math.round(x), Math.round(y), w, h); }
function ellipse(c, x, y, rx, ry, colour) { c.fillStyle = colour; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function tree(c, t) {
  const { x, y } = t, s = t.size;
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s);
  ellipse(c, 0, 1, 20, 6, '#385d3b60'); rect(c, -4, -25, 8, 26, '#72513b'); rect(c, 0, -22, 3, 22, '#997049');
  const rows = [[-14,-55,28,9],[-23,-46,44,12],[-27,-34,53,13],[-21,-21,42,9]];
  rows.forEach(([a,b,w,h]) => rect(c,a,b,w,h,'#2e5b43'));
  rect(c,-12,-54,20,5,'#7d9e59'); rect(c,-21,-45,32,7,'#5b864c'); rect(c,-23,-33,30,8,'#487947'); rect(c,-17,-20,24,4,'#446d42'); rect(c,13,-39,5,5,'#426c42'); rect(c,3,-49,4,3,'#99aa65'); rect(c,-18,-28,3,3,'#8ea05b');
  c.restore();
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
export function drawCharacter(c, x, y, a, direction='down', step=0, scale=1) {
  const skin=PALETTES.skin[a.skin], hair=PALETTES.hair[a.hair], cloth=PALETTES.colour[a.colour];
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
  ellipse(c,0,0,7,2,'#233f3a55');
  const walk=step ? Math.sin(step)*1.5 : 0, side=direction==='left'||direction==='right', back=direction==='up';
  rect(c,-5,-7+walk,4,7,'#574c3c');rect(c,1,-7-walk,4,7,'#574c3c');rect(c,-5,-2+walk,4,2,'#353d36');rect(c,1,-2-walk,5,2,'#353d36');
  if(a.hairStyle===2)rect(c,-7,-23,14,18,hair);
  rect(c,-6,-15,12,10,cloth);rect(c,-8,-14,3,7,cloth);rect(c,5,-14,3,7,cloth);rect(c,-8,-7,3,3,skin);rect(c,5,-7,3,3,skin);
  if(a.outfit===0){rect(c,-3,-11,6,7,'#b9bda0');rect(c,-4,-15,2,7,'#c7c9aa');rect(c,2,-15,2,7,'#c7c9aa');rect(c,-2,-9,4,3,'#8b9b83');}
  if(a.outfit===1){rect(c,-6,-7,12,2,'#bda77a');rect(c,-1,-7,2,3,'#e9cf8f');}
  if(a.outfit===2){rect(c,-7,-7,14,3,cloth);rect(c,-8,-4,16,2,cloth);rect(c,-5,-12,10,1,'#e6d7aa');}
  rect(c,-6,-24,12,10,skin);rect(c,-7,-21,1,5,skin);rect(c,6,-21,1,5,skin);rect(c,-4,-14,8,1,skin);
  rect(c,-6,-25,12,4,hair);rect(c,-7,-23,2,a.hairStyle===1?4:8,hair);rect(c,5,-23,2,a.hairStyle===1?4:8,hair);
  if(a.hairStyle===0){rect(c,-6,-22,5,2,hair);rect(c,3,-22,3,3,hair);rect(c,-7,-18,2,5,hair);rect(c,5,-18,2,5,hair);}
  if(a.hairStyle===3){rect(c,-8,-24,16,5,hair);rect(c,-8,-20,3,7,hair);rect(c,5,-20,3,7,hair);rect(c,-5,-27,10,3,hair);}
  if(back){rect(c,-6,-23,12,a.hairStyle===1?7:10,hair);} else {if(side){rect(c,direction==='right'?3:-4,-20,2,2,'#303b35');rect(c,direction==='right'?5:-6,-18,2,2,skin);}else {rect(c,-4,-20,2,2,'#303b35');rect(c,2,-20,2,2,'#303b35');rect(c,-1,-16,2,1,'#a16d59');}}
  if(a.accessory===1){rect(c,-6,-15,12,2,'#dfb06b');rect(c,3,-13,3,6,'#dfb06b');}
  if(a.accessory===2){rect(c,-10,-24,20,3,'#dbbd7f');rect(c,-6,-30,12,7,'#e6cc91');rect(c,-6,-25,12,2,'#9f7e59');}
  c.restore();
}
function flowers(c,x,y,colour) { rect(c,x,y-4,1,5,'#526f41');rect(c,x-2,y-6,5,3,colour);rect(c,x-1,y-7,3,5,colour);rect(c,x,y-5,1,1,'#f6dda0'); }
export function drawWorld(c, s, time, camera) {
  c.save();c.translate(-camera.x,-camera.y);
  rect(c,0,0,832,576,'#809960');
  // The distant ridge is kept in the map, so it remains still when the camera follows you.
  rect(c,0,0,832,82,'#99b2a0');
  for(let x=0;x<832;x+=16){const peak=27+Math.floor(Math.sin(x/90)*16+Math.sin(x/34)*9);rect(c,x,peak,16,90-peak,'#6e8f79');rect(c,x,peak+19,16,84-peak,'#507762');}
  rect(c,0,87,832,19,'#456b4e');rect(c,0,106,832,12,'#5e8150');
  // Deterministic ground detail, without an image download or a large tileset.
  for(let y=120;y<576;y+=8)for(let x=0;x<832;x+=8){const n=hash(x,y); if(n%7===0)rect(c,x+n%5,y,3,1,'#a3b370');else if(n%11===0){rect(c,x,y,1,3,'#668d54');rect(c,x+2,y+1,1,2,'#668d54');}else if(n%97===0)flowers(c,x,y,'#c5b985');}
  const path=(x,y,w,h)=>{rect(c,x-2,y-2,w+4,h+4,'#94a266');rect(c,x,y,w,h,'#c3b68a');for(let py=y+3;py<y+h;py+=7)for(let px=x+3;px<x+w;px+=8)if(hash(px,py)%3===0)rect(c,px,py,3,1,'#ae9f76');};
  path(146,227,46,44);path(161,256,389,29);path(268,182,33,254);path(280,232,100,30);path(358,196,28,47);path(285,296,327,28);path(628,296,94,28);path(700,192,29,130);
  // Garden fence and the beds.
  rect(c,220,322,116,55,'#8a9860');
  for(let x=216;x<=340;x+=12){rect(c,x,367,3,14,'#b9ab7d');rect(c,x,369,3,2,'#e1c99c');}rect(c,216,372,127,3,'#b5a376');
  for(let i=0;i<3;i++){const p=PLOTS[i];rect(c,p.x-9,p.y-5,19,18,'#6c5037');rect(c,p.x-8,p.y-3,17,2,'#8c6948');rect(c,p.x-8,p.y+4,17,2,'#8c6948');if(s.plots[i]){if(s.plots[i].watered)rect(c,p.x-8,p.y+9,17,3,'#534b35');if(isGrown(s,i)){rect(c,p.x-2,p.y-9,5,13,'#d5d4af');rect(c,p.x-5,p.y-10,5,4,'#65935c');rect(c,p.x+1,p.y-13,5,4,'#9dbb73');rect(c,p.x-2,p.y-7,5,3,'#ecdebe');}else{rect(c,p.x,p.y-2,2,7,'#527d4a');rect(c,p.x-3,p.y-3,4,3,'#b0bf77');rect(c,p.x+1,p.y-5,4,3,'#95b56a');}}}
  // River banks, gently moving reflections and a wooden bridge.
  for(let y=100;y<576;y+=4){const rx=riverX(y);rect(c,rx-32,y,64,4,'#5d815f');rect(c,rx-26,y,52,4,'#487e80');rect(c,rx-21,y,42,4,'#649b99');rect(c,rx-23,y,3,4,'#b8bc89');if(hash(y,1)%3===0){const offset=Math.floor(time/700+y/8)%25;rect(c,rx-16+offset,y,11,1,'#acd0bb');}}
  rect(c,540,298,91,31,'#614f3a');for(let x=541;x<631;x+=7){rect(c,x,300,6,27,'#c2a274');rect(c,x+1,301,4,2,'#ddbd87');}rect(c,537,296,98,3,'#a7875c');rect(c,537,325,98,3,'#8e704f');for(const x of [540,628]){rect(c,x,289,4,12,'#d6b884');rect(c,x,318,4,13,'#d6b884');}
  // Shrine: a mossed stone doorway and a little offering bowl.
  rect(c,686,179,67,8,'#b3b59a');rect(c,694,173,51,6,'#d2ceb1');rect(c,702,139,9,35,'#929d87');rect(c,730,139,9,35,'#929d87');rect(c,701,135,39,8,'#bbc1a5');rect(c,707,128,27,7,'#a6b399');rect(c,713,123,15,5,'#ced0ae');rect(c,714,148,13,20,s.awakened?'#e3b976':'#5b7970');rect(c,718,153,5,10,s.awakened?'#fff0b3':'#b0ba8c');rect(c,698,169,10,4,'#6c8b60');rect(c,732,136,8,4,'#799366');rect(c,711,185,20,4,'#7d8371');rect(c,713,182,16,4,'#bac1a2');
  // A small dragon-like silhouette in the ridge, increasingly visible after the offering.
  const glow=s.awakened?'#eccb89':'#789a79';rect(c,682,74,63,12,'#4c735d');rect(c,732,66,24,17,'#4c735d');rect(c,744,60,5,10,'#4c735d');rect(c,732,61,4,10,'#4c735d');rect(c,749,76,4,2,glow);rect(c,673,80,16,4,'#4c735d');
  // Well, signs, benches, crates, hedges and cottage garden.
  ellipse(c,338,263,16,7,'#506b4e66');rect(c,327,248,23,17,'#969b80');rect(c,330,249,17,5,'#3d5b51');rect(c,326,237,3,20,'#8b7855');rect(c,348,237,3,20,'#8b7855');rect(c,323,233,32,5,'#af8760');rect(c,327,229,24,4,'#ba9667');
  rect(c,429,274,3,16,'#796c4e');rect(c,416,269,29,12,'#cdbb8a');rect(c,421,273,17,2,'#7e785a');
  for(const [x,y] of [[444,240],[658,357]]){rect(c,x,y,30,4,'#bb9b6d');rect(c,x,y-7,30,5,'#cdb082');rect(c,x+3,y+4,3,5,'#78694d');rect(c,x+24,y+4,3,5,'#78694d');}
  for(const [x,y] of [[100,235],[212,231],[314,202],[419,195]]){rect(c,x,y,8,8,'#ac8061');rect(c,x-2,y-4,12,7,'#5b824d');flowers(c,x+4,y-2,'#dbb28f');}
  for(const [x,y] of [[192,389],[202,396]]){rect(c,x,y,10,10,'#a88d62');rect(c,x+2,y+2,6,6,'#94774f');rect(c,x+4,y,2,10,'#bea071');}
  for(const f of FLOWERS)if(!s.flowers.includes(f.id)){flowers(c,f.x,f.y,'#eee0a3');rect(c,f.x-4,f.y-4,2,2,'#eee0a3');rect(c,f.x+3,f.y-4,2,2,'#eee0a3');if(Math.sin(time/450+f.x)>0.7)rect(c,f.x+5,f.y-12,1,2,'#fff0bd');}
  const sprites=[...trees.map(t=>({y:t.y,draw:()=>tree(c,t)})),...BUILDINGS.map(b=>({y:b.y+b.h,draw:()=>house(c,b)})),{y:311,draw:()=>drawCharacter(c,236,311,{skin:2,hair:4,colour:1,hairStyle:1,outfit:1,accessory:2})},{y:222,draw:()=>drawCharacter(c,402,222,{skin:3,hair:3,colour:3,hairStyle:3,outfit:2,accessory:1})},{y:s.y,draw:()=>drawCharacter(c,s.x,s.y,s.appearance,s.direction,s.walk||0)}];
  sprites.sort((a,b)=>a.y-b.y).forEach(spr=>spr.draw());
  // Chimney smoke and butterflies are purely decorative.
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){for(const b of BUILDINGS){for(let i=0;i<3;i++){const phase=(time/90+i*10)%38;rect(c,b.x+b.w-17+Math.sin(phase/9)*3,b.y-10-phase,4+Math.floor(phase/10),3,'#e0deba40');}}for(let i=0;i<5;i++){const x=205+i*79+Math.sin(time/2400+i)*15,y=390+Math.sin(time/1800+i*5)*23;rect(c,x,y,Math.floor(time/150)%2?3:1,2,i%2?'#edc895':'#e8e7b6');}}
  // Evening is gentle: there is no time limit, exhaustion or forced bedtime.
  const shade=Math.max(0,(s.minutes-1050)/1200);if(shade){c.fillStyle=`rgba(33,43,77,${Math.min(shade,.25)})`;c.fillRect(0,0,832,576);}
  c.restore();
}
