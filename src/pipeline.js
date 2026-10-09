// Snapshot .xlsx -> reyestr fayllari (ZIP). Brauzer (Web Worker) va Node CLI shu funksiyani chaqiradi.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});
  var need = function (n) { return R80 ? R80[n] : require('./' + n); };
  var fflate = R80 ? root.fflate : require('../vendor/fflate.js');
  var config = need('config');
  var dates = need('dates');
  var dpd = need('dpd');
  var reader = need('xlsxReader');
  var registry = need('registry');

  function branchKey(v) {
    return String(v === null || v === undefined ? '' : v).trim().replace(/\.0+$/, '').replace(/^0+/, '');
  }

  function toNum(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var n = parseFloat(String(v).replace(/[\s ]/g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  function toText(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
    return String(v).trim();
  }

  function headerMap(cells) {
    var map = {};
    var lower = cells.map(function (c) { return toText(c).toLowerCase(); });
    Object.keys(config.columns).forEach(function (field) {
      var names = config.columns[field];
      for (var i = 0; i < lower.length; i++) {
        if (names.indexOf(lower[i]) >= 0) { map[field] = i; return; }
      }
    });
    return map;
  }

  // Snapshotni o'qib, 3 firmaga tegishli kreditlarni normallashtirilgan ko'rinishda qaytaradi.
  function readLoans(buffer, firms, onProgress) {
    var firmByBranch = {};
    firms.forEach(function (f) { firmByBranch[branchKey(f.branch)] = f.name; });
    var map = null, header = null;
    var loans = [];
    var counts = { rows: 0, otherBranches: {}, numericAccounts: 0 };

    reader.readFirstSheet(buffer, function (cells) {
      if (!map) {
        var m = headerMap(cells);
        if (Object.keys(m).length >= 5) { map = m; header = cells.map(toText); }
        return;
      }
      counts.rows++;
      var get = function (f) { return map[f] === undefined ? null : cells[map[f]]; };
      var bkey = branchKey(get('branch'));
      var firm = firmByBranch[bkey];
      if (!firm) {
        if (bkey) counts.otherBranches[bkey] = (counts.otherBranches[bkey] || 0) + 1;
        return;
      }
      var account = get('account');
      if (typeof account === 'number') counts.numericAccounts++;
      account = toText(account);
      var pinfl = toText(get('pinfl'));
      if (/^\d+$/.test(pinfl) && pinfl.length < 14) pinfl = ('00000000000000' + pinfl).slice(-14);
      loans.push({
        firm: firm,
        branch: toText(get('branch')),
        ldId: toText(get('ldId')),
        account: account,
        uniq: account.length >= 17 ? account.slice(9, 17) : '',
        clientName: toText(get('clientName')),
        pinfl: pinfl || ('?' + toText(get('clientName'))),
        summKr: toNum(get('summKr')) || 0,
        ost: toNum(get('ost')) || 0,
        ostPr: toNum(get('ostPr')) || 0,
        proc: toNum(get('proc')) || 0,
        nachPr: toNum(get('nachPr')) || 0,
        rate: toNum(get('rate')) || 0,
        issue: dates.parseDate(get('issue')),
        close: dates.parseDate(get('close')),
        status: toText(get('status')),
        postAddress: toText(get('postAddress')),
        regionName: toText(get('regionName')),
        distrName: toText(get('distrName')),
        dpdFile: map.dpdFile === undefined ? null : toNum(get('dpdFile'))
      });
    }, onProgress);

    if (!map) throw new Error('Sarlavha qatori topilmadi (branch, ld_id, pinfl ... ustunlari kerak)');
    var missing = config.requiredColumns.filter(function (f) { return map[f] === undefined; });
    if (missing.length) {
      throw new Error('Faylda kerakli ustunlar yo\'q: ' + missing.map(function (f) { return config.columns[f][0]; }).join(', '));
    }
    var used = {};
    Object.keys(map).forEach(function (f) { used[map[f]] = true; });
    var unknown = header.filter(function (h, i) { return h && !used[i]; });
    return { loans: loans, counts: counts, unknownColumns: unknown };
  }

  // options: { fileName, asOf (kun|null), docDate (kun), threshold, tolerance, penaltyMultiplier, onlyOverdueLoans }
  function run(buffer, options, onProgress) {
    var progress = onProgress || function () {};
    var d = config.defaults;
    var opts = {
      firms: options.firms || config.firms,
      threshold: options.threshold || d.threshold,
      tolerance: options.tolerance !== undefined ? options.tolerance : d.tolerance,
      penaltyMultiplier: options.penaltyMultiplier !== undefined ? options.penaltyMultiplier : d.penaltyMultiplier,
      onlyOverdueLoans: options.onlyOverdueLoans !== undefined ? options.onlyOverdueLoans : d.onlyOverdueLoans,
      docDate: options.docDate !== undefined && options.docDate !== null ? options.docDate : dates.today(),
      asOf: options.asOf
    };

    var read = readLoans(buffer, opts.firms, function (phase, f) {
      progress({ phase: phase === 'strings' ? 'Matnlar o\'qilmoqda' : 'Qatorlar o\'qilmoqda', fraction: 0.05 + 0.75 * f });
    });
    if (!read.loans.length) throw new Error('Faylda BRIGHT/URBAN/COMMUNITY filiallariga tegishli qator topilmadi');

    progress({ phase: 'Kechikish kunlari hisoblanmoqda', fraction: 0.82 });
    var asOfMethod = 'qo\'lda kiritilgan';
    var asOfWarning = '';
    var inf = dpd.inferAsOf(read.loans.filter(function (l) { return !registry.isClosed(l.status); }));
    if (opts.asOf === undefined || opts.asOf === null) {
      opts.asOf = inf.asOf;
      asOfMethod = inf.method === 'foiz'
        ? 'avtomatik: joriy foiz kunlaridan (' + Math.round(inf.score * 100) + '% kreditlar mos)'
        : 'avtomatik: oxirgi berilgan kredit sanasi + 1 kun';
    } else if (inf.method === 'foiz' && Math.abs(opts.asOf - inf.asOf) > 1) {
      asOfWarning = 'Kiritilgan holat sanasi (' + dates.format(opts.asOf) + ') snapshotdagi foizlar holatiga mos emas — ' +
        'foizlar ' + dates.format(inf.asOf) + ' holatida. Kechikish noto\'g\'ri chiqishi mumkin; maydonni bo\'sh qoldiring.';
    }
    if (opts.asOf === null) throw new Error('Hisob sanasini aniqlab bo\'lmadi — uni qo\'lda kiriting');

    var result = registry.build(read.loans, opts);
    progress({ phase: 'Excel fayllar yozilmoqda', fraction: 0.9 });
    var meta = { fileName: options.fileName, asOfMethod: asOfMethod, unknownColumns: read.unknownColumns };
    var files = registry.toFiles(result, meta);
    var zipName = 'Talabnoma_' + opts.threshold + 'plus_reyestr_' + dates.compact(opts.docDate) + '.zip';
    var zip = fflate.zipSync(files, { level: 0 });
    progress({ phase: 'Tayyor', fraction: 1 });

    return {
      zip: zip,
      zipName: zipName,
      files: files,
      summary: {
        asOf: opts.asOf,
        asOfText: dates.format(opts.asOf),
        asOfMethod: asOfMethod,
        asOfWarning: asOfWarning,
        docDateText: dates.format(opts.docDate),
        threshold: opts.threshold,
        rowsRead: read.counts.rows,
        loansInFirms: read.loans.length,
        otherBranches: read.counts.otherBranches,
        numericAccounts: read.counts.numericAccounts,
        stats: result.stats
      }
    };
  }

  var api = { run: run, readLoans: readLoans };
  if (R80) R80.pipeline = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
