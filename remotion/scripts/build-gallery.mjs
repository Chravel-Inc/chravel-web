#!/usr/bin/env node
/**
 * Emits a single self-contained gallery page for the 24 use-case films.
 *
 * Everything is inlined as data: URIs — the Inter woff2 faces and the 24 preview clips —
 * because the page is published as an artifact, where a strict CSP blocks every external
 * host. A linked webfont would fail silently and fall back; inlining guarantees the brand
 * face actually renders.
 *
 * Copy comes from src/usecases/scenarios.ts so the page cannot drift from the films.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PREVIEWS = 'out/previews';
const FONTS = 'public/fonts';
const OUT = 'out/gallery.html';

if (!existsSync(PREVIEWS)) {
  console.error(`No previews at ${PREVIEWS}. Run "node scripts/make-previews.mjs" first.`);
  process.exit(1);
}

/**
 * Load the scenario manifest without a TypeScript toolchain.
 *
 * Regex-scraping each field would be fragile — the copy contains multi-line strings,
 * curly quotes and em-dashes. Slicing out the array literal and evaluating it keeps the
 * strings exactly as authored. The literal is plain data with no imports or calls.
 */
const loadScenarios = () => {
  const src = readFileSync('src/usecases/scenarios.ts', 'utf8');
  const start = src.indexOf('export const SCENARIOS');
  const open = src.indexOf('[', start);
  const end = src.indexOf('\n];', open);
  if (start < 0 || open < 0 || end < 0) {
    throw new Error('Could not locate the SCENARIOS array literal in scenarios.ts');
  }
  const literal = src.slice(open, end + 2);
  return new Function(`return ${literal}`)();
};

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(file).toString('base64')}`;

const fontFace = (weight, file) => `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url(${dataUri(file, 'font/woff2')}) format('woff2');
}`;

const esc = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const scenarios = loadScenarios();

const fonts = ['400', '600', '700', '800']
  .map(w => {
    const f = path.join(FONTS, `inter-latin-${w}.woff2`);
    if (!existsSync(f)) throw new Error(`Missing font ${f}`);
    return fontFace(w, f);
  })
  .join('\n');

const previewFor = (slug, format) => {
  const idx = scenarios.findIndex(s => s.slug === slug);
  const n = String(idx + 1).padStart(2, '0');
  const file = path.join(PREVIEWS, `UC-${n}-${slug}-${format}.mp4`);
  return existsSync(file) ? dataUri(file, 'video/mp4') : null;
};

const SPEC = {
  vertical: { label: '9:16', dims: '1080 × 1920', secs: '24s', use: 'Reels · TikTok · Shorts' },
  square: { label: '1:1', dims: '1080 × 1080', secs: '15s', use: 'Feed posts' },
  wide: { label: '16:9', dims: '1920 × 1080', secs: '75s', use: 'Site hero · YouTube · LinkedIn' },
};

const tile = (s, format) => {
  const src = previewFor(s.slug, format);
  if (!src) return '';
  const spec = SPEC[format];
  return `
<article class="film">
  <div class="frame ${format}">
    <video src="${src}" muted loop playsinline preload="none"
           aria-label="Preview of the ${esc(s.title)} film"></video>
    <span class="ratio">${spec.label}</span>
  </div>
  <div class="meta">
    <p class="ord">${String(s.index).padStart(2, '0')}</p>
    <h3>${esc(s.title)}</h3>
    <p class="aud">${esc(s.audience)}</p>
    <div class="turn">
      <p class="before">${esc(s.before)}</p>
      <p class="after">${esc(s.after)}</p>
    </div>
    <p class="badge">${esc(s.badge)}</p>
    <p class="file">UC-${String(s.index).padStart(2, '0')}-${s.slug}-${format}.mp4 · ${spec.dims} · ${spec.secs}</p>
  </div>
</article>`;
};

const anthemTile = format => {
  const file = path.join(PREVIEWS, `UC-Anthem-${format}.mp4`);
  if (!existsSync(file)) return '';
  const spec = SPEC[format === 'wide' ? 'wide' : 'vertical'];
  const dims = format === 'wide' ? '1920 × 1080' : '1080 × 1920';
  return `
<article class="film anthem">
  <div class="frame ${format}">
    <video src="${dataUri(file, 'video/mp4')}" muted loop playsinline preload="none"
           aria-label="Preview of the ${format === 'wide' ? '16:9' : '9:16'} anthem"></video>
    <span class="ratio">${format === 'wide' ? '16:9' : '9:16'}</span>
  </div>
  <div class="meta">
    <p class="ord">—</p>
    <h3>Brand Anthem</h3>
    <p class="aud">${format === 'wide' ? 'Site hero · YouTube · LinkedIn' : 'Reels · TikTok · Shorts'}</p>
    <div class="turn">
      <p class="before">Every group has a plan. And a group chat where the plan goes to die.</p>
      <p class="after">All eleven scenarios in one film — 12s cold open, eleven 4s vignettes in page order, 19s close.</p>
    </div>
    <p class="badge">Less Chaos · More Coordination</p>
    <p class="file">UC-Anthem-${format}.mp4 · ${dims} · 75s</p>
  </div>
</article>`;
};

const section = (id, kicker, title, note, body) => `
<section id="${id}">
  <header class="sec">
    <p class="kicker">${kicker}</p>
    <h2>${title}</h2>
    <p class="note">${note}</p>
  </header>
  <div class="grid">${body}</div>
</section>`;

const html = `<style>
${fonts}

/* Chravel's system is dark-first and explicitly rules out light themes
   (remotion/design-system.md), so this page commits to the single dark world
   rather than shipping a light variant the brand does not have. */
:root {
  --bg: #000000;
  --surface: #0f0f0f;
  --surface-hi: #141414;
  --line: #1a1a1a;
  --line-gold: #2a2010;
  --gold: #c49746;
  --gold-hi: #e8af48;
  --gold-pale: #feeaa5;
  --fg: #ffffff;
  --muted: #999999;
  --dim: #666666;
  --step: clamp(0.9rem, 0.85rem + 0.2vw, 1rem);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: var(--step);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.wrap { max-width: 1240px; margin: 0 auto; padding: 0 24px 96px; }

/* ---- masthead ---- */
.mast {
  padding: 88px 0 56px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--gold-pale);
}
.mast h1 {
  margin: 0;
  font-size: clamp(2.2rem, 1.4rem + 3.4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.04;
  text-wrap: balance;
  max-width: 20ch;
}
.mast h1 em {
  font-style: normal;
  background: linear-gradient(135deg, var(--gold-hi) 0%, var(--gold) 50%, #a07a32 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.lede { margin: 0; max-width: 62ch; color: var(--muted); line-height: 1.7; }

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.stat {
  flex: 1 1 130px;
  padding: 16px 20px;
  border-right: 1px solid var(--line);
  background: var(--surface);
}
.stat:last-child { border-right: 0; }
.stat b {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--gold-hi);
}
.stat span { font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); }

/* ---- sections ---- */
section { padding-top: 72px; }
.sec { display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px; }
.kicker {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
}
.sec h2 {
  margin: 0;
  font-size: clamp(1.5rem, 1.2rem + 1.1vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.note { margin: 0; color: var(--dim); max-width: 68ch; font-size: 0.9rem; }

.grid { display: grid; gap: 28px; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); }
#anthem .grid { grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); }

/* ---- film tile ---- */
.film {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 160ms ease, transform 160ms ease;
}
.film:hover, .film:focus-within {
  border-color: var(--line-gold);
  transform: translateY(-2px);
}

.frame { position: relative; background: #000; overflow: hidden; }
.frame.vertical { aspect-ratio: 9 / 16; }
.frame.square { aspect-ratio: 1 / 1; }
.frame.wide { aspect-ratio: 16 / 9; }
.frame video { width: 100%; height: 100%; object-fit: cover; display: block; }

.ratio {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(0,0,0,0.72);
  border: 1px solid var(--line-gold);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--gold-pale);
  font-variant-numeric: tabular-nums;
}

.meta { padding: 18px 18px 20px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
.ord {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}
.meta h3 { margin: 0; font-size: 1.12rem; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }
.aud { margin: 0; font-size: 0.76rem; color: var(--dim); line-height: 1.5; }

/* The before/after split mirrors the films' own structure — the rule is the turn. */
.turn {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.before, .after { margin: 0; font-size: 0.82rem; line-height: 1.55; }
.before { color: var(--muted); }
.before::before, .after::before {
  display: block;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 3px;
}
.before::before { content: 'Before'; color: #6b4a4a; }
.after::before { content: 'After'; color: var(--gold); }
.after { color: #d8d8d8; }

.badge {
  margin: 2px 0 0;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold-pale);
  line-height: 1.5;
}
.file {
  margin: auto 0 0;
  padding-top: 12px;
  font-size: 0.66rem;
  color: #4a4a4a;
  word-break: break-all;
  font-variant-numeric: tabular-nums;
}

footer {
  margin-top: 88px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
  color: var(--dim);
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
footer strong { color: var(--muted); font-weight: 600; }

@media (prefers-reduced-motion: reduce) {
  .film { transition: none; }
  .film:hover { transform: none; }
}
</style>

<div class="wrap">
  <header class="mast">
    <p class="eyebrow">Chravel · Brand Film System</p>
    <h1>Eleven scenarios. <em>Twenty-four cuts.</em></h1>
    <p class="lede">
      One cinematic film per use case, in every format the feed asks for. Each runs the same
      six-scene spine — the chaos, the escalation, the turn, the product, the payoff, the lockup —
      built from the copy already on the use-cases page rather than new claims.
    </p>
    <div class="stats">
      <div class="stat"><b>11</b><span>Scenarios</span></div>
      <div class="stat"><b>24</b><span>Cuts</span></div>
      <div class="stat"><b>3</b><span>Formats</span></div>
      <!-- 11x24.04s + 11x15.06s + 2x75.05s = 580s -->
      <div class="stat"><b>9:40</b><span>Total runtime</span></div>
    </div>
  </header>

  ${section(
    'vertical',
    '9:16 · Vertical',
    'Reels, TikTok, Shorts',
    '24 seconds. The full six-scene spine, with the escalation intact.',
    scenarios.map(s => tile(s, 'vertical')).join(''),
  )}

  ${section(
    'square',
    '1:1 · Square',
    'Feed posts',
    'Fifteen seconds. Not a re-edit — the same scene manifest with the escalation dropped, because at 15s the hook has to reach the product fast.',
    scenarios.map(s => tile(s, 'square')).join(''),
  )}

  ${section(
    'anthem',
    'Anthem',
    'All eleven in one film',
    'Seventy-five seconds. The vignettes are deliberately uniform — the argument is that eleven very different groups have the same problem and the same fix, so sameness is the point.',
    anthemTile('wide') + anthemTile('vertical'),
  )}

  <footer>
    <p><strong>These tiles are 5-second previews</strong>, sampled from the payoff stretch of each
    film and compressed hard so the whole page stays self-contained. The full-length cuts were
    delivered in the conversation.</p>
    <p>Every word on screen is real Inter rasterization rendered by Remotion, and the product shots
    are genuine screenshots of shipped surfaces. No text is ever sent to a video model — which is
    why none of it can come out garbled.</p>
  </footer>
</div>

<script>
// Play only what is on screen: 24 autoplaying clips at once is wasteful, and some
// browsers cap concurrent playback and would leave later tiles frozen.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var vids = Array.prototype.slice.call(document.querySelectorAll('.frame video'));

  if (reduce.matches) {
    vids.forEach(function (v) { v.setAttribute('controls', ''); v.preload = 'metadata'; });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.preload === 'none') v.preload = 'auto';
        var p = v.play();
        if (p && p.catch) p.catch(function () { v.setAttribute('controls', ''); });
      } else {
        v.pause();
      }
    });
  }, { rootMargin: '150px 0px', threshold: 0.2 });

  vids.forEach(function (v) { io.observe(v); });
})();
</script>`;

writeFileSync(OUT, html);

const mib = Buffer.byteLength(html) / 1024 / 1024;
console.log(`Wrote ${OUT} — ${mib.toFixed(1)} MiB`);
console.log(
  `${scenarios.length} scenarios · ${(html.match(/<video /g) || []).length} previews embedded`,
);
