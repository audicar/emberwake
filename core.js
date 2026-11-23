// The small, serialisable part of the game. Rendering and browser APIs live elsewhere.
export const SAVE_KEY = 'emberwake.save.v1';
export const PALETTES = {
  skin: ['#f4d2ab', '#dfaa80', '#b97855', '#895337', '#603c30'],
  hair: ['#51382e', '#a9683e', '#d1b779', '#292c32', '#b8bac0', '#a56b85'],
  colour: ['#6f9479', '#ba775b', '#6f8ea0', '#ad8eaf', '#d4b16b', '#415c73'],
};
export const STYLES = { hairStyle: ['Bob', 'Cropped', 'Long', 'Curly'], outfit: ['Overalls', 'Tunic', 'Dress'], accessory: ['None', 'Scarf', 'Sun hat'] };
export const FLOWERS = [{ id: 'f1', x: 400, y: 200 }, { id: 'f2', x: 480, y: 424 }, { id: 'f3', x: 200, y: 440 }];
export const PLOTS = [{ x: 256, y: 344 }, { x: 280, y: 344 }, { x: 304, y: 344 }];
export const QUESTS = [
  ['metRowan', 'A neighbourly hello', 'Find Rowan beside the garden, just south of the village square.'],
  ['harvested', 'Something worth tending', 'Plant and water a moonroot. Sleep at your cottage, then harvest it.'],
  ['flowers', 'A handful of starlight', 'Gather three starflowers around the village and meadow.'],
  ['awakened', 'The dream beneath the hill', 'Bring your moonroot and starflowers to the shrine across the bridge.'],
];
export function newState(appearance = {}) {
  return { version: 1, name: 'Lina', appearance: { skin: 0, hair: 0, colour: 0, hairStyle: 0, outfit: 0, accessory: 0, ...appearance }, x: 272, y: 278, direction: 'down', day: 1, minutes: 480, metRowan: false, metMira: false, seeds: 0, flowers: [], plots: [null, null, null], moonroot: 0, harvested: false, awakened: false };
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
  for (const [key, options] of Object.entries({ ...PALETTES, ...STYLES })) {
    const n = value.appearance?.[key];
    if (!Number.isInteger(n) || n < 0 || n >= options.length) throw new Error('The saved appearance is invalid.');
    s.appearance[key] = n;
  }
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
  if (!s.metRowan) return 'Rowan has seeds to get you started. Say hello first.';
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
  if (!s.metRowan) return 'Find Rowan by the village garden.';
  if (!s.harvested) {
    if (s.plots.some((_, i) => isGrown(s, i))) return 'Your moonroot is ready. Visit the garden.';
    if (s.plots.some(p => p?.watered)) return 'Sleep at your cottage. Let something grow.';
    if (s.plots.some(Boolean)) return 'Give your moonroot a little water.';
    return 'Plant a moonroot in the garden’s soil.';
  }
  if (s.flowers.length < 3) return `Gather starflowers in the meadow. ${s.flowers.length}/3`;
  if (!s.awakened) return 'Visit the old shrine, across the eastern bridge.';
  return 'A dragon is dreaming of your little garden.';
}
export function canAwaken(s) { return !s.awakened && s.moonroot > 0 && s.flowers.length === 3; }
export function awaken(s) { if (!canAwaken(s)) return false; s.moonroot--; s.awakened = true; return true; }
