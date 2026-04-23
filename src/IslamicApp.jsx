import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as adhan from 'adhan';

const C = {
  bg: "#050a14",
  surface: "#111b2d",
  accent: "#c4a459",
  accentLight: "#e5d19a",
  text: "#ffffff",
  muted: "#8b949e",
  border: "#1e293b",
  red: "#ff4d4d",
  sub: "#a3aab2"
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
  { id: 'fajr', label: 'أذان الفجر — الحرم المكي (مع تثويب)', file: '/adhan/fajr.mp3' },
  { id: 'fajr2', label: 'أذان الفجر — رواية ٢ (مع تثويب)', file: '/adhan/fajr2.mp3' },
  { id: 'fajr3', label: 'أذان الفجر — رواية ٣ (مع تثويب)', file: '/adhan/fajr3.mp3' }
];

const PRAYER_NAMES = {
  fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر",
  asr: "العصر", maghrib: "المغرب", isha: "العشاء"
};

const DEFAULT_ADHAN_SETTINGS = {
  enabled: false,
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

  // Adhan checker
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
        if (diff >= 0 && diff < 60_000) {
          playedRef.current[key] = true;
          const voiceId = p === 'fajr' ? (s.fajrVoice || s.voice) : s.voice;
          const voice = ADHAN_VOICES.find(v => v.id === voiceId) || ADHAN_VOICES[0];
          if (audioRef.current) {
            audioRef.current.src = voice.file;
            audioRef.current.play().catch(e => console.warn('Adhan play blocked:', e));
          }
        }
      });
    };
    check();
    const id = setInterval(check, 15_000);
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
      setSettings(s => ({ ...s, enabled: true }));
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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

const QuranSection = () => {
  const [view, setView] = useState('mushaf'); // 'mushaf' | 'tafsir'
  const [page, setPage] = useState(1);
  const pageStr = String(page).padStart(3, '0');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: C.surface, padding: 4, borderRadius: 12, border: `1px solid ${C.border}` }}>
        {[
          { id: 'mushaf', label: '📖 المصحف' },
          { id: 'tafsir', label: '📚 التفسير الميسّر' }
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: view === v.id ? C.accent : 'transparent',
            color: view === v.id ? C.bg : C.muted,
            fontWeight: 'bold', fontSize: 14
          }}>{v.label}</button>
        ))}
      </div>

      {view === 'mushaf' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setPage(p => Math.min(604, p + 1))} style={btnStyle}>التالي</button>
            <span style={{ color: C.text }}>صفحة {page} / 604</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} style={btnStyle}>السابق</button>
          </div>
          <img
            src={`/quran/${pageStr}.png`}
            alt={`صفحة ${page} من القرآن الكريم`}
            style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', background: '#fff' }}
          />
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
                background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6
              }}
            />
          </div>
        </div>
      )}

      {view === 'tafsir' && <TafsirSection />}
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
  const [duaList, setDuaList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('islam_duas') || '[]'); }
    catch { return []; }
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
    localStorage.setItem('islam_duas', JSON.stringify(duaList));
  }, [duaList]);

  const totalShares = Object.values(shareCounts).reduce((a, b) => a + b, 0);
  const totalDuas = duaList.reduce((a, p) => a + (p.count || 0), 0);

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

  const addDua = () => {
    const name = newName.trim();
    if (!name) return;
    setDuaList(prev => [{
      id: Date.now(), name, reason: newReason, note: newNote.trim(), count: 0
    }, ...prev]);
    setNewName(''); setNewNote(''); setNewReason('general');
    setShowAdd(false);
  };

  const incDua = (id) => {
    setDuaList(prev => prev.map(p => p.id === id ? { ...p, count: (p.count || 0) + 1 } : p));
  };

  const delDua = (id) => {
    if (!confirm('هل تريد حذف هذا الاسم من القائمة؟')) return;
    setDuaList(prev => prev.filter(p => p.id !== id));
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
              <button onClick={addDua} style={{
                width: '100%', padding: 12, background: C.accent, color: C.bg,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 'bold'
              }}>حفظ</button>
            </div>
          )}

          {duaList.length === 0 ? (
            <div style={{
              background: C.surface, padding: 30, borderRadius: 14,
              border: `1px dashed ${C.border}`, textAlign: 'center', color: C.muted
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🤲</div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                أضف أسماء من تحب من الأهل والأصدقاء<br />
                ليذكّرك التطبيق بالدعاء لهم
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {duaList.map(p => {
                const r = REASONS.find(x => x.id === p.reason) || REASONS[5];
                return (
                  <div key={p.id} style={{
                    background: C.surface, padding: 14, borderRadius: 14,
                    border: `1px solid ${p.count > 0 ? C.accent : C.border}`
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
                      }}>{p.count}</div>
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
                      <button onClick={() => delDua(p.id)} style={{
                        background: 'transparent', color: C.red, border: `1px solid ${C.border}`,
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        fontSize: 14
                      }}>🗑</button>
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
              background: done ? C.accent : C.bg,
              color: done ? C.bg : C.accent,
              border: `1px solid ${C.accent}`,
              padding: '6px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold'
            }}
          >+1</button>
        </div>
      </div>
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
  const [tab, setTab] = useState("prayer");
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
        {tab === "adhkar" && <AdhkarSection />}
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
