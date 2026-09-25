// Build a self-contained preview of the product page (for sharing as a Claude artifact or any static host).
// Usage: node scripts/build-preview.js <outDir>
// Differences from the live site: relative asset paths, catalog inlined, no ad tracking,
// checkout shows a preview notice, and policy/contact links point to on-page sections.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'preview'));

let html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const catalog = fs.readFileSync(path.join(SITE, 'catalog.js'), 'utf8');
const rep = (from, to) => {
  if (!html.includes(from)) throw new Error(`Preview build: page no longer contains ${from.slice(0, 60)}`);
  html = html.split(from).join(to);
};

// The artifact host supplies <!doctype>, <html>, <head> and <body>.
html = html.replace(/^[\s\S]*?<head>\s*/, '').replace(/<\/head>\s*<body>\s*/, '').replace(/\s*<\/body>\s*<\/html>\s*$/, '\n');
html = html.replace(/<meta charset="utf-8">\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
html = html.replace(/<meta (property|name)="(og|twitter):[^>]*>\s*/g, '').replace(/<link rel="canonical"[^>]*>\s*/, '');
html = html.replace(/<title>[^<]*<\/title>/, '<title>Ruffora Daily Gut</title>');

rep('<script src="/catalog.js"></script>', `<script>\n${catalog}</script>`);
rep('<script src="/tracking.js" defer></script>\n', '');
rep('<link rel="icon" type="image/png" href="/assets/logo-mark.png">\n', '');
html = html.split('"/assets/').join('"assets/').split('url(/assets/').join('url(assets/');

// Checkout needs the Vercel API; the preview explains instead.
rep('async function goToCheckout(){', 'async function goToCheckout(){\n  toast("Preview only: checkout opens when the store launches.");return;');

// Footer: link to sections on this page and show the email as text.
html = html.replace(/<nav><a href="#shop">Shop<\/a>[\s\S]*?<\/nav>/, '<nav><a href="#shop">Shop</a><a href="#serving">Serving guide</a><a href="#ingredients">Ingredients</a><a href="#vet">Vet review</a></nav>');
html = html.replace(/<p><a href="mailto:([^"]+)">[^<]*<\/a><\/p>/, '<p>$1</p>');
html = html.replace(/<p class="fine">© 2026 Ruffora ·[\s\S]*?<\/p>/, '<p class="fine">© 2026 Ruffora · Preview</p>');

const leftovers = html.match(/href="\/(?!\/)[^"#]*"|src="\/(?!\/)[^"]*"|mailto:/g);
if (leftovers) throw new Error(`Preview build: absolute links remain: ${[...new Set(leftovers)].join(', ')}`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');

const files = [];
for (const rel of [...new Set(html.match(/assets\/[\w./-]+\.(?:png|webp|jpg)/g))]) {
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.copyFileSync(path.join(SITE, rel), path.join(OUT, rel));
  files.push(rel);
}
console.log(JSON.stringify({ out: OUT, files }, null, 1));
