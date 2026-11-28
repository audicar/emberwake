import { drawCharacter, drawTree } from './art.js?v=0.8.0';
import { drawDragon } from './dragon.js?v=0.8.0';
import { CAST } from './cast.js?v=0.8.0';
import { CHAPTER_TREES, ANCHORS } from './chapter.js?v=0.8.0';
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const ground=new Map();
function path(c,x,y,w,h){r(c,x-2,y-2,w+4,h+4,'#9eaf84');r(c,x,y,w,h,'#c4bd97');for(let yy=y+4;yy<y+h;yy+=9)for(let xx=x+5;xx<x+w;xx+=14)if((xx+yy)%3)r(c,xx,yy,3,1,'#aea37d');}
function ring(c,x,y,radius,colour){for(let i=0;i<48;i++){const a=i/48*Math.PI*2;r(c,x+Math.cos(a)*radius,y+Math.sin(a)*radius,3,2,colour);}}
function terrain(region){
  if(ground.has(region))return ground.get(region);
  const canvas=document.createElement('canvas');canvas.width=832;canvas.height=576;const c=canvas.getContext('2d');
  r(c,0,0,832,576,region==='mill'?'#8ba17e':'#89a47f');r(c,0,0,832,112,'#a6bdb0');
  for(let x=0;x<832;x+=12){const y=33+Math.round(Math.sin(x/65)*13+Math.sin(x/31)*7);r(c,x,y,12,80-y,'#72947e');r(c,x,y+25,12,88-y,'#52785f');}
  r(c,0,100,832,18,'#668b65');
  for(let y=120;y<570;y+=7)for(let x=30;x<810;x+=9){const n=(x*17+y*29)%71;if(n<9)r(c,x,y,3,1,'#aabb8c');if(n===18){r(c,x,y,1,4,'#628659');r(c,x-2,y-2,5,2,'#e7c6bb');}}
  if(region==='trail') {
    for(const q of [[82,390,28,132],[96,388,208,28],[278,237,28,180],[290,236,213,28],[478,250,28,204],[490,428,224,28],[688,168,28,272],[700,168,48,26]])path(c,...q);
    for(const [x,y,w] of [[140,318,76],[535,305,53]]){r(c,x,y,w,20,'#765e46');r(c,x+3,y+2,w-6,4,'#ae9167');r(c,x+8,y+6,w-16,2,'#8e7351');}
    // A recognisable old picnic table, tucked away from the walking route.
    r(c,222,366,43,9,'#b39166');r(c,226,375,4,18,'#725b45');r(c,256,375,4,18,'#725b45');r(c,219,384,49,4,'#ad8d62');
    for(let i=0;i<8;i++){r(c,284+i%2*9,285+i*5,3,7,'#887b62');r(c,285+i%2*9,285+i*5,1,7,'#c5b490');}
    for(const [x,y] of [[566,427],[574,435],[581,430]]){r(c,x,y,2,10,'#617b7d');r(c,x-2,y,6,2,'#bcc3b2');}
    for(let i=0;i<12;i++)r(c,693+i%4*3,315+Math.floor(i/4)*3,3,2,'#b8a175');
    r(c,431,235,24,9,'#a1a78c');r(c,436,231,16,4,'#c1c4a4');
    r(c,465,237,49,10,'#879a85');r(c,470,232,39,6,'#bac2a2');
    lantern(c,96,490);sign(c,735,162);
  } else if(region==='mill') {
    for(const q of [[82,382,28,140],[96,383,336,29],[256,225,28,178],[270,224,170,27],[408,239,28,177],[420,410,303,28],[696,212,28,216],[500,426,28,63],[510,477,124,23]])path(c,...q);
    // The race runs beside the building; its lower footbridge is the eastern route.
    r(c,646,118,38,264,'#6f998d');r(c,651,118,28,264,'#77a8ad');r(c,655,118,20,264,'#a0c6c0');
    r(c,643,382,43,35,'#6b5941');for(let x=644;x<687;x+=6){r(c,x,384,5,31,'#c0a173');r(c,x,384,4,2,'#e0c192');}
    mill(c);lantern(c,96,490);
    // Brake: a red handle, rope drum and low timber frame, approachable from the west.
    r(c,415,347,36,8,'#806246');r(c,418,355,4,20,'#806246');r(c,444,355,4,20,'#806246');
    r(c,425,338,14,18,'#baa17b');r(c,428,340,8,15,'#8c7354');r(c,430,330,3,19,'#7b6550');r(c,426,329,12,4,'#b87d6d');
    r(c,451,194,20,29,'#738d88');r(c,454,190,14,6,'#b2c3ad');r(c,458,198,6,17,'#80b7bd');
    for(const [x,y] of [[407,448],[425,449]]){r(c,x,y,16,15,'#8e7151');r(c,x+2,y+2,12,2,'#c6aa7d');r(c,x+7,y+1,2,13,'#b4966b');}r(c,413,443,18,9,'#ead9b7');r(c,416,446,11,1,'#8d8264');
    r(c,736,349,4,24,'#ab936d');r(c,749,349,4,24,'#ab936d');for(let y=352;y<372;y+=6)r(c,738,y,13,2,'#c4ae82');
    for(const a of ANCHORS){r(c,a.x-9,a.y-8,19,16,'#72857b');r(c,a.x-7,a.y-10,15,4,'#bac2a0');r(c,a.x-3,a.y-7,6,9,'#4a5d56');}
  } else {
    path(c,81,415,284,29);path(c,443,415,287,29);
    r(c,382,116,58,430,'#658d82');r(c,389,116,44,430,'#72a3aa');r(c,395,116,31,430,'#9bc2bd');r(c,386,116,4,430,'#c4c49b');
    for(const x of [362,444]){r(c,x,419,20,19,'#879b8a');r(c,x+3,419,14,3,'#cad2b4');r(c,x+7,426,6,2,'#b9e6d4');}
    for(let i=0;i<3;i++){r(c,449-i*4,427+i*3,3,2,'#d0e7c7');r(c,449-i*4,427-i*3,3,2,'#d0e7c7');}
    r(c,320,432,35,8,'#8e9b85');r(c,325,427,25,5,'#bac2a3');lantern(c,96,416);
  }
  ground.set(region,canvas);return canvas;
}
function sign(c,x,y){r(c,x,y,3,23,'#7d674b');r(c,x-12,y,29,13,'#cdbb8b');r(c,x-8,y+4,18,2,'#7b795b');}
function lantern(c,x,y){r(c,x+8,y-5,3,24,'#80664c');r(c,x+3,y-12,13,13,'#9e8c61');r(c,x+5,y-10,9,8,'#f0d5a0');r(c,x+7,y-9,4,5,'#fff1bd');}
function mill(c){
  r(c,476,166,166,106,'#75644e');r(c,482,169,154,98,'#c9b991');
  for(const x of [482,516,595,631])r(c,x,170,5,97,'#80674d');for(const y of [191,224,258])r(c,482,y,154,5,'#947553');
  for(let i=0;i<6;i++){const off=i*12;r(c,466+off,168-i*7,184-off*2,8,i%2?'#708178':'#7e8d7e');r(c,470+off,174-i*7,177-off*2,2,'#4b625a');}
  r(c,544,224,34,43,'#77684c');r(c,548,228,26,39,'#5e7261');r(c,566,245,3,3,'#dcc18a');
  for(const x of [492,600]){r(c,x,195,25,26,'#7c7455');r(c,x+3,198,19,20,'#82a6a0');r(c,x+11,198,2,20,'#d6c59e');r(c,x+3,207,19,2,'#d6c59e');}
  r(c,641,230,11,9,'#7a6246');
}
function wheel(c,time,held){
  const cx=660,cy=273,phase=held?0:time*.3;
  ring(c,cx,cy,44,'#6a533d');ring(c,cx,cy,38,'#b18e62');
  for(let i=0;i<10;i++){const a=i*Math.PI/5+phase;for(let n=4;n<40;n+=3)r(c,cx+Math.cos(a)*n,cy+Math.sin(a)*n,3,3,'#ac8b60');r(c,cx+Math.cos(a)*43-5,cy+Math.sin(a)*43-3,10,6,'#cfb081');}
  r(c,cx-6,cy-6,13,13,'#796043');r(c,cx-3,cy-3,7,7,'#d3b783');
}
function bramble(c,e){
  if(e.hp<=0)return;r(c,e.x-8,e.y-14,16,13,'#426a51');r(c,e.x-6,e.y-18,12,16,e.flash?'#e8d5a1':'#85a477');r(c,e.x-11,e.y-11,5,6,'#67865e');r(c,e.x+6,e.y-11,5,6,'#67865e');
  for(const dx of [-4,3]){r(c,e.x+dx,e.y-12,3,3,'#e8c986');r(c,e.x+dx+1,e.y-12,1,3,'#3e4c3e');}r(c,e.x-8,e.y-26,16,2,'#2e4c3c');r(c,e.x-7,e.y-26,14*e.hp/3,1,'#d5be83');
}
export function drawMillChapter(c,chapter,state,time,camera,map=false){
  const region=chapter.region,s=state.chapter,p=chapter.player;
  c.save();c.translate(-camera.x,-camera.y);c.drawImage(terrain(region),0,0);
  if(region==='mill'){
    wheel(c,chapter.time,s.brake);
    if(s.stage<7)for(let i=0;i<3;i++)if(s.anchors[i]>0){const a=ANCHORS[i];for(let j=0;j<40;j++){const f=j/40;r(c,a.x+(570-a.x)*f,a.y+(320-a.y)*f,4,3,i===2?'#865e7d':'#52674c');if(j%7===0)r(c,a.x+(570-a.x)*f-3,a.y+(320-a.y)*f-3,7,2,'#a4ae7e');}}
    if(s.brake&&s.stage<7&&!map)for(let i=0;i<3;i++)if(s.anchors[i]>0){const a=ANCHORS[i];r(c,a.x-10,a.y-23,21,6,'#2b4036');for(let n=0;n<3;n++)r(c,a.x-8+n*6,a.y-21,4,2,n<s.anchors[i]?'#edcf92':'#647d68');}
    if(chapter.sweep.phase==='warning'&&!map)ring(c,570,330,85,'#edbc84');
    for(const e of chapter.enemies)if(e.hp>0&&e.phase==='windup'&&!map)ring(c,e.x,e.y,33,'#e8b286');
  }
  const sprites=CHAPTER_TREES.map(t=>({y:t.y,draw:()=>drawTree(c,t)}));
  if(region==='mill'){
    for(const e of chapter.enemies)sprites.push({y:e.y,draw:()=>bramble(c,e)});
    sprites.push({y:330,draw:()=>{drawDragon(c,570,330,{river:true,scale:2.4,time:chapter.time,calm:s.stage>=7});if(s.stage<7){r(c,549,298,42,5,'#725a72');r(c,563,294,7,13,'#c2a5b4');}}});
  }
  if(region==='trail'&&s.stage>=7)sprites.push({y:250,draw:()=>drawDragon(c,490,250,{green:true,scale:2,time:chapter.time})});
  if(region==='return')sprites.push({y:240,draw:()=>drawDragon(c,650,225-Math.sin(chapter.time)*6,{river:true,scale:1.6,direction:'right',time:chapter.time})});
  const rowan=chapter.rowan;sprites.push({y:rowan.y,draw:()=>{drawCharacter(c,rowan.x,rowan.y,CAST.rowan.appearance,rowan.direction,rowan.walk);if(region==='mill'&&s.brake){r(c,rowan.x-5,rowan.y-16,4,5,'#c69b7b');for(let i=0;i<20;i++)r(c,431+i*10,349-i%2,9,1,'#b9a67a');}}});
  if(chapter.hatchlingPresent)sprites.push({y:chapter.companion.y,draw:()=>{if(chapter.glide){const f=Math.min(1,Math.max(0,(chapter.glide.time-.5)/3));drawDragon(c,440+(p.x-440)*f,244+(p.y-18-244)*f-Math.sin(f*Math.PI)*26,{direction:'right',time:time/1000});}else drawDragon(c,chapter.companion.x,chapter.companion.y,{direction:chapter.companion.direction,time:chapter.time});}});
  if(chapter.flight&&chapter.flight.time<5){const f=chapter.flight;sprites.push({y:f.y-f.time*45,draw:()=>drawDragon(c,f.x+f.time*60,f.y-f.time*45,{direction:'right',time:chapter.time})});}
  sprites.push({y:p.y,draw:()=>{if(p.invulnerable>0&&!map&&Math.floor(chapter.time*14)%2)c.globalAlpha=.6;drawCharacter(c,p.x,p.y,state.appearance,p.direction,p.walk);c.globalAlpha=1;
    if(chapter.swing&&!map){const o={up:[0,-34],down:[0,7],left:[-24,-14],right:[24,-14]},[dx,dy]=o[chapter.swing.direction];for(let i=-2;i<=2;i++)r(c,p.x+dx+(dx?Math.abs(i)*2:i*5),p.y+dy+(dx?i*4:Math.abs(i)*2),dx?3:4,dx?4:3,'#f1dca8');}
  }});
  sprites.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
  if(!map){for(const b of chapter.projectiles){r(c,b.x-3,b.y-3,7,6,'#db9d76');r(c,b.x-1,b.y-2,4,4,'#ffe0a5');}for(const e of chapter.effects)if(e.kind==='ripple')ring(c,e.x,e.y,8+(1-e.life/.25)*10,'#c2e6d5');else if(e.kind==='sweep')ring(c,e.x,e.y,85,'#f1d2a1');else for(let i=0;i<6;i++)r(c,e.x+Math.cos(i)*(.4-e.life)*45,e.y+Math.sin(i)*(.4-e.life)*45,3,3,'#cad5a2');}
  c.restore();
}
