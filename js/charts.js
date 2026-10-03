// Small hand-rolled inline-SVG charts for the advanced results walkthrough.
// Each builder returns an SVG markup string. No DOM access, no chart library.
// Colors come from CSS custom properties (see "Charts" in styles.css), so light
// and dark themes swap in one place. Hover tooltips use SVG <title> elements.
// Palette: the dataviz skill's validated reference slots (blue/orange for the
// Genuine/Fake outcomes; violet for "you" against a neutral gray crowd).

// Charts are drawn at the width they will be displayed (passed in as
// `width`, default 600) so text keeps its real size on narrow phones instead
// of being scaled down with the whole SVG.
const DEFAULT_W = 600;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const pct = (x) => `${Math.round(x)}%`;

function linear([d0, d1], [r0, r1]) {
  return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

function svg(W, height, body, label) {
  return `<svg class="chart" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(label)}">${body}</svg>`;
}

// x-axis ticks for a 0–100% scale.
function percentAxis(x, y0, y1, { ticks = [0, 25, 50, 75, 100], emphasize = 50 } = {}) {
  return ticks
    .map((t) => {
      const cls = t === emphasize ? "grid grid-strong" : "grid";
      return `<line class="${cls}" x1="${x(t)}" x2="${x(t)}" y1="${y0}" y2="${y1}"/>
        <text class="tick" x="${x(t)}" y="${y1 + 18}" text-anchor="middle">${t}%</text>`;
    })
    .join("");
}

// Spread overlapping dots vertically (a simple beeswarm): each dot takes the
// first lane (0, +1, −1, +2, …) where it doesn't collide with an earlier dot.
// xs are pixel positions; minGap is the center-to-center distance needed.
function stackOffsets(xs, step, minGap) {
  const placed = [];
  return xs.map((x) => {
    for (let k = 0; ; k++) {
      const lane = (k % 2 ? -1 : 1) * Math.ceil(k / 2);
      if (!placed.some((p) => p.lane === lane && Math.abs(p.x - x) < minGap)) {
        placed.push({ x, lane });
        return lane * step;
      }
    }
  });
}

// Strip plot of the user's answers, one row per true outcome.
// rows: [{ label, cls, points: [{ value (0–100), filled, title }], mean? }]
export function stripPlot(rows, { label, showMeans = false, width = DEFAULT_W }) {
  const W = width;
  const narrow = W < 450;
  const left = narrow ? 72 : 118;
  const right = W - 24;
  const rowH = 78;
  const top = 16;
  const height = top + rows.length * rowH + 30;
  const x = linear([0, 100], [left, right]);
  let body = percentAxis(x, top, top + rows.length * rowH);
  rows.forEach((row, i) => {
    const cy = top + i * rowH + rowH / 2;
    body += `<text class="row-label" x="${left - 14}" y="${cy + 5}" text-anchor="end">${esc(narrow && row.short ? row.short : row.label)}</text>`;
    if (showMeans && row.mean != null) {
      const mx = x(row.mean);
      body += `<line class="mean-line ${row.cls}" x1="${mx}" x2="${mx}" y1="${cy - rowH / 2 + 6}" y2="${cy + rowH / 2 - 6}"/>
        <text class="mean-label" x="${mx}" y="${cy - rowH / 2 + 4}" text-anchor="middle">avg ${pct(row.mean)}</text>`;
    }
    const offsets = stackOffsets(row.points.map((p) => x(p.value)), 15, 16);
    row.points.forEach((p, j) => {
      body += `<circle class="dot ${row.cls} ${p.filled ? "is-filled" : "is-hollow"}" cx="${x(p.value)}" cy="${cy + offsets[j]}" r="7"><title>${esc(p.title)}</title></circle>`;
    });
  });
  return svg(W, height, body, label);
}

// Horizontal signed bars for the decomposition components, on one shared axis.
// items: [{ label, value, kind: "add"|"reduce"|"total" }]
export function componentBars(items, { label, width = DEFAULT_W }) {
  const W = width;
  const narrow = W < 450;
  const left = narrow ? 12 : 150;
  const right = W - 70;
  const barH = 26;
  const gap = narrow ? 34 : 14;
  const top = narrow ? 26 : 10;
  const height = top + items.length * (barH + gap) + 24;
  const lo = Math.min(0, ...items.map((d) => d.value));
  const hi = Math.max(0.3, ...items.map((d) => d.value));
  const x = linear([lo, hi], [left, right]);
  const zero = x(0);
  let body = "";
  items.forEach((d, i) => {
    const y = top + i * (barH + gap);
    // Zero line drawn per bar so it never crosses the labels above bars.
    body += `<line class="axis" x1="${zero}" x2="${zero}" y1="${y - 4}" y2="${y + barH + 4}"/>`;
    const x0 = Math.min(zero, x(d.value));
    const w = Math.max(2, Math.abs(x(d.value) - zero));
    const sign = d.value < 0 ? "−" : d.kind === "total" ? "" : "+";
    const txt = `${sign}${Math.abs(d.value).toFixed(3)}`;
    const tx = d.value < 0 ? zero + 8 : x0 + w + 8;
    body += (narrow
      ? `<text class="row-label" x="${left}" y="${y - 7}">${esc(d.label)}</text>`
      : `<text class="row-label" x="${left - 14}" y="${y + barH / 2 + 5}" text-anchor="end">${esc(d.label)}</text>`) + `
      <rect class="bar bar-${d.kind}" x="${x0}" y="${y}" width="${w}" height="${barH}" rx="4"><title>${esc(d.label)}: ${txt}</title></rect>
      <text class="value" x="${tx}" y="${y + barH / 2 + 5}" text-anchor="start">${txt}</text>`;
  });
  return svg(W, height, body, label);
}

// Calibration curve: judgment bin vs. share of those smiles that were genuine.
// bins: [{ value (0–1), n, dBar }]
export function calibrationPlot(bins, { label, width = DEFAULT_W }) {
  const W = width;
  const left = 64;
  const right = W - 30;
  const top = 16;
  const size = right - left;
  const bottom = top + size * (W < 450 ? 0.85 : 0.62);
  const height = bottom + 52;
  const x = linear([0, 1], [left, right]);
  const y = linear([0, 1], [bottom, top]);
  let body = "";
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    body += `<line class="grid" x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="tick" x="${left - 10}" y="${y(t) + 4}" text-anchor="end">${t * 100}%</text>
      <line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${bottom}"/>
      <text class="tick" x="${x(t)}" y="${bottom + 18}" text-anchor="middle">${t * 100}%</text>`;
  }
  body += `<line class="diagonal" x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}"/>
    <text class="axis-title" x="${(left + right) / 2}" y="${bottom + 42}" text-anchor="middle">${W < 450 ? "What you said (nearest 10%)" : "What you said (rounded to the nearest 10%)"}</text>`;
  for (const b of bins) {
    const r = 5 + Math.sqrt(b.n) * 3.2;
    body += `<circle class="cal-dot" cx="${x(b.value)}" cy="${y(b.dBar)}" r="${r}"><title>You said ~${Math.round(b.value * 100)}% on ${b.n} smile${b.n === 1 ? "" : "s"}; ${Math.round(b.dBar * 100)}% were genuine</title></circle>`;
  }
  return svg(W, height, body, label);
}

// Histogram of crowd scores (0–20 correct), with the user's score marked.
export function scoreHistogram(distribution, { you, mean, label, width = DEFAULT_W }) {
  const W = width;
  const left = 16;
  const right = W - 16;
  const top = 44;
  const bottom = 200;
  const height = bottom + 44;
  const n = distribution.length;
  const slot = (right - left) / n;
  const max = Math.max(...distribution);
  const total = distribution.reduce((s, c) => s + c, 0);
  const y = linear([0, max], [bottom, top]);
  let body = `<line class="axis" x1="${left}" x2="${right}" y1="${bottom}" y2="${bottom}"/>`;
  distribution.forEach((count, score) => {
    const bx = left + score * slot + 1;
    const h = Math.max(count ? 2 : 0, bottom - y(count));
    const isYou = score === you;
    body += `<rect class="bar ${isYou ? "bar-you" : "bar-crowd"}" x="${bx}" y="${bottom - h}" width="${slot - 2}" height="${h}" rx="3"><title>${score} correct: ${count.toLocaleString()} people (${((count / total) * 100).toFixed(1)}%)</title></rect>`;
    if (score % 5 === 0 || isYou) {
      body += `<text class="tick${isYou ? " tick-you" : ""}" x="${bx + slot / 2 - 1}" y="${bottom + 18}" text-anchor="middle">${score}</text>`;
    }
    if (isYou) {
      body += `<text class="direct-label you" x="${bx + slot / 2 - 1}" y="${bottom - h - 8}" text-anchor="middle">You</text>`;
    }
  });
  const mx = left + (mean + 0.5) * slot;
  body += `<line class="mean-line" x1="${mx}" x2="${mx}" y1="${top - 24}" y2="${bottom}"/>
    <text class="mean-label" x="${mx - 6}" y="${top - 28}" text-anchor="end">average ${mean.toFixed(1)}</text>
    <text class="axis-title" x="${(left + right) / 2}" y="${bottom + 38}" text-anchor="middle">Number correct out of 20</text>`;
  return svg(W, height, body, label);
}

// Per-video dumbbell: the user's % Genuine vs. the crowd's, grouped by truth.
// groups: [{ label, rows: [{ name, you, crowd }] }]  (you/crowd in 0–100)
export function youVsCrowd(groups, { label, width = DEFAULT_W }) {
  const W = width;
  const left = W < 450 ? 64 : 92;
  const right = W - 24;
  const rowH = 22;
  const headH = 30;
  const top = 6;
  const rowsTotal = groups.reduce((s, g) => s + g.rows.length, 0);
  const plotBottom = top + groups.length * headH + rowsTotal * rowH;
  const height = plotBottom + 30;
  const x = linear([0, 100], [left, right]);
  let body = percentAxis(x, top, plotBottom);
  let yCur = top;
  for (const g of groups) {
    body += `<text class="group-label" x="4" y="${yCur + 20}">${esc(g.label)}</text>`;
    yCur += headH;
    for (const r of g.rows) {
      const cy = yCur + rowH / 2;
      body += `<text class="row-label small" x="${left - 12}" y="${cy + 4}" text-anchor="end">${esc(r.name)}</text>
        <line class="link" x1="${x(r.you)}" x2="${x(r.crowd)}" y1="${cy}" y2="${cy}"/>
        <circle class="dot crowd" cx="${x(r.crowd)}" cy="${cy}" r="6"><title>${esc(r.name)} — crowd: ${pct(r.crowd)} genuine</title></circle>
        <circle class="dot you" cx="${x(r.you)}" cy="${cy}" r="6"><title>${esc(r.name)} — you: ${pct(r.you)} genuine</title></circle>`;
      yCur += rowH;
    }
  }
  return svg(W, height, body, label);
}
