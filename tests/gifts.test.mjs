// tests/gifts.test.mjs — planGiftChanges / detectDismissed from assets/anvil-gifts.js (node --test, no dependencies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Loaded as a data: URL: package.json declares no module type and assets/ cannot hold one, so a path import makes
// Node re-parse the file and print a warning. The module's DOM half is skipped where `document` does not exist.
const source = readFileSync(new URL('../assets/anvil-gifts.js', import.meta.url), 'utf8');
const { planGiftChanges, detectDismissed } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const forKey = (plan, key) => plan.filter((step) => step.key === key);

const TRIGGER = 111;
const GIFT_VARIANT = 999;
const qtyRule = { key: `qty:${TRIGGER}:3`, trigger: 'quantity', productId: TRIGGER, min: 3, giftVariantId: GIFT_VARIANT };
const spendRule = { key: 'spend:5000', trigger: 'spend', threshold: 5000, giftVariantId: GIFT_VARIANT, excludeGifts: true };

const line = (key, product_id, quantity, price = 1000, properties = null) => ({
  key,
  product_id,
  variant_id: product_id * 10,
  quantity,
  final_line_price: price * quantity,
  properties,
});
const gift = (key, ruleKey, quantity = 1, price = 0) => line(key, 222, quantity, price, { _anvil_gift: ruleKey });
const cartOf = (...items) => ({ items, total_price: items.reduce((n, i) => n + i.final_line_price, 0) });

test('adds the gift when the quantity threshold is reached', () => {
  const plan = planGiftChanges(cartOf(line('a', TRIGGER, 3)), [qtyRule], []);
  assert.deepEqual(plan, [
    { action: 'add', key: qtyRule.key, id: GIFT_VARIANT, quantity: 1, properties: { _anvil_gift: qtyRule.key } },
  ]);
});

test('does nothing below the threshold when no gift line exists', () => {
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 2)), [qtyRule], []), []);
});

test('removes the gift line once the quantity drops below the threshold', () => {
  const plan = planGiftChanges(cartOf(line('a', TRIGGER, 2), gift('g', qtyRule.key)), [qtyRule], []);
  assert.deepEqual(plan, [{ action: 'remove', key: qtyRule.key, line: 'g', quantity: 0 }]);
});

test('never adds a duplicate when the gift line is already there', () => {
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 5), gift('g', qtyRule.key)), [qtyRule], []), []);
});

test('the same rule rendered twice is planned once', () => {
  const plan = planGiftChanges(cartOf(line('a', TRIGGER, 3)), [qtyRule, { ...qtyRule }], []);
  assert.equal(plan.length, 1);
});

test('removes extra lines of one key and clamps the gift to quantity 1', () => {
  const plan = planGiftChanges(
    cartOf(line('a', TRIGGER, 4), gift('g1', qtyRule.key, 2), gift('g2', qtyRule.key)),
    [qtyRule],
    []
  );
  assert.deepEqual(plan, [
    { action: 'remove', key: qtyRule.key, line: 'g2', quantity: 0 },
    { action: 'clamp', key: qtyRule.key, line: 'g1', quantity: 1 },
  ]);
});

test('a dismissed key is skipped for adds', () => {
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 3)), [qtyRule], [qtyRule.key]), []);
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 3)), [qtyRule], new Set([qtyRule.key])), []);
});

test('quantity counts only non-gift lines of the trigger product', () => {
  // two paid units + one gift unit of the same product must not reach a minimum of 3
  const sameProductGift = { ...qtyRule, giftVariantId: TRIGGER * 10 };
  const cart = cartOf(line('a', TRIGGER, 2), line('g', TRIGGER, 1, 0, { _anvil_gift: 'spend:1' }));
  assert.deepEqual(planGiftChanges(cart, [sameProductGift], []), []);
  // other products never count toward the trigger
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 1), line('b', 333, 5)), [qtyRule], []), []);
  // split across two lines of the trigger product (for example two variants) they do count
  assert.equal(planGiftChanges(cartOf(line('a', TRIGGER, 1), line('b', TRIGGER, 2)), [qtyRule], [])[0].action, 'add');
});

test('spend: adds at the threshold and removes below it', () => {
  assert.equal(planGiftChanges(cartOf(line('a', 1, 5, 1000)), [spendRule], [])[0].action, 'add');
  const below = cartOf(line('a', 1, 4, 1000), gift('g', spendRule.key));
  assert.deepEqual(planGiftChanges(below, [spendRule], []), [{ action: 'remove', key: spendRule.key, line: 'g', quantity: 0 }]);
});

test('spend: excludeGifts leaves gift lines out of the total', () => {
  // 4000 paid + a 1500 gift line Shopify has not discounted
  const cart = cartOf(line('a', 1, 4, 1000), gift('g', 'qty:5:1', 1, 1500));
  assert.deepEqual(forKey(planGiftChanges(cart, [spendRule], []), spendRule.key), []);
  assert.equal(forKey(planGiftChanges(cart, [{ ...spendRule, excludeGifts: false }], []), spendRule.key)[0].action, 'add');
});

test('spend: a cart holding only gift lines never qualifies', () => {
  const cart = cartOf(gift('g', 'qty:5:1', 1, 6000));
  assert.deepEqual(forKey(planGiftChanges(cart, [{ ...spendRule, excludeGifts: false }], []), spendRule.key), []);
});

test('orphaned gift lines are removed from their key when the rule is not on the page', () => {
  const plan = planGiftChanges(cartOf(line('a', TRIGGER, 1), gift('g', qtyRule.key)), [], []);
  assert.deepEqual(plan, [{ action: 'remove', key: qtyRule.key, line: 'g', quantity: 0 }]);
  // still qualifying: kept, and never re-added without the rule (the gift variant is unknown)
  assert.deepEqual(planGiftChanges(cartOf(line('a', TRIGGER, 3), gift('g', qtyRule.key)), [], []), []);
});

test('invalid rules are ignored', () => {
  const cart = cartOf(line('a', TRIGGER, 9));
  assert.deepEqual(planGiftChanges(cart, [{ key: 'x', trigger: 'spend', threshold: 0, giftVariantId: 1 }], []), []);
  assert.deepEqual(planGiftChanges(cart, [{ trigger: 'quantity', productId: TRIGGER, min: 1, giftVariantId: 1 }], []), []);
  assert.deepEqual(planGiftChanges(null, [qtyRule], []), []);
});

test('detectDismissed: a gift removed while its rule still holds is dismissed', () => {
  const before = cartOf(line('a', TRIGGER, 3), gift('g', qtyRule.key));
  const after = cartOf(line('a', TRIGGER, 3));
  assert.deepEqual(detectDismissed(before, after, [qtyRule]), [qtyRule.key]);
});

test('detectDismissed: a gift that left because the rule stopped holding is not dismissed', () => {
  const before = cartOf(line('a', TRIGGER, 3), gift('g', qtyRule.key));
  const after = cartOf(line('a', TRIGGER, 2));
  assert.deepEqual(detectDismissed(before, after, [qtyRule]), []);
  assert.deepEqual(detectDismissed(null, after, [qtyRule]), []);
});
