// Katta .xlsx faylni oqim (stream) usulida o'qish: varaq XML'i to'liq xotiraga yuklanmaydi.
// 30 MB / 200 ming qatorli snapshot brauzerda ham bemalol o'qiladi.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});
  var fflate = R80 ? root.fflate : require('../vendor/fflate.js');

  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  // ZIP markaziy katalogidan fayllar ro'yxati
  function listEntries(buf) {
    var eocd = -1;
    for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
      if (u32(buf, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Fayl .xlsx (ZIP) formatida emas');
    var count = u16(buf, eocd + 10);
    var off = u32(buf, eocd + 16);
    if (off === 0xffffffff) throw new Error('ZIP64 formatidagi fayl qo\'llab-quvvatlanmaydi');
    var dec = new TextDecoder('utf-8');
    var entries = {};
    for (var k = 0; k < count; k++) {
      if (u32(buf, off) !== 0x02014b50) throw new Error('ZIP katalogi buzilgan');
      var method = u16(buf, off + 10);
      var compSize = u32(buf, off + 20);
      var nameLen = u16(buf, off + 28), extraLen = u16(buf, off + 30), commentLen = u16(buf, off + 32);
      var local = u32(buf, off + 42);
      var name = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));
      var start = local + 30 + u16(buf, local + 26) + u16(buf, local + 28);
      entries[name.replace(/^\//, '')] = { method: method, start: start, size: compSize };
      off += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  function readEntry(buf, entry) {
    var data = buf.subarray(entry.start, entry.start + entry.size);
    if (entry.method === 0) return data;
    if (entry.method === 8) return fflate.inflateSync(data);
    throw new Error('ZIP siqish usuli qo\'llab-quvvatlanmaydi: ' + entry.method);
  }

  function readText(buf, entries, name) {
    var e = entries[name];
    return e ? new TextDecoder('utf-8').decode(readEntry(buf, e)) : null;
  }

  // Bo'laklab ochish: har bir ochilgan bo'lak onChunk(Uint8Array, isLast) ga beriladi.
  function streamEntry(buf, entry, onChunk, onProgress) {
    var CHUNK = 1 << 20;
    var total = entry.size;
    if (entry.method === 0) {
      for (var o = 0; o < total; o += CHUNK) {
        onChunk(buf.subarray(entry.start + o, entry.start + Math.min(total, o + CHUNK)), o + CHUNK >= total);
        if (onProgress) onProgress(Math.min(1, (o + CHUNK) / total));
      }
      return;
    }
    if (entry.method !== 8) throw new Error('ZIP siqish usuli qo\'llab-quvvatlanmaydi: ' + entry.method);
    var inf = new fflate.Inflate(function (chunk, final) { onChunk(chunk, final); });
    for (var p = 0; p < total; p += CHUNK) {
      var end = Math.min(total, p + CHUNK);
      inf.push(buf.subarray(entry.start + p, entry.start + end), end >= total);
      if (onProgress) onProgress(end / total);
    }
  }

  var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  function unescapeXml(s) {
    if (s.indexOf('&') >= 0) {
      s = s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, e) {
        if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
        return ENT[e];
      });
    }
    if (s.indexOf('_x') >= 0) {
      s = s.replace(/_x([0-9A-Fa-f]{4})_/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); });
    }
    return s;
  }

  // <t> teglaridagi matnni yig'adi (<rPh> fonetik qismi bundan mustasno)
  function collectText(xml) {
    if (xml.indexOf('<rPh') >= 0) xml = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, '');
    var out = '', pos = 0;
    for (;;) {
      var a = xml.indexOf('<t', pos);
      if (a < 0) break;
      var c = xml.charAt(a + 2);
      if (c !== '>' && c !== ' ') { pos = a + 2; continue; }
      var gt = xml.indexOf('>', a);
      if (xml.charAt(gt - 1) === '/') { pos = gt + 1; continue; }
      var b = xml.indexOf('</t>', gt);
      out += xml.slice(gt + 1, b);
      pos = b + 4;
    }
    return unescapeXml(out);
  }

  function parseSharedStrings(xml) {
    var out = [];
    if (!xml) return out;
    var pos = 0;
    for (;;) {
      var a = xml.indexOf('<si', pos);
      if (a < 0) break;
      var gt = xml.indexOf('>', a);
      if (xml.charAt(gt - 1) === '/') { out.push(''); pos = gt + 1; continue; }
      var b = xml.indexOf('</si>', gt);
      out.push(collectText(xml.slice(gt + 1, b)));
      pos = b + 5;
    }
    return out;
  }

  function colIndex(ref) {
    var n = 0;
    for (var i = 0; i < ref.length; i++) {
      var c = ref.charCodeAt(i);
      if (c < 65 || c > 90) break;
      n = n * 26 + (c - 64);
    }
    return n - 1;
  }

  function attr(tag, name) {
    var i = tag.indexOf(' ' + name + '="');
    if (i < 0) return null;
    var s = i + name.length + 3;
    return tag.slice(s, tag.indexOf('"', s));
  }

  // Bitta <row> ichidagi kataklar -> [qiymatlar] (bo'sh kataklar undefined)
  function parseRow(xml, sst) {
    var cells = [];
    var pos = 0, seq = 0;
    for (;;) {
      var a = xml.indexOf('<c', pos);
      if (a < 0) break;
      var ch = xml.charAt(a + 2);
      if (ch !== ' ' && ch !== '>' && ch !== '/') { pos = a + 2; continue; }
      var gt = xml.indexOf('>', a);
      var tag = xml.slice(a, gt);
      var ref = attr(tag, 'r');
      var idx = ref ? colIndex(ref) : seq;
      seq = idx + 1;
      if (xml.charAt(gt - 1) === '/') { pos = gt + 1; continue; }
      var end = xml.indexOf('</c>', gt);
      var inner = xml.slice(gt + 1, end);
      pos = end + 4;
      var t = attr(tag, 't');
      var value;
      if (t === 'inlineStr') {
        value = collectText(inner);
      } else {
        var vs = inner.indexOf('<v');
        if (vs < 0) continue;
        var vgt = inner.indexOf('>', vs);
        if (inner.charAt(vgt - 1) === '/') continue;
        var raw = inner.slice(vgt + 1, inner.indexOf('</v>', vgt));
        if (t === 's') value = sst[+raw];
        else if (t === 'str' || t === 'd') value = unescapeXml(raw);
        else if (t === 'b') value = raw === '1';
        else if (t === 'e') value = null;
        else value = raw === '' ? null : Number(raw);
      }
      cells[idx] = value;
    }
    return cells;
  }

  function firstSheetPath(buf, entries) {
    var wb = readText(buf, entries, 'xl/workbook.xml');
    var rels = readText(buf, entries, 'xl/_rels/workbook.xml.rels');
    if (wb && rels) {
      var m = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb) || /<sheet\b[^>]*\bid="([^"]+)"/.exec(wb);
      if (m) {
        var re = new RegExp('<Relationship\\b[^>]*\\bId="' + m[1] + '"[^>]*\\bTarget="([^"]+)"');
        var r = re.exec(rels) || new RegExp('<Relationship\\b[^>]*\\bTarget="([^"]+)"[^>]*\\bId="' + m[1] + '"').exec(rels);
        if (r) {
          var target = r[1].replace(/^\//, '');
          if (target.indexOf('xl/') !== 0) target = 'xl/' + target;
          if (entries[target]) return target;
        }
      }
    }
    var names = Object.keys(entries).filter(function (n) { return /^xl\/worksheets\/[^/]+\.xml$/.test(n); }).sort();
    if (!names.length) throw new Error('Faylda varaq (sheet) topilmadi');
    return names[0];
  }

  // Birinchi varaqni o'qiydi. onRow(cells, rowNumber) har bir qator uchun chaqiriladi.
  function readFirstSheet(buffer, onRow, onProgress) {
    var buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var entries = listEntries(buf);
    if (onProgress) onProgress('strings', 0);
    var sst = parseSharedStrings(readText(buf, entries, 'xl/sharedStrings.xml'));
    var sheet = entries[firstSheetPath(buf, entries)];
    var decoder = new TextDecoder('utf-8');
    var pending = '';
    var rowNo = 0;

    function drain(final) {
      var pos = 0;
      for (;;) {
        var a = pending.indexOf('<row', pos);
        if (a < 0) {
          // bo'lak oxirida chala qolgan "<ro" ni keyingi bo'lakka saqlab qo'yamiz
          var lt = pending.lastIndexOf('<');
          pos = lt >= pos ? lt : pending.length;
          break;
        }
        var gt = pending.indexOf('>', a);
        if (gt < 0) { pos = a; break; }
        if (pending.charAt(gt - 1) === '/') { rowNo++; pos = gt + 1; continue; }
        var end = pending.indexOf('</row>', gt);
        if (end < 0) { pos = a; break; }
        var r = attr(pending.slice(a, gt), 'r');
        rowNo = r ? +r : rowNo + 1;
        onRow(parseRow(pending.slice(gt + 1, end), sst), rowNo);
        pos = end + 6;
      }
      pending = final ? '' : pending.slice(pos);
    }

    streamEntry(buf, sheet, function (chunk, final) {
      pending += decoder.decode(chunk, { stream: !final });
      drain(final);
    }, function (f) { if (onProgress) onProgress('rows', f); });
    if (pending) drain(true);
  }

  var api = { readFirstSheet: readFirstSheet, listEntries: listEntries, parseRow: parseRow, parseSharedStrings: parseSharedStrings };
  if (R80) R80.xlsxReader = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
