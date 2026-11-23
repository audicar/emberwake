import { PALETTES } from './core.js';

function tint(hex, amount) {
  const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  return `rgb(${rgb.map(v => Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))).join(',')})`;
}

// All shapes align to the sprite's pixel grid. Coordinates share a foot anchor in
// the village, the wardrobe thumbnails and the larger character preview.
export function drawCharacter(c, x, y, a, direction = 'down', step = 0, scale = 1) {
  const skin = PALETTES.skin[a.skin], hair = PALETTES.hair[a.hair], cloth = PALETTES.colour[a.colour];
  const ink = '#3b3542', cream = '#fff0d5', boot = '#795b56';
  const hairDark = tint(hair, -.28), hairLight = tint(hair, .21), hairShine = tint(hair, .35);
  const shadow = tint(skin, -.15), light = tint(skin, .13), clothDark = tint(cloth, -.24), clothLight = tint(cloth, .22);
  const female = a.gender !== 1, back = direction === 'up', side = direction === 'left' || direction === 'right';
  const style = a.hairStyle, outfit = a.outfit;
  const stride = step ? Math.round(Math.sin(step) * 2) : 0;
  const bob = step && Math.sin(step * 2) > .2 ? -1 : 0;
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(scale, scale);
  const r = (x, y, w, h, colour) => { c.fillStyle = colour; c.fillRect(x, y, w, h); };
  r(-7, -1, 14, 2, '#213c3d25'); r(-10, 0, 20, 1, '#213c3d16');
  c.translate(0, bob);
  if (direction === 'left') c.scale(-1, 1);

  // Hair behind the body: each style has its own outline and strand clusters.
  const lock = (x, y, w, h) => { r(x,y,w,h,hairDark);r(x+1,y,w-2,h-2,hair);r(x+1,y+2,1,Math.max(1,h-5),hairLight); };
  if (side) {
    // The profile faces right before mirroring: loose hair and ties sit at the nape.
    if ([2,4,9].includes(style)) {
      lock(-10,-32,11,22);
      if (style !== 2) { lock(-12,-23,6,13); lock(-10,-14,5,6); }
    }
    if ([5,6].includes(style)) {
      if (style === 6) lock(-11,-25,4,17);
      lock(-8,-27,5,16);
    }
    if (style === 7) { lock(-14,-32,8,18); lock(-14,-20,6,10); r(-10,-32,4,3,cloth); }
    if (style === 11) { lock(-12,-32,6,18); lock(-15,-30,6,15); r(-12,-31,4,3,cloth); }
  } else {
    if ([2,4,9].includes(style)) {
      lock(-10,-32,20,22);lock(-11,-24,5,13);lock(6,-24,5,13);
      if (style !== 2) {lock(-12,-17,5,8);lock(7,-17,5,8);r(-9,-9,4,2,hair);r(6,-9,4,2,hair);}
      if (back) {r(-6,-27,1,14,hairLight);r(4,-28,1,15,hairLight);r(-1,-29,2,17,hair);}
    }
    if ([5,6].includes(style)) {
      for(const bx of style===5?[7]:[-10,7]) {
        for(let j=0;j<5;j++){const sx=bx+(j%2);r(sx,-22+j*3,4,4,hairDark);r(sx,-22+j*3,3,2,hairLight);r(sx+1,-21+j*3,2,2,hair);}
        r(bx,-7,4,2,cloth);r(bx+1,-5,2,3,hair);
      }
    }
    if (style===7) {lock(side?-13:5,-32,9,18);lock(side?-13:7,-18,6,8);r(side?-10:7,-32,4,3,cloth);}
    if (style===11) {lock(-15,-31,7,16);lock(8,-31,7,16);r(-13,-16,4,3,hair);r(9,-16,4,3,hair);r(-12,-31,3,3,cloth);r(9,-31,3,3,cloth);}
  }

  // Body construction changes shoulder width, waist, hips and leg spacing.
  const shoulder = side ? (female?5:6) : female?7:9;
  const waist = side ? 4 : female?5:7;
  const hip = side ? 5 : female?7:6;
  for (const [lx, shift] of [[-5,stride],[1,-stride]]) {
    r(lx,-8+shift,4,7,shadow);r(lx+1,-8+shift,2,6,skin);
    r(lx,-3+shift,4,2,cream);r(lx-1,-1+shift,5,2,ink);r(lx-1,-2+shift,5,2,boot);r(lx,-2+shift,2,1,'#bb9480');
  }
  r(-shoulder,-21,shoulder*2,5,clothDark);r(-shoulder+1,-21,shoulder*2-2,4,clothLight);
  r(-waist,-17,waist*2,8,cloth);r(-hip,-11,hip*2,4,clothDark);r(-hip+1,-11,hip*2-2,3,cloth);
  r(-3,-22,6,3,shadow);r(-2,-22,4,3,skin);
  for (const [ax, swing] of [[-shoulder-2,-stride],[shoulder-1,stride]]) {
    r(ax,-19+swing,3,6,clothDark);r(ax,-19+swing,2,4,clothLight);
    r(ax,-13+swing,3,5,shadow);r(ax,-13+swing,2,4,skin);r(ax,-9+swing,2,1,light);
  }
  const skirt = (length=8) => {
    for(let row=0;row<length;row++){const width=waist+Math.floor(row/2);r(-width,-14+row,width*2,1,clothDark);r(-width+1,-14+row,width*2-2,1,cloth);}
    r(-waist+2,-13,2,length-1,clothLight);r(waist-2,-12,1,length-2,clothDark);
  };
  if (outfit===0) {
    r(-waist,-17,waist*2,10,clothDark);r(-waist+1,-16,waist*2-2,9,cloth);
    r(-5,-21,2,8,clothDark);r(3,-21,2,8,clothDark);r(-4,-16,1,1,cream);r(3,-16,1,1,cream);
    r(-3,-13,6,4,clothDark);r(-2,-13,4,3,clothLight);r(-waist,-8,waist*2,2,clothDark);
    r(-5,-7,4,4,cloth);r(1,-7,4,4,cloth);r(-5,-4,4,1,clothLight);r(1,-4,4,1,clothLight);
  } else if (outfit===1) {
    r(-waist,-17,waist*2,9,cloth);r(-waist,-12,waist*2,2,'#8e6e58');r(-1,-12,2,2,'#e4c58d');r(waist-2,-14,3,5,'#a58360');
    r(-1,-20,1,6,clothDark);r(-2,-19,3,1,cream);r(-2,-17,3,1,cream);
  } else if (outfit===2) {
    skirt(9);r(-5,-21,4,3,cream);r(1,-21,4,3,cream);r(-waist,-15,waist*2,2,cream);r(-7,-6,14,1,cream);
  } else if (outfit===3) {
    r(-shoulder,-21,shoulder*2,5,cream);skirt(9);r(-4,-19,8,7,clothDark);r(-3,-19,6,7,cloth);
    r(-5,-21,2,9,clothDark);r(3,-21,2,9,clothDark);r(-4,-15,1,1,cream);r(3,-15,1,1,cream);
    r(-4,-10,8,4,cream);r(-3,-10,6,3,'#eee2ce');r(-8,-6,16,1,cream);
    r(-1,-9,2,1,'#b5b991');r(0,-10,1,3,'#b5b991');r(-1,-10,1,1,'#dca4a6');
  } else if (outfit===4) {
    r(-shoulder,-21,shoulder*2,8,cream);r(-shoulder,-21,3,5,'#e7dac5');r(shoulder-3,-21,3,5,'#e7dac5');
    r(-4,-20,3,3,'#d7c4b1');r(1,-20,3,3,'#d7c4b1');r(0,-18,1,5,'#bda28c');skirt(8);r(-waist,-14,waist*2,1,'#7b645d');
  } else if (outfit===5) {
    skirt(10);r(-shoulder,-20,3,4,cream);r(shoulder-3,-20,3,4,cream);r(-4,-21,8,2,cream);
    r(-waist,-15,waist*2,2,cream);r(-2,-15,4,2,'#f4d3cb');
    for(const [px,py] of [[-5,-10],[2,-9],[-1,-6],[5,-6]]){r(px,py,2,2,cream);r(px+1,py,1,1,'#e8b879');}
    r(-9,-5,18,1,cream);
  } else if (outfit===6) {
    skirt(8);r(-shoulder,-21,shoulder*2,10,clothDark);r(-shoulder+1,-20,shoulder*2-2,8,cloth);
    r(-2,-21,4,9,cream);r(-4,-21,2,9,clothLight);r(2,-21,2,9,clothLight);
    r(3,-17,1,1,'#ffe4b2');r(3,-14,1,1,'#ffe4b2');r(-shoulder,-13,4,2,clothDark);r(shoulder-4,-13,4,2,clothDark);
  } else if (outfit===7) {
    skirt(9);r(-6,-21,12,2,cream);r(-6,-19,3,3,cream);r(3,-19,3,3,cream);r(-4,-17,8,1,cream);
    if(!back){r(-3,-19,6,2,'#d58f91');r(-1,-18,2,5,'#d58f91');}r(-8,-6,16,1,cream);
  }
  if (back && [2,3,5,7].includes(outfit)) {r(-4,-16,3,3,cream);r(1,-16,3,3,cream);r(-1,-15,2,2,clothLight);}

  // Rounded face, warm shadows, ear highlights and a light on each eye.
  r(-6,-35,12,2,shadow);r(-8,-33,16,12,shadow);r(-6,-21,12,2,shadow);r(-4,-19,8,1,shadow);
  r(-7,-33,14,11,skin);r(-5,-34,10,13,skin);r(-3,-22,6,3,skin);r(-6,-32,9,7,light);
  r(-9,-28,2,5,shadow);r(7,-28,2,5,shadow);r(-9,-27,1,2,skin);r(8,-27,1,2,skin);
  if (!back) {
    if (side) {
      r(3,-28,3,4,ink);r(3,-28,1,2,'#fffaec');r(4,-25,1,1,'#ad8880');r(7,-25,2,2,skin);r(5,-22,2,1,'#b67a70');r(1,-23,3,2,tint(skin,-.1));
      if(female)r(5,-29,2,1,ink);
    } else {
      for(const eye of [-6,3]){r(eye,-28,3,4,ink);r(eye,-28,1,2,'#fff8e5');r(eye+1,-25,1,1,'#aa7e78');if(female)r(eye-1,-29,4,1,ink);}
      r(-7,-23,3,2,'#d9918b77');r(4,-23,3,2,'#d9918b77');r(-1,-24,2,1,shadow);r(-1,-21,2,1,'#b36e6c');
    }
  }
  if (side) {
    // Keep the forehead, eye and nose exposed; the near lock falls behind the ear.
    r(-2,-27,3,5,shadow); r(-1,-26,2,3,skin);
    r(-5,-39,9,1,hairDark); r(-8,-38,13,2,hairDark); r(-9,-36,16,7,hairDark);
    r(-6,-38,10,2,hair); r(-8,-36,14,5,hair);
    r(-8,-33,12,3,hair); r(2,-31,4,1,hair); r(2,-30,3,1,hair);
    r(-6,-37,7,1,hairLight); r(-7,-35,4,1,hairShine); r(-5,-36,4,1,hairLight);
    lock(-9,-31,7,style===1||style===10?5:10);
    if (style === 0) { r(-8,-22,6,2,hair); r(-7,-23,2,2,hairLight); }
    if ([2,4,9].includes(style)) {
      lock(-7,-24,5,13);
      if (style !== 2) { r(-10,-20,2,6,hairLight); r(-9,-12,4,2,hair); }
    }
    if ([5,6].includes(style)) {
      for (let j=0;j<5;j++) { const bx=-7+j%2; r(bx,-23+j*3,4,4,hairDark); r(bx,-23+j*3,3,2,hairLight); r(bx+1,-22+j*3,2,2,hair); }
      r(-6,-8,4,2,cloth); r(-5,-6,2,3,hair);
    }
    if (style === 3) {
      for (const [px,py] of [[-10,-35],[-7,-39],[-2,-40],[-11,-29],[-10,-24]]) { r(px,py,4,5,hairDark); r(px,py,3,3,hair); r(px,py,2,1,hairLight); }
    }
    if (style === 8) {
      lock(-8,-41,6,7); lock(-13,-39,8,8); r(-11,-37,4,2,hairLight); r(-11,-32,5,2,cloth);
    }
    if (style === 9) { r(-7,-30,4,2,cloth); r(-7,-28,2,3,hairShine); }
    if (style === 10) { r(-3,-32,6,2,hair); r(0,-30,3,1,hair); r(-2,-32,3,1,hairLight); }
  } else {
    // A shaped cap, asymmetric fringe, fine highlights and separate side locks.
    r(-5,-39,10,1,hairDark);r(-8,-38,16,2,hairDark);r(-9,-36,18,7,hairDark);
    r(-6,-38,12,2,hair);r(-8,-36,16,5,hair);r(-8,-33,side?8:6,4,hair);r(3,-33,5,3,hair);
    r(-5,-37,8,1,hairLight);r(-7,-35,4,1,hairLight);r(-6,-36,3,1,hairShine);r(5,-35,2,2,hairLight);
    if([0,2,4,5,6,7,9].includes(style)){lock(-9,-31,3,style===0?10:8);lock(6,-31,3,style===0?10:8);}
    if(style===0){r(-8,-22,3,2,hair);r(5,-22,3,2,hair);r(-7,-30,2,3,hairLight);}
    if(style===1||style===10){r(-8,-31,2,4,hair);r(6,-31,2,3,hair);if(style===10){r(-3,-31,6,2,hair);r(-1,-29,3,2,hair);r(-2,-31,3,1,hairLight);}}
    if(style===3){for(const [px,py] of [[-10,-34],[-7,-39],[-2,-40],[4,-39],[8,-34],[-11,-28],[8,-28],[-10,-23],[7,-23]]){r(px,py,4,5,hairDark);r(px,py,3,3,hair);r(px,py,2,1,hairLight);}}
    if(style===4||style===9){r(-9,-30,2,6,hairLight);r(7,-26,2,5,hairLight);r(-10,-19,2,4,hairLight);}
    if(style===9){r(-7,-33,10,1,hairLight);r(-4,-32,5,1,hairLight);r(7,-30,3,2,cloth);r(8,-28,2,3,hairShine);}
    if(style===8){for(const bx of [-13,6]){r(bx,-39,7,8,hairDark);r(bx+1,-40,5,9,hair);r(bx+1,-38,3,2,hairLight);r(bx+1,-32,5,2,cloth);}}
    if(back){r(-8,-34,16,12,hairDark);r(-7,-34,14,11,hair);r(-5,-35,3,11,hairLight);r(3,-33,2,12,hairLight);r(-6,-23,12,2,hair);if(style===7||style===9){lock(-4,-29,8,15);r(-4,-29,8,2,cloth);}}
  }

  if(a.accessory===1){r(-6,-21,12,2,'#e5b889');r(3,-19,3,6,'#e5b889');r(4,-19,1,5,'#f8d8a6');}
  if(a.accessory===2){r(-12,-35,24,3,'#aa8056');r(-13,-36,26,2,'#f1d49b');r(-8,-41,16,6,'#e9c58b');r(-6,-42,12,2,'#f4dba6');r(-8,-36,16,2,clothDark);r(6,-36,4,2,cloth);}
  if(a.accessory===3){const bx=side?-9:back?-4:4;r(bx,-35,4,4,clothDark);r(bx+5,-35,4,4,clothDark);r(bx,-35,3,3,clothLight);r(bx+6,-35,3,3,clothLight);r(bx+4,-34,2,2,cream);r(bx+4,-32,2,5,cloth);}
  if(a.accessory===4){const fx=side?-3:7;for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]])r(fx+dx,-32+dy,2,2,'#ffefda');r(fx,-32,2,2,'#e4b171');r(fx+1,-29,3,1,'#a9b78b');}
  if(a.accessory===5){r(-8,-39,17,3,clothDark);r(-7,-41,13,3,cloth);r(-4,-42,9,2,clothLight);r(-9,-36,17,2,clothDark);r(2,-42,2,1,clothDark);}
  c.restore();
}
