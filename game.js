import { SAVE_KEY, PALETTES, STYLES, FLOWERS, PLOTS, QUESTS, newState, validateSave, tend, objective, awaken, isGrown, activeMainQuest, completedMainQuests, questComplete } from './core.js?v=0.5.2';
import { WORLD, blocked, drawWorld, drawCharacter } from './art.js?v=0.5.2';
import { CAST, drawSpeakerPortrait } from './cast.js?v=0.5.2';
import { inventoryItems, drawItemIcon } from './inventory.js?v=0.5.2';
import { WoodlandEncounter, TRAIL } from './combat.js?v=0.5.2';
import { drawWilds } from './wilds.js?v=0.5.2';
import { BackgroundMusic } from './music.js?v=0.5.2';
import { HOME_ENTRY, HOME_START, HOME_BED, homeBlocked, homeInteraction, drawHome } from './home.js?v=0.5.2';
import { WORKSHOP, WorkshopSequence, promotionNames } from './workshop-script.js?v=0.5.2';
import { drawWorkshop, drawWorkshopPortrait } from './workshop-art.js?v=0.5.2';

const $ = id => document.getElementById(id);
const world = $('world'), ctx = world.getContext('2d'), portrait = $('portrait').getContext('2d');
const overlays = ['creator', 'inventory', 'journal', 'map', 'menu', 'workshop'];
const panelShortcuts = { i: 'inventory', j: 'journal', m: 'map' };
let selectedInventoryItem = 'seeds';
let state = newState(), draft = { ...state.appearance }, started = false, editing = false, dialogue = null, nextAction = null, previousFocus = null;
let lastTime = 0, lastSave = 0, toastTimer, moving = false;
const music = new BackgroundMusic();
try { const savedVolume=localStorage.getItem('emberwake.music.volume'); if(savedVolume!==null)music.setVolume(Number(savedVolume)); } catch {}
const keys = new Set(), camera = { x: 0, y: 0 };
let saveProblem = '';
let creatorSection = 'you', previewDirection = 'down';
try { const saved = localStorage.getItem(SAVE_KEY); if (saved) { state = validateSave(JSON.parse(saved)); started = true; $('creator').hidden = true; } } catch { saveProblem = 'Your previous save could not be loaded. Begin a new story, or import a downloaded save from Menu afterwards.'; }
draft = { ...state.appearance };
let encounter = null;
let homeActor = state.insideHome ? { ...HOME_ENTRY, direction: 'up', walk: 0 } : null;
let workshop = null;
const workshopContext=$('workshop-canvas').getContext('2d');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let villageCompanion = { x: state.x - 18, y: state.y + 12 };

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
  $('objective').textContent = homeActor ? !state.metRowan ? 'Make yourself at home. Rowan is waiting outside.' : 'Your bed is on the east side of the cottage.' : encounter ? encounter.objective() : objective(state);
  music.setTheme(workshop ? 'workshop' : encounter ? encounter.guardianAwake && encounter.guardian.hp > 0 && !state.guardianFreed ? 'guardian' : 'woods' : 'village');
  $('place-name').textContent = homeActor ? 'Your cottage' : encounter ? 'Briarwood' : 'Hearthvale';
  $('place-description').textContent = homeActor ? 'Warm light and a quilt by the window.' : encounter ? 'A narrow path beneath old trees.' : 'Where the hills breathe in their sleep.';
  $('combat-hud').hidden = !encounter;
  document.getElementById('game').classList.toggle('in-woods', !!encounter);
  $('leave-woods').hidden = !encounter;
  $('woods-button').hidden = !!encounter;
  $('woods-button').disabled = !state.awakened;
  if(encounter) {
    const p=encounter.player;
    $('combat-hearts').textContent = '♥'.repeat(p.hp)+'♡'.repeat(p.maxHp-p.hp);
    $('combat-hearts').setAttribute('aria-label', `${p.hp} of ${p.maxHp} health`);
    $('dragon-ready').textContent = !state.dragonBonded ? 'Find the hatchling' : p.dragonCooldown > 0 ? `Ember breath · ${p.dragonCooldown.toFixed(1)}s` : 'Ember breath ready';
    $('guardian-status').hidden = !encounter.guardianAwake || state.guardianFreed;
    $('guardian-status').textContent = encounter.guardian.hp > 0 ? `Binding · ${encounter.guardian.hp}/${encounter.guardian.maxHp}` : 'Binding broken · approach with E';
  }
}
function returnHome(defeated = false) {
  encounter = null; homeActor = null; state.insideHome=false; keys.clear();
  state.x = defeated ? 160 : TRAIL.x; state.y = defeated ? 243 : 496; state.direction = 'down';
  villageCompanion = { x: state.x - 18, y: state.y + 12 };
  closeOverlays(); refresh(); save();
  if(defeated) say('rowan', ['Your little friend wouldn’t leave the path until I helped you home. There’s tea on the table. Rest a while; the woods will keep.']);
  else toast('Back in Hearthvale. Your garden has been waiting.');
}
function renderWorkshopText() {
  const beat=workshop.beat;
  $('workshop-title').textContent=WORKSHOP.title;
  $('workshop-setting').textContent=WORKSHOP.setting;
  $('workshop-speaker').textContent=beat.speaker==='player'?state.name:beat.speaker;
  $('workshop-text').textContent=beat.text;
  $('workshop-dialogue').classList.toggle('workshop-silent',beat.shot==='silence');
  $('workshop-canvas').parentElement.classList.toggle('workshop-wide',beat.shot==='establish');
  const readingNotice=beat.shot==='notice';
  $('workshop-notice').hidden=!readingNotice;
  $('workshop-canvas').parentElement.classList.toggle('workshop-reading',readingNotice);
  if(readingNotice) {
    $('workshop-promotion-names').replaceChildren(...promotionNames(state.name).map(name=>{
      const item=document.createElement('li');item.textContent=name;return item;
    }));
  }
  const hasPortrait=beat.speaker==='player'||beat.speaker==='Supervisor';
  $('workshop-portrait').hidden=!hasPortrait;
  $('workshop-dialogue').classList.toggle('has-workshop-portrait',hasPortrait);
  if(hasPortrait)drawWorkshopPortrait($('workshop-portrait'),beat.speaker==='player'?state.appearance:WORKSHOP.supervisor,beat.speaker==='player'?state.name:'the supervisor');
  $('workshop-description').textContent=beat.description||'';
  $('workshop-canvas').setAttribute('aria-label',beat.shot==='establish'?'A wide view of the workplace: your character finishes an order, coworkers put away tools and collect coats, and the supervisor sits at a separate desk. Your character walks to the promotion notice.':beat.shot==='notice'?'The workshop promotion list. Your character’s name is missing.':beat.shot==='silence'?'Your character pauses while the supervisor walks away, then returns to the unfinished order.':'Your character speaks with the supervisor beside a workbench of completed orders.');
  updateWorkshopButton();
}
function updateWorkshopButton() {
  if(!workshop)return;
  const button=$('workshop-next'),ready=workshop.ready;
  if(button.disabled!==!ready)button.disabled=!ready;
  if(ready&&document.activeElement===$('workshop'))button.focus();
  const label=!ready?'A moment…':workshop.isLast?'Continue to Hearthvale':'Continue';
  if(button.textContent!==label)button.textContent=label;
}
function startWorkshop(step=WORKSHOP.order[0]) {
  workshop=new WorkshopSequence(step);state.workshopStep=step;dialogue=null;nextAction=null;$('dialogue').hidden=true;
  homeActor=null;keys.clear();openOverlay('workshop');$('game').inert=true;
  renderWorkshopText();refresh();save();(workshop.ready?$('workshop-next'):$('workshop')).focus();
}
function finishWorkshop() {
  if(!workshop)return;
  workshop=null;state.workshopStep=null;state.insideHome=true;homeActor={...HOME_START,direction:'left',walk:0};
  $('game').inert=false;closeOverlays();refresh();save();
  say('Some days later · Aunt Wren’s letter',[
    'My love, you sounded tired in your last letter. Come spend the spring in Hearthvale. I’ll be travelling, and your old room is ready.',
    'You don’t need to know what comes next before you get here.',
    'Your cup’s by the kettle. With love, Aunt Wren',
  ],null,'Make yourself at home');
}
function advanceWorkshop() {
  if(!workshop||!workshop.advance())return;
  if(workshop.finished)return finishWorkshop();
  state.workshopStep=workshop.step;renderWorkshopText();save();
}
$('workshop-next').onclick=advanceWorkshop;
$('workshop-skip').onclick=()=>{if(workshop){workshop.skip();finishWorkshop();}};
function startExpedition() {
  state.hasBlade = true; homeActor = null; state.insideHome=false;
  encounter = new WoodlandEncounter(state, { toast, say, changed: () => { refresh(); save(); }, home: returnHome });
  keys.clear(); refresh(); save(); world.focus();
}
function offerExpedition() {
  if(!state.awakened) return toast('The southern trail is overgrown. Follow the main story to the old shrine.');
  closeOverlays();
  say('Briarwood trail', state.dragonBonded ? [
    'Your hatchling looks towards the trees. Aunt Wren’s blade is at your side. Take the woodland trail?',
  ] : [
    'A small cry carries through the trees. Beside the trail is a satchel with Aunt Wren’s old practice blade and a note: “For brambles. And whatever is tangling them.”',
    'In Briarwood, Z swings your blade, X dodges and C calls your dragon once you have made a bond. You can head home from the trail lantern or the menu.',
  ], startExpedition, 'Take the trail');
}
function enterHome() {
  state.insideHome=true;homeActor = { ...HOME_ENTRY, direction: 'up', walk: 0 }; keys.clear(); refresh(); save(); world.focus();
  if(activeMainQuest(state)?.[0]==='homecoming')say('A place for two',[
    'The hatchling stops on the threshold. You carry Aunt Wren’s spare blanket to a quiet corner and fold it twice, leaving a little hollow in the middle.',
    'It circles the blanket, glances up at you, and settles with its nose beneath one wing. A tiny curl of smoke rises. You put a second cup beside the kettle.',
  ],()=>{state.homecoming=true;save();refresh();},'Welcome home');
}
function leaveHome() {
  homeActor = null; state.insideHome=false; state.x=160; state.y=243; state.direction='down'; keys.clear(); refresh(); save(); world.focus();
}
function interactHome() {
  const target=homeInteraction(homeActor);
  if(!target)return toast('Your bed is on the east side. The wardrobe is in the north-west corner.');
  if(target.type==='exit')return leaveHome();
  if(target.type==='wardrobe')return openCreator(true);
  if(target.type==='bed')return say('Your bed',[state.homecoming ? 'From the blanket in the corner comes a small, contented snore. You pull up the quilt. Rest until morning?' : 'The quilt still has the crooked star you stitched into it years ago. Aunt Wren mended carefully around it. Rest until morning?'],()=>{
    state.day++;state.minutes=420;homeActor={...HOME_BED,direction:'down',walk:0};
    toast(state.plots.some((_,i)=>isGrown(state,i))?'Morning light. Your moonroot has grown.':'Morning light and a warm cottage.');
  },'Sleep until morning');
  if(target.type==='kettle')return say('The kitchen',['The kettle is warm. Aunt Wren left your old cup at the front of the shelf. Its handle still has the little chip you remember.']);
  if(target.type==='books')return say('Aunt Wren’s books',['Gardening, weather, mending. Almost every page has a small note in the margin. Between two well-thumbed almanacs is a thin green book: “On Listening to Dragons”.']);
  if(target.type==='notes')return say('Aunt Wren’s note',['“I mended the quilt and left the crooked star. You worked so hard on that stitch. Moonroot needs water and a night’s sleep; leave the starflowers until your first harvest. There’s room here for whoever comes home with you. — Aunt Wren”']);
}
function openOverlay(id) {
  if (!overlays.some(key => !$(key).hidden)) previousFocus = document.activeElement;
  keys.clear();
  overlays.forEach(key => $(key).hidden = key !== id);
  if (id === 'journal') renderJournal();
  if (id === 'inventory') renderInventory();
  if (id === 'map') renderMap();
  if (id === 'menu') { $('leave-woods').hidden=!encounter; $('woods-button').hidden=!!encounter; $('woods-button').disabled=!state.awakened; }
  requestAnimationFrame(() => (id==='workshop'?(workshop?.ready?$('workshop-next'):$('workshop')):$(id).querySelector('button,input'))?.focus());
}
function closeOverlays() {
  if (!started) return;
  overlays.forEach(id => $(id).hidden = true); keys.clear();
  (previousFocus?.isConnected ? previousFocus : world).focus();
}
function togglePanel(id) {
  if (!started || dialogue || !$('creator').hidden) return;
  $(id).hidden ? openOverlay(id) : closeOverlays();
}
function renderItemDetail(item) {
  $('item-kind').textContent = item.kind;
  $('item-name').textContent = item.name;
  $('item-description').textContent = item.description;
  $('item-quantity').textContent = item.quantity === 0 ? 'Not in your bag yet' : ['watering-can', 'blade'].includes(item.id) ? 'Ready to use' : `${item.quantity} in your bag`;
}
function renderInventory() {
  const items = inventoryItems(state);
  $('inventory-empty').hidden = items.some(item => item.quantity > 0);
  $('inventory-grid').replaceChildren();
  for (const item of items) {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `inventory-slot${item.quantity ? '' : ' unowned'}`;
    button.dataset.item = item.id;
    button.setAttribute('aria-label', `${item.name}, ${item.quantity} in your bag`);
    button.setAttribute('aria-pressed', String(item.id === selectedInventoryItem));
    const icon = document.createElement('canvas'); icon.width = 32; icon.height = 32; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'inventory-item-name'; label.textContent = item.name;
    const quantity = document.createElement('span'); quantity.className = 'inventory-count'; quantity.textContent = item.quantity;
    button.append(icon, label, quantity); drawItemIcon(icon, item.id);
    button.onclick = () => {
      selectedInventoryItem = item.id;
      $('inventory-grid').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      renderItemDetail(item);
    };
    $('inventory-grid').append(button);
  }
  renderItemDetail(items.find(item => item.id === selectedInventoryItem) || items[0]);
  $('inventory-outfit').textContent = `${STYLES.outfit[state.appearance.outfit]}${state.appearance.accessory ? ` · ${STYLES.accessory[state.appearance.accessory]}` : ''}`;
}
function renderMap() {
  const canvas = $('map-canvas'), c = canvas.getContext('2d');
  c.clearRect(0, 0, WORLD.width, WORLD.height); c.imageSmoothingEnabled = false;
  // Use the real world geometry, with daylight so the map stays legible at night.
  if(encounter) drawWilds(c, encounter, state, 0, { x: 0, y: 0 }, true);
  else drawWorld(c, { ...state, walk: 0, minutes: 600 }, 0, { x: 0, y: 0 }, villageCompanion);
  $('map-title').textContent = encounter ? 'Briarwood' : 'Hearthvale';
  $('map-region').textContent = encounter ? 'BRIARWOOD AND THE OLD STONE NEST' : 'THE VILLAGE AND THE EASTERN HILL';
  $('map-description').textContent = encounter ? 'The trail lantern, fallen log and old stone nest.' : 'Your cottage, the garden, and the path across the river.';
  canvas.setAttribute('aria-label', encounter ? 'Map of Briarwood. The trail home is south, the hatchling is beside the fallen log, and the guardian’s nest is north-east.' : 'Map of Hearthvale. Your cottage is west, the garden is in the centre, and the old shrine is across the eastern bridge.');
  const landmarks = encounter ? [['Trail home', 288, 546], ['Fallen log', 350, 435], ['Guardian’s nest', 620, 143]] : [
    ['Your cottage', 160, 142], ['Mira’s stitches', 368, 110],
    ['Garden · Rowan', 280, 404], ['Old shrine', 720, 117],
    ['Bridge', 585, 293], ['Meadow', 394, 470], ['Briarwood trail', TRAIL.x, 552],
  ];
  $('map-landmarks').replaceChildren();
  for (const [name, x, y] of landmarks) {
    const label = document.createElement('span'); label.className = 'map-landmark'; label.textContent = name;
    label.style.left = `${x / WORLD.width * 100}%`; label.style.top = `${y / WORLD.height * 100}%`;
    $('map-landmarks').append(label);
  }
  const showFlowers = !encounter && activeMainQuest(state)?.[0] === 'flowers';
  $('map-flowers-legend').hidden = !showFlowers;
  if(showFlowers)for(const flower of FLOWERS.filter(f=>!state.flowers.includes(f.id))) {
    const marker=document.createElement('span');marker.className='map-starflower';marker.textContent='✦';marker.setAttribute('role','img');marker.setAttribute('aria-label','Uncollected starflower');
    marker.style.left=`${flower.x/WORLD.width*100}%`;marker.style.top=`${flower.y/WORLD.height*100}%`;$('map-landmarks').append(marker);
  }
  const actor = encounter?.player ?? state;
  $('map-player').style.left = `${actor.x / WORLD.width * 100}%`;
  $('map-player').style.top = `${actor.y / WORLD.height * 100}%`;
}
function say(speaker, lines, callback = null, finalLabel = 'Back to the village') {
  const person = CAST[speaker];
  keys.clear(); dialogue = { speaker: person?.label ?? speaker, portraitId: person ? speaker : null, lines, index: 0, finalLabel }; nextAction = callback; renderDialogue();
  $('dialogue-next').focus();
}
function renderDialogue() {
  const hasPortrait = drawSpeakerPortrait($('dialogue-portrait'), dialogue.portraitId);
  $('dialogue-portrait-frame').hidden = !hasPortrait;
  $('dialogue').classList.toggle('has-portrait', hasPortrait);
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
  drawCharacter(c, 24, canvas.dataset.key === 'hairStyle' ? 43 : 46, appearance, previewDirection);
}
function renderOptions() {
  const root = $('appearance-options'); root.replaceChildren();
  const swatches = (key, label) => {
    const row=document.createElement('div');row.className='option-row';
    const name=document.createElement('span');name.className='option-label';name.textContent=label;
    const choices=document.createElement('div');choices.className='swatches';choices.setAttribute('role','group');choices.setAttribute('aria-label',label);
    const colours=PALETTES[key].map((colour,index)=>({colour,index}));
    if(key==='skin') {
      const brightness=hex=>hex.slice(1).match(/../g).reduce((sum,channel,i)=>sum+parseInt(channel,16)*[.2126,.7152,.0722][i],0);
      colours.sort((a,b)=>brightness(b.colour)-brightness(a.colour));
    }
    colours.forEach(({colour,index},position)=>{const b=document.createElement('button');b.type='button';b.className='swatch';b.style.setProperty('--swatch',colour);b.dataset.appearance=key;b.dataset.choice=index;b.setAttribute('aria-label',`${label} ${position+1}`);b.setAttribute('aria-pressed',String(draft[key]===index));b.onclick=()=>updateAppearance(key,index);choices.append(b);});
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
document.querySelectorAll('[data-facing]').forEach(b=>b.onclick=()=>{previewDirection=b.dataset.facing;document.querySelectorAll('[data-facing]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));$('appearance-options').querySelectorAll('canvas[data-key]').forEach(drawChoice);drawPortrait();});
$('character-form').onsubmit = event => {
  event.preventDefault();const name=$('character-name').value.trim();
  if(!name){$('character-name').setCustomValidity('Give your character a name.');$('character-name').reportValidity();return;}
  $('character-name').setCustomValidity('');
  if(editing){state.name=name;state.appearance={...draft};closeOverlays();save();toast('A fresh look. Still very much you.');}
  else {state=newState(draft);state.x=160;state.y=243;state.insideHome=true;encounter=null;homeActor=null;villageCompanion={x:state.x-18,y:state.y+12};state.name=name;started=true;closeOverlays();startWorkshop();}
  refresh();
};
$('character-name').oninput=()=>{$('character-name').setCustomValidity('');drawPortrait();};
$('cancel-creator').onclick=closeOverlays;
function renderJournal() {
  $('journal-list').replaceChildren();
  function appendQuest(quest,parent,complete=false) {
    const [key,title,description,category]=quest;
    const done=complete||questComplete(state,key),item=document.createElement('div');item.className=`quest${done?' done':''}`;
    const check=document.createElement('span');check.className='quest-check';check.textContent=done?'✓':'';check.setAttribute('aria-label',done?'Complete':'Incomplete');
    const copy=document.createElement('div'),line=document.createElement('div');line.className='quest-title';
    const heading=document.createElement('h4');heading.textContent=title;
    const badge=document.createElement('span');badge.className=`quest-tag ${category}`;badge.textContent=category==='main'?'Main story':'Optional';
    const text=document.createElement('p');text.textContent=description;line.append(heading,badge);copy.append(line,text);item.append(check,copy);parent.append(item);
  }
  const mainHeading=document.createElement('h3');mainHeading.className='quest-group';mainHeading.textContent='Current main quest';$('journal-list').append(mainHeading);
  const current=activeMainQuest(state);
  if(current)appendQuest(current,$('journal-list'));
  else {const note=document.createElement('p');note.className='chapter-note';note.textContent='Opening chapter complete. Your hatchling has a home here. The next part of the story is still to come.';$('journal-list').append(note);}
  const completed=completedMainQuests(state);
  if(completed.length){const history=document.createElement('details');history.className='quest-history';const summary=document.createElement('summary');summary.textContent=`Completed main quests · ${completed.length}`;history.append(summary);for(const quest of completed)appendQuest(quest,history,true);$('journal-list').append(history);}
  const optionalHeading=document.createElement('h3');optionalHeading.className='quest-group';optionalHeading.textContent='Village life · optional';$('journal-list').append(optionalHeading);
  for(const quest of QUESTS.filter(q=>q[3]==='optional'))appendQuest(quest,$('journal-list'));
  $('journal-inventory').textContent = `${state.seeds} moonroot seeds · ${state.moonroot} moonroot · ${state.awakened?0:state.flowers.length} starflowers${state.metRowan?' · watering can':''}`;
}
function nearest() {
  const things=[
    {...CAST.rowan,type:'rowan',label:'Talk to Rowan'},
    {...CAST.mira,type:'mira',label:'Talk to Mira'},
    {x:160,y:235,type:'home',label:'Enter your cottage'},
    {x:368,y:203,type:'tailor',label:'Visit the wardrobe'},
    {x:720,y:193,type:'shrine',label:'Listen at the old shrine'},
    {x:338,y:278,type:'well',label:'Look into the well'},
    {x:430,y:288,type:'sign',label:'Read the signpost'},
    {...TRAIL,type:'trail',label:'Take the Briarwood trail'},
    ...PLOTS.map((p,i)=>({...p,id:i,type:'plot',label:isGrown(state,i)?'Harvest moonroot':!state.plots[i]?'Plant a moonroot':!state.plots[i].watered?'Water the moonroot':'Check your moonroot'})),
    ...FLOWERS.filter(f=>!state.flowers.includes(f.id)).map(f=>({...f,type:'flower',label:'Gather a starflower'})),
  ];
  return things.map(t=>({...t,distance:Math.hypot(t.x-state.x,t.y-state.y)})).filter(t=>t.distance<33).sort((a,b)=>a.distance-b.distance)[0];
}
function interact() {
  if(dialogue)return advanceDialogue();if(isPaused()||!started)return;
  if(homeActor) return interactHome();
  if(encounter) { if(!encounter.interact()) toast('Move closer to the hatchling, guardian or trail lantern.'); return; }
  const t=nearest();if(!t)return toast('Wander a little closer to someone or something.');
  if(t.type==='trail') return offerExpedition();
  if(t.type==='rowan'){
    if(!state.metRowan)say('rowan',[
      `You must be ${state.name}. I’m Rowan. My aunt’s a friend of your Aunt Wren. She asked if I could help you get settled.`,
      'I brought seeds and a watering can. I wasn’t sure what you’d want to grow, so I picked something easy. Here — these are yours.',
      'The three dark beds just beside me are yours. Plant a seed, water it, then go inside your cottage and rest in the bed. Moonroot only needs one good night.',
      'And those pale starflowers? Pick a few if you see them. Aunt Wren used to take three to the old shrine across the bridge. Said the hill slept easier afterwards.',
    ],()=>{state.metRowan=true;state.seeds=3;toast('Received: 3 moonroot seeds and a watering can.');});
    else say('rowan', [state.awakened?'The garden’s doing well. So’s the mountain, by the sound of it. Funny how those things go together.':!state.harvested?'Plant, water, sleep. You can’t hurry a moonroot. Cottage is north-west, with the red roof.':'A fine first harvest. Take a moonroot and three starflowers to the shrine, over the eastern bridge. If you feel like it.']);
  }
  if(t.type==='mira') {state.metMira=true;say('mira', [state.awakened?'I heard a noise from the hill last night. Rather like a very large cat purring. I suppose we’re keeping it?':'Welcome! My wardrobe’s always open — just walk up to the blue-roofed cottage. Everyone deserves clothes that feel like themselves.']);}
  if(t.type==='tailor')openCreator(true);
  if(t.type==='flower'){if(!state.harvested)return say('A starflower',['The flower holds a little warmth. Aunt Wren’s note said to leave these growing until your first harvest.']);state.flowers.push(t.id);toast(`Starflower gathered · ${state.flowers.length}/3. A little warm against your palm.`);}
  if(t.type==='plot')toast(tend(state,t.id));
  if(t.type==='home')return enterHome();
  if(t.type==='shrine'){
    if(state.awakened)say('dragon',[`${state.name}. A name to remember. I shall dream of rain for your garden. You may stay as long as you like.`]);
    else if(awaken(state))say('dragon',[
      'You set the moonroot and three starflowers in the bowl. The stone warms beneath your hand. Far above, something opens one golden eye.',
      `At last. ${state.name}. I knew you by the way you tended something small.`,
      state.dragonBonded ? 'Emberkeeper. Dragon tamer. Your little friend knows what those words mean already. Keep this place alive, together.' : 'They will call you the Emberkeeper. There is a little dragon lost in Briarwood. Find it. You have much to learn from each other.',
      'The briars across the southern trail loosen. Briarwood is open to you now. Follow the little cry beneath its trees.',
    ],()=>{toast('The Emberkeeper · A little cry carries from Briarwood.');});
    else say('The old shrine',[state.harvested?'Three starflowers and a moonroot, says the weathered stone. The air smells faintly of rain.':'An old inscription: “For the one who tends the living, the dreamer shall wake.” A carved bowl waits for a moonroot and three starflowers.']);
  }
  if(t.type==='well')say('The village well',['Clear water. A small reflection. For half a second, you think there are two golden eyes beside yours. Then just the sky.']);
  if(t.type==='sign')say('A very old signpost',['West: your cottage. South: the village garden and meadow. East, across the bridge: the old shrine. Underneath, in smaller letters: “Please don’t feed the mountain.”']);
  refresh();save();
}

for (const id of ['inventory', 'journal', 'map']) $(id + '-button').onclick = () => togglePanel(id);
$('settings-button').onclick = () => togglePanel('menu');
$('journal-inventory-button').onclick = () => togglePanel('inventory');
$('inventory-wardrobe').onclick = () => openCreator(true);
$('woods-button').onclick = offerExpedition;
$('leave-woods').onclick = () => encounter?.leave(false);
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeOverlays);
overlays.forEach(id=>$(id).addEventListener('click',event=>{if(event.target===$(id)&&!['creator','workshop'].includes(id))closeOverlays();}));
$('wardrobe').onclick=()=>openCreator(true);
$('save-button').onclick=()=>{$('menu-status').textContent=save()?'Progress saved on this device.':'Browser storage is unavailable. Download your save instead.';};
$('export-save').onclick=()=>{const {walk,...data}=state;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`emberwake-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('menu-status').textContent='Save downloaded. Keep it somewhere safe.';};
$('import-save').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>30000)throw new Error('That file is too large to be a game save.');const incoming=validateSave(JSON.parse(await file.text()));if(!confirm('Replace the current story with this save? Download your current save first if you want to keep it.'))return;state=incoming;encounter=null;homeActor=state.insideHome?{...HOME_ENTRY,direction:'up',walk:0}:null;villageCompanion={x:state.x-18,y:state.y+12};started=true;closeOverlays();save();refresh();if(state.workshopStep!==null)startWorkshop(state.workshopStep);else toast('Your story, right where you left it.');}catch(error){$('menu-status').textContent=error instanceof SyntaxError?'This file is not valid JSON.':error.message;}finally{event.target.value='';}};
$('restart').onclick=()=>{if(!confirm('Start a new story? Your current local save will be replaced when you begin. Download it first if you want to keep it.'))return;openCreator(false);};

async function toggleSound() {
  try {
    const enabled = await music.toggle();
    $('sound').setAttribute('aria-pressed', String(enabled));
    $('sound').textContent = enabled ? 'Music on' : 'Music off';
    $('workshop-sound').setAttribute('aria-pressed',String(enabled));
    $('workshop-sound').textContent=enabled?'Music on':'Music off';
  } catch { toast('Background music is unavailable in this browser.'); }
}
$('music-volume').value = Math.round(music.volume * 100);
$('music-volume-value').textContent = `${Math.round(music.volume * 100)}%`;
$('music-volume').oninput = event => {
  music.setVolume(Number(event.target.value) / 100);
  $('music-volume-value').textContent = `${event.target.value}%`;
  try { localStorage.setItem('emberwake.music.volume', String(music.volume)); } catch {}
};
$('sound').onclick=toggleSound;
$('workshop-sound').onclick=toggleSound;
const directionKeys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
window.addEventListener('keydown',event=>{
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  // Keep focus within open modal panels without interfering with name entry.
  const active=overlays.find(id=>!$(id).hidden);
  if(event.key==='Tab'&&active){const focusables=[...$(active).querySelectorAll('button:not([hidden]),input:not([type=file])')].filter(e=>!e.disabled&&e.getClientRects().length);const first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
  if(event.target instanceof HTMLInputElement){if(event.key==='Escape'&&active&&(active!=='creator'||editing)){event.preventDefault();closeOverlays();}return;}
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(workshop) {
    if(key==='Escape'){event.preventDefault();if(!event.repeat){workshop.skip();finishWorkshop();}return;}
    if(['e',' ','Enter'].includes(key)) {
      if(key!=='e'&&event.target instanceof HTMLButtonElement&&event.target.id!=='workshop-next')return;
      event.preventDefault();if(!event.repeat)advanceWorkshop();
    }
    return;
  }
  if(key==='Escape'){event.preventDefault();keys.clear();if(dialogue){dialogue=null;nextAction=null;$('dialogue').hidden=true;refresh();save();world.focus();}else if(active)closeOverlays();else if(started)openOverlay('menu');return;}
  if (panelShortcuts[key] && started && !dialogue && active !== 'creator') {
    event.preventDefault(); if (!event.repeat) togglePanel(panelShortcuts[key]); return;
  }
  if(active)return;
  if(['z','x','c'].includes(key) && encounter && !dialogue) {
    event.preventDefault(); if(key==='z') keys.add('attack');
    if(!event.repeat) encounter.command(key); return;
  }
  if(directionKeys[key]){event.preventDefault();if(!dialogue)keys.add(directionKeys[key]);return;}
  if(['e',' ','Enter'].includes(key)){event.preventDefault();if(!event.repeat)interact();}
});
window.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;if(directionKeys[key])keys.delete(directionKeys[key]);if(key==='z')keys.delete('attack');});
window.addEventListener('blur',()=>{keys.clear();save();});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden)save();music.setVisible(!document.hidden);});
window.addEventListener('pagehide',save);
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);keys.add(b.dataset.dir);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(b.dataset.dir));});
$('touch-interact').onclick=interact;
document.querySelectorAll('[data-combat]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);if(!encounter||isPaused())return;encounter.command(button.dataset.combat);if(button.dataset.combat==='z')keys.add('attack');});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>{if(button.dataset.combat==='z')keys.delete('attack');});
});

function resize(){const box=$('landscape').getBoundingClientRect();const zoom=Math.max(1.5,box.width/WORLD.width,box.height/WORLD.height);world.width=Math.round(box.width/zoom);world.height=Math.round(box.height/zoom);ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',resize);resize();
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  if(workshop){
    if(!document.hidden){workshop.update(dt);updateWorkshopButton();drawWorkshop(workshopContext,workshop,state,reducedMotion);}
    requestAnimationFrame(tick);return;
  }
  moving=false;
  if(started&&!isPaused()&&!document.hidden){
    if(encounter) {
      if(keys.has('attack')) encounter.command('z');
      encounter.update(dt,keys);
    } else if(homeActor) {
      let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
      if(dx||dy){homeActor.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const n=Math.hypot(dx,dy);dx=dx/n*76*dt;dy=dy/n*76*dt;if(!homeBlocked(homeActor.x+dx,homeActor.y))homeActor.x+=dx;if(!homeBlocked(homeActor.x,homeActor.y+dy))homeActor.y+=dy;}
      homeActor.walk=dx||dy?(homeActor.walk||0)+dt*11:0;state.minutes=Math.min(state.minutes+dt*1.3,1430);
    } else {
      let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
      if(dx||dy){state.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';const n=Math.hypot(dx,dy);dx=dx/n*67*dt;dy=dy/n*67*dt;
        if(!blocked(state.x+dx,state.y)){state.x+=dx;moving=true;}if(!blocked(state.x,state.y+dy)){state.y+=dy;moving=true;}
      }
      state.walk=moving?(state.walk||0)+dt*11:0;state.minutes=Math.min(state.minutes+dt*1.3,1430);
      const petDistance=Math.hypot(state.x-villageCompanion.x,state.y-villageCompanion.y);
      if(petDistance>140){villageCompanion.x=state.x-18;villageCompanion.y=state.y+12;}
      else if(petDistance>24){const dx=(state.x-villageCompanion.x)/petDistance*90*dt,dy=(state.y-villageCompanion.y)/petDistance*90*dt;if(!blocked(villageCompanion.x+dx,villageCompanion.y))villageCompanion.x+=dx;if(!blocked(villageCompanion.x,villageCompanion.y+dy))villageCompanion.y+=dy;}
    }
    if(time-lastSave>10000){save();lastSave=time;}
    refresh();
  }
  world.setAttribute('aria-label',homeActor?'Your cottage. Move with the arrow keys and press E beside your bed to sleep.':encounter?'Briarwood. Move with arrows, hold Z to attack, press X to dodge and C to command your dragon.':'Hearthvale. Move with arrows, E to interact, I inventory, J journal and M map.');
  const actor=homeActor ?? encounter?.player ?? state;
  camera.x=Math.max(0,Math.min(WORLD.width-world.width,Math.round(actor.x-world.width/2)));
  camera.y=Math.max(0,Math.min(WORLD.height-world.height,Math.round(actor.y-world.height*.52)));
  if(homeActor&&world.width>=420&&world.height>=352){camera.x=Math.max(0,Math.min(WORLD.width-world.width,416-world.width/2));camera.y=Math.max(0,Math.min(WORLD.height-world.height,325-world.height/2));}
  ctx.clearRect(0,0,world.width,world.height);
  if(homeActor)drawHome(ctx,homeActor,state,time,camera);else if(encounter) drawWilds(ctx,encounter,state,time,camera); else drawWorld(ctx,state,time,camera,villageCompanion);
  const nearby=started&&!isPaused()?(homeActor?homeInteraction(homeActor):encounter?(encounter.hint()?{label:encounter.hint()}:null):nearest()):null;$('interact-hint').hidden=!nearby;if(nearby)$('interact-hint').querySelector('span').textContent=nearby.label;
  requestAnimationFrame(tick);
}
// Reject a saved location inside scenery, for example after a map revision.
if(blocked(state.x,state.y)){state.x=272;state.y=278;}
renderOptions();refresh();requestAnimationFrame(tick);
if(saveProblem){toast(saveProblem);$('save-status').textContent='Previous save could not be loaded';}
if(started&&state.workshopStep!==null)startWorkshop(state.workshopStep);
else if(started){world.focus();toast(`Welcome back, ${state.name}. The kettle’s still warm.`);}else $('character-name').focus();
