# نور الإسلام (Islamic App)

A React + Vite app with four sections: prayer times (with adhan playback), Quran page viewer + Tafsir, adhkar/duas counter, and Sadaqah Jariyah.

## Stack
- React 18 + Vite 5
- `adhan` for prayer time calculations
- Geolocation API + IP fallback (ipapi.co)
- HTMLAudioElement for adhan playback

## Structure
- `index.html` — RTL Arabic shell
- `src/main.jsx` — React entry
- `src/IslamicApp.jsx` — single-component app (all sections)
- `public/quran/*.png` — 604 mushaf pages
- `public/tafsir/{quran,muyassar,surahs}.json` — Quran text + Tafsir Muyassar
- `public/adhan/*.mp3` — 16 adhan recordings (3 are special fajr w/ tathweeb)
- `public/adhkar/all.json` — 593 adhkar in 149 categories (merged from hisnmuslim.com full set)
- `public/sunnah/bukhari.json` — Sahih al-Bukhari (7,589 hadiths, 97 books) from fawazahmed0/hadith-api
- `public/quran/surah-pages.json` — surah → first-page mapping (derived from pages.json)
- `scripts/fetch-adhkar.mjs` — one-off downloader to refresh adhkar from hisnmuslim API

## Theme (light, modern)
- bg cream `#f5f1ea`, surface white, accent dark teal `#0f6b5f`
- Defined in single `C` token object at top of IslamicApp.jsx

## Tabs
- prayer (default): times, countdown, adhan playback w/ settings + Hijri banner
- quran: 3 sub-views — surah index (default), mushaf pages, tafsir Muyassar
- adhkar: 2 sub-views — adhkar/duas counter, sunnah (Sahih al-Bukhari browser w/ section list + full-text search)
- sadaqah: shareable beneficial-knowledge cards + personal dua list

## Quran reciters (mp3quran.net direct URLs, all verified 200 OK)
afs (Alafasy), shur (Shuraim), sds (Sudais), husr (Husary), minsh (Minshawi), basit (AbdulBasit), qtm (Qatami), ajm (Ajami)
Built via `reciterUrl(rid, surahNum)` → `${server}NNN.mp3`

## Smoother mushaf swipe
Touch handlers track axis-lock, follow finger with `transform: translateX(dragX)`, lower threshold (35px or velocity > 0.35), 0.22s cubic-bezier release animation.

## LocalStorage keys
`islam_loc`, `islam_adhan`, `islam_shares`, `islam_duas`, `islam_tafsir_surah`, `islam_tafsir_ayah`, `islam_adhkar_cat`, `islam_adhkar_sub`, `islam_bukhari_section`, `islam_tab`, `islam_quran_page`, `islam_reciter`

## Workflow
- `Start application`: `npm run dev` on port 5000
