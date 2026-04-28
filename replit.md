# Islam (تطبيق إسلامي)

A React + Vite app dedicated as صدقة جارية (Sadaqah Jariyah) for Ahmed Abdel Hafez (أحمد عبد الحفيظ).
Five sections: prayer times (with adhan playback + notifications), Quran page viewer + per-ayah Tafsir + memorization tester, adhkar/sunnah, tasbih counter, and Sadaqah Jariyah dua-sharing.

## Stack
- React 18 + Vite 5 (dev port 5000), Express API on port 3001
- `adhan` for prayer time calculations
- Geolocation API + IP fallback (ipapi.co)
- HTMLAudioElement for adhan + ayah recitation
- Web Speech API (`SpeechRecognition`) for memorization tester
- Web Notifications API for prayer reminders

## Structure
- `index.html` — RTL Arabic shell with 7 Arabic Google Fonts + CSS variable theme tokens in `:root`
- `src/main.jsx` — React entry
- `src/IslamicApp.jsx` — single-component app (~3100 lines, all sections)
- `server.js` — Express 5 API (Replit DB persistence)
- `public/quran/*.png` — 604 mushaf pages
- `public/quran/surah-pages.json` — surah → first-page mapping
- `public/tafsir/{quran,muyassar,surahs}.json` — Quran text + Tafsir Muyassar
- `public/adhan/*.mp3` — 16 adhan recordings (3 are special fajr w/ tathweeb)
- `public/adhkar/all.json` — 593 adhkar in 149 categories (hisnmuslim full set)
- `public/sunnah/{bukhari,muslim,nawawi,qudsi}.json` — 4 hadith books from fawazahmed0/hadith-api
- `scripts/fetch-adhkar.mjs` — one-off downloader for adhkar

## Theme system
- Theme tokens (`--c-bg`, `--c-surface`, `--c-accent`, etc.) defined as CSS variables in `index.html`
- `THEMES` object exposes light + dark variants; `useAppSettings` hook applies via `data-theme` attr
- `FONT_FAMILIES` (7 Arabic fonts: Cairo, Tajawal, Amiri, Scheherazade New, Noto Naskh, Markazi, Lateef)
- `FONT_SIZES` (small/medium/large/xlarge)
- All persisted to localStorage `islam_app_settings`

## Tabs (5)
- **prayer** (default): times, countdown, adhan playback w/ settings + Hijri banner + LocationBar
- **quran**: surah index → mushaf pages w/ touch swipe + reciter audio + per-ayah Tafsir modal + memorization tester
- **adhkar**: adhkar (149 categories) + sunnah hub (Bukhari/Muslim w/ section browser, Nawawi-40/Qudsi-40 as flat lists, full-text search)
- **tasbih**: 11 dhikr presets, 200px circular tap button, vibrate, per-dhikr running totals
- **sadaqah**: Sadaqah Jariyah branding banner (dedicated to Ahmed Abdel Hafez), shareable beneficial-knowledge cards + personal dua list

## Quran reciters (16 total, all from mp3quran.net, verified)
afs (Alafasy), shur (Shuraim), sds (Sudais), husr (Husary), minsh (Minshawi), basit (AbdulBasit), qtm (Qatami), ajm (Ajami), ghmd (Ghamdi), bdr (Tablawi), bna (Banna), shatri (Shatri), saud (Saud Shuraim alt), maher (Maher Mueaqly), juhany (Juhany), abdulbasit-mjwd (mujawwad)
- `reciterUrl(rid, surahNum)` for full surah; `ayahAudioUrl(rid, globalAyahNum)` for single-ayah from cdn.islamic.network

## Memorization tester (اختبر حفظك)
Web Speech API (`ar-SA`), continuous mode. Tokenizes user speech, normalizes Arabic (strips harakat, unifies hamza/alif/ya/ta marbouta), greedy-aligns to expected words. Coloring: green for matched, red+underline for missed. Auto-advances on ≥80% match. Includes accuracy disclaimer.

## Smoother mushaf swipe
Axis-locked touch + finger-follow (`transform: translateX`), low threshold (35px / velocity 0.35), 0.18s cubic-bezier release. Page preloading window: -2..+3.

## Sunnah multi-book
`SUNNAH_BOOKS` array with `{ id, title, author, file, hasSections }`. In-memory cache. Books w/ `hasSections=false` (Nawawi-40, Qudsi-40) render as flat list; the rest use the section grid. Note: Musnad Ahmad not available from any free source — skipped.

## LocalStorage keys
`islam_loc`, `islam_adhan`, `islam_shares`, `islam_duas`, `islam_tafsir_surah`, `islam_tafsir_ayah`, `islam_adhkar_cat`, `islam_adhkar_sub`, `islam_sunnah_book`, `islam_sunnah_section`, `islam_tab`, `islam_quran_page`, `islam_reciter`, `islam_app_settings`, `islam_ayah_repeat`, `islam_tasbih_v2`, `islam_tasbih_active`, `islam_tasbih_vib`

## Workflow
- `Start application`: `npm run dev` runs `node server.js & vite` (API on 3001, Vite on 5000, proxied `/api` → 3001)
