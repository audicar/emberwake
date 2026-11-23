import { PALETTES } from './core.js?v=0.5.2';

function mix(hex, colour, amount) {
  const a=hex.slice(1).match(/../g).map(v=>parseInt(v,16));
  const b=colour.slice(1).match(/../g).map(v=>parseInt(v,16));
  return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*amount)).join(',')})`;
}
function tint(hex, amount) {
  const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  return `rgb(${rgb.map(v => Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))).join(',')})`;
}

// All shapes align to the sprite's pixel grid. Coordinates share a foot anchor in
// the village, the wardrobe thumbnails and the larger character preview.
export function drawCharacter(c, x, y, a, direction = 'down', step = 0, scale = 1) {
  const skin = PALETTES.skin[a.skin], hair = PALETTES.hair[a.hair], cloth = PALETTES.colour[a.colour];
  const ink = '#3b3542', cream = '#fff0d5', boot = '#795b56';
  const hairDark = tint(hair, -.20), hairLight = tint(hair, .18), hairShine = tint(hair, .27);
  const shadow = tint(skin, -.15), light = tint(skin, .13), clothDark = tint(cloth, -.24), clothLight = tint(cloth, .22);
  const faceShade = mix(skin, '#a16f70', .08), faceLight = tint(skin, .06);
  const cheek = mix(skin, '#d47e89', .19), lip = mix(skin, '#a65f6d', .36);
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
    // A true profile: the skull, nape and clothing share a narrow centreline.
    // The far limbs sit behind the body; only the near shoulder is prominent.
    const long = [2,4,9].includes(style), cropped = [1,10].includes(style);
    if (long) {
      lock(-9,-32,8,22);
      if (style !== 2) { lock(-11,-25,5,13); lock(-9,-15,5,6); }
    }
    if ([5,6].includes(style)) lock(-9,-27,5,17);
    if (style === 6) lock(-11,-26,4,16);
    if (style === 7) { lock(-13,-33,7,16); lock(-12,-20,5,10); r(-9,-32,3,2,cloth); }
    if (style === 11) { lock(-13,-32,6,17); lock(-10,-30,5,17); r(-10,-32,3,2,cloth); }

    // Legs overlap in an idle pose and separate horizontally while walking.
    const leg = (lx, far) => {
      r(lx,-9,3,8,far?shadow:skin);r(lx,-3,3,2,cream);
      r(lx-1,-1,6,2,ink);r(lx-1,-2,6,2,far?tint(boot,-.12):boot);
      if(!far)r(lx+2,-2,2,1,'#bb9480');
    };
    leg(-2-stride,true);leg(stride,false);
    const depth = female?4:5, waistDepth=female?3:4;
    r(-depth,-21,depth+4,4,clothDark);r(-depth+1,-21,depth+3,3,cloth);
    r(-waistDepth,-18,waistDepth+4,10,clothDark);r(-waistDepth+1,-18,waistDepth+2,10,cloth);
    r(-1,-24,4,4,faceShade);r(0,-24,3,4,skin);
    const profileSkirt = (length=8) => {
      for(let row=0;row<length;row++) {
        const flare=Math.floor(row/3),left=-waistDepth-flare,width=waistDepth+4+flare*2;
        r(left,-14+row,width,1,clothDark);r(left+1,-14+row,width-2,1,cloth);
      }
      r(1,-13,1,length-2,clothLight);
    };
    if (outfit===0) {
      r(-3,-19,6,11,cloth);r(2,-21,1,10,clothDark);r(2,-17,1,1,cream);
      r(1,-13,3,3,clothDark);r(1,-13,2,2,clothLight);
      r(-3,-8,7,3,cloth);r(-3,-5,7,1,clothLight);
    } else if (outfit===1) {
      r(-waistDepth,-12,waistDepth+4,2,'#8e6e58');r(3,-12,1,2,'#e4c58d');
      r(-3,-13,3,5,'#a58360');r(-2,-12,2,1,'#c4a47c');
    } else {
      profileSkirt(outfit===5?10:9);
      if ([2,3,4,5,7].includes(outfit)) {r(-depth,-21,depth+4,5,cream);r(3,-20,1,3,'#e7dac5');}
      if (outfit===2) {r(-waistDepth,-15,waistDepth+4,2,cream);r(-5,-6,11,1,cream);}
      if (outfit===3) {
        r(2,-21,1,8,clothDark);r(1,-18,2,5,cloth);r(2,-15,1,1,cream);
        r(1,-10,4,4,cream);r(2,-10,2,3,'#eee2ce');r(-5,-6,11,1,cream);
        r(3,-9,1,2,'#b5b991');r(2,-9,1,1,'#dca4a6');
      }
      if (outfit===4) {r(2,-21,2,3,'#d7c4b1');r(3,-18,1,3,'#bda28c');r(-waistDepth,-14,waistDepth+4,1,'#7b645d');}
      if (outfit===5) {r(-waistDepth,-15,waistDepth+4,2,cream);r(2,-15,2,2,'#f4d3cb');r(-2,-10,2,2,cream);r(3,-8,2,2,cream);r(-6,-5,13,1,cream);}
      if (outfit===6) {r(-depth,-21,depth+4,10,clothDark);r(-depth+1,-20,depth+2,8,cloth);r(3,-20,1,8,cream);r(2,-20,1,8,clothLight);r(2,-16,1,1,'#ffe4b2');}
      if (outfit===7) {r(2,-21,2,4,cream);r(3,-19,2,1,'#d58f91');r(3,-18,1,4,'#d58f91');r(-5,-6,11,1,cream);}
    }
    // The near arm overlaps the side seam instead of framing both body edges.
    const armX=-1-stride;
    r(armX-1,-20,4,6,clothDark);r(armX,-20,2,5,[3,4,5,7].includes(outfit)?cream:clothLight);
    r(armX,-14,3,5,faceShade);r(armX,-14,2,4,skin);r(armX,-10,2,1,light);

    // Rounded forehead, small projecting nose and a softly tucked-in chin.
    // No far-side ear or rectangular front-facing cheek is visible here.
    r(-5,-35,9,12,faceShade);r(-3,-34,9,11,skin);r(-2,-32,8,9,skin);
    r(-1,-31,5,4,faceLight);r(6,-26,1,3,skin);
    r(-1,-23,7,2,skin);r(0,-21,5,1,skin);r(0,-20,3,1,skin);
    r(3,-28,3,4,ink);r(3,-28,1,2,'#fff8e5');r(4,-25,1,1,'#8e7674');
    if(female)r(4,-29,2,1,ink);
    r(1,-23,2,1,cheek);r(4,-22,1,1,lip);

    // The crown flows down into the nape, with a small curved fringe above the eye.
    r(-5,-39,7,1,hairDark);r(-7,-38,11,2,hairDark);r(-8,-36,13,6,hairDark);
    r(-6,-37,9,3,hair);r(-7,-35,11,4,hair);r(-7,-31,7,4,hair);
    r(-5,-37,6,1,hairLight);r(-6,-35,3,1,hairShine);r(0,-34,3,1,hairLight);
    r(1,-35,4,1,hair);r(1,-34,5,3,hair);r(-2,-31,8,2,hair);
    lock(-8,-30,5,cropped?6:10);
    // The ear bridges the nape and cheek without a dark vertical sideburn.
    r(-2,-27,2,4,faceShade);r(-2,-26,2,2,skin);
    if (style===0) {r(-7,-23,4,3,hair);r(-6,-23,1,2,hairLight);}
    if (long) {lock(-7,-25,4,14);if(style!==2){r(-9,-21,2,5,hairLight);r(-8,-13,3,2,hair);}}
    if ([5,6].includes(style)) {
      for(let j=0;j<5;j++){const bx=-6+j%2;r(bx,-23+j*3,4,4,hairDark);r(bx,-23+j*3,3,2,hairLight);r(bx+1,-22+j*3,2,2,hair);}
      r(-5,-8,3,2,cloth);r(-4,-6,2,2,hair);
    }
    if (style===3) for(const [px,py] of [[-8,-36],[-6,-40],[-1,-40],[-9,-30],[-8,-25]]){r(px,py,4,5,hairDark);r(px,py,3,3,hair);r(px,py,2,1,hairLight);}
    if (style===8) {lock(-12,-39,7,8);r(-10,-40,4,6,hair);r(-10,-38,3,1,hairLight);r(-10,-32,4,2,cloth);lock(-6,-41,5,5);}
    if (style===9) {r(-6,-30,4,2,cloth);r(-6,-28,1,3,hairShine);}
    if (style===10) {r(0,-32,3,2,hair);r(1,-30,2,1,hair);r(-2,-32,3,1,hairLight);}

    // Accessories follow the same profile plane, with the scarf below the chin.
    if(a.accessory===1){r(-2,-20,6,2,'#e5b889');r(2,-18,2,6,'#e5b889');r(3,-18,1,5,'#f8d8a6');}
    if(a.accessory===2){r(-10,-36,19,2,'#aa8056');r(-11,-37,21,2,'#f1d49b');r(-7,-41,13,5,'#e9c58b');r(-5,-42,9,2,'#f4dba6');r(-7,-37,13,2,clothDark);}
    if(a.accessory===3){r(-10,-34,3,3,clothDark);r(-6,-34,3,3,clothDark);r(-10,-34,2,2,clothLight);r(-5,-34,2,2,clothLight);r(-7,-33,2,2,cream);r(-7,-31,2,4,cloth);}
    if(a.accessory===4){for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]])r(-4+dx,-32+dy,2,2,'#ffefda');r(-4,-32,2,2,'#e4b171');r(-3,-29,2,1,'#a9b78b');}
    if(a.accessory===5){r(-7,-39,13,3,clothDark);r(-6,-41,10,3,cloth);r(-3,-42,6,2,clothLight);r(-8,-36,15,2,clothDark);}
    c.restore();
    return;
  } else if (!back) {
    if ([2,4,9].includes(style)) {
      lock(-10,-32,20,22);lock(-11,-24,5,13);lock(6,-24,5,13);
      if (style !== 2) {lock(-12,-17,5,8);lock(7,-17,5,8);r(-9,-9,4,2,hair);r(6,-9,4,2,hair);}
    }
    if ([5,6].includes(style)) {
      for(const bx of style===5?[7]:[-10,7]) {
        for(let j=0;j<5;j++){const sx=bx+(j%2);r(sx,-22+j*3,4,4,hairDark);r(sx,-22+j*3,3,2,hairLight);r(sx+1,-21+j*3,2,2,hair);}
        r(bx,-7,4,2,cloth);r(bx+1,-5,2,3,hair);
      }
    }
    if (style===7) {lock(5,-32,9,18);lock(7,-18,6,8);r(7,-32,4,3,cloth);}
    if (style===11) {lock(-15,-31,7,16);lock(8,-31,7,16);r(-13,-16,4,3,hair);r(9,-16,4,3,hair);r(-12,-31,3,3,cloth);r(9,-31,3,3,cloth);}
  }

  // Body construction changes shoulder width, waist, hips and leg spacing.
  const shoulder = female?7:9;
  const waist = female?5:7;
  const hip = female?7:6;
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

  if (back) {
    // The scarf sits against the neck, beneath any hair falling over the back.
    if (a.accessory === 1) r(-6,-21,12,2,'#e5b889');
    r(-8,-34,16,12,shadow); r(-7,-34,14,11,skin);
    r(-3,-24,6,5,shadow); r(-2,-23,4,4,skin);
    r(-9,-28,2,5,shadow); r(7,-28,2,5,shadow);
  } else {
    // Keep the jaw the base skin tone. Broad dark strips below the mouth read
    // as facial hair at this resolution, especially in enlarged portraits.
    r(-6,-35,12,2,faceShade);r(-8,-33,16,11,faceShade);
    r(-7,-33,14,11,skin);r(-5,-34,10,13,skin);
    r(-6,-22,12,2,skin);r(-4,-20,8,1,skin);r(-2,-19,4,1,faceShade);
    r(-6,-32,8,6,faceLight);
    r(-9,-28,2,5,faceShade);r(7,-28,2,5,faceShade);r(-9,-27,1,2,skin);r(8,-27,1,2,skin);

      for(const eye of [-6,3]){r(eye,-28,3,4,ink);r(eye,-28,1,2,'#fff8e5');r(eye+1,-25,1,1,'#8e7674');if(female)r(eye-1,-29,4,1,ink);}
      r(-6,-23,2,1,cheek);r(4,-23,2,1,cheek);r(0,-24,1,1,faceShade);r(-1,-21,2,1,lip);
  }
  if (back) {
    // Rear silhouettes are complete layers over the clothing, without a fringe.
    if ([2,4,9].includes(style)) {
      if (style === 2) {
        r(-10,-32,20,19,hairDark); r(-9,-32,18,19,hair);
        r(-9,-13,18,3,hairDark); r(-8,-13,16,3,hair); r(-7,-10,14,1,hairDark);
      } else {
        r(-10,-32,20,22,hairDark); r(-9,-32,18,21,hair);
        lock(-12,-26,5,12); lock(7,-26,5,12);
        lock(-11,-17,6,8); lock(5,-17,6,8);
        r(-8,-11,16,2,hair); r(-6,-9,12,1,hairDark);
      }
    }
    // A rounded crown with short, curved highlights rather than front bangs.
    r(-5,-39,10,1,hairDark); r(-8,-38,16,2,hairDark); r(-9,-36,18,12,hairDark);
    r(-6,-38,12,2,hair); r(-8,-36,16,12,hair); r(-7,-24,14,1,hair);
    r(-5,-37,9,1,hairLight); r(-7,-35,4,1,hairShine); r(3,-35,3,1,hairLight);
    if (style === 0) {
      r(-9,-30,18,10,hairDark); r(-8,-31,16,10,hair);
      r(-7,-21,14,2,hairDark); r(-6,-21,12,1,hair);
      r(-6,-32,2,8,hairLight); r(4,-31,2,8,hairLight);
    }
    if (style === 1 || style === 10) {
      r(-7,-26,14,2,hair); r(-5,-24,10,2,hairDark);
      if (style === 10) {r(-6,-28,2,4,hairLight); r(3,-27,3,3,hair); r(-3,-23,6,1,hair);}
    }
    if ([2,4,9].includes(style)) {
      if (style === 2) {
        r(-6,-34,2,18,hairLight); r(3,-33,2,21,hairLight);
        r(-2,-29,1,16,hairDark); r(6,-27,1,14,hairDark);
      } else {
        for (const [px,py] of [[-6,-34],[4,-33],[-7,-27],[5,-26],[-5,-20],[3,-18],[-4,-14]]) {
          r(px,py,2,5,hairLight); r(px+1,py+4,2,2,hairLight);
        }
        r(-2,-31,1,9,hairDark); r(1,-21,1,8,hairDark);
      }
    }
    const braid = (bx,top) => {
      for (let j=0;j<5;j++) {
        const shift=j%2; r(bx+shift,top+j*3,5,4,hairDark);
        r(bx+shift,top+j*3,3,2,hairLight); r(bx+shift+2,top+j*3+1,2,2,hair);
      }
      r(bx+1,top+15,4,2,cloth); r(bx+2,top+17,2,3,hair);
    };
    if (style === 5) {
      r(-5,-29,6,2,hairLight); r(-7,-27,5,2,hairLight);
      braid(-9,-25);
    }
    if (style === 6) { braid(-10,-25); braid(5,-25); }
    if (style === 7) {
      lock(-5,-30,10,17); lock(-4,-16,8,5);
      r(-5,-30,10,2,cloth); r(-3,-27,2,11,hairLight); r(2,-25,1,10,hairDark);
      r(-2,-12,4,1,hair);
    }
    if (style === 3) {
      for (const [px,py] of [[-10,-34],[-7,-39],[-2,-40],[4,-39],[8,-34],[-11,-28],[8,-28],[-9,-23],[-4,-23],[2,-23],[6,-23]]) {
        r(px,py,4,5,hairDark); r(px,py,3,3,hair); r(px,py,2,1,hairLight);
      }
    }
    if (style === 8) {
      for (const bx of [-13,6]) { lock(bx,-39,7,8); r(bx+1,-40,5,7,hair); r(bx+1,-38,3,2,hairLight); r(bx+1,-32,5,2,cloth); }
    }
    if (style === 9) {
      r(-7,-31,4,2,hairLight); r(3,-31,4,2,hairLight);
      lock(-3,-28,6,14); r(-3,-29,6,2,cloth); r(-1,-25,1,8,hairLight);
    }
    if (style === 11) {
      lock(-14,-32,7,17); lock(7,-32,7,17);
      r(-12,-17,4,3,hair); r(8,-17,4,3,hair);
      r(-12,-32,4,2,cloth); r(8,-32,4,2,cloth);
    }
  } else {
    // A shaped cap, asymmetric fringe, fine highlights and separate side locks.
    r(-5,-39,10,1,hairDark);r(-8,-38,16,2,hairDark);r(-9,-36,18,7,hairDark);
    r(-6,-38,12,2,hair);r(-8,-36,16,5,hair);r(-8,-33,6,4,hair);r(3,-33,5,3,hair);
    r(-5,-37,8,1,hairLight);r(-7,-35,4,1,hairLight);r(-6,-36,3,1,hairShine);r(5,-35,2,2,hairLight);
    if([0,2,4,5,6,7,9].includes(style)){lock(-9,-31,3,style===0?10:8);lock(6,-31,3,style===0?10:8);}
    if(style===0){r(-8,-22,3,2,hair);r(5,-22,3,2,hair);r(-7,-30,2,3,hairLight);}
    if(style===1||style===10){r(-8,-31,2,4,hair);r(6,-31,2,3,hair);if(style===10){r(-3,-31,6,2,hair);r(-1,-29,3,2,hair);r(-2,-31,3,1,hairLight);}}
    if(style===3){for(const [px,py] of [[-10,-34],[-7,-39],[-2,-40],[4,-39],[8,-34],[-11,-28],[8,-28],[-10,-23],[7,-23]]){r(px,py,4,5,hairDark);r(px,py,3,3,hair);r(px,py,2,1,hairLight);}}
    if(style===4||style===9){r(-9,-30,2,6,hairLight);r(7,-26,2,5,hairLight);r(-10,-19,2,4,hairLight);}
    if(style===9){r(-7,-33,10,1,hairLight);r(-4,-32,5,1,hairLight);r(7,-30,3,2,cloth);r(8,-28,2,3,hairShine);}
    if(style===8){for(const bx of [-13,6]){r(bx,-39,7,8,hairDark);r(bx+1,-40,5,9,hair);r(bx+1,-38,3,2,hairLight);r(bx+1,-32,5,2,cloth);}}
  }

  if(a.accessory===1&&!back){r(-6,-21,12,2,'#e5b889');r(3,-19,3,6,'#e5b889');r(4,-19,1,5,'#f8d8a6');}
  if(a.accessory===2){r(-12,-35,24,3,'#aa8056');r(-13,-36,26,2,'#f1d49b');r(-8,-41,16,6,'#e9c58b');r(-6,-42,12,2,'#f4dba6');r(-8,-36,16,2,clothDark);r(6,-36,4,2,cloth);}
  if(a.accessory===3){const bx=side?-9:back?-12:4;r(bx,-35,4,4,clothDark);r(bx+5,-35,4,4,clothDark);r(bx,-35,3,3,clothLight);r(bx+6,-35,3,3,clothLight);r(bx+4,-34,2,2,cream);r(bx+4,-32,2,5,cloth);}
  if(a.accessory===4){const fx=side?-3:back?-8:7;for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]])r(fx+dx,-32+dy,2,2,'#ffefda');r(fx,-32,2,2,'#e4b171');r(fx+1,-29,3,1,'#a9b78b');}
  if(a.accessory===5){r(-8,-39,17,3,clothDark);r(-7,-41,13,3,cloth);r(-4,-42,9,2,clothLight);r(-9,-36,17,2,clothDark);r(2,-42,2,1,clothDark);}
  c.restore();
}
