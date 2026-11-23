import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, tend, awaken } from '../core.js';
import { inventoryItems } from '../inventory.js';

test('satchel quantities follow planting, harvests and offerings while retaining the watering can', () => {
  const state = newState();
  const counts = () => Object.fromEntries(inventoryItems(state).map(item => [item.id, item.quantity]));
  assert.deepEqual(counts(), { seeds: 0, moonroot: 0, starflowers: 0, 'watering-can': 0 });
  state.metRowan = true; state.seeds = 3;
  assert.equal(counts()['watering-can'], 1);
  tend(state, 0); tend(state, 0);
  assert.equal(counts().seeds, 2);
  state.day++; tend(state, 0);
  assert.equal(counts().moonroot, 1);
  state.flowers = ['f1', 'f2', 'f3'];
  assert.equal(counts().starflowers, 3);
  assert.equal(awaken(state), true);
  assert.deepEqual(counts(), { seeds: 2, moonroot: 0, starflowers: 0, 'watering-can': 1 });
  assert.equal(state.flowers.length, 3, 'collected flower locations remain recorded in the save');
});
