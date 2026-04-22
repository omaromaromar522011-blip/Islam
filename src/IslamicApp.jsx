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

  useEffect(() => {
    if (pos) {
      const φ1 = pos.lat * Math.PI / 180;
      const λ1 = pos.lon * Math.PI / 180;
      const φ2 = 21.4225 * Math.PI / 180;
      const λ2 = 39.8262 * Math.PI / 180;
      const y = Math.sin(λ2 - λ1);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
      const qibla = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      setAngle(Math.round(qibla));
    }

    const handleMotion = (e) => {
      if (e.webkitCompassHeading) setHeading(e.webkitCompassHeading);
      else if (typeof e.alpha === 'number') setHeading(360 - e.alpha);
    };
    window.addEventListener('deviceorientation', handleMotion);
    return () => window.removeEventListener('deviceorientation', handleMotion);
  }, [pos]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const cx = 135, cy = 135, R = 100;
    ctx.clearRect(0, 0, 270, 270);

    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = C.border; ctx.lineWidth = 5; ctx.stroke();

    const nRad = ((angle - heading) * Math.PI) / 180;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(nRad);
    ctx.beginPath();
    ctx.moveTo(0, -(R - 20)); ctx.lineTo(12, 10); ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.restore();
  }, [angle, heading]);

  return (
    <div style={{ textAlign: 'center', color: C.text }}>
      <canvas ref={canvasRef} width={270} height={270} />
      <h2>{angle}°</h2>
      <p style={{ color: C.muted }}>اتجه نحو الكعبة المشرفة</p>
    </div>
  );
};

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

export default function IslamicApp() {
  const [tab, setTab] = useState("prayer");
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
        (err) => console.error(err)
      );
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, direction: "rtl", fontFamily: 'sans-serif', paddingBottom: 80, color: C.text }}>
      <header style={{ padding: 20, borderBottom: `1px solid ${C.border}`, textAlign: 'center', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <h1 style={{ color: C.accent, fontSize: 20, margin: 0 }}>Islam</h1>
      </header>

      <main style={{ padding: 15, maxWidth: 720, margin: '0 auto' }}>
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
