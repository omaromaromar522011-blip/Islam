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
