// Summani o'zbek (kirill) tilida so'z bilan yozish: 103698247 ->
// "бир юз уч миллион олти юз тўқсон саккиз минг икки юз қирқ етти"
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});

  var ONES = ['', 'бир', 'икки', 'уч', 'тўрт', 'беш', 'олти', 'етти', 'саккиз', 'тўққиз'];
  var TENS = ['', 'ўн', 'йигирма', 'ўттиз', 'қирқ', 'эллик', 'олтмиш', 'етмиш', 'саксон', 'тўқсон'];
  var SCALES = ['', 'минг', 'миллион', 'миллиард', 'триллион'];

  function triplet(n) {
    var words = [];
    var h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
    if (h) words.push(ONES[h], 'юз');
    if (t) words.push(TENS[t]);
    if (o) words.push(ONES[o]);
    return words;
  }

  function toWords(value) {
    var n = Math.round(Number(value));
    if (!isFinite(n)) return '';
    if (n === 0) return 'нол';
    var prefix = n < 0 ? ['минус'] : [];
    n = Math.abs(n);
    var groups = [];
    while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }
    var words = [];
    for (var i = groups.length - 1; i >= 0; i--) {
      if (!groups[i]) continue;
      words = words.concat(triplet(groups[i]));
      if (SCALES[i]) words.push(SCALES[i]);
    }
    return prefix.concat(words).join(' ');
  }

  var api = { toWords: toWords };
  if (R80) R80.numberWords = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
