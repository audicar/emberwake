import { drawCharacter } from './character.js?v=0.8.0';
import { drawDragon } from './dragon.js?v=0.8.0';

export const HOME_ENTRY = { x: 416, y: 463 };
export const HOME_START = { x: 445, y: 379 };
export const HOME_BED = { x: 555, y: 328 };
// Shared floor footprints keep solid furniture and its interactions together.
const bed = { x: 520, y: 215, w: 70, h: 96 };
const wardrobe = { x: 236, y: 226, w: 64, h: 45 };
const kitchen = { x: 323, y: 222, w: 82, h: 23 };
const bookcase = { x: 236, y: 352, w: 43, h: 43 };
const table = { x: 351, y: 350, w: 74, h: 39 };
const chair = { x: 371, y: 402, w: 30, h: 27 };
const plant = { x: 565, y: 423, w: 23, h: 22 };
const writingDesk={x:236,y:420,w:61,h:47};
const bedsideCabinet={x:482,y:232,w:24,h:33};
const travelBag={x:483,y:365,w:28,h:13};
export const HOME_MEMORIES=[
  {x:489,y:350,w:20,h:13,type:'payPacket',label:'Look at your last pay packet',reach:22},
  {...writingDesk,type:'workNotebook',label:'Open your work notebook',reach:22},
  {x:487,y:218,w:14,h:18,type:'alarmClock',label:'Look at the alarm clock',reach:31},
];
// Include raised surfaces and chair backs: stopping only at their feet lets
// the player stand on the visible furniture when approaching from above.
const furniture = [
  {...bed,y:bed.y-17,h:bed.h+25},wardrobe,kitchen,
  {...bookcase,y:bookcase.y-49,h:bookcase.h+52},
  {...table,y:table.y-12,h:table.h+12},
  {...chair,y:chair.y-8,h:chair.h+11},plant,
  writingDesk,bedsideCabinet,travelBag,
];
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
    ...HOME_MEMORIES,
    {...bed,type:'bed',label:'Rest in your bed',reach:22},
    {x:416,y:474,type:'exit',label:'Step outside',reach:34},
    {...wardrobe,type:'wardrobe',label:'Open your wardrobe',reach:22},
    {...kitchen,type:'kettle',label:'Put the kettle on',reach:22},
    {...bookcase,type:'books',label:'Browse Aunt Wren’s books',reach:22},
    {...table,type:'notes',label:'Read Aunt Wren’s note',reach:22},
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
function drawKeepsakeFurniture(c) {
  const {x,y,w}=writingDesk;
  r(c,x+3,y+19,5,28,'#70523e');r(c,x+w-8,y+19,5,28,'#70523e');
  r(c,x-2,y,w+4,22,'#75573f');r(c,x,y,w,17,'#c19b6c');r(c,x+3,y+2,w-6,2,'#ddbd8b');
  r(c,x+7,y+19,w-14,12,'#a1805c');r(c,x+26,y+23,8,2,'#e2c28d');
  // A pen and ink pot belong to the writing desk, not the kitchen table.
  r(c,x+47,y+5,6,7,'#526b66');r(c,x+48,y+4,4,2,'#b6c2a7');r(c,x+42,y+6,2,9,'#d9c295');
  const bx=bedsideCabinet.x,by=bedsideCabinet.y;
  r(c,bx,by,24,29,'#846449');r(c,bx-1,by,26,5,'#d1ac7b');
  r(c,bx+3,by+7,18,14,'#b68d63');r(c,bx+10,by+12,5,2,'#efd39b');
  r(c,bx+2,by+28,4,5,'#70523e');r(c,bx+18,by+28,4,5,'#70523e');
}
function drawKeepsakes(c,state) {
  // The open travel bag makes the packet a visible, separate interaction.
  r(c,487,347,20,4,'#67503d');r(c,483,355,28,23,'#67503d');
  r(c,485,359,24,16,'#a08058');r(c,488,362,18,10,'#b99a6a');
  r(c,486,352,22,7,'#3e4033');
  const py=state.payPacketRead?354:350;
  r(c,489,py,20,13,'#bda47c');r(c,490,py,18,11,'#f2e3bf');
  r(c,493,py+4,11,1,'#ac9672');r(c,493,py+7,8,1,'#ac9672');r(c,503,py+1,3,2,'#b68576');
  r(c,485,365,24,5,'#8c6d4d');r(c,495,368,5,4,'#dfc18a');
  // The notebook stays open at its first page when the player leaves it open.
  if(state.workNotebookRead) {
    r(c,245,423,31,17,'#405b57');r(c,247,423,13,14,'#e7ddbd');r(c,261,423,13,14,'#f3e7c8');
    r(c,260,423,1,15,'#b49b77');
    for(const yy of [426,430,434]){r(c,249,yy,8,1,'#ad9a79');r(c,263,yy,7,1,'#ad9a79');}
  } else {
    r(c,247,423,26,18,'#3f5752');r(c,250,423,23,16,'#729489');r(c,251,424,20,1,'#a9bb9c');
    r(c,256,429,10,1,'#d8cca3');r(c,258,432,6,1,'#d8cca3');r(c,250,439,23,2,'#e3d5b2');
  }
  // Twin bells, a pale clock face and a winding key distinguish it from a jar.
  r(c,487,219,5,3,'#d6bd86');r(c,498,219,5,3,'#d6bd86');r(c,490,217,10,2,'#786148');
  r(c,488,222,14,12,'#675944');r(c,490,220,10,16,'#675944');
  r(c,490,223,10,10,'#f0e2bb');r(c,492,221,6,14,'#f0e2bb');
  r(c,494,225,1,5,'#5b6456');r(c,494,229,4,1,'#5b6456');r(c,489,235,3,2,'#675944');r(c,498,235,3,2,'#675944');
  if(state.clockUnwound){r(c,499,240,6,1,'#bb9b65');r(c,503,239,3,3,'#e2c58b');}
  else {r(c,503,234,1,7,'#bb9b65');r(c,502,233,3,3,'#e2c58b');}
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
  drawWardrobe(c);drawKitchen(c);drawBed(c);drawBookcase(c);drawTable(c);drawKeepsakeFurniture(c);
  r(c,plant.x+2,plant.y+2,19,20,'#b78063');r(c,plant.x,plant.y,23,5,'#d2a17c');r(c,plant.x+9,plant.y-24,4,27,'#708760');
  r(c,plant.x-5,plant.y-19,17,9,'#8faa76');r(c,plant.x+12,plant.y-30,17,9,'#a6bc8a');r(c,plant.x+3,plant.y-35,11,13,'#91ac79');
  return room;
}
export function drawHome(c,actor,state,time,camera,moment=null) {
  c.save();c.translate(-camera.x,-camera.y);c.drawImage(roomBackground(),0,0);
  drawKeepsakes(c,state);
  if(state.guardianFreed){r(c,470,433,45,26,'#b18e7b');r(c,473,436,39,20,'#cfb4a0');r(c,476,439,33,14,'#dfc9ad');}
  const stage=state.chapter?.stage||0;
  if(state.dragonBonded&&stage!==10) {
    const tug=stage===1?Math.sin(time/450)*3:0;
    drawDragon(c,state.homecoming?492+tug:actor.x-24,state.homecoming?450:actor.y+12,{direction:stage===1?'left':'down',time:time/1000});
    if(stage===1){for(let i=0;i<13;i++)r(c,478+i,439+Math.round(Math.sin(i/3+time/450)),1,1,'#efdbc1');}
  }
  if(moment?.kind==='reunion') {
    const t=moment.elapsed,walk=Math.max(0,Math.min(1,(t-.8)/3.2));
    const x=416+walk*76,y=484-walk*34;
    drawDragon(c,x,y,{direction:walk<1?'right':'down',time:time/1000});
    if(walk<1){r(c,x-19,y-13,31,2,'#95704a');r(c,x+6,y-16,2,5,'#b18c5e');}
    if(t>4) {
      // Fold the lower pose beneath the body, keeping the established head and face.
      c.save();c.beginPath();c.rect(actor.x-19,actor.y-35,38,32);c.clip();drawCharacter(c,actor.x,actor.y+6,state.appearance,'right',0);c.restore();
      r(c,actor.x-4,actor.y-4,9,4,'#a28a6d');r(c,actor.x+3,actor.y-2,7,2,'#795b56');
      c.restore();return;
    }
  }
  if(stage===11){r(c,473,455,29,2,'#95704a');r(c,480,451,2,6,'#b18c5e');}
  drawCharacter(c,actor.x,actor.y,state.appearance,actor.direction,actor.walk||0);c.restore();
}
