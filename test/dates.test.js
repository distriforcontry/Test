'use strict';
const test = require('node:test');
const assert = require('node:assert');
const d = require('../src/dates');

test('sana o\'qish formatlari', () => {
  const day = d.fromYMD(2026, 8, 26);
  assert.strictEqual(d.parseDate('2026-08-26'), day);
  assert.strictEqual(d.parseDate('26.08.2026'), day);
  assert.strictEqual(d.parseDate('08/26/2026'), day);
  assert.strictEqual(d.parseDate(46260), day); // Excel seriya raqami
  assert.strictEqual(d.parseDate(''), null);
  assert.strictEqual(d.format(day), '26.08.2026');
  assert.strictEqual(d.compact(day), '26082026');
  assert.strictEqual(d.toExcelSerial(day), 46260);
});

test('dam olish kunlari dushanbaga suriladi', () => {
  assert.strictEqual(d.format(d.shiftWeekend(d.fromYMD(2026, 8, 1))), '03.08.2026'); // shanba
  assert.strictEqual(d.format(d.shiftWeekend(d.fromYMD(2026, 7, 5))), '06.07.2026'); // yakshanba
  assert.strictEqual(d.format(d.shiftWeekend(d.fromYMD(2026, 8, 5))), '05.08.2026'); // chorshanba
});
