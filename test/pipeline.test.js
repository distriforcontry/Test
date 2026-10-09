'use strict';
// Sun'iy (to'qima) snapshot bilan to'liq jarayon: xlsx yozish -> pipeline -> reyestrlarni qayta o'qish.
const test = require('node:test');
const assert = require('node:assert');
const d = require('../src/dates');
const writer = require('../src/xlsxWriter');
const reader = require('../src/xlsxReader');
const pipeline = require('../src/pipeline');

const HEADER = ['branch', 'ld_id', 'account', 'client_name', 'summ_kr', 'summ_ost_ze', 'summ_ostpr_ze', 'rate',
  'date_to_cr', 'date_close', 'sumproc_eqv', 'sumnachpr_eqv', 'klass_name', 'status_name', 'term_type',
  'passport_sn', 'pinfl', 'phone_mobile', 'post_address', 'name', 'distr_name'];
const TYPES = ['str', 'num', 'str', 'str', 'num', 'num', 'num', 'num', 'date', 'date', 'num', 'num', 'str', 'str',
  'str', 'str', 'str', 'str', 'str', 'str', 'str'];

const ADDR = 'RESPUBLIKA UZBEKISTAN, NAVOINSKAYA OBLAST, XATIRCHINSKIY RAYON, UL. BOG MFY, NUR KUCHASI, D. 7, KV.';

// k: 'late' — aprelda berilgan, hech narsa to'lamagan (113 kun); 'ok' — o'z vaqtida; 'mid' — 51 kun
function loan(branch, id, uniq, name, pinfl, kind, status) {
  const late = kind === 'late';
  const ostPr = late ? 186303.8 : kind === 'mid' ? 126915.2 : 0;
  const nachPr = late ? 791328.36 : kind === 'mid' ? 459867 : 0;
  const ost = status === 'Закрыт' ? 0 : 4813696.2;
  return [branch, id, '148010006' + uniq + '001', name, 5000000, ost, status === 'Закрыт' ? 0 : ostPr, 54,
    d.fromYMD(2026, 4, 20), d.fromYMD(2032, 4, 5), ost * 54 / 36500 * 21, status === 'Закрыт' ? 0 : nachPr,
    'Стандартный', status || 'Утвержден', '3-Долгосрочные', 'AA 0000000', pinfl, '998900000000', ADDR,
    'Навоий', 'ХАТИРЧИ ТУМАНИ'];
}

// Snapshotdan bir kun oldin berilgan kredit (haqiqiy snapshotlarda doim bo'ladi)
function recentLoan() {
  const r = loan('12842', 104, '60000008', 'YANGI MIJOZ', '55555555555555', 'ok');
  r[5] = 5000000;
  r[8] = d.fromYMD(2026, 8, 25);
  r[9] = d.fromYMD(2032, 8, 5);
  r[10] = 5000000 * 54 / 36500;
  return r;
}

function snapshot() {
  const rows = [HEADER,
    loan('12842', 101, '60000001', 'TESTOV ALI', '11111111111111', 'late'),
    loan('12842', 102, '60000001', 'TESTOV ALI', '11111111111111', 'ok'),
    loan('06292', 201, '60000002', 'TESTOV ALI', '11111111111111', 'ok'),
    loan('55890', 301, '60000003', 'TESTOV ALI', '11111111111111', 'ok', 'Закрыт'),
    loan('06292', 202, '60000004', 'SINOV VALI', '22222222222222', 'mid'),
    loan('55890', 302, '60000005', 'AAA BBB', '33333333333333', 'late'),
    loan('12842', 103, '60000006', 'AAA BBB', '33333333333333', 'ok'),
    loan('31685', 401, '60000007', 'BOSHQA FIRMA', '44444444444444', 'late'),
    recentLoan()];
  return writer.build([{ name: 'Sheet0', rows: rows, headerRows: 1, types: TYPES }]);
}

function readBack(bytes) {
  const rows = [];
  reader.readFirstSheet(bytes, (cells) => rows.push(cells));
  return rows;
}

test('80+ mijoz barcha firmalardagi faol kreditlari bilan, har firmaga o\'z ID\'lari', () => {
  const res = pipeline.run(snapshot(), { docDate: d.fromYMD(2026, 10, 2) });
  assert.strictEqual(res.summary.asOfText, '26.08.2026');
  assert.strictEqual(res.zipName, 'Talabnoma_80plus_reyestr_02102026.zip');
  assert.deepStrictEqual(Object.keys(res.files).sort(),
    ['BRIGHT_reyestr.xlsx', 'COMMUNITY_reyestr.xlsx', 'URBAN_reyestr.xlsx', '_korik_80plus.xlsx']);

  const bright = readBack(res.files['BRIGHT_reyestr.xlsx']);
  assert.strictEqual(bright[0][0], 'date');
  assert.strictEqual(bright[1][0], 'Hujjat sanasi');
  assert.strictEqual(bright.length, 4);
  // ism bo'yicha tartib: AAA BBB, keyin TESTOV ALI
  assert.deepStrictEqual(bright.slice(2).map((r) => [r[1], r[3], r[5], r[14]]), [
    ['02102026/1', 'AAA BBB', '103', '60000006'],
    ['02102026/2', 'TESTOV ALI', '101-102', '60000001']]);
  const row = bright[3];
  assert.strictEqual(d.parseDate(row[0]), d.fromYMD(2026, 10, 2));
  assert.strictEqual(row[2], 'Navoiy viloyati, Xatirchi tumani, Bog MFY, Nur koʻchasi, 7-uy');
  assert.strictEqual(row[6], 10000000);
  assert.strictEqual(row[7], 'ўн миллион');
  assert.deepStrictEqual([row[11], row[12], row[13]], [12, 169, '11111111111111']);

  const urban = readBack(res.files['URBAN_reyestr.xlsx']);
  assert.deepStrictEqual(urban.slice(2).map((r) => [r[3], r[5]]), [['TESTOV ALI', '201']]);

  const community = readBack(res.files['COMMUNITY_reyestr.xlsx']);
  assert.deepStrictEqual(community.slice(2).map((r) => [r[3], r[5]]), [['AAA BBB', '302']]);

  assert.strictEqual(res.summary.stats.triggerClients, 2);
  assert.strictEqual(res.summary.stats.firms.URBAN.rowsWithout80, 1);
});

test('faqat muddati o\'tgan shartnomalar rejimi', () => {
  const res = pipeline.run(snapshot(), { docDate: d.fromYMD(2026, 10, 2), onlyOverdueLoans: true });
  const bright = readBack(res.files['BRIGHT_reyestr.xlsx']);
  assert.deepStrictEqual(bright.slice(2).map((r) => r[5]), ['101']);
  assert.strictEqual(readBack(res.files['URBAN_reyestr.xlsx']).length, 2);
});

test('kerakli ustun bo\'lmasa tushunarli xato', () => {
  const bytes = writer.build([{ name: 'S', rows: [['branch', 'ld_id', 'account', 'client_name', 'summ_kr', 'rate']] }]);
  assert.throws(() => pipeline.run(bytes, {}), /kerakli ustunlar yo'q: summ_ost_ze/);
});

test('qo\'lda kiritilgan holat sanasi foizlarga mos kelmasa ogohlantiradi', () => {
  const res = pipeline.run(snapshot(), { docDate: d.fromYMD(2026, 10, 2), asOf: d.fromYMD(2026, 8, 31) });
  assert.match(res.summary.asOfWarning, /26\.08\.2026/);
  const ok = pipeline.run(snapshot(), { docDate: d.fromYMD(2026, 10, 2), asOf: d.fromYMD(2026, 8, 26) });
  assert.strictEqual(ok.summary.asOfWarning, '');
});
