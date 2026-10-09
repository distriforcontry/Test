// Manzil: snapshotdagi `post_address` dan ko'cha/uy qismini ajratib, tozalaydi.
// Viloyat va tuman nomi `regions.js` dan olinadi (post_address dagi ruscha nomlar tashlab yuboriladi).
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});

  // Kirill harflari uchun ham ishlaydigan so'z chegaralari (bo'laklar bo'shliq bilan o'ralgan).
  var B = '(?<=\\s)';
  var E = '(?=\\s)';
  var NUM = '(\\d+(?:[A-ZА-ЯЎҚҒҲ]|\\s[A-ZА-ЯЎҚҒҲ](?=\\s))?(?:\\s?[-/]\\s?\\d+[A-ZА-ЯЎҚҒҲ]?)?)';
  var HOUSE = '(?:UY|UI|D|DOM|УЙ|Д|ДОМ)';
  var FLAT = '(?:KV|КВ|KVARTIRA|XONADON|ХОНАДОН)';
  var NONE = '(?:RA[KQ]AMSIZ|R\\s?\\/?\\s?SIZ|R\\s?\\.?\\s?\\/?\\s?S\\.?|B\\s?\\.?\\s?\\/?\\s?N\\.?|0|-)';

  function re(src) { return new RegExp(src, 'g'); }

  // Viloyat/tuman/shahar bo'laklari (ular lotincha nom bilan qayta yoziladi)
  var ADMIN_PATTERNS = [
    /[A-Z-]+SKAYA\s+(OBLAST|OBL)\.?/g,
    /[А-Я-]+СКАЯ\s+ОБЛАСТЬ/g,
    /[A-Z-]+(SKIY|SKII|SKIJ|SKY)\s+(RAYON|RAION|RPYON|R-N)\.?/g,
    /[А-Я-]+СКИЙ\s+РАЙОН/g,
    /KARAKALPAKSTAN(SKAYA)?(\s+RESPUBLIKA)?/g,
    /(РЕСПУБЛИКА\s+)?КАРАКАЛПАКСТАН/g,
    /(RESPUBLIKA\s+)?UZBEKISTAN(?![A-Z])/g,
    /(РЕСПУБЛИКА\s+)?УЗБЕКИСТАН(?![А-Я])/g,
    /GOROD\s+[A-Z-]+/g,
    /ГОРОД\s+[А-Я-]+/g
  ];

  // Butun bo'lak faqat shahar nomidan iborat bo'lsa: "NAVOIY SH.", "YANGIYUL G."
  var CITY_SEGMENT = /^\s*[A-Z'-]+\s+(SH|G|SHAHRI|SHAXRI|SHAXAR|SHAHAR)\.?\s*$/;
  // Butun bo'lak viloyat/tuman/shahar nomi bo'lsa: "SHARAF RASHIDOVSKIY RAYON", "GOROD ..."
  var ADMIN_SEGMENT = /((RAYON|RAION|RPYON|OBLAST|OBL)\.?|РАЙОН|ОБЛАСТЬ)\s*$|^\s*(GOROD|ГОРОД)\s/;

  var RULES = [
    // "UL." / "ул." prefikslari
    [re(B + '(?:UL|УЛ)\\.?' + E), ' '],
    // raqamsiz uy belgilari: "UY R S", "D. RS", "UY:-", "UY 0"
    [re(B + HOUSE + '\\s*[.:]?\\s*' + NONE + E), ' '],
    [re(B + '(?:R\\s?\\.?\\s?\\/?\\s?S|B\\s?\\.?\\s?N)\\.?' + E), ' '],
    // xonadon: "KV. 5", "KV 44", "XONADON:9", "3 XONADON"
    [re(B + FLAT + '\\s*[.:]?\\s*' + NUM + E), '$1-xonadon'],
    [re(B + NUM + '\\s*-?\\s*' + FLAT + E), '$1-xonadon'],
    // uy: "D. 49", "DOM 10", "UY:181", "UY 30", "19-UY", "35 UI", "21UY", "UY:18-UY"
    [re(B + HOUSE + '\\s*[.:]?\\s*' + NUM + '\\s*-?\\s*(?:UY|UI|УЙ)' + E), '$1-uy'],
    [re(B + HOUSE + '\\s*[.:]?\\s*' + NUM + '-?' + E), '$1-uy'],
    [re(B + NUM + '\\s*-?\\s*(?:UY|UI|УЙ)' + E), '$1-uy'],
    // "D. 55-" kabi chala yozuv
    [re('(\\d)-uy-' + E), '$1-uy'],
    // qolgan bo'sh "KV.", "D.", "UY"
    [re(B + '(?:' + HOUSE + '|' + FLAT + ')\\s*[.:]?' + E), ' ']
  ];

  var WORDS = {
    MFI: 'MFY', MFY: 'MFY', MSG: 'MFY', MFJ: 'MFY',
    KFI: 'QFY', KFY: 'QFY', QFY: 'QFY', SSG: 'SSG', GSG: 'GSG', SHFY: 'ShFY', FI: 'FY', FY: 'FY',
    KUCHASI: 'koʻchasi', KUCHA: 'koʻcha', MAVZESI: 'mavzesi',
    KISHLOGI: 'qishlogʻi', MAXALLASI: 'mahallasi', DAXASI: 'dahasi', SHAXARCHASI: 'shaharchasi'
  };

  function titleWord(w) {
    if (WORDS[w]) return WORDS[w];
    if (/[a-zʻ]/.test(w) || !/[A-Z]/.test(w)) return w;
    return w.replace(/[A-Z][A-Z']*/g, function (p) { return p.charAt(0) + p.slice(1).toLowerCase(); });
  }

  function cleanSegment(seg) {
    var s = ' ' + seg.replace(/\s+/g, ' ').trim() + ' ';
    RULES.forEach(function (r) { s = s.replace(r[0], r[1]); s = s.replace(/\s+/g, ' '); if (s[0] !== ' ') s = ' ' + s; if (s[s.length - 1] !== ' ') s += ' '; });
    s = s.trim().replace(/^[.,:;\-/\s]+|[.,:;\-/\s]+$/g, '');
    if (!s || !/[0-9A-ZА-ЯЎҚҒҲ]/.test(s.replace(/-(uy|xonadon)/g, ''))) return /\d-(uy|xonadon)/.test(s) ? s : '';
    return s.split(' ').map(titleWord).join(' ');
  }

  function signature(seg) {
    return seg.toUpperCase().replace(/[^0-9A-ZА-ЯЎҚҒҲ]/g, '');
  }

  // Ko'cha/uy qismini qaytaradi ('' — faqat tuman ma'lum).
  function street(raw) {
    if (!raw) return '';
    var s = String(raw).toUpperCase().replace(/[`’‘ʻʼ]/g, "'").replace(/\s+/g, ' ').trim();
    // "KO CHASI", "O' G' LI" kabi bo'linib qolgan so'zlar
    s = s.replace(/KO'?\s?CHASI/g, 'KUCHASI').replace(/^G\.?\s+[A-Z-]+\s/, ', ');
    s = s.split(',').filter(function (p) { return !CITY_SEGMENT.test(p) && !ADMIN_SEGMENT.test(p); }).join(',');
    ADMIN_PATTERNS.forEach(function (p) { s = s.replace(p, ','); });
    var out = [];
    var seen = {};
    s.split(',').forEach(function (p) {
      var c = cleanSegment(p);
      if (!c) return;
      var sig = signature(c);
      if (seen[sig]) return;
      seen[sig] = true;
      out.push(c);
    });
    return out.join(', ');
  }

  // To'liq manzil: "Viloyat, Tuman, ko'cha..." va izoh.
  function build(postAddress, place) {
    var st = street(postAddress);
    var parts = [place.regionName, place.districtName, st].filter(Boolean);
    var note = st ? '' : 'Faqat tuman — toʻliq manzil yoʻq';
    return { address: parts.join(', '), street: st, note: note };
  }

  var api = { street: street, build: build };
  if (R80) R80.address = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
