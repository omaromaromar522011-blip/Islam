import express from 'express';
import Database from '@replit/database';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database();

app.use(express.json({ limit: '10kb' }));

const KEY = 'shared_duas_v1';
const ISTIGHFAR_KEY = 'global_istighfar_v1';
const MAX_ENTRIES = 200;
const MAX_NAME = 50;
const MAX_NOTE = 200;

const sanitize = (s, max) => String(s || '').replace(/[\x00-\x1F\x7F<>]/g, '').trim().slice(0, max);

const ipBuckets = new Map();
const checkRate = (ip, key, limit, windowMs) => {
  const now = Date.now();
  const k = key + ':' + ip;
  const arr = (ipBuckets.get(k) || []).filter(t => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  ipBuckets.set(k, arr);
  return true;
};
const ipOf = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

app.get('/api/duas', async (req, res) => {
  try {
    const list = (await db.get(KEY)) || [];
    const arr = Array.isArray(list) ? list : (list.value || []);
    res.json({ duas: arr });
  } catch (e) {
    console.error('GET /api/duas error', e);
    res.status(500).json({ error: 'load_failed' });
  }
});

app.post('/api/duas', async (req, res) => {
  try {
    const ip = ipOf(req);
    if (!checkRate(ip, 'duas', 5, 60000)) return res.status(429).json({ error: 'rate_limit' });

    const name = sanitize(req.body?.name, MAX_NAME);
    const reason = sanitize(req.body?.reason, 30) || 'general';
    const note = sanitize(req.body?.note, MAX_NOTE);
    if (!name || name.length < 2) return res.status(400).json({ error: 'name_required' });

    const raw = (await db.get(KEY)) || [];
    const list = Array.isArray(raw) ? raw : (raw.value || []);

    const entry = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name, reason, note,
      addedAt: Date.now()
    };
    const next = [entry, ...list].slice(0, MAX_ENTRIES);
    await db.set(KEY, next);
    res.json({ ok: true, entry, total: next.length });
  } catch (e) {
    console.error('POST /api/duas error', e);
    res.status(500).json({ error: 'save_failed' });
  }
});

const readIstighfar = async () => {
  const raw = await db.get(ISTIGHFAR_KEY);
  const v = (raw && typeof raw === 'object' && 'value' in raw) ? raw.value : raw;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

app.get('/api/istighfar', async (req, res) => {
  try {
    const total = await readIstighfar();
    res.json({ total });
  } catch (e) {
    console.error('GET /api/istighfar error', e);
    res.status(500).json({ error: 'load_failed' });
  }
});

app.post('/api/istighfar', async (req, res) => {
  try {
    const ip = ipOf(req);
    if (!checkRate(ip, 'istighfar', 60, 60000)) return res.status(429).json({ error: 'rate_limit' });

    const incRaw = parseInt(req.body?.inc, 10);
    const inc = Number.isFinite(incRaw) ? Math.max(1, Math.min(50, incRaw)) : 1;

    const cur = await readIstighfar();
    const next = cur + inc;
    await db.set(ISTIGHFAR_KEY, next);
    res.json({ total: next, added: inc });
  } catch (e) {
    console.error('POST /api/istighfar error', e);
    res.status(500).json({ error: 'save_failed' });
  }
});

// Server-side IP geolocation proxy (avoids CORS, used to auto-pick prayer method)
let _ipCache = null; let _ipCacheAt = 0;
app.get('/api/ip-country', async (req, res) => {
  try {
    if (_ipCache && Date.now() - _ipCacheAt < 5 * 60 * 1000) {
      return res.json(_ipCache);
    }
    const fwd = req.headers['x-forwarded-for'] || '';
    const ip = String(fwd).split(',')[0].trim() || req.socket.remoteAddress || '';
    const isPrivate = !ip || /^(127\.|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
    const candidates = [
      isPrivate ? 'https://ipwho.is/' : `https://ipwho.is/${ip}`,
      isPrivate ? 'https://ipapi.co/json/' : `https://ipapi.co/${ip}/json/`,
      isPrivate ? 'https://api.country.is/' : `https://api.country.is/${ip}`
    ];
    let out = null; let lastErr = null;
    for (const url of candidates) {
      try {
        const ctl = new AbortController();
        const tid = setTimeout(() => ctl.abort(), 4000);
        const r = await fetch(url, { headers: { 'User-Agent': 'IslamApp/1.0' }, signal: ctl.signal });
        clearTimeout(tid);
        if (!r.ok) { lastErr = `status ${r.status}`; continue; }
        const d = await r.json();
        const cc = (d.country_code || d.country || d.countryCode || '').toString().toUpperCase();
        if (!cc || cc.length !== 2) { lastErr = 'no country'; continue; }
        out = {
          country_code: cc,
          country_name: d.country_name || d.country || '',
          latitude: d.latitude || d.lat || null,
          longitude: d.longitude || d.lon || null,
          city: d.city || '', timezone: d.timezone || (d.timezone && d.timezone.id) || ''
        };
        break;
      } catch (e) { lastErr = e && e.message; }
    }
    if (!out) return res.status(503).json({ error: 'ip_lookup_failed', detail: lastErr });
    _ipCache = out; _ipCacheAt = Date.now();
    res.json(out);
  } catch (e) {
    res.status(503).json({ error: 'ip_lookup_failed' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, 'dist');
  app.use(express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (/\.(mp3|png|json)$/.test(filePath) && /\/(adhan|tafsir|adhkar|quran)\//.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.use((req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 5000) : 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`API server listening on ${PORT}`));
