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
  const dialRef = useRef(null);
  const arrowRef = useRef(null);
  const headingTextRef = useRef(null);
  const diffTextRef = useRef(null);
  const statusRef = useRef(null);
  const boxRef = useRef(null);

  const screenAngleRef = useRef(0);
  const targetHeadingRef = useRef(0);
  const smoothHeadingRef = useRef(0);
  const lastDrawnHeadingRef = useRef(-999);
  const isAbsoluteRef = useRef(false);
  const qiblaAngleRef = useRef(0);

  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [hasCompass, setHasCompass] = useState(false);
  const [needPermission, setNeedPermission] = useState(false);

  useEffect(() => {
    if (!pos) return;
    const KAABA = { lat: 21.4225, lon: 39.8262 };
    const φ1 = pos.lat * Math.PI / 180;
    const λ1 = pos.lon * Math.PI / 180;
    const φ2 = KAABA.lat * Math.PI / 180;
    const λ2 = KAABA.lon * Math.PI / 180;
    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const qibla = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    setQiblaAngle(qibla);
    qiblaAngleRef.current = qibla;

    const R = 6371;
    const dφ = (KAABA.lat - pos.lat) * Math.PI / 180;
    const dλ = (KAABA.lon - pos.lon) * Math.PI / 180;
    const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistance(Math.round(R * c));
  }, [pos]);

  useEffect(() => {
    const updateScreenAngle = () => {
      const a = (screen.orientation && typeof screen.orientation.angle === 'number')
        ? screen.orientation.angle
        : (window.orientation || 0);
      screenAngleRef.current = a;
    };
    updateScreenAngle();
    window.addEventListener('orientationchange', updateScreenAngle);
    return () => window.removeEventListener('orientationchange', updateScreenAngle);
  }, []);

  useEffect(() => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedPermission(true);
      return;
    }
    attachListeners();
    return detachListeners;
  }, []);

  const attachListeners = () => {
    let gotAny = false;
    const handle = (e, fromAbsolute) => {
      let h = null;
      let absolute = false;
      if (typeof e.webkitCompassHeading === 'number') {
        h = e.webkitCompassHeading;
        absolute = true;
      } else if (typeof e.alpha === 'number') {
        h = (360 - e.alpha + 360) % 360;
        absolute = fromAbsolute || e.absolute === true;
      }
      if (h === null || Number.isNaN(h)) return;
      h = (h + screenAngleRef.current + 360) % 360;
      targetHeadingRef.current = h;
      if (absolute) isAbsoluteRef.current = true;
      if (!gotAny) {
        gotAny = true;
        setHasCompass(true);
      }
    };
    const absH = (e) => handle(e, true);
    const relH = (e) => handle(e, false);
    window.addEventListener('deviceorientationabsolute', absH, true);
    window.addEventListener('deviceorientation', relH, true);
    detachListeners._handlers = { absH, relH };
  };
  const detachListeners = () => {
    const h = detachListeners._handlers;
    if (!h) return;
    window.removeEventListener('deviceorientationabsolute', h.absH, true);
    window.removeEventListener('deviceorientation', h.relH, true);
  };

  const requestPermission = async () => {
    try {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r === 'granted') {
        setNeedPermission(false);
        attachListeners();
      }
    } catch (e) {}
  };

  // Single rAF loop: rotates dial via CSS transform (no canvas, no flicker)
  useEffect(() => {
    let raf;
    let lastTextUpdate = 0;
    const tick = () => {
      const target = targetHeadingRef.current;
      let diff = ((target - smoothHeadingRef.current + 540) % 360) - 180;
      if (Math.abs(diff) > 0.1) {
        smoothHeadingRef.current = (smoothHeadingRef.current + diff * 0.18 + 360) % 360;
      } else {
        smoothHeadingRef.current = target;
      }
      const heading = smoothHeadingRef.current;

      // Only update DOM when meaningfully changed
      if (Math.abs(heading - lastDrawnHeadingRef.current) > 0.3 ||
          lastDrawnHeadingRef.current === -999) {
        lastDrawnHeadingRef.current = heading;
        if (dialRef.current) {
          dialRef.current.style.transform = `translate3d(0,0,0) rotate(${-heading}deg)`;
        }
        if (arrowRef.current) {
          arrowRef.current.style.transform = `translate3d(0,0,0) rotate(${qiblaAngleRef.current - heading}deg)`;
        }
      }

      const now = performance.now();
      if (now - lastTextUpdate > 200) {
        lastTextUpdate = now;
        const dq = ((qiblaAngleRef.current - heading + 540) % 360) - 180;
        const absD = Math.abs(dq);
        const aligned = isAbsoluteRef.current && absD < 5;
        const close = isAbsoluteRef.current && absD < 15;
        if (headingTextRef.current) {
          headingTextRef.current.textContent = isAbsoluteRef.current ? `${Math.round(heading)}°` : '—';
        }
        if (diffTextRef.current) {
          diffTextRef.current.textContent = isAbsoluteRef.current ? `${Math.round(absD)}°` : '—';
          diffTextRef.current.style.color = aligned ? '#22c55e' : (close ? C.accent : C.text);
        }
        if (arrowRef.current) {
          arrowRef.current.style.color = aligned ? '#22c55e' : C.accent;
        }
        if (statusRef.current) {
          statusRef.current.textContent = !isAbsoluteRef.current
            ? 'هذا الجهاز لا يوفر بوصلة دقيقة. اتجِه نحو الكعبة باستخدام الزاوية المعروضة أعلاه.'
            : aligned ? '✅ أنت تتجه نحو الكعبة'
            : close ? '↻ اقترب من الاتجاه الصحيح'
            : '↻ التف ببطء نحو القبلة';
          statusRef.current.style.color = aligned ? '#22c55e' : (close ? C.accent : C.muted);
        }
        if (boxRef.current) {
          boxRef.current.style.background = aligned ? 'rgba(34,197,94,0.12)' : C.surface;
          boxRef.current.style.borderColor = aligned ? '#22c55e' : C.border;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Static dial with N/E/S/W and tick marks (drawn once via SVG)
  return (
    <div style={{ textAlign: 'center', color: C.text }}>
      <div style={{
        position: 'relative', width: 280, height: 280, margin: '0 auto'
      }}>
        {/* Rotating dial */}
        <div ref={dialRef} style={{
          position: 'absolute', inset: 0, willChange: 'transform'
        }}>
          <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%' }}>
            <circle cx="140" cy="140" r="125" fill="none" stroke={C.border} strokeWidth="2" />
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i * 5 - 90) * Math.PI / 180;
              const r1 = 125;
              const r2 = i % 6 === 0 ? 113 : 119;
              return <line key={i}
                x1={140 + Math.cos(a) * r1} y1={140 + Math.sin(a) * r1}
                x2={140 + Math.cos(a) * r2} y2={140 + Math.sin(a) * r2}
                stroke={C.border} strokeWidth={i % 6 === 0 ? 2 : 1} />;
            })}
            <text x="140" y="32" textAnchor="middle" fill={C.red} fontSize="16" fontWeight="bold">N</text>
            <text x="248" y="146" textAnchor="middle" fill={C.muted} fontSize="14" fontWeight="bold">E</text>
            <text x="140" y="260" textAnchor="middle" fill={C.muted} fontSize="14" fontWeight="bold">S</text>
            <text x="32" y="146" textAnchor="middle" fill={C.muted} fontSize="14" fontWeight="bold">W</text>
          </svg>
        </div>

        {/* Qibla arrow (rotates with qibla - heading) */}
        <div ref={arrowRef} style={{
          position: 'absolute', inset: 0, color: C.accent,
          willChange: 'transform', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%' }}>
            <polygon points="140,30 152,80 146,80 146,150 134,150 134,80 128,80"
              fill="currentColor" />
            <text x="140" y="22" textAnchor="middle" fontSize="22">🕋</text>
            <circle cx="140" cy="140" r="6" fill="currentColor" />
          </svg>
        </div>
      </div>

      {needPermission && (
        <button onClick={requestPermission} style={{
          ...btnStyle, background: C.accent, color: C.bg, border: 'none',
          padding: '10px 20px', marginTop: 10
        }}>تفعيل البوصلة</button>
      )}

      <div ref={boxRef} style={{
        marginTop: 16, padding: 16, borderRadius: 14,
        background: C.surface, border: `2px solid ${C.border}`
      }}>
        <div ref={statusRef} style={{
          fontSize: 15, fontWeight: 'bold', color: C.muted, marginBottom: 12, minHeight: 24
        }}>
          {hasCompass ? '↻ التف ببطء نحو القبلة' : 'هذا الجهاز لا يوفر بوصلة دقيقة. اتجِه نحو الكعبة باستخدام الزاوية المعروضة.'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Stat label="اتجاه القبلة من الشمال" value={`${Math.round(qiblaAngle)}°`} />
          <Stat label="اتجاهك" valueRef={headingTextRef} value={'—'} />
          <Stat label="الفرق" valueRef={diffTextRef} value={'—'} />
        </div>

        <div style={{ marginTop: 12, color: C.muted, fontSize: 13 }}>
          المسافة إلى الكعبة المشرفة: <span style={{ color: C.accentLight, fontWeight: 'bold' }}>{distance.toLocaleString('ar-EG')} كم</span>
        </div>
      </div>
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
