# html2one

Ko'p faylli HTML loyihani (`index.html` + css/js/rasmlar, zip yoki papka) **bitta faylga** o'tkazadi.
Natija brauzerda qanday ko'rinsa, aynan shunday chiqadi.

| Fayl | Nima |
|---|---|
| `anor-delivery.pptx` | Har bir slayd brauzerdagi ko'rinishning to'liq nusxasi (16:9). PowerPoint / Keynote / Google Slides'da ochiladi |
| `anor-delivery.pdf` | Xuddi shu slaydlar PDF'da. Yuborish va chop etish uchun |
| `anor-delivery.html` | Barcha CSS, JS, rasm va shriftlar ichiga joylangan **bitta** HTML. Internetsiz ochiladi, animatsiya va tugmalar ishlaydi |

## Ishlatish

```bash
pip install playwright python-pptx pillow beautifulsoup4
python html2one.py                      # ~/Downloads/anor-delivery.zip ni oladi
```

Natijalar zip turgan papkaga (Downloads) tushadi. Boshqa fayl uchun: `python html2one.py yo'l/fayl.zip`.

Kompyuterda Chrome yoki Edge bo'lsa, boshqa hech narsa kerak emas. Bo'lmasa bir marta:
`python -m playwright install chromium`.

## Slaydlar qanday ajratiladi (`--mode auto`)

- **reveal.js** taqdimot: har bir slayd va vertikal slayd alohida, fragmentlar ochiq holda.
- **Klaviatura bilan almashadigan slaydlar** (→ tugmasi): sahifa o'zgarmay qolguncha → bosiladi.
- **Ketma-ket `section`/`.slide` bloklar**: har bir blok alohida slayd. Uzun blok bir nechta slaydga bo'linadi.
- **Oddiy uzun sahifa**: ekran balandligi bo'yicha slaydlarga bo'linadi.

Agar noto'g'ri aniqlansa: `--mode keys`, `--mode sections --selector ".slide"`, `--mode page`.
Animatsiya tugamay qolsa: `--wait 1500`. Faqat bitta format kerak bo'lsa: `--only pptx`.
