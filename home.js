import { drawCharacter } from './character.js?v=0.4.3';
import { drawDragon } from './dragon.js?v=0.4.3';

export const HOME_ENTRY = { x: 416, y: 463 };
export const HOME_START = { x: 445, y: 379 };
export const HOME_BED = { x: 555, y: 328 };
// Shared floor footprints keep solid furniture and its interactions together.
const bed = { x: 520, y: 215, w: 70, h: 96 };
const wardrobe = { x: 236, y: 226, w: 64, h: 45 };
const kitchen = { x: 323, y: 222, w: 82, h: 23 };
const bookcase = { x: 236, y: 332, w: 43, h: 43 };
const table = { x: 351, y: 350, w: 74, h: 39 };
const chair = { x: 371, y: 402, w: 30, h: 27 };
const plant = { x: 565, y: 423, w: 23, h: 22 };
const furniture = [bed, wardrobe, kitchen, bookcase, table, chair, plant];
export function homeBlocked(x,y) {
  return x<226||x>606||y<229||y>478||furniture.some(o=>x>o.x-5&&x<o.x+o.w+5&&y>o.y-3&&y<o.y+o.h+3);
}
function distanceTo(actor,target) {
  const dx=Math.max(target.x-actor.x,0,actor.x-target.x-(target.w||0));
  const dy=Math.max(target.y-actor.y,0,actor.y-target.y-(target.h||0));
  return Math.hypot(dx,dy);
}
export function homeInteraction(actor) {
  const targets=[
    {...bed,type:'bed',label:'Rest in your bed',reach:22},
    {x:416,y:474,type:'exit',label:'Step outside',reach:34},
    {...wardrobe,type:'wardrobe',label:'Open your wardrobe',reach:22},
    {...kitchen,type:'kettle',label:'Put the kettle on',reach:22},
    {...bookcase,type:'books',label:'Browse Wren’s books',reach:22},
    {...table,type:'notes',label:'Read Wren’s note',reach:22},
  ];
  return targets.map(t=>({...t,distance:distanceTo(actor,t)})).filter(t=>t.distance<t.reach).sort((a,b)=>a.distance-b.distance)[0];
}
let room;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
function drawWardrobe(c) {
  const {x,y,w,h}=wardrobe,top=y-46;
  r(c,x-3,top-4,w+6,6,'#6e5141');r(c,x,top,w,h+42,'#785944');
  r(c,x+4,top+4,w-8,h+33,'#b68c61');r(c,x+7,top+8,23,66,'#caa575');r(c,x+34,top+8,23,66,'#caa575');
  for(const dx of [7,34]){r(c,x+dx+3,top+12,17,25,'#b38d63');r(c,x+dx+4,top+13,15,23,'#d0ae7e');r(c,x+dx+3,top+44,17,25,'#b38d63');r(c,x+dx+4,top+45,15,23,'#c4a073');}
  r(c,x+31,top+5,2,72,'#785944');r(c,x+26,top+39,2,8,'#f0cb83');r(c,x+36,top+39,2,8,'#f0cb83');
  r(c,x-2,y+h-8,w+4,5,'#785944');r(c,x+3,y+h-3,6,5,'#614c3d');r(c,x+w-9,y+h-3,6,5,'#614c3d');
}
function drawKitchen(c) {
  const {x,y,w,h}=kitchen;
  r(c,x-2,y-9,w+4,6,'#e5d5b1');r(c,x,y-3,w,h+3,'#86684d');
  for(const dx of [4,42]){r(c,x+dx,y+1,34,17,'#bb986b');r(c,x+dx+4,y+5,26,1,'#cfad7d');r(c,x+dx+25,y+8,3,2,'#705e49');}
  // Round kettle, lid, spout and open handle on the counter.
  r(c,x+30,y-22,18,12,'#59817b');r(c,x+33,y-25,12,4,'#8eaaa0');r(c,x+37,y-28,4,3,'#e1cda1');
  r(c,x+28,y-21,4,3,'#6a9790');r(c,x+25,y-23,4,3,'#6a9790');r(c,x+48,y-22,6,10,'#476c67');r(c,x+49,y-20,3,6,'#c6ba96');
  r(c,x+33,y-20,3,7,'#a2bbaa');r(c,x+63,y-13,8,5,'#eee0bd');r(c,x+70,y-12,3,3,'#d2c39e');
}
function drawBookcase(c) {
  const {x,y,w,h}=bookcase,top=y-46;
  r(c,x-2,top-3,w+4,5,'#6c5140');r(c,x,top,w,h+44,'#715540');r(c,x+4,top+4,w-8,h+32,'#4d4939');
  const colours=['#9cae91','#b88976','#c9b183','#819b99','#a299af'];
  for(const [row,shelfY] of [top+24,top+49,top+74].entries()) {
    for(let i=0;i<6;i++){const bx=x+6+i*5,height=12+(i+row)%3*3;r(c,bx,shelfY-height,4,height,colours[(i+row)%colours.length]);r(c,bx+1,shelfY-height+3,2,1,'#dfcca7');}
    r(c,x+3,shelfY,w-6,4,'#bb9468');
  }
  r(c,x-1,y+h-5,w+2,5,'#6c5140');r(c,x+2,y+h,5,3,'#614c3d');r(c,x+w-7,y+h,5,3,'#614c3d');
}
function drawBed(c) {
  const {x,y,w,h}=bed;
  r(c,x-2,y-13,w+4,8,'#785b44');r(c,x+2,y-17,w-4,5,'#b28e65');r(c,x,y-5,w,h+5,'#85654a');
  r(c,x+5,y,w-10,h-7,'#e5d7b7');r(c,x+9,y+4,w-18,18,'#f8ebcf');r(c,x+12,y+6,w-24,12,'#fff2d9');
  r(c,x+5,y+26,w-10,h-32,'#86a391');r(c,x+8,y+29,w-16,h-38,'#a6b7a1');r(c,x+12,y+29,5,h-38,'#dfd4b2');r(c,x+w-17,y+29,5,h-38,'#dfd4b2');
  for(const [dx,dy] of [[28,42],[43,57],[28,73],[43,42]]){r(c,x+dx,y+dy,4,4,'#eee0bf');r(c,x+dx+1,y+dy+1,2,2,'#cdb58b');}
  r(c,x-2,y+h-3,w+4,6,'#785b44');r(c,x+2,y+h+3,5,5,'#674f3d');r(c,x+w-7,y+h+3,5,5,'#674f3d');
}
function drawTable(c) {
  const {x,y,w,h}=table;
  r(c,x+4,y+6,5,h-5,'#70523e');r(c,x+w-9,y+6,5,h-5,'#70523e');r(c,x+6,y+h-3,w-12,3,'#836348');
  r(c,x-2,y-10,w+4,31,'#75573f');r(c,x,y-12,w,28,'#c19b6c');r(c,x+4,y-8,w-8,1,'#d4b483');r(c,x+4,y+8,w-8,1,'#a98358');
  r(c,x+14,y-5,27,16,'#f4e6c6');r(c,x+17,y-1,19,1,'#ac9774');r(c,x+17,y+2,14,1,'#ac9774');r(c,x+33,y+6,4,3,'#bb7f6d');
  r(c,x+53,y-2,9,9,'#79988a');r(c,x+55,y-1,5,3,'#d8c9a4');r(c,x+62,y+1,3,4,'#92ab98');
  // Slatted chair, with clear passages on both sides of the table.
  const cx=chair.x,cy=chair.y;
  r(c,cx+2,cy-8,3,24,'#826348');r(c,cx+25,cy-8,3,24,'#826348');r(c,cx+3,cy-8,24,4,'#b89569');r(c,cx+9,cy-4,3,10,'#b89569');r(c,cx+18,cy-4,3,10,'#b89569');
  r(c,cx,cy+8,30,10,'#c4a476');r(c,cx+2,cy+18,4,12,'#70543f');r(c,cx+24,cy+18,4,12,'#70543f');
}
function roomBackground() {
  if(room)return room;
  room=document.createElement('canvas');room.width=832;room.height=576;const c=room.getContext('2d');
  r(c,0,0,832,576,'#1d302b');r(c,201,149,431,352,'#10241e');r(c,211,159,411,332,'#6a584a');
  r(c,217,169,399,54,'#c6ba96');r(c,217,176,399,5,'#e1cfa9');r(c,217,216,399,9,'#8c795b');r(c,220,225,393,257,'#a78662');
  c.save();c.beginPath();c.rect(220,225,393,257);c.clip();
  for(let y=227;y<482;y+=18){r(c,221,y,391,1,'#816b51');for(let x=225+(y%36?0:32);x<611;x+=64){r(c,x,y+1,1,16,'#8d7356');r(c,x+4,y+3,29,1,'#bb9b71');}}
  c.restore();r(c,215,222,6,260,'#6f5e48');r(c,610,222,6,260,'#6f5e48');r(c,220,477,390,8,'#6f5e48');
  // The window has a clear wall section between the kitchen and bed.
  r(c,425,174,72,41,'#82745a');r(c,430,178,62,33,'#9ebba8');r(c,433,180,24,27,'#d9dfb7');r(c,461,178,3,33,'#eee0bb');r(c,430,193,62,3,'#eee0bb');
  r(c,422,175,9,36,'#e9d8b0');r(c,490,175,9,36,'#e9d8b0');r(c,419,211,83,5,'#a5825e');
  r(c,319,314,158,139,'#927867');r(c,324,319,148,129,'#bd9c89');r(c,329,324,138,119,'#c9b29a');r(c,334,329,128,109,'#89a18b');r(c,338,333,120,101,'#b9bc99');
  for(let y=338;y<430;y+=12)for(let x=343;x<455;x+=12)r(c,x,y,3,3,'#a2ae8c');
  r(c,391,470,50,15,'#625845');r(c,398,473,36,10,'#d6c39a');r(c,405,476,22,4,'#b3a07c');
  drawWardrobe(c);drawKitchen(c);drawBed(c);drawBookcase(c);drawTable(c);
  r(c,plant.x+2,plant.y+2,19,20,'#b78063');r(c,plant.x,plant.y,23,5,'#d2a17c');r(c,plant.x+9,plant.y-24,4,27,'#708760');
  r(c,plant.x-5,plant.y-19,17,9,'#8faa76');r(c,plant.x+12,plant.y-30,17,9,'#a6bc8a');r(c,plant.x+3,plant.y-35,11,13,'#91ac79');
  return room;
}
export function drawHome(c,actor,state,time,camera) {
  c.save();c.translate(-camera.x,-camera.y);c.drawImage(roomBackground(),0,0);
  if(state.guardianFreed){r(c,470,433,45,26,'#b18e7b');r(c,473,436,39,20,'#cfb4a0');r(c,476,439,33,14,'#dfc9ad');}
  if(state.dragonBonded)drawDragon(c,state.homecoming?492:actor.x-24,state.homecoming?450:actor.y+12,{direction:'down',time:time/1000});
  drawCharacter(c,actor.x,actor.y,state.appearance,actor.direction,actor.walk||0);c.restore();
}
