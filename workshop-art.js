import { drawCharacter } from './character.js?v=0.7.4';
import { WORKSHOP, promotionNames } from './workshop-script.js?v=0.7.4';
import { PALETTES } from './core.js?v=0.7.4';

const WIDTH=384,HEIGHT=216;
const r=(c,x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
let background,frame,benchCraft;
const memoryShots=['first-spring','promise','new-idea','trusted','shared-method','winter-late'];
const clamp=n=>Math.max(0,Math.min(1,n));
function fittingGuide(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  r(c,-3,1,3,22,'#405b57');r(c,-3,22,39,3,'#405b57');
  r(c,-2,2,1,20,'#91aa91');r(c,0,22,35,1,'#91aa91');c.restore();
}
function craftBox(c,x,y,scale=1,gap=0,shift=0) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  r(c,0,12,32,11,'#72573e');r(c,1,17,30,5,'#9f7b50');r(c,3,19,26,1,'#b99763');
  r(c,1+shift,-gap,30,17,'#755b40');r(c,2+shift,1-gap,28,14,'#c5a170');
  r(c,4+shift,3-gap,24,10,'#ac885c');r(c,5+shift,4-gap,22,8,'#c2a075');
  r(c,4+shift,2-gap,24,1,'#e2c28c');
  for(const xx of [4,26]){r(c,xx+shift,1-gap,2,3,'#dfbe79');r(c,xx+shift,12-gap,2,3,'#dfbe79');}
  // A leaf carved into the lid gives the work a recognisable finished form.
  r(c,15+shift,5-gap,2,7,'#5b745d');r(c,12+shift,6-gap,3,3,'#7f9370');r(c,17+shift,8-gap,3,3,'#7f9370');
  r(c,14,17,4,5,'#dfbe79');r(c,15,18,2,2,'#7a623d');c.restore();
}
function benchPiece(c,x,y,guide=true) {
  if(!benchCraft){benchCraft=document.createElement('canvas');benchCraft.width=42;benchCraft.height=28;}
  const b=benchCraft.getContext('2d');b.imageSmoothingEnabled=false;b.clearRect(0,0,42,28);
  if(guide)fittingGuide(b,3,0);craftBox(b,3,0);
  c.drawImage(benchCraft,0,0,42,28,x,y,21,14);
}
function closeNotebook(c,closed,worn=false) {
  const x=30,y=97;
  r(c,x-2,y-2,94,58,'#3f5752');r(c,x,y,90,53,'#729489');
  if(!closed) {
    r(c,x+3,y+2,39,48,'#e7ddbd');r(c,x+45,y+2,42,48,'#f3e7c8');r(c,x+42,y+2,3,49,'#b49b77');
    for(let yy=8;yy<42;yy+=7)r(c,x+8,y+yy,27-(yy%3)*3,2,'#b1a080');
    r(c,x+55,y+10,22,18,'#8b9b80');r(c,x+58,y+13,16,12,'#e7ddbd');
    r(c,x+50,y+6,3,31,'#577e7c');r(c,x+50,y+34,32,3,'#577e7c');
    r(c,x+57,y+42,22,2,'#b1a080');
  } else {
    r(c,x+4,y+51,84,4,'#dfd3b0');r(c,x+27,y+17,37,2,'#d8cca3');r(c,x+33,y+25,25,2,'#d8cca3');
  }
  if(worn){r(c,x,y,8,2,'#bdbaa0');r(c,x+85,y+45,5,5,'#bdbaa0');r(c,x-2,y+14,2,20,'#a6ae91');}
}
function craftHand(c,x,y,appearance,thumbRight=true) {
  const skin=PALETTES.skin[appearance.skin],sleeve=PALETTES.colour[appearance.colour];
  r(c,x-8,y+23,17,216-y,'#4f6257');r(c,x-7,y+25,15,216-y,sleeve);
  r(c,x-7,y+3,14,24,skin);r(c,x-5,y,10,5,skin);
  r(c,x+(thumbRight?6:-11),y+10,5,11,skin);r(c,x-7,y+24,14,4,'#e5d8b6');
  r(c,x-4,y+4,1,6,'#ffffff20');
}
function drawCraftInsert(c,sequence,state,reducedMotion) {
  const first=sequence.beat.shot==='first-spring',t=reducedMotion?(first?6.8:5.2):sequence.elapsed;
  c.imageSmoothingEnabled=false;c.clearRect(0,0,WIDTH,HEIGHT);
  r(c,0,0,WIDTH,HEIGHT,'#384b43');r(c,10,12,364,184,'#6b7059');r(c,12,14,360,172,'#999575');
  for(let yy=18;yy<185;yy+=24){r(c,12,yy,360,1,'#777b60');for(let xx=22+(yy%48?0:37);xx<365;xx+=72)r(c,xx,yy+5,29,1,'#b0a585');}
  r(c,12,185,360,11,'#545e4d');r(c,12,185,360,2,'#b6aa83');
  const closeBook=!first&&t>=3.5;
  closeNotebook(c,closeBook,!first);
  const fitted=first?clamp((t-2.8)/1.3):clamp(t/1.7);
  const inspect=first?Math.sin(clamp((t-4.3)/1.4)*Math.PI):0;
  const boxY=91-Math.round(inspect*5),boxX=204+Math.round(inspect*3);
  fittingGuide(c,204,91,3);
  craftBox(c,boxX,boxY,3,Math.round((1-fitted)*3),Math.round((1-fitted)*2));
  const turn=Math.round(inspect*3);
  if(turn){r(c,boxX+94,boxY+9,turn*3,51,'#72573e');r(c,boxX+94,boxY+9,turn*3,3,'#d4b481');}
  // A file and a pencil stay within reach, rather than becoming an inventory item.
  r(c,145,146,4,24,'#b8b9a1');r(c,143,166,8,15,'#567a70');r(c,140,169,3,9,'#405b57');
  r(c,54,167,47,3,'#b18a5f');r(c,99,167,5,3,'#e5d1a6');
  if(first&&t>=1.35&&t<2.65)craftHand(c,108,137,state.appearance,false);
  else if(!first&&t>=3.1&&t<4.1)craftHand(c,86,125,state.appearance,false);
  else if(first||t<2.7)craftHand(c,198,121-Math.round(inspect*5),state.appearance,true);
  else craftHand(c,182,181,state.appearance,true);
  const adjusting=first&&t>=2.65&&t<4.1;
  if(first||t<2.7) {
    const rx=adjusting?285+Math.round(Math.sin((t-2.65)*12)*2):307;
    craftHand(c,rx,125-Math.round(inspect*5),state.appearance,false);
    if(adjusting){r(c,rx-2,104,4,31,'#b8b9a1');r(c,rx-4,131,8,11,'#567a70');}
  } else craftHand(c,320,181,state.appearance,false);
  // The first inspection lingers; the later order is simply put down.
  if(first&&t>4.25&&t<5.8)r(c,boxX+8,boxY+6,9,1,'#f0dbad');
  if(!reducedMotion&&t<.35)r(c,0,0,WIDTH,HEIGHT,`rgba(20,33,35,${1-t/.35})`);
}
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
function notebook(c,era) {
  const x=97,y=era==='new-idea'?147:139,open=memoryShots.includes(era);
  r(c,x,y,31,15,'#3f5752');r(c,x+2,y,28,13,'#729489');
  if(open) {
    r(c,x+2,y+1,13,11,'#e7ddbd');r(c,x+16,y+1,13,11,'#f3e7c8');r(c,x+15,y+1,1,12,'#b49b77');
    for(const yy of [3,6,9])r(c,x+4,y+yy,8,1,'#ad9a79');
    // An idea sketched on the facing page; later years fill the margins.
    if(era!=='new-idea') {
      r(c,x+20,y+3,5,5,'#8e9e87');r(c,x+21,y+4,3,3,'#e8dfbc');
      r(c,x+18,y+9,9,1,'#ad9a79');
    }
    if(!['first-spring','promise','new-idea'].includes(era)){r(c,x+17,y+2,1,5,'#ad9a79');r(c,x+26,y+2,2,1,'#ad9a79');r(c,x+27,y+5,1,3,'#ad9a79');}
  } else {
    r(c,x+8,y+4,12,1,'#d8cca3');r(c,x+10,y+7,8,1,'#d8cca3');
    r(c,x+2,y+13,28,2,'#e3d5b2');
  }
  if(!['first-spring','promise','new-idea'].includes(era)){r(c,x+2,y,3,1,'#bdbaa0');r(c,x+28,y+11,2,2,'#bdbaa0');r(c,x,y+4,1,5,'#aaaf90');}
}
function pixelLimb(c,from,to,width,colour) {
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y))));
  const radius=Math.floor(width/2);
  for(let i=0;i<=steps;i++)r(c,Math.round(from.x+(to.x-from.x)*i/steps)-radius,Math.round(from.y+(to.y-from.y)*i/steps)-radius,width,width,colour);
}
function writingPose(c,actor,appearance,t,reducedMotion) {
  const x=Math.round(actor.x),y=Math.round(actor.y),skin=PALETTES.skin[appearance.skin];
  const sleeve=[2,3,4,5,7].includes(appearance.outfit)?'#fff0d5':PALETTES.colour[appearance.colour];
  const progress=clamp((t-1.3)/1.8)*3,row=Math.min(2,Math.floor(progress));
  const stroke=reducedMotion?1:Math.round((progress-row)*3);
  const tipX=x+7+stroke,tipY=y-8+row*2;
  // Ink remains on the page as the hand moves to the next short line.
  for(let line=0;line<3;line++) {
    const length=Math.round(clamp(progress-line)*4);
    if(length)r(c,x+7,y-8+line*2,length,1,'#776c54');
  }
  // The left hand steadies the page. Both sleeves join the sprite's shoulders.
  const left={x:x-(appearance.gender===1?9:7),y:y-17};
  const leftElbow={x:left.x-1,y:y-12},leftPalm={x:left.x+2,y:y-7};
  pixelLimb(c,left,leftElbow,3,skin);pixelLimb(c,leftElbow,leftPalm,3,skin);
  pixelLimb(c,left,{x:left.x-.6,y:y-15},4,sleeve);
  r(c,leftPalm.x-1,leftPalm.y-1,3,3,skin);
  const shoulder={x:x+(appearance.gender===1?8:6),y:y-17};
  const palm={x:tipX+1,y:tipY-2},dx=palm.x-shoulder.x,dy=palm.y-shoulder.y;
  // Two equal-length segments keep the elbow and wrist coherent through every stroke.
  const distance=Math.hypot(dx,dy),reach=Math.min(distance,13.99),bend=Math.sqrt(49-reach*reach/4);
  const elbow={x:shoulder.x+dx/2+dy/distance*bend,y:shoulder.y+dy/2-dx/distance*bend};
  pixelLimb(c,shoulder,elbow,3,skin);pixelLimb(c,elbow,palm,3,skin);
  pixelLimb(c,shoulder,{x:shoulder.x+(elbow.x-shoulder.x)*.45,y:shoulder.y+(elbow.y-shoulder.y)*.45},4,sleeve);
  r(c,palm.x-1,palm.y-1,3,3,skin);
  // A stepped pencil crosses the fingers and keeps its nib on the current line.
  for(let py=0;py<8;py++)r(c,tipX+Math.round((7-py)*.65),tipY-7+py,1,1,'#ae8557');
  r(c,tipX,tipY,1,1,'#3d4438');
}
function workbench(c,era) {
  r(c,91,161,5,33,'#383d37');r(c,183,161,5,33,'#383d37');r(c,94,187,92,3,'#575a47');
  const writing=era==='new-idea';
  r(c,87,writing?163:156,106,writing?11:18,'#4f574a');r(c,84,writing?145:151,112,writing?18:9,'#9c9877');
  r(c,87,writing?146:152,106,2,'#bab18c');r(c,89,writing?163:158,102,2,'#777c61');
  // The first notebook stays on the same bench as the years pass.
  notebook(c,era);
  if(era!=='first-spring')for(let j=0;j<3;j++){r(c,180,150-j*3,12,3,['#6d7c71','#94a08a','#bdc1a1'][j]);r(c,185,150-j*3,2,3,'#d0b37d');}
  // A single unfinished order and simple, replaceable workshop tools.
  paper(c,151,144,27,11);if(era!=='promise')benchPiece(c,151,139);
  r(c,171,148,12,1,'#776346');r(c,181,147,3,2,'#b5ac88');
  r(c,137,145,4,8,'#4a625c');r(c,138,143,2,3,'#a1b0a0');r(c,135,152,8,2,'#69796a');
}
function memoryLight(c,era,t,reducedMotion) {
  if(!memoryShots.includes(era))return;
  const winter=era==='winter-late';
  r(c,36,30,51,34,winter?'#35485e':['first-spring','promise','new-idea'].includes(era)?'#d6cda0':'#b8b696');
  r(c,36,55,51,9,winter?'#7c9097':'#91a487');
  if(winter)for(let i=0;i<14;i++) {
    const px=37+(i*13+Math.floor(reducedMotion?0:t*3))%49,py=31+(i*11+Math.floor(reducedMotion?0:t*9))%31;
    r(c,px,py,1,1,'#d9e0cf');
  }
  r(c,59,28,3,40,'#d2c8a0');r(c,33,47,57,3,'#d2c8a0');
  if(winter)r(c,14,14,356,187,'#142b4538');
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
  if(['first-spring','finished-order'].includes(sequence.beat.shot))return drawCraftInsert(c,sequence,state,reducedMotion);
  if(!frame){frame=document.createElement('canvas');frame.width=WIDTH;frame.height=HEIGHT;}
  const beat=sequence.beat,t=reducedMotion?(beat.shot==='establish'?0:8):sequence.elapsed;
  const memory=memoryShots.includes(beat.shot);
  const f=frame.getContext('2d');f.imageSmoothingEnabled=false;f.clearRect(0,0,WIDTH,HEIGHT);f.drawImage(base(),0,0);notice(f,state,!memory&&beat.shot!=='notice');
  memoryLight(f,beat.shot,t,reducedMotion);
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
  if(beat.shot==='promise') {
    player={x:159,y:159,direction:'right',walk:0};boss={x:210,y:159,direction:t<1.7?'down':'left',walk:0};
    coworkers=[{x:52,y:133,direction:'down',walk:0},{x:319,y:117,direction:'up',walk:0}];
  } else if(beat.shot==='new-idea') {
    const walk=clamp(t/1.3);player={x:159-walk*49,y:159,direction:walk<1?'left':'down',walk:walk<1?t*8:0};
    boss={x:232+clamp(t/2)*57,y:149-clamp(t/2)*17,direction:'right',walk:t<2?t*8:0};
    coworkers=[{x:52,y:133,direction:'down',walk:0},{x:319,y:117,direction:'up',walk:0}];
  } else if(beat.shot==='trusted') {
    player={x:159,y:159,direction:'down',walk:0};boss={x:232,y:149,direction:'left',walk:0};
    coworkers=[{x:73,y:184,direction:'right',walk:0}];
  } else if(beat.shot==='winter-late') {
    const away=Math.min(1,Math.max(0,(t-1)/3.5));
    player={x:159,y:159,direction:'down',walk:0};
    boss={x:232+away*178,y:159,direction:'right',walk:away>0&&away<1?t*8:0};coworkers=[];
  } else if(beat.shot==='shared-method') {
    player={x:159,y:159,direction:'down',walk:0};boss={x:292,y:132,direction:'down',walk:0};
    coworkers=[{x:52,y:133,direction:'down',walk:0},{x:319,y:117,direction:'up',walk:0}];
  }
  coatRack(f,memory?beat.shot!=='winter-late':beat.shot==='establish'&&t<1.1);
  coworkers.forEach((actor,i)=>{
    drawCharacter(f,actor.x,actor.y,WORKSHOP.staff[i],actor.direction,actor.walk);
    if(!memory&&i===1&&(beat.shot!=='establish'||t>1.1)){r(f,actor.x-1,actor.y-13,7,7,'#476b67');r(f,actor.x,actor.y-13,5,2,'#9cad94');}
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
  const writing=beat.shot==='new-idea'&&t>=1.3;
  if(!bagInsert)drawCharacter(f,player.x,player.y,state.appearance,player.direction,player.walk,1,{drawArms:!writing});
  sharedBench(f);desk(f);workbench(f,beat.shot);
  if(beat.shot==='promise') {
    // He examines the piece, then turns towards its maker as he speaks.
    benchPiece(f,199,140,false);
    r(f,207,145,5,3,PALETTES.skin[WORKSHOP.supervisor.skin]);
  }
  if(beat.shot==='shared-method') {
    for(const [xx,yy] of [[37,116],[308,111]])benchPiece(f,xx,yy);
  }
  if(beat.shot==='winter-late')lamp(f,188,147);
  if(memory) {
    const shift=reducedMotion?0:Math.floor(t*5)%2;
    if(beat.shot==='new-idea'&&t>=1.3)writingPose(f,player,state.appearance,t,reducedMotion);
    else if(['trusted','shared-method','winter-late'].includes(beat.shot))r(f,155+shift,146,7,1,'#cbb888');
    if(beat.shot==='shared-method')for(const [xx,yy] of [[48,126],[319,122]])r(f,xx+shift,yy,7,1,'#cbb888');
    if(beat.shot==='winter-late'){paper(f,170,143,21,9);if(t<1.2)r(f,190,143,4,3,PALETTES.skin[WORKSHOP.supervisor.skin]);}
  }
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
  const shots={promise:{x:185,y:136,zoom:1.7},'new-idea':{x:139,y:143,zoom:2.7},trusted:{x:174,y:137,zoom:1.4},'shared-method':{x:192,y:108,zoom:1},'winter-late':{x:192,y:108,zoom:1},establish:{x:192,y:108,zoom:1},notice:{x:153,y:88,zoom:1.75},conversation:{x:202,y:126,zoom:1.65},request:{x:202,y:126,zoom:1.65},silence:{x:191,y:134,zoom:1.8},'find-letter':{x:185,y:151,zoom:2},letter:{x:193,y:151,zoom:2.25},'fold-letter':{x:193,y:151,zoom:2.25}};
  const camera=bagInsert?{x:215,y:176,zoom:4.5}:shots[beat.shot],sw=Math.round(WIDTH/camera.zoom),sh=Math.round(HEIGHT/camera.zoom),sx=Math.round(camera.x-sw/2),sy=Math.round(camera.y-sh/2);
  c.imageSmoothingEnabled=false;c.clearRect(0,0,c.canvas.width,c.canvas.height);c.drawImage(frame,sx,sy,sw,sh,0,0,c.canvas.width,c.canvas.height);
  // Pixel-stepped shadows frame the scene without blurring the sprite edges.
  for(let edge=0;edge<3;edge++){r(c,edge*3,0,3,HEIGHT,`rgba(15,25,27,${.12-edge*.025})`);r(c,WIDTH-(edge+1)*3,0,3,HEIGHT,`rgba(15,25,27,${.12-edge*.025})`);}
  if(memory&&!reducedMotion&&t<.45)r(c,0,0,WIDTH,HEIGHT,`rgba(20,33,35,${1-t/.45})`);
}
