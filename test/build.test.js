'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const build = require('../tools/build');

test('reyestr.html src/ va web/ bilan mos (o\'zgartirishdan keyin `npm run build`)', () => {
  assert.ok(fs.readFileSync(build.OUT, 'utf8') === build.render(), 'reyestr.html eskirgan — `npm run build` ni ishga tushiring');
});
