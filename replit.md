# Islam (تطبيق إسلامي)

A React + Vite app dedicated as صدقة جارية (Sadaqah Jariyah) for Ahmed Abdel Hafez (أحمد عبد الحفيظ) ولكلّ أمواتِ المسلمين.
Eight tabs: prayer times (with offline-cached adhan + bookmark banner + accurate per-method calculations), Quran mushaf viewer, Reciters library (mp3quran 239 reciters), Adhkar/Sunnah hub, Tasbih + global istighfar counter, Fatwas (5 trusted sources), nearby Mosques map, and Sadaqah Jariyah dua-sharing.

## Stack
- React 18 + Vite 5 (dev port 5000), Express API on port 3001
- `adhan` for prayer time calculations (12+ methods + Madhab toggle)
- `leaflet` + `react-leaflet` (OSM tiles + Overpass API for mosques)
- Geolocation API + server-side IP fallback (`/api/ip-country` proxies ipwho.is/ipapi.co/api.country.is)
- HTMLAudioElement for adhan + reciter surahs
- Web Notifications API for prayer + daily Quran reminders (also via Service Worker postMessage)

## Structure
- `index.html` — RTL Arabic shell with 7 Arabic Google Fonts + CSS variable theme tokens
- `src/main.jsx` — React entry + SW registration
- `src/IslamicApp.jsx` — single-component app (~3500 lines, all sections)
- `server.js` — Express 5 API (Replit DB persistence, istighfar counter, IP geo proxy)
- `public/sw.js` — Service Worker `islam-shell-v3`: precaches all 15 adhan mp3s on install + cache-first for `/adhan|/quran|/tafsir|/adhkar|/sunnah` + `show-quran-reminder` message handler
- `public/quran/*.png` — 604 mushaf pages
- `public/quran/surah-pages.json` — surah → first-page mapping
- `public/tafsir/{quran,muyassar,surahs}.json` — Quran text + Tafsir Muyassar
- `public/adhan/*.mp3` — 16 adhan recordings
- `public/adhkar/all.json` — 593 adhkar in 149 categories
- `public/sunnah/{bukhari,muslim,nawawi,qudsi}.json` — 4 hadith books

## Theme system
- Theme tokens (`--c-bg`, `--c-surface`, `--c-accent`, `--c-gold`, `--c-red`, etc.) defined as CSS variables in `index.html`
- `THEMES`, `FONT_FAMILIES` (7 fonts), `FONT_SIZES` applied via `useAppSettings` hook
- All persisted to localStorage `islam_app_settings`

## Tabs (8)
- **prayer**: bookmark banner ("وقفت في سورة X صفحة Y" → tap to resume), Hijri banner, LocationBar, full prayer times w/ adhan, settings include calculation method (auto-by-country / Egyptian / UmmAlQura / Karachi / NorthAmerica / Dubai / Qatar / Kuwait / Singapore / Tehran / Turkey / MWL / Moonsighting) + Madhab (Shafii/Hanafi)
- **quran**: surah index + mushaf pages w/ touch swipe + full-surah reciter audio + per-ayah Tafsir modal (no audio repeat). Writes `islam_quran_bookmark` for the home banner.
- **reciters**: fetches mp3quran v3 reciters API (~239), cached 24h. Search bar, list, reciter detail w/ moshaf picker → 114 surah list with play/stop/download. Robust playback w/ alt-server fallback.
- **adhkar**: adhkar (149 cats) + sunnah hub (Bukhari/Muslim/Nawawi/Qudsi)
- **tasbih**: 11 dhikr presets + GLOBAL ISTIGHFAR COUNTER (shared across all users via `/api/istighfar`, debounced batched POST every 800ms, polls every 15s, shows "all Muslims" + "your contribution")
- **fatwa**: search box → opens fatwa results in a new tab on islamweb.net / dar-alifta.org / islamqa.info / binbaz.org.sa / islamonline.net. Recent searches saved. Disclaimer that the app is only a referrer.
- **mosques**: needs location. Leaflet+OSM map with marker for user + Overpass API query (around: 1/2/3/5/10 km, `amenity=place_of_worship religion=muslim`). Each marker popup → Google Maps directions. Below-map list of up to 30 mosques.
- **sadaqah**: dedicated to Ahmed Abdel Hafez "ولكلّ أمواتِ المسلمين", shareable cards + personal dua list

## Country → prayer method auto map
`COUNTRY_TO_METHOD`: EG→Egyptian, SA/BH/OM→UmmAlQura, AE→Dubai, QA→Qatar, KW→Kuwait, PK/IN/BD/AF/LK→Karachi, US/CA/MX→NorthAmerica, SG/MY/ID/BN/PH→Singapore, IR→Tehran, TR→Turkey, MA/DZ/TN/MR→MWL, others→MWL. Stored as `pos.autoMethod`; used when user selects "auto" in settings.

## Daily Quran reminder
When `quranReminderEnabled` + Notification permission granted, polls every 30s; at exact `quranReminderTime` posts message to SW (`show-quran-reminder`) which calls `registration.showNotification(...)`. Stores `islam_reminder_YYYY-MM-DD` to fire only once/day. Works while app is open; requires PWA install for true background.

## Global istighfar
`server.js` keys `global_istighfar_v1` in Replit DB. GET returns `{total}`. POST `{inc}` increments (rate-limited 60/min/IP, max 100 per request). Client batches taps with 800ms debounce, sends `Math.min(50, pending)`.

## Bottom nav
Horizontally scrollable (`overflow-x: auto`), 8 buttons each 72px min-width, sticky bottom, with active indicator bar.

## LocalStorage keys
`islam_loc`, `islam_adhan`, `islam_shares`, `islam_duas`, `islam_tafsir_surah`, `islam_tafsir_ayah`, `islam_adhkar_cat`, `islam_adhkar_sub`, `islam_sunnah_book`, `islam_sunnah_section`, `islam_tab`, `islam_quran_page`, `islam_quran_bookmark`, `islam_quran_jump`, `islam_reciter`, `islam_app_settings`, `islam_tasbih_v2`, `islam_tasbih_active`, `islam_tasbih_vib`, `islam_ist_mine`, `islam_reciters_cache_v2`, `islam_fatwa_recent`, `islam_reminder_YYYY-MM-DD`

## Workflow
- `Start application`: `npm run dev` runs `node server.js & vite` (API on 3001, Vite on 5000, proxied `/api` → 3001)

## Recent overhaul (April 2026)
- REMOVED: memorization tester, per-ayah audio + repeat (Tafsir kept)
- ADDED: Reciters tab, Fatwas tab, Mosques map, global istighfar, daily Quran reminder, bookmark banner, font-size control (was already present), accurate per-method/madhab prayer times, country auto-detect, offline-cached adhan via SW
- Sadaqah header now reads "ولكلّ أمواتِ المسلمين"
