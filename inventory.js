const ITEMS = [
  { id: 'seeds', name: 'Moonroot seeds', kind: 'For the garden', description: 'Plant in an empty bed beside Rowan, then water it. A night’s sleep at your cottage gives it time to grow.' },
  { id: 'moonroot', name: 'Moonroot', kind: 'Freshly harvested', description: 'A small, pale root, warm against your palm. The old shrine across the bridge has a bowl just its size.' },
  { id: 'starflowers', name: 'Starflowers', kind: 'From the meadow', description: 'Pale flowers growing around the village and meadow. Gather three for an offering at the old shrine.' },
  { id: 'blade', name: 'Aunt Wren’s blade', kind: 'For the woodland trail', description: 'A well-kept practice blade from Aunt Wren. Hold the left mouse button or Z to swing repeatedly. Face your target with the movement keys; right-click or X dodges.' },
  { id: 'watering-can', name: 'Watering can', kind: 'A trusty tool', description: 'A gift from Rowan. Use it beside a planted garden bed with E. It never runs dry.' },
];

// Quantities are derived from existing saves, including flowers left at the shrine.
export function inventoryItems(state) {
  const quantities = { seeds: state.seeds, moonroot: state.moonroot, starflowers: state.awakened ? 0 : state.flowers.length, 'watering-can': state.receivedSeeds ? 1 : 0, blade: state.hasBlade ? 1 : 0 };
  return ITEMS.filter(item => item.id !== 'blade' || state.hasBlade).map(item => ({ ...item, quantity: quantities[item.id] }));
}

export function drawItemIcon(canvas, id) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 32, 32); c.imageSmoothingEnabled = false;
  const r = (x,y,w,h,colour) => { c.fillStyle=colour; c.fillRect(x,y,w,h); };
  r(6,27,21,2,'#152a2940');
  if (id === 'seeds') {
    r(7,8,18,20,'#916f50');r(9,9,14,18,'#d8b981');r(10,10,5,16,'#ead099');
    r(8,7,16,4,'#f1d9a3');r(10,6,12,2,'#ab885b');r(9,11,14,2,'#886f4e');
    r(13,16,8,8,'#f4e6b8');r(16,17,1,6,'#63815a');r(13,17,4,3,'#8eaa6d');r(17,15,3,3,'#8eaa6d');
  } else if (id === 'moonroot') {
    r(12,12,9,12,'#c6b38b');r(11,15,11,6,'#dcd0ac');r(13,12,6,12,'#f3e6c5');
    r(15,23,3,4,'#d7c7a4');r(16,26,1,2,'#a99473');r(15,9,3,6,'#6f925e');
    r(8,7,8,5,'#83a56c');r(10,6,4,2,'#a7bc83');r(18,4,6,6,'#9ab87d');r(20,3,3,2,'#c2d09a');
  } else if (id === 'starflowers') {
    r(13,12,2,14,'#779565');r(19,17,2,10,'#779565');r(11,21,4,3,'#8faa6e');
    for(const [x,y] of [[14,9],[21,15]]) {
      r(x-5,y-1,11,3,'#f8e9b1');r(x-1,y-5,3,11,'#f8e9b1');
      r(x-3,y-3,7,7,'#fff3cb');r(x-1,y-1,3,3,'#d6ad6c');r(x,y,1,1,'#fae5a0');
    }
  } else if (id === 'blade') {
    r(6,24,5,5,'#957456');r(10,19,4,6,'#d2b67c');r(8,18,9,3,'#b29c71');r(13,8,3,12,'#b8c7bd');r(15,5,3,12,'#e4e5c8');r(17,3,3,9,'#e4e5c8');r(18,3,2,5,'#fff1cc');
  } else if (id === 'watering-can') {
    r(5,12,6,3,'#91b8b2');r(4,14,3,7,'#638e8c');r(5,20,6,3,'#638e8c');
    r(10,12,14,14,'#527979');r(11,13,12,11,'#83aaa4');r(12,14,3,8,'#acc9b9');
    r(13,8,8,2,'#b5cebb');r(12,10,10,3,'#527979');r(23,15,3,5,'#83aaa4');
    r(25,12,3,6,'#9bbdb1');r(27,10,3,4,'#a3c4b5');r(26,8,5,2,'#d3dfc1');r(11,25,12,2,'#b5c4a1');
  }
}
