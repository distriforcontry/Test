// Sahifa mantiqi: fayl tanlash -> Web Worker'da pipeline.run -> natija va yuklab olish.
(function () {
  'use strict';
  var R80 = window.R80;
  var $ = function (id) { return document.getElementById(id); };
  var file = null;
  var urls = [];

  $('docDate').value = R80.dates.iso(R80.dates.today());

  function setFile(f) {
    if (!f) return;
    file = f;
    $('fileLabel').textContent = f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)';
    $('run').disabled = false;
    $('error').textContent = '';
  }

  var drop = $('drop');
  drop.addEventListener('click', function () { $('file').click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file').click(); } });
  $('file').addEventListener('change', function (e) { setFile(e.target.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  function parseInputDate(v) { return v ? R80.dates.parseDate(v) : null; }

  function progress(p) {
    $('status').textContent = p.phase + '…';
    $('bar').firstElementChild.style.width = Math.round(p.fraction * 100) + '%';
  }

  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }

  function blobUrl(bytes, type) {
    var u = URL.createObjectURL(new Blob([bytes], { type: type }));
    urls.push(u);
    return u;
  }

  function show(res) {
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
    var s = res.summary, st = s.stats;
    $('resultInfo').textContent = 'Snapshot holati: ' + s.asOfText + ' (' + s.asOfMethod + '). Hujjat sanasi: ' +
      s.docDateText + '. O\'qilgan qatorlar: ' + fmt(s.rowsRead) + '.';
    var firmNames = Object.keys(st.firms);
    var totalRows = firmNames.reduce(function (a, f) { return a + st.firms[f].rows; }, 0);
    $('stats').innerHTML =
      '<div class="stat"><b>' + fmt(st.triggerClients) + '</b><small>' + s.threshold + '+ mijozlar (PINFL)</small></div>' +
      '<div class="stat"><b>' + fmt(totalRows) + '</b><small>reyestr qatorlari (3 firma)</small></div>' +
      '<div class="stat"><b>' + fmt(st.activeLoans) + '</b><small>faol kreditlar (3 firma)</small></div>';
    var rows = '<tr><th>Firma</th><th class="n">Qatorlar</th><th class="n">Shartnomalar</th>' +
      '<th class="n">Boshqa firma sababli</th><th class="n">Jami qarzdorlik</th></tr>';
    firmNames.forEach(function (f) {
      var x = st.firms[f];
      rows += '<tr><td>' + f + '</td><td class="n">' + fmt(x.rows) + '</td><td class="n">' + fmt(x.contracts) +
        '</td><td class="n">' + fmt(x.rowsWithout80) + '</td><td class="n">' + fmt(x.total) + '</td></tr>';
    });
    $('firmTable').innerHTML = rows;
    var warn = [];
    if (s.asOfWarning) warn.push(s.asOfWarning);
    if (st.missingArea) warn.push(st.missingArea + ' ta qatorda Tuman/Shahar (Area ID) topilmadi — «_korik» faylidagi «Izoh» ustuniga qarang.');
    if (s.numericAccounts) warn.push(s.numericAccounts + ' ta kreditda hisob raqami son ko\'rinishida — Unikalka noto\'g\'ri bo\'lishi mumkin.');
    $('warnings').innerHTML = warn.map(function (w) { return '<div class="warn">⚠ ' + w + '</div>'; }).join('');

    var zip = $('zipLink');
    zip.href = blobUrl(res.zip, 'application/zip');
    zip.download = res.zipName;
    zip.textContent = 'ZIP yuklab olish';
    zip.title = res.zipName;
    var xlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    $('files').innerHTML = '';
    Object.keys(res.files).forEach(function (name) {
      var a = document.createElement('a');
      a.href = blobUrl(res.files[name], xlsxType);
      a.download = name;
      a.textContent = name;
      $('files').appendChild(a);
    });
    $('result').classList.remove('hidden');
  }

  function finish(err) {
    $('run').disabled = false;
    $('bar').style.display = 'none';
    if (err) {
      $('status').textContent = '';
      $('error').textContent = 'Xatolik: ' + err;
    }
  }

  function makeWorker() {
    var core = document.getElementById('r80-core');
    if (!core || typeof Worker === 'undefined' || typeof Blob === 'undefined') return null;
    var src = core.textContent + '\n' +
      'self.onmessage = function (e) {\n' +
      '  try {\n' +
      '    var res = self.R80.pipeline.run(e.data.buffer, e.data.options, function (p) { self.postMessage({ type: "progress", p: p }); });\n' +
      '    var transfer = [res.zip.buffer];\n' +
      '    Object.keys(res.files).forEach(function (k) { transfer.push(res.files[k].buffer); });\n' +
      '    self.postMessage({ type: "done", res: res }, transfer);\n' +
      '  } catch (err) { self.postMessage({ type: "error", message: err && err.message ? err.message : String(err) }); }\n' +
      '};\n';
    try {
      return new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    } catch (e) {
      return null;
    }
  }

  $('run').addEventListener('click', function () {
    if (!file) return;
    var options = {
      fileName: file.name,
      docDate: parseInputDate($('docDate').value),
      asOf: parseInputDate($('asOf').value),
      threshold: parseInt($('threshold').value, 10) || 80,
      onlyOverdueLoans: $('onlyOverdue').checked
    };
    $('run').disabled = true;
    $('error').textContent = '';
    $('result').classList.add('hidden');
    $('bar').style.display = 'block';
    progress({ phase: 'Fayl o\'qilmoqda', fraction: 0.02 });

    file.arrayBuffer().then(function (buffer) {
      var worker = makeWorker();
      if (!worker) {
        // Worker ishlamasa — shu oqimda (sahifa bir necha soniya qotib qolishi mumkin)
        setTimeout(function () {
          try { show(R80.pipeline.run(buffer, options, progress)); finish(); } catch (e) { finish(e.message || e); }
        }, 30);
        return;
      }
      worker.onmessage = function (e) {
        var m = e.data;
        if (m.type === 'progress') progress(m.p);
        else if (m.type === 'done') { show(m.res); $('status').textContent = 'Tayyor'; finish(); worker.terminate(); }
        else if (m.type === 'error') { finish(m.message); worker.terminate(); }
      };
      worker.onerror = function (e) { finish(e.message || 'Worker xatosi'); worker.terminate(); };
      worker.postMessage({ buffer: buffer, options: options }, [buffer]);
    }, function (e) { finish(e.message || e); });
  });
})();
