import { SAVE_KEY, PALETTES, STYLES, FLOWERS, PLOTS, QUESTS, newState, validateSave, tend, objective, awaken, isGrown, activeMainQuest, completedMainQuests, questComplete } from './core.js?v=0.8.0';
import { WORLD, blocked, drawWorld, drawCharacter } from './art.js?v=0.8.0';
import { CAST, drawSpeakerPortrait } from './cast.js?v=0.8.0';
import { inventoryItems, drawItemIcon } from './inventory.js?v=0.8.0';
import { WoodlandEncounter, TRAIL } from './combat.js?v=0.8.0';
import { drawWilds } from './wilds.js?v=0.8.0';
import { BackgroundMusic } from './music.js?v=0.8.0';
import { HOME_ENTRY, HOME_BED, homeBlocked, homeInteraction, drawHome } from './home.js?v=0.8.0';
import { WORKSHOP, WorkshopSequence, promotionNames } from './workshop-script.js?v=0.8.0';
import { drawWorkshop, drawWorkshopPortrait } from './workshop-art.js?v=0.8.0';
import { drawJourney } from './journey-art.js?v=0.8.0';
import { COTTAGE_MEMORIES, rememberCottageObject, createRowanActor, updateRowan, finishRowanIntroduction, finishRiverVisit, receiveGardenSeeds } from './settling.js?v=0.8.0';
import { MillChapter, LOWER_TRAIL, blessingCount, hasRiverstep, beginMorning, CLUES, TOPICS } from './chapter.js?v=0.8.0';
import { drawMillChapter } from './chapter-art.js?v=0.8.0';

const $ = id => document.getElementById(id);
const world = $('world'), ctx = world.getContext('2d'), portrait = $('portrait').getContext('2d');
const overlays = ['creator', 'inventory', 'journal', 'map', 'menu', 'workshop'];
const panelShortcuts = { i: 'inventory', j: 'journal', m: 'map' };
let selectedInventoryItem = 'seeds';
let state = newState(), draft = { ...state.appearance }, started = false, editing = false, dialogue = null, nextAction = null, previousFocus = null;
let lastTime = 0, lastSave = 0, toastTimer, moving = false;
const music = new BackgroundMusic();
let musicRestore=false,musicBusy=false;
try { const savedVolume=localStorage.getItem('emberwake.music.volume'); if(savedVolume!==null)music.setVolume(Number(savedVolume)); } catch {}
try { musicRestore=localStorage.getItem('emberwake.music.enabled')==='true'; } catch {}
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
let rowanActor=createRowanActor(state);
let mill=state.chapter.region?new MillChapter(state,millEvents()):null,homeMoment=null;
const freeDash={time:0,cooldown:0,direction:'down',safe:null};
if(mill){homeActor=null;state.insideHome=false;}

function isPaused() { return overlays.some(id => !$(id).hidden) || !!dialogue; }
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 4400); }
function save() {
  if (!started) return false;
  const { walk, ...serialised } = state;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialised)); $('save-status').textContent = 'Saved on this device'; return true; }
  catch { $('save-status').textContent = 'Saving unavailable · download a save from Menu'; return false; }
}
function refresh() {
  const adventure=mill||encounter;
  $('season').textContent = `SPRING · DAY ${state.day}`;
  const minutes = Math.floor(state.minutes / 10) * 10;
  $('clock').textContent = `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
  $('objective').textContent = homeActor ? homeMoment?.kind==='reunion'?'Your little friend is home. Stay a little while.':state.chapter.stage===11?'The kettle, your blanket, and a little company. Take your time.':state.chapter.stage===1?'Approach your hatchling’s blanket and press E.':state.homecoming&&state.chapter.stage===0?'Sleep in your bed. Tomorrow can begin slowly.':!state.metRowan?'Take a moment with your things, if you like. E looks closer. Step outside whenever you’re ready.':'Your bed is on the east side of the cottage.' : adventure?adventure.objective():objective(state);
  music.setTheme(workshop ? workshop.isJourney ? 'journey' : 'workshop' : mill?mill.fighting?'guardian':mill.region==='return'?'journey':'woods':encounter ? encounter.guardianAwake && encounter.guardian.hp > 0 && !state.guardianFreed ? 'guardian' : 'woods' : 'village');
  $('place-name').textContent = homeActor ? 'Your cottage' : mill?mill.title:encounter ? 'Briarwood' : 'Hearthvale';
  $('place-description').textContent = homeActor ? 'Warm light and a quilt by the window.' : mill?mill.region==='mill'?'Old timbers. New bindings. A voice beneath the wheel.':mill.region==='return'?'A narrow channel, and the way home.':'The thorns have opened a way downstream.':encounter ? 'A narrow path beneath old trees.' : 'Where the hills breathe in their sleep.';
  $('blessings-hud').hidden=!state.dragonBonded;$('blessings-count').textContent=blessingCount(state);
  $('game').classList.toggle('has-riverstep',hasRiverstep(state));
  $('game').classList.toggle('cottage-reunion',homeMoment?.kind==='reunion');
  $('combat-hud').hidden = mill?!mill.fighting:!encounter;
  document.getElementById('game').classList.toggle('in-woods', !!adventure);
  $('leave-woods').hidden = !adventure;
  $('woods-button').hidden = !!adventure;
  $('woods-button').textContent=state.chapter.stage>=4&&state.chapter.stage<11?'Follow the lower woodland path':'Explore Briarwood';
  $('woods-button').disabled = !state.awakened;
  if(adventure) {
    const p=adventure.player;
    $('combat-hearts').textContent = '♥'.repeat(p.hp)+'♡'.repeat(p.maxHp-p.hp);
    $('combat-hearts').setAttribute('aria-label', `${p.hp} of ${p.maxHp} health`);
    $('dragon-ready').textContent = !state.dragonBonded ? 'Find the hatchling' : p.dragonCooldown > 0 ? `Ember breath · ${p.dragonCooldown.toFixed(1)}s` : 'Ember breath ready';
    $('guardian-status').hidden = mill?!mill.fighting:!encounter.guardianAwake || state.guardianFreed;
    $('guardian-status').textContent = mill?`Bindings broken · ${state.chapter.anchors.filter(n=>n===0).length}/3`:encounter.guardian.hp > 0 ? `Binding · ${encounter.guardian.hp}/${encounter.guardian.maxHp}` : 'Binding broken · approach with E';
    $('combat-hud').querySelector('.eyebrow').textContent=mill?'THE LOWER VALLEY':'BRIARWOOD EXPEDITION';
    if(mill&&hasRiverstep(state))$('dragon-ready').textContent=`Riverstep ready · right-click / X${p.dashCooldown>0?' · recovering':''}`;
  }
}
function millEvents(){return {toast,say,changed:()=>{refresh();save();},home:leaveMillChapter};}
function worldDodge(){
  if(!hasRiverstep(state)||freeDash.cooldown>0||isPaused())return false;
  const actor=homeActor||state;freeDash.time=.3;freeDash.cooldown=1.05;freeDash.direction=actor.direction;freeDash.safe={x:actor.x,y:actor.y};return true;
}
function moveWanderer(actor,dt,isBlocked,speed){
  const v={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up')),dashing=freeDash.time>0;
  if(dashing){[dx,dy]=v[freeDash.direction];dt=Math.min(dt,freeDash.time);freeDash.time=Math.max(0,freeDash.time-dt);speed=300;}
  else if(dx||dy)actor.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  let moved=false;
  if(dx||dy){const n=Math.hypot(dx,dy),mx=dx/n*speed*dt,my=dy/n*speed*dt,steps=Math.max(1,Math.ceil(Math.hypot(mx,my)/2));for(let i=0;i<steps;i++){if(!isBlocked(actor.x+mx/steps,actor.y,dashing)){actor.x+=mx/steps;moved=true;}if(!isBlocked(actor.x,actor.y+my/steps,dashing)){actor.y+=my/steps;moved=true;}}}
  if(dashing&&freeDash.time===0&&isBlocked(actor.x,actor.y))Object.assign(actor,freeDash.safe);
  actor.walk=moved?(actor.walk||0)+dt*11:0;return moved;
}
function startMillChapter(){
  if(state.chapter.stage<4||state.chapter.stage>=11)return;
  homeActor=null;state.insideHome=false;encounter=null;mill=new MillChapter(state,millEvents());keys.clear();closeOverlays();refresh();save();world.focus();
}
function leaveMillChapter(defeated=false){
  mill=null;state.insideHome=false;state.chapter.region=null;homeActor=null;keys.clear();state.x=LOWER_TRAIL.x;state.y=LOWER_TRAIL.y;state.direction='up';
  villageCompanion={x:state.x-18,y:state.y+12};rowanActor={...createRowanActor(state),x:490,y:480,place:'river',arrived:false,route:[]};
  refresh();save();world.focus();
  if(defeated)say('rowan',['Easy. Your little friend came straight back to me when you fell.','You’re safe. We can rest and try again. The bindings you broke will stay broken.'],null,'Rest a while');
  else toast(state.chapter.stage>=10?'The cottage is up the western lane.':'Your route and discoveries are saved. You can return whenever you like.');
}
function morningHatchling(){
  homeMoment={kind:'morning',elapsed:0};
  const done=()=>{state.chapter.stage=2;homeMoment=null;refresh();save();};
  say('hatchling',['A scratching sound comes from the blanket. Your hatchling tugs at a loose thread, backs away when the whole blanket follows, then tries again.','It notices you watching. After careful consideration, it brings you the thread.'],()=>say('hatchling',['You offer your palm. It leaves the thread there and rests its warm chin on your fingers.','When you stand, it catches your sleeve. You stop. After a moment, it lets go and follows you towards the door.'],done,'Stand together'),'Offer your hand','Watch quietly',()=>say('hatchling',['You stay beside the blanket. Eventually it sits against your shoe, satisfied that you understand its discovery.','When you stand, it catches your sleeve, then lets go and follows.'],done,'Stand together'));
}
function riverConversation(){
  const topics=state.chapter.topics,next=TOPICS.find(t=>!topics.includes(t));
  if(!next)return hearRiverCall();
  const labels={fishing:'Ask about fishing',village:'Ask about the village',days:'Ask about his days'};
  say('rowan',[next==='fishing'?'Please don’t help. I’m already losing an argument with that fish.':next==='village'?'The village is less sleepy than it looks. Mostly because Mira starts moving furniture whenever she has a new idea.':'You can stay here as long as you like. I’m enjoying the excuse to sit.'],()=>{
    const lines={fishing:['My aunt taught me the knots. The fish are still refusing the rest of the lesson.','I make notes about the birds while I’m waiting. The kingfishers came back last week. Same branch as last spring.'],village:['Mira and I used to race from her cottage to the bridge. She still insists the year I won doesn’t count.','If she offers you her blue chair, take the cushion first. She means to fix that spring eventually.'],days:['I help my aunt with deliveries, mend nets when they need it, and come down here when they don’t.','I like the river early. Nothing much happens, but you notice different things each day.']};
    say('rowan',lines[next],()=>{topics.push(next);riverConversation();},'Stay a little longer');
  },labels[next],'Sit and listen to the water',()=>say('By the river',['You settle beside Rowan. The hatchling watches the float, then tries to watch every ripple at once.','For a while, there is only the sound of the water.'],hearRiverCall,'Listen'));
}
function hearRiverCall(){
  say('hatchling',['Its wings go still. A thin call carries upstream. Your hatchling answers.','Another call comes back from somewhere beyond the trees. It looks from the lower path to you.'],()=>say('rowan',['The old watermill is down that way. The guardian’s thorns have pulled back from the lower path.','I know the route. I’ll come with you. The sign is on this bank, south of here.'],()=>{state.chapter.stage=4;refresh();save();},'Follow the answering call'));
}
function reuniteAtHome(){
  homeActor={x:465,y:450,direction:'down',walk:0};homeMoment={kind:'reunion',elapsed:0};state.minutes=Math.max(state.minutes,1080);
  refresh();
  say('hatchling',['There is a scrape at the door.','Your hatchling is outside, muddy and out of breath, carrying an entirely unsuitable stick.','It squeezes past you, circles its blanket and settles down. You sit beside it. Its tail comes to rest across your foot.'],()=>{state.chapter.stage=11;homeMoment=null;homeActor={x:465,y:450,direction:'right',walk:0};refresh();save();toast('The path back · Your little friend came home.');},'Stay a little while');
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
  $('workshop-title').textContent=workshop.isJourney?WORKSHOP.journey.title:WORKSHOP.title;
  $('workshop-setting').textContent=beat.setting||(workshop.isJourney?WORKSHOP.journey.setting:WORKSHOP.setting);
  $('workshop').classList.toggle('workshop-journey',workshop.isJourney);
  $('workshop-speaker').textContent=beat.speaker==='player'?state.name:beat.speaker;
  $('workshop-text').textContent=beat.text;
  $('workshop-dialogue').classList.toggle('workshop-silent',['silence','first-spring','new-idea','shared-method','finished-order','fold-letter','open-road'].includes(beat.shot));
  $('workshop-canvas').parentElement.classList.toggle('workshop-wide',['establish','first-spring','new-idea','trusted','shared-method','winter-late','finished-order'].includes(beat.shot)||workshop.isJourney);
  const readingNotice=beat.shot==='notice';
  const readingLetter=beat.shot==='letter';
  $('workshop-notice').hidden=!readingNotice;
  $('workshop-letter').hidden=!readingLetter;
  $('workshop').classList.toggle('workshop-letter-open',readingLetter);
  $('workshop-canvas').parentElement.classList.toggle('workshop-reading',readingNotice||readingLetter);
  if(readingNotice) {
    $('workshop-promotion-names').replaceChildren(...promotionNames(state.name).map(name=>{
      const item=document.createElement('li');item.textContent=name;return item;
    }));
  }
  if(readingLetter) {
    $('workshop-letter-salutation').textContent=WORKSHOP.invitation.salutation;
    $('workshop-letter-body').replaceChildren(...WORKSHOP.invitation.paragraphs.map((text,index)=>{
      const p=document.createElement('p');p.textContent=text;if(index===1)p.className='invitation-key';return p;
    }));
    $('workshop-letter-signoff').textContent=WORKSHOP.invitation.signoff;
    $('workshop-letter-signature').textContent=WORKSHOP.invitation.signature;
  }
  const hasPortrait=beat.speaker==='player'||beat.speaker==='Supervisor';
  $('workshop-portrait').hidden=!hasPortrait;
  $('workshop-dialogue').classList.toggle('has-workshop-portrait',hasPortrait);
  if(hasPortrait)drawWorkshopPortrait($('workshop-portrait'),beat.speaker==='player'?state.appearance:WORKSHOP.supervisor,beat.speaker==='player'?state.name:'the supervisor');
  $('workshop-description').textContent=beat.description||'';
  $('workshop-canvas').setAttribute('aria-label',beat.description||(beat.shot==='establish'?'A wide view of the workplace: your character finishes an order, coworkers put away tools and collect coats, and the supervisor sits at a separate desk. Your character walks to the promotion notice.':beat.shot==='notice'?'The workshop promotion list. Your character’s name is missing.':'Your character speaks with the supervisor beside a workbench of completed orders.'));
  updateWorkshopButton();
}
function updateWorkshopButton() {
  if(!workshop)return;
  const button=$('workshop-next'),ready=workshop.ready;
  button.disabled=false;
  if(document.activeElement===$('workshop'))button.focus();
  const label=!ready?'Finish this moment':workshop.beat.nextLabel||(workshop.isLast?'Continue to Hearthvale':'Continue');
  button.title=ready?'Press E, Space or Enter to continue':'Press E to finish the animation; press again to continue';
  const caption=$('workshop-next-label');
  if(caption.textContent!==label)caption.textContent=label;
}
function startWorkshop(step=WORKSHOP.order[0]) {
  workshop=new WorkshopSequence(step);state.workshopStep=step;dialogue=null;nextAction=null;$('dialogue').hidden=true;
  homeActor=null;keys.clear();openOverlay('workshop');$('game').inert=true;
  renderWorkshopText();refresh();save();(workshop.ready?$('workshop-next'):$('workshop')).focus();
}
function finishWorkshop() {
  if(!workshop)return;
  workshop=null;state.workshopStep=null;state.insideHome=true;homeActor={...HOME_ENTRY,direction:'up',walk:0};
  $('game').inert=false;closeOverlays();refresh();save();
  toast('Hearthvale. Your old cup is waiting on the table.');
}
function advanceWorkshop() {
  if(!workshop)return;
  if(workshop.finishMoment()){updateWorkshopButton();return;}
  if(!workshop.advance())return;
  if(workshop.finished)return finishWorkshop();
  state.workshopStep=workshop.step;renderWorkshopText();refresh();save();
}
$('workshop-next').onclick=advanceWorkshop;
function skipOpeningScene() {
  if(!workshop)return;
  if(!workshop.isJourney)return startWorkshop(WORKSHOP.journey.firstStep);
  workshop.skip();finishWorkshop();
}
$('workshop-skip').onclick=skipOpeningScene;
function startExpedition() {
  state.hasBlade = true; homeActor = null; state.insideHome=false;
  encounter = new WoodlandEncounter(state, { toast, say, changed: () => { refresh(); save(); }, home: returnHome });
  keys.clear(); refresh(); save(); world.focus();
}
function offerExpedition() {
  if(state.chapter.stage>=4&&state.chapter.stage<11)return startMillChapter();
  if(!state.awakened)return say('Briarwood trail',['KEEP OUT. Briarwood trail closed. The brambles have swallowed the path.'],null,'Step back');
  closeOverlays();
  say('Briarwood trail', state.dragonBonded ? [
    'Your hatchling looks towards the trees. Aunt Wren’s blade is at your side. Take the woodland trail?',
  ] : [
    'A small cry carries through the trees. Beside the trail is a satchel with Aunt Wren’s old practice blade and a note: “For brambles. And whatever is tangling them.”',
    'In Briarwood, left-click swings your blade and right-click dodges. Z and X also work. Turn with the movement keys; C calls your dragon once you have made a bond. You can head home from the trail lantern or the menu.',
  ], startExpedition, 'Take the trail');
}
function enterHome() {
  state.insideHome=true;homeActor = { ...HOME_ENTRY, direction: 'up', walk: 0 }; keys.clear(); refresh(); save(); world.focus();
  if(state.chapter.stage===10)return reuniteAtHome();
  if(activeMainQuest(state)?.[0]==='homecoming')say('A place for two',[
    'The hatchling stops on the threshold. You carry Aunt Wren’s spare blanket to a quiet corner and fold it twice, leaving a little hollow in the middle.',
    'It circles the blanket, glances up at you, and settles with its nose beneath one wing. A tiny curl of smoke rises. You put a second cup beside the kettle.',
  ],()=>{state.homecoming=true;save();refresh();},'Welcome home');
}
function leaveHome() {
  homeActor = null; state.insideHome=false; state.x=160; state.y=243; state.direction='down'; keys.clear(); refresh(); save(); world.focus();
}
function interactHome() {
  if(state.chapter.stage===1&&Math.hypot(homeActor.x-492,homeActor.y-450)<46)return morningHatchling();
  const target=homeInteraction(homeActor);
  if(!target)return toast('Your bed is on the east side. The wardrobe is in the north-west corner.');
  if(target.type==='exit')return leaveHome();
  if(target.type==='wardrobe')return openCreator(true);
  if(COTTAGE_MEMORIES[target.type]) {
    const memory=COTTAGE_MEMORIES[target.type];
    const lines=target.type==='alarmClock'&&state.clockUnwound?['The winding key is resting beside the clock.']:target.type==='workNotebook'&&state.workNotebookRead?['Your notebook is open at the first page. You remember how excited you were.']:memory.lines;
    return say(memory.title,lines,()=>rememberCottageObject(state,target.type),target.type==='alarmClock'&&state.clockUnwound?'Leave it there':memory.action,'Step away');
  }
  if(target.type==='bed')return say('Your bed',[state.homecoming ? 'From the blanket in the corner comes a small, contented snore. You pull up the quilt. Rest until morning?' : 'The quilt still has the crooked star you stitched into it years ago. Aunt Wren mended carefully around it. Rest until morning?'],()=>{
    state.day++;state.minutes=420;homeActor={...HOME_BED,direction:'down',walk:0};
    toast(beginMorning(state)?'A scratching sound comes from your hatchling’s blanket.':state.plots.some((_,i)=>isGrown(state,i))?'Morning light. Your moonroot has grown.':'Morning light and a warm cottage.');
  },'Sleep until morning','Not now');
  if(target.type==='kettle')return say('The kitchen',['Aunt Wren left your old cup on the table beside her note. Its handle still has the little chip you remember.']);
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
  if (id === 'menu') { $('leave-woods').hidden=!(mill||encounter); $('woods-button').hidden=!!(mill||encounter); $('woods-button').disabled=!state.awakened; }
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
  if(mill)drawMillChapter(c,mill,state,0,{x:0,y:0},true);
  else if(encounter) drawWilds(c, encounter, state, 0, { x: 0, y: 0 }, true);
  else drawWorld(c, { ...state, walk: 0, minutes: 600 }, 0, { x: 0, y: 0 }, villageCompanion,rowanActor);
  $('map-title').textContent = mill?mill.title:encounter ? 'Briarwood' : 'Hearthvale';
  $('map-region').textContent = mill?'THE LOWER VALLEY':encounter ? 'BRIARWOOD AND THE OLD STONE NEST' : 'THE VILLAGE AND THE EASTERN HILL';
  $('map-description').textContent = mill?mill.objective():encounter ? 'The trail lantern, fallen log and old stone nest.' : 'Your cottage, the garden, and the path across the river.';
  canvas.setAttribute('aria-label',mill?`Map of ${mill.title}. ${mill.objective()}`:encounter ? 'Map of Briarwood. The trail home is south, the hatchling is beside the fallen log, and the guardian’s nest is north-east.' : 'Map of Hearthvale. Your cottage is west, the garden is in the centre, and the old shrine is across the eastern bridge.');
  const landmarks = mill?mill.landmarks():encounter ? [['Trail home', 288, 546], ['Fallen log', 350, 435], ['Guardian’s nest', 620, 143]] : [
    ['Your cottage', 160, 142], ['Mira’s stitches', 368, 110],
    ['Village garden', 280, 404], ['Old shrine', 720, 117],
    ['Bridge', 585, 293], ['Meadow', 394, 470], ['Briarwood trail', TRAIL.x, 552],
  ];
  if(!mill&&!encounter&&state.metRowan)landmarks.push(['Rowan',rowanActor.x,rowanActor.y-45]);
  if(!mill&&!encounter&&state.chapter.stage>=4)landmarks.push(['Lower woodland path',LOWER_TRAIL.x,LOWER_TRAIL.y]);
  $('map-landmarks').replaceChildren();
  for (const [name, x, y] of landmarks) {
    const label = document.createElement('span'); label.className = 'map-landmark'; label.textContent = name;
    label.style.left = `${x / WORLD.width * 100}%`; label.style.top = `${y / WORLD.height * 100}%`;
    $('map-landmarks').append(label);
  }
  const showFlowers = !mill&&!encounter && activeMainQuest(state)?.[0] === 'flowers';
  $('map-flowers-legend').hidden = !showFlowers;
  if(showFlowers)for(const flower of FLOWERS.filter(f=>!state.flowers.includes(f.id))) {
    const marker=document.createElement('span');marker.className='map-starflower';marker.textContent='✦';marker.setAttribute('role','img');marker.setAttribute('aria-label','Uncollected starflower');
    marker.style.left=`${flower.x/WORLD.width*100}%`;marker.style.top=`${flower.y/WORLD.height*100}%`;$('map-landmarks').append(marker);
  }
  const actor = mill?.player??encounter?.player ?? state;
  $('map-player').style.left = `${actor.x / WORLD.width * 100}%`;
  $('map-player').style.top = `${actor.y / WORLD.height * 100}%`;
}
function say(speaker, lines, callback = null, finalLabel = 'Continue', cancelLabel = null, cancelAction = null) {
  const person = CAST[speaker];
  keys.clear(); dialogue = { speaker: person?.label ?? speaker, portraitId: person ? speaker : null, lines, index: 0, finalLabel, cancelLabel, cancelAction }; nextAction = callback; renderDialogue();
  $('dialogue-next').focus();
}
function renderDialogue() {
  const hasPortrait = drawSpeakerPortrait($('dialogue-portrait'), dialogue.portraitId);
  $('dialogue-portrait-frame').hidden = !hasPortrait;
  $('dialogue').classList.toggle('has-portrait', hasPortrait);
  $('dialogue').hidden = false; $('speaker').textContent = dialogue.speaker;
  $('dialogue-text').textContent = dialogue.lines[dialogue.index];
  $('dialogue-next').textContent = dialogue.index === dialogue.lines.length-1 ? `${dialogue.finalLabel} [E]` : 'Continue [E]';
  $('dialogue-cancel').hidden=!dialogue.cancelLabel;
  if(dialogue.cancelLabel)$('dialogue-cancel').textContent=`${dialogue.cancelLabel} [Esc]`;
}
function cancelDialogue() {
  if(!dialogue)return;
  const action=dialogue.cancelAction;
  dialogue=null;nextAction=null;keys.clear();$('dialogue').hidden=true;
  action?.();refresh();save();if(!dialogue)world.focus();
}
function advanceDialogue() {
  if (!dialogue) return;
  if (++dialogue.index < dialogue.lines.length) return renderDialogue();
  dialogue = null; $('dialogue').hidden = true;
  const action = nextAction; nextAction = null; action?.(); refresh(); save();if(!dialogue)world.focus();
}
$('dialogue-next').onclick = advanceDialogue;
$('dialogue-cancel').onclick = cancelDialogue;
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
  else {state=newState(draft);state.x=160;state.y=243;state.insideHome=true;encounter=null;mill=null;homeMoment=null;homeActor=null;rowanActor=createRowanActor(state);villageCompanion={x:state.x-18,y:state.y+12};state.name=name;started=true;closeOverlays();startWorkshop();}
  refresh();
};
$('character-name').oninput=()=>{$('character-name').setCustomValidity('');drawPortrait();};
$('cancel-creator').onclick=closeOverlays;
function renderJournal() {
  $('journal-list').replaceChildren();
  if(state.dragonBonded){const gifts=document.createElement('section');gifts.className='blessing-notes';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=`Dragon Blessings · ${blessingCount(state)}`;p.textContent=hasRiverstep(state)?'Riverstep awakened. Face a direction and right-click or press X to glide farther. Cross narrow streams from marked stones.':`${blessingCount(state)===1?'The hatchling’s warmth remains in your palm.':'The hatchling and the guardian have each blessed you.'} A third blessing may awaken something more.`;gifts.append(h,p);$('journal-list').append(gifts);}
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
  else {const note=document.createElement('p');note.className='chapter-note';note.textContent='The path back is complete. Your hatchling came home. The north-road survey marks are the next lead; the journey beyond the ridge is still to come.';$('journal-list').append(note);}
  const completed=completedMainQuests(state);
  if(completed.length){const history=document.createElement('details');history.className='quest-history';const summary=document.createElement('summary');summary.textContent=`Completed main quests · ${completed.length}`;history.append(summary);for(const quest of completed)appendQuest(quest,history,true);$('journal-list').append(history);}
  const optionalHeading=document.createElement('h3');optionalHeading.className='quest-group';optionalHeading.textContent='Village life · optional';$('journal-list').append(optionalHeading);
  for(const quest of QUESTS.filter(q=>q[3]==='optional'))appendQuest(quest,$('journal-list'));
  if(state.chapter.clues.length){const h=document.createElement('h3');h.className='quest-group';h.textContent='Discoveries to remember';$('journal-list').append(h);for(const id of state.chapter.clues){const p=document.createElement('p');p.className='clue-note';p.textContent=CLUES[id];$('journal-list').append(p);}}
  $('journal-inventory').textContent = `${state.seeds} moonroot seeds · ${state.moonroot} moonroot · ${state.awakened?0:state.flowers.length} starflowers${state.receivedSeeds?' · watering can':''}`;
}
function offerGardenSeeds() {
  say('rowan',[
    'I keep the little garden in the square. There are some empty beds if you fancy growing anything.',
    'Moonroot is an easy one. Plant a seed, water it, then let it have a night to grow. I have a few spare seeds and a watering can you can use.',
    'Aunt Wren used to take three starflowers to the old shrine across the bridge. Said the hill slept easier afterwards. You can leave the flowers growing until your first harvest.',
  ],()=>{if(receiveGardenSeeds(state))toast('Received: 3 moonroot seeds and a watering can.');},'Try a little gardening','Another time');
}
function talkToRowan() {
  const stage=state.chapter.stage;
  if(stage===2)return say('rowan',['You’ve had a more eventful morning than me. Is that a thread?','I’m heading to the river with this. You’re both welcome to come.'],()=>{state.chapter.stage=3;refresh();save();},'A walk sounds nice','In a little while');
  if(stage===3){if(!rowanActor.arrived)return say('rowan',['The little spot south of the bridge. I’ll meet you there.']);return riverConversation();}
  if(stage>=4&&stage<10)return say('rowan',['The lower woodland sign is south of this fishing spot, on our bank. We can follow the answering call from there.'],startMillChapter,'Take the lower path','Stay by the water');
  if(stage===10)return say('rowan',['I’ll walk as far as your lane. We can wait a little longer if you like.']);
  if(stage===11)return say('rowan',['I saw a small, very determined shape heading towards your cottage. It was carrying something much too large.','I’m glad you both got home. Tomorrow, we can ask about those survey marks.']);
  if(!state.metRowan) {
    const introduced=()=>finishRowanIntroduction(state);
    return say('rowan',[
      'I’m Rowan. My aunt’s a friend of Aunt Wren’s. Thought I’d come and say hello.',
      'I was going down to the river, just south of the bridge. Want to come?',
    ],introduced,'A walk sounds nice','Maybe in a little while',introduced);
  }
  if(!rowanActor.arrived)return say('rowan',['There’s a little spot on the west bank, just south of the bridge. I’ll meet you there.']);
  if(!state.receivedSeeds) {
    const visited=()=>finishRiverVisit(state);
    return say('rowan',state.rowanRiver?[
      'Still no fish for Mira. I might have to confess that I’ve mostly been sitting here.',
    ]:[
      'That large one’s been taking my bait all spring. I’ve started recognising him.',
      'I promised Mira a fish yesterday. I might have been a bit optimistic.',
    ],()=>{visited();offerGardenSeeds();},'Ask about the garden','Watch the water a little longer',visited);
  }
  return say('rowan',[state.awakened?'The garden’s doing well. So’s the mountain, by the sound of it. Funny how those things go together.':!state.harvested?'Your seeds are ready whenever you are. The three dark beds in the village garden are yours to try.':'A fine first harvest. Take a moonroot and three starflowers to the shrine, over the eastern bridge. If you feel like it.']);
}
function nearest() {
  const things=[
    {...CAST.rowan,...rowanActor,type:'rowan',label:state.metRowan?'Talk to Rowan':'Say hello'},
    {...CAST.mira,type:'mira',label:'Talk to Mira'},
    {x:160,y:235,type:'home',label:'Enter your cottage'},
    {x:368,y:203,type:'tailor',label:'Visit the wardrobe'},
    {x:720,y:193,type:'shrine',label:'Listen at the old shrine'},
    {x:338,y:278,type:'well',label:'Look into the well'},
    {x:430,y:288,type:'sign',label:'Read the signpost'},
    {...TRAIL,type:'trail',label:state.awakened?'Take the Briarwood trail':'Read the warning sign'},
    ...(state.chapter.stage>=4&&state.chapter.stage<11?[{...LOWER_TRAIL,type:'lowerTrail',label:'Follow the lower woodland path'}]:[]),
    ...PLOTS.map((p,i)=>({...p,id:i,type:'plot',label:isGrown(state,i)?'Harvest moonroot':!state.plots[i]?'Plant a moonroot':!state.plots[i].watered?'Water the moonroot':'Check your moonroot'})),
    ...FLOWERS.filter(f=>!state.flowers.includes(f.id)).map(f=>({...f,type:'flower',label:'Gather a starflower'})),
  ];
  return things.map(t=>({...t,distance:Math.hypot(t.x-state.x,t.y-state.y)})).filter(t=>t.distance<33).sort((a,b)=>a.distance-b.distance)[0];
}
function interact() {
  if(dialogue)return advanceDialogue();if(isPaused()||!started)return;
  if(homeActor) return interactHome();
  if(mill){if(!mill.interact())toast('Move closer to Rowan, a discovery or the path lantern. M shows the route.');return;}
  if(encounter) { if(!encounter.interact()) toast('Move closer to the hatchling, guardian or trail lantern.'); return; }
  const t=nearest();if(!t)return toast('Wander a little closer to someone or something.');
  if(t.type==='trail') return offerExpedition();
  if(t.type==='lowerTrail')return startMillChapter();
  if(t.type==='rowan')return talkToRowan();
  if(t.type==='mira') {state.metMira=true;say('mira', [state.awakened?'I heard a noise from the hill last night. Rather like a very large cat purring. I suppose we’re keeping it?':'Welcome! My wardrobe’s always open — just walk up to the blue-roofed cottage. Everyone deserves clothes that feel like themselves.']);}
  if(t.type==='tailor')openCreator(true);
  if(t.type==='flower'){if(!state.harvested)return say('A starflower',['The flower holds a little warmth. Aunt Wren’s note said to leave these growing until your first harvest.']);state.flowers.push(t.id);toast(`Starflower gathered · ${state.flowers.length}/3. A little warm against your palm.`);}
  if(t.type==='plot')toast(tend(state,t.id));
  if(t.type==='home')return enterHome();
  if(t.type==='shrine'){
    if(state.awakened)say('unknown',[`${state.name}. A name to remember. I shall dream of rain for your garden. You may stay as long as you like.`]);
    else if(awaken(state))say('unknown',[
      'You set the moonroot and three starflowers in the bowl. The stone warms beneath your hand. A low note trembles through the air. Then, a voice.',
      `At last. ${state.name}. I knew you by the way you tended something small.`,
      state.dragonBonded ? 'Little ember. Your friend has found you. Keep this place alive, together.' : 'Little ember. There is a small dragon lost in Briarwood. Find it. You have much to learn from each other.',
      'The briars across the southern trail loosen. Briarwood is open to you now. Follow the little cry beneath its trees.',
    ],()=>{toast('A little cry carries from Briarwood.');});
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
$('leave-woods').onclick = () => (mill||encounter)?.leave(false);
$('blessings-hud').onclick=()=>togglePanel('journal');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeOverlays);
overlays.forEach(id=>$(id).addEventListener('click',event=>{if(event.target===$(id)&&!['creator','workshop'].includes(id))closeOverlays();}));
$('wardrobe').onclick=()=>openCreator(true);
$('save-button').onclick=()=>{$('menu-status').textContent=save()?'Progress saved on this device.':'Browser storage is unavailable. Download your save instead.';};
$('export-save').onclick=()=>{const {walk,...data}=state;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`emberwake-day-${state.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('menu-status').textContent='Save downloaded. Keep it somewhere safe.';};
$('import-save').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>30000)throw new Error('That file is too large to be a game save.');const incoming=validateSave(JSON.parse(await file.text()));if(!confirm('Replace the current story with this save? Download your current save first if you want to keep it.'))return;state=incoming;rowanActor=createRowanActor(state);encounter=null;homeMoment=null;mill=state.chapter.region?new MillChapter(state,millEvents()):null;homeActor=state.insideHome?{...HOME_ENTRY,direction:'up',walk:0}:null;villageCompanion={x:state.x-18,y:state.y+12};started=true;closeOverlays();save();refresh();if(state.workshopStep!==null)startWorkshop(state.workshopStep);else toast('Your story, right where you left it.');}catch(error){$('menu-status').textContent=error instanceof SyntaxError?'This file is not valid JSON.':error.message;}finally{event.target.value='';}};
$('restart').onclick=()=>{if(!confirm('Start a new story? Your current local save will be replaced when you begin. Download it first if you want to keep it.'))return;openCreator(false);};

function renderSoundButton() {
  for(const id of ['sound','workshop-sound']) {
    $(id).setAttribute('aria-pressed',String(music.enabled||musicRestore));
    $(id).textContent=musicRestore?'Music ready':music.enabled?'Music on':'Music off';
    $(id).title=musicRestore?'Music will resume when you press a key or click. Click here to keep it off.':'Toggle background music';
  }
}
async function toggleSound(resume=false) {
  if(musicBusy)return;
  if(musicRestore&&!resume){musicRestore=false;renderSoundButton();try{localStorage.setItem('emberwake.music.enabled','false');}catch{}return;}
  musicRestore=false;musicBusy=true;
  try {
    const enabled = await music.toggle();
    try {localStorage.setItem('emberwake.music.enabled',String(enabled));}catch{}
  } catch { toast('Background music is unavailable in this browser.'); }
  finally {musicBusy=false;renderSoundButton();}
}
renderSoundButton();
// Browsers require a fresh gesture after reload before sound can resume.
function restoreSound(event){
  const onSound=event.target.closest?.('#sound,#workshop-sound');
  if(onSound&&(event.type==='pointerdown'||[' ','Enter'].includes(event.key)))return;
  if(musicRestore)toggleSound(true);
}
window.addEventListener('pointerdown',restoreSound,{capture:true});
window.addEventListener('keydown',restoreSound,{capture:true});
$('music-volume').value = Math.round(music.volume * 100);
$('music-volume-value').textContent = `${Math.round(music.volume * 100)}%`;
$('music-volume').oninput = event => {
  music.setVolume(Number(event.target.value) / 100);
  $('music-volume-value').textContent = `${event.target.value}%`;
  try { localStorage.setItem('emberwake.music.volume', String(music.volume)); } catch {}
};
$('sound').onclick=()=>toggleSound();
$('workshop-sound').onclick=()=>toggleSound();
const directionKeys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
window.addEventListener('keydown',event=>{
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  // Keep focus within open modal panels without interfering with name entry.
  const active=overlays.find(id=>!$(id).hidden);
  const focusPanel=active||(dialogue?'dialogue':null);
  if(event.key==='Tab'&&focusPanel){const focusables=[...$(focusPanel).querySelectorAll('button:not([hidden]),input:not([type=file])')].filter(e=>!e.disabled&&e.getClientRects().length);const first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
  if(event.target instanceof HTMLInputElement){if(event.key==='Escape'&&active&&(active!=='creator'||editing)){event.preventDefault();closeOverlays();}return;}
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(workshop) {
    if(key==='Escape'){event.preventDefault();if(!event.repeat)skipOpeningScene();return;}
    if(['e',' ','Enter'].includes(key)) {
      if(key!=='e'&&event.target instanceof HTMLButtonElement&&event.target.id!=='workshop-next')return;
      event.preventDefault();if(!event.repeat)advanceWorkshop();
    }
    return;
  }
  if(dialogue&&[' ','Enter'].includes(key)&&event.target===$('dialogue-cancel')) {
    event.preventDefault();if(!event.repeat)cancelDialogue();return;
  }
  if(key==='Escape'){event.preventDefault();keys.clear();if(dialogue)cancelDialogue();else if(active)closeOverlays();else if(started)openOverlay('menu');return;}
  if (panelShortcuts[key] && started && !dialogue && active !== 'creator') {
    event.preventDefault(); if (!event.repeat) togglePanel(panelShortcuts[key]); return;
  }
  if(active)return;
  if(key==='x'&&!mill&&!encounter&&!dialogue&&hasRiverstep(state)){event.preventDefault();if(!event.repeat)worldDodge();return;}
  if(['z','x','c'].includes(key) && (mill||encounter) && !dialogue) {
    event.preventDefault(); if(key==='z') keys.add('attack');
    if(!event.repeat) (mill||encounter).command(key); return;
  }
  if(directionKeys[key]){event.preventDefault();if(!dialogue)keys.add(directionKeys[key]);return;}
  if(['e',' ','Enter'].includes(key)){event.preventDefault();if(!event.repeat)interact();}
});
window.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;if(directionKeys[key])keys.delete(directionKeys[key]);if(key==='z')keys.delete('attack');});
window.addEventListener('blur',()=>{keys.clear();save();});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden)save();music.setVisible(!document.hidden);});
window.addEventListener('pagehide',save);
// Mouse buttons leave the movement hand free. Track a held mouse attack
// separately so releasing it does not cancel a held keyboard attack.
world.addEventListener('mousedown',event=>{
  if(!started||isPaused()||![0,2].includes(event.button)||(!mill&&!encounter&&!hasRiverstep(state)))return;
  event.preventDefault();world.focus();
  if(event.button===0&&(mill||encounter)){keys.add('mouseAttack');(mill||encounter).command('z');}
  else if(event.button===2){if(mill||encounter)(mill||encounter).command('x');else worldDodge();}
});
window.addEventListener('mouseup',event=>{if(event.button===0)keys.delete('mouseAttack');});
world.addEventListener('contextmenu',event=>{if(mill||encounter||hasRiverstep(state))event.preventDefault();});
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);keys.add(b.dataset.dir);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(b.dataset.dir));});
$('touch-interact').onclick=interact;
document.querySelectorAll('[data-combat]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);if(isPaused())return;if(mill||encounter)(mill||encounter).command(button.dataset.combat);else if(button.dataset.combat==='x')worldDodge();if(button.dataset.combat==='z')keys.add('attack');});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>{if(button.dataset.combat==='z')keys.delete('attack');});
});

function resize(){const box=$('landscape').getBoundingClientRect();const zoom=Math.max(1.5,box.width/WORLD.width,box.height/WORLD.height);world.width=Math.round(box.width/zoom);world.height=Math.round(box.height/zoom);ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',resize);resize();
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  if(workshop){
    if(!document.hidden){workshop.update(dt);updateWorkshopButton();(workshop.isJourney?drawJourney:drawWorkshop)(workshopContext,workshop,state,reducedMotion);}
    requestAnimationFrame(tick);return;
  }
  moving=false;
  if(homeMoment&&!document.hidden)homeMoment.elapsed+=dt;
  if(mill&&!document.hidden)mill.animate(dt);
  if(started&&!isPaused()&&!document.hidden){
    freeDash.cooldown=Math.max(0,freeDash.cooldown-dt);
    updateRowan(rowanActor,state,dt,blocked);
    if(mill){
      if(keys.has('attack')||keys.has('mouseAttack'))mill.command('z');
      mill.update(dt,keys);state.minutes=Math.min(state.minutes+dt*2,1430);
    } else if(encounter) {
      if(keys.has('attack')||keys.has('mouseAttack')) encounter.command('z');
      encounter.update(dt,keys);
    } else if(homeActor) {
      moveWanderer(homeActor,dt,homeBlocked,76);state.minutes=Math.min(state.minutes+dt*1.3,1430);
    } else {
      moving=moveWanderer(state,dt,blocked,67);state.minutes=Math.min(state.minutes+dt*1.3,1430);
      const petDistance=Math.hypot(state.x-villageCompanion.x,state.y-villageCompanion.y);
      if(petDistance>140){villageCompanion.x=state.x-18;villageCompanion.y=state.y+12;}
      else if(petDistance>24){const dx=(state.x-villageCompanion.x)/petDistance*90*dt,dy=(state.y-villageCompanion.y)/petDistance*90*dt;if(!blocked(villageCompanion.x+dx,villageCompanion.y))villageCompanion.x+=dx;if(!blocked(villageCompanion.x,villageCompanion.y+dy))villageCompanion.y+=dy;}
    }
    if(time-lastSave>10000){save();lastSave=time;}
    refresh();
  }
  world.setAttribute('aria-label',homeActor?'Your cottage. Move with the arrow keys; E beside your bed sleeps, E beside the hatchling interacts.':mill?`${mill.title}. ${mill.objective()} Move with arrows or WASD, E interacts, left-click/Z attacks, right-click/X dodges, C commands your hatchling.`:encounter?'Briarwood. Move with arrows or WASD. Left click or Z attacks; right click or X dodges; C commands your dragon.':'Hearthvale. Move with arrows, E to interact, I inventory, J journal and M map.');
  const actor=homeActor ?? mill?.player??encounter?.player ?? state;
  camera.x=Math.max(0,Math.min(WORLD.width-world.width,Math.round(actor.x-world.width/2)));
  camera.y=Math.max(0,Math.min(WORLD.height-world.height,Math.round(actor.y-world.height*.52)));
  if(homeActor&&world.width>=420&&world.height>=352){camera.x=Math.max(0,Math.min(WORLD.width-world.width,416-world.width/2));camera.y=Math.max(0,Math.min(WORLD.height-world.height,325-world.height/2));}
  ctx.clearRect(0,0,world.width,world.height);
  if(homeActor)drawHome(ctx,homeActor,state,time,camera,homeMoment);else if(mill)drawMillChapter(ctx,mill,state,time,camera);else if(encounter) drawWilds(ctx,encounter,state,time,camera); else drawWorld(ctx,state,time,camera,villageCompanion,rowanActor);
  if(freeDash.time>0&&!mill&&!encounter){for(let i=0;i<6;i++){ctx.fillStyle='#c4e8d8';ctx.fillRect(Math.round(actor.x-camera.x-10+i*4),Math.round(actor.y-camera.y+3+i%2),3,1);}}
  const nearby=started&&!isPaused()?(homeActor?(state.chapter.stage===1&&Math.hypot(homeActor.x-492,homeActor.y-450)<46?{label:'See what your hatchling found'}:homeInteraction(homeActor)):mill?(mill.hint()?{label:mill.hint()}:null):encounter?(encounter.hint()?{label:encounter.hint()}:null):nearest()):null;$('interact-hint').hidden=!nearby;if(nearby)$('interact-hint').querySelector('span').textContent=nearby.label;
  requestAnimationFrame(tick);
}
// Reject a saved location inside scenery, for example after a map revision.
if(blocked(state.x,state.y)){state.x=272;state.y=278;}
renderOptions();refresh();requestAnimationFrame(tick);
if(saveProblem){toast(saveProblem);$('save-status').textContent='Previous save could not be loaded';}
if(started&&state.chapter.stage===10&&state.insideHome)reuniteAtHome();
else if(started&&state.workshopStep!==null)startWorkshop(state.workshopStep);
else if(started){world.focus();toast(`Welcome back, ${state.name}. The kettle’s still warm.`);}else $('character-name').focus();
