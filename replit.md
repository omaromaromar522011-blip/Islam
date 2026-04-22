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
- `public/adhkar/all.json` — 326 adhkar in 17 categories (from hisnmuslim.com)

## Tabs
- prayer (default): times, countdown, adhan playback w/ settings
- quran: مصحف pages + تفسير المُيسَّر sub-tabs (search across 6236 ayat)
- adhkar: 326 adhkar/duas with counter and search
- sadaqah: shareable beneficial-knowledge cards + personal dua list

## LocalStorage keys
`islam_loc`, `islam_adhan`, `islam_shares`, `islam_duas`, `islam_tafsir_surah`, `islam_tafsir_ayah`, `islam_adhkar_cat`

## Workflow
- `Start application`: `npm run dev` on port 5000
