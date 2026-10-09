// Reyestr qoidasi:
//  1. Mijozning (PINFL) 3 ta firmadan birortasida bitta bo'lsa ham kechikishi >= 80 kunlik
//     faol krediti bo'lsa — mijoz reyestrga tushadi.
//  2. Bunday mijoz qaysi firmalarda faol krediti bo'lsa, o'sha har bir firma reyestriga
//     bitta qator bo'lib yoziladi; qatorga faqat o'sha firmaning kredit ID'lari qo'shiladi.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});
  var need = function (n) { return R80 ? R80[n] : require('./' + n); };
  var dates = need('dates');
  var dpd = need('dpd');
  var regions = need('regions');
  var address = need('address');
  var words = need('numberWords');
  var writer = need('xlsxWriter');

  var KEYS = ['date', 'contract_id', 'address', 'receiver', 'contract_date', 'contract_number', 'loan_amount',
    'loan_amount_words', 'total_debt', 'overdue_debt', 'total_debt_words', 'region', 'area', 'pinfl', 'unique_code'];
  var LABELS = ['Hujjat sanasi', 'Shartnoma ID', 'Manzil (Uy)', 'Qarzdor FISH', 'Shartnoma sanasi', 'Shartnoma raqami',
    'Kredit miqdori', "Kredit miqdori (so'zda)", 'Jami qarzdorlik', "Muddati o'tgan jami qarzdorlik",
    "Jami qarzdorlik (so'zda)", 'Viloyat (Region ID)', 'Tuman/Shahar (Area ID)', 'PINFL', 'Unikalka'];
  var TYPES = ['isoDate', 'str', 'str', 'str', 'isoDate', 'str', 'num', 'str', 'num', 'num', 'str', 'num', 'num', 'str', 'str'];

  function isClosed(status) {
    return /закрыт|yopil|closed/i.test(String(status || ''));
  }

  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function byIssueThenId(a, b) {
    return (a.issue || 0) - (b.issue || 0) || (+a.ldId || 0) - (+b.ldId || 0) || cmp(a.ldId, b.ldId);
  }

  // loans: pipeline.normalize() natijasi; opts: { firms, asOf, docDate, threshold, tolerance,
  //        penaltyMultiplier, onlyOverdueLoans }
  function build(loans, opts) {
    var firmNames = opts.firms.map(function (f) { return f.name; });
    var threshold = opts.threshold;
    var active = loans.filter(function (l) {
      return l.firm && !isClosed(l.status) && (l.ost || 0) + (l.ostPr || 0) > 0.5;
    });

    active.forEach(function (l) {
      if (l.dpdFile !== null && l.dpdFile !== undefined) {
        l.dpd = Math.round(l.dpdFile);
        l.dpdSource = 'fayl';
        l.oldestDue = null;
        l.unpaid = null;
      } else {
        var e = dpd.estimate(l, opts.asOf, opts);
        l.dpd = e.dpd;
        l.dpdSource = 'hisob';
        l.oldestDue = e.oldestDue;
        l.unpaid = e.unpaid;
      }
    });

    var byPinfl = new Map();
    active.forEach(function (l) {
      if (!byPinfl.has(l.pinfl)) byPinfl.set(l.pinfl, []);
      byPinfl.get(l.pinfl).push(l);
    });

    // Sabab: qaysi firmalarda nechta 80+ kredit bor
    var triggers = new Map();
    byPinfl.forEach(function (list, pinfl) {
      var hit = list.filter(function (l) { return l.dpd >= threshold; });
      if (!hit.length) return;
      var parts = firmNames.map(function (f) {
        var h = hit.filter(function (l) { return l.firm === f; });
        if (!h.length) return null;
        var mx = Math.max.apply(null, h.map(function (l) { return l.dpd; }));
        return f + ': ' + h.length + ' ta (' + mx + ' kun)';
      }).filter(Boolean);
      triggers.set(pinfl, parts.join('; '));
    });

    var registries = {};
    var korik = [];
    var details = [];
    var stats = { firms: {}, triggerClients: triggers.size, activeLoans: active.length, missingArea: 0 };

    firmNames.forEach(function (firm) {
      var rows = [];
      triggers.forEach(function (reason, pinfl) {
        var list = byPinfl.get(pinfl).filter(function (l) { return l.firm === firm; });
        if (opts.onlyOverdueLoans) list = list.filter(function (l) { return (l.ostPr || 0) + (l.nachPr || 0) > 0; });
        if (!list.length) return;
        list.sort(byIssueThenId);
        var latest = list[list.length - 1];
        var place = regions.lookup(latest.distrName, latest.regionName);
        var addr = address.build(latest.postAddress, place);
        var loanAmount = 0, total = 0, overdue = 0;
        list.forEach(function (l) {
          loanAmount += l.summKr || 0;
          total += (l.ost || 0) + (l.ostPr || 0) + (l.proc || 0) + (l.nachPr || 0);
          overdue += (l.ostPr || 0) + (l.nachPr || 0);
        });
        loanAmount = Math.round(loanAmount);
        total = Math.round(total);
        overdue = Math.round(overdue);
        var notes = [];
        if (addr.note) notes.push(addr.note);
        if (!place.known) notes.push('Tuman lugʻatda yoʻq: ' + (latest.distrName || '—'));
        if (place.areaId === null) notes.push('Area ID topilmadi');
        if (!place.regionId) notes.push('Region ID topilmadi');
        if (place.areaId === null) stats.missingArea++;
        var firmHits = list.filter(function (l) { return l.dpd >= threshold; });
        rows.push({
          firm: firm,
          receiver: latest.clientName,
          pinfl: pinfl,
          uniq: latest.uniq,
          address: addr.address,
          contractDate: list[0].issue,
          contractNumber: list.map(function (l) { return l.ldId; }).join('-'),
          loanAmount: loanAmount,
          total: total,
          overdue: overdue,
          region: place.regionId,
          area: place.areaId,
          loans: list,
          firmHits: firmHits.length,
          maxDpd: Math.max.apply(null, list.map(function (l) { return l.dpd; })),
          reason: reason,
          notes: notes.join('; ')
        });
      });
      rows.sort(function (a, b) { return cmp(a.receiver, b.receiver) || cmp(a.pinfl, b.pinfl); });
      rows.forEach(function (r, i) { r.contractId = dates.compact(opts.docDate) + '/' + (i + 1); });
      registries[firm] = rows;

      var firmActive = active.filter(function (l) { return l.firm === firm; });
      stats.firms[firm] = {
        activeLoans: firmActive.length,
        loans80: firmActive.filter(function (l) { return l.dpd >= threshold; }).length,
        rows: rows.length,
        contracts: rows.reduce(function (s, r) { return s + r.loans.length; }, 0),
        total: rows.reduce(function (s, r) { return s + r.total; }, 0),
        rowsWithout80: rows.filter(function (r) { return !r.firmHits; }).length
      };
      rows.forEach(function (r) {
        korik.push(r);
        r.loans.forEach(function (l) { details.push({ row: r, loan: l }); });
      });
    });

    return { registries: registries, korik: korik, details: details, stats: stats, opts: opts };
  }

  function registrySheet(rows, docDate) {
    var data = [KEYS, LABELS];
    rows.forEach(function (r) {
      data.push([docDate, r.contractId, r.address, r.receiver, r.contractDate, r.contractNumber, r.loanAmount,
        words.toWords(r.loanAmount), r.total, r.overdue, words.toWords(r.total), r.region, r.area, r.pinfl, r.uniq]);
    });
    return { name: "Ma'lumotlar", rows: data, types: TYPES };
  }

  function korikSheet(result) {
    var t = result.opts.threshold;
    var head = ['Firma', 'PINFL', 'Unikalka', 'Qarzdor F.I.Sh', 'Shartnomalar soni', t + '+ shartnoma (shu firmada)',
      'Max kechikish (kun)', t + '+ sababi (barcha firmalar)', 'Shartnoma raqamlari', 'Kredit summasi',
      'Jami qarzdorlik', "Muddati o'tgan", 'Manzil (reyestrda)', 'Viloyat (Region ID)', 'Tuman/Shahar (Area ID)', 'Izoh'];
    var rows = [head];
    result.korik.forEach(function (r) {
      rows.push([r.firm, r.pinfl, r.uniq, r.receiver, r.loans.length, r.firmHits, r.maxDpd, r.reason,
        r.contractNumber, r.loanAmount, r.total, r.overdue, r.address, r.region, r.area, r.notes]);
    });
    return {
      name: t + '+ korik', rows: rows, headerRows: 1, styledHeader: true, freeze: 1, autoFilter: true,
      types: ['str', 'str', 'str', 'str', 'num', 'num', 'num', 'str', 'str', 'money', 'money', 'money', 'str', 'num', 'num', 'str'],
      widths: [12, 16, 11, 38, 10, 12, 11, 34, 42, 16, 17, 17, 60, 10, 10, 34]
    };
  }

  function detailSheet(result) {
    var head = ['Firma', 'PINFL', 'Unikalka', 'Qarzdor F.I.Sh', 'Kredit ID', 'Hisob raqami', 'Berilgan sana',
      'Yopilish sanasi', 'Kredit summasi', 'Asosiy qarz (joriy)', "Muddati o'tgan asosiy qarz", 'Joriy foiz',
      "Muddati o'tgan foiz", 'Jami qarz', 'Stavka', "To'lanmagan to'lovlar", "Eng eski to'lanmagan to'lov",
      'Kechikish (kun)', 'Kechikish manbasi', 'Status'];
    var rows = [head];
    result.details.forEach(function (d) {
      var l = d.loan;
      rows.push([d.row.firm, l.pinfl, l.uniq, l.clientName, l.ldId, l.account, l.issue, l.close, l.summKr, l.ost, l.ostPr,
        l.proc, l.nachPr, Math.round(((l.ost || 0) + (l.ostPr || 0) + (l.proc || 0) + (l.nachPr || 0)) * 100) / 100,
        l.rate, l.unpaid, l.oldestDue, l.dpd, l.dpdSource, l.status]);
    });
    return {
      name: 'Shartnomalar', rows: rows, headerRows: 1, styledHeader: true, freeze: 1, autoFilter: true,
      types: ['str', 'str', 'str', 'str', 'str', 'str', 'date', 'date', 'money', 'money', 'money', 'money', 'money', 'money',
        'num', 'num', 'date', 'num', 'str', 'str'],
      widths: [12, 16, 11, 38, 10, 22, 12, 12, 14, 14, 14, 13, 13, 14, 8, 11, 13, 10, 10, 12]
    };
  }

  function settingsSheet(result, meta) {
    var o = result.opts, s = result.stats;
    var rows = [['Parametr', 'Qiymat'],
      ['Snapshot fayli', meta.fileName || ''],
      ['Hisob sanasi (snapshot holati)', dates.format(o.asOf)],
      ['Hisob sanasi qanday aniqlandi', meta.asOfMethod || ''],
      ['Hujjat sanasi', dates.format(o.docDate)],
      ['Kechikish chegarasi (kun)', o.threshold],
      ['Qoida', 'Mijozning istalgan firmada bitta ' + o.threshold + '+ krediti bo\'lsa, barcha firmalardagi faol ' +
        'kreditlari o\'z firmasi reyestriga qo\'shiladi (har firmaga faqat o\'z kredit ID\'lari).'],
      ['Shartnomalar', o.onlyOverdueLoans ? "Faqat muddati o'tgan qarzi bor shartnomalar" : 'Barcha faol shartnomalar'],
      ['Faol kreditlar (3 firma)', s.activeLoans],
      [o.threshold + '+ mijozlar (PINFL)', s.triggerClients],
      ['Area ID topilmagan qatorlar', s.missingArea]];
    Object.keys(s.firms).forEach(function (f) {
      var x = s.firms[f];
      rows.push([f + ': faol kreditlar / ' + o.threshold + '+ kreditlar', x.activeLoans + ' / ' + x.loans80]);
      rows.push([f + ': reyestr qatorlari / shartnomalar', x.rows + ' / ' + x.contracts]);
      rows.push([f + ': shu firmada ' + o.threshold + '+ yo\'q, boshqa firma sababli qo\'shilgan', x.rowsWithout80]);
    });
    if (meta.unknownColumns && meta.unknownColumns.length) rows.push(['Ishlatilmagan ustunlar', meta.unknownColumns.join(', ')]);
    return { name: 'Sozlamalar', rows: rows, headerRows: 1, styledHeader: true, widths: [52, 90], types: ['str', 'str'] };
  }

  // Natijaviy fayllar: { 'BRIGHT_reyestr.xlsx': Uint8Array, ..., '_korik_80plus.xlsx': Uint8Array }
  function toFiles(result, meta) {
    var files = {};
    Object.keys(result.registries).forEach(function (firm) {
      files[firm + '_reyestr.xlsx'] = writer.build([registrySheet(result.registries[firm], result.opts.docDate)]);
    });
    files['_korik_' + result.opts.threshold + 'plus.xlsx'] = writer.build([korikSheet(result), detailSheet(result),
      settingsSheet(result, meta || {})]);
    return files;
  }

  var api = { build: build, toFiles: toFiles, KEYS: KEYS, LABELS: LABELS, isClosed: isClosed };
  if (R80) R80.registry = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
