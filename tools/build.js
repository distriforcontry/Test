#!/usr/bin/env node
// web/index.template.html + src/*.js -> reyestr.html (bitta mustaqil fayl, internet kerak emas).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CORE = [
  'vendor/fflate.js',
  'src/config.js',
  'src/dates.js',
  'src/numberWords.js',
  'src/regions.js',
  'src/address.js',
  'src/dpd.js',
  'src/xlsxReader.js',
  'src/xlsxWriter.js',
  'src/registry.js',
  'src/pipeline.js'
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function inline(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

function render() {
  const core = CORE.map((f) => '// ---- ' + f + ' ----\n' + read(f)).join('\n');
  return read('web/index.template.html')
    .replace('<!-- CORE -->', () => '<script id="r80-core">\n' + inline(core) + '\n</script>')
    .replace('<!-- APP -->', () => '<script>\n' + inline(read('web/app.js')) + '\n</script>');
}

const OUT = path.join(ROOT, 'reyestr.html');

if (require.main === module) {
  const html = render();
  fs.writeFileSync(OUT, html);
  console.log('Yozildi: ' + path.relative(process.cwd(), OUT) + ' (' + Math.round(html.length / 1024) + ' KB)');
}

module.exports = { render: render, OUT: OUT };
