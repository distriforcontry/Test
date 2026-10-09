'use strict';
const test = require('node:test');
const assert = require('node:assert');
const d = require('../src/dates');
const { estimate, dueDates, inferAsOf } = require('../src/dpd');

const asOf = d.fromYMD(2026, 8, 26);
const opts = { tolerance: 0.005, penaltyMultiplier: 1.5 };
const rd = 54 / 36500;

// Aprel oyida berilgan, to'lov kuni 5: to'lovlar 05.05 (faqat foiz), 05.06, 06.07 (05.07 yakshanba), 05.08.
function aprilLoan(extra) {
  return Object.assign({
    summKr: 5000000, rate: 54, issue: d.fromYMD(2026, 4, 20), close: d.fromYMD(2032, 4, 5),
    ost: 4813696.2, ostPr: 186303.8, proc: 149554.29, nachPr: 791328.36
  }, extra);
}

test('to\'lov jadvali', () => {
  const due = dueDates(d.fromYMD(2026, 4, 20), d.fromYMD(2032, 4, 5)).slice(0, 4).map(d.format);
  assert.deepStrictEqual(due, ['05.05.2026', '05.06.2026', '06.07.2026', '05.08.2026']);
});

test('hech narsa to\'lamagan: birinchi to\'lovdan beri 113 kun', () => {
  const r = estimate(aprilLoan(), asOf, opts);
  assert.strictEqual(r.dpd, 113);
  assert.strictEqual(r.unpaid, 4);
  assert.strictEqual(d.format(r.oldestDue), '05.05.2026');
});

test('iyungacha to\'lagan: oxirgi 2 to\'lov qolgan -> 51 kun', () => {
  // asosiy qarz qismlari (o'sish 1.045): 59 388.6 / 62 061.1 / 64 854.1
  const ostPr = 62061.1 + 64854.1;
  const balance = 4813696.2 + ostPr;
  const interest = balance * rd * (31 + 30);
  const penalty = ostPr * rd * 21 + 1.5 * rd * (62061.1 * 51 + 64854.1 * 21);
  const base = aprilLoan({ ostPr: ostPr, nachPr: interest + penalty });
  assert.strictEqual(estimate(base, asOf, opts).dpd, 51);
  // 0.5% dan kichik qoldiq to'langan hisoblanadi, kattasi — iyun to'lovi to'lanmagan (82 kun)
  assert.strictEqual(estimate(Object.assign({}, base, { nachPr: base.nachPr + 500 }), asOf, opts).dpd, 51);
  assert.strictEqual(estimate(Object.assign({}, base, { nachPr: base.nachPr + 5000 }), asOf, opts).dpd, 82);
});

test('faqat birinchi (foiz) to\'lov o\'tkazib yuborilgan -> 22 kun', () => {
  const loan = {
    summKr: 5000000, rate: 53, issue: d.fromYMD(2026, 7, 1), close: d.fromYMD(2032, 7, 4),
    ost: 5000000, ostPr: 0, proc: 5000000 * 53 / 36500 * 22, nachPr: 5000000 * 53 / 36500 * 34
  };
  const r = estimate(loan, asOf, opts);
  assert.strictEqual(r.dpd, 22);
  assert.strictEqual(r.unpaid, 1);
});

test('o\'z vaqtida to\'layotgan kredit -> 0', () => {
  assert.strictEqual(estimate(aprilLoan({ ostPr: 0, nachPr: 0 }), asOf, opts).dpd, 0);
});

test('hisob sanasi joriy foizdan aniqlanadi', () => {
  const loans = [aprilLoan(), aprilLoan({ issue: d.fromYMD(2026, 8, 25), close: d.fromYMD(2032, 8, 5) })];
  loans.forEach((l) => { l.proc = l.ost * l.rate / 36500 * 21; });
  assert.strictEqual(d.format(inferAsOf(loans).asOf), '26.08.2026');
});
