// Sozlamalar: firmalar, ustun nomlari va standart parametrlar.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});

  var config = {
    // Snapshotdagi `branch` kodi -> firma nomi. Tartib reyestr fayllari tartibini belgilaydi.
    firms: [
      { branch: '12842', name: 'BRIGHT' },
      { branch: '06292', name: 'URBAN' },
      { branch: '55890', name: 'COMMUNITY' }
    ],

    // Snapshot ustunlari: ichki nom -> Excel sarlavhasida qidiriladigan nomlar (kichik harfda).
    columns: {
      branch: ['branch', 'filial', 'mfo'],
      ldId: ['ld_id', 'credit_id', 'kredit_id', 'loan_id'],
      account: ['account', 'hisob_raqam', 'schet'],
      clientName: ['client_name', 'fio', 'fish'],
      summKr: ['summ_kr'],
      ost: ['summ_ost_ze'],
      ostPr: ['summ_ostpr_ze'],
      rate: ['rate'],
      issue: ['date_to_cr'],
      close: ['date_close'],
      proc: ['sumproc_eqv'],
      nachPr: ['sumnachpr_eqv'],
      status: ['status_name'],
      pinfl: ['pinfl', 'jshshir'],
      postAddress: ['post_address', 'address', 'manzil'],
      regionName: ['name'],
      distrName: ['distr_name'],
      // Ixtiyoriy: agar faylda tayyor kechikish kuni bo'lsa, hisoblash o'rniga shu ishlatiladi.
      dpdFile: ['dpd', 'days_overdue', 'overdue_days', 'prosrochka_dney', 'kechikish_kun']
    },
    requiredColumns: ['branch', 'ldId', 'account', 'clientName', 'summKr', 'ost', 'ostPr',
      'rate', 'issue', 'close', 'nachPr', 'pinfl'],
    dateColumns: ['issue', 'close'],
    numberColumns: ['summKr', 'ost', 'ostPr', 'rate', 'proc', 'nachPr', 'dpdFile'],

    defaults: {
      threshold: 80,          // kechikish chegarasi (kun)
      penaltyMultiplier: 1.5, // muddati o'tgan asosiy qarzga jarima foizi = stavka * 1.5
      tolerance: 0.005,       // to'lovning 0.5% dan kam qoldig'i to'langan deb hisoblanadi
      onlyOverdueLoans: false // true: faqat muddati o'tgan qarzi bor shartnomalar qo'shiladi
    }
  };

  if (R80) R80.config = config; else module.exports = config;
})(typeof self !== 'undefined' ? self : this);
