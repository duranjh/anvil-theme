// tests/ship-dates.test.mjs — computeShipDates from assets/anvil-ship-dates.js (node --test, no dependencies).
// 2026-10-16 is a Friday; 2026-10-17/18 are the weekend.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Loaded as a data: URL (see tests/gifts.test.mjs); the custom element half is skipped outside a browser.
const source = readFileSync(new URL('../assets/anvil-ship-dates.js', import.meta.url), 'utf8');
const { computeShipDates } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const at = (isoUtc) => Date.parse(isoUtc);
const base = { offset: 0, pmin: 1, pmax: 2, dmin: 3, dmax: 5, skip: true, cutoff: 0 };

test('business days skip the weekend for processing and delivery', () => {
  assert.deepEqual(computeShipDates(at('2026-10-16T10:00:00Z'), base), {
    ordered: '2026-10-16',
    shipFrom: '2026-10-19',
    shipTo: '2026-10-20',
    from: '2026-10-22',
    to: '2026-10-27',
  });
});

test('calendar days when weekends are not skipped', () => {
  assert.deepEqual(computeShipDates(at('2026-10-16T10:00:00Z'), { ...base, skip: false }), {
    ordered: '2026-10-16',
    shipFrom: '2026-10-17',
    shipTo: '2026-10-18',
    from: '2026-10-20',
    to: '2026-10-23',
  });
});

test('an order placed on a weekend starts counting on Monday', () => {
  const r = computeShipDates(at('2026-10-17T09:00:00Z'), { ...base, pmin: 0, pmax: 0, dmin: 1, dmax: 2 });
  assert.equal(r.ordered, '2026-10-17');
  assert.equal(r.shipFrom, '2026-10-19');
  assert.equal(r.shipTo, '2026-10-19');
  assert.equal(r.from, '2026-10-20');
  assert.equal(r.to, '2026-10-21');
});

test('before the cut-off hour the order counts from today', () => {
  const r = computeShipDates(at('2026-10-14T13:59:00Z'), { ...base, cutoff: 14 });
  assert.equal(r.shipFrom, '2026-10-15');
});

test('at or after the cut-off hour the order counts from the next day', () => {
  const r = computeShipDates(at('2026-10-14T14:00:00Z'), { ...base, cutoff: 14 });
  assert.equal(r.ordered, '2026-10-14');
  assert.equal(r.shipFrom, '2026-10-16');
  // Thursday after the cut-off: day 0 is Friday, one business day later is Monday
  const thu = computeShipDates(at('2026-10-15T15:00:00Z'), { ...base, cutoff: 14 });
  assert.equal(thu.shipFrom, '2026-10-19');
});

test('a cut-off of 0 means no cut-off', () => {
  const r = computeShipDates(at('2026-10-14T23:30:00Z'), { ...base, cutoff: 0 });
  assert.equal(r.shipFrom, '2026-10-15');
});

test('the store offset decides the local day and the cut-off', () => {
  // 02:00 UTC on the 15th is 21:00 on the 14th in a store at UTC-5
  const r = computeShipDates(at('2026-10-15T02:00:00Z'), { ...base, offset: -300, cutoff: 0 });
  assert.equal(r.ordered, '2026-10-14');
  // 18:30 UTC is 13:30 at UTC-5: before a 14:00 cut-off
  const before = computeShipDates(at('2026-10-14T18:30:00Z'), { ...base, offset: -300, cutoff: 14 });
  assert.equal(before.shipFrom, '2026-10-15');
  const after = computeShipDates(at('2026-10-14T19:30:00Z'), { ...base, offset: -300, cutoff: 14 });
  assert.equal(after.shipFrom, '2026-10-16');
});

test('zero windows render nothing', () => {
  assert.equal(computeShipDates(at('2026-10-14T10:00:00Z'), { ...base, pmin: 0, pmax: 0, dmin: 0, dmax: 0 }), null);
  assert.equal(computeShipDates(at('2026-10-14T10:00:00Z'), {}), null);
});

test('a maximum below its minimum is raised to the minimum', () => {
  const r = computeShipDates(at('2026-10-14T10:00:00Z'), { ...base, skip: false, pmin: 2, pmax: 1, dmin: 3, dmax: 0 });
  assert.equal(r.shipFrom, r.shipTo);
  assert.equal(r.from, r.to);
  assert.equal(r.from, '2026-10-19');
});
