'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { toWords } = require('../src/numberWords');

test('summalar so\'z bilan (namunadagi format)', () => {
  assert.strictEqual(toWords(86400000), 'саксон олти миллион тўрт юз минг');
  assert.strictEqual(toWords(103698247), 'бир юз уч миллион олти юз тўқсон саккиз минг икки юз қирқ етти');
  assert.strictEqual(toWords(14000000), 'ўн тўрт миллион');
  assert.strictEqual(toWords(15756121), 'ўн беш миллион етти юз эллик олти минг бир юз йигирма бир');
});

test('chegaraviy qiymatlar', () => {
  assert.strictEqual(toWords(0), 'нол');
  assert.strictEqual(toWords(100), 'бир юз');
  assert.strictEqual(toWords(1000), 'бир минг');
  assert.strictEqual(toWords(1001000), 'бир миллион бир минг');
  assert.strictEqual(toWords(2000000000), 'икки миллиард');
  assert.strictEqual(toWords(12345.6), 'ўн икки минг уч юз қирқ олти');
});
