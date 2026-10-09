#!/usr/bin/env node
// Buyruq qatori orqali ishlatish:
//   node cli.js snapshot.xlsx [--sana 02.10.2026] [--holat 26.08.2026] [--chegara 80] [--faqat-muddati-otgan] [--out papka]
'use strict';
const fs = require('fs');
const path = require('path');
const pipeline = require('./src/pipeline');
const dates = require('./src/dates');

function usage(msg) {
  if (msg) console.error('Xato: ' + msg + '\n');
  console.error('Foydalanish: node cli.js <snapshot.xlsx> [--sana DD.MM.YYYY] [--holat DD.MM.YYYY] ' +
    '[--chegara 80] [--faqat-muddati-otgan] [--out papka]');
  console.error('  --sana     Hujjat sanasi (standart: bugun)');
  console.error('  --holat    Snapshot holati sanasi (standart: avtomatik aniqlanadi)');
  console.error('  --chegara  Kechikish chegarasi, kun (standart: 80)');
  process.exit(1);
}

function parseDay(s, name) {
  const d = dates.parseDate(s);
  if (d === null) usage(name + ' sanasi noto\'g\'ri: ' + s);
  return d;
}

const args = process.argv.slice(2);
const opts = { asOf: null };
let input = null;
let outDir = '.';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--sana') opts.docDate = parseDay(args[++i], 'Hujjat');
  else if (a === '--holat') opts.asOf = parseDay(args[++i], 'Holat');
  else if (a === '--chegara') opts.threshold = parseInt(args[++i], 10);
  else if (a === '--faqat-muddati-otgan') opts.onlyOverdueLoans = true;
  else if (a === '--out') outDir = args[++i];
  else if (a === '-h' || a === '--help') usage();
  else if (!input) input = a;
  else usage('ortiqcha argument: ' + a);
}
if (!input) usage();

opts.fileName = path.basename(input);
const started = Date.now();
let lastPhase = '';
const res = pipeline.run(fs.readFileSync(input), opts, (p) => {
  if (p.phase !== lastPhase) { lastPhase = p.phase; console.error('… ' + p.phase); }
});
fs.mkdirSync(outDir, { recursive: true });
const zipPath = path.join(outDir, res.zipName);
fs.writeFileSync(zipPath, res.zip);

const s = res.summary;
console.log('Hisob sanasi: ' + s.asOfText + ' (' + s.asOfMethod + ')');
if (s.asOfWarning) console.log('DIQQAT: ' + s.asOfWarning);
console.log('Hujjat sanasi: ' + s.docDateText + ', chegara: ' + s.threshold + ' kun');
console.log('O\'qilgan qatorlar: ' + s.rowsRead + ', 3 firmadagi kreditlar: ' + s.loansInFirms);
console.log(s.threshold + '+ mijozlar: ' + s.stats.triggerClients);
Object.keys(s.stats.firms).forEach((f) => {
  const x = s.stats.firms[f];
  console.log('  ' + f + ': ' + x.rows + ' qator, ' + x.contracts + ' shartnoma (' + x.rowsWithout80 +
    ' qator boshqa firma sababli)');
});
if (s.stats.missingArea) console.log('Area ID topilmagan qatorlar: ' + s.stats.missingArea);
console.log('Natija: ' + zipPath + ' (' + ((Date.now() - started) / 1000).toFixed(1) + ' s)');
