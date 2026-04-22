import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as adhan from 'adhan';
import { ADHKAR_CATEGORIES } from './adhkarData.js';

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

const PrayerTimes = ({ pos }) => {
  const [times, setTimes] = useState(null);

  useEffect(() => {
    if (pos) {
      const coordinates = new adhan.Coordinates(pos.lat, pos.lon);
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      const date = new Date();
      const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
      setTimes(prayerTimes);
    }
  }, [pos]);

  const names = { fajr: "الفجر", sunrise: "الشروق", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء" };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {times ? Object.keys(names).map(p => (
        <div key={p} style={{
          display: 'flex', justifyContent: 'space-between', padding: '16px',
          background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`
        }}>
          <span style={{ color: C.accentLight, fontWeight: 'bold' }}>{names[p]}</span>
          <span style={{ color: C.text }}>{times[p].toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )) : <div style={{ color: C.muted, textAlign: 'center' }}>جاري حساب المواقيت...</div>}
    </div>
  );
};

const QuranSection = () => {
  const [page, setPage] = useState(1);
  const pageStr = String(page).padStart(3, '0');
  return (
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
          type="number"
          min={1}
          max={604}
          value={page}
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
  );
};

const QiblaSection = ({ pos }) => {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [heading, setHeading] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [distance, setDistance] = useState(0);
  const [needPermission, setNeedPermission] = useState(false);

  useEffect(() => {
    if (pos) {
      const KAABA = { lat: 21.4225, lon: 39.8262 };
      const φ1 = pos.lat * Math.PI / 180;
      const λ1 = pos.lon * Math.PI / 180;
      const φ2 = KAABA.lat * Math.PI / 180;
      const λ2 = KAABA.lon * Math.PI / 180;
      const y = Math.sin(λ2 - λ1);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
      const qibla = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      setAngle(qibla);

      const R = 6371;
      const dφ = (KAABA.lat - pos.lat) * Math.PI / 180;
      const dλ = (KAABA.lon - pos.lon) * Math.PI / 180;
      const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance(Math.round(R * c));
    }
  }, [pos]);

  useEffect(() => {
    const handleMotion = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (typeof e.alpha === 'number') h = 360 - e.alpha;
      if (h !== null && !Number.isNaN(h)) {
        setHeading(h);
        setHasOrientation(true);
      }
    };
    window.addEventListener('deviceorientationabsolute', handleMotion, true);
    window.addEventListener('deviceorientation', handleMotion, true);
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedPermission(true);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleMotion, true);
      window.removeEventListener('deviceorientation', handleMotion, true);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r === 'granted') setNeedPermission(false);
    } catch (e) {}
  };

  const diff = ((angle - heading + 540) % 360) - 180;
  const absDiff = Math.abs(diff);
  const aligned = hasOrientation && absDiff < 5;
  const close = hasOrientation && absDiff < 15;
  const ringColor = aligned ? '#22c55e' : (close ? C.accent : C.border);
  const arrowColor = aligned ? '#22c55e' : C.accent;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const cx = 150, cy = 150, R = 120;
    ctx.clearRect(0, 0, 300, 300);

    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor; ctx.lineWidth = 6; ctx.stroke();

    ctx.fillStyle = C.muted; ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const dirs = [['ش', 0], ['ق', 90], ['ج', 180], ['غ', 270]];
    dirs.forEach(([t, deg]) => {
      const r = (((deg - heading) * Math.PI) / 180);
      const x = cx + Math.sin(r) * (R - 18);
      const y = cy - Math.cos(r) * (R - 18);
      ctx.fillStyle = deg === 0 ? C.red : C.muted;
      ctx.fillText(t, x, y);
    });

    for (let i = 0; i < 72; i++) {
      const a = ((i * 5 - heading) * Math.PI) / 180;
      const inner = R - (i % 6 === 0 ? 8 : 4);
      const x1 = cx + Math.sin(a) * R;
      const y1 = cy - Math.cos(a) * R;
      const x2 = cx + Math.sin(a) * inner;
      const y2 = cy - Math.cos(a) * inner;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
    }

    const nRad = ((angle - heading) * Math.PI) / 180;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(nRad);
    ctx.beginPath();
    ctx.moveTo(0, -(R - 30));
    ctx.lineTo(14, -(R - 60));
    ctx.lineTo(6, -(R - 60));
    ctx.lineTo(6, 30);
    ctx.lineTo(-6, 30);
    ctx.lineTo(-6, -(R - 60));
    ctx.lineTo(-14, -(R - 60));
    ctx.closePath();
    ctx.fillStyle = arrowColor; ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = arrowColor; ctx.fill();

    ctx.fillStyle = arrowColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('🕋', cx + Math.sin(nRad) * (R - 15), cy - Math.cos(nRad) * (R - 15));
  }, [angle, heading, ringColor, arrowColor]);

  return (
    <div style={{ textAlign: 'center', color: C.text }}>
      <canvas ref={canvasRef} width={300} height={300} style={{ display: 'block', margin: '0 auto' }} />

      {needPermission && (
        <button onClick={requestPermission} style={{
          ...btnStyle, background: C.accent, color: C.bg, border: 'none',
          padding: '10px 20px', marginTop: 10
        }}>تفعيل البوصلة</button>
      )}

      <div style={{
        marginTop: 16, padding: 16, borderRadius: 14,
        background: aligned ? 'rgba(34,197,94,0.15)' : C.surface,
        border: `2px solid ${aligned ? '#22c55e' : C.border}`,
        transition: 'all .25s'
      }}>
        <div style={{
          fontSize: 16, fontWeight: 'bold',
          color: aligned ? '#22c55e' : (close ? C.accent : C.muted),
          marginBottom: 10
        }}>
          {!hasOrientation ? '⚠️ جهازك لا يدعم البوصلة، يمكنك الاسترشاد بالزاوية فقط'
            : aligned ? '✅ أنت تتجه نحو الكعبة'
            : close ? '↻ اقترب، استمر في الالتفاف'
            : '↻ التف نحو القبلة'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Stat label="اتجاه القبلة" value={`${angle.toFixed(1)}°`} />
          <Stat label="اتجاهك" value={hasOrientation ? `${heading.toFixed(1)}°` : '—'} />
          <Stat label="الفرق" value={hasOrientation ? `${absDiff.toFixed(1)}°` : '—'}
            color={aligned ? '#22c55e' : (close ? C.accent : C.text)} />
        </div>

        <div style={{ marginTop: 12, color: C.muted, fontSize: 13 }}>
          المسافة إلى الكعبة المشرفة: <span style={{ color: C.accentLight, fontWeight: 'bold' }}>{distance.toLocaleString('ar-EG')} كم</span>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div style={{ background: C.bg, padding: 10, borderRadius: 10, border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 'bold', color: color || C.text }}>{value}</div>
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
  const [activeCat, setActiveCat] = useState(ADHKAR_CATEGORIES[0].id);
  const cat = useMemo(() => ADHKAR_CATEGORIES.find(c => c.id === activeCat), [activeCat]);

  return (
    <div>
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 12,
        scrollbarWidth: 'thin'
      }}>
        {ADHKAR_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            flexShrink: 0,
            background: activeCat === c.id ? C.accent : C.surface,
            color: activeCat === c.id ? C.bg : C.accentLight,
            border: `1px solid ${C.border}`,
            padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
            fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap'
          }}>{c.name} ({c.items.length})</button>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
        {cat.items.length} ذكر
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {cat.items.map((item, i) => <DhikrCard key={`${activeCat}-${i}`} item={item} />)}
      </div>
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
        {(tab === 'prayer' || tab === 'qibla') && (
          <LocationBar pos={pos} setPos={setPos} city={city} setCity={setCity} status={status} refresh={detectLocation} />
        )}
        {tab === "prayer" && <PrayerTimes pos={pos} />}
        {tab === "quran" && <QuranSection />}
        {tab === "adhkar" && <AdhkarSection />}
        {tab === "qibla" && <QiblaSection pos={pos} />}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, width: '100%', background: C.surface, display: 'flex', borderTop: `1px solid ${C.border}` }}>
        {[
          { id: "prayer", label: "الصلاة", icon: "🕌" },
          { id: "quran", label: "القرآن", icon: "📖" },
          { id: "adhkar", label: "الأذكار", icon: "📿" },
          { id: "qibla", label: "القبلة", icon: "🧭" }
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
