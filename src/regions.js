// Hududlar: snapshotdagi `distr_name` -> [Viloyat (Region ID), Tuman/Shahar (Area ID), lotincha nomi].
// ID'lar namunadagi (docsystem) reyestrdan olingan. `null` — Area ID nomaʼlum: reyestrda bo'sh qoladi
// va ko'rik faylida belgilanadi. Yangi ID ma'lum bo'lsa, shu yerga yozib qo'ying.
(function (root) {
  'use strict';
  var R80 = typeof module === 'object' && module.exports ? null : (root.R80 = root.R80 || {});

  var REGIONS = {
    1: 'Toshkent shahri',
    2: 'Toshkent viloyati',
    3: 'Samarqand viloyati',
    4: 'Jizzax viloyati',
    5: 'Sirdaryo viloyati',
    6: 'Fargʻona viloyati',
    7: 'Andijon viloyati',
    8: 'Namangan viloyati',
    9: 'Qashqadaryo viloyati',
    10: 'Surxondaryo viloyati',
    11: 'Buxoro viloyati',
    12: 'Navoiy viloyati',
    13: 'Qoraqalpogʻiston Respublikasi',
    14: 'Xorazm viloyati'
  };

  // Snapshotdagi `name` ustuni (filial hududi) -> Region ID. Tuman topilmasa ishlatiladi.
  var BRANCH_REGIONS = {
    'ТОШКЕНТ ШАХАР': 1, 'ТОШ ОБЛ': 2, 'САМАРКАНД': 3, 'ДЖИЗАК': 4, 'СИРДАРЁ': 5, 'ФАРҒОНА': 6,
    'АНДИЖАН': 7, 'НАМАНГАН': 8, 'ҚАШҚАДАРЁ': 9, 'ТЕРМИЗ': 10, 'ДЕНОВ': 10, 'БУХАРА': 11,
    'НАВОИЙ': 12, 'НУКУС': 13, 'ХОРАЗМ': 14
  };

  var DISTRICTS = {
    // 1 — Toshkent shahri
    "МИРОБОД ТУМАНИ": [1, 1, "Mirobod tumani"],
    "МИРЗО УЛУГБЕК ТУМАНИ": [1, 2, "Mirzo Ulugʻbek tumani"],
    "ЯККАСАРОЙ ТУМАНИ": [1, 3, "Yakkasaroy tumani"],
    "ОЛМАЗОР ТУМАНИ": [1, 4, "Olmazor tumani"],
    "ЮНУСОБОД ТУМАНИ": [1, 5, "Yunusobod tumani"],
    "ЧИЛОНЗОР ТУМАНИ": [1, 6, "Chilonzor tumani"],
    "УЧТЕПА ТУМАНИ": [1, 7, "Uchtepa tumani"],
    "СИРГАЛИ ТУМАНИ": [1, 8, "Sirgʻali tumani"],
    "ЯШНОБОД ТУМАНИ": [1, 9, "Yashnobod tumani"],
    "ШАЙХОНТОХУР ТУМАНИ": [1, 10, "Shayxontohur tumani"],
    "БЕКТЕМИР ТУМАНИ": [1, 11, "Bektemir tumani"],
    "ЯНГИХАЁТ ТУМАНИ": [1, 2026, "Yangihayot tumani"],
    "ТОШКЕНТ ШАХРИ": [1, null, ""],  // Area ID nomaʼlum
    // 2 — Toshkent viloyati
    "ОЛМАЛИК ШАХРИ": [2, 12, "Olmaliq shahri"],
    "АНГРЕН ШАХРИ": [2, 13, "Angren shahri"],
    "ОХАНГАРОН ТУМАНИ": [2, 14, "Ohangaron tumani"],
    "БЕКОБОД ШАХРИ": [2, 16, "Bekobod shahri"],
    "БУКА ТУМАНИ": [2, 17, "Buka tumani"],
    "БУСТОНЛИК ТУМАНИ": [2, 18, "Boʻstonliq tumani"],
    "БЕКОБОД ТУМАНИ": [2, 19, "Bekobod tumani"],
    "ЗАНГИОТА ТУМАНИ": [2, 20, "Zangiota tumani"],
    "КИБРАЙ ТУМАНИ": [2, 21, "Qibray tumani"],
    "ПАРКЕНТ ТУМАНИ": [2, 22, "Parkent tumani"],
    "ПСКЕНТ ТУМАНИ": [2, 23, "Pskent tumani"],
    "КУЙИЧИРЧИК ТУМАНИ": [2, 24, "Quyichirchiq tumani"],
    "УРТАЧИРЧИК ТУМАНИ": [2, 25, "Oʻrtachirchiq tumani"],
    "ЧИРЧИК ШАХРИ": [2, 26, "Chirchiq shahri"],
    "ЧИНОЗ ТУМАНИ": [2, 27, "Chinoz tumani"],
    "ЮКОРИЧИРЧИК ТУМАНИ": [2, 28, "Yuqorichirchiq tumani"],
    "ЯНГИЙУЛ ТУМАНИ": [2, 29, "Yangiyoʻl tumani"],
    "ТОШКЕНТ ТУМАНИ": [2, 211, "Toshkent tumani"],
    "ЯНГИЙУЛ ШАХРИ": [2, 213, "Yangiyoʻl shahri"],
    "НУРАФШОН ШАХРИ": [2, 1123, "Nurafshon shahri"],
    "ОХАНГАРОН ШАХРИ": [2, 2024, "Ohangaron shahri"],
    "ОККУРГОН ТУМАНИ": [2, null, "Oqqoʻrgʻon tumani"],  // Area ID nomaʼlum
    // 3 — Samarqand viloyati
    "САМАРКАНД ШАХРИ": [3, 30, "Samarqand shahri"],
    "САМАРКАНД ТУМАНИ": [3, 31, "Samarqand tumani"],
    "БУЛУНГУР ТУМАНИ": [3, 32, "Bulungʻur tumani"],
    "ЖОМБОЙ ТУМАНИ": [3, 33, "Jomboy tumani"],
    "ПАСТДАРГОМ ТУМАНИ": [3, 34, "Pastdargʻom tumani"],
    "ИШТИХОН ТУМАНИ": [3, 35, "Ishtixon tumani"],
    "КАТТАКУРГОН ШАХРИ": [3, 36, "Kattaqoʻrgʻon shahri"],
    "НУРОБОД ТУМАНИ": [3, 37, "Nurobod tumani"],
    "ОКДАРЁ ТУМАНИ": [3, 38, "Oqdaryo tumani"],
    "НАРПАЙ ТУМАНИ": [3, 39, "Narpay tumani"],
    "ПАЙАРИК ТУМАНИ": [3, 40, "Payariq tumani"],
    "КАТТАКУРГОН ТУМАНИ": [3, 41, "Kattaqoʻrgʻon tumani"],
    "ТАЙЛОК ТУМАНИ": [3, 43, "Tayloq tumani"],
    "УРГУТ ТУМАНИ": [3, 44, "Urgut tumani"],
    "КУШРАБОТ ТУМАНИ": [3, 45, "Qoʻshrabot tumani"],
    "ПАХТАЧИ ТУМАНИ": [3, null, "Paxtachi tumani"],  // Area ID nomaʼlum
    // 4 — Jizzax viloyati
    "ЖИЗЗАХ ШАХРИ": [4, 47, "Jizzax shahri"],
    "ШАРОФ РАШИДОВ ТУМАНИ": [4, 48, "Sharof Rashidov tumani"],
    "ГАЛЛАОРОЛ ТУМАНИ": [4, 49, "Gʻallaorol tumani"],
    "ПАХТАКОР ТУМАНИ": [4, 51, "Paxtakor tumani"],
    "ЗАФАРОБОД ТУМАНИ": [4, 52, "Zafarobod tumani"],
    "ФОРИШ ТУМАНИ": [4, 59, "Forish tumani"],
    "АРНАСОЙ ТУМАНИ": [4, null, "Arnasoy tumani"],  // Area ID nomaʼlum
    "БАХМАЛ ТУМАНИ": [4, null, "Baxmal tumani"],  // Area ID nomaʼlum
    "ДУСТЛИК ТУМАНИ": [4, null, "Doʻstlik tumani"],  // Area ID nomaʼlum
    "МИРЗАЧУЛ ТУМАНИ": [4, null, "Mirzachoʻl tumani"],  // Area ID nomaʼlum
    "ЯНГИОБОД ТУМАНИ": [4, null, "Yangiobod tumani"],  // Area ID nomaʼlum
    "ЗАРБДОР ТУМАНИ": [4, null, "Zarbdor tumani"],  // Area ID nomaʼlum
    "ЗОМИН ТУМАНИ": [4, null, "Zomin tumani"],  // Area ID nomaʼlum
    // 5 — Sirdaryo viloyati
    "ГУЛИСТОН ШАХРИ": [5, 61, "Guliston shahri"],
    "ГУЛИСТОН ТУМАНИ": [5, 66, "Guliston tumani"],
    "СИРДАРЁ ТУМАНИ": [5, 67, "Sirdaryo tumani"],
    "МИРЗАОБОД ТУМАНИ": [5, 71, "Mirzaobod tumani"],
    "САРДОБА ТУМАНИ": [5, 72, "Sardoba tumani"],
    "БОЁВУТ ТУМАНИ": [5, null, "Boyovut tumani"],  // Area ID nomaʼlum
    "ОКОЛТИН ТУМАНИ": [5, null, "Oqoltin tumani"],  // Area ID nomaʼlum
    "САЙХУНОБОД ТУМАНИ": [5, null, "Sayxunobod tumani"],  // Area ID nomaʼlum
    "ШИРИН ШАХРИ": [5, null, "Shirin shahri"],  // Area ID nomaʼlum
    "ХАВАСТ ТУМАНИ": [5, null, "Xovos tumani"],  // Area ID nomaʼlum
    "ЯНГИЕР ШАХРИ": [5, null, "Yangiyer shahri"],  // Area ID nomaʼlum
    // 6 — Fargʻona viloyati
    "МАРГИЛОН ШАХРИ": [6, 73, "Margʻilon shahri"],
    "ФАРГОНА ШАХРИ": [6, 74, "Fargʻona shahri"],
    "КУВАСОЙ ШАХРИ": [6, 75, "Quvasoy shahri"],
    "КУКОН ШАХРИ": [6, 76, "Qoʻqon shahri"],
    "БОГДОД ТУМАНИ": [6, 77, "Bogʻdod tumani"],
    "БЕШАРИК ТУМАНИ": [6, 78, "Beshariq tumani"],
    "БУВАЙДА ТУМАНИ": [6, 79, "Buvayda tumani"],
    "ДАНГАРА ТУМАНИ": [6, 80, "Dangʻara tumani"],
    "ОЛТИАРИК ТУМАНИ": [6, 82, "Oltiariq tumani"],
    "КУШТЕПА ТУМАНИ": [6, 83, "Qoʻshtepa tumani"],
    "РИШТОН ТУМАНИ": [6, 84, "Rishton tumani"],
    "ТОШЛОК ТУМАНИ": [6, 86, "Toshloq tumani"],
    "УЧКУПРИК ТУМАНИ": [6, 87, "Uchkoʻprik tumani"],
    "ФАРГОНА ТУМАНИ": [6, 88, "Fargʻona tumani"],
    "ФУРКАТ ТУМАНИ": [6, 89, "Furqat tumani"],
    "УЗБЕКИСТОН ТУМАНИ": [6, 90, "Oʻzbekiston tumani"],
    "КУВА ТУМАНИ": [6, 91, "Quva tumani"],
    "ЁЗЁВОН ТУМАНИ": [6, null, "Yozyovon tumani"],  // Area ID nomaʼlum
    // 7 — Andijon viloyati
    "АНДИЖОН ШАХРИ": [7, 92, "Andijon shahri"],
    "АНДИЖОН ТУМАНИ": [7, 93, "Andijon tumani"],
    "АСАКА ТУМАНИ": [7, 94, "Asaka tumani"],
    "БАЛИКЧИ ТУМАНИ": [7, 95, "Baliqchi tumani"],
    "БУЛОКБОШИ ТУМАНИ": [7, 97, "Buloqboshi tumani"],
    "ЖАЛОЛКУДУК ТУМАНИ": [7, 98, "Jalolquduq tumani"],
    "ИЗБОСКАН ТУМАНИ": [7, 99, "Izboskan tumani"],
    "КУРГОНТЕПА ТУМАНИ": [7, 100, "Qoʻrgʻontepa tumani"],
    "ОЛТИНКУЛ ТУМАНИ": [7, 104, "Oltinkoʻl tumani"],
    "ПАХТАОБОД ТУМАНИ": [7, 105, "Paxtaobod tumani"],
    "ХУЖАОБОД ТУМАНИ": [7, 107, "Xoʻjaobod tumani"],
    "ШАХРИХОН ТУМАНИ": [7, 108, "Shahrixon tumani"],
    "БУСТОН ТУМАНИ": [7, 1720, "Boʻston tumani"],
    "МАРХАМАТ ТУМАНИ": [7, null, "Marhamat tumani"],  // Area ID nomaʼlum
    "УЛУГНОР ТУМАНИ": [7, null, "Ulugʻnor tumani"],  // Area ID nomaʼlum
    "ХОНОБОД ШАХРИ": [7, null, "Xonobod shahri"],  // Area ID nomaʼlum
    // 8 — Namangan viloyati
    "НАМАНГАН ШАХРИ": [8, 109, "Namangan shahri"],
    "КОСОНСОЙ ТУМАНИ": [8, 110, "Kosonsoy tumani"],
    "НОРИН ТУМАНИ": [8, 111, "Norin tumani"],
    "ЧУСТ ТУМАНИ": [8, 114, "Chust tumani"],
    "ТУРАКУРГОН ТУМАНИ": [8, 115, "Toʻraqoʻrgʻon tumani"],
    "ПОП ТУМАНИ": [8, 116, "Pop tumani"],
    "ЯНГИКУРГОН ТУМАНИ": [8, 120, "Yangiqoʻrgʻon tumani"],
    "ЧОРТОК ТУМАНИ": [8, null, "Chortoq tumani"],  // Area ID nomaʼlum
    "МИНГБУЛОК ТУМАНИ": [8, null, "Mingbuloq tumani"],  // Area ID nomaʼlum
    "НАМАНГАН ТУМАНИ": [8, null, "Namangan tumani"],  // Area ID nomaʼlum
    "УЧКУРГОН ТУМАНИ": [8, null, "Uchqoʻrgʻon tumani"],  // Area ID nomaʼlum
    "УЙЧИ ТУМАНИ": [8, null, "Uychi tumani"],  // Area ID nomaʼlum
    // 9 — Qashqadaryo viloyati
    "КАРШИ ШАХРИ": [9, 121, "Qarshi shahri"],
    "КИТОБ ТУМАНИ": [9, 123, "Kitob tumani"],
    "ЯККАБОГ ТУМАНИ": [9, 124, "Yakkabogʻ tumani"],
    "КАМАШИ ТУМАНИ": [9, 126, "Qamashi tumani"],
    "ГУЗОР ТУМАНИ": [9, 127, "Gʻuzor tumani"],
    "МИРИШКОР ТУМАНИ": [9, 132, "Mirishkor tumani"],
    "МУБОРАК ТУМАНИ": [9, 133, "Muborak tumani"],
    "ШАХРИСАБЗ ШАХРИ": [9, 212, "Shahrisabz shahri"],
    "ШАХРИСАБЗ ТУМАНИ": [9, 212, "Shahrisabz tumani"],  // namunada shahar bilan bir xil ID (212) — tekshiring
    "ЧИРОКЧИ ТУМАНИ": [9, null, "Chiroqchi tumani"],  // Area ID nomaʼlum
    "ДЕХКОНОБОД ТУМАНИ": [9, null, "Dehqonobod tumani"],  // Area ID nomaʼlum
    "КАСБИ ТУМАНИ": [9, null, "Kasbi tumani"],  // Area ID nomaʼlum
    "КОСОН ТУМАНИ": [9, null, "Koson tumani"],  // Area ID nomaʼlum
    "КУКДАЛА ТУМАНИ": [9, null, "Koʻkdala tumani"],  // Area ID nomaʼlum
    "НИШОН ТУМАНИ": [9, null, "Nishon tumani"],  // Area ID nomaʼlum
    "КАРШИ ТУМАНИ": [9, null, "Qarshi tumani"],  // Area ID nomaʼlum
    // 10 — Surxondaryo viloyati
    "АНГОР ТУМАНИ": [10, 135, "Angor tumani"],
    "ДЕНОВ ТУМАНИ": [10, 138, "Denov tumani"],
    "ЖАРКУРГОН ТУМАНИ": [10, 139, "Jarqoʻrgʻon tumani"],
    "КИЗИРИК ТУМАНИ": [10, 140, "Qizirik tumani"],
    "КУМКУРГОН ТУМАНИ": [10, 141, "Qumqoʻrgʻon tumani"],
    "МУЗРАБОТ ТУМАНИ": [10, 142, "Muzrabot tumani"],
    "ОЛТИНСОЙ ТУМАНИ": [10, 143, "Oltinsoy tumani"],
    "САРИОСИЁ ТУМАНИ": [10, 144, "Sariosiyo tumani"],
    "ТЕРМИЗ ШАХРИ": [10, 145, "Termiz shahri"],
    "ТЕРМИЗ ТУМАНИ": [10, 146, "Termiz tumani"],
    "ШЕРОБОД ТУМАНИ": [10, 147, "Sherobod tumani"],
    "ШУРЧИ ТУМАНИ": [10, 148, "Shoʻrchi tumani"],
    "УЗУН ТУМАНИ": [10, 149, "Uzun tumani"],
    "БАНДИХОН ТУМАНИ": [10, 2021, "Bandixon tumani"],
    "БОЙСУН ТУМАНИ": [10, null, "Boysun tumani"],  // Area ID nomaʼlum
    // 11 — Buxoro viloyati
    "БУХОРО ШАХРИ": [11, 150, "Buxoro shahri"],
    "КОГОН ТУМАНИ": [11, 152, "Kogon tumani"],
    "ГИЖДУВОН ТУМАНИ": [11, 153, "Gʻijduvon tumani"],
    "ЖОНДОР ТУМАНИ": [11, 155, "Jondor tumani"],
    "ВОБКЕНТ ТУМАНИ": [11, 156, "Vobkent tumani"],
    "ШОФИРКОН ТУМАНИ": [11, 158, "Shofirkon tumani"],
    "ОЛОТ ТУМАНИ": [11, 160, "Olot tumani"],
    "КОГОН ШАХРИ": [11, 206, "Kogon shahri"],
    "БУХОРО ТУМАНИ": [11, null, "Buxoro tumani"],  // Area ID nomaʼlum
    "ПЕШКУ ТУМАНИ": [11, null, "Peshku tumani"],  // Area ID nomaʼlum
    "КОРАКУЛ ТУМАНИ": [11, null, "Qorakoʻl tumani"],  // Area ID nomaʼlum
    "КОРОВУЛБОЗОР ТУМАНИ": [11, null, "Qorovulbozor tumani"],  // Area ID nomaʼlum
    "РОМИТАН ТУМАНИ": [11, null, "Romitan tumani"],  // Area ID nomaʼlum
    // 12 — Navoiy viloyati
    "ЗАРАФШОН ШАХРИ": [12, 162, "Zarafshon shahri"],
    "КАРМАНА ТУМАНИ": [12, 163, "Karmana tumani"],
    "КИЗИЛТЕПА ТУМАНИ": [12, 164, "Qiziltepa tumani"],
    "КОНИМЕХ ТУМАНИ": [12, 165, "Konimex tumani"],
    "НАВОИЙ ШАХРИ": [12, 166, "Navoiy shahri"],
    "НАВБАХОР ТУМАНИ": [12, 167, "Navbahor tumani"],
    "НУРОТА ТУМАНИ": [12, 168, "Nurota tumani"],
    "ХАТИРЧИ ТУМАНИ": [12, 169, "Xatirchi tumani"],
    "УЧКУДУК ТУМАНИ": [12, 207, "Uchquduq tumani"],
    "ТОМДИ ТУМАНИ": [12, 208, "Tomdi tumani"],
    "ГОЗГОН ШАХРИ": [12, 2025, "Gʻozgʻon shahri"],
    // 13 — Qoraqalpogʻiston Respublikasi
    "НУКУС ШАХРИ": [13, 170, "Nukus shahri"],
    "КЕГЕЙЛИ ТУМАНИ": [13, 172, "Kegeyli tumani"],
    "ЧИМБОЙ ТУМАНИ": [13, 173, "Chimboy tumani"],
    "ТАХТАКУПИР ТУМАНИ": [13, 175, "Taxtakoʻpir tumani"],
    "ШУМАНАЙ ТУМАНИ": [13, 177, "Shumanay tumani"],
    "КОНЛИКУЛ ТУМАНИ": [13, 178, "Qonlikoʻl tumani"],
    "КУНГИРОТ ТУМАНИ": [13, 180, "Qoʻngʻirot tumani"],
    "АМУДАРЁ ТУМАНИ": [13, 182, "Amudaryo tumani"],
    "ТУРТКУЛ ТУМАНИ": [13, 183, "Toʻrtkoʻl tumani"],
    "ЭЛЛИККАЛА ТУМАНИ": [13, 184, "Ellikqal'a tumani"],
    "БУЗАТОВ ТУМАНИ": [13, null, "Boʻzatov tumani"],  // Area ID nomaʼlum
    "НУКУС ТУМАНИ": [13, null, "Nukus tumani"],  // Area ID nomaʼlum
    "КОРАУЗАК ТУМАНИ": [13, null, "Qoraoʻzak tumani"],  // Area ID nomaʼlum
    "ТАХИАТОШ ТУМАНИ": [13, null, "Taxiatosh tumani"],  // Area ID nomaʼlum
    "ХУЖАЙЛИ ТУМАНИ": [13, null, "Xoʻjayli tumani"],  // Area ID nomaʼlum
    // 14 — Xorazm viloyati
    "УРГАНЧ ШАХРИ": [14, 186, "Urganch shahri"],
    "УРГАНЧ ТУМАНИ": [14, 187, "Urganch tumani"],
    "ХИВА ТУМАНИ": [14, 188, "Xiva tumani"],
    "ХОНКА ТУМАНИ": [14, 189, "Xonqa tumani"],
    "ШОВОТ ТУМАНИ": [14, 190, "Shovot tumani"],
    "ЯНГИАРИК ТУМАНИ": [14, 192, "Yangiariq tumani"],
    "ЯНГИБОЗОР ТУМАНИ": [14, 193, "Yangibozor tumani"],
    "ГУРЛАН ТУМАНИ": [14, 194, "Gurlan tumani"],
    "КУШКУПИР ТУМАНИ": [14, 195, "Qoʻshkoʻpir tumani"],
    "ХАЗОРАСП ТУМАНИ": [14, 196, "Xazorasp tumani"],
    "ХИВА ШАХРИ": [14, 2020, "Xiva shahri"],
    "ТУПРОККАЛЪА ТУМАНИ": [14, 2023, "Tuproqqal'a tumani"],
    "БОГОТ ТУМАНИ": [14, null, "Bogʻot tumani"],  // Area ID nomaʼlum
  };

  var CYR = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'J', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': 'ʼ', 'Ы': 'I', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', 'Ў': 'Oʻ', 'Қ': 'Q', 'Ғ': 'Gʻ', 'Ҳ': 'H'
  };

  function norm(s) {
    return String(s || '').toUpperCase().replace(/\s+/g, ' ').trim();
  }

  function translit(s) {
    return norm(s).split('').map(function (ch) { return CYR[ch] !== undefined ? CYR[ch] : ch; }).join('');
  }

  // "КАРШИ ТУМАНИ" -> "Karshi tumani" (faqat lug'atda yo'q tumanlar uchun)
  function fallbackName(distr) {
    return translit(distr).toLowerCase()
      .replace(/(^|[\s-])([a-zʻʼ])/g, function (m, p, c) { return p + c.toUpperCase(); })
      .replace(/ Tumani$/, ' tumani').replace(/ Shahri$/, ' shahri');
  }

  // Natija: { regionId, regionName, areaId, districtName, known }
  function lookup(distrName, branchRegionName) {
    var key = norm(distrName);
    var hit = DISTRICTS[key];
    if (hit) {
      return { regionId: hit[0], regionName: REGIONS[hit[0]], areaId: hit[1], districtName: hit[2], known: true };
    }
    var regionId = BRANCH_REGIONS[norm(branchRegionName)] || null;
    return {
      regionId: regionId,
      regionName: regionId ? REGIONS[regionId] : '',
      areaId: null,
      districtName: key ? fallbackName(key) : '',
      known: false
    };
  }

  var api = { REGIONS: REGIONS, DISTRICTS: DISTRICTS, BRANCH_REGIONS: BRANCH_REGIONS, lookup: lookup, translit: translit };
  if (R80) R80.regions = api; else module.exports = api;
})(typeof self !== 'undefined' ? self : this);
