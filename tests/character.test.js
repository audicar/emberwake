import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, STYLES } from '../core.js';
import { drawCharacter } from '../character.js';
import { PALETTES } from '../core.js';

// A tiny raster surface checks visible results, including transforms and overlap.
function render(appearance, direction='down', step=0) {
  const pixels=new Map(), stack=[];
  let tx=0,ty=0,sx=1,sy=1;
  const c={fillStyle:'',save(){stack.push([tx,ty,sx,sy]);},restore(){[tx,ty,sx,sy]=stack.pop();},translate(x,y){tx+=x*sx;ty+=y*sy;},scale(x,y){sx*=x;sy*=y;},fillRect(x,y,w,h){
    assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(w>0&&h>0);
    assert.ok(typeof this.fillStyle==='string'&&this.fillStyle!=='undefined');
    const left=tx+Math.min(x*sx,(x+w)*sx),right=tx+Math.max(x*sx,(x+w)*sx),top=ty+Math.min(y*sy,(y+h)*sy),bottom=ty+Math.max(y*sy,(y+h)*sy);
    assert.ok(left>=-18&&right<=18&&top>=-45&&bottom<=5,'sprite fits the preview and remains anchored at its feet');
    for(let py=top;py<bottom;py++)for(let px=left;px<right;px++)pixels.set(`${px},${py}`,this.fillStyle);
  }};
  drawCharacter(c,0,0,appearance,direction,step);
  assert.equal(stack.length,0,'render restores the canvas transform');
  return [...pixels].sort(([a],[b])=>a.localeCompare(b));
}
test('every hairstyle and outfit remains drawable in every walking direction', () => {
  for(let gender=0;gender<2;gender++)for(let hairStyle=0;hairStyle<STYLES.hairStyle.length;hairStyle++)for(let outfit=0;outfit<STYLES.outfit.length;outfit++)for(const direction of ['down','left','up','right']) {
    render(newState({gender,hairStyle,outfit}).appearance,direction,Math.PI/2);
  }
});
test('hairstyles, garments, accessories and body choices have visibly distinct pixels', () => {
  const base=newState({accessory:0}).appearance;
  for(const key of ['hairStyle','outfit','accessory','gender']) {
    const fingerprints=STYLES[key].map((_,i)=>JSON.stringify(render({...base,[key]:i})));
    const duplicates=STYLES[key].filter((_,i)=>fingerprints.indexOf(fingerprints[i])!==i);
    assert.equal(new Set(fingerprints).size,STYLES[key].length,`${key} options must look different; duplicates: ${duplicates.join(', ')}`);
  }
  const back=render(base,'up');assert.notDeepEqual(back,render(base,'down'));
});
test('profile hair leaves the visible eye and nose clear for every style and accessory', () => {
  for(let gender=0;gender<2;gender++)for(let hairStyle=0;hairStyle<STYLES.hairStyle.length;hairStyle++)for(let accessory=0;accessory<STYLES.accessory.length;accessory++) {
    const a=newState({gender,hairStyle,accessory}).appearance;
    for(const direction of ['right','left']) {
      const pixels=new Map(render(a,direction));
      const x=rightX=>direction==='right'?rightX:-rightX-1;
      assert.equal(pixels.get(`${x(4)},-27`),'#3b3542',`${STYLES.hairStyle[hairStyle]} must leave the ${direction} eye visible`);
      assert.equal(pixels.get(`${x(6)},-24`),PALETTES.skin[a.skin],`${STYLES.hairStyle[hairStyle]} must leave the ${direction} nose clear`);
    }
  }
});
test('left-facing hairstyles are exact reflections of their right-facing profiles', () => {
  for(let hairStyle=0;hairStyle<STYLES.hairStyle.length;hairStyle++)for(let accessory=0;accessory<STYLES.accessory.length;accessory++) {
    const a=newState({hairStyle,accessory}).appearance;
    const reflected=render(a,'right').map(([key,colour])=>{const [x,y]=key.split(',').map(Number);return [`${-x-1},${y}`,colour];}).sort(([a],[b])=>a.localeCompare(b));
    assert.deepEqual(render(a,'left'),reflected);
  }
});
test('long rear hairstyles cover the back of the clothes and respond to hair colour', () => {
  for(const hairStyle of [2,4,9])for(let gender=0;gender<2;gender++)for(let outfit=0;outfit<STYLES.outfit.length;outfit++)for(const accessory of [0,1]) {
    const a=newState({hairStyle,gender,outfit,accessory,hair:0,colour:0}).appearance;
    const normal=new Map(render(a,'up'));
    const otherCloth=new Map(render({...a,colour:3},'up'));
    const otherHair=new Map(render({...a,hair:2},'up'));
    for(const point of ['0,-20','0,-15','-3,-12']) {
      assert.equal(normal.get(point),otherCloth.get(point),`${STYLES.hairStyle[hairStyle]} must lie over the clothes at ${point}`);
      assert.notEqual(normal.get(point),otherHair.get(point),'rear hair must use the chosen hair colour');
    }
  }
});
test('each hairstyle has a distinct rear silhouette without a front-facing face', () => {
  const a=newState({accessory:0,hair:0}).appearance;
  const views=STYLES.hairStyle.map((_,hairStyle)=>render({...a,hairStyle},'up'));
  assert.equal(new Set(views.map(v=>JSON.stringify(v))).size,STYLES.hairStyle.length);
  for(const view of views) {
    const pixels=new Map(view);
    for(let y=-33;y<=-24;y++)for(let x=-6;x<6;x++)assert.notEqual(pixels.get(`${x},${y}`),PALETTES.skin[a.skin],'rear crown must cover the head');
  }
});

test('profile styles and garments remain distinct across the full skin palette', () => {
  for(let skin=0;skin<PALETTES.skin.length;skin++)for(let gender=0;gender<2;gender++)for(const direction of ['left','right']) {
    const a=newState({skin,gender,accessory:0}).appearance;
    for(const key of ['hairStyle','outfit']) {
      const views=STYLES[key].map((_,index)=>JSON.stringify(render({...a,[key]:index},direction)));
      assert.equal(new Set(views).size,STYLES[key].length,`${key} must remain distinct in ${direction} profile on skin ${skin}`);
    }
  }
});

test('profile clothing has less depth than the front-facing shoulders', () => {
  const width=(pixels,y)=>{const xs=pixels.filter(([key])=>Number(key.split(',')[1])===y).map(([key])=>Number(key.split(',')[0]));return Math.max(...xs)-Math.min(...xs)+1;};
  for(let gender=0;gender<2;gender++)for(let outfit=0;outfit<STYLES.outfit.length;outfit++) {
    const a=newState({gender,outfit,hairStyle:1,accessory:0}).appearance;
    for(const direction of ['left','right']) assert.ok(width(render(a,direction),-16)<width(render(a,'down'),-16),'the profile must turn the torso rather than retain the front-facing shoulders');
  }
});

test('profile bangs cover the forehead and the nose stays close to the cheek', () => {
  for(let skin=0;skin<PALETTES.skin.length;skin++)for(let hairStyle=0;hairStyle<STYLES.hairStyle.length;hairStyle++)for(const direction of ['left','right']) {
    const a=newState({skin,hairStyle,accessory:0}).appearance,pixels=new Map(render(a,direction));
    const x=value=>direction==='right'?value:-value-1;
    assert.equal(pixels.get(`${x(4)},-30`),PALETTES.hair[a.hair],'the fringe must extend over the profile forehead');
    for(const y of [-34,-33,-32])assert.equal(pixels.get(`${x(5)},${y}`),PALETTES.hair[a.hair],'skin must not poke through the fringe');
    for(const y of [-31,-30])for(const forehead of [1,2])assert.equal(pixels.get(`${x(forehead)},${y}`),PALETTES.hair[a.hair],'the full fringe must not leave gaps above the eye');
    assert.equal(pixels.get(`${x(6)},-24`),PALETTES.skin[skin],'the nose is a small step beyond the cheek');
    for(const tip of [7,8])assert.equal(pixels.get(`${x(tip)},-24`),undefined,'the nose must not form a long point');
  }
});
