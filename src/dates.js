// Sanalar: 1970-01-01 dan beri kunlar soni (UTC) ko'rinishida ishlanadi.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});

  var DAY_MS = 86400000;

  function fromYMD(y, m, d) {
    return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
  }

  function toYMD(day) {
    var dt = new Date(day * DAY_MS);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }

  // 0 = yakshanba, 6 = shanba
  function weekday(day) {
    return ((day % 7) + 7 + 4) % 7;
  }

  // Shanba/yakshanbaga to'g'ri kelgan to'lov kuni keyingi dushanbaga suriladi.
  function shiftWeekend(day) {
    var w = weekday(day);
    if (w === 6) return day + 2;
    if (w === 0) return day + 1;
    return day;
  }

  // Excel (1900 tizimi) seriya raqami -> kun
  function fromExcelSerial(serial) {
    return Math.floor(serial) - 25569;
  }

  function toExcelSerial(day) {
    return day + 25569;
  }

  // Excel katakidan kelgan qiymatni kunga aylantiradi (raqam yoki matn).
  function parseDate(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) && v > 0 ? fromExcelSerial(v) : null;
    var s = String(v).trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) return fromYMD(+m[1], +m[2], +m[3]);
    m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s);
    if (m) return fromYMD(+m[3], +m[2], +m[1]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s);
    if (m) {
      var a = +m[1], b = +m[2], y = +m[3];
      if (y < 100) y += 2000;
      // Excel AQSh formati (oy/kun/yil); birinchi son 12 dan katta bo'lsa kun/oy/yil.
      return a > 12 ? fromYMD(y, b, a) : fromYMD(y, a, b);
    }
    if (/^\d+(\.\d+)?$/.test(s)) return fromExcelSerial(parseFloat(s));
    return null;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // 26.08.2026
  function format(day) {
    if (day === null || day === undefined) return '';
    var t = toYMD(day);
    return pad2(t.d) + '.' + pad2(t.m) + '.' + t.y;
  }

  // 26082026 (reyestrdagi Shartnoma ID uchun)
  function compact(day) {
    var t = toYMD(day);
    return pad2(t.d) + pad2(t.m) + t.y;
  }

  // 2026-08-26 (<input type="date"> uchun)
  function iso(day) {
    var t = toYMD(day);
    return t.y + '-' + pad2(t.m) + '-' + pad2(t.d);
  }

  function today() {
    var now = new Date();
    return fromYMD(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  var api = {
    fromYMD: fromYMD, toYMD: toYMD, daysInMonth: daysInMonth, weekday: weekday,
    shiftWeekend: shiftWeekend, fromExcelSerial: fromExcelSerial, toExcelSerial: toExcelSerial,
    parseDate: parseDate, format: format, compact: compact, iso: iso, today: today
  };
  if (R80) R80.dates = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
