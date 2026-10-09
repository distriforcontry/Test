# Talabnoma 80+ reyestri

docsystem → **«sud - boss (fork)»** dan yuklab olingan portfel snapshot Excel'idan
BRIGHT, URBAN va COMMUNITY firmalari uchun talabnoma reyestrlarini tuzadi.

**Qoida:** mijozning (PINFL) uchta firmadan birortasida bitta bo'lsa ham kechikishi 80 kun va
undan ortiq krediti bo'lsa — mijozning **barcha firmalardagi** faol kreditlari reyestrga olinadi.
Har bir firma reyestriga **faqat o'sha firmaning kredit ID'lari** yoziladi (bir mijoz — bir qator).

## Foydalanish

1. [`reyestr.html`](reyestr.html) faylini yuklab oling (GitHub'da faylni ochib → *Download raw file*)
   va Chrome, Edge yoki Firefox'da oching. Internet kerak emas.
2. Snapshot faylini (.xlsx) tanlang yoki sahifaga sudrab tashlang.
3. *Hujjat sanasi*ni tekshiring (standart — bugun). U reyestrdagi `date` ustuniga va
   `Shartnoma ID` (`02102026/1`, `02102026/2`, …) ga yoziladi.
4. **Reyestr yaratish** → **ZIP yuklab olish**.

Snapshot hech qayerga yuborilmaydi — hamma hisob brauzerning o'zida bajariladi
(30 MB, 195 ming qatorli fayl ~10 soniyada).

Qo'shimcha sozlamalar:

| Maydon | Ma'nosi |
|---|---|
| Kechikish chegarasi | standart 80 kun |
| Snapshot holati sanasi | bo'sh qoldirilsa joriy foizdan avtomatik aniqlanadi (natijada ko'rsatiladi) |
| Faqat muddati o'tgan… | belgilansa, firmadagi faqat muddati o'tgan qarzi bor shartnomalar qo'shiladi |

## Natija (ZIP ichida)

| Fayl | Tarkibi |
|---|---|
| `BRIGHT_reyestr.xlsx`, `URBAN_reyestr.xlsx`, `COMMUNITY_reyestr.xlsx` | «Ma'lumotlar» varag'i: 1-qator kalitlar (`date`, `contract_id`, `address`, …), 2-qator sarlavhalar, keyin mijozlar F.I.Sh bo'yicha tartiblangan |
| `_korik_80plus.xlsx` | «80+ korik» — har bir qator, qaysi firmadagi 80+ sababli tushgani va izohlar; «Shartnomalar» — har bir kredit va uning hisoblangan kechikishi; «Sozlamalar» — ishlatilgan sanalar va statistika |

Reyestr ustunlari:

| Ustun | Qayerdan |
|---|---|
| Shartnoma sanasi | qatordagi eng birinchi berilgan kredit sanasi |
| Shartnoma raqami | firmadagi kredit ID'lari (`ld_id`), berilgan sanasi bo'yicha, `-` bilan |
| Kredit miqdori | `summ_kr` yig'indisi |
| Jami qarzdorlik | `summ_ost_ze + summ_ostpr_ze + sumproc_eqv + sumnachpr_eqv` |
| Muddati o'tgan jami qarzdorlik | `summ_ostpr_ze + sumnachpr_eqv` |
| …(so'zda) | o'zbek kirill yozuvida (`бир юз уч миллион …`) |
| Manzil | viloyat va tuman `distr_name` dan, ko'cha/uy `post_address` dan tozalab olinadi |
| Region ID / Area ID | [`src/regions.js`](src/regions.js) lug'atidan |
| Unikalka | hisob raqamining (`account`) 10–17-belgilari |

## Kechikish kuni qanday hisoblanadi

Snapshotda tayyor «kechikish kuni» ustuni yo'q, shuning uchun u har bir kredit uchun hisoblanadi
([`src/dpd.js`](src/dpd.js)):

1. To'lov jadvali: to'lov kuni = `date_close` dagi kun, berilgan oydan keyingi oydan boshlab har oy;
   shanba/yakshanba bo'lsa dushanbaga suriladi. Birinchi to'lov — faqat foiz.
2. Muddati o'tgan asosiy qarz (`summ_ostpr_ze`) oxirgi to'lovlarning asosiy qarz qismlariga
   yangidan eskiga qarab taqsimlanadi.
3. Muddati o'tgan foizdan (`sumnachpr_eqv`) muddati o'tgan asosiy qarzga hisoblangan foiz va
   1.5× jarima foizi ayiriladi, qolgani oxirgi davrlar foiziga taqsimlanadi.
4. Eng eski to'lanmagan (yoki qisman to'langan) to'lov sanasidan snapshot sanasigacha bo'lgan kunlar —
   kechikish. To'lovning 0.5% dan kichik qoldig'i to'langan hisoblanadi.

Agar snapshotda `dpd` / `days_overdue` / `kechikish_kun` ustuni bo'lsa, hisoblash o'rniga shu qiymat olinadi.

Tekshiruv: 02.10.2026 dagi namunaviy reyestrga (25.09 holati bo'yicha 80+) kirgan 3080 ta
shartnomadan 3078 tasi uchun 26.08.2026 snapshotidan hisoblangan holat bir oy oldingi holatga mos
keladi (kamida 2 ta to'lov to'lanmagan).

## Ma'lum cheklovlar

- **Area ID:** 44 ta tuman uchun docsystem'dagi ID noma'lum (`src/regions.js` da `null`).
  Bunday qatorlarda ustun bo'sh qoladi va «_korik» faylida «Area ID topilmadi» deb belgilanadi.
  ID ma'lum bo'lsa, `src/regions.js` ga yozib, `npm run build` qiling.
- **Shahrisabz tumani** namunada Shahrisabz shahri bilan bir xil ID (212) olgan — tekshirish kerak.
- **Manzil:** `post_address` ko'pincha to'liq emas (masalan, faqat tuman). Bunday qatorlar
  «Faqat tuman — toʻliq manzil yoʻq» izohi bilan belgilanadi.
- Faqat `12842` (BRIGHT), `06292` (URBAN), `55890` (COMMUNITY) filiallari olinadi — boshqa filiallar
  e'tiborsiz qoldiriladi. Ro'yxat [`src/config.js`](src/config.js) da.

## Buyruq qatori (Node.js 18+)

```sh
node cli.js snapshot.xlsx --sana 02.10.2026 [--holat DD.MM.YYYY] [--chegara 80] [--faqat-muddati-otgan] [--out natija]
```

## Dasturchilar uchun

```
src/config.js       firmalar, ustun nomlari, standart sozlamalar
src/xlsxReader.js   katta .xlsx ni oqim usulida o'qish (fflate)
src/dpd.js          to'lov jadvali, kechikish kuni, snapshot sanasini aniqlash
src/registry.js     reyestr qoidasi va chiqish fayllari
src/address.js      manzilni tozalash
src/regions.js      tuman -> Region/Area ID lug'ati
src/numberWords.js  summani so'z bilan yozish
src/xlsxWriter.js   .xlsx yozish
src/pipeline.js     hammasini birlashtiradi (brauzer va CLI uchun umumiy)
web/                sahifa shabloni va interfeys
tools/build.js      hammasini bitta reyestr.html ga yig'adi
```

```sh
npm test         # testlar (tashqi kutubxona o'rnatish shart emas)
npm run build    # src/ yoki web/ o'zgarganda reyestr.html ni qayta yig'ish
```

Repo ochiq (public): snapshot va reyestr fayllarini repoga qo'shmang — `.gitignore`
`.xlsx`, `.csv`, `.zip` fayllarni to'sib turadi.

`vendor/fflate.js` — [fflate](https://github.com/101arrowz/fflate) 0.8.2, MIT litsenziyasi (`vendor/fflate.LICENSE`).
