// Probability-scoring math for the advanced mode. Pure functions, no DOM.
//
// Conventions: f is an array of probability judgments in [0, 1] (slider / 100),
// d is the matching array of outcomes (1 = Genuine, 0 = Fake). The Brier score
// is the 0–1 form: mean of (f − d)², lower is better.
//
// Formulas follow docs/BrierDecomp.xlsm (Yates covariance decomposition and
// Murphy decomposition) — EXCEPT the workbook's CI sheet, which uses the wrong
// bin value for the 0.2/0.4/0.6/0.8 bins. murphyDecomp() uses the correct ones.
// Verified against the workbook's sample data by tests/brier.test.html.

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

// Population variance (Excel VARP).
function varP(xs) {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
}

export function toOutcome(code) {
  return code === "G" ? 1 : 0;
}

export function perItemErrors(f, d) {
  return f.map((fi, i) => (fi - d[i]) ** 2);
}

export function brierScore(f, d) {
  return mean(perItemErrors(f, d));
}

// Yates covariance decomposition. Exact:
//   Brier = Var(d) + Bias² + Var(d)·Slope·(Slope − 2) + Scatter
export function covarianceDecomp(f, d) {
  const n = f.length;
  const f1 = f.filter((_, i) => d[i] === 1);
  const f0 = f.filter((_, i) => d[i] === 0);
  const fBar = mean(f);
  const dBar = mean(d);
  const f1Bar = f1.length ? mean(f1) : 0;
  const f0Bar = f0.length ? mean(f0) : 0;
  const varD = dBar * (1 - dBar);
  const bias = fBar - dBar;
  const slope = f1Bar - f0Bar;
  const scatter = (f1.length * varP(f1) + f0.length * varP(f0)) / n;
  const slopeTerm = varD * slope * (slope - 2);
  return {
    varD,
    bias,
    biasSq: bias * bias,
    slope,
    slopeTerm,
    scatter,
    fBar,
    dBar,
    f1Bar,
    f0Bar,
    total: varD + bias * bias + slopeTerm + scatter,
  };
}

// Round to the nearest 0.1, halves away from zero (Excel ROUND(f, 1)).
// Done via integers to dodge float error (0.35 * 10 = 3.4999…).
function binIndex(fi) {
  return Math.round(Math.round(fi * 1000) / 100);
}

// Murphy decomposition over 11 judgment bins (0, 0.1, … 1):
//   Brier ≈ Var(d) + CI − DI
// Exact only when every judgment sits exactly on a bin value, so with slider
// answers it differs slightly from brierScore().
export function murphyDecomp(f, d) {
  const n = f.length;
  const dBar = mean(d);
  const bins = Array.from({ length: 11 }, (_, k) => ({ value: k / 10, n: 0, hits: 0 }));
  f.forEach((fi, i) => {
    const bin = bins[binIndex(fi)];
    bin.n += 1;
    bin.hits += d[i];
  });
  let ci = 0;
  let di = 0;
  for (const bin of bins) {
    if (!bin.n) continue;
    bin.dBar = bin.hits / bin.n;
    ci += bin.n * (bin.value - bin.dBar) ** 2;
    di += bin.n * (bin.dBar - dBar) ** 2;
  }
  ci /= n;
  di /= n;
  const varD = dBar * (1 - dBar);
  return {
    varD,
    ci,
    di,
    bins: bins.filter((b) => b.n).map(({ value, n: count, dBar: binDBar }) => ({ value, n: count, dBar: binDBar })),
    total: varD + ci - di,
  };
}
