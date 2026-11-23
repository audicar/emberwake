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
      assert.equal(pixels.get(`${x(7)},-24`),PALETTES.skin[a.skin],`${STYLES.hairStyle[hairStyle]} must leave the ${direction} nose clear`);
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
