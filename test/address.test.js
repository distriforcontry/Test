'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { street, build } = require('../src/address');

test('vergulli tizim manzili', () => {
  assert.strictEqual(street('RESPUBLIKA UZBEKISTAN, SAMARKANDSKAYA OBL, NARPAYSKIY RAYON, UL. D. 12, D. RS, KV.'), '12-uy');
  assert.strictEqual(street('RESPUBLIKA UZBEKISTAN, NAVOINSKAYA OBLAST, XATIRCHINSKIY RAYON, UL. KV., D. RS, KV.'), '');
  assert.strictEqual(
    street('RESPUBLIKA UZBEKISTAN, KASHKADARINSKAYA OBL, GOROD SHAXRISABZ, UL. BOG MFY, NAVRO KUCHASI, D. 7, KV.'),
    'Bog MFY, Navro koʻchasi, 7-uy');
  assert.strictEqual(
    street('RESPUBLIKA UZBEKISTAN, DJIZZAKSKAYA OBLAST, SHARAF RASHIDOVSKIY RAYON, UL. KV., D. RS, KV.'), '');
  assert.strictEqual(
    street('RESPUBLIKA UZBEKISTAN, FERGANSKAYA OBLAST, UZBEKISTANSKIY RAYON, UL. TOVUSH MSG, D. RS, KV.'), 'Tovush MFY');
});

test('vergulsiz manzil', () => {
  assert.strictEqual(street('YULDUZ MFI GULZOR KUCHASI 35 UI 3 XONADON'), 'Yulduz MFY Gulzor koʻchasi 35-uy 3-xonadon');
  assert.strictEqual(street('NUROBOD KFI BOG MFI BAHOR KUCHASI UY R S'), 'Nurobod QFY Bog MFY Bahor koʻchasi');
  assert.strictEqual(street('BOG MFI NUR UY 30'), 'Bog MFY Nur 30-uy');
});

test('takroriy uy raqami bir marta yoziladi', () => {
  assert.strictEqual(street('RESPUBLIKA UZBEKISTAN, XAREZMSKAYA OBLAST, XANKINSKIY RAYON, UL. 21-UY, D. 21UY'), '21-uy');
});

test('to\'liq manzil va izoh', () => {
  const place = { regionName: 'Navoiy viloyati', districtName: 'Xatirchi tumani' };
  assert.deepStrictEqual(build('RESPUBLIKA UZBEKISTAN, NAVOINSKAYA OBLAST, XATIRCHINSKIY RAYON, UL. KV., D. RS, KV.', place), {
    address: 'Navoiy viloyati, Xatirchi tumani', street: '', note: 'Faqat tuman — toʻliq manzil yoʻq'
  });
});
