import { drawCharacter } from './character.js?v=0.8.1';
import { PALETTES } from './core.js?v=0.8.1';
import { drawWorld } from './art.js?v=0.8.1';

const W=384,H=216;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(Math.round(x),Math.round(y),w,h);};
const wrap=(value,span)=>((value%span)+span)%span;
let arrival;
const trees=new Map(),characters=new Map();

function cloud(c,x,y) {
  r(c,x,y,37,5,'#f0e9d0');r(c,x+5,y-4,26,5,'#f0e9d0');
  r(c,x+12,y-8,14,5,'#f0e9d0');r(c,x+5,y+4,31,2,'#dce0c5');
}
function ridge(c,y,colour,phase=0,amplitude=14) {
  for(let x=0;x<W;x+=4) {
    const top=y+Math.round(Math.sin((x+phase)/59)*amplitude+Math.sin((x+phase)/27)*4);
    r(c,x,top,4,H-top,colour);
  }
}
function paintTree(c,blossom) {
  c.save();c.translate(24,59);
  r(c,-3,-30,6,31,'#806751');r(c,-1,-25,2,25,'#b3946c');
  const dark=blossom?'#af8188':'#426b55',mid=blossom?'#d7a4a5':'#678c66',light=blossom?'#edc5bd':'#8eab7d';
  r(c,-14,-49,28,25,dark);r(c,-20,-43,38,15,dark);r(c,-10,-55,21,8,dark);
  r(c,-15,-45,29,17,mid);r(c,-11,-51,22,12,mid);r(c,-19,-40,12,9,mid);
  r(c,-11,-49,16,8,light);r(c,-16,-41,10,5,light);r(c,4,-40,10,4,light);
  r(c,-7,-45,4,2,'#b5c493');r(c,8,-34,4,2,light);
  if(blossom)for(const [dx,dy] of [[-12,-44],[2,-49],[11,-35],[-4,-32]])r(c,dx,dy,2,2,'#f8dfce');
  c.restore();
}
function tree(c,x,y,size=1,blossom=false) {
  if(!trees.has(blossom)) {
    const sprite=document.createElement('canvas');sprite.width=48;sprite.height=60;
    paintTree(sprite.getContext('2d'),blossom);trees.set(blossom,sprite);
  }
  c.drawImage(trees.get(blossom),Math.round(x-24*size),Math.round(y-59*size),Math.round(48*size),Math.round(60*size));
}
function smallCharacter(c,x,y,appearance,direction,scale) {
  const key=JSON.stringify([appearance,direction]);
  if(!characters.has(key)) {
    const sprite=document.createElement('canvas');sprite.width=36;sprite.height=46;
    drawCharacter(sprite.getContext('2d'),18,43,appearance,direction);characters.set(key,sprite);
  }
  c.drawImage(characters.get(key),Math.round(x-18*scale),Math.round(y-43*scale),Math.round(36*scale),Math.round(46*scale));
}
function landscape(c,t,woods=false,town=false) {
  r(c,0,0,W,H,woods?'#bac9bb':'#c8d5bd');
  r(c,306,25,24,16,'#e9ddae');r(c,310,21,16,24,'#e9ddae');
  for(let i=0;i<4;i++)cloud(c,wrap(i*119-t*1.5,480)-45,29+i%2*14);
  ridge(c,85,'#8eaaa0',t*.5,16);ridge(c,108,'#729580',t*1.4,12);
  ridge(c,128,woods?'#5c8066':'#8eac7b',t*3,8);
  r(c,0,157,W,59,'#a9b982');
  // Field seams move slowly; the roadside grasses pass closest to the coach.
  for(let i=0;i<7;i++) {
    const x=wrap(i*74-t*9,470)-40;
    r(c,x,141+i%3*5,45,2,i%2?'#c1c28c':'#7f9c6f');
    r(c,x+11,148+i%2*4,22,1,'#d3cd9b');
  }
  r(c,0,170,W,28,'#d3bd94');r(c,0,171,W,2,'#e5d0a5');r(c,0,194,W,4,'#b8a27e');
  for(let i=0;i<18;i++)r(c,wrap(i*27-t*23,440)-24,179+i%3*5,5,1,'#b6a17d');
  if(town) {
    for(let i=0;i<5;i++) {
      const x=wrap(i*92-t*13,530)-95,y=112+i%2*9;
      r(c,x,y,44,43,'#d3c5a1');r(c,x-3,y-4,50,7,'#966c5d');r(c,x+4,y-11,36,7,'#ad8068');
      for(const dx of [8,28]){r(c,x+dx,y+10,9,13,'#729693');r(c,x+dx+1,y+11,3,5,'#d4dbbc');}
      r(c,x+18,y+26,10,17,'#756d54');r(c,x+3,y+38,38,3,'#b0a384');
    }
  }
  if(woods)for(let i=0;i<8;i++)tree(c,wrap(i*70-t*17,560)-50,162,1.2,i===3);
  else for(let i=0;i<4;i++)tree(c,wrap(i*147-t*8,590)-50,155,.65,i===1);
  for(let i=0;i<28;i++) {
    const x=wrap(i*19-t*35,440)-24,y=202+(i*7)%13;
    r(c,x,y,1,4,'#6e8f60');r(c,x-1,y-1,3,2,i%4?'#e8dbad':'#d1a5ad');
  }
}
function letter(c,x,y) {
  r(c,x,y,19,12,'#b9a17d');r(c,x+1,y,17,11,'#f3e7c9');
  r(c,x+3,y+4,12,1,'#baa98a');r(c,x+3,y+7,8,1,'#baa98a');r(c,x+14,y+1,3,2,'#b08b85');
}
function bag(c,x,y) {
  r(c,x+5,y-4,14,3,'#5a493a');r(c,x+3,y-1,20,21,'#5a493a');
  r(c,x,y+2,26,16,'#987b56');r(c,x+3,y+5,20,11,'#b09568');
  r(c,x+1,y+1,24,6,'#806648');r(c,x+11,y+5,5,5,'#dfc18a');r(c,x+13,y+6,1,3,'#776147');
}
function coachInterior(c,t,state,woods,reducedMotion) {
  const sway=reducedMotion?0:Math.round(Math.sin(t*2.2));
  r(c,0,0,W,H,'#4a4c3b');r(c,0,10,W,132,'#9b825e');
  r(c,19,27,299,128,'#574b3c');r(c,24,32,289,116,'#d5bb89');
  c.save();c.beginPath();c.rect(29,37,279,106);c.clip();
  c.translate(-25,5);landscape(c,t,woods,!woods);c.restore();
  // Inset frame, a narrow glass reflection and soft curtains.
  r(c,24,32,289,5,'#e4cca1');r(c,24,143,289,7,'#6d5c46');r(c,29,143,279,3,'#bba075');
  r(c,156,36,5,108,'#80694e');r(c,158,37,2,105,'#c6ac7d');
  r(c,37,45,3,84,'#e1e8cf30');r(c,41,45,2,84,'#e1e8cf20');
  for(const [x,flip] of [[14,false],[305,true]]) {
    r(c,x,31,17,114,'#5e7a68');r(c,x+3,32,7,107,'#789581');
    r(c,x+(flip?2:11),81,4,31,'#bba276');r(c,x+5,34,2,43,'#93aa8e');
  }
  r(c,14,15,338,4,'#6a5941');r(c,20,19,4,8,'#c9ad7a');r(c,340,19,4,8,'#c9ad7a');
  r(c,49,5,45,10,'#6b6c52');r(c,52,3,39,4,'#8a8d6b');r(c,58,5,3,10,'#bb9e70');r(c,81,5,3,10,'#bb9e70');
  r(c,0,154,W,62,'#665842');r(c,0,155,W,3,'#b39a6e');
  for(let x=12;x<W;x+=24){r(c,x,162,1,54,'#4f4838');r(c,x+3,168,1,44,'#847054');}
  // Upholstered bench and a rounded backrest behind the chosen character.
  r(c,217,137+sway,95,49,'#3c514a');r(c,223,133+sway,83,48,'#728875');
  r(c,227,137+sway,75,6,'#91a18a');r(c,230,148+sway,66,2,'#5f7864');
  r(c,211,181+sway,106,12,'#3e5045');r(c,215,180+sway,98,7,'#8a9b7b');
  r(c,218,193+sway,6,23,'#534737');r(c,301,193+sway,6,23,'#534737');
  c.save();c.beginPath();c.rect(216,95,85,88+sway);c.clip();
  drawCharacter(c,263,205+sway,state.appearance,'left',0,2);c.restore();
  // Bent knees, socks and small boots complete a seated pose; the torso and
  // face still use the same renderer as the wardrobe and village.
  const skin=PALETTES.skin[state.appearance.skin],cloth=PALETTES.colour[state.appearance.colour];
  r(c,247,181+sway,15,5,cloth);r(c,245,186+sway,7,8,skin);r(c,254,186+sway,7,8,skin);
  r(c,245,192+sway,7,3,'#fff0d5');r(c,254,192+sway,7,3,'#fff0d5');
  r(c,241,195+sway,12,4,'#795b56');r(c,251,195+sway,12,4,'#795b56');
  letter(c,239,176+sway);r(c,237,179+sway,3,5,skin);r(c,256,179+sway,3,5,skin);
  bag(c,322,187+sway);
  r(c,0,0,7,H,'#303d35');r(c,373,0,11,H,'#303d35');
}
function wheel(c,x,y,t) {
  r(c,x-4,y-6,8,12,'#3d4138');r(c,x-6,y-4,12,8,'#3d4138');
  r(c,x-3,y-4,6,8,'#c3ad7f');r(c,x-4,y-3,8,6,'#c3ad7f');
  r(c,x-1,y-5,2,10,'#685b44');r(c,x-5,y-1,10,2,'#685b44');
  if(Math.floor(t*5)%2){r(c,x-3,y-3,2,2,'#685b44');r(c,x+2,y+2,2,2,'#685b44');}
  r(c,x-1,y-1,3,3,'#e4c897');
}
function coach(c,t,state,reducedMotion) {
  const bounce=reducedMotion?0:Math.round(Math.sin(t*7)),x=139,y=126+bounce;
  r(c,x+3,y+49,93,4,'#536c4c40');
  r(c,x+3,y+5,79,39,'#3e5148');r(c,x+7,y+8,71,34,'#66836a');
  r(c,x+7,y+33,71,9,'#7d956f');r(c,x+10,y+34,65,1,'#b5bb85');
  r(c,x,y+1,85,6,'#4a4c3c');r(c,x+6,y-3,73,5,'#79664b');r(c,x+10,y-5,65,3,'#a48a61');
  for(const wx of [x+11,x+35,x+59]){r(c,wx,y+10,17,19,'#40554c');r(c,wx+2,y+12,13,15,'#b0bfa0');r(c,wx+3,y+13,4,11,'#cbd1ad');}
  c.save();c.beginPath();c.rect(x+61,y+12,13,15);c.clip();smallCharacter(c,x+68,y+39,state.appearance,'right',.7);c.restore();
  r(c,x+5,y+42,89,4,'#594e3b');r(c,x+80,y+26,14,4,'#9d855d');
  wheel(c,x+18,y+46,t);wheel(c,x+68,y+46,t);
  smallCharacter(c,x+87,y+27,{skin:7,hair:0,colour:5,hairStyle:1,outfit:1,accessory:5,gender:1},'right',.65);
  // A small dun pony, with short stepped legs and a cream mane.
  const hx=x+111,hy=y+30,step=reducedMotion?0:Math.round(Math.sin(t*8)*2);
  r(c,hx-6,hy-3,6,3,'#6c5942');r(c,hx-2,hy-9,25,13,'#b39167');r(c,hx+1,hy-9,19,3,'#d0b282');
  r(c,hx+18,hy-18,7,18,'#b39167');r(c,hx+21,hy-20,12,9,'#c6a476');r(c,hx+30,hy-16,7,6,'#c6a476');
  r(c,hx+23,hy-24,3,6,'#b39167');r(c,hx+29,hy-24,3,6,'#b39167');
  r(c,hx+28,hy-18,1,2,'#3b3542');r(c,hx+18,hy-18,4,14,'#ece0b2');
  for(const [lx,shift] of [[1,step],[7,-step],[17,-step],[22,step]]){r(c,hx+lx+shift,hy+3,3,12,'#b39167');r(c,hx+lx+shift,hy+13,4,3,'#665641');}
  r(c,hx-5,hy-6,3,13,'#7e6348');r(c,x+92,y+25,36,1,'#64533c');
}
function arrive(c,t,state,reducedMotion) {
  if(!arrival){arrival=document.createElement('canvas');arrival.width=256;arrival.height=144;}
  const a=arrival.getContext('2d');a.imageSmoothingEnabled=false;
  const progress=reducedMotion?1:Math.min(1,Math.max(0,(t-.6)/2.8));
  const y=265-progress*30;
  // Arrival is a private moment; Rowan is introduced during playable village life.
  drawWorld(a,{...state,x:160,y,direction:'up',walk:progress>0&&progress<1?t*7:0},reducedMotion?0:t*1000,{x:32,y:115},null,null,{showRowan:false});
  // The same cottage and path as the playable village make the arrival legible.
  const bagY=Math.round(y-115-11);
  r(a,135,bagY-2,5,2,'#5a493a');r(a,134,bagY,9,8,'#806648');
  r(a,135,bagY+2,7,5,'#b09568');r(a,138,bagY+1,2,2,'#dfc18a');
  c.drawImage(arrival,0,0,W,H);
}
export function drawJourney(c,sequence,state,reducedMotion=false) {
  const t=reducedMotion?0:sequence.elapsed,shot=sequence.beat.shot;
  c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
  if(shot==='cottage-arrival')arrive(c,t,state,reducedMotion);
  else if(shot==='open-road') {landscape(c,t);coach(c,t,state,reducedMotion);}
  else coachInterior(c,t,state,shot==='woodland-window',reducedMotion);
  // Short fades mark the change of time and place, without moving the camera.
  const fade=reducedMotion?0:Math.max(0,1-t/.65);
  if(fade)r(c,0,0,W,H,`rgba(20,33,35,${fade})`);
}
