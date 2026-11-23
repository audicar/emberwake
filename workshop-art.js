import { drawCharacter } from './character.js?v=0.5.5';
import { WORKSHOP, promotionNames } from './workshop-script.js?v=0.5.5';
import { PALETTES } from './core.js?v=0.5.5';

const WIDTH=384,HEIGHT=216;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
let background,frame;
export function drawWorkshopPortrait(canvas,appearance,name) {
  const c=canvas.getContext('2d');c.clearRect(0,0,84,88);c.imageSmoothingEnabled=false;
  r(c,0,0,84,88,'#7c8b70');r(c,2,2,80,84,'#293e36');r(c,6,6,72,76,'#60765e');r(c,6,60,72,22,'#7f8f6d');
  c.save();c.beginPath();c.rect(6,6,72,76);c.clip();
  drawCharacter(c,42,134,appearance,'down',0,3);
  c.restore();
  canvas.setAttribute('aria-label',`Portrait of ${name}`);
}
function paper(c,x,y,w,h) {
  r(c,x+1,y+1,w,h,'#303b3844');r(c,x,y,w,h,'#d8caaa');r(c,x+2,y+2,w-4,1,'#eadcbb');
  for(let row=5;row<h-2;row+=3)r(c,x+3,y+row,w-7-(row%2)*3,1,'#a69b80');
}
function lamp(c,x,y) {
  r(c,x-13,y-20,28,30,'#e4ba7320');r(c,x-9,y-15,20,25,'#e4ba731a');
  r(c,x,y-12,2,16,'#bd9b5f');r(c,x-5,y+4,12,2,'#7e7757');
  r(c,x-6,y-15,13,3,'#bba477');r(c,x-4,y-19,9,4,'#dec991');r(c,x-3,y-12,7,2,'#f0d8a1');
}
function workbench(c) {
  r(c,91,161,5,33,'#383d37');r(c,183,161,5,33,'#383d37');r(c,94,187,92,3,'#575a47');
  r(c,87,156,106,18,'#4f574a');r(c,84,151,112,9,'#9c9877');r(c,87,152,106,2,'#bab18c');r(c,89,158,102,2,'#777c61');
  // Completed work, neatly tied and ready for collection.
  for(let j=0;j<3;j++){r(c,97,146-j*3,31,3,['#6d7c71','#94a08a','#bdc1a1'][j]);r(c,110,146-j*3,3,3,'#d0b37d');}
  r(c,101,136,24,2,'#c9c9ab');r(c,113,134,3,3,'#cdb17b');
  // A single unfinished order and simple, replaceable workshop tools.
  paper(c,151,144,27,11);r(c,171,148,12,1,'#776346');r(c,181,147,3,2,'#b5ac88');
  r(c,137,145,4,8,'#4a625c');r(c,138,143,2,3,'#a1b0a0');r(c,135,152,8,2,'#69796a');
}
function desk(c) {
  r(c,266,128,5,29,'#3d443d');r(c,342,128,5,29,'#3d443d');
  r(c,262,124,89,18,'#525e51');r(c,259,119,95,8,'#9b9d7a');r(c,262,120,89,2,'#b8b28c');
  r(c,270,129,31,10,'#69755e');r(c,314,129,30,10,'#69755e');r(c,283,133,5,1,'#c3b17c');r(c,326,133,5,1,'#c3b17c');
  paper(c,273,114,22,11);paper(c,301,112,18,13);lamp(c,339,115);
}
function sharedBench(c) {
  r(c,26,131,4,22,'#3d493e');r(c,74,131,4,22,'#3d493e');
  r(c,23,126,58,10,'#535f4c');r(c,21,122,62,5,'#a1a17c');
  paper(c,29,117,17,8);r(c,56,121,17,2,'#6f7056');r(c,66,117,2,6,'#c3b28a');
}
function coatRack(c,occupied) {
  r(c,308,78,44,3,'#8e9372');
  for(const x of [314,329,344]){r(c,x,78,2,6,'#baa579');r(c,x-1,83,2,1,'#baa579');}
  if(occupied){r(c,324,85,12,18,'#476b67');r(c,321,88,4,10,'#547a70');r(c,335,88,4,10,'#547a70');r(c,328,85,4,3,'#c0bea0');}
}
function foldedLetter(c,x,y,w=14,h=10) {
  r(c,x,y,w,h,'#e8d9b9');r(c,x+1,y+1,w-2,h-2,'#f5e8cb');
  r(c,x+2,y+3,Math.max(2,w-4),1,'#b6a082');r(c,x+w-4,y+1,2,2,'#9d7f73');
}
function satchel(c,open,invitation) {
  r(c,206,165,20,3,'#5d4c3a');r(c,203,168,27,23,'#594936');
  r(c,205,171,23,17,'#9d8058');r(c,208,174,17,12,'#b19366');
  r(c,205,168,23,5,'#423e30');
  if(invitation)foldedLetter(c,210,163);
  r(c,205,174,23,5,open?'#836b4b':'#aa8960');r(c,214,178,5,4,'#d1b37b');r(c,216,179,1,2,'#6f5b41');
  r(c,202,175,2,12,'#6f5a3e');r(c,229,174,2,13,'#6f5a3e');
}
function heldLetter(c,player,appearance,fold=0) {
  const w=12-Math.round(fold*6),h=10-Math.round(fold*3),x=Math.round(player.x-w/2),y=player.y-16;
  foldedLetter(c,x,y,w,h);
  const skin=PALETTES.skin[appearance.skin];r(c,x-2,y+3,3,4,skin);r(c,x+w-1,y+3,3,4,skin);
}
function notice(c,state,includeText=true) {
  r(c,118,22,70,55,'#303d39');r(c,120,23,66,51,'#706b50');r(c,123,26,60,45,'#9a9470');
  r(c,129,28,49,39,'#dfd4b4');r(c,131,30,45,1,'#f3e6c5');r(c,151,27,3,3,'#b58c61');
  if(includeText) {
    c.fillStyle='#344034';c.font='bold 7px monospace';c.textAlign='left';c.fillText('PROMOTIONS',132,37);
    r(c,132,40,42,1,'#b2ad8c');c.font='7px monospace';
    promotionNames(state.name).forEach((name,i)=>{c.fillStyle='#3a4638';c.fillText(name,134,49+i*9);r(c,132,45+i*9,1,1,'#8a9677');});
  }
  r(c,166,59,7,4,'#a9826c');r(c,168,60,3,2,'#c7a184');
}
function base() {
  if(background)return background;
  background=document.createElement('canvas');background.width=WIDTH;background.height=HEIGHT;const c=background.getContext('2d');
  r(c,0,0,WIDTH,HEIGHT,'#202e2e');r(c,8,9,368,197,'#303e3e');r(c,14,14,356,70,'#5d6b68');
  r(c,14,16,356,3,'#77817a');r(c,14,77,356,8,'#424f49');r(c,14,85,356,116,'#747963');
  c.save();c.beginPath();c.rect(14,85,356,116);c.clip();
  for(let y=86;y<201;y+=14){r(c,15,y,354,1,'#596453');for(let x=20+(y%28?0:26);x<367;x+=52){r(c,x,y+1,1,12,'#636d58');r(c,x+4,y+3,23,1,'#858a6e');}}
  c.restore();
  r(c,11,80,5,123,'#394940');r(c,368,80,5,123,'#394940');r(c,13,199,358,5,'#414d42');
  // Late daylight enters from one side, leaving a workmanlike, quiet room.
  r(c,29,25,65,48,'#3b4a46');r(c,33,28,57,40,'#aeaa84');r(c,36,30,51,34,'#b8b696');
  r(c,36,30,51,12,'#c7c1a0');r(c,36,42,51,22,'#a0aaa0');r(c,36,56,51,8,'#87998b');
  r(c,59,28,3,40,'#d2c8a0');r(c,33,47,57,3,'#d2c8a0');r(c,26,68,71,5,'#82846a');
  for(let row=0;row<7;row++)r(c,35+row*3,85+row*8,56+row*2,8,'#d4c68a0d');
  // Finished orders on the shared shelves; the role remains deliberately open.
  r(c,208,25,70,47,'#3f5048');r(c,211,28,64,40,'#536558');
  for(const shelf of [44,63]){for(let i=0;i<7;i++){r(c,215+i*8,shelf-11,6,10,['#8c9e86','#b3ad88','#8e9b9a'][i%3]);r(c,217+i*8,shelf-7,2,1,'#d2c29b');}r(c,209,shelf,68,3,'#89916f');}
  r(c,306,29,38,35,'#4b5d55');r(c,309,32,32,29,'#a6b09b');paper(c,313,35,24,23);
  r(c,23,151,36,32,'#4b5c4d');r(c,25,150,32,4,'#8c9270');r(c,29,155,2,25,'#727f60');r(c,49,155,2,25,'#727f60');
  r(c,323,175,23,17,'#46584a');r(c,322,173,25,4,'#859474');r(c,327,189,3,8,'#3f4b3d');r(c,339,189,3,8,'#3f4b3d');
  r(c,203,91,35,16,'#5d6b5770');r(c,205,93,31,12,'#93977933');
  return background;
}

export function drawWorkshop(c,sequence,state,reducedMotion=false) {
  if(!frame){frame=document.createElement('canvas');frame.width=WIDTH;frame.height=HEIGHT;}
  const f=frame.getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,WIDTH,HEIGHT);f.drawImage(base(),0,0);notice(f,state,sequence.beat.shot!=='notice');
  const beat=sequence.beat,t=reducedMotion?(beat.shot==='establish'?0:8):sequence.elapsed;
  let player={x:157,y:130,direction:'up',walk:0},boss={x:232,y:149,direction:'left',walk:0};
  let coworkers=[{x:125,y:124,direction:'up',walk:0},{x:191,y:126,direction:'up',walk:0}];
  if(beat.shot==='establish') {
    // Coworkers pack up and gather at the notice; the MC finishes an order,
    // then walks over. The supervisor remains at a separate desk.
    const walk=Math.min(1,Math.max(0,(t-2.8)/1.8));
    player={x:159-walk*2,y:159-walk*29,direction:t<2.8?'down':'up',walk:walk>0&&walk<1?t*8:0};
    boss={x:292,y:132,direction:'down',walk:0};
    const a=Math.min(1,Math.max(0,(t-1.4)/2.2)),b=Math.min(1,Math.max(0,(t-1.5)/2.7));
    coworkers=[{x:52+a*73,y:133-a*9,direction:a===0?'down':a<1?'right':'up',walk:a>0&&a<1?t*8:0},{x:319-b*128,y:117+b*9,direction:b===0?'up':b<1?'left':'up',walk:b>0&&b<1?t*8:0}];
  } else if(beat.shot!=='notice')player={x:167,y:151,direction:'right',walk:0};
  coatRack(f,beat.shot==='establish'&&t<1.1);
  coworkers.forEach((actor,i)=>{
    drawCharacter(f,actor.x,actor.y,WORKSHOP.staff[i],actor.direction,actor.walk);
    if(i===1&&(beat.shot!=='establish'||t>1.1)){r(f,actor.x-1,actor.y-13,7,7,'#476b67');r(f,actor.x,actor.y-13,5,2,'#9cad94');}
  });
  if(beat.shot==='request')boss.direction=t>.7?'right':'left';
  if(beat.shot==='silence') {
    const walk=Math.min(1,Math.max(0,(t-1.3)/1.1));
    player={x:167-walk*8,y:151+walk*8,direction:t<1.3?'right':t<2.4?'left':'down',walk:walk>0&&walk<1?t*10:0};
    const away=Math.min(1,t/1.6);boss={x:232+away*57,y:149-away*17,direction:away<1?'right':'down',walk:away<1?t*8:0};
  }
  const letterShots=['find-letter','letter','fold-letter'];
  if(letterShots.includes(beat.shot)) {
    boss={x:289,y:132,direction:'down',walk:0};
    if(beat.shot==='find-letter') {
      const walk=Math.min(1,Math.max(0,(t-.9)/1.2));
      player={x:159+walk*34,y:159+walk*8,direction:t<.9?'down':walk<1?'right':'down',walk:walk>0&&walk<1?t*9:0};
    } else player={x:193,y:167,direction:'down',walk:0};
  }
  drawCharacter(f,boss.x,boss.y,WORKSHOP.supervisor,boss.direction,boss.walk);
  const bagInsert=beat.shot==='fold-letter'&&t>=1.15;
  if(!bagInsert)drawCharacter(f,player.x,player.y,state.appearance,player.direction,player.walk);
  sharedBench(f);desk(f);workbench(f);
  // Leave the tool on the order before deliberately turning to the invitation.
  if(letterShots.includes(beat.shot))r(f,155,146,7,1,'#cbb888');
  const invitationInBag=beat.shot==='find-letter'?t<2.3:beat.shot==='letter'?false:beat.shot==='fold-letter'?t>=2.1:true;
  satchel(f,letterShots.includes(beat.shot),invitationInBag);
  if(beat.shot==='letter'||(beat.shot==='find-letter'&&t>=2.3))heldLetter(f,player,state.appearance);
  if(beat.shot==='fold-letter') {
    if(t<1.15)heldLetter(f,player,state.appearance,Math.min(1,t/1.1));
    else if(t<2.1) {
      const lower=Math.min(1,(t-1.15)/.95),y=Math.round(156+lower*7);
      foldedLetter(f,210,y);const skin=PALETTES.skin[state.appearance.skin];
      r(f,208,y-5,4,6,skin);r(f,209,y,4,3,skin);
    } else if(t<2.8) {
      const y=Math.round(158-(t-2.1)*20);r(f,208,y-5,4,6,PALETTES.skin[state.appearance.skin]);
    }
  }
  if((beat.shot==='silence'&&t>2.5)||(beat.shot==='establish'&&t<2.8)) {
    // The small movement of a tool is the only reply to the final request.
    r(f,155+Math.floor(t*6)%2,146,7,1,'#cbb888');
  }
  const shots={establish:{x:192,y:108,zoom:1},notice:{x:153,y:88,zoom:1.75},conversation:{x:202,y:126,zoom:1.65},request:{x:202,y:126,zoom:1.65},silence:{x:191,y:134,zoom:1.8},'find-letter':{x:185,y:151,zoom:2},letter:{x:193,y:151,zoom:2.25},'fold-letter':{x:193,y:151,zoom:2.25}};
  const camera=bagInsert?{x:215,y:176,zoom:4.5}:shots[beat.shot],sw=Math.round(WIDTH/camera.zoom),sh=Math.round(HEIGHT/camera.zoom),sx=Math.round(camera.x-sw/2),sy=Math.round(camera.y-sh/2);
  c.imageSmoothingEnabled=false;c.clearRect(0,0,c.canvas.width,c.canvas.height);c.drawImage(frame,sx,sy,sw,sh,0,0,c.canvas.width,c.canvas.height);
  // Pixel-stepped shadows frame the scene without blurring the sprite edges.
  for(let edge=0;edge<3;edge++){r(c,edge*3,0,3,HEIGHT,`rgba(15,25,27,${.12-edge*.025})`);r(c,WIDTH-(edge+1)*3,0,3,HEIGHT,`rgba(15,25,27,${.12-edge*.025})`);}
}
