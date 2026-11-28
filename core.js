// The small, serialisable part of the game. Rendering and browser APIs live elsewhere.
import { isWorkshopStep } from './workshop-script.js?v=0.7.4';
export const SAVE_KEY = 'emberwake.save.v1';
export const PALETTES = {
  // Append shades so existing saves and villagers keep their original colours.
  skin: ['#f4d2ab', '#dfaa80', '#b97855', '#895337', '#603c30', '#f9dfcf', '#ebc6b8', '#d9b89b', '#c69b7b', '#ab8067', '#765447', '#402c29'],
  hair: ['#51382e', '#a9683e', '#d1b779', '#292c32', '#b8bac0', '#a56b85', '#d3a8c5', '#d7a18a'],
  colour: ['#83a88b', '#c78378', '#83a9bb', '#b49ac2', '#dbb977', '#5c7c96', '#ddb3b3', '#acc8b3'],
};
// Existing option indices stay stable so older saves retain their chosen look.
export const STYLES = {
  gender: ['Female', 'Male'],
  hairStyle: ['Soft bob', 'Cropped', 'Long & sleek', 'Soft curls', 'Long waves', 'Side braid', 'Twin braids', 'Ponytail', 'Twin buns', 'Half-up waves', 'Pixie', 'High pigtails'],
  outfit: ['Dungarees', 'Travel tunic', 'Linen dress', 'Pinafore', 'Cottage blouse', 'Petal dress', 'Cosy cardigan', 'Sailor dress'],
  accessory: ['None', 'Scarf', 'Sun hat', 'Hair bow', 'Flower clip', 'Beret'],
};
export const FLOWERS = [{ id: 'f1', x: 452, y: 215 }, { id: 'f2', x: 480, y: 424 }, { id: 'f3', x: 200, y: 440 }];
export const PLOTS = [{ x: 256, y: 344 }, { x: 280, y: 344 }, { x: 304, y: 344 }];
export const QUESTS = [
  ['metRowan', 'A neighbourly hello', 'Rowan is near your cottage’s front door. Step outside whenever you are ready and press E to say hello.', 'main'],
  ['rowanRiver', 'A little company', 'Rowan invited you to the river. Meet him on the west bank, just south of the wooden bridge, and press E to talk. He will wait if you want to wander first. M shows where he is.', 'main'],
  ['harvested', 'Something worth tending', 'Plant and water a moonroot. Go inside your cottage, sleep in the bed, then harvest it.', 'main'],
  ['flowers', 'A handful of starlight', 'Gather three starflowers around the village and meadow. M marks the ones still growing.', 'main'],
  ['awakened', 'The dream beneath the hill', 'Rowan told you Aunt Wren used to take three starflowers to the old shrine. She said the hill slept easier afterwards. Bring 1 moonroot and 3 starflowers east across the wooden bridge. Press E beside the shrine to place them in the offering bowl.', 'main'],
  ['dragonBonded', 'A cry in the trees', 'Take the southern trail into Briarwood and help the stranded hatchling.', 'main'],
  ['guardianFreed', 'The thornbound guardian', 'Clear the bramble sprites, break the guardian’s binding, then approach it with E. Left-click or Z attacks; right-click or X dodges; C calls your dragon.', 'main'],
  ['homecoming', 'A place for two', 'Bring your hatchling home to the cottage.', 'main'],
  ['metMira', 'A visit to the tailor', 'Introduce yourself to Mira outside the blue-roofed cottage.', 'optional'],
];
export function questComplete(state,key) { return key === 'flowers' ? state.flowers.length === 3 : state[key] === true; }
export function activeMainQuest(state) {
  const quest=QUESTS.find(q => q[3] === 'main' && !questComplete(state,q[0])) ?? null;
  if(quest?.[0]==='harvested'&&!state.receivedSeeds)return [quest[0],quest[1],'If you feel like trying the village garden, ask Rowan about it. He is by the river, south of the bridge, and has seeds to share. Press E to talk; M shows his location.',quest[3]];
  return quest;
}
export function completedMainQuests(state) {
  const completed=[];
  for(const quest of QUESTS.filter(q=>q[3]==='main')) { if(!questComplete(state,quest[0]))break;completed.push(quest); }
  return completed;
}
export function newState(appearance = {}) {
  return { version: 1, name: 'Lina', appearance: { skin: 0, hair: 0, colour: 0, hairStyle: 4, outfit: 3, accessory: 4, gender: 0, ...appearance }, x: 272, y: 278, direction: 'down', day: 1, minutes: 480, insideHome: false, workshopStep: null, metRowan: false, rowanRiver:false, receivedSeeds:false, payPacketRead:false, workNotebookRead:false, clockUnwound:false, metMira: false, seeds: 0, flowers: [], plots: [null, null, null], moonroot: 0, harvested: false, awakened: false, hasBlade: false, dragonBonded: false, guardianFreed: false, homecoming: false };
}
export function validateSave(value) {
  if (!value || value.version !== 1 || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 20) throw new Error('This is not an Emberwake save.');
  const s = newState();
  for (const key of ['day', 'minutes', 'seeds', 'moonroot']) {
    if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 1000000) throw new Error('The save contains an invalid value.');
    s[key] = key === 'minutes' ? value[key] : Math.floor(value[key]);
  }
  if (s.day < 1 || s.minutes < 360 || s.minutes > 1440 || s.seeds > 3 || s.moonroot > 3) throw new Error('The save contains an invalid value.');
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || value.x < 16 || value.x > 816 || value.y < 90 || value.y > 560) throw new Error('The saved position is invalid.');
  s.x = value.x; s.y = value.y; s.name = value.name.trim();
  s.direction = ['up', 'down', 'left', 'right'].includes(value.direction) ? value.direction : 'down';
  for (const key of ['metRowan', 'metMira', 'harvested', 'awakened']) s[key] = value[key] === true;
  for(const key of ['rowanRiver','receivedSeeds','payPacketRead','workNotebookRead','clockUnwound']) {
    if(value[key]!==undefined&&typeof value[key]!=='boolean')throw new Error('The saved cottage progress is invalid.');
    s[key]=value[key]===undefined&&['rowanRiver','receivedSeeds'].includes(key)?s.metRowan:value[key]===true;
  }
  for (const [key, options] of Object.entries({ ...PALETTES, ...STYLES })) {
    const n = key === 'gender' && value.appearance?.gender === undefined ? 0 : value.appearance?.[key];
    if (!Number.isInteger(n) || n < 0 || n >= options.length) throw new Error('The saved appearance is invalid.');
    s.appearance[key] = n;
  }
  for (const key of ['hasBlade', 'dragonBonded', 'guardianFreed', 'homecoming', 'insideHome']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error('The saved adventure progress is invalid.');
    s[key] = value[key] === true;
  }
  if (s.homecoming && !s.guardianFreed) throw new Error('The saved homecoming is invalid.');
  if(value.workshopStep!==undefined&&value.workshopStep!==null) {
    if(!isWorkshopStep(value.workshopStep))throw new Error('The saved opening scene is invalid.');
    s.workshopStep=value.workshopStep;
  }
  if (s.guardianFreed && !s.dragonBonded) throw new Error('The saved dragon bond is invalid.');
  if (!Array.isArray(value.flowers) || value.flowers.some(id => !FLOWERS.some(f => f.id === id)) || new Set(value.flowers).size !== value.flowers.length) throw new Error('The saved flowers are invalid.');
  s.flowers = [...value.flowers];
  if (!Array.isArray(value.plots) || value.plots.length !== 3) throw new Error('The saved garden is invalid.');
  s.plots = value.plots.map(p => {
    if (p === null) return null;
    if (!Number.isInteger(p.planted) || p.planted < 1 || p.planted > s.day || typeof p.watered !== 'boolean') throw new Error('The saved garden is invalid.');
    return { planted: p.planted, watered: p.watered };
  });
  return s;
}
export function isGrown(s, i) { const p = s.plots[i]; return !!p && p.watered && s.day > p.planted; }
export function tend(s, i) {
  if (!s.receivedSeeds) return 'Rowan has seeds to share if you feel like gardening. Ask him when you are ready.';
  if (isGrown(s, i)) { s.plots[i] = null; s.moonroot++; s.harvested = true; return 'A moonroot! Warm as a little cup of tea.'; }
  if (!s.plots[i]) {
    if (!s.seeds) return 'The soil can rest now. There’s no hurry to fill every bed.';
    s.seeds--; s.plots[i] = { planted: s.day, watered: false };
    return 'Moonroot planted. Press E again to give it a little water.';
  }
  // Growth starts when watered, including a bed left dry over several nights.
  if (!s.plots[i].watered) { s.plots[i].watered = true; s.plots[i].planted = s.day; return 'Watered. It will be ready after a night’s sleep at your cottage.'; }
  return 'A tiny green promise. Let it grow overnight.';
}
export function objective(s) {
  if (!s.metRowan) return 'Say hello to Rowan outside your cottage when you are ready.';
  if (!s.rowanRiver) return 'Meet Rowan by the river, south of the bridge. No hurry.';
  if (!s.receivedSeeds) return 'When you feel like gardening, ask Rowan about the empty beds.';
  if (!s.harvested) {
    if (s.plots.some((_, i) => isGrown(s, i))) return 'Your moonroot is ready. Visit the garden.';
    if (s.plots.some(p => p?.watered)) return 'Sleep at your cottage. Let something grow.';
    if (s.plots.some(Boolean)) return 'Give your moonroot a little water.';
    return 'Plant a moonroot in the garden’s soil.';
  }
  if (s.flowers.length < 3) return `Gather starflowers · ${s.flowers.length}/3. Check M for their locations.`;
  if (!s.awakened) return 'Visit the old shrine, across the eastern bridge.';
  if (!s.dragonBonded) return 'Follow the southern trail into Briarwood.';
  if (!s.guardianFreed) return 'Return to Briarwood and help the bound guardian.';
  if (!s.homecoming) return 'Bring your hatchling home to the cottage.';
  return 'Your hatchling has found a home here.';
}
export function canAwaken(s) { return activeMainQuest(s)?.[0] === 'awakened' && s.moonroot > 0 && s.flowers.length === 3; }
export function awaken(s) { if (!canAwaken(s)) return false; s.moonroot--; s.awakened = true; return true; }
