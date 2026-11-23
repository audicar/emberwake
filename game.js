import { SAVE_KEY, PALETTES, STYLES, FLOWERS, PLOTS, QUESTS, newState, validateSave, tend, objective, awaken, isGrown } from './core.js';
import { WORLD, blocked, drawWorld, drawCharacter } from './art.js?v=0.2.2';

const $ = id => document.getElementById(id);
const world = $('world'), ctx = world.getContext('2d'), portrait = $('portrait').getContext('2d');
const overlays = ['creator', 'journal', 'menu'];
let state = newState(), draft = { ...state.appearance }, started = false, editing = false, dialogue = null, nextAction = null, previousFocus = null;
let lastTime = 0, lastSave = 0, toastTimer, moving = false, soundContext, soundGain, soundEnabled = false;
const keys = new Set(), camera = { x: 0, y: 0 };
let saveProblem = '';
let creatorSection = 'you', previewDirection = 'down';
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
function setCreatorSection(section) {
  creatorSection = section;
  document.querySelectorAll('[data-section]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.section === section)));
  renderOptions();
}
function updateAppearance(key, index) {
  draft[key] = index;
  document.querySelectorAll(`[data-appearance="${key}"]`).forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.choice) === index)));
  // A colour or body change also updates every hairstyle and clothing thumbnail.
  document.querySelectorAll('#appearance-options canvas').forEach(canvas => drawChoice(canvas));
  drawPortrait();
}
function drawChoice(canvas) {
  const appearance = { ...draft, [canvas.dataset.key]: Number(canvas.dataset.index) };
  const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  drawCharacter(c, 24, canvas.dataset.key === 'hairStyle' ? 43 : 46, appearance);
}
function renderOptions() {
  const root = $('appearance-options'); root.replaceChildren();
  const swatches = (key, label) => {
    const row=document.createElement('div');row.className='option-row';
    const name=document.createElement('span');name.className='option-label';name.textContent=label;
    const choices=document.createElement('div');choices.className='swatches';choices.setAttribute('role','group');choices.setAttribute('aria-label',label);
    PALETTES[key].forEach((colour,i)=>{const b=document.createElement('button');b.type='button';b.className='swatch';b.style.setProperty('--swatch',colour);b.dataset.appearance=key;b.dataset.choice=i;b.setAttribute('aria-label',`${label} ${i+1}`);b.setAttribute('aria-pressed',String(draft[key]===i));b.onclick=()=>updateAppearance(key,i);choices.append(b);});
    row.append(name,choices);root.append(row);
  };
  const heading = (title, text) => {const h=document.createElement('h3');h.className='customise-heading';h.textContent=title;const p=document.createElement('p');p.className='customise-help';p.textContent=text;root.append(h,p);};
  const cards = key => {
    const grid=document.createElement('div');grid.className='choice-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label',key==='hairStyle'?'Hairstyle':'Outfit');
    STYLES[key].forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='choice-card';b.dataset.appearance=key;b.dataset.choice=i;b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(draft[key]===i));
      const canvas=document.createElement('canvas');canvas.width=48;canvas.height=key==='hairStyle'?32:52;canvas.dataset.key=key;canvas.dataset.index=i;canvas.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.textContent=name;b.append(canvas,label);b.onclick=()=>updateAppearance(key,i);grid.append(b);drawChoice(canvas);
    });root.append(grid);
  };
  if(creatorSection==='you'){
    heading('A face for your story', 'Choose your character. Every hairstyle and outfit is yours to try.');
    const gender=document.createElement('div');gender.className='gender-options';gender.setAttribute('role','group');gender.setAttribute('aria-label','Character gender');
    STYLES.gender.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.dataset.appearance='gender';b.dataset.choice=i;b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(draft.gender===i));const canvas=document.createElement('canvas');canvas.width=48;canvas.height=52;canvas.dataset.key='gender';canvas.dataset.index=i;canvas.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=name;b.append(canvas,label);b.onclick=()=>updateAppearance('gender',i);gender.append(b);drawChoice(canvas);});root.append(gender);
    swatches('skin','Skin tone');
  }else if(creatorSection==='hair'){
    swatches('hair','Hair colour');heading('A little tousled, a little you', 'Braids, buns, soft waves — find your favourite.');cards('hairStyle');
  }else{
    swatches('colour','Cloth colour');cards('outfit');
    const row=document.createElement('div');row.className='option-row';const label=document.createElement('span');label.className='option-label';label.textContent='Finishing touch';const choices=document.createElement('div');choices.className='accessory-options';choices.setAttribute('role','group');choices.setAttribute('aria-label','Accessory');
    STYLES.accessory.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.appearance='accessory';b.dataset.choice=i;b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(draft.accessory===i));b.onclick=()=>updateAppearance('accessory',i);choices.append(b);});row.append(label,choices);root.append(row);
  }
  drawPortrait();
}
function drawPortrait() {
  portrait.clearRect(0,0,128,160);portrait.imageSmoothingEnabled=false;
  const r=(x,y,w,h,colour)=>{portrait.fillStyle=colour;portrait.fillRect(x,y,w,h);};
  // A tiny spring garden behind the wardrobe preview, drawn on the same pixel grid.
  r(0,0,128,160,'#b4c8ba');r(0,51,128,109,'#94ad88');
  for(let i=0;i<8;i++){const x=i*19-12,y=38+(i%3)*4;r(x,y,28,30,'#7c9b7c');r(x+4,y-6,20,42,'#7c9b7c');r(x+3,y+10,17,5,'#88a584');}
  r(0,83,128,77,'#9eaf82');r(0,84,128,2,'#c5cba0');
  for(let x=2;x<128;x+=12){r(x,72,3,23,'#dfcfaa');r(x+1,71,1,1,'#f8e7c6');}r(0,78,128,3,'#e4d4b2');r(0,89,128,2,'#d1c098');
  for(let y=101;y<160;y+=9)for(let x=3;x<128;x+=11){if((x+y)%3){r(x,y,2,1,'#b8c394');r(x+2,y-2,1,2,'#80966e');}}
  r(35,132,58,3,'#768e6b');r(31,135,66,2,'#8da176');
  for(const [x,y] of [[14,116],[111,119],[22,145],[103,147]]){r(x,y,1,5,'#728d66');r(x-1,y-2,3,3,'#f8e5d2');r(x,y-1,1,1,'#d8b279');}
  drawCharacter(portrait,64,134,draft,previewDirection,0,3);
  $('portrait-name').textContent=$('character-name').value.trim()||'Your character';
  $('portrait-look').textContent=STYLES.outfit[draft.outfit];
}
$('creator-tabs').addEventListener('click',event=>{const b=event.target.closest('[data-section]');if(b)setCreatorSection(b.dataset.section);});
document.querySelectorAll('[data-facing]').forEach(b=>b.onclick=()=>{previewDirection=b.dataset.facing;document.querySelectorAll('[data-facing]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));drawPortrait();});
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
$('character-name').oninput=()=>{$('character-name').setCustomValidity('');drawPortrait();};
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
