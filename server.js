import express from 'express';
import Database from '@replit/database';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database();

app.use(express.json({ limit: '10kb' }));

const KEY = 'shared_duas_v1';
const MAX_ENTRIES = 200;
const MAX_NAME = 50;
const MAX_NOTE = 200;

const sanitize = (s, max) => String(s || '').replace(/[\x00-\x1F\x7F<>]/g, '').trim().slice(0, max);

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

const ipBuckets = new Map();
const checkRate = (ip) => {
  const now = Date.now();
  const arr = (ipBuckets.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= 5) return false;
  arr.push(now);
  ipBuckets.set(ip, arr);
  return true;
};

app.post('/api/duas', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    if (!checkRate(ip)) return res.status(429).json({ error: 'rate_limit' });

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

if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, 'dist');
  app.use(express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (/\.(mp3|png|json)$/.test(filePath) && /\/(adhan|tafsir|adhkar|quran)\//.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 5000) : 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`API server listening on ${PORT}`));
