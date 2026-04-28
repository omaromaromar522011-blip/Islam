import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as adhan from 'adhan';

const C = {
  bg: "#f5f1ea",
  surface: "#ffffff",
  surfaceAlt: "#faf6ee",
  accent: "#0f6b5f",
  accentLight: "#14897a",
  accentDark: "#0a4d44",
  gold: "#b08840",
  text: "#1a2530",
  muted: "#6b7785",
  border: "#e3ddd1",
  borderStrong: "#cfc6b4",
  red: "#c84545",
  sub: "#8a93a0",
  shadow: "0 4px 20px rgba(15,107,95,0.08)",
  shadowLg: "0 8px 32px rgba(15,107,95,0.12)"
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

const PrayerTimes = ({ pos }) => {
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
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      const pt = new adhan.PrayerTimes(coordinates, new Date(), params);
      setTimes(pt);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [pos]);

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

  return (
    <div>
      <audio ref={audioRef} preload="none" />

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

const RECITERS = [
  { id: 'afs',   name: 'مشاري بن راشد العفاسي',     server: 'https://server8.mp3quran.net/afs/' },
  { id: 'shur',  name: 'سعود الشريم',                server: 'https://server7.mp3quran.net/shur/' },
  { id: 'sds',   name: 'عبدالرحمن السديس',           server: 'https://server11.mp3quran.net/sds/' },
  { id: 'husr',  name: 'محمود خليل الحصري',          server: 'https://server13.mp3quran.net/husr/' },
  { id: 'minsh', name: 'محمد صديق المنشاوي',         server: 'https://server10.mp3quran.net/minsh/' },
  { id: 'basit', name: 'عبدالباسط عبدالصمد',         server: 'https://server7.mp3quran.net/basit/' },
  { id: 'qtm',   name: 'ناصر القطامي',               server: 'https://server6.mp3quran.net/qtm/' },
  { id: 'ajm',   name: 'أحمد بن علي العجمي',         server: 'https://server10.mp3quran.net/ajm/' }
];
const reciterUrl = (rid, surahNum) => {
  const r = RECITERS.find(x => x.id === rid) || RECITERS[0];
  return `${r.server}${String(surahNum).padStart(3, '0')}.mp3`;
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

  useEffect(() => { try { localStorage.setItem('islam_reciter', reciter); } catch {} }, [reciter]);

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

  useEffect(() => { try { localStorage.setItem('islam_quran_page', String(page)); } catch {} }, [page]);

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
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 10, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: C.shadow
          }}>
            <button onClick={playSurah} disabled={!currentSurahNum || audioState === 'loading'} style={{
              background: audioState === 'playing' ? C.red : C.accent,
              color: '#fff',
              border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 'bold', fontSize: 14, minWidth: 96,
              boxShadow: '0 2px 8px rgba(15,107,95,0.25)'
            }}>
              {audioState === 'loading' ? '... جاري' : audioState === 'playing' ? 'إيقاف' : 'تلاوة'}
            </button>
            <select value={reciter} onChange={e => setReciter(e.target.value)} style={{
              flex: 1, background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
              padding: '10px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit'
            }}>
              {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {currentSurah && (
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              السورة الحالية: <span style={{ color: C.accent, fontWeight: 'bold' }}>{currentSurah.name}</span>
            </div>
          )}
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button onClick={goPrev} disabled={page <= 1} style={{ ...btnStyle, opacity: page <= 1 ? 0.4 : 1 }}>السابق →</button>
            <div style={{ color: C.accent, fontSize: 14, fontWeight: 'bold' }}>صفحة {page} / 604</div>
            <button onClick={goNext} disabled={page >= 604} style={{ ...btnStyle, opacity: page >= 604 ? 0.4 : 1 }}>← التالي</button>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
            اسحب يميناً للصفحة التالية أو يساراً للسابقة • اضغط مطوّلاً لعرض تفسير الآيات
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
                maxHeight: '85vh', objectFit: 'contain',
                transform: `translateX(${dragX}px)`,
                transition: dragX === 0 ? 'transform 0.22s cubic-bezier(.2,.8,.2,1)' : 'none',
                animation: dragX === 0 ? `pageFlip${flipDir < 0 ? 'L' : 'R'} 0.22s cubic-bezier(.2,.8,.2,1)` : 'none',
                pointerEvents: 'none'
              }}
            />
          </div>

          <style>{`
            @keyframes pageFlipL { from { transform: translateX(28%); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
            @keyframes pageFlipR { from { transform: translateX(-28%); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
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
        maxHeight: '85vh', borderRadius: '16px 16px 0 0',
        border: `1px solid ${C.border}`, overflow: 'auto',
        animation: 'slideUp 0.25s ease-out'
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{
          position: 'sticky', top: 0, background: C.surface, padding: '14px 16px',
          borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ color: C.accentLight, fontWeight: 'bold' }}>صفحة {page} — اختر آية</div>
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
                  background: isSel ? C.accent : C.bg,
                  color: isSel ? C.bg : C.accentLight,
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
                background: 'rgba(196,164,89,0.08)', border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 16, marginBottom: 12
              }}>
                <div style={{ fontSize: 11, color: C.accent, marginBottom: 8, textAlign: 'center' }}>
                  {surah ? surah.name : ''} — الآية {sel.a}
                </div>
                <div style={{
                  fontSize: 22, lineHeight: 2.2, textAlign: 'center',
                  fontFamily: '"Amiri", "Scheherazade", serif', color: C.text
                }}>
                  {ayahText || ''} <span style={{ color: C.accent }}>﴿{sel.a}﴾</span>
                </div>
              </div>

              <div style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 16
              }}>
                <div style={{ fontSize: 12, color: C.accent, marginBottom: 8, fontWeight: 'bold' }}>
                  📚 التفسير الميسّر
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

const SunnahSection = () => {
  const [book, setBook] = useState(null);
  const [section, setSection] = useState(() => parseInt(localStorage.getItem('islam_bukhari_section') || '0', 10) || null);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/sunnah/bukhari.json');
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
          if (!cancel) setBook(JSON.parse(txt));
        } else {
          const j = await res.json();
          if (!cancel) setBook(j);
        }
      } catch (e) {
        if (!cancel) setError('تعذّر تحميل صحيح البخاري');
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (section != null) { try { localStorage.setItem('islam_bukhari_section', String(section)); } catch {} }
  }, [section]);

  const stripA = (s) => (s || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

  const sectionNames = useMemo(() => {
    if (!book) return null;
    const arabicNames = {
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
    };
    const out = [];
    const sections = book.metadata?.sections || {};
    for (const k of Object.keys(sections)) {
      const id = parseInt(k, 10);
      if (!id) continue;
      out.push({ id, name: arabicNames[id] || sections[k] || `كتاب ${id}` });
    }
    return out.sort((a, b) => a.id - b.id);
  }, [book]);

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

  if (error) {
    return <div style={{ color: C.red, textAlign: 'center', padding: 30 }}>{error}</div>;
  }
  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
        <div style={{ marginBottom: 12, fontSize: 15 }}>جاري تحميل صحيح البخاري...</div>
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
          سيتم تحميل الكتاب لمرة واحدة فقط ثم يحفظ في المتصفح
        </div>
      </div>
    );
  }

  if (!sectionNames) return null;

  return (
    <div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 12, marginBottom: 12,
        textAlign: 'center', boxShadow: C.shadow
      }}>
        <div style={{ color: C.accent, fontWeight: 'bold', fontSize: 16 }}>صحيح البخاري</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
          الإمام محمد بن إسماعيل البخاري • {book.hadiths.length} حديث في {sectionNames.length} كتاب
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث في أحاديث صحيح البخاري..."
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
              <HadithCard key={i} h={h} sectionNames={sectionNames} onOpenBook={(b) => { setQuery(''); setSection(b); }} />
            ))}
          </div>
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

export default function IslamicApp() {
  const [tab, setTab] = useState(() => {
    try {
      const h = (window.location.hash || '').replace('#', '');
      if (['prayer','quran','adhkar','sadaqah'].includes(h)) return h;
      const s = localStorage.getItem('islam_tab');
      if (['prayer','quran','adhkar','sadaqah'].includes(s)) return s;
    } catch {}
    return "prayer";
  });
  useEffect(() => { try { localStorage.setItem('islam_tab', tab); window.location.hash = tab; } catch {} }, [tab]);
  const [pos, setPos] = useState(null);
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('جاري تحديد الموقع...');

  const detectLocation = () => {
    setStatus('جاري تحديد الموقع...');
    const tryIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();
        if (d.latitude && d.longitude) {
          setPos({ lat: d.latitude, lon: d.longitude });
          const name = [d.city, d.country_name].filter(Boolean).join('، ');
          setCity(name);
          try { localStorage.setItem('islam_loc', JSON.stringify({ lat: d.latitude, lon: d.longitude, city: name })); } catch (e) {}
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
            setCity(name);
            try { localStorage.setItem('islam_loc', JSON.stringify({ ...loc, city: name })); } catch (e) {}
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
        setPos({ lat: s.lat, lon: s.lon });
        if (s.city) setCity(s.city);
        return;
      }
    } catch (e) {}
    detectLocation();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, direction: "rtl", fontFamily: 'sans-serif', paddingBottom: 80, color: C.text }}>
      <header style={{ padding: 20, borderBottom: `1px solid ${C.border}`, textAlign: 'center', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <h1 style={{ color: C.accent, fontSize: 20, margin: 0 }}>Islam</h1>
      </header>

      <main style={{ padding: 15, maxWidth: 720, margin: '0 auto' }}>
        {tab === 'prayer' && (
          <LocationBar pos={pos} setPos={setPos} city={city} setCity={setCity} status={status} refresh={detectLocation} />
        )}
        {tab === "prayer" && <PrayerTimes pos={pos} />}
        {tab === "quran" && <QuranSection />}
        {tab === "adhkar" && <AdhkarHub />}
        {tab === "sadaqah" && <SadaqahSection />}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: C.surface, display: 'flex', borderTop: `1px solid ${C.border}` }}>
        {[
          { id: "prayer", label: "الصلاة", icon: "🕌" },
          { id: "quran", label: "القرآن", icon: "📖" },
          { id: "adhkar", label: "الأذكار", icon: "📿" },
          { id: "sadaqah", label: "صدقة جارية", icon: "🤲" }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: 12, background: 'none', border: 'none', color: tab === t.id ? C.accent : C.muted, cursor: 'pointer'
          }}>
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{t.label}</div>
          </button>
        ))}
      </nav>
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
