import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as adhan from 'adhan';
import 'leaflet/dist/leaflet.css';

const C = {
  bg:           "var(--c-bg)",
  surface:      "var(--c-surface)",
  surfaceAlt:   "var(--c-surface-alt)",
  accent:       "var(--c-accent)",
  accentLight:  "var(--c-accent-light)",
  accentDark:   "var(--c-accent-dark)",
  gold:         "var(--c-gold)",
  text:         "var(--c-text)",
  muted:        "var(--c-muted)",
  border:       "var(--c-border)",
  borderStrong: "var(--c-border-strong)",
  red:          "var(--c-red)",
  sub:          "var(--c-sub)",
  shadow:       "var(--c-shadow)",
  shadowLg:     "var(--c-shadow-lg)"
};

const THEMES = {
  light: {
    '--c-bg':           '#f5f1ea',
    '--c-surface':      '#ffffff',
    '--c-surface-alt':  '#faf6ee',
    '--c-accent':       '#0f6b5f',
    '--c-accent-light': '#14897a',
    '--c-accent-dark':  '#0a4d44',
    '--c-gold':         '#b08840',
    '--c-text':         '#1a2530',
    '--c-muted':        '#6b7785',
    '--c-border':       '#e3ddd1',
    '--c-border-strong':'#cfc6b4',
    '--c-red':          '#c84545',
    '--c-sub':          '#8a93a0',
    '--c-shadow':       '0 4px 20px rgba(15,107,95,0.08)',
    '--c-shadow-lg':    '0 8px 32px rgba(15,107,95,0.12)'
  },
  dark: {
    '--c-bg':           '#0c1419',
    '--c-surface':      '#152027',
    '--c-surface-alt':  '#1c2a33',
    '--c-accent':       '#3aae9d',
    '--c-accent-light': '#5dc7b5',
    '--c-accent-dark':  '#2a8b7d',
    '--c-gold':         '#d4ac5a',
    '--c-text':         '#e9eef2',
    '--c-muted':        '#8da3ad',
    '--c-border':       '#26343d',
    '--c-border-strong':'#374751',
    '--c-red':          '#e57373',
    '--c-sub':          '#7f8d96',
    '--c-shadow':       '0 4px 20px rgba(0,0,0,0.35)',
    '--c-shadow-lg':    '0 8px 32px rgba(0,0,0,0.45)'
  }
};

const FONT_FAMILIES = [
  { id: 'system',       label: 'النظام (افتراضي)', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { id: 'amiri',        label: 'أميري — كلاسيكي',   stack: '"Amiri", "Scheherazade New", serif' },
  { id: 'cairo',        label: 'القاهرة — حديث',    stack: '"Cairo", system-ui, sans-serif' },
  { id: 'tajawal',      label: 'تجوّال — أنيق',     stack: '"Tajawal", system-ui, sans-serif' },
  { id: 'noto',         label: 'نوتو نسخ عربي',     stack: '"Noto Naskh Arabic", "Amiri", serif' },
  { id: 'scheherazade', label: 'شهرزاد — قرآني',    stack: '"Scheherazade New", "Amiri", serif' },
  { id: 'reem',         label: 'ريم كوفي',           stack: '"Reem Kufi", system-ui, sans-serif' }
];

const FONT_SIZES = [
  { id: 'sm',  label: 'صغير',   px: 14 },
  { id: 'md',  label: 'متوسط',  px: 16 },
  { id: 'lg',  label: 'كبير',   px: 18 },
  { id: 'xl',  label: 'كبير جداً', px: 20 }
];

const APP_SETTINGS_DEFAULTS = {
  theme: 'light',
  fontId: 'system',
  sizeId: 'md',
  prayerMethod: 'auto',     // auto | MWL | Egyptian | UmmAlQura | Karachi | NorthAmerica | Dubai | Qatar | Kuwait | Singapore | Tehran | Turkey
  madhab: 'shafii',         // shafii | hanafi (affects Asr time)
  quranReminderEnabled: false,
  quranReminderTime: '20:00'
};
const useAppSettings = () => {
  const [settings, setSettings] = React.useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('islam_app_settings') || 'null');
      if (s) return { ...APP_SETTINGS_DEFAULTS, ...s };
    } catch {}
    return { ...APP_SETTINGS_DEFAULTS };
  });
  React.useEffect(() => {
    try { localStorage.setItem('islam_app_settings', JSON.stringify(settings)); } catch {}
    const root = document.documentElement;
    const theme = THEMES[settings.theme] || THEMES.light;
    for (const k of Object.keys(theme)) root.style.setProperty(k, theme[k]);
    const f = FONT_FAMILIES.find(x => x.id === settings.fontId) || FONT_FAMILIES[0];
    root.style.setProperty('--app-font', f.stack);
    const sz = FONT_SIZES.find(x => x.id === settings.sizeId) || FONT_SIZES[1];
    root.style.setProperty('--app-font-size', sz.px + 'px');
    root.setAttribute('data-theme', settings.theme);
  }, [settings]);
  return [settings, setSettings];
};

const ADHAN_VOICES = [
  { id: 'makkah', label: 'الحرم المكي', file: '/adhan/makkah.mp3' },
  { id: 'madinah', label: 'الحرم النبوي', file: '/adhan/madinah.mp3' },
  { id: 'azan1', label: 'أذان رقم ١', file: '/adhan/azan1.mp3' },
  { id: 'azan3', label: 'أذان رقم ٣', file: '/adhan/azan3.mp3' },
  { id: 'azan4', label: 'أذان رقم ٤', file: '/adhan/azan4.mp3' },
  { id: 'azan6', label: 'أذان رقم ٦', file: '/adhan/azan6.mp3' },
  { id: 'azan7', label: 'أذان رقم ٧', file: '/adhan/azan7.mp3' },
  { id: 'azan8', label: 'أذان رقم ٨', file: '/adhan/azan8.mp3' },
  { id: 'azan9', label: 'أذان رقم ٩', file: '/adhan/azan9.mp3' },
  { id: 'azan11', label: 'أذان رقم ١١', file: '/adhan/azan11.mp3' },
  { id: 'azan12', label: 'أذان رقم ١٢', file: '/adhan/azan12.mp3' },
  { id: 'azan13', label: 'أذان رقم ١٣', file: '/adhan/azan13.mp3' },
  { id: 'fajr', label: 'أذان الفجر — الشيخ علي ملا (الحرم المكي)', file: '/adhan/fajr.mp3' },
  { id: 'fajr2', label: 'أذان الفجر — الشيخ مشاري العفاسي', file: '/adhan/fajr2.mp3' },
  { id: 'fajr3', label: 'أذان الفجر — الشيخ محمد بن ماجد', file: '/adhan/fajr3.mp3' }
];

const PRAYER_NAMES = {
  fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر",
  asr: "العصر", maghrib: "المغرب", isha: "العشاء"
};

const DEFAULT_ADHAN_SETTINGS = {
  enabled: false,
  notify: true,
  voice: 'makkah',
  fajrVoice: 'fajr',
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }
};

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

function HijriDateBanner({ now }) {
  const hijri = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', {
        weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
      }).formatToParts(now);
      const get = (t) => (parts.find(p => p.type === t) || {}).value || '';
      const monthNum = parseInt(get('month').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10);
      const monthName = HIJRI_MONTHS_AR[monthNum - 1] || get('month');
      return {
        weekday: get('weekday'),
        day: get('day'),
        month: monthName,
        year: get('year')
      };
    } catch {
      return null;
    }
  }, [now]);

  const gregorian = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
    } catch { return ''; }
  }, [now]);

  if (!hijri) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '12px 14px', marginBottom: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
          التقويم الهجري — أم القرى
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: C.accentLight }}>
          {hijri.weekday}، {hijri.day} {hijri.month} {hijri.year} هـ
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
          {gregorian}
        </div>
      </div>
      <div style={{ fontSize: 28, color: C.accent, opacity: 0.6 }}>☪</div>
    </div>
  );
}

const PrayerTimes = ({ pos, appSettings, goQuran }) => {
  const [times, setTimes] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('islam_adhan') || 'null');
      return s ? { ...DEFAULT_ADHAN_SETTINGS, ...s, prayers: { ...DEFAULT_ADHAN_SETTINGS.prayers, ...(s.prayers || {}) } } : DEFAULT_ADHAN_SETTINGS;
    } catch { return DEFAULT_ADHAN_SETTINGS; }
  });
  const audioRef = useRef(null);
  const playedRef = useRef({}); // { 'fajr_2026-04-22': true }
  const settingsRef = useRef(settings);
  const timesRef = useRef(null);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { timesRef.current = times; }, [times]);

  useEffect(() => {
    localStorage.setItem('islam_adhan', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!pos) return;
    const update = () => {
      const coordinates = new adhan.Coordinates(pos.lat, pos.lon);
      const methodId = (appSettings && appSettings.prayerMethod) || 'auto';
      const resolved = methodId === 'auto' ? (pos.autoMethod || 'MWL') : methodId;
      const methodFns = {
        MWL: adhan.CalculationMethod.MuslimWorldLeague,
        Egyptian: adhan.CalculationMethod.Egyptian,
        UmmAlQura: adhan.CalculationMethod.UmmAlQura,
        Karachi: adhan.CalculationMethod.Karachi,
        NorthAmerica: adhan.CalculationMethod.NorthAmerica,
        Dubai: adhan.CalculationMethod.Dubai,
        Qatar: adhan.CalculationMethod.Qatar,
        Kuwait: adhan.CalculationMethod.Kuwait,
        Singapore: adhan.CalculationMethod.Singapore,
        Tehran: adhan.CalculationMethod.Tehran,
        Turkey: adhan.CalculationMethod.Turkey,
        MoonsightingCommittee: adhan.CalculationMethod.MoonsightingCommittee
      };
      const params = (methodFns[resolved] || adhan.CalculationMethod.MuslimWorldLeague)();
      params.madhab = (appSettings && appSettings.madhab === 'hanafi') ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
      const pt = new adhan.PrayerTimes(coordinates, new Date(), params);
      setTimes(pt);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [pos, appSettings && appSettings.prayerMethod, appSettings && appSettings.madhab]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Trigger an adhan: play audio + show notification
  const triggerAdhan = async (prayerName) => {
    const s = settingsRef.current;
    const voiceId = prayerName === 'fajr' ? (s.fajrVoice || s.voice) : s.voice;
    const voice = ADHAN_VOICES.find(v => v.id === voiceId) || ADHAN_VOICES[0];
    if (audioRef.current) {
      try {
        audioRef.current.src = voice.file;
        audioRef.current.muted = false;
        audioRef.current.volume = 1;
        await audioRef.current.play();
      } catch (e) { console.warn('Adhan audio blocked:', e); }
    }
    if (s.notify && 'Notification' in window && Notification.permission === 'granted') {
      const title = 'حان وقت الصلاة';
      const body = `حان الآن وقت ${PRAYER_NAMES[prayerName]} — أقم الصلاة`;
      try {
        const reg = await (navigator.serviceWorker?.ready || Promise.resolve(null));
        if (reg && reg.active) {
          reg.active.postMessage({ type: 'show-prayer-notification', title, body, tag: 'prayer-' + prayerName });
        } else {
          new Notification(title, { body, tag: 'prayer-' + prayerName, icon: '/icon.svg', requireInteraction: true, lang: 'ar', dir: 'rtl' });
        }
      } catch {}
    }
    if (navigator.vibrate) { try { navigator.vibrate([400, 200, 400, 200, 400]); } catch {} }
  };

  // Schedule the next prayer with a precise setTimeout (re-armed when times/settings change)
  useEffect(() => {
    if (!times || !settings.enabled) return;
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const nowMs = Date.now();
    let target = null;
    for (const p of order) {
      if (!settings.prayers[p]) continue;
      const tMs = times[p].getTime();
      if (tMs > nowMs + 500) { target = { name: p, at: tMs }; break; }
    }
    if (!target) return;
    const today = new Date().toISOString().slice(0, 10);
    const delay = Math.min(target.at - nowMs, 2_000_000_000);
    const id = setTimeout(() => {
      const key = `${target.name}_${today}`;
      if (!playedRef.current[key]) {
        playedRef.current[key] = true;
        triggerAdhan(target.name);
      }
    }, delay);
    return () => clearTimeout(id);
  }, [times, settings.enabled, settings.notify, settings.voice, settings.fajrVoice, settings.prayers.fajr, settings.prayers.dhuhr, settings.prayers.asr, settings.prayers.maghrib, settings.prayers.isha]);

  // Safety net: also poll every 20s in case the device slept past the timeout
  useEffect(() => {
    const check = () => {
      const t = timesRef.current;
      const s = settingsRef.current;
      if (!t || !s.enabled) return;
      const today = new Date().toISOString().slice(0, 10);
      const nowMs = Date.now();
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p => {
        if (!s.prayers[p]) return;
        const key = `${p}_${today}`;
        if (playedRef.current[key]) return;
        const diff = nowMs - t[p].getTime();
        if (diff >= 0 && diff < 5 * 60_000) {
          playedRef.current[key] = true;
          triggerAdhan(p);
        }
      });
    };
    check();
    const id = setInterval(check, 20_000);
    return () => clearInterval(id);
  }, []);

  const unlockAudio = async () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.src = ADHAN_VOICES.find(v => v.id === settings.voice).file;
      audioRef.current.muted = true;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.muted = false;
      setAudioUnlocked(true);

      let notifyOk = settings.notify;
      if ('Notification' in window) {
        try {
          if (Notification.permission === 'default') {
            const perm = await Notification.requestPermission();
            notifyOk = perm === 'granted';
          } else {
            notifyOk = Notification.permission === 'granted' && settings.notify;
          }
        } catch { notifyOk = false; }
      } else {
        notifyOk = false;
      }

      setSettings(s => ({ ...s, enabled: true, notify: notifyOk }));
    } catch (e) {
      alert('لم نتمكن من تفعيل الصوت. يرجى السماح بتشغيل الصوت من إعدادات المتصفح.');
    }
  };

  const previewVoice = (voiceId) => {
    if (!audioRef.current) return;
    const voice = ADHAN_VOICES.find(v => v.id === voiceId);
    audioRef.current.src = voice.file;
    audioRef.current.muted = false;
    audioRef.current.play().catch(() => {});
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Determine next prayer
  const nextPrayer = useMemo(() => {
    if (!times) return null;
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const p of order) {
      if (times[p].getTime() > now.getTime()) return { name: p, time: times[p] };
    }
    // After isha, next is tomorrow's fajr (approximate using today's fajr + 1 day)
    return { name: 'fajr', time: new Date(times.fajr.getTime() + 86400000), tomorrow: true };
  }, [times, now]);

  const formatCountdown = (target) => {
    const ms = target.getTime() - now.getTime();
    if (ms <= 0) return '٠٠:٠٠:٠٠';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map(x => String(x).padStart(2, '0')).join(':')
      .replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  // Bookmark from Quran tab (last read page)
  const [bookmark, setBookmark] = useState(() => {
    try { return JSON.parse(localStorage.getItem('islam_quran_bookmark') || 'null'); } catch { return null; }
  });
  useEffect(() => {
    const onStore = () => {
      try { setBookmark(JSON.parse(localStorage.getItem('islam_quran_bookmark') || 'null')); } catch {}
    };
    const id = setInterval(onStore, 2000);
    window.addEventListener('storage', onStore);
    return () => { clearInterval(id); window.removeEventListener('storage', onStore); };
  }, []);

  return (
    <div>
      <audio ref={audioRef} preload="none" />

      {/* Bookmark — last read Quran page */}
      {bookmark && bookmark.surahName && (
        <button onClick={() => goQuran && goQuran(bookmark.page)} style={{
          width: '100%', textAlign: 'right', cursor: 'pointer',
          background: `linear-gradient(135deg, ${C.surface} 0%, rgba(15,107,95,0.08) 100%)`,
          border: `1px solid ${C.accent}`, borderRadius: 14, padding: '12px 14px',
          marginBottom: 12, fontFamily: 'inherit', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 10
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>وقفت في القراءة عند</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: C.accentLight }}>
              سورة {bookmark.surahName} — صفحة {String(bookmark.page).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])}
            </div>
          </div>
          <div style={{
            background: C.accent, color: '#fff', padding: '8px 14px',
            borderRadius: 10, fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap'
          }}>تابع القراءة ←</div>
        </button>
      )}

      {/* Hijri date banner — Umm Al-Qura calendar */}
      <HijriDateBanner now={now} />

      {/* Next prayer banner */}
      {nextPrayer && (
        <div style={{
          background: `linear-gradient(135deg, ${C.surface} 0%, rgba(196,164,89,0.15) 100%)`,
          padding: 18, borderRadius: 16, border: `1px solid ${C.accent}`,
          marginBottom: 14, textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            {nextPrayer.tomorrow ? 'صلاة الفجر — غداً' : 'الصلاة القادمة'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: C.accentLight, marginBottom: 6 }}>
            {PRAYER_NAMES[nextPrayer.name]}
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: C.accent, fontVariantNumeric: 'tabular-nums' }}>
            {formatCountdown(nextPrayer.time)}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            متبقي حتى الأذان
          </div>
        </div>
      )}

      {/* Adhan toggle button */}
      <button onClick={() => setShowSettings(s => !s)} style={{
        width: '100%', padding: 14, marginBottom: 14,
        background: settings.enabled ? 'rgba(34,197,94,0.12)' : C.surface,
        color: settings.enabled ? '#22c55e' : C.text,
        border: `1px solid ${settings.enabled ? '#22c55e' : C.border}`,
        borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 15, fontWeight: 'bold'
      }}>
        <span>{settings.enabled ? '🔔 الأذان مفعّل' : '🔕 إعدادات الأذان'}</span>
        <span style={{ fontSize: 13, color: C.muted }}>{showSettings ? '▲' : '▼'}</span>
      </button>

      {showSettings && (
        <div style={{
          background: C.surface, padding: 16, borderRadius: 14,
          border: `1px solid ${C.border}`, marginBottom: 14
        }}>
          {!audioUnlocked && !settings.enabled && (
            <div style={{
              background: 'rgba(196,164,89,0.08)', padding: 12, borderRadius: 10,
              marginBottom: 14, fontSize: 13, color: C.accentLight, lineHeight: 1.7
            }}>
              ℹ️ لتفعيل تنبيه الأذان، اضغط الزر أدناه مرة واحدة. المتصفحات تشترط تفاعل المستخدم لتشغيل الصوت تلقائياً.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 'bold' }}>تشغيل الأذان عند موعد الصلاة</span>
            <button onClick={() => {
              if (settings.enabled) setSettings(s => ({ ...s, enabled: false }));
              else unlockAudio();
            }} style={{
              width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              background: settings.enabled ? '#22c55e' : C.border,
              position: 'relative', transition: 'background .2s'
            }}>
              <div style={{
                position: 'absolute', top: 3, [settings.enabled ? 'left' : 'right']: 3,
                width: 24, height: 24, borderRadius: '50%', background: '#fff',
                transition: 'all .2s'
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 'bold' }}>إشعار على الشاشة عند الأذان</span>
            <button onClick={async () => {
              if (settings.notify) { setSettings(s => ({ ...s, notify: false })); return; }
              if ('Notification' in window) {
                let perm = Notification.permission;
                if (perm === 'default') perm = await Notification.requestPermission();
                if (perm === 'granted') setSettings(s => ({ ...s, notify: true }));
                else alert('يرجى السماح بالإشعارات من إعدادات المتصفح');
              }
            }} style={{
              width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              background: settings.notify ? '#22c55e' : C.border,
              position: 'relative', transition: 'background .2s'
            }}>
              <div style={{
                position: 'absolute', top: 3, [settings.notify ? 'left' : 'right']: 3,
                width: 24, height: 24, borderRadius: '50%', background: '#fff',
                transition: 'all .2s'
              }} />
            </button>
          </div>

          {settings.enabled && (
            <div style={{
              background: 'rgba(34,197,94,0.07)', border: `1px solid rgba(34,197,94,0.3)`,
              padding: 12, borderRadius: 10, marginBottom: 14,
              fontSize: 12, color: '#a3e9b6', lineHeight: 1.7
            }}>
              ✓ الأذان مفعّل. للحصول على إشعارات أفضل على الموبايل: افتح القائمة في المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق". مع التطبيق المثبت يصلك الأذان حتى لو كانت الشاشة مغلقة في معظم الأحيان.
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>صوت الأذان</div>
            {ADHAN_VOICES.filter(v => !v.id.startsWith('fajr')).map(v => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 10, marginBottom: 6, borderRadius: 10, cursor: 'pointer',
                background: settings.voice === v.id ? 'rgba(196,164,89,0.12)' : C.bg,
                border: `1px solid ${settings.voice === v.id ? C.accent : C.border}`
              }} onClick={() => setSettings(s => ({ ...s, voice: v.id }))}>
                <span style={{ color: settings.voice === v.id ? C.accentLight : C.text, fontWeight: 'bold' }}>
                  {settings.voice === v.id ? '● ' : '○ '}{v.label}
                </span>
                <button onClick={e => { e.stopPropagation(); previewVoice(v.id); }} style={{
                  background: 'transparent', color: C.accent, border: `1px solid ${C.border}`,
                  padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12
                }}>▶ معاينة</button>
              </div>
            ))}
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8, marginBottom: 6 }}>
              صوت أذان الفجر مميز («الصلاة خير من النوم»):
            </div>
            {ADHAN_VOICES.filter(v => v.id.startsWith('fajr')).map(v => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 10, marginBottom: 6, borderRadius: 10, cursor: 'pointer',
                background: settings.fajrVoice === v.id ? 'rgba(196,164,89,0.12)' : C.bg,
                border: `1px solid ${settings.fajrVoice === v.id ? C.accent : C.border}`
              }} onClick={() => setSettings(s => ({ ...s, fajrVoice: v.id }))}>
                <span style={{ color: settings.fajrVoice === v.id ? C.accentLight : C.text, fontWeight: 'bold' }}>
                  {settings.fajrVoice === v.id ? '● ' : '○ '}{v.label}
                </span>
                <button onClick={(e) => { e.stopPropagation(); previewVoice(v.id); }} style={{
                  background: 'transparent', color: C.accent, border: `1px solid ${C.border}`,
                  padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12
                }}>▶ معاينة</button>
              </div>
            ))}
            <button onClick={stopPreview} style={{
              marginTop: 8, width: '100%', background: 'transparent',
              color: C.muted, border: `1px solid ${C.border}`,
              padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: 12
            }}>■ إيقاف المعاينة</button>
          </div>

          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>تنبيهات الصلوات</div>
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => (
              <label key={p} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 10, marginBottom: 4, background: C.bg, borderRadius: 8,
                cursor: 'pointer'
              }}>
                <span style={{ color: C.text }}>{PRAYER_NAMES[p]}</span>
                <input type="checkbox" checked={settings.prayers[p]} onChange={e => {
                  setSettings(s => ({ ...s, prayers: { ...s.prayers, [p]: e.target.checked } }));
                }} style={{ width: 18, height: 18, accentColor: C.accent, cursor: 'pointer' }} />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Prayer times list */}
      <div style={{ display: 'grid', gap: 10 }}>
        {times ? Object.keys(PRAYER_NAMES).map(p => {
          const isNext = nextPrayer && nextPrayer.name === p && !nextPrayer.tomorrow;
          return (
            <div key={p} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              background: isNext ? 'rgba(196,164,89,0.1)' : C.surface,
              borderRadius: 12,
              border: `1px solid ${isNext ? C.accent : C.border}`
            }}>
              <span style={{ color: isNext ? C.accent : C.accentLight, fontWeight: 'bold' }}>
                {isNext && '◆ '}{PRAYER_NAMES[p]}
              </span>
              <span style={{ color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                {times[p].toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        }) : <div style={{ color: C.muted, textAlign: 'center', padding: 20 }}>جاري حساب المواقيت...</div>}
      </div>
    </div>
  );
};

// All reciters verified — surah audio on mp3quran.net AND single-ayah audio on cdn.islamic.network
const RECITERS = [
  { id: 'afs',    name: 'مشاري بن راشد العفاسي',   server: 'https://server8.mp3quran.net/afs/',   ayah: 'ar.alafasy' },
  { id: 'shur',   name: 'سعود الشريم',              server: 'https://server7.mp3quran.net/shur/',  ayah: 'ar.saoodshuraym' },
  { id: 'sds',    name: 'عبدالرحمن السديس',         server: 'https://server11.mp3quran.net/sds/',  ayah: 'ar.abdurrahmaansudais' },
  { id: 'husr',   name: 'محمود خليل الحصري',        server: 'https://server13.mp3quran.net/husr/', ayah: 'ar.husary' },
  { id: 'minsh',  name: 'محمد صديق المنشاوي',       server: 'https://server10.mp3quran.net/minsh/',ayah: 'ar.minshawi' },
  { id: 'basit',  name: 'عبدالباسط عبدالصمد',       server: 'https://server7.mp3quran.net/basit/', ayah: 'ar.abdulbasitmurattal' },
  { id: 'ajm',    name: 'أحمد بن علي العجمي',       server: 'https://server10.mp3quran.net/ajm/',  ayah: 'ar.ahmedajamy' },
  { id: 'maher',  name: 'ماهر المعيقلي',            server: 'https://server12.mp3quran.net/maher/',ayah: 'ar.mahermuaiqly' },
  { id: 'hthfi',  name: 'علي بن عبدالرحمن الحذيفي', server: 'https://server9.mp3quran.net/hthfi/', ayah: 'ar.hudhaify' },
  { id: 'akdr',   name: 'إبراهيم الأخضر',           server: 'https://server6.mp3quran.net/akdr/',  ayah: 'ar.ibrahimakhdar' },
  { id: 'shatri', name: 'أبو بكر الشاطري',          server: 'https://server11.mp3quran.net/shatri/', ayah: 'ar.shaatree' },
  { id: 'hani',   name: 'هاني الرفاعي',             server: 'https://server8.mp3quran.net/hani/',  ayah: 'ar.hanirifai' },
  { id: 'ayyub',  name: 'محمد أيوب',                server: 'https://server8.mp3quran.net/ayyub/', ayah: 'ar.muhammadayyoub' }
];
const reciterUrl = (rid, surahNum) => {
  const r = RECITERS.find(x => x.id === rid) || RECITERS[0];
  return `${r.server}${String(surahNum).padStart(3, '0')}.mp3`;
};
const ayahAudioUrl = (rid, ayahGlobalNum) => {
  const r = RECITERS.find(x => x.id === rid) || RECITERS[0];
  return `https://cdn.islamic.network/quran/audio/128/${r.ayah}/${ayahGlobalNum}.mp3`;
};

const SurahIndex = ({ data, surahPages, openSurah, currentSurahNum }) => {
  const [q, setQ] = useState('');
  if (!data || !surahPages) {
    return <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>جاري التحميل...</div>;
  }
  const norm = (s) => (s || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const qn = norm(q.trim());
  const filtered = data.surahs.filter(s => {
    if (!qn) return true;
    return norm(s.name).includes(qn) || (s.en || '').toLowerCase().includes(q.trim().toLowerCase()) || String(s.n) === q.trim();
  });
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="ابحث باسم السورة أو رقمها..."
          style={{
            width: '100%', padding: '12px 14px', boxSizing: 'border-box',
            background: C.surface, color: C.text, border: `1px solid ${C.border}`,
            borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
            boxShadow: C.shadow
          }}
        />
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8
      }}>
        {filtered.map(s => {
          const pg = surahPages[s.n];
          const isCurrent = currentSurahNum === s.n;
          return (
            <button
              key={s.n}
              onClick={() => openSurah(s.n)}
              style={{
                background: isCurrent ? C.accent : C.surface,
                color: isCurrent ? '#fff' : C.text,
                border: `1px solid ${isCurrent ? C.accent : C.border}`,
                padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: isCurrent ? '0 4px 14px rgba(15,107,95,0.25)' : C.shadow,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                fontFamily: 'inherit'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isCurrent ? 'rgba(255,255,255,0.2)' : C.surfaceAlt,
                color: isCurrent ? '#fff' : C.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: 13, flexShrink: 0,
                border: `1px solid ${isCurrent ? 'rgba(255,255,255,0.3)' : C.border}`
              }}>{s.n}</div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 15, fontWeight: 'bold',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{s.name.replace('سُورَةُ ', '')}</div>
                <div style={{
                  fontSize: 11, marginTop: 2,
                  color: isCurrent ? 'rgba(255,255,255,0.85)' : C.muted
                }}>صفحة {pg} • {s.count} آية</div>
              </div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: C.muted, padding: 30 }}>لا توجد نتائج</div>
      )}
    </div>
  );
};

const QuranSection = () => {
  const [view, setView] = useState('index');
  const [page, setPage] = useState(() => {
    const p = parseInt(localStorage.getItem('islam_quran_page') || '1', 10);
    return Number.isNaN(p) ? 1 : Math.max(1, Math.min(604, p));
  });
  const [flipDir, setFlipDir] = useState(0);
  const [ayahPicker, setAyahPicker] = useState(null);
  const [pagesMap, setPagesMap] = useState(null);
  const [data, setData] = useState(null);
  const [reciter, setReciter] = useState(() => {
    const saved = localStorage.getItem('islam_reciter');
    if (saved && RECITERS.find(r => r.id === saved)) return saved;
    return 'afs';
  });
  const [audioState, setAudioState] = useState('idle');
  const audioRef = useRef(null);
  const [surahPages, setSurahPages] = useState(null);
  const [dragX, setDragX] = useState(0);
  const pageStr = String(page).padStart(3, '0');
  const reciterName = (RECITERS.find(r => r.id === reciter) || RECITERS[0]).name;

  useEffect(() => { try { localStorage.setItem('islam_reciter', reciter); } catch {} }, [reciter]);

  // Preload neighbouring pages so swipes feel instant
  useEffect(() => {
    const offsets = [-2, -1, 1, 2, 3];
    const created = [];
    for (const off of offsets) {
      const p = page + off;
      if (p >= 1 && p <= 604) {
        const img = new Image();
        img.src = `/quran/${String(p).padStart(3, '0')}.png`;
        created.push(img);
      }
    }
    return () => { created.length = 0; };
  }, [page]);

  const currentSurahNum = pagesMap && pagesMap[page] && pagesMap[page][0] ? pagesMap[page][0].s : null;
  const currentSurah = currentSurahNum && data ? data.surahs.find(s => s.n === currentSurahNum) : null;

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setAudioState('idle');
  };

  const playSurah = () => {
    if (!currentSurahNum) return;
    if (audioState === 'playing') { stopAudio(); return; }
    const url = reciterUrl(reciter, currentSurahNum);
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    setAudioState('loading');
    audioRef.current.oncanplay = () => setAudioState('playing');
    audioRef.current.onended = () => setAudioState('idle');
    audioRef.current.onerror = () => { setAudioState('idle'); alert('تعذّر تشغيل التلاوة، حاول قارئاً آخر'); };
    audioRef.current.play().catch(() => setAudioState('idle'));
  };

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);
  useEffect(() => { stopAudio(); }, [reciter]);

  // Bookmark jump from Prayer tab — when set, jump page on mount
  useEffect(() => {
    try {
      const j = parseInt(localStorage.getItem('islam_quran_jump') || '0', 10);
      if (j >= 1 && j <= 604) {
        setPage(j);
        setView('mushaf');
        localStorage.removeItem('islam_quran_jump');
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('islam_quran_page', String(page)); } catch {}
    // Update home-page bookmark with current surah info
    try {
      if (currentSurah) {
        const bm = {
          page,
          surahNum: currentSurah.n,
          surahName: currentSurah.name.replace('سُورَةُ ', '').replace('ٱ', 'ا'),
          at: Date.now()
        };
        localStorage.setItem('islam_quran_bookmark', JSON.stringify(bm));
      }
    } catch {}
  }, [page, currentSurah]);

  useEffect(() => {
    Promise.all([
      fetch('/quran/pages.json').then(r => r.json()),
      fetch('/tafsir/surahs.json').then(r => r.json()),
      fetch('/tafsir/muyassar.json').then(r => r.json()),
      fetch('/tafsir/quran.json').then(r => r.json()),
      fetch('/quran/surah-pages.json').then(r => r.json()).catch(() => null)
    ]).then(([pages, surahs, tafsir, quran, sp]) => {
      setPagesMap(pages);
      setData({ surahs, tafsir, quran });
      if (sp) setSurahPages(sp);
    }).catch(() => {});
  }, []);

  const openSurah = (surahNum) => {
    if (surahPages && surahPages[surahNum]) {
      setFlipDir(0);
      setPage(surahPages[surahNum]);
      setView('mushaf');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goNext = () => { if (page < 604) { setFlipDir(-1); setPage(p => Math.min(604, p + 1)); } };
  const goPrev = () => { if (page > 1) { setFlipDir(1); setPage(p => Math.max(1, p - 1)); } };

  // Touch swipe — Arabic mushaf: dx>0 = next page. Smoother: track drag, lower threshold, follow finger.
  const touchRef = useRef({ x: 0, y: 0, t: 0, longTimer: null, moved: false, axis: null });
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: false, axis: null, longTimer: null };
    touchRef.current.longTimer = setTimeout(() => {
      if (!touchRef.current.moved && pagesMap && pagesMap[page]) {
        setAyahPicker({ page });
      }
    }, 500);
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (!touchRef.current.axis) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        touchRef.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        touchRef.current.moved = true;
        clearTimeout(touchRef.current.longTimer);
      }
    }
    if (touchRef.current.axis === 'x') {
      const limited = Math.max(-180, Math.min(180, dx));
      setDragX(limited);
    }
  };
  const onTouchEnd = (e) => {
    clearTimeout(touchRef.current.longTimer);
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    setDragX(0);
    if (touchRef.current.axis !== 'x') return;
    const velocity = Math.abs(dx) / Math.max(dt, 1);
    const passDistance = Math.abs(dx) > 35;
    const passVelocity = velocity > 0.35 && Math.abs(dx) > 18;
    if ((passDistance || passVelocity) && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goNext(); else goPrev();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: C.surfaceAlt, padding: 5, borderRadius: 14, border: `1px solid ${C.border}` }}>
        {[
          { id: 'index',  label: 'فهرس السور' },
          { id: 'mushaf', label: 'المصحف' },
          { id: 'tafsir', label: 'التفسير الميسّر' }
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: view === v.id ? C.accent : 'transparent',
            color: view === v.id ? '#fff' : C.muted,
            fontWeight: 'bold', fontSize: 13,
            transition: 'all 0.18s ease',
            boxShadow: view === v.id ? '0 2px 8px rgba(15,107,95,0.25)' : 'none'
          }}>{v.label}</button>
        ))}
      </div>

      {view === 'index' && (
        <SurahIndex data={data} surahPages={surahPages} openSurah={openSurah} currentSurahNum={currentSurahNum} />
      )}

      {view === 'mushaf' && (
        <div style={{ textAlign: 'center' }}>
          {/* Compact info strip — reciter, surah, page */}
          <div style={{
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentLight} 100%)`,
            color: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            boxShadow: C.shadow, fontSize: 13
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <div style={{ fontSize: 10, opacity: 0.85 }}>القارئ</div>
              <div style={{ fontWeight: 'bold', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{reciterName}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
              <div style={{ fontSize: 10, opacity: 0.85 }}>السورة</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{currentSurah ? currentSurah.name.replace('سُورَةُ ', '').replace('ٱ', 'ا') : '—'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <div style={{ fontSize: 10, opacity: 0.85 }}>الصفحة</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{page} / 604</div>
            </div>
          </div>

          {/* Audio control row */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 8, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: C.shadow
          }}>
            <button onClick={playSurah} disabled={!currentSurahNum || audioState === 'loading'} style={{
              background: audioState === 'playing' ? C.red : C.accent,
              color: '#fff',
              border: 'none', padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 13, minWidth: 80,
              boxShadow: '0 2px 8px rgba(15,107,95,0.25)'
            }}>
              {audioState === 'loading' ? '...' : audioState === 'playing' ? 'إيقاف' : 'تلاوة'}
            </button>
            <select value={reciter} onChange={e => setReciter(e.target.value)} style={{
              flex: 1, background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
              padding: '9px', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', minWidth: 0
            }}>
              {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button
              onClick={() => { if (pagesMap && pagesMap[page]) setAyahPicker({ page }); }}
              title="اختر آية للاستماع أو التفسير"
              style={{
                background: C.gold, color: '#fff', border: 'none', padding: '9px 12px',
                borderRadius: 9, cursor: 'pointer', fontWeight: 'bold', fontSize: 13, whiteSpace: 'nowrap'
              }}
            >آية</button>
          </div>

          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button onClick={goPrev} disabled={page <= 1} style={{ ...btnStyle, opacity: page <= 1 ? 0.4 : 1 }}>السابق →</button>
            <div style={{ fontSize: 12, color: C.muted }}>اسحب للتنقّل</div>
            <button onClick={goNext} disabled={page >= 604} style={{ ...btnStyle, opacity: page >= 604 ? 0.4 : 1 }}>← التالي</button>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
            اضغط على زر "آية" أو اضغط مطوّلاً على الصفحة لعرض التفسير
          </div>

          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onContextMenu={(e) => { e.preventDefault(); if (pagesMap && pagesMap[page]) setAyahPicker({ page }); }}
            style={{
              marginLeft: -15, marginRight: -15,
              overflow: 'hidden', borderRadius: 10,
              background: '#fff',
              boxShadow: '0 8px 28px rgba(15,107,95,0.18)',
              touchAction: 'pan-y',
              userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
              border: `1px solid ${C.border}`
            }}
          >
            <img
              key={page}
              src={`/quran/${pageStr}.png`}
              alt={`صفحة ${page} من القرآن الكريم`}
              draggable={false}
              style={{
                display: 'block', width: '100%', height: 'auto',
                minHeight: '60vh', maxHeight: '95vh', objectFit: 'contain',
                transform: `translateX(${dragX}px)`,
                transition: dragX === 0 ? 'transform 0.18s cubic-bezier(.2,.8,.2,1)' : 'none',
                animation: dragX === 0 ? `pageFlip${flipDir < 0 ? 'L' : 'R'} 0.18s cubic-bezier(.2,.8,.2,1)` : 'none',
                pointerEvents: 'none'
              }}
            />
          </div>

          <style>{`
            @keyframes pageFlipL { from { transform: translateX(28%); opacity: 0.5; } to { transform: translateX(0); opacity: 1; } }
            @keyframes pageFlipR { from { transform: translateX(-28%); opacity: 0.5; } to { transform: translateX(0); opacity: 1; } }
          `}</style>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>اذهب إلى صفحة:</span>
            <input
              type="number" min={1} max={604} value={page}
              onChange={e => {
                const v = parseInt(e.target.value || '1', 10);
                if (!Number.isNaN(v)) setPage(Math.max(1, Math.min(604, v)));
              }}
              style={{
                width: 80, padding: '6px 8px', textAlign: 'center',
                background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8
              }}
            />
          </div>
        </div>
      )}

      {view === 'tafsir' && <TafsirSection />}

      {ayahPicker && data && pagesMap && (
        <AyahTafsirModal
          page={ayahPicker.page}
          pagesMap={pagesMap}
          data={data}
          onClose={() => setAyahPicker(null)}
        />
      )}
    </div>
  );
};

// Computes the global ayah number (1..6236) from (surah, ayah) using surahs metadata
// Note: surahs.json uses `count` field (not `ayahs`); fall back for safety
const globalAyahNum = (surahs, surahN, ayahN) => {
  if (!surahs) return null;
  let total = 0;
  for (const s of surahs) {
    if (s.n === surahN) return total + ayahN;
    total += s.count || s.ayahs || s.numberOfAyahs || 0;
  }
  return null;
};

const AyahTafsirModal = ({ page, pagesMap, data, onClose }) => {
  const ayahs = pagesMap[page] || [];
  const [sel, setSel] = useState(ayahs[0] || null);

  const surah = sel && data.surahs.find(s => s.n === sel.s);
  const ayahText = sel && data.quran[sel.s] && data.quran[sel.s][sel.a];
  const tafsirText = sel && data.tafsir[sel.s] && data.tafsir[sel.s][sel.a];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, width: '100%', maxWidth: 720,
        maxHeight: '88vh', borderRadius: '16px 16px 0 0',
        border: `1px solid ${C.border}`, overflow: 'auto',
        animation: 'slideUp 0.25s ease-out'
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{
          position: 'sticky', top: 0, background: C.surface, padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2
        }}>
          <div style={{ color: C.accent, fontWeight: 'bold' }}>صفحة {page} — اختر آية</div>
          <button onClick={onClose} style={{
            background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', fontSize: 22
          }}>✕</button>
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {ayahs.map((it, i) => {
              const isSel = sel && sel.s === it.s && sel.a === it.a;
              const sn = data.surahs.find(s => s.n === it.s);
              return (
                <button key={i} onClick={() => setSel(it)} style={{
                  background: isSel ? C.accent : C.surfaceAlt,
                  color: isSel ? '#fff' : C.accent,
                  border: `1px solid ${isSel ? C.accent : C.border}`,
                  padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 'bold'
                }}>{(sn ? sn.name.replace('سُورَةُ ', '').replace('ٱ', 'ا') : it.s)} • {it.a}</button>
              );
            })}
          </div>

          {sel && (
            <>
              <div style={{
                background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 16, marginBottom: 12
              }}>
                <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, textAlign: 'center' }}>
                  {surah ? surah.name : ''} — الآية {sel.a}
                </div>
                <div style={{
                  fontSize: 24, lineHeight: 2.2, textAlign: 'center',
                  fontFamily: '"Amiri", "Scheherazade New", serif', color: C.text
                }}>
                  {ayahText || ''} <span style={{ color: C.accent }}>﴿{sel.a}﴾</span>
                </div>
              </div>

              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 16
              }}>
                <div style={{ fontSize: 12, color: C.accent, marginBottom: 8, fontWeight: 'bold' }}>
                  التفسير الميسّر
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.9, color: C.text }}>
                  {tafsirText || 'لا يتوفر تفسير لهذه الآية'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const stripArabic = (s) => (s || '')
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').toLowerCase();

const TafsirSection = () => {
  const [surahs, setSurahs] = useState(null);
  const [tafsir, setTafsir] = useState(null);
  const [quran, setQuran] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surahNum, setSurahNum] = useState(() => {
    const s = parseInt(localStorage.getItem('islam_tafsir_surah') || '1', 10);
    return Number.isNaN(s) ? 1 : s;
  });
  const [ayahNum, setAyahNum] = useState(() => {
    const a = parseInt(localStorage.getItem('islam_tafsir_ayah') || '1', 10);
    return Number.isNaN(a) ? 1 : a;
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/tafsir/surahs.json').then(r => r.json()),
      fetch('/tafsir/muyassar.json').then(r => r.json()),
      fetch('/tafsir/quran.json').then(r => r.json())
    ]).then(([s, t, q]) => {
      setSurahs(s); setTafsir(t); setQuran(q); setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const searchResults = useMemo(() => {
    const q = stripArabic(search.trim());
    if (!quran || !surahs || q.length < 2) return null;
    const results = [];
    for (const s of surahs) {
      const ayahs = quran[s.n];
      if (!ayahs) continue;
      for (let i = 1; i <= s.count; i++) {
        const text = ayahs[i];
        if (text && stripArabic(text).includes(q)) {
          results.push({ s: s.n, a: i, name: s.name, text });
          if (results.length >= 50) return results;
        }
      }
    }
    return results;
  }, [search, quran, surahs]);

  useEffect(() => {
    localStorage.setItem('islam_tafsir_surah', String(surahNum));
  }, [surahNum]);
  useEffect(() => {
    localStorage.setItem('islam_tafsir_ayah', String(ayahNum));
  }, [ayahNum]);

  const currentSurah = surahs && surahs.find(s => s.n === surahNum);
  const ayahCount = currentSurah ? currentSurah.count : 1;
  const safeAyah = Math.min(Math.max(1, ayahNum), ayahCount);
  const text = tafsir && tafsir[surahNum] && tafsir[surahNum][safeAyah];
  const ayahText = quran && quran[surahNum] && quran[surahNum][safeAyah];

  const toArabicDigits = (n) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  const goToAyah = (s, a) => {
    setSurahNum(s); setAyahNum(a); setSearch('');
  };

  const highlight = (text, query) => {
    if (!query) return text;
    const q = stripArabic(query);
    const stripped = stripArabic(text);
    const idx = stripped.indexOf(q);
    if (idx < 0) return text;
    // Map back to original by counting visible chars (approximate)
    let oi = 0, si = 0;
    while (si < idx && oi < text.length) {
      const c = text[oi];
      if (!/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(c)) si++;
      oi++;
    }
    let endO = oi, endS = si;
    while (endS < idx + q.length && endO < text.length) {
      const c = text[endO];
      if (!/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(c)) endS++;
      endO++;
    }
    return <>{text.slice(0, oi)}<mark style={{ background: C.accent, color: C.bg, padding: '0 2px', borderRadius: 3 }}>{text.slice(oi, endO)}</mark>{text.slice(endO)}</>;
  };

  const goPrev = () => {
    if (safeAyah > 1) setAyahNum(safeAyah - 1);
    else if (surahNum > 1) {
      const prev = surahs.find(s => s.n === surahNum - 1);
      setSurahNum(surahNum - 1);
      setAyahNum(prev ? prev.count : 1);
    }
  };
  const goNext = () => {
    if (safeAyah < ayahCount) setAyahNum(safeAyah + 1);
    else if (surahNum < 114) { setSurahNum(surahNum + 1); setAyahNum(1); }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', color: C.muted, padding: 30 }}>جاري تحميل التفسير...</div>;
  }
  if (error) {
    return <div style={{ textAlign: 'center', color: C.red, padding: 20 }}>تعذر تحميل التفسير: {error}</div>;
  }

  return (
    <div>
      {/* Search box */}
      <div style={{
        background: C.surface, padding: 12, borderRadius: 12,
        border: `1px solid ${C.border}`, marginBottom: 12,
        position: 'relative'
      }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ابحث عن آية... (مثل: الرحمن، يا أيها الذين آمنوا)"
          style={{
            width: '100%', padding: 12, background: C.bg, color: C.text,
            border: `1px solid ${search ? C.accent : C.border}`, borderRadius: 10,
            fontSize: 14, fontFamily: 'inherit', textAlign: 'right',
            boxSizing: 'border-box'
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', color: C.muted, border: 'none',
            cursor: 'pointer', fontSize: 18
          }}>✕</button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div style={{
          background: C.surface, padding: 12, borderRadius: 12,
          border: `1px solid ${C.border}`, marginBottom: 12
        }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
            {searchResults.length === 0 ? 'لا توجد نتائج' :
              `${toArabicDigits(searchResults.length)}${searchResults.length >= 50 ? '+' : ''} نتيجة`}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.map(r => (
              <button key={`${r.s}_${r.a}`} onClick={() => goToAyah(r.s, r.a)} style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 12, cursor: 'pointer', textAlign: 'right', color: C.text,
                fontFamily: 'inherit'
              }}>
                <div style={{ fontSize: 12, color: C.accent, marginBottom: 6, fontWeight: 'bold' }}>
                  {r.name} — الآية {toArabicDigits(r.a)}
                </div>
                <div style={{
                  fontSize: 15, lineHeight: 1.9, color: C.text,
                  fontFamily: 'Amiri, "Traditional Arabic", serif'
                }}>
                  {highlight(r.text, search)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Surah/Ayah picker */}
      <div style={{
        background: C.surface, padding: 14, borderRadius: 12,
        border: `1px solid ${C.border}`, marginBottom: 12
      }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>السورة</div>
        <select value={surahNum} onChange={e => { setSurahNum(parseInt(e.target.value, 10)); setAyahNum(1); }}
          style={{
            width: '100%', padding: 10, background: C.bg, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 15,
            fontFamily: 'inherit', marginBottom: 12, textAlignLast: 'right'
          }}>
          {surahs.map(s => (
            <option key={s.n} value={s.n}>{s.n}. {s.name} ({s.count} آيات)</option>
          ))}
        </select>

        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
          رقم الآية ({toArabicDigits(1)} — {toArabicDigits(ayahCount)})
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={goPrev} style={{
            background: C.bg, color: C.accent, border: `1px solid ${C.border}`,
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
          }}>‹ السابقة</button>
          <input type="number" min={1} max={ayahCount} value={safeAyah}
            onChange={e => {
              const v = parseInt(e.target.value || '1', 10);
              if (!Number.isNaN(v)) setAyahNum(Math.max(1, Math.min(ayahCount, v)));
            }}
            style={{
              flex: 1, padding: 10, textAlign: 'center', fontSize: 15,
              background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8
            }} />
          <button onClick={goNext} style={{
            background: C.bg, color: C.accent, border: `1px solid ${C.border}`,
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
          }}>التالية ›</button>
        </div>
      </div>

      {/* Ayah + Tafsir card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surface} 0%, rgba(196,164,89,0.05) 100%)`,
        padding: 18, borderRadius: 14, border: `1px solid ${C.accent}`
      }}>
        <div style={{
          textAlign: 'center', color: C.accentLight, fontSize: 16, fontWeight: 'bold',
          marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}`
        }}>
          {currentSurah && currentSurah.name} — الآية {toArabicDigits(safeAyah)}
        </div>

        {/* Ayah text */}
        <div style={{
          background: 'rgba(196,164,89,0.06)', padding: 16, borderRadius: 12,
          border: `1px solid ${C.border}`, marginBottom: 14
        }}>
          <div style={{
            color: C.accentLight, fontSize: 22, lineHeight: 2.2, textAlign: 'center',
            fontFamily: 'Amiri, "Traditional Arabic", "Scheherazade New", serif',
            fontWeight: 500
          }}>
            {ayahText || '—'}
            {ayahText && (
              <span style={{
                display: 'inline-block', margin: '0 6px', color: C.accent,
                fontSize: 18, verticalAlign: 'middle'
              }}>﴿{toArabicDigits(safeAyah)}﴾</span>
            )}
          </div>
        </div>

        {/* Tafsir */}
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6, fontWeight: 'bold' }}>
          📚 التفسير الميسّر
        </div>
        <div style={{
          color: C.text, fontSize: 16, lineHeight: 2, textAlign: 'right',
          fontFamily: 'Amiri, "Traditional Arabic", serif'
        }}>
          {text || 'لا يتوفر تفسير لهذه الآية'}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.muted, textAlign: 'center' }}>
          مجمع الملك فهد لطباعة المصحف الشريف
        </div>
      </div>
    </div>
  );
};


const SADAQAH_LIBRARY = [
  {
    id: 'mushaf',
    title: 'المصحف الشريف PDF',
    desc: 'انشر القرآن الكريم كاملاً، فبكل حرف يُقرأ منه لك أجر',
    icon: '📖',
    url: 'https://archive.org/download/quran-karim-pdf/quran-karim.pdf',
    text: 'تفضّل بقراءة وتحميل المصحف الشريف:\nhttps://archive.org/download/quran-karim-pdf/quran-karim.pdf\n\n«مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ»'
  },
  {
    id: 'hisn',
    title: 'حصن المسلم',
    desc: 'أذكار وأدعية من الكتاب والسنة. هدية لكل مسلم',
    icon: '🛡️',
    url: 'https://www.islamhouse.com/p/2186',
    text: 'كتاب حصن المسلم — أذكار يومك وليلتك:\nhttps://www.islamhouse.com/p/2186\n\nشاركه ليكن لك أجر كل من يقرؤه'
  },
  {
    id: 'riyad',
    title: 'رياض الصالحين',
    desc: 'مختارات من أحاديث سيد المرسلين ﷺ للإمام النووي',
    icon: '🌿',
    url: 'https://www.islamhouse.com/p/192347',
    text: 'كتاب رياض الصالحين للإمام النووي:\nhttps://www.islamhouse.com/p/192347'
  },
  {
    id: 'tafsir',
    title: 'تفسير السعدي الميسّر',
    desc: 'تفسير مبسّط واضح لكتاب الله، مناسب لكل مسلم',
    icon: '✨',
    url: 'https://www.islamhouse.com/p/192406',
    text: 'تفسير السعدي — تفسير ميسّر لكتاب الله:\nhttps://www.islamhouse.com/p/192406'
  },
  {
    id: 'seerah',
    title: 'الرحيق المختوم — السيرة النبوية',
    desc: 'سيرة النبي ﷺ بأسلوب رائع للشيخ صفي الرحمن المباركفوري',
    icon: '🕊️',
    url: 'https://www.islamhouse.com/p/334032',
    text: 'كتاب الرحيق المختوم في السيرة النبوية:\nhttps://www.islamhouse.com/p/334032'
  },
  {
    id: 'kalemat',
    title: 'كلمتان خفيفتان على اللسان',
    desc: '«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ» انشرها لتُغرس لك نخلة في الجنة',
    icon: '🌴',
    text: '«كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»\n\nرواه البخاري ومسلم'
  },
  {
    id: 'istighfar',
    title: 'سيد الاستغفار',
    desc: 'علِّمها لمن تحب، فمن قالها موقناً بها فمات من يومه دخل الجنة',
    icon: '💎',
    text: '«اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ»\n\nرواه البخاري'
  },
  {
    id: 'duaWalidayn',
    title: 'دعاء الوالدين',
    desc: 'بر والديك بالدعاء حياً وميتاً، فهو من أعظم الصدقات الجارية',
    icon: '🤲',
    text: '«رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا»\n«رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ»\n\nادعُ لوالديك الآن، وانشر الدعاء ليدعو معك غيرك'
  },
  {
    id: 'fajr',
    title: 'فضل صلاة الفجر',
    desc: 'ذكِّر إخوانك بصلاة الفجر، فمن صلاها فهو في ذمة الله',
    icon: '🌅',
    text: 'قال النبي ﷺ: «مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ»\nرواه مسلم\n\n«وَقُرْآنَ الْفَجْرِ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا»'
  },
  {
    id: 'kahf',
    title: 'سورة الكهف يوم الجمعة',
    desc: 'من قرأها أضاء له النور ما بين الجمعتين',
    icon: '💡',
    text: 'قال النبي ﷺ: «مَنْ قَرَأَ سُورَةَ الْكَهْفِ يَوْمَ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَهُ وَبَيْنَ الْجُمُعَتَيْنِ»\n\nرواه الحاكم وصححه'
  }
];

const REASONS = [
  { id: 'sick', label: 'مريض', color: '#ef4444', icon: '🌿' },
  { id: 'deceased', label: 'متوفى', color: '#94a3b8', icon: '🕊️' },
  { id: 'parents', label: 'والدين', color: '#22c55e', icon: '🤲' },
  { id: 'traveler', label: 'مسافر', color: '#3b82f6', icon: '✈️' },
  { id: 'distress', label: 'مكروب', color: '#f59e0b', icon: '💔' },
  { id: 'general', label: 'عام', color: '#a78bfa', icon: '✨' }
];

const SadaqahSection = () => {
  const [shareCounts, setShareCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('islam_shares') || '{}'); }
    catch { return {}; }
  });
  const [duaList, setDuaList] = useState([]);
  const [duasLoading, setDuasLoading] = useState(true);
  const [duasError, setDuasError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [duaCounts, setDuaCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('islam_dua_counts') || '{}'); }
    catch { return {}; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('general');
  const [newNote, setNewNote] = useState('');
  const [view, setView] = useState('library');

  useEffect(() => {
    localStorage.setItem('islam_shares', JSON.stringify(shareCounts));
  }, [shareCounts]);
  useEffect(() => {
    localStorage.setItem('islam_dua_counts', JSON.stringify(duaCounts));
  }, [duaCounts]);

  const loadDuas = async () => {
    setDuasLoading(true); setDuasError(null);
    try {
      const r = await fetch('/api/duas', { cache: 'no-store' });
      if (!r.ok) throw new Error('http_' + r.status);
      const j = await r.json();
      setDuaList(Array.isArray(j.duas) ? j.duas : []);
    } catch (e) {
      setDuasError('تعذّر تحميل قائمة الدعاء');
    } finally {
      setDuasLoading(false);
    }
  };
  useEffect(() => { loadDuas(); }, []);
  useEffect(() => {
    if (view !== 'duas') return;
    const t = setInterval(loadDuas, 30000);
    return () => clearInterval(t);
  }, [view]);

  const totalShares = Object.values(shareCounts).reduce((a, b) => a + b, 0);
  const totalDuas = Object.values(duaCounts).reduce((a, b) => a + b, 0);

  const shareItem = async (item) => {
    const text = item.text + (item.url ? '' : '');
    setShareCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text }); return; }
      catch (e) { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('تم نسخ النص، الصقه في تطبيق المحادثة لمشاركته');
    } catch (e) {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
  };

  const shareWhatsApp = (item) => {
    setShareCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    window.open('https://wa.me/?text=' + encodeURIComponent(item.text), '_blank');
  };

  const downloadItem = (item) => {
    if (!item.url) return;
    setShareCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    window.open(item.url, '_blank');
  };

  const addDua = async () => {
    const name = newName.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/duas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, reason: newReason, note: newNote.trim() })
      });
      if (r.status === 429) { alert('انتظر دقيقة قبل إضافة اسم آخر'); return; }
      if (!r.ok) throw new Error('http_' + r.status);
      setNewName(''); setNewNote(''); setNewReason('general');
      setShowAdd(false);
      await loadDuas();
    } catch (e) {
      alert('تعذّر حفظ الاسم، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  const incDua = (id) => {
    setDuaCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const shareDua = (person) => {
    const r = REASONS.find(x => x.id === person.reason) || REASONS[5];
    const text = `🤲 طلب دعاء\n\nأرجو من إخواني وأخواتي أن يدعوا لـ *${person.name}*\n${r.icon} ${r.label}${person.note ? '\n📝 ' + person.note : ''}\n\n«وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ»\n\nجزاكم الله خيراً`;
    if (navigator.share) {
      navigator.share({ title: 'طلب دعاء', text }).catch(() => {
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
      });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
  };

  return (
    <div style={{ color: C.text }}>
      {/* Branding banner — Sadaqah Jariyah for Ahmed Abdel Hafez */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
        color: '#fff', padding: '14px 16px', borderRadius: 14, marginBottom: 14,
        textAlign: 'center', boxShadow: C.shadowLg, border: `1px solid ${C.accentDark}`
      }}>
        <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, letterSpacing: 1 }}>هذا التطبيق</div>
        <div style={{ fontSize: 17, fontWeight: 'bold', fontFamily: '"Amiri", "Scheherazade New", serif', lineHeight: 1.6 }}>
          صَدَقَةٌ جَارِيَةٌ لِأَحْمَد عَبْد الْحَفِيظ
        </div>
        <div style={{ fontSize: 13, fontWeight: 'bold', opacity: 0.95, marginTop: 6, fontFamily: '"Amiri", "Scheherazade New", serif' }}>
          ولكلّ أمواتِ المسلمين
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
          اللهم اغفر لهم وارحمهم وأسكنهم فسيح جناتك — اللهم تقبّل
        </div>
      </div>

      {/* Header stats */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surface} 0%, rgba(196,164,89,0.08) 100%)`,
        padding: 18, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 14,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>صدقتك الجارية</div>
        <div style={{ color: C.accentLight, fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
          «إِذَا مَاتَ ابْنُ آدَمَ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ: صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ»
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: C.bg, padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: C.accent }}>{totalShares}</div>
            <div style={{ fontSize: 11, color: C.muted }}>مرة نشرت فيها الخير</div>
          </div>
          <div style={{ background: C.bg, padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: C.accent }}>{totalDuas}</div>
            <div style={{ fontSize: 11, color: C.muted }}>دعوة لإخوانك</div>
          </div>
        </div>
      </div>

      {/* View switch */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: C.surface, padding: 4, borderRadius: 12, border: `1px solid ${C.border}` }}>
        {[
          { id: 'library', label: '📚 انشر الخير' },
          { id: 'duas', label: '🤲 قائمة الدعاء' }
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: view === v.id ? C.accent : 'transparent',
            color: view === v.id ? C.bg : C.muted,
            fontWeight: 'bold', fontSize: 14
          }}>{v.label}</button>
        ))}
      </div>

      {view === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SADAQAH_LIBRARY.map(item => {
            const cnt = shareCounts[item.id] || 0;
            return (
              <div key={item.id} style={{
                background: C.surface, padding: 16, borderRadius: 14,
                border: `1px solid ${cnt > 0 ? C.accent : C.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 36 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: C.accentLight, marginBottom: 4 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                  {cnt > 0 && (
                    <div style={{
                      background: C.accent, color: C.bg, padding: '4px 10px',
                      borderRadius: 12, fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap'
                    }}>×{cnt}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => shareItem(item)} style={{
                    flex: 1, minWidth: 110, background: C.accent, color: C.bg, border: 'none',
                    padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14
                  }}>↗ مشاركة</button>
                  <button onClick={() => shareWhatsApp(item)} style={{
                    flex: 1, minWidth: 110, background: '#25D366', color: '#fff', border: 'none',
                    padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14
                  }}>واتساب</button>
                  {item.url && (
                    <button onClick={() => downloadItem(item)} style={{
                      flex: 1, minWidth: 110, background: C.bg, color: C.accent,
                      border: `1px solid ${C.accent}`, padding: '10px', borderRadius: 10,
                      cursor: 'pointer', fontWeight: 'bold', fontSize: 14
                    }}>↓ تحميل</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'duas' && (
        <div>
          <button onClick={() => setShowAdd(s => !s)} style={{
            width: '100%', padding: 14, background: C.accent, color: C.bg,
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 15, fontWeight: 'bold', marginBottom: 12
          }}>
            {showAdd ? '✕ إلغاء' : '+ إضافة اسم لقائمة الدعاء'}
          </button>

          {showAdd && (
            <div style={{
              background: C.surface, padding: 16, borderRadius: 14,
              border: `1px solid ${C.accent}`, marginBottom: 14
            }}>
              <input
                type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="الاسم"
                style={{
                  width: '100%', padding: 12, background: C.bg, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15,
                  marginBottom: 10, boxSizing: 'border-box', textAlign: 'right',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6, marginBottom: 10
              }}>
                {REASONS.map(r => (
                  <button key={r.id} onClick={() => setNewReason(r.id)} style={{
                    padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    background: newReason === r.id ? r.color : C.bg,
                    color: newReason === r.id ? '#fff' : C.muted,
                    border: `1px solid ${newReason === r.id ? r.color : C.border}`,
                    fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit'
                  }}>{r.icon} {r.label}</button>
                ))}
              </div>
              <textarea
                value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="ملاحظة (اختياري) — مثل: شفاء، رحمة، توفيق..."
                rows={2}
                style={{
                  width: '100%', padding: 12, background: C.bg, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14,
                  marginBottom: 10, boxSizing: 'border-box', textAlign: 'right',
                  resize: 'vertical', fontFamily: 'inherit'
                }}
              />
              <button onClick={addDua} disabled={submitting || !newName.trim()} style={{
                width: '100%', padding: 12, background: C.accent, color: C.bg,
                border: 'none', borderRadius: 10,
                cursor: submitting ? 'wait' : 'pointer',
                opacity: (submitting || !newName.trim()) ? 0.5 : 1,
                fontSize: 14, fontWeight: 'bold'
              }}>{submitting ? '... جاري الحفظ' : 'حفظ ومشاركة مع الجميع'}</button>
            </div>
          )}

          <div style={{
            background: 'rgba(196,164,89,0.06)', border: `1px solid ${C.border}`,
            padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 12,
            color: C.muted, lineHeight: 1.7, textAlign: 'center'
          }}>
            هذه قائمة مشتركة — كل اسم تضيفه يظهر لجميع المستخدمين، فيدعو لهم إخوانك في كل مكان
          </div>

          {duasLoading ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: 30 }}>... جاري التحميل</div>
          ) : duasError ? (
            <div style={{ textAlign: 'center', color: C.red, padding: 20 }}>
              {duasError}
              <button onClick={loadDuas} style={{
                display: 'block', margin: '12px auto 0', background: C.accent,
                color: C.bg, border: 'none', padding: '8px 16px', borderRadius: 8,
                cursor: 'pointer', fontWeight: 'bold'
              }}>إعادة المحاولة</button>
            </div>
          ) : duaList.length === 0 ? (
            <div style={{
              background: C.surface, padding: 30, borderRadius: 14,
              border: `1px dashed ${C.border}`, textAlign: 'center', color: C.muted
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🤲</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                لا توجد أسماء بعد<br />
                كن أول من يضيف اسم من يحب
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {duaList.map(p => {
                const r = REASONS.find(x => x.id === p.reason) || REASONS[5];
                const myCount = duaCounts[p.id] || 0;
                return (
                  <div key={p.id} style={{
                    background: C.surface, padding: 14, borderRadius: 14,
                    border: `1px solid ${myCount > 0 ? C.accent : C.border}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: C.text, marginBottom: 4 }}>
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            background: r.color + '22', color: r.color,
                            padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 'bold'
                          }}>{r.icon} {r.label}</span>
                          {p.note && <span style={{ fontSize: 12, color: C.muted }}>{p.note}</span>}
                        </div>
                      </div>
                      <div style={{
                        background: C.bg, color: C.accent, padding: '6px 12px',
                        borderRadius: 12, fontSize: 13, fontWeight: 'bold',
                        border: `1px solid ${C.border}`, minWidth: 50, textAlign: 'center'
                      }}>{myCount}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => incDua(p.id)} style={{
                        flex: 2, background: C.accent, color: C.bg, border: 'none',
                        padding: '10px', borderRadius: 10, cursor: 'pointer',
                        fontWeight: 'bold', fontSize: 14
                      }}>🤲 دعوت له</button>
                      <button onClick={() => shareDua(p)} style={{
                        flex: 1, background: '#25D366', color: '#fff', border: 'none',
                        padding: '10px', borderRadius: 10, cursor: 'pointer',
                        fontWeight: 'bold', fontSize: 14
                      }}>↗</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color, valueRef }) => (
  <div style={{ background: C.bg, padding: 10, borderRadius: 10, border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
    <div ref={valueRef} style={{ fontSize: 16, fontWeight: 'bold', color: color || C.text }}>{value}</div>
  </div>
);

const DhikrCard = ({ item }) => {
  const [count, setCount] = useState(0);
  const target = item.c || 1;
  const done = count >= target;
  return (
    <div style={{
      background: C.surface, padding: 18, borderRadius: 14,
      border: `1px solid ${done ? C.accent : C.border}`,
      transition: 'border-color .2s'
    }}>
      <p style={{ fontSize: 17, lineHeight: 1.9, marginTop: 0, marginBottom: 12, color: C.text }}>{item.t}</p>
      {item.r && <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{item.r}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ color: C.accent, fontSize: 13 }}>
          {count} / {target}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setCount(0)} style={{ ...btnStyle, padding: '4px 10px', fontSize: 12 }}>تصفير</button>
          <button
            onClick={() => setCount(c => Math.min(target, c + 1))}
            style={{
              background: done ? C.accent : C.surface,
              color: done ? '#fff' : C.accent,
              border: `1px solid ${C.accent}`,
              padding: '6px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
            }}
          >+1</button>
        </div>
      </div>
    </div>
  );
};

const AdhkarHub = () => {
  const [sub, setSub] = useState(() => {
    try {
      const h = (window.location.hash || '').split('/');
      if (h[1] === 'sunnah') return 'sunnah';
      if (h[1] === 'adhkar') return 'adhkar';
    } catch {}
    return localStorage.getItem('islam_adhkar_sub') || 'adhkar';
  });
  useEffect(() => { try { localStorage.setItem('islam_adhkar_sub', sub); } catch {} }, [sub]);
  return (
    <div>
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14, background: C.surfaceAlt,
        padding: 5, borderRadius: 14, border: `1px solid ${C.border}`
      }}>
        {[
          { id: 'adhkar', label: 'الأذكار والأدعية' },
          { id: 'sunnah', label: 'السنة النبوية' }
        ].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: sub === t.id ? C.accent : 'transparent',
            color: sub === t.id ? '#fff' : C.muted,
            fontWeight: 'bold', fontSize: 13,
            boxShadow: sub === t.id ? '0 2px 8px rgba(15,107,95,0.25)' : 'none',
            transition: 'all 0.18s ease'
          }}>{t.label}</button>
        ))}
      </div>
      {sub === 'adhkar' ? <AdhkarSection /> : <SunnahSection />}
    </div>
  );
};

const SUNNAH_BOOKS = [
  { id: 'bukhari', file: '/sunnah/bukhari.json', title: 'صحيح البخاري', author: 'الإمام محمد بن إسماعيل البخاري', hasSections: true,
    sectionNames: {
      1:'بدء الوحي',2:'الإيمان',3:'العلم',4:'الوضوء',5:'الغسل',6:'الحيض',7:'التيمم',8:'الصلاة',
      9:'مواقيت الصلاة',10:'الأذان',11:'الجمعة',12:'صلاة الخوف',13:'العيدين',14:'الوتر',15:'الاستسقاء',
      16:'الكسوف',17:'سجود القرآن',18:'تقصير الصلاة',19:'التهجد',20:'فضل الصلاة في مسجد مكة والمدينة',
      21:'العمل في الصلاة',22:'السهو',23:'الجنائز',24:'الزكاة',25:'الحج',26:'العمرة',27:'المحصر',
      28:'جزاء الصيد',29:'فضائل المدينة',30:'الصوم',31:'صلاة التراويح',32:'فضل ليلة القدر',33:'الاعتكاف',
      34:'البيوع',35:'السلم',36:'الشفعة',37:'الإجارة',38:'الحوالات',39:'الكفالة',40:'الوكالة',
      41:'المزارعة',42:'المساقاة',43:'الاستقراض',44:'الخصومات',45:'اللقطة',46:'المظالم',47:'الشركة',
      48:'الرهن',49:'العتق',50:'المكاتب',51:'الهبة وفضلها',52:'الشهادات',53:'الصلح',54:'الشروط',
      55:'الوصايا',56:'الجهاد والسير',57:'فرض الخمس',58:'الجزية والموادعة',59:'بدء الخلق',60:'أحاديث الأنبياء',
      61:'المناقب',62:'فضائل الصحابة',63:'مناقب الأنصار',64:'المغازي',65:'تفسير القرآن',66:'فضائل القرآن',
      67:'النكاح',68:'الطلاق',69:'النفقات',70:'الأطعمة',71:'العقيقة',72:'الذبائح والصيد',73:'الأضاحي',
      74:'الأشربة',75:'المرضى',76:'الطب',77:'اللباس',78:'الأدب',79:'الاستئذان',80:'الدعوات',
      81:'الرقاق',82:'القدر',83:'الأيمان والنذور',84:'كفارات الأيمان',85:'الفرائض',86:'الحدود',
      87:'الديات',88:'استتابة المرتدين',89:'الإكراه',90:'الحيل',91:'التعبير',92:'الفتن',93:'الأحكام',
      94:'التمني',95:'أخبار الآحاد',96:'الاعتصام بالكتاب والسنة',97:'التوحيد'
    } },
  { id: 'muslim', file: '/sunnah/muslim.json', title: 'صحيح مسلم', author: 'الإمام مسلم بن الحجاج', hasSections: true,
    sectionNames: {
      1:'الإيمان',2:'الطهارة',3:'الحيض',4:'الصلاة',5:'المساجد ومواضع الصلاة',6:'صلاة المسافرين وقصرها',
      7:'الجمعة',8:'صلاة العيدين',9:'صلاة الاستسقاء',10:'الكسوف',11:'الجنائز',12:'الزكاة',13:'الصيام',
      14:'الاعتكاف',15:'الحج',16:'النكاح',17:'الرضاع',18:'الطلاق',19:'اللعان',20:'العتق',
      21:'البيوع',22:'المساقاة',23:'الفرائض',24:'الهبات',25:'الوصية',26:'النذر',27:'الأيمان',
      28:'القسامة والمحاربين والقصاص والديات',29:'الحدود',30:'الأقضية',31:'اللقطة',32:'الجهاد والسير',
      33:'الإمارة',34:'الصيد والذبائح',35:'الأضاحي',36:'الأشربة',37:'اللباس والزينة',38:'الآداب',
      39:'السلام',40:'ألفاظ من الأدب وغيرها',41:'الشعر',42:'الرؤيا',43:'الفضائل',44:'فضائل الصحابة',
      45:'البر والصلة والآداب',46:'القدر',47:'العلم',48:'الذكر والدعاء والتوبة والاستغفار',49:'التوبة',
      50:'صفات المنافقين وأحكامهم',51:'صفة القيامة والجنة والنار',52:'الجنة وصفة نعيمها وأهلها',
      53:'الفتن وأشراط الساعة',54:'الزهد والرقائق',55:'التفسير',56:'فضائل القرآن وما يتعلق به',57:'مقدمة'
    } },
  { id: 'nawawi', file: '/sunnah/nawawi.json', title: 'الأربعون النوويّة', author: 'الإمام يحيى بن شرف النووي', hasSections: false },
  { id: 'qudsi',  file: '/sunnah/qudsi.json',  title: 'الأربعون القدسيّة', author: 'أربعون حديثاً قدسياً', hasSections: false }
];

const SunnahSection = () => {
  const [bookId, setBookId] = useState(() => localStorage.getItem('islam_sunnah_book') || 'bukhari');
  const [book, setBook] = useState(null);
  const [section, setSection] = useState(null);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const cache = useRef({});

  const meta = SUNNAH_BOOKS.find(b => b.id === bookId) || SUNNAH_BOOKS[0];

  useEffect(() => { try { localStorage.setItem('islam_sunnah_book', bookId); } catch {} }, [bookId]);

  useEffect(() => {
    if (cache.current[bookId]) {
      setBook(cache.current[bookId]);
      setError(''); setProgress(100);
      return;
    }
    let cancel = false;
    setBook(null); setError(''); setProgress(0); setSection(null); setQuery('');
    (async () => {
      try {
        const res = await fetch(meta.file);
        if (!res.ok) throw new Error('failed');
        const total = parseInt(res.headers.get('content-length') || '0', 10);
        if (total && res.body) {
          const reader = res.body.getReader();
          const chunks = [];
          let received = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (!cancel) setProgress(Math.round((received / total) * 100));
          }
          const blob = new Blob(chunks);
          const txt = await blob.text();
          const j = JSON.parse(txt);
          cache.current[bookId] = j;
          if (!cancel) setBook(j);
        } else {
          const j = await res.json();
          cache.current[bookId] = j;
          if (!cancel) setBook(j);
        }
      } catch (e) {
        if (!cancel) setError('تعذّر تحميل ' + meta.title);
      }
    })();
    return () => { cancel = true; };
  }, [bookId]);

  const stripA = (s) => (s || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

  const sectionNames = useMemo(() => {
    if (!book || !meta.hasSections) return null;
    const out = [];
    const sections = book.metadata?.sections || {};
    for (const k of Object.keys(sections)) {
      const id = parseInt(k, 10);
      if (!id) continue;
      out.push({ id, name: meta.sectionNames[id] || sections[k] || `كتاب ${id}` });
    }
    return out.sort((a, b) => a.id - b.id);
  }, [book, meta]);

  const sectionHadiths = useMemo(() => {
    if (!book || section == null) return [];
    return book.hadiths.filter(h => h.reference?.book === section);
  }, [book, section]);

  const searchResults = useMemo(() => {
    if (!book || !query.trim() || query.trim().length < 2) return null;
    const q = stripA(query);
    const out = [];
    for (const h of book.hadiths) {
      if (stripA(h.text).includes(q)) {
        out.push(h);
        if (out.length >= 50) break;
      }
    }
    return out;
  }, [book, query]);

  const BookSwitcher = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
      {SUNNAH_BOOKS.map(b => (
        <button key={b.id} onClick={() => { setBookId(b.id); setSection(null); setQuery(''); }} style={{
          background: bookId === b.id ? C.accent : C.surface,
          color: bookId === b.id ? '#fff' : C.text,
          border: `1px solid ${bookId === b.id ? C.accent : C.border}`,
          padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 'bold', fontSize: 12, fontFamily: 'inherit',
          boxShadow: bookId === b.id ? '0 2px 8px rgba(15,107,95,0.25)' : C.shadow
        }}>{b.title}</button>
      ))}
    </div>
  );

  if (error) {
    return (
      <div>
        {BookSwitcher}
        <div style={{ color: C.red, textAlign: 'center', padding: 30 }}>{error}</div>
      </div>
    );
  }
  if (!book) {
    return (
      <div>
        {BookSwitcher}
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
          <div style={{ marginBottom: 12, fontSize: 15 }}>جاري تحميل {meta.title}...</div>
          <div style={{
            width: '100%', maxWidth: 280, height: 8, margin: '0 auto',
            background: C.surfaceAlt, borderRadius: 4, overflow: 'hidden',
            border: `1px solid ${C.border}`
          }}>
            <div style={{
              width: `${progress}%`, height: '100%', background: C.accent,
              transition: 'width 0.2s ease'
            }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>{progress}%</div>
          <div style={{ marginTop: 14, fontSize: 11, color: C.sub }}>
            يحفظ في الذاكرة بعد التحميل ولن يعاد تحميله
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {BookSwitcher}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 12, marginBottom: 12,
        textAlign: 'center', boxShadow: C.shadow
      }}>
        <div style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>{meta.title}</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
          {meta.author} • {book.hadiths.length} حديث{meta.hasSections && sectionNames ? ` في ${sectionNames.length} كتاب` : ''}
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`ابحث في أحاديث ${meta.title}...`}
          style={{
            width: '100%', padding: '12px 36px 12px 12px', boxSizing: 'border-box',
            background: C.surface, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 12,
            fontSize: 14, fontFamily: 'inherit', boxShadow: C.shadow
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', fontSize: 18
          }}>✕</button>
        )}
      </div>

      {searchResults ? (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
            {searchResults.length === 0 ? 'لا توجد نتائج' : `${searchResults.length}${searchResults.length >= 50 ? '+' : ''} نتيجة`}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {searchResults.map((h, i) => (
              <HadithCard key={i} h={h} sectionNames={sectionNames} onOpenBook={meta.hasSections ? (b) => { setQuery(''); setSection(b); } : undefined} />
            ))}
          </div>
        </div>
      ) : !meta.hasSections ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {book.hadiths.map((h, i) => (
            <HadithCard key={i} h={h} sectionNames={null} hideBookLink />
          ))}
        </div>
      ) : section ? (
        <div>
          <button onClick={() => setSection(null)} style={{
            background: C.surface, color: C.accent, border: `1px solid ${C.border}`,
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 12,
            fontWeight: 'bold', fontSize: 13, fontFamily: 'inherit', boxShadow: C.shadow
          }}>→ عودة لقائمة الكتب</button>
          <div style={{
            color: C.text, fontWeight: 'bold', fontSize: 16, marginBottom: 10,
            paddingBottom: 8, borderBottom: `2px solid ${C.accent}`
          }}>
            كتاب {sectionNames.find(s => s.id === section)?.name || section}
            <span style={{ color: C.muted, fontSize: 12, fontWeight: 'normal', marginRight: 8 }}>
              ({sectionHadiths.length} حديث)
            </span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {sectionHadiths.map((h, i) => (
              <HadithCard key={i} h={h} sectionNames={sectionNames} hideBookLink />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {sectionNames.map(s => {
            const count = book.hadiths.filter(h => h.reference?.book === s.id).length;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10,
                color: C.text, fontFamily: 'inherit', boxShadow: C.shadow
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: C.surfaceAlt, color: C.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: 12, flexShrink: 0,
                  border: `1px solid ${C.border}`
                }}>{s.id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 'bold',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {count} حديث
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const HadithCard = ({ h, sectionNames, hideBookLink, onOpenBook }) => {
  const bookId = h.reference?.book;
  const bookName = bookId && sectionNames ? sectionNames.find(s => s.id === bookId)?.name : null;
  return (
    <div style={{
      background: C.surface, padding: 14, borderRadius: 12,
      border: `1px solid ${C.border}`, boxShadow: C.shadow
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10, gap: 8
      }}>
        <div style={{
          background: C.surfaceAlt, color: C.accent,
          padding: '4px 10px', borderRadius: 8,
          fontSize: 11, fontWeight: 'bold', border: `1px solid ${C.border}`
        }}>حديث رقم {h.hadithnumber}</div>
        {bookName && !hideBookLink && (
          <button
            onClick={() => onOpenBook && onOpenBook(bookId)}
            style={{
              background: 'transparent', color: C.muted, border: 'none',
              cursor: 'pointer', fontSize: 11, fontFamily: 'inherit'
            }}
          >كتاب {bookName} ←</button>
        )}
      </div>
      <div style={{
        fontSize: 16, lineHeight: 2.0, color: C.text,
        fontFamily: '"Amiri", "Scheherazade", serif'
      }}>{h.text}</div>
    </div>
  );
};

const AdhkarSection = () => {
  const [groups, setGroups] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancel = false;
    fetch('/adhkar/all.json')
      .then(r => r.json())
      .then(d => {
        if (cancel) return;
        setGroups(d);
        const saved = (() => { try { return localStorage.getItem('islam_adhkar_cat'); } catch { return null; } })();
        setActiveCat(d.find(g => g.id === saved) ? saved : d[0].id);
      })
      .catch(() => setLoadError('تعذر تحميل الأذكار'));
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (activeCat) { try { localStorage.setItem('islam_adhkar_cat', activeCat); } catch {} }
  }, [activeCat]);

  const stripA = (s) => (s || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[«»“”"'()﴿﴾\[\].,;:!?\s]/g, '');

  const searchResults = useMemo(() => {
    if (!groups || !query.trim() || query.trim().length < 2) return null;
    const q = stripA(query);
    const out = [];
    for (const g of groups) {
      for (let i = 0; i < g.items.length; i++) {
        if (stripA(g.items[i].a).includes(q)) {
          out.push({ groupId: g.id, groupName: g.name, idx: i, item: g.items[i] });
          if (out.length >= 80) return out;
        }
      }
    }
    return out;
  }, [groups, query]);

  if (loadError) return <div style={{ color: C.red, textAlign: 'center', padding: 20 }}>{loadError}</div>;
  if (!groups || !activeCat) return <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>جاري التحميل...</div>;

  const cat = groups.find(g => g.id === activeCat) || groups[0];
  const totalCount = groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`ابحث في ${totalCount} ذكر ودعاء...`}
          style={{
            width: '100%', padding: '10px 36px 10px 12px',
            background: C.surface, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 10,
            fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', fontSize: 18
          }}>✕</button>
        )}
      </div>

      {searchResults ? (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
            {searchResults.length === 0 ? 'لا توجد نتائج' : `${searchResults.length} نتيجة`}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {searchResults.map((r, i) => (
              <div key={i} onClick={() => { setQuery(''); setActiveCat(r.groupId); }}
                style={{
                  background: C.surface, padding: 14, borderRadius: 12,
                  border: `1px solid ${C.border}`, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 11, color: C.accent, marginBottom: 6 }}>{r.groupName}</div>
                <div style={{ fontSize: 15, lineHeight: 1.8, color: C.text }}>{r.item.a}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 12,
            scrollbarWidth: 'thin'
          }}>
            {groups.map(g => (
              <button key={g.id} onClick={() => setActiveCat(g.id)} style={{
                flexShrink: 0,
                background: activeCat === g.id ? C.accent : C.surface,
                color: activeCat === g.id ? C.bg : C.accentLight,
                border: `1px solid ${C.border}`,
                padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap'
              }}>{g.icon ? g.icon + ' ' : ''}{g.name} ({g.items.length})</button>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
            {cat.items.length} ذكر — إجمالي المكتبة {totalCount}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {cat.items.map((item, i) => (
              <DhikrCard key={`${activeCat}-${i}`} item={{ t: item.a, c: item.c }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ───────────────────────── SettingsPanel ─────────────────────────
const SettingsPanel = ({ settings, setSettings, onClose }) => {
  const update = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, width: '100%', maxWidth: 720,
        maxHeight: '90vh', borderRadius: '18px 18px 0 0',
        border: `1px solid ${C.border}`, overflow: 'auto',
        animation: 'slideUp 0.25s ease-out'
      }}>
        <div style={{
          position: 'sticky', top: 0, background: C.surface, padding: '16px',
          borderBottom: `1px solid ${C.border}`, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', zIndex: 2
        }}>
          <div style={{ color: C.accent, fontWeight: 'bold', fontSize: 18 }}>الإعدادات</div>
          <button onClick={onClose} style={{
            background: 'transparent', color: C.muted, border: 'none', cursor: 'pointer', fontSize: 22
          }}>✕</button>
        </div>

        <div style={{ padding: 16, display: 'grid', gap: 18 }}>
          {/* Theme */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>المظهر</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'light', label: 'فاتح', preview: { bg: '#f5f1ea', fg: '#0f6b5f' } },
                { id: 'dark',  label: 'داكن',  preview: { bg: '#0c1419', fg: '#3aae9d' } }
              ].map(t => (
                <button key={t.id} onClick={() => update('theme', t.id)} style={{
                  background: t.preview.bg, color: t.preview.fg,
                  border: `2px solid ${settings.theme === t.id ? C.accent : C.border}`,
                  padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 14, fontFamily: 'inherit',
                  boxShadow: settings.theme === t.id ? '0 4px 14px rgba(15,107,95,0.25)' : 'none'
                }}>{t.label}{settings.theme === t.id ? ' ✓' : ''}</button>
              ))}
            </div>
          </div>

          {/* Font family */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>الخط</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {FONT_FAMILIES.map(f => (
                <button key={f.id} onClick={() => update('fontId', f.id)} style={{
                  background: settings.fontId === f.id ? C.accent : C.surfaceAlt,
                  color: settings.fontId === f.id ? '#fff' : C.text,
                  border: `1px solid ${settings.fontId === f.id ? C.accent : C.border}`,
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: f.stack, fontSize: 15, fontWeight: 'bold',
                  textAlign: 'right'
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>حجم الخط</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FONT_SIZES.map(s => (
                <button key={s.id} onClick={() => update('sizeId', s.id)} style={{
                  background: settings.sizeId === s.id ? C.accent : C.surfaceAlt,
                  color: settings.sizeId === s.id ? '#fff' : C.text,
                  border: `1px solid ${settings.sizeId === s.id ? C.accent : C.border}`,
                  padding: `${4 + s.px / 2}px 6px`, borderRadius: 10, cursor: 'pointer',
                  fontSize: s.px - 2, fontWeight: 'bold', fontFamily: 'inherit'
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Prayer calculation method */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 6, fontSize: 14 }}>طريقة حساب مواقيت الصلاة</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.6 }}>
              اختر "تلقائي حسب البلد" أو حدّد الهيئة يدويّاً للحصول على أدقّ مواقيت
            </div>
            <select value={settings.prayerMethod} onChange={e => update('prayerMethod', e.target.value)} style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
              fontFamily: 'inherit', fontSize: 14
            }}>
              <option value="auto">تلقائي حسب البلد (موصى به)</option>
              <option value="Egyptian">الهيئة المصرية العامة للمساحة (مصر)</option>
              <option value="UmmAlQura">أم القرى (السعودية)</option>
              <option value="Dubai">الإمارات</option>
              <option value="Qatar">قطر</option>
              <option value="Kuwait">الكويت</option>
              <option value="Karachi">الجامعة الإسلامية بكراتشي (باكستان والهند)</option>
              <option value="NorthAmerica">إسنا (أمريكا الشمالية)</option>
              <option value="MWL">رابطة العالم الإسلامي</option>
              <option value="Singapore">سنغافورة</option>
              <option value="Tehran">طهران</option>
              <option value="Turkey">تركيا (الديانة)</option>
              <option value="MoonsightingCommittee">لجنة رؤية الهلال</option>
            </select>
          </div>

          {/* Madhab — affects Asr time */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 6, fontSize: 14 }}>المذهب الفقهي (لوقت العصر)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'shafii', label: 'الشافعي/المالكي/الحنبلي' },
                { id: 'hanafi', label: 'الحنفي' }
              ].map(m => (
                <button key={m.id} onClick={() => update('madhab', m.id)} style={{
                  background: settings.madhab === m.id ? C.accent : C.surfaceAlt,
                  color: settings.madhab === m.id ? '#fff' : C.text,
                  border: `1px solid ${settings.madhab === m.id ? C.accent : C.border}`,
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 'bold'
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {/* Daily Quran reminder */}
          <div>
            <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 6, fontSize: 14 }}>تذكير يومي بقراءة الورد</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.6 }}>
              يوصلك إشعار كل يوم في الوقت اللي تختاره عشان تفكّرك بوردك من القرآن
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <button onClick={async () => {
                if (settings.quranReminderEnabled) { update('quranReminderEnabled', false); return; }
                if (!('Notification' in window)) { alert('الإشعارات غير مدعومة في هذا المتصفح'); return; }
                let perm = Notification.permission;
                if (perm === 'default') perm = await Notification.requestPermission();
                if (perm === 'granted') update('quranReminderEnabled', true);
                else alert('يرجى السماح بالإشعارات من إعدادات المتصفح');
              }} style={{
                width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
                background: settings.quranReminderEnabled ? '#22c55e' : C.border,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: 3,
                  [settings.quranReminderEnabled ? 'left' : 'right']: 3,
                  width: 24, height: 24, borderRadius: '50%', background: '#fff'
                }} />
              </button>
              <input
                type="time"
                value={settings.quranReminderTime}
                onChange={e => update('quranReminderTime', e.target.value)}
                disabled={!settings.quranReminderEnabled}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
                  fontFamily: 'inherit', fontSize: 14, opacity: settings.quranReminderEnabled ? 1 : 0.5
                }}
              />
            </div>
          </div>

          <div style={{
            background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 12, fontSize: 12, color: C.muted, lineHeight: 1.7
          }}>
            تُحفظ إعداداتك تلقائياً في هذا المتصفح. للحصول على إشعارات الأذان والورد اليومي حتى لو الشاشة مقفولة، افتح القائمة في المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق".
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── TasbihSection ─────────────────────────
const TASBIH_PRESETS = [
  { id: 'subh',     text: 'سُبْحَانَ اللهِ',                          target: 33  },
  { id: 'hamd',     text: 'الْحَمْدُ لِلَّهِ',                         target: 33  },
  { id: 'akbar',    text: 'اللهُ أَكْبَرُ',                           target: 34  },
  { id: 'tahlil',   text: 'لَا إِلَهَ إِلَّا اللهُ',                   target: 100 },
  { id: 'hawqala',  text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', target: 100 },
  { id: 'istighfar',text: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',     target: 100 },
  { id: 'salat',    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', target: 100 },
  { id: 'subh_bihamd', text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',            target: 100 },
  { id: 'subh_azim',   text: 'سُبْحَانَ اللهِ الْعَظِيمِ',              target: 100 },
  { id: 'unique',   text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ', target: 10 },
  { id: 'hasbi',    text: 'حَسْبِيَ اللهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', target: 7 }
];

const TasbihSection = () => {
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('islam_tasbih_v2') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return TASBIH_PRESETS.map(p => ({ ...p, count: 0, total: 0 }));
  });
  const [activeId, setActiveId] = useState(() => localStorage.getItem('islam_tasbih_active') || 'subh');
  const [vibrate, setVibrate] = useState(() => localStorage.getItem('islam_tasbih_vib') !== '0');

  // Global istighfar counter (shared across all users)
  const [globalIst, setGlobalIst] = useState(null);
  const [istLocal, setIstLocal] = useState(() => parseInt(localStorage.getItem('islam_ist_mine') || '0', 10) || 0);
  const istPendingRef = useRef(0);
  const istSendTimerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/istighfar').then(r => r.json()).then(d => { if (alive && typeof d.total === 'number') setGlobalIst(d.total); }).catch(() => {});
    const id = setInterval(() => {
      fetch('/api/istighfar').then(r => r.json()).then(d => { if (alive && typeof d.total === 'number') setGlobalIst(d.total); }).catch(() => {});
    }, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  useEffect(() => { try { localStorage.setItem('islam_ist_mine', String(istLocal)); } catch {} }, [istLocal]);

  const tapIstighfar = () => {
    setIstLocal(v => v + 1);
    setGlobalIst(v => (v == null ? null : v + 1));
    istPendingRef.current += 1;
    if (vibrate && navigator.vibrate) { try { navigator.vibrate(15); } catch {} }
    if (istSendTimerRef.current) clearTimeout(istSendTimerRef.current);
    istSendTimerRef.current = setTimeout(async () => {
      const inc = Math.min(50, istPendingRef.current);
      if (inc <= 0) return;
      istPendingRef.current -= inc;
      try {
        const r = await fetch('/api/istighfar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inc })
        });
        const d = await r.json();
        if (typeof d.total === 'number') setGlobalIst(d.total);
      } catch {}
    }, 800);
  };

  useEffect(() => { try { localStorage.setItem('islam_tasbih_v2', JSON.stringify(items)); } catch {} }, [items]);
  useEffect(() => { try { localStorage.setItem('islam_tasbih_active', activeId); } catch {} }, [activeId]);
  useEffect(() => { try { localStorage.setItem('islam_tasbih_vib', vibrate ? '1' : '0'); } catch {} }, [vibrate]);

  const active = items.find(i => i.id === activeId) || items[0];
  const totalAll = items.reduce((a, b) => a + b.total, 0);

  const tap = () => {
    setItems(arr => arr.map(i => {
      if (i.id !== active.id) return i;
      const nextCount = (i.count || 0) + 1;
      const reachedTarget = i.target && nextCount % i.target === 0;
      if (reachedTarget && vibrate && navigator.vibrate) { try { navigator.vibrate([60, 30, 60]); } catch {} }
      else if (vibrate && navigator.vibrate) { try { navigator.vibrate(15); } catch {} }
      return { ...i, count: nextCount, total: (i.total || 0) + 1 };
    }));
  };

  const reset = () => {
    setItems(arr => arr.map(i => i.id === active.id ? { ...i, count: 0 } : i));
  };
  const resetAll = () => {
    if (!confirm('هل تريد تصفير كل العدّادات؟')) return;
    setItems(arr => arr.map(i => ({ ...i, count: 0, total: 0 })));
  };

  const progress = active.target ? Math.min(100, ((active.count % active.target) / active.target) * 100) : 0;
  const cycles = active.target ? Math.floor(active.count / active.target) : 0;

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentLight} 100%)`,
        color: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
        textAlign: 'center', boxShadow: C.shadow
      }}>
        <div style={{ fontSize: 11, opacity: 0.85 }}>إجمالي ما سُبِّح في هذا الجهاز</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{totalAll.toLocaleString('ar-EG')}</div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>اللهم تقبل</div>
      </div>

      {/* Global istighfar — shared by all users */}
      <div style={{
        background: `linear-gradient(135deg, ${C.gold || '#c4a459'} 0%, #a8893f 100%)`,
        color: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        boxShadow: C.shadow, textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>عدّاد الاستغفار الجماعي</div>
        <div style={{
          fontSize: 22, fontFamily: '"Amiri", "Scheherazade New", serif', marginBottom: 8, lineHeight: 1.6
        }}>أَسْتَغْفِرُ اللهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ</div>
        <button onClick={tapIstighfar} style={{
          background: '#fff', color: '#a8893f', border: 'none',
          padding: '14px 28px', borderRadius: 14, cursor: 'pointer',
          fontSize: 18, fontWeight: 'bold', fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)', minWidth: 200,
          WebkitTapHighlightColor: 'transparent'
        }}>أستغفر الله ✨</button>
        <div style={{
          marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          fontSize: 12
        }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 6px' }}>
            <div style={{ opacity: 0.9, fontSize: 10 }}>كل المسلمين</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>
              {globalIst == null ? '...' : globalIst.toLocaleString('ar-EG')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 6px' }}>
            <div style={{ opacity: 0.9, fontSize: 10 }}>مساهمتك</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>
              {istLocal.toLocaleString('ar-EG')}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.85, marginTop: 8 }}>
          كل ضغطة تُضاف إلى عدّاد جماعي يراه كل المستخدمين — شجّع غيرك ❤
        </div>
      </div>

      {/* Big tap button + selected dhikr */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: C.shadow
      }}>
        <div style={{
          fontSize: 22, lineHeight: 2.0, color: C.text, textAlign: 'center',
          fontFamily: '"Amiri", "Scheherazade New", serif', minHeight: 80,
          padding: '12px 8px'
        }}>
          {active.text}
        </div>

        <button
          onClick={tap}
          style={{
            display: 'block', width: 200, height: 200, margin: '12px auto',
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: `radial-gradient(circle at 30% 30%, ${C.accentLight} 0%, ${C.accent} 60%, ${C.accentDark} 100%)`,
            color: '#fff', fontSize: 64, fontWeight: 'bold',
            boxShadow: `0 12px 32px rgba(15,107,95,0.4), inset 0 -6px 0 ${C.accentDark}`,
            transition: 'transform 0.08s ease',
            WebkitTapHighlightColor: 'transparent', userSelect: 'none'
          }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {active.count}
        </button>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 4 }}>
            <span>الهدف الواحد: {active.target}</span>
            <span>الدورات المكتملة: {cycles}</span>
          </div>
          <div style={{
            width: '100%', height: 8, background: C.surfaceAlt, borderRadius: 4,
            overflow: 'hidden', border: `1px solid ${C.border}`
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: `linear-gradient(90deg, ${C.accentLight}, ${C.accent})`,
              transition: 'width 0.18s ease'
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={reset} style={{
            flex: 1, background: C.surfaceAlt, color: C.accent, border: `1px solid ${C.border}`,
            padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 13, fontFamily: 'inherit'
          }}>تصفير العداد</button>
          <button onClick={() => setVibrate(v => !v)} style={{
            background: vibrate ? C.accent : C.surfaceAlt,
            color: vibrate ? '#fff' : C.muted,
            border: `1px solid ${vibrate ? C.accent : C.border}`,
            padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 12, fontFamily: 'inherit'
          }}>{vibrate ? 'الاهتزاز مفعّل' : 'تفعيل الاهتزاز'}</button>
        </div>
      </div>

      {/* List of presets */}
      <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 8, fontSize: 14 }}>اختر التسبيحة</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setActiveId(it.id)} style={{
            background: it.id === activeId ? C.accent : C.surface,
            color: it.id === activeId ? '#fff' : C.text,
            border: `1px solid ${it.id === activeId ? C.accent : C.border}`,
            padding: 12, borderRadius: 12, cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'right',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            boxShadow: it.id === activeId ? '0 2px 10px rgba(15,107,95,0.25)' : C.shadow
          }}>
            <div style={{
              flex: 1, fontFamily: '"Amiri", "Scheherazade New", serif',
              fontSize: 17, lineHeight: 1.6
            }}>{it.text}</div>
            <div style={{
              background: it.id === activeId ? 'rgba(255,255,255,0.2)' : C.surfaceAlt,
              color: it.id === activeId ? '#fff' : C.accent,
              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 'bold',
              minWidth: 60, textAlign: 'center', whiteSpace: 'nowrap'
            }}>{it.total || 0}</div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={resetAll} style={{
          background: 'transparent', color: C.red, border: `1px solid ${C.red}`,
          padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12
        }}>تصفير الكل</button>
      </div>
    </div>
  );
};

// ───────────────────────── RecitersSection ─────────────────────────
  // Fetches the full reciter list from mp3quran.net (~239 reciters). Each reciter has
  // one or more "moshaf" (recitation styles); each moshaf lists which surahs are recorded.
  const RECITERS_CACHE_KEY = 'islam_reciters_cache_v2';
  const RECITERS_CACHE_TTL = 24 * 3600 * 1000;
  const SURAH_NAMES_AR = [
    '','الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس',
    'هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه',
    'الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم',
    'لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر',
    'فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق',
    'الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة',
    'الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج',
    'نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس',
    'التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد',
    'الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات',
    'القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر',
    'المسد','الإخلاص','الفلق','الناس'
  ];
  const ar = (n) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  const RecitersSection = () => {
    const [reciters, setReciters] = useState(null);
    const [loadErr, setLoadErr] = useState('');
    const [q, setQ] = useState('');
    const [picked, setPicked] = useState(null);  // { reciter, moshaf }
    const [moshafIdx, setMoshafIdx] = useState(0);
    const [playing, setPlaying] = useState(null); // { reciter, surahNum, status }
    const audioRef = useRef(null);

    useEffect(() => {
      const cached = (() => {
        try {
          const raw = JSON.parse(localStorage.getItem(RECITERS_CACHE_KEY) || 'null');
          if (raw && raw.at && Date.now() - raw.at < RECITERS_CACHE_TTL && Array.isArray(raw.list)) return raw.list;
        } catch {}
        return null;
      })();
      if (cached) { setReciters(cached); return; }
      fetch('https://mp3quran.net/api/v3/reciters?language=ar')
        .then(r => r.json())
        .then(d => {
          const list = (d.reciters || []).filter(r => r.moshaf && r.moshaf.length);
          setReciters(list);
          try { localStorage.setItem(RECITERS_CACHE_KEY, JSON.stringify({ at: Date.now(), list })); } catch {}
        })
        .catch(() => setLoadErr('تعذّر تحميل قائمة القراء — تحقّق من الاتصال بالإنترنت'));
    }, []);

    useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

    const filtered = useMemo(() => {
      if (!reciters) return [];
      const norm = (s) => (s || '').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
      const qn = norm(q.trim());
      if (!qn) return reciters;
      return reciters.filter(r => norm(r.name).includes(qn));
    }, [reciters, q]);

    const playSurah = (rec, moshaf, surahNum) => {
      const url = `${moshaf.server}${String(surahNum).padStart(3, '0')}.mp3`;
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      if (playing && playing.reciter === rec.id && playing.surahNum === surahNum && !a.paused) {
        a.pause(); setPlaying(null); return;
      }
      a.src = url;
      a.preload = 'auto';
      setPlaying({ reciter: rec.id, surahNum, status: 'loading' });
      a.oncanplay = () => setPlaying(p => p && p.surahNum === surahNum ? { ...p, status: 'playing' } : p);
      a.onended = () => setPlaying(null);
      a.onerror = () => {
        setPlaying({ reciter: rec.id, surahNum, status: 'error' });
        // Try alternate server (server4 ↔ server10 etc.) as a fallback
        const alt = url.replace(/server(\d+)/, (_, n) => 'server' + ((+n % 13) + 1));
        a.src = alt;
        a.play().catch(() => setPlaying({ reciter: rec.id, surahNum, status: 'error' }));
      };
      a.play().catch((err) => {
        setPlaying({ reciter: rec.id, surahNum, status: 'error' });
      });
    };

    const stopAudio = () => { if (audioRef.current) audioRef.current.pause(); setPlaying(null); };
    const downloadUrl = (moshaf, surahNum) => `${moshaf.server}${String(surahNum).padStart(3, '0')}.mp3`;

    if (loadErr) {
      return (
        <div style={{ background: C.surface, padding: 20, borderRadius: 12, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ color: C.red, marginBottom: 10 }}>{loadErr}</div>
          <button onClick={() => { setLoadErr(''); setReciters(null); setTimeout(() => window.location.reload(), 100); }} style={{
            background: C.accent, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit'
          }}>إعادة المحاولة</button>
        </div>
      );
    }

    if (!reciters) {
      return <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>جاري تحميل القرّاء...</div>;
    }

    // Detail view: a chosen reciter
    if (picked) {
      const moshaf = picked.reciter.moshaf[moshafIdx] || picked.reciter.moshaf[0];
      const surahList = (moshaf.surah_list || '').split(',').filter(Boolean).map(n => parseInt(n, 10));
      return (
        <div>
          <button onClick={() => { stopAudio(); setPicked(null); setMoshafIdx(0); }} style={{
            background: C.surface, color: C.accent, border: `1px solid ${C.border}`,
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 12,
            fontFamily: 'inherit', fontSize: 13
          }}>← كل القرّاء</button>

          <div style={{
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentLight} 100%)`,
            color: '#fff', padding: 16, borderRadius: 14, marginBottom: 12, textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, opacity: 0.85 }}>القارئ</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 4, fontFamily: '"Amiri", serif' }}>{picked.reciter.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>عدد السور: {ar(surahList.length)} • {moshaf.name}</div>
          </div>

          {picked.reciter.moshaf.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {picked.reciter.moshaf.map((m, i) => (
                <button key={m.id} onClick={() => { stopAudio(); setMoshafIdx(i); }} style={{
                  background: i === moshafIdx ? C.accent : C.surface, color: i === moshafIdx ? '#fff' : C.text,
                  border: `1px solid ${i === moshafIdx ? C.accent : C.border}`,
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit'
                }}>{m.name}</button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: 6 }}>
            {surahList.map(n => {
              const isPlaying = playing && playing.reciter === picked.reciter.id && playing.surahNum === n;
              const status = isPlaying ? playing.status : null;
              return (
                <div key={n} style={{
                  background: C.surface, border: `1px solid ${isPlaying ? C.accent : C.border}`,
                  borderRadius: 10, padding: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isPlaying ? C.accent : C.surfaceAlt, color: isPlaying ? '#fff' : C.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: 13, flexShrink: 0
                    }}>{ar(n)}</div>
                    <div style={{
                      fontFamily: '"Amiri", serif', fontSize: 17, fontWeight: 'bold',
                      color: isPlaying ? C.accentLight : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>سورة {SURAH_NAMES_AR[n] || n}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => playSurah(picked.reciter, moshaf, n)} style={{
                      background: status === 'playing' ? C.red : C.accent, color: '#fff',
                      border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                      fontSize: 13, fontWeight: 'bold', minWidth: 70, fontFamily: 'inherit'
                    }}>
                      {status === 'loading' ? '...' : status === 'playing' ? 'إيقاف' : status === 'error' ? 'خطأ ↻' : '▶ تشغيل'}
                    </button>
                    <a href={downloadUrl(moshaf, n)} download={`${picked.reciter.name} - ${SURAH_NAMES_AR[n]}.mp3`} style={{
                      background: C.surfaceAlt, color: C.accent, border: `1px solid ${C.border}`,
                      padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                      fontSize: 12, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center'
                    }} title="تحميل">⬇</a>
                  </div>
                </div>
              );
            })}
          </div>
          {playing && playing.status === 'error' && (
            <div style={{ background: 'rgba(200,69,69,0.08)', color: C.red, border: `1px solid ${C.red}`, padding: 10, borderRadius: 10, marginTop: 12, fontSize: 13, textAlign: 'center' }}>
              تعذّر تشغيل السورة — جاري المحاولة بخادم بديل...
            </div>
          )}
        </div>
      );
    }

    // List view: all reciters
    return (
      <div>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="ابحث عن قارئ..."
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 12,
            background: C.surface, color: C.text, border: `1px solid ${C.border}`,
            fontFamily: 'inherit', fontSize: 14
          }}
        />
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
          {ar(filtered.length)} قارئ — اضغط على قارئ لعرض كل سوره
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {filtered.map(rec => (
            <button key={rec.id} onClick={() => { setPicked({ reciter: rec }); setMoshafIdx(0); }} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'right',
              fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: C.accentLight, fontFamily: '"Amiri", serif' }}>{rec.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {rec.moshaf.length === 1 ? rec.moshaf[0].name : `${ar(rec.moshaf.length)} روايات`} • {ar(rec.moshaf[0].surah_total)} سورة
                </div>
              </div>
              <div style={{ color: C.accent, fontSize: 18 }}>‹</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ───────────────────────── FatwaSection ─────────────────────────
  const FATWA_SOURCES = [
    { id: 'islamweb', label: 'إسلام ويب', url: (q) => `https://www.islamweb.net/ar/fatawa/index.php?page=Search&Find=${encodeURIComponent(q)}`, desc: 'مركز الفتوى — أكبر بنك فتاوى عربي' },
    { id: 'dar',      label: 'دار الإفتاء المصرية', url: (q) => `https://www.dar-alifta.org/ar/Fatawa/Search?text=${encodeURIComponent(q)}`, desc: 'الفتاوى الرسمية لدار الإفتاء' },
    { id: 'islamqa',  label: 'الإسلام سؤال وجواب', url: (q) => `https://islamqa.info/ar/search?q=${encodeURIComponent(q)}`, desc: 'فتاوى ميسرة بأدلتها' },
    { id: 'binbaz',   label: 'موقع ابن باز', url: (q) => `https://binbaz.org.sa/search?q=${encodeURIComponent(q)}`, desc: 'فتاوى الشيخ ابن باز رحمه الله' },
    { id: 'shubily',  label: 'إسلام أون لاين', url: (q) => `https://islamonline.net/?s=${encodeURIComponent(q)}`, desc: 'فتاوى معاصرة' }
  ];
  const FatwaSection = () => {
    const [q, setQ] = useState('');
    const [recent, setRecent] = useState(() => {
      try { return JSON.parse(localStorage.getItem('islam_fatwa_recent') || '[]'); } catch { return []; }
    });
    const ask = (sourceId) => {
      const text = q.trim();
      if (!text) return;
      const src = FATWA_SOURCES.find(s => s.id === sourceId) || FATWA_SOURCES[0];
      const url = src.url(text);
      const next = [text, ...recent.filter(x => x !== text)].slice(0, 8);
      setRecent(next);
      try { localStorage.setItem('islam_fatwa_recent', JSON.stringify(next)); } catch {}
      window.open(url, '_blank', 'noopener');
    };
    return (
      <div>
        <div style={{
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDark} 100%)`,
          color: '#fff', padding: 16, borderRadius: 14, marginBottom: 12, textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, opacity: 0.85 }}>اسأل في أمر دينك</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4, fontFamily: '"Amiri", serif' }}>الفتاوى الشرعية</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6, lineHeight: 1.7 }}>
            اكتب سؤالك تحت ثم اختر مصدر الفتوى — هتفتحلك أقرب فتوى لسؤالك من المصدر مباشرةً
          </div>
        </div>

        <textarea
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="مثال: ما حكم صلاة الجماعة، أحكام الصيام، زكاة المال..."
          rows={3}
          style={{
            width: '100%', padding: 12, borderRadius: 12, marginBottom: 12,
            background: C.surface, color: C.text, border: `1px solid ${C.border}`,
            fontFamily: 'inherit', fontSize: 15, resize: 'vertical', minHeight: 80
          }}
        />

        <div style={{ fontSize: 13, color: C.text, fontWeight: 'bold', marginBottom: 8 }}>اختر مصدر الفتوى:</div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          {FATWA_SOURCES.map(src => (
            <button key={src.id} onClick={() => ask(src.id)} disabled={!q.trim()} style={{
              background: q.trim() ? C.surface : C.surfaceAlt,
              border: `1px solid ${q.trim() ? C.accent : C.border}`,
              padding: 12, borderRadius: 10, cursor: q.trim() ? 'pointer' : 'not-allowed',
              textAlign: 'right', fontFamily: 'inherit', opacity: q.trim() ? 1 : 0.5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: C.accentLight }}>{src.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{src.desc}</div>
              </div>
              <div style={{ background: C.accent, color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap' }}>اسأل ←</div>
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>أسئلتك الأخيرة:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recent.map((r, i) => (
                <button key={i} onClick={() => setQ(r)} style={{
                  background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
                  padding: '6px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit'
                }}>{r.length > 28 ? r.slice(0, 28) + '...' : r}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(196,164,89,0.08)', border: `1px solid ${C.gold || '#c4a459'}`,
          borderRadius: 12, padding: 14, fontSize: 12, color: C.text, lineHeight: 1.8
        }}>
          <div style={{ fontWeight: 'bold', color: C.accentLight, marginBottom: 6 }}>إخلاء مسؤولية</div>
          الفتاوى المعروضة مأخوذة من المواقع الإسلامية المعتمدة المذكورة، وليست صادرة عن هذا التطبيق.
          نحن ننقلك مباشرة للمصدر، ولا نتحمّل مسؤولية محتوى الفتوى. فيما يخصّ المسائل الشخصية الدقيقة،
          يُستحبّ سؤال عالم ثقة من أهل بلدك.
        </div>
      </div>
    );
  };

  // ───────────────────────── MosquesSection (nearby mosques map) ─────────────────────────
  const MosquesSection = ({ pos }) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const [mosques, setMosques] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [radius, setRadius] = useState(3000); // meters

    useEffect(() => {
      if (!pos || !containerRef.current) return;
      let cancelled = false;
      (async () => {
        const L = (await import('leaflet')).default;
        // Fix default marker icons (leaflet's webpack assumption)
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        });
        if (cancelled) return;
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        const map = L.map(containerRef.current, { zoomControl: true }).setView([pos.lat, pos.lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19
        }).addTo(map);
        L.circleMarker([pos.lat, pos.lon], { radius: 8, color: '#0f6b5f', fillColor: '#0f6b5f', fillOpacity: 0.6, weight: 2 })
          .addTo(map).bindPopup('موقعك');
        mapRef.current = map;
        // Fetch mosques
        setLoading(true); setErr('');
        const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${pos.lat},${pos.lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${pos.lat},${pos.lon}););out center;`;
        try {
          const r = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
          const d = await r.json();
          if (cancelled) return;
          const list = (d.elements || []).map(e => ({
            id: e.id,
            lat: e.lat || (e.center && e.center.lat),
            lon: e.lon || (e.center && e.center.lon),
            name: (e.tags && (e.tags['name:ar'] || e.tags.name)) || 'مسجد',
            tags: e.tags || {}
          })).filter(m => m.lat && m.lon);
          setMosques(list);
          list.forEach(m => {
            L.marker([m.lat, m.lon]).addTo(map).bindPopup(
              `<div style="font-family:Amiri,serif;font-size:15px;font-weight:bold;text-align:right;direction:rtl">${m.name}</div>` +
              `<div style="text-align:right;direction:rtl;margin-top:6px"><a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}" target="_blank" rel="noopener">الاتجاهات في خرائط جوجل ←</a></div>`
            );
          });
        } catch (e) {
          setErr('تعذّر تحميل بيانات المساجد، حاول مرة أخرى');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      };
    }, [pos && pos.lat, pos && pos.lon, radius]);

    if (!pos) {
      return (
        <div style={{ background: C.surface, padding: 30, borderRadius: 12, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <div style={{ color: C.muted, marginBottom: 10 }}>لازم نعرف موقعك الأول عشان نعرض المساجد القريبة</div>
          <div style={{ color: C.text, fontSize: 13 }}>اذهب لتبويب "الصلاة" واسمح بالوصول للموقع</div>
        </div>
      );
    }

    return (
      <div>
        <div style={{
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentLight} 100%)`,
          color: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, textAlign: 'center'
        }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', fontFamily: '"Amiri", serif' }}>المساجد القريبة منك</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
            {loading ? 'جاري البحث...' : mosques ? `${ar(mosques.length)} مسجد في نطاق ${ar(radius / 1000)} كم` : 'جاري التحميل...'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, justifyContent: 'center' }}>
          {[1000, 2000, 3000, 5000, 10000].map(r => (
            <button key={r} onClick={() => setRadius(r)} style={{
              background: radius === r ? C.accent : C.surface, color: radius === r ? '#fff' : C.text,
              border: `1px solid ${radius === r ? C.accent : C.border}`,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit'
            }}>{ar(r / 1000)} كم</button>
          ))}
        </div>

        <div ref={containerRef} style={{
          height: '60vh', minHeight: 380, width: '100%',
          borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 12
        }} />

        {err && <div style={{ color: C.red, padding: 10, textAlign: 'center', fontSize: 13 }}>{err}</div>}

        {mosques && mosques.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: C.text, marginBottom: 4 }}>قائمة المساجد</div>
            {mosques.slice(0, 30).map(m => (
              <a key={m.id} href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`} target="_blank" rel="noopener" style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 12, textDecoration: 'none', color: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: C.accentLight, fontFamily: '"Amiri", serif' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>اضغط للحصول على الاتجاهات</div>
                </div>
                <div style={{ color: C.accent, fontSize: 18 }}>←</div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  
function LocationBar({ pos, setPos, city, setCity, status, refresh }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
        headers: { 'Accept-Language': 'ar' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const r = data[0];
        const loc = { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
        setPos(loc);
        setCity(r.display_name.split(',').slice(0, 2).join('،'));
        try { localStorage.setItem('islam_loc', JSON.stringify({ ...loc, city: r.display_name.split(',').slice(0, 2).join('،') })); } catch (e) {}
        setOpen(false);
        setQuery('');
      } else {
        setError('لم يتم العثور على المدينة');
      }
    } catch (e) {
      setError('تعذر البحث، تحقق من الإنترنت');
    }
    setSearching(false);
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: 12, marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.muted }}>الموقع الحالي</div>
          <div style={{ color: C.accentLight, fontSize: 14, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {city || (pos ? `${pos.lat.toFixed(3)}، ${pos.lon.toFixed(3)}` : status)}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12 }}>
          {open ? 'إغلاق' : 'تغيير'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="ابحث عن مدينة (مثال: الرياض)"
              style={{
                flex: 1, padding: '8px 10px',
                background: C.bg, color: C.text,
                border: `1px solid ${C.border}`, borderRadius: 6
              }}
            />
            <button onClick={search} disabled={searching} style={{
              ...btnStyle, padding: '8px 14px', fontSize: 13,
              background: C.accent, color: C.bg, border: 'none'
            }}>{searching ? '...' : 'بحث'}</button>
          </div>
          <button onClick={refresh} style={{ ...btnStyle, padding: '8px', fontSize: 12 }}>
            استخدم تحديد الموقع التلقائي
          </button>
          {error && <div style={{ color: C.red, fontSize: 12 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

// Map ISO country code → best-fit prayer calculation method
const COUNTRY_TO_METHOD = {
  EG:'Egyptian', SD:'Egyptian', LY:'Egyptian', SY:'Egyptian', LB:'Egyptian', PS:'Egyptian', JO:'Egyptian', IQ:'Egyptian', YE:'Egyptian',
  SA:'UmmAlQura', AE:'Dubai', QA:'Qatar', KW:'Kuwait', BH:'UmmAlQura', OM:'UmmAlQura',
  PK:'Karachi', IN:'Karachi', BD:'Karachi', AF:'Karachi', LK:'Karachi',
  US:'NorthAmerica', CA:'NorthAmerica', MX:'NorthAmerica',
  SG:'Singapore', MY:'Singapore', ID:'Singapore', BN:'Singapore', PH:'Singapore',
  IR:'Tehran', TR:'Turkey',
  MA:'MWL', DZ:'MWL', TN:'MWL', MR:'MWL'
};

export default function IslamicApp() {
  const [settings, setSettings] = useAppSettings();
  const [showSettings, setShowSettings] = useState(false);
  const VALID_TABS = ['prayer','quran','reciters','adhkar','tasbih','fatwa','mosques','sadaqah'];
  const [tab, setTab] = useState(() => {
    try {
      const h = (window.location.hash || '').replace('#', '').split('/')[0];
      if (VALID_TABS.includes(h)) return h;
      const s = localStorage.getItem('islam_tab');
      if (VALID_TABS.includes(s)) return s;
    } catch {}
    return "prayer";
  });
  useEffect(() => { try { localStorage.setItem('islam_tab', tab); window.location.hash = tab; } catch {} }, [tab]);
  const [pos, setPos] = useState(null);
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('جاري تحديد الموقع...');

  // Country detection (for auto prayer method) — done once via server proxy
  useEffect(() => {
    if (pos && pos.autoMethod) return;
    fetch('/api/ip-country').then(r => r.json()).then(d => {
      const cc = (d.country_code || '').toUpperCase();
      const m = COUNTRY_TO_METHOD[cc] || 'MWL';
      setPos(p => p ? { ...p, autoMethod: m, countryCode: cc } : p);
    }).catch(() => {});
  }, [pos && pos.lat, pos && pos.lon]);

  const detectLocation = () => {
    setStatus('جاري تحديد الموقع...');
    const tryIp = async () => {
      try {
        const res = await fetch('/api/ip-country');
        const d = await res.json();
        if (d.latitude && d.longitude) {
          const cc = (d.country_code || '').toUpperCase();
          const m = COUNTRY_TO_METHOD[cc] || 'MWL';
          setPos({ lat: d.latitude, lon: d.longitude, autoMethod: m, countryCode: cc });
          const name = [d.city, d.country_name].filter(Boolean).join('، ');
          setCity(name);
          try { localStorage.setItem('islam_loc', JSON.stringify({ lat: d.latitude, lon: d.longitude, city: name, autoMethod: m, countryCode: cc })); } catch (e) {}
        } else {
          setStatus('تعذر تحديد الموقع، حدده يدوياً');
        }
      } catch (e) {
        setStatus('تعذر تحديد الموقع، حدده يدوياً');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          const loc = { lat: p.coords.latitude, lon: p.coords.longitude };
          setPos(loc);
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lon}`, {
              headers: { 'Accept-Language': 'ar' }
            });
            const d = await r.json();
            const a = d.address || {};
            const name = [a.city || a.town || a.village || a.county, a.country].filter(Boolean).join('، ');
            const cc = (a.country_code || '').toUpperCase();
            const m = COUNTRY_TO_METHOD[cc] || 'MWL';
            setPos({ ...loc, autoMethod: m, countryCode: cc });
            setCity(name);
            try { localStorage.setItem('islam_loc', JSON.stringify({ ...loc, city: name, autoMethod: m, countryCode: cc })); } catch (e) {}
          } catch (e) {
            setCity(`${loc.lat.toFixed(3)}، ${loc.lon.toFixed(3)}`);
          }
        },
        () => { tryIp(); },
        { timeout: 5000 }
      );
    } else {
      tryIp();
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('islam_loc');
      if (saved) {
        const s = JSON.parse(saved);
        setPos({ lat: s.lat, lon: s.lon, autoMethod: s.autoMethod, countryCode: s.countryCode });
        if (s.city) setCity(s.city);
        return;
      }
    } catch (e) {}
    detectLocation();
  }, []);

  // Daily Quran reading reminder (browser notification, also fires when SW active)
  useEffect(() => {
    if (!settings.quranReminderEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      try {
        const [hh, mm] = (settings.quranReminderTime || '20:00').split(':').map(n => parseInt(n, 10));
        const now = new Date();
        if (now.getHours() === hh && now.getMinutes() === mm) {
          const todayKey = `islam_reminder_${now.toISOString().slice(0, 10)}`;
          if (!localStorage.getItem(todayKey)) {
            localStorage.setItem(todayKey, '1');
            const opts = {
              body: 'وقت قراءة وردك من القرآن الكريم — لا تنسَ أن خيركم من تعلّم القرآن وعلّمه',
              icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
              tag: 'islam-quran-reminder', dir: 'rtl', lang: 'ar', requireInteraction: true
            };
            try {
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'show-quran-reminder', opts });
              } else {
                new Notification('تذكير الورد اليومي', opts);
              }
            } catch {}
          }
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [settings.quranReminderEnabled, settings.quranReminderTime]);

  // Navigate to a specific Quran page from bookmark
  const goQuran = (page) => {
    try {
      if (page) localStorage.setItem('islam_quran_jump', String(page));
    } catch {}
    setTab('quran');
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, direction: "rtl", fontFamily: 'var(--app-font)', fontSize: 'var(--app-font-size)', paddingBottom: 84, color: C.text }}>
      <header style={{
        padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, background: C.bg, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <button
          onClick={() => setShowSettings(true)}
          aria-label="الإعدادات"
          style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '8px 10px', cursor: 'pointer', color: C.accent,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit',
            boxShadow: C.shadow
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.27.62.86 1.02 1.51 1.02H21a2 2 0 0 1 0 4h-.09c-.65 0-1.24.4-1.51 1z" />
          </svg>
          <span>الإعدادات</span>
        </button>
        <h1 style={{ color: C.accent, fontSize: 20, margin: 0, fontFamily: '"Amiri", "Scheherazade New", serif' }}>Islam</h1>
        <div style={{ width: 88 }} />
      </header>

      <main style={{ padding: 15, maxWidth: 720, margin: '0 auto' }}>
        {tab === 'prayer' && (
          <LocationBar pos={pos} setPos={setPos} city={city} setCity={setCity} status={status} refresh={detectLocation} />
        )}
        {tab === "prayer"   && <PrayerTimes pos={pos} appSettings={settings} goQuran={goQuran} />}
        {tab === "quran"    && <QuranSection />}
        {tab === "reciters" && <RecitersSection />}
        {tab === "adhkar"   && <AdhkarHub />}
        {tab === "tasbih"   && <TasbihSection />}
        {tab === "fatwa"    && <FatwaSection />}
        {tab === "mosques"  && <MosquesSection pos={pos} />}
        {tab === "sadaqah"  && <SadaqahSection />}
      </main>

      <nav style={{
        position: 'fixed', bottom: 0, width: '100%', background: C.surface,
        borderTop: `1px solid ${C.border}`, boxShadow: '0 -4px 14px rgba(0,0,0,0.05)',
        overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
        {[
          { id: "prayer",   label: "الصلاة",     icon: "🕌" },
          { id: "quran",    label: "القرآن",     icon: "📖" },
          { id: "reciters", label: "القرّاء",    icon: "🎙" },
          { id: "adhkar",   label: "الأذكار",    icon: "📿" },
          { id: "tasbih",   label: "المسبحة",    icon: "🟢" },
          { id: "fatwa",    label: "الفتاوى",    icon: "⚖" },
          { id: "mosques",  label: "المساجد",    icon: "🕋" },
          { id: "sadaqah",  label: "صدقة",       icon: "🤲" }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            minWidth: 72, padding: '10px 6px', background: 'none', border: 'none',
            color: tab === t.id ? C.accent : C.muted, cursor: 'pointer',
            fontFamily: 'inherit', position: 'relative', flexShrink: 0
          }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, marginTop: 2, fontWeight: tab === t.id ? 'bold' : 'normal' }}>{t.label}</div>
            {tab === t.id && (
              <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: 3,
                background: C.accent, borderRadius: '0 0 4px 4px'
              }} />
            )}
          </button>
        ))}
        </div>
      </nav>

      {showSettings && (
        <SettingsPanel settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

const btnStyle = {
  background: C.surface,
  color: C.accent,
  border: `1px solid ${C.border}`,
  padding: '6px 16px',
  borderRadius: 6,
  cursor: 'pointer'
};
