import React, { useState, useEffect, useRef } from 'react';
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
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 15, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => setPage(p => Math.min(604, p + 1))} style={btnStyle}>السابق</button>
        <span style={{ color: C.text }}>صفحة {page}</span>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} style={btnStyle}>التالي</button>
      </div>
      <img
        src={`https://pcloud.qurancomplex.gov.sa/shuaiba-api/v1/images/hafs/madina2/600/${page}`}
        alt="القرآن الكريم"
        style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      />
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
    };
    window.addEventListener('deviceorientation', handleMotion);
    return () => window.removeEventListener('deviceorientation', handleMotion);
  }, [pos]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const cx = 135, cy = 135, R = 100;
    ctx.clearRect(0, 0, 270, 270);

    const nRad = ((angle - heading) * Math.PI) / 180;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(nRad);
    ctx.beginPath();
    ctx.moveTo(0, -(R - 20)); ctx.lineTo(10, 0); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fillStyle = C.accent; ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = C.border; ctx.lineWidth = 5; ctx.stroke();
  }, [angle, heading]);

  return (
    <div style={{ textAlign: 'center', color: C.text }}>
      <canvas ref={canvasRef} width={270} height={270} />
      <h2>{angle}°</h2>
      <p style={{ color: C.muted }}>اتجه نحو الكعبة المشرفة</p>
    </div>
  );
};

const AdhkarSection = () => {
  const adhkar = [
    { t: "سبحان الله وبحمده", c: 100 },
    { t: "أستغفر الله وأتوب إليه", c: 70 },
    { t: "اللهم صلِ وسلم على نبينا محمد", c: 10 }
  ];
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {adhkar.map((a, i) => (
        <div key={i} style={{ background: C.surface, padding: 20, borderRadius: 15, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 18, marginBottom: 10, color: C.text }}>{a.t}</p>
          <div style={{ color: C.accent, fontSize: 12 }}>العدد المطلوب: {a.c}</div>
        </div>
      ))}
    </div>
  );
};

export default function IslamicApp() {
  const [tab, setTab] = useState("prayer");
  const [pos, setPos] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (err) => console.error(err)
    );
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, direction: "rtl", fontFamily: 'sans-serif', paddingBottom: 80 }}>
      <header style={{ padding: 20, borderBottom: `1px solid ${C.border}`, textAlign: 'center', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <h1 style={{ color: C.accent, fontSize: 20 }}>Islam</h1>
      </header>

      <main style={{ padding: 15 }}>
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
            flex: 1, padding: 15, background: 'none', border: 'none', color: tab === t.id ? C.accent : C.muted, cursor: 'pointer'
          }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10 }}>{t.label}</div>
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
  padding: '5px 15px',
  borderRadius: 5,
  cursor: 'pointer'
};
