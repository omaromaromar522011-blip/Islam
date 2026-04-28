import fs from 'fs';

const stripBOM = s => s.replace(/^\uFEFF/, '');

const idx = JSON.parse(stripBOM(await (await fetch('https://www.hisnmuslim.com/api/ar/husn_ar.json')).text()));
const cats = idx['العربية'];
console.log('cats:', cats.length);

const slug = (s) => s.replace(/[^\u0621-\u064A0-9]/g, '_').replace(/_+/g, '_').slice(0, 40).replace(/^_|_$/g, '') || 'g';

const groups = [];
const seenIds = new Set();
for (const c of cats) {
  try {
    const r = await fetch(c.TEXT);
    const t = stripBOM(await r.text());
    const j = JSON.parse(t);
    const arr = j[c.TITLE] || j[Object.keys(j)[0]] || [];
    if (!arr.length) continue;
    let id = slug(c.TITLE);
    if (seenIds.has(id)) id = id + '_' + c.ID;
    seenIds.add(id);
    const items = arr.map(it => {
      const a = (it.ARABIC_TEXT || '').trim();
      const ref = (it.REFERENCE || '').trim();
      const cnt = parseInt(it.REPEAT || '1', 10) || 1;
      return { a, c: cnt, r: ref };
    }).filter(it => it.a);
    if (items.length) groups.push({ id, name: c.TITLE, icon: '', items });
    process.stdout.write('.');
  } catch (e) { process.stdout.write('x'); }
}
console.log('\nfetched groups:', groups.length, 'total items:', groups.reduce((a,g)=>a+g.items.length,0));

const existing = JSON.parse(fs.readFileSync('public/adhkar/all.json', 'utf8'));
const existingIds = new Set(existing.map(g => g.id));

const merged = [...existing];
for (const g of groups) {
  if (existingIds.has(g.id)) {
    const e = merged.find(x => x.id === g.id);
    const seen = new Set(e.items.map(x => x.a.replace(/\s+/g,'').slice(0,80)));
    for (const it of g.items) {
      const k = it.a.replace(/\s+/g,'').slice(0,80);
      if (!seen.has(k)) { e.items.push(it); seen.add(k); }
    }
  } else {
    merged.push(g);
  }
}

fs.writeFileSync('public/adhkar/all.json', JSON.stringify(merged));
const total = merged.reduce((a,g)=>a+g.items.length,0);
console.log('saved categories:', merged.length, 'total items:', total);
