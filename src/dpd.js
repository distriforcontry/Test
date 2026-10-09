// Kechikish kunini (DPD) snapshot ma'lumotlaridan hisoblash.
//
// Snapshotda "kechikish kuni" ustuni yo'q, shuning uchun u to'lov jadvalidan tiklanadi:
//  * To'lov kuni = date_close dagi kun; to'lovlar berilgan oydan keyingi oydan boshlab har oy,
//    shanba/yakshanba bo'lsa dushanbaga suriladi. Birinchi to'lov faqat foiz.
//  * Muddati o'tgan asosiy qarz (summ_ostpr_ze) oxirgi to'lovlarning asosiy qarz qismlariga
//    (annuitet kabi oyma-oy o'sib boradi) yangidan eskiga qarab taqsimlanadi.
//  * Muddati o'tgan foiz (sumnachpr_eqv) dan avval muddati o'tgan asosiy qarzga hisoblangan
//    foiz va 1.5x jarima foizi ayiriladi, qolgani oxirgi davrlar foiziga taqsimlanadi.
//  * To'lanmagan eng eski to'lov sanasidan hisob sanasigacha bo'lgan kunlar = DPD.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});
  var need = function (n) { return R80 ? R80[n] : require('./' + n); };
  var dates = need('dates');

  // Berilgan sana va yopilish sanasidan to'lov sanalari ro'yxati (dam olish kunlari surilgan).
  function dueDates(issue, close) {
    var out = [];
    if (issue === null || close === null || close <= issue) return out;
    var c = dates.toYMD(close);
    var s = dates.toYMD(issue);
    for (var k = 1; k <= 600; k++) {
      var mm = s.m + k;
      var y = s.y + Math.floor((mm - 1) / 12);
      var m = ((mm - 1) % 12) + 1;
      var nominal = dates.fromYMD(y, m, Math.min(c.d, dates.daysInMonth(y, m)));
      if (nominal > close) break;
      out.push(dates.shiftWeekend(nominal));
    }
    return out;
  }

  // loan: { summKr, ost, ostPr, proc, nachPr, rate, issue, close }
  // Natija: { dpd, unpaid (to'lanmagan to'lovlar soni), oldestDue, duesPassed }
  function estimate(loan, asOf, opts) {
    opts = opts || {};
    var tol = opts.tolerance !== undefined ? opts.tolerance : 0.005;
    var pen = opts.penaltyMultiplier !== undefined ? opts.penaltyMultiplier : 1.5;
    var res = { dpd: 0, unpaid: 0, oldestDue: null, duesPassed: 0, unpaidInterest: 0, unpaidPrincipal: 0 };
    var due = dueDates(loan.issue, loan.close).filter(function (d) { return d < asOf; });
    var n = due.length;
    res.duesPassed = n;
    if (!n) return res;

    var rate = loan.rate > 0 ? loan.rate : 0;
    var rd = rate / 36500;
    var ost = loan.ost || 0, ostPr = loan.ostPr || 0, nachPr = loan.nachPr || 0;

    // 1) Asosiy qarz: muddati o'tgan qismni oxirgi to'lovlarga taqsimlash
    var kP = 0;
    var unpaidParts = [];
    var scheduled = (loan.summKr || 0) - ost; // shu kungacha to'lanishi kerak bo'lgan asosiy qarz
    var m = n > 1 ? n - 1 : 0;                 // birinchi to'lov faqat foiz
    if (m === 0 && scheduled > 1) m = n;
    if (m > 0 && scheduled > 0 && ostPr > 0) {
      var g = 1 + rate / 1200;
      var weights = [], sw = 0;
      for (var j = 0; j < m; j++) { weights.push(Math.pow(g, j)); sw += weights[j]; }
      var rem = ostPr;
      for (j = m - 1; j >= 0; j--) {
        var part = scheduled * weights[j] / sw;
        if (rem <= Math.max(tol * part, 1)) break;
        var amt = Math.min(part, rem);
        unpaidParts.push({ index: n - m + j, amount: amt });
        rem -= amt;
        kP++;
      }
    }

    // 2) Foiz: jarima va muddati o'tgan asosiy qarz foizini ayirib, davrlarga taqsimlash
    var kI = 0;
    if (rd > 0 && nachPr > 0) {
      var extra = ostPr * rd * (asOf - due[n - 1]);
      unpaidParts.forEach(function (p) { extra += pen * rd * p.amount * (asOf - due[p.index]); });
      var remI = nachPr - extra;
      var balance = ost + ostPr;
      for (var i = n - 1; i >= 0; i--) {
        var start = i > 0 ? due[i - 1] : loan.issue;
        var interest = balance * rd * (due[i] - start);
        if (interest <= 0 || remI <= Math.max(tol * interest, 1)) break;
        kI++;
        remI -= interest;
      }
    }

    var k = Math.min(n, Math.max(kI, kP));
    res.unpaidInterest = kI;
    res.unpaidPrincipal = kP;
    res.unpaid = k;
    if (k > 0) {
      res.oldestDue = due[n - k];
      res.dpd = asOf - res.oldestDue;
    }
    return res;
  }

  // Hisob sanasini aniqlash: joriy foiz (sumproc_eqv) necha kunlik ekanidan.
  // Har bir kredit uchun: hisob sanasi - oxirgi to'lov sanasi = sumproc / (ost * stavka / 36500).
  function inferAsOf(loans) {
    var maxIssue = null;
    loans.forEach(function (l) { if (l.issue !== null && (maxIssue === null || l.issue > maxIssue)) maxIssue = l.issue; });
    if (maxIssue === null) return { asOf: null, method: 'none', score: 0 };
    var sample = loans.filter(function (l) {
      return l.issue !== null && l.close !== null && l.ost > 0 && l.proc > 0 && l.rate > 0;
    });
    var step = Math.max(1, Math.floor(sample.length / 4000));
    var pts = [];
    for (var i = 0; i < sample.length; i += step) {
      var l = sample[i];
      pts.push({ days: l.proc / (l.ost * l.rate / 36500), issue: l.issue, due: dueDates(l.issue, l.close) });
    }
    var best = null, bestScore = -1;
    for (var c = maxIssue - 5; c <= maxIssue + 20; c++) {
      var score = 0;
      for (var p = 0; p < pts.length; p++) {
        var d = pts[p].due, last = pts[p].issue; // birinchi to'lovgacha foiz berilgan kundan hisoblanadi
        for (var q = 0; q < d.length && d[q] < c; q++) last = d[q];
        if (c > last && Math.abs(c - last - pts[p].days) < 0.51) score++;
      }
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (pts.length && bestScore >= pts.length * 0.5) {
      return { asOf: best, method: 'foiz', score: bestScore / pts.length };
    }
    return { asOf: maxIssue + 1, method: 'oxirgi_kredit', score: pts.length ? bestScore / pts.length : 0 };
  }

  var api = { dueDates: dueDates, estimate: estimate, inferAsOf: inferAsOf };
  if (R80) R80.dpd = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
