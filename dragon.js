export function drawDragon(c,x,y,{direction='down',green=false,scale=1,time=0,calm=true}={}) {
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
  if(direction==='left')c.scale(-1,1);
  const r=(x,y,w,h,colour)=>{c.fillStyle=colour;c.fillRect(x,y,w,h);};
  const dark=green?'#34584b':'#84554c',body=green?'#7c9a72':'#d69c72',light=green?'#a9be87':'#efc894',wing=green?'#526f57':'#b57865';
  r(-9,0,18,2,'#183d3030');
  const bounce=Math.sin(time*5)>.5?-1:0;c.translate(0,bounce);
  r(-12,-7,8,5,dark);r(-15,-5,5,3,body);r(-16,-6,3,2,light);
  r(-8,-14,15,12,dark);r(-7,-15,13,12,body);r(-4,-11,8,8,light);
  r(-8,-2,5,3,dark);r(3,-2,5,3,dark);r(-7,-2,3,2,light);r(4,-2,3,2,light);
  const flap=Math.sin(time*5)>.2?1:0;
  r(-12,-18-flap,6,10,wing);r(-14,-19-flap,3,6,body);r(-11,-17-flap,2,6,light);
  r(7,-18-flap,5,10,wing);r(10,-19-flap,3,5,body);r(8,-16-flap,2,5,light);
  r(-6,-24,13,11,dark);r(-7,-22,15,8,body);r(-4,-25,9,13,body);
  r(-6,-27,3,5,'#eadcb0');r(4,-27,3,5,'#eadcb0');r(-4,-23,7,2,light);
  if(direction==='up'){r(-5,-22,11,8,body);r(-1,-25,3,3,light);r(-1,-20,3,2,light);}
  else if(direction==='right'||direction==='left') {r(4,-20,3,4,'#344139');r(4,-20,1,2,'#fff0bf');r(7,-17,4,3,light);r(9,-17,1,1,dark);}
  else {for(const ex of [-4,3]){r(ex,-20,3,4,'#344139');r(ex,-20,1,2,calm?'#fff0bf':'#f0b575');}r(-3,-14,7,2,light);r(0,-14,1,1,dark);}
  c.restore();
}
