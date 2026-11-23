import { drawCharacter } from './character.js?v=0.4.1';
import { drawDragon } from './dragon.js?v=0.4.1';

export const HOME_ENTRY = { x: 416, y: 463 };
export const HOME_BED = { x: 568, y: 286 };
const furniture = [
  {x:531,y:195,w:79,h:76}, {x:238,y:190,w:76,h:40},
  {x:326,y:190,w:107,h:33}, {x:459,y:187,w:49,h:45},
  {x:293,y:331,w:68,h:48}, {x:246,y:430,w:41,h:26}, {x:566,y:425,w:23,h:22},
];
export function homeBlocked(x,y) {
  return x<226||x>606||y<229||y>478||furniture.some(o=>x>o.x-5&&x<o.x+o.w+5&&y>o.y-3&&y<o.y+o.h+3);
}
export function homeInteraction(actor) {
  const targets=[
    {...HOME_BED,type:'bed',label:'Rest in your bed'},
    {x:416,y:474,type:'exit',label:'Step outside'},
    {x:274,y:244,type:'wardrobe',label:'Open your wardrobe'},
    {x:380,y:239,type:'kettle',label:'Put the kettle on'},
    {x:483,y:245,type:'notes',label:'Read Wren’s note'},
  ];
  return targets.map(t=>({...t,distance:Math.hypot(t.x-actor.x,t.y-actor.y)})).filter(t=>t.distance<34).sort((a,b)=>a.distance-b.distance)[0];
}
let room;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
function roomBackground() {
  if(room)return room;
  room=document.createElement('canvas');room.width=832;room.height=576;const c=room.getContext('2d');
  r(c,0,0,832,576,'#1d302b');
  r(c,201,149,431,352,'#10241e');r(c,211,159,411,332,'#6a584a');
  r(c,217,169,399,54,'#c6ba96');r(c,217,176,399,5,'#e1cfa9');r(c,217,216,399,9,'#8c795b');
  r(c,220,225,393,257,'#a78662');
  c.save();c.beginPath();c.rect(220,225,393,257);c.clip();
  for(let y=227;y<482;y+=18){r(c,221,y,391,1,'#816b51');for(let x=225+(y%36?0:32);x<611;x+=64){r(c,x,y+1,1,16,'#8d7356');r(c,x+4,y+3,29,1,'#bb9b71');}}
  c.restore();
  r(c,215,222,6,260,'#6f5e48');r(c,610,222,6,260,'#6f5e48');r(c,220,477,390,8,'#6f5e48');
  // Window light, a woven rug and the cottage door.
  r(c,439,178,62,36,'#82745a');r(c,443,181,54,30,'#9ab9a4');r(c,446,184,20,23,'#d5dcb3');r(c,470,181,3,30,'#e8d8b3');r(c,443,194,54,3,'#e8d8b3');
  r(c,439,179,7,33,'#e7d7b1');r(c,493,179,8,33,'#e7d7b1');r(c,434,211,72,4,'#9c7b59');
  r(c,371,320,123,119,'#927867');r(c,376,325,113,109,'#bd9c89');r(c,381,331,103,97,'#c9b29a');r(c,386,337,93,85,'#89a18b');r(c,390,341,85,77,'#b9bc99');
  for(let y=345;y<415;y+=12)for(let x=395;x<471;x+=12)r(c,x,y,3,3,'#a2ae8c');
  r(c,391,470,50,15,'#625845');r(c,398,473,36,10,'#d6c39a');r(c,405,476,22,4,'#b3a07c');
  // Bed, quilt and pillow.
  r(c,531,194,79,9,'#6e5845');r(c,536,191,69,7,'#ac8760');r(c,534,201,73,70,'#715a46');
  r(c,538,202,65,61,'#e6d6b2');r(c,541,205,59,20,'#f4e7c9');r(c,544,208,53,12,'#fff0d1');
  r(c,538,225,65,38,'#86a391');r(c,541,227,59,32,'#a6b7a1');r(c,546,227,5,32,'#d8cead');r(c,588,227,5,32,'#d8cead');r(c,538,260,65,6,'#708b79');
  for(const [x,y] of [[559,235],[577,247],[559,253],[577,235]]){r(c,x,y,4,4,'#e9dabb');r(c,x+1,y+1,2,2,'#cfb88e');}
  r(c,532,269,5,7,'#6e5845');r(c,605,269,5,7,'#6e5845');
  // Wardrobe, kitchen counter and a shelf of your aunt’s notebooks.
  r(c,238,183,76,47,'#775d47');r(c,243,188,66,37,'#b28d65');r(c,246,192,28,30,'#c7a578');r(c,279,192,27,30,'#c7a578');r(c,269,205,2,3,'#f1d6a0');r(c,282,205,2,3,'#f1d6a0');
  r(c,326,199,107,25,'#8a7155');r(c,326,193,107,7,'#d5c39b');r(c,333,203,31,17,'#ad926b');r(c,369,203,27,17,'#ad926b');r(c,401,203,25,17,'#ad926b');
  r(c,373,181,18,11,'#658b87');r(c,376,177,11,5,'#bdd0b2');r(c,391,184,5,3,'#8cac9e');r(c,378,185,4,5,'#c3d4b7');
  r(c,459,187,49,45,'#705a47');for(const y of [193,208,222]){r(c,463,y,41,3,'#b18d63');for(let i=0;i<7;i++)r(c,465+i*5,y-9,4,9,['#a68d7f','#9bb39a','#c5b080'][i%3]);}
  // Table, tea, a stool and a leafy plant.
  r(c,294,329,66,43,'#715b43');r(c,291,328,72,8,'#c1a176');r(c,299,338,56,27,'#ae8b62');r(c,304,341,25,16,'#e7d8b5');r(c,311,345,12,9,'#fff0cf');r(c,339,341,8,8,'#749187');
  r(c,247,431,39,19,'#87694d');r(c,245,429,43,6,'#bb9769');r(c,250,449,4,8,'#6c5844');r(c,280,449,4,8,'#6c5844');
  r(c,568,427,19,20,'#b78063');r(c,566,425,23,5,'#d2a17c');r(c,575,401,4,27,'#708760');r(c,561,406,17,9,'#8faa76');r(c,578,395,17,9,'#a6bc8a');r(c,569,390,11,13,'#91ac79');
  return room;
}
export function drawHome(c,actor,state,time,camera) {
  c.save();c.translate(-camera.x,-camera.y);c.drawImage(roomBackground(),0,0);
  if(state.guardianFreed){r(c,470,433,45,26,'#b18e7b');r(c,473,436,39,20,'#cfb4a0');r(c,476,439,33,14,'#dfc9ad');}
  if(state.dragonBonded)drawDragon(c,state.homecoming?492:actor.x-24,state.homecoming?450:actor.y+12,{direction:'down',time:time/1000});
  drawCharacter(c,actor.x,actor.y,state.appearance,actor.direction,actor.walk||0);
  c.restore();
}
