import { SAVE_KEY, PALETTES, STYLES, FLOWERS, PLOTS, QUESTS, newState, validateSave, tend, objective, awaken, isGrown } from './core.js';
import { WORLD, blocked, drawWorld, drawCharacter } from './art.js';

const $ = id => document.getElementById(id);
const world = $('world'), ctx = world.getContext('2d'), portrait = $('portrait').getContext('2d');
const overlays = ['creator', 'journal', 'menu'];
let state = newState(), draft = { ...state.appearance }, started = false, editing = false, dialogue = null, nextAction = null, previousFocus = null;
let lastTime = 0, lastSave = 0, toastTimer, moving = false, soundContext, soundGain, soundEnabled = false;
const keys = new Set(), camera = { x: 0, y: 0 };
let saveProblem = '';
try { const saved = localStorage.getItem(SAVE_KEY); if (saved) { state = validateSave(JSON.parse(saved)); started = true; $('creator').hidden = true; } } catch { saveProblem = 'Your previous save could not be loaded. Begin a new story, or import a downloaded save from Menu afterwards.'; }
draft = { ...state.appearance };

function isPaused() { return overlays.some(id => !$(id).hidden) || !!dialogue; }
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 4400); }
function save() {
  if (!started) return false;
  const { walk, ...serialised } = state;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialised)); $('save-status').textContent = 'Saved on this device'; return true; }
  catch { $('save-status').textContent = 'Saving unavailable · download a save from Menu'; return false; }
}
function refresh() {
  $('season').textContent = `SPRING · DAY ${state.day}`;
  const minutes = Math.floor(state.minutes / 10) * 10;
  $('clock').textContent = `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
  $('objective').textContent = objective(state);
}
function openOverlay(id) {
  previousFocus = document.activeElement; keys.clear();
  overlays.forEach(key => $(key).hidden = key !== id);
  if (id === 'journal') renderJournal();
  requestAnimationFrame(() => $(id).querySelector('button,input')?.focus());
}
function closeOverlays() {
  if (!started) return;
  overlays.forEach(id => $(id).hidden = true); keys.clear();
  (previousFocus?.isConnected ? previousFocus : world).focus();
}
function say(speaker, lines, callback = null, finalLabel = 'Back to the village') {
  keys.clear(); dialogue = { speaker, lines, index: 0, finalLabel }; nextAction = callback; renderDialogue();
  $('dialogue-next').focus();
}
function renderDialogue() {
  $('dialogue').hidden = false; $('speaker').textContent = dialogue.speaker;
  $('dialogue-text').textContent = dialogue.lines[dialogue.index];
  $('dialogue-next').textContent = dialogue.index === dialogue.lines.length-1 ? `${dialogue.finalLabel} [E]` : 'Continue [E]';
}
function advanceDialogue() {
  if (!dialogue) return;
  if (++dialogue.index < dialogue.lines.length) return renderDialogue();
  dialogue = null; $('dialogue').hidden = true;
  const action = nextAction; nextAction = null; action?.(); refresh(); save(); world.focus();
}
$('dialogue-next').onclick = advanceDialogue;
function openCreator(edit = false) {
  editing = edit; draft = { ...state.appearance }; $('character-name').value = state.name;
  $('creator-title').textContent = edit ? 'A little change?' : 'Who will you be?';
  $('begin-button').textContent = edit ? 'Keep this look ✦' : 'Begin your quiet adventure ✦';
  $('cancel-creator').hidden = !edit; renderOptions(); openOverlay('creator');
}
function renderOptions() {
  $('appearance-options').replaceChildren();
  for (const [key, label] of [['skin','Skin tone'],['hair','Hair colour'],['hairStyle','Hairstyle'],['outfit','Clothes'],['colour','Cloth colour'],['accessory','Accessory']]) {
    const row = document.createElement('div'); row.className = 'option-row';
    const name = document.createElement('span'); name.className = 'option-label'; name.textContent = label; row.append(name);
    const controls = document.createElement('div'); controls.setAttribute('role','group'); controls.setAttribute('aria-label',label);
    if (PALETTES[key]) {
      controls.className = 'swatches';
      PALETTES[key].forEach((colour,i) => { const b=document.createElement('button');b.type='button';b.className='swatch';b.style.setProperty('--swatch',colour);b.setAttribute('aria-label',`${label} ${i+1}`);b.setAttribute('aria-pressed',String(draft[key]===i));b.onclick=()=>{draft[key]=i; controls.querySelectorAll('button').forEach((btn,j)=>btn.setAttribute('aria-pressed',String(i===j)));drawPortrait();};controls.append(b); });
    } else {
      controls.className = 'cycle';
      const text=document.createElement('span');text.textContent=STYLES[key][draft[key]];text.setAttribute('aria-live','polite');
      const makeButton=(offset,glyph)=>{const b=document.createElement('button');b.type='button';b.textContent=glyph;b.setAttribute('aria-label',`${offset<0?'Previous':'Next'} ${label.toLowerCase()}`);b.onclick=()=>{draft[key]=(draft[key]+offset+STYLES[key].length)%STYLES[key].length;text.textContent=STYLES[key][draft[key]];drawPortrait();};return b;};
      controls.append(makeButton(-1,'‹'),text,makeButton(1,'›'));
    }
    row.append(controls);$('appearance-options').append(row);
  }
  drawPortrait();
}
function drawPortrait() {
  portrait.clearRect(0,0,96,112);portrait.imageSmoothingEnabled=false;
  portrait.fillStyle='#435c3d';portrait.fillRect(17,91,62,3);portrait.fillStyle='#759054';portrait.fillRect(24,89,49,2);
  drawCharacter(portrait,48,91,draft,'down',0,2.5);
}
$('character-form').onsubmit = event => {
  event.preventDefault();const name=$('character-name').value.trim();
  if(!name){$('character-name').setCustomValidity('Give your character a name.');$('character-name').reportValidity();return;}
  $('character-name').setCustomValidity('');
  if(editing){state.name=name;state.appearance={...draft};closeOverlays();save();toast('A fresh look. Still very much you.');}
  else {state=newState(draft);state.name=name;started=true;closeOverlays();save();say('A letter left on the kitchen table',[
    `${name}, the cottage is yours. The roof holds, the kettle works, and Rowan has promised to help with the garden.`,
    'One small thing: if you hear the mountain dreaming, don’t be frightened. It has been waiting a very long time for someone who can listen.',
    'For now, just find your feet. Rowan is by the garden, a little south of the square. — With love, Aunt Wren',
  ]);}
  refresh();
};
$('character-name').oninput=()=>$('character-name').setCustomValidity('');
$('cancel-creator').onclick=closeOverlays;
function renderJournal() {
  $('journal-list').replaceChildren();
  for(const [key,title,description] of QUESTS){const done=key==='flowers'?state.flowers.length===3:state[key];const item=document.createElement('div');item.className=`quest${done?' done':''}`;const check=document.createElement('span');check.className='quest-check';check.textContent=done?'✓':'';check.setAttribute('aria-label',done?'Complete':'Incomplete');const copy=document.createElement('div');const heading=document.createElement('h3');heading.textContent=title;const text=document.createElement('p');text.textContent=description;copy.append(heading,text);item.append(check,copy);$('journal-list').append(item);}
  $('inventory').textContent = `${state.seeds} moonroot seeds · ${state.moonroot} moonroot · ${state.awakened?0:state.flowers.length} starflowers${state.metRowan?' · watering can':''}`;
}
function nearest() {
  const things=[
    {x:236,y:311,type:'rowan',label:'Talk to Rowan'},
    {x:402,y:222,type:'mira',label:'Talk to Mira'},
    {x:160,y:235,type:'home',label:'Rest at your cottage'},
    {x:368,y:203,type:'tailor',label:'Visit the wardrobe'},
    {x:720,y:193,type:'shrine',label:'Listen at the old shrine'},
    {x:338,y:278,type:'well',label:'Look into the well'},
    {x:430,y:288,type:'sign',label:'Read the signpost'},
    ...PLOTS.map((p,i)=>({...p,id:i,type:'plot',label:isGrown(state,i)?'Harvest moonroot':!state.plots[i]?'Plant a moonroot':!state.plots[i].watered?'Water the moonroot':'Check your moonroot'})),
    ...FLOWERS.filter(f=>!state.flowers.includes(f.id)).map(f=>({...f,type:'flower',label:'Gather a starflower'})),
  ];
  return things.map(t=>({...t,distance:Math.hypot(t.x-state.x,t.y-state.y)})).filter(t=>t.distance<33).sort((a,b)=>a.distance-b.distance)[0];
}
function interact() {
  if(dialogue)return advanceDialogue();if(isPaused()||!started)return;
  const t=nearest();if(!t)return toast('Wander a little closer to someone or something.');
  if(t.type==='rowan'){
    if(!state.metRowan)say('Rowan · village gardener',[
      `You must be ${state.name}. Wren said you’d come. Here — three moonroot seeds and a watering can. A decent beginning, I reckon.`,
      'The three dark beds just beside me are yours. Plant a seed, water it, then sleep at your cottage. Moonroot only needs one good night.',
      'And those pale starflowers? Pick a few if you see them. Wren used to take three to the old shrine across the bridge. Said the hill slept easier afterwards.',
    ],()=>{state.metRowan=true;state.seeds=3;toast('Received: 3 moonroot seeds and a watering can.');});
    else say('Rowan', [state.awakened?'The garden’s doing well. So’s the mountain, by the sound of it. Funny how those things go together.':!state.harvested?'Plant, water, sleep. You can’t hurry a moonroot. Cottage is north-west, with the red roof.':'A fine first harvest. Take a moonroot and three starflowers to the shrine, over the eastern bridge. If you feel like it.']);
  }
  if(t.type==='mira') {state.metMira=true;say('Mira · village tailor', [state.awakened?'I heard a noise from the hill last night. Rather like a very large cat purring. I suppose we’re keeping it?':'Welcome! My wardrobe’s always open — just walk up to the blue-roofed cottage. Everyone deserves clothes that feel like themselves.']);}
  if(t.type==='tailor')openCreator(true);
  if(t.type==='flower'){state.flowers.push(t.id);toast(`Starflower gathered · ${state.flowers.length}/3. A little warm against your palm.`);}
  if(t.type==='plot')toast(tend(state,t.id));
  if(t.type==='home'){
    say('Your little cottage',['The kettle has gone quiet. A folded quilt waits by the window. Rest here until morning?'],()=>{
      state.day++;state.minutes=420;state.x=160;state.y=243;state.direction='down';
      toast(state.plots.some((_,i)=>isGrown(state,i))?'A new morning. Your moonroot has grown.':'Morning light, warm tea, and nowhere you have to be.');
    },'Sleep until morning');
  }
  if(t.type==='shrine'){
    if(state.awakened)say('The dream beneath the hill',[`${state.name}. A name to remember. I shall dream of rain for your garden. You may stay as long as you like.`]);
    else if(awaken(state))say('The dream beneath the hill',[
      'You set the moonroot and three starflowers in the bowl. The stone warms beneath your hand. Far above, something opens one golden eye.',
      `At last. ${state.name}. I knew you by the way you tended something small.`,
      'They will call you the Emberkeeper. They will expect a sword, perhaps. But I have no need of a sword. I need someone to keep this place alive.',
      'Begin with your garden. I will begin with the rain.',
    ],()=>{toast('Chapter one complete · You are the Emberkeeper. Stay a while.');});
    else say('The old shrine',[state.harvested?'Three starflowers and a moonroot, says the weathered stone. The air smells faintly of rain.':'An old inscription: “For the one who tends the living, the dreamer shall wake.” A carved bowl waits for a moonroot and three starflowers.']);
  }
  if(t.type==='well')say('The village well',['Clear water. A small reflection. For half a second, you think there are two golden eyes beside yours. Then just the sky.']);
  if(t.type==='sign')say('A very old signpost',['West: your cottage. South: the village garden and meadow. East, across the bridge: the old shrine. Underneath, in smaller letters: “Please don’t feed the mountain.”']);
  refresh();save();
}

$('journal-button').onclick=()=>started&&(!$('journal').hidden?closeOverlays():openOverlay('journal'));
$('settings-button').onclick=()=>started&&(!$('menu').hidden?closeOverlays():openOverlay('menu'));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeOverlays);
overlays.forEach(id=>$(id).addEventListener('click',event=>{if(event.target===$(id)&&id!=='creator')closeOverlays();}));
$('wardrobe').onclick=()=>openCreator(true);
$('save-button').onclick=()=>{$('menu-status').textContent=save()?'Progress saved on this device.':'Browser storage is unavailable. Download your save instead.';};
$('export-save').onclick=()=>{const {walk,...data}=state;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`emberwake-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('menu-status').textContent='Save downloaded. Keep it somewhere safe.';};
$('import-save').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>30000)throw new Error('That file is too large to be a game save.');const incoming=validateSave(JSON.parse(await file.text()));if(!confirm('Replace the current story with this save? Download your current save first if you want to keep it.'))return;state=incoming;started=true;closeOverlays();save();refresh();toast('Your story, right where you left it.');}catch(error){$('menu-status').textContent=error instanceof SyntaxError?'This file is not valid JSON.':error.message;}finally{event.target.value='';}};
$('restart').onclick=()=>{if(!confirm('Start a new story? Your current local save will be replaced when you begin. Download it first if you want to keep it.'))return;openCreator(false);};

function toggleSound(){
  if(!soundContext){try{soundContext=new(window.AudioContext||window.webkitAudioContext)();soundGain=soundContext.createGain();soundGain.gain.value=0;soundGain.connect(soundContext.destination);[130.81,196,261.63,329.63].forEach((frequency,i)=>{const tone=soundContext.createOscillator(),gain=soundContext.createGain();tone.type='sine';tone.frequency.value=frequency;gain.gain.value=i===0?.18:.045;tone.connect(gain);gain.connect(soundGain);tone.start();const lfo=soundContext.createOscillator(),depth=soundContext.createGain();lfo.frequency.value=.04+i*.013;depth.gain.value=.018;lfo.connect(depth);depth.connect(gain.gain);lfo.start();});}catch{return toast('Ambient sound is unavailable in this browser.');}}
  soundEnabled=!soundEnabled;soundContext.resume();soundGain.gain.setTargetAtTime(soundEnabled?.22:0,soundContext.currentTime,.4);$('sound').setAttribute('aria-pressed',String(soundEnabled));$('sound').textContent=soundEnabled?'Sound on':'Sound off';
}
$('sound').onclick=toggleSound;
const directionKeys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
window.addEventListener('keydown',event=>{
  // Keep focus within open modal panels without interfering with name entry.
  const active=overlays.find(id=>!$(id).hidden);
  if(event.key==='Tab'&&active){const focusables=[...$(active).querySelectorAll('button:not([hidden]),input:not([type=file])')].filter(e=>e.getClientRects().length);const first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
  if(event.target instanceof HTMLInputElement){if(event.key==='Escape'&&editing)closeOverlays();return;}
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(key==='Escape'){event.preventDefault();keys.clear();if(dialogue){dialogue=null;nextAction=null;$('dialogue').hidden=true;refresh();save();world.focus();}else if(active)closeOverlays();else if(started)openOverlay('menu');return;}
  if((key==='j')&&started&&!dialogue&&(!active||active==='journal')){event.preventDefault();if(event.repeat)return;active?closeOverlays():openOverlay('journal');return;}
  if(active)return;
  if(directionKeys[key]){event.preventDefault();if(!dialogue)keys.add(directionKeys[key]);return;}
  if(['e',' ','Enter'].includes(key)){event.preventDefault();if(!event.repeat)interact();}
});
window.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;if(directionKeys[key])keys.delete(directionKeys[key]);});
window.addEventListener('blur',()=>{keys.clear();save();});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden){save();soundContext?.suspend();}else if(soundEnabled)soundContext?.resume();});
window.addEventListener('pagehide',save);
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);keys.add(b.dataset.dir);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(b.dataset.dir));});
$('touch-interact').onclick=interact;

function resize(){const box=$('landscape').getBoundingClientRect();const zoom=Math.max(1.5,box.width/WORLD.width,box.height/WORLD.height);world.width=Math.round(box.width/zoom);world.height=Math.round(box.height/zoom);ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',resize);resize();
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  moving=false;
  if(started&&!isPaused()&&!document.hidden){
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
    if(dx||dy){state.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const n=Math.hypot(dx,dy);dx=dx/n*67*dt;dy=dy/n*67*dt;
      if(!blocked(state.x+dx,state.y)){state.x+=dx;moving=true;}if(!blocked(state.x,state.y+dy)){state.y+=dy;moving=true;}
    }
    state.walk=moving?(state.walk||0)+dt*11:0;state.minutes=Math.min(state.minutes+dt*1.3,1430);
    if(time-lastSave>10000){save();lastSave=time;}
    refresh();
  }
  camera.x=Math.max(0,Math.min(WORLD.width-world.width,Math.round(state.x-world.width/2)));
  camera.y=Math.max(0,Math.min(WORLD.height-world.height,Math.round(state.y-world.height*.52)));
  ctx.clearRect(0,0,world.width,world.height);drawWorld(ctx,state,time,camera);
  const nearby=started&&!isPaused()?nearest():null;$('interact-hint').hidden=!nearby;if(nearby)$('interact-hint').querySelector('span').textContent=nearby.label;
  requestAnimationFrame(tick);
}
// Reject a saved location inside scenery, for example after a map revision.
if(blocked(state.x,state.y)){state.x=272;state.y=278;}
renderOptions();refresh();requestAnimationFrame(tick);
if(saveProblem){toast(saveProblem);$('save-status').textContent='Previous save could not be loaded';}
if(started){world.focus();toast(`Welcome back, ${state.name}. The kettle’s still warm.`);}else $('character-name').focus();
