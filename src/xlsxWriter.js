// Oddiy .xlsx yozuvchi (bir nechta varaq, matn/son/sana kataklari).
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});
  var fflate = R80 ? root.fflate : require('../vendor/fflate.js');
  var need = function (n) { return R80 ? R80[n] : require('./' + n); };
  var dates = need('dates');

  // Uslublar (cellXfs tartibi bilan)
  var STYLE = { plain: 0, isoDate: 1, header: 2, money: 3, date: 4 };

  var STYLES_XML =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="dd.mm.yyyy"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFDDEBF7"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>' +
    '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function esc(s) {
    return String(s)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function colName(i) {
    var s = '';
    i++;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  // types: har bir ustun uchun 'str' | 'num' | 'money' | 'isoDate' | 'date'
  function cellXml(ref, value, type, header) {
    if (value === null || value === undefined || value === '') return '';
    if (header) return '<c r="' + ref + '" s="' + STYLE.header + '" t="inlineStr"><is><t>' + esc(value) + '</t></is></c>';
    if ((type === 'isoDate' || type === 'date') && typeof value === 'number') {
      return '<c r="' + ref + '" s="' + STYLE[type] + '"><v>' + dates.toExcelSerial(value) + '</v></c>';
    }
    if ((type === 'num' || type === 'money') && typeof value === 'number' && isFinite(value)) {
      var s = type === 'money' ? ' s="' + STYLE.money + '"' : '';
      return '<c r="' + ref + '"' + s + '><v>' + value + '</v></c>';
    }
    return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + esc(value) + '</t></is></c>';
  }

  // sheet: { name, rows, types, widths, headerRows, styledHeader, freeze, autoFilter }
  function sheetXml(sheet) {
    var parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
    var ncol = 0;
    sheet.rows.forEach(function (r) { ncol = Math.max(ncol, r.length); });
    var nrow = sheet.rows.length;
    parts.push('<dimension ref="A1:' + colName(Math.max(ncol, 1) - 1) + Math.max(nrow, 1) + '"/>');
    if (sheet.freeze) {
      parts.push('<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + sheet.freeze + '" topLeftCell="A' +
        (sheet.freeze + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>');
    }
    parts.push('<sheetFormatPr defaultRowHeight="15"/>');
    if (sheet.widths && sheet.widths.length) {
      parts.push('<cols>');
      sheet.widths.forEach(function (w, i) {
        if (w) parts.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>');
      });
      parts.push('</cols>');
    }
    parts.push('<sheetData>');
    var headerRows = sheet.headerRows || 0;
    sheet.rows.forEach(function (row, ri) {
      var cells = [];
      var isHeader = ri < headerRows;
      for (var ci = 0; ci < row.length; ci++) {
        cells.push(cellXml(colName(ci) + (ri + 1), row[ci], isHeader ? 'str' : (sheet.types || [])[ci],
          isHeader && sheet.styledHeader));
      }
      parts.push('<row r="' + (ri + 1) + '">' + cells.join('') + '</row>');
    });
    parts.push('</sheetData>');
    if (sheet.autoFilter && nrow > 0) {
      parts.push('<autoFilter ref="A' + headerRows + ':' + colName(ncol - 1) + nrow + '"/>');
    }
    parts.push('</worksheet>');
    return parts.join('');
  }

  function build(sheets) {
    var u = fflate.strToU8;
    var files = {};
    var ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'];
    var wbSheets = [], wbRels = [];
    sheets.forEach(function (s, i) {
      var n = i + 1;
      ct.push('<Override PartName="/xl/worksheets/sheet' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
      wbSheets.push('<sheet name="' + esc(s.name).replace(/"/g, '&quot;') + '" sheetId="' + n + '" r:id="rId' + n + '"/>');
      wbRels.push('<Relationship Id="rId' + n + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + n + '.xml"/>');
      files['xl/worksheets/sheet' + n + '.xml'] = u(sheetXml(s));
    });
    wbRels.push('<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');
    ct.push('</Types>');
    files['[Content_Types].xml'] = u(ct.join(''));
    files['_rels/.rels'] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>');
    files['xl/workbook.xml'] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      wbSheets.join('') + '</sheets></workbook>');
    files['xl/_rels/workbook.xml.rels'] = u('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      wbRels.join('') + '</Relationships>');
    files['xl/styles.xml'] = u(STYLES_XML);
    return fflate.zipSync(files, { level: 6 });
  }

  var api = { build: build, colName: colName };
  if (R80) R80.xlsxWriter = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
