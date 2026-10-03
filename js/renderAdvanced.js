// DOM for the advanced mode: the probability-slider quiz screen and the
// six-step results walkthrough. Like render.js, it only receives plain data
// and callbacks from quiz.js. Copy is written for upper high school and
// first/second-year college students: formulas are shown, always next to a
// plain-words explanation.

import { COMBINED_ANSWER_IMAGE } from "../data/videos.js";
import { screen, renderPlayer, reviewListHtml } from "./render.js";
import { stripPlot, componentBars, calibrationPlot, scoreHistogram, youVsCrowd } from "./charts.js";

const f3 = (x) => x.toFixed(3);

// Draw charts at their on-screen width (see charts.js). Figures sit inside
// #app padding plus their own padding, hence the margin.
function chartWidth() {
  const app = document.getElementById("app");
  const inner = (app?.clientWidth || window.innerWidth) - 72;
  return Math.max(260, Math.min(600, Math.round(inner)));
}
const p0 = (x) => `${Math.round(x * 100)}%`;
const signed = (x, digits = 3) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(digits)}`;

// --- Slider quiz screen -----------------------------------------------------

function leaning(value) {
  if (value === 50) return "undecided";
  return value > 50 ? "leaning Genuine" : "leaning Fake";
}

export function renderSliderScreen({ video, index, total, onAnswer }) {
  const num = index + 1;
  const root = screen(`
    <section class="screen quiz">
      <div class="progress">
        <div class="progress-text">Video ${num} of ${total}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(num / total) * 100}%"></div>
        </div>
      </div>
      <div class="player">${renderPlayer(video)}</div>
      <p class="prompt" id="slider-prompt">How likely is it that this smile is genuine?</p>
      <div class="slider-wrap">
        <div class="slider-readout" aria-live="polite"><strong id="readout-value">50%</strong> <span id="readout-text">Move the slider to answer</span></div>
        <input class="prob-slider" id="prob" type="range" min="0" max="100" step="1" value="50"
          aria-labelledby="slider-prompt" aria-valuetext="50% genuine">
        <div class="slider-ends" aria-hidden="true">
          <span>0%<br><strong>Fake</strong></span>
          <span>50%</span>
          <span>100%<br><strong>Genuine</strong></span>
        </div>
      </div>
      <button class="btn btn-primary btn-lg next-btn" id="next-btn" type="button" disabled>Next →</button>
    </section>
  `);
  const slider = root.querySelector("#prob");
  const next = root.querySelector("#next-btn");
  const value = root.querySelector("#readout-value");
  const text = root.querySelector("#readout-text");
  slider.addEventListener("input", () => {
    const v = Number(slider.value);
    value.textContent = `${v}%`;
    text.textContent = leaning(v);
    slider.setAttribute("aria-valuetext", `${v}% genuine, ${leaning(v)}`);
    slider.style.setProperty("--fill", `${v}%`);
    next.disabled = false;
  });
  next.addEventListener("click", () => {
    if (!next.disabled) onAnswer(Number(slider.value));
  });
}

// --- Results walkthrough ----------------------------------------------------

const STEP_TITLES = [
  "How many did you get right?",
  "A better score: the Brier score",
  "What kind of mistakes? Breaking the score apart",
  "Calibration: do your percentages mean what they say?",
  "The wisdom of the crowd",
  "The answers",
];
export const RESULTS_STEPS = STEP_TITLES.length;

// Shared per-video rows: [{ video, i, prob, outcome, error }]
function itemRows(videos, answers, analysis) {
  return videos.map((video, i) => ({
    video,
    i,
    prob: answers[video.id].prob,
    outcome: analysis.d[i],
    error: analysis.errors[i],
  }));
}

function answerStrip(rows, { showMeans = false, cov = null } = {}) {
  const point = (r) => ({
    value: r.prob,
    filled: (r.outcome === 1 && r.prob >= 51) || (r.outcome === 0 && r.prob <= 49),
    title: `${r.video.label}: you said ${r.prob}%`,
  });
  return stripPlot(
    [
      { label: "Genuine smiles", short: "Genuine", cls: "genuine", points: rows.filter((r) => r.outcome === 1).map(point), mean: cov ? cov.f1Bar * 100 : null },
      { label: "Fake smiles", short: "Fake", cls: "fake", points: rows.filter((r) => r.outcome === 0).map(point), mean: cov ? cov.f0Bar * 100 : null },
    ],
    { width: chartWidth(), label: "Your answers on genuine and fake smiles", showMeans },
  );
}

const stripLegend = `
  <div class="legend">
    <span><i class="key key-genuine"></i>Genuine smile</span>
    <span><i class="key key-fake"></i>Fake smile</span>
    <span><i class="key key-filled"></i>counted correct</span>
    <span><i class="key key-hollow"></i>counted wrong</span>
  </div>`;

function stepCount({ score, analysis, rows }) {
  const fiftyNote = analysis.fifties
    ? `<div class="callout">
        <strong>About your ${analysis.fifties} answer${analysis.fifties === 1 ? "" : "s"} of exactly 50%:</strong>
        50% means “I have no idea”, so it doesn't pick a side and is counted as wrong.
        That's on purpose — otherwise you could “ace” the test by answering 50% every time.
        The Brier score on the next step handles 50% answers more fairly.
      </div>`
    : "";
  return `
    <p class="score">You got <strong>${score.totalCorrect}</strong> out of <strong>${score.totalCount}</strong> right.</p>
    <div class="prose">
      <p>In this version you didn't just say Genuine or Fake — you said <em>how likely</em> each smile was to be genuine.
      To count right answers, any answer of <strong>51% or more</strong> is treated as a vote for “Genuine”, and
      <strong>49% or less</strong> as a vote for “Fake”.</p>
    </div>
    ${fiftyNote}
    <figure class="figure">
      ${answerStrip(rows)}
      ${stripLegend}
      <figcaption>Each dot is one of your answers. On genuine smiles you want dots on the right of the 50% line; on fake smiles, on the left.</figcaption>
    </figure>
    <div class="prose">
      <p>But look at what this count ignores. Someone who said 95% on a genuine smile gets the same credit as someone who said 52% —
      and someone who said 99% on a fake smile loses no more than someone who said 51%. Being <em>sure</em> and being <em>barely</em>
      sure are treated the same. The next step fixes that.</p>
    </div>`;
}

function stepBrier({ analysis, rows }) {
  const ex = rows[0];
  const exF = ex.prob / 100;
  const tableRows = rows
    .map(
      (r) => `<tr>
        <td>${r.video.label}</td>
        <td>${r.prob}%</td>
        <td>${r.outcome} <span class="muted">(${r.outcome ? "genuine" : "fake"})</span></td>
        <td>(${(r.prob / 100).toFixed(2)} − ${r.outcome})² = ${f3(r.error)}</td>
      </tr>`,
    )
    .join("");
  return `
    <div class="prose">
      <p>Weather forecasters face the same problem: “70% chance of rain” isn't simply right or wrong. In 1950 the meteorologist
      Glenn Brier proposed a way to score probability forecasts, now called the <strong>Brier score</strong>.</p>
      <p>For each video, write your answer as a decimal <var>f</var> (62% → 0.62), and write what actually happened as
      <var>d</var> = 1 if the smile was genuine or 0 if it was fake. Your error on that video is the squared difference
      (<var>f</var> − <var>d</var>)². The Brier score is the average error over all 20 videos:</p>
      <p class="formula">Brier score = average of (<var>f</var> − <var>d</var>)²</p>
      <p><strong>Lower is better.</strong> Squaring means confident mistakes hurt a lot: on a genuine smile, saying 80% costs
      (0.8 − 1)² = 0.04 and saying 60% costs 0.16, but saying 10% costs 0.81.</p>
    </div>
    <div class="stat-row">
      <div class="stat stat-you"><div class="stat-num">${f3(analysis.brier)}</div><div class="stat-label">Your Brier score</div></div>
      <div class="stat"><div class="stat-num">0.250</div><div class="stat-label">Answering 50% every time</div></div>
      <div class="stat"><div class="stat-num">0</div><div class="stat-label">Perfect (100% / 0% and always right)</div></div>
    </div>
    <div class="prose">
      <p>The 0.25 benchmark matters: if your score is below 0.25, your answers carried real information. If it's above 0.25,
      you'd have done better by just saying 50% every time.
      ${analysis.brier < 0.25 ? "<strong>Your score beats that benchmark.</strong>" : "<strong>Your score didn't beat that benchmark this time</strong> — that's common with a hard task like this one."}</p>
      <p>Example from your answers: on ${ex.video.label} you said ${ex.prob}%, and the smile was ${ex.outcome ? "genuine (d = 1)" : "fake (d = 0)"},
      so your error was (${exF.toFixed(2)} − ${ex.outcome})² = ${f3(ex.error)}.</p>
    </div>
    <details class="details">
      <summary>Show the calculation for all 20 videos</summary>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Video</th><th>You said</th><th>Outcome <var>d</var></th><th>Error (<var>f</var> − <var>d</var>)²</th></tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot><tr><td colspan="3">Average = Brier score</td><td><strong>${f3(analysis.brier)}</strong></td></tr></tfoot>
        </table>
      </div>
    </details>`;
}

function biasReading(bias) {
  if (Math.abs(bias) < 0.05) return "You were well balanced — you didn't lean toward either answer overall.";
  return bias > 0
    ? `You leaned toward <strong>Genuine</strong>: your average answer was ${p0(0.5 + bias)}, but only 50% of the smiles were genuine.`
    : `You leaned toward <strong>Fake</strong>: your average answer was ${p0(0.5 + bias)}, but 50% of the smiles were genuine.`;
}

function slopeReading(slope) {
  if (slope < 0) return "Your slope is negative: on average you gave <em>higher</em> numbers to the fake smiles. Your instincts pointed the wrong way on this set.";
  if (slope < 0.1) return "Your slope is close to 0: your answers looked about the same for genuine and fake smiles, so they didn't separate the two much.";
  if (slope < 0.3) return "You separated genuine from fake smiles somewhat — a typical result for a hard task.";
  return "You separated genuine from fake smiles well — a strong result.";
}

function stepDecomp({ analysis, rows }) {
  const c = analysis.cov;
  return `
    <div class="prose">
      <p>One number can't tell you <em>why</em> you lost points. The statistician J. Frank Yates showed that the Brier score
      splits exactly into four parts, each describing a different kind of mistake:</p>
      <p class="formula">Brier = Var(<var>d</var>) + Bias² + Var(<var>d</var>)·Slope·(Slope − 2) + Scatter</p>
    </div>
    <figure class="figure">
      ${componentBars(
        [
          { label: "Task difficulty", value: c.varD, kind: "add" },
          { label: "Bias²", value: c.biasSq, kind: "add" },
          { label: "Slope term", value: c.slopeTerm, kind: "reduce" },
          { label: "Scatter", value: c.scatter, kind: "add" },
          { label: "= Brier score", value: c.total, kind: "total" },
        ],
        { width: chartWidth(), label: "Your Brier score broken into its four parts" },
      )}
      <div class="legend">
        <span><i class="key key-add"></i>adds error</span>
        <span><i class="key key-reduce"></i>removes error</span>
        <span><i class="key key-total"></i>total</span>
      </div>
      <figcaption>The parts add up exactly to your Brier score of ${f3(analysis.brier)}.</figcaption>
    </figure>
    <div class="cards">
      <div class="card">
        <h3>Task difficulty · Var(<var>d</var>) = ${f3(c.varD)}</h3>
        <p>The variance of the outcomes. With 10 genuine and 10 fake smiles it is 0.5 × 0.5 = <strong>0.25 for everyone</strong>.
        It's the difficulty built into the task — nothing you do changes it. Your skill shows up in the other three parts.</p>
      </div>
      <div class="card">
        <h3>Bias = ${signed(c.bias)} → Bias² = ${f3(c.biasSq)}</h3>
        <p>Bias = (your average answer) − (share of smiles that were genuine) = ${p0(c.fBar)} − ${p0(c.dBar)}.
        ${biasReading(c.bias)} Bias is squared, so small leans cost very little.</p>
      </div>
      <div class="card">
        <h3>Slope = ${f3(c.slope)} → slope term = ${signed(c.slopeTerm)}</h3>
        <p>Slope = (your average answer on genuine smiles) − (your average on fake smiles) = ${p0(c.f1Bar)} − ${p0(c.f0Bar)}.
        This is <strong>discrimination</strong>: telling the two kinds apart. A perfect judge has slope 1; a coin-flipper has 0.
        ${slopeReading(c.slope)} A bigger slope makes this term more negative, which <em>lowers</em> (improves) your score.</p>
      </div>
      <div class="card">
        <h3>Scatter = ${f3(c.scatter)}</h3>
        <p>How much your answers jumped around <em>within</em> each group — noise. If you said 90% on one genuine smile and 40% on
        another, that spread adds scatter. Lower is better: consistent answers mean less scatter.</p>
      </div>
    </div>
    <figure class="figure">
      ${answerStrip(rows, { showMeans: true, cov: c })}
      ${stripLegend}
      <figcaption>Slope is the distance between the two “avg” lines. Scatter is how spread out the dots are around each line.</figcaption>
    </figure>`;
}

function confidenceGap(rows) {
  // Confidence in the side you picked (50% = no side) vs. how often that side was right.
  const conf = rows.reduce((s, r) => s + Math.max(r.prob, 100 - r.prob), 0) / rows.length;
  const hit = (rows.filter((r) => (r.outcome === 1 && r.prob >= 51) || (r.outcome === 0 && r.prob <= 49)).length / rows.length) * 100;
  return { conf, hit, gap: conf - hit };
}

function stepCalibration({ analysis, rows }) {
  const m = analysis.murphy;
  const g = confidenceGap(rows);
  const verdict =
    Math.abs(g.gap) < 5
      ? "That's close — you were <strong>well calibrated</strong> overall."
      : g.gap > 0
        ? "You were <strong>overconfident</strong>: you felt surer than your hit rate justified. This is the most common pattern in research on judgment."
        : "You were <strong>underconfident</strong>: you were right more often than your answers suggested.";
  return `
    <div class="prose">
      <p>A forecaster is <strong>well calibrated</strong> if their numbers mean what they say: of all the times they say “70%”,
      it happens about 70% of the time. This is the bias-and-confidence question at the heart of judgment research.</p>
      <p>A quick check: on average you were <strong>${Math.round(g.conf)}%</strong> sure of the side you picked, and you picked the
      right side <strong>${Math.round(g.hit)}%</strong> of the time. ${verdict}</p>
    </div>
    <figure class="figure">
      ${calibrationPlot(m.bins, { width: chartWidth(), label: "Calibration curve: what you said vs. how often the smile was genuine" })}
      <figcaption>Each circle groups your answers rounded to the nearest 10% (bigger circle = more answers).
      Its height shows how many of those smiles were really genuine. Circles on the dashed line are perfectly calibrated.
      Circles to the right of 50% that sit <em>below</em> the line, or to the left that sit <em>above</em> it, mean overconfidence.</figcaption>
    </figure>
    <div class="prose">
      <p>The meteorologist Allan Murphy split the Brier score a different way, using these groups:</p>
      <p class="formula">Brier ≈ Var(<var>d</var>) + CI − DI</p>
      <ul>
        <li><strong>Calibration index (CI) = ${f3(m.ci)}</strong> — the average squared distance of the circles from the dashed line. Lower is better; 0 is perfect calibration.</li>
        <li><strong>Discrimination index (DI) = ${f3(m.di)}</strong> — how far each group's genuine-rate is from the overall 50%. Higher is better: it means your different answers really did sort the smiles.</li>
      </ul>
      <p>For you: ${f3(m.varD)} + ${f3(m.ci)} − ${f3(m.di)} = <strong>${f3(m.total)}</strong>, compared with your actual Brier score of
      ${f3(analysis.brier)}. They don't match exactly because your answers were rounded into groups first — that's why the
      “≈” is there, and why the Yates version on the previous step is the exact one.</p>
      <p class="muted"><strong>A word of caution:</strong> 20 answers is a small sample. Many groups hold only one or two smiles,
      so a single lucky or unlucky guess moves a circle a long way. Real calibration studies use hundreds of judgments per person.</p>
    </div>`;
}

function stepCrowd({ score, analysis, crowd, videos, answers }) {
  const total = crowd.nComplete;
  const below = crowd.scoreDistribution.slice(0, score.totalCorrect).reduce((s, c) => s + c, 0);
  const pctBelow = (below / total) * 100;
  const closest = crowd.perVideo.reduce((best, v, i) => {
    const margin = Math.abs(v.pctGenuine - 0.5);
    return margin < best.margin ? { margin, i, v } : best;
  }, { margin: Infinity });
  const closestVideo = videos[closest.i];
  const toRow = (video, i) => ({ name: video.label.replace("Video ", "#"), you: answers[video.id].prob, crowd: crowd.perVideo[i].pctGenuine * 100 });
  const groups = [
    { label: "Genuine smiles", rows: videos.map(toRow).filter((_, i) => analysis.d[i] === 1) },
    { label: "Fake smiles", rows: videos.map(toRow).filter((_, i) => analysis.d[i] === 0) },
  ];
  return `
    <div class="prose">
      <p>These same 20 clips were used in a long-running online survey. <strong>${total.toLocaleString()}</strong> people answered all
      20 (Genuine or Fake). On average they got <strong>${crowd.meanCorrect.toFixed(1)}</strong> right — about ${Math.round((crowd.meanCorrect / 20) * 100)}%.
      You got ${score.totalCorrect} — a higher score than ${pctBelow.toFixed(0)}% of them.</p>
    </div>
    <figure class="figure">
      ${scoreHistogram(crowd.scoreDistribution, { width: chartWidth(), you: score.totalCorrect, mean: crowd.meanCorrect, label: "How many people got each score, with your score marked" })}
      <figcaption>How many of the ${total.toLocaleString()} survey takers got each score. Your bar is highlighted.</figcaption>
    </figure>
    <div class="prose">
      <p>Now treat the whole survey as one judge: for each video, go with the <strong>majority vote</strong>. That “crowd” gets
      <strong>${crowd.majorityCorrect} out of 20</strong> right — better than almost every individual in it. The closest call was
      ${closestVideo.label}, where ${p0(closest.v.pctGenuine)} said Genuine (it was ${closestVideo.correctAnswer === "G" ? "genuine" : "fake"}).</p>
      <p>We can even give the crowd a Brier score: read the share of people who said “Genuine” as the crowd's probability. That gives
      <strong>${crowd.crowdBrier.toFixed(3)}</strong>, compared with your ${f3(analysis.brier)}.</p>
    </div>
    <div class="stat-row">
      <div class="stat stat-you"><div class="stat-num">${f3(analysis.brier)}</div><div class="stat-label">Your Brier score</div></div>
      <div class="stat"><div class="stat-num">${crowd.crowdBrier.toFixed(3)}</div><div class="stat-label">The crowd's Brier score</div></div>
      <div class="stat"><div class="stat-num">0.250</div><div class="stat-label">Answering 50% every time</div></div>
    </div>
    <figure class="figure">
      ${youVsCrowd(groups, { width: chartWidth(), label: "Your answer and the crowd's share saying Genuine, for each video" })}
      <div class="legend">
        <span><i class="key key-you"></i>You</span>
        <span><i class="key key-crowd"></i>Crowd (% who said Genuine)</span>
      </div>
      <figcaption>For genuine smiles the right answer is toward 100%; for fake smiles, toward 0%. Notice how the crowd's dots almost
      always land on the correct side of 50%, even when many individuals got that video wrong.</figcaption>
    </figure>
    <div class="prose">
      <p><strong>Why does this work?</strong> Each person's judgment is part signal (what a genuine smile really looks like) and part
      noise (personal quirks, a distracted moment). When many <em>independent</em> judgments are pooled, the noise points in random
      directions and mostly cancels out, while the signal adds up. In <em>The Wisdom of Crowds</em> (2004), James Surowiecki argues
      that crowds beat individuals when four conditions hold: <strong>diversity</strong> of opinion, <strong>independence</strong>
      (people don't copy each other), <strong>decentralization</strong> (people draw on their own knowledge), and a way to
      <strong>aggregate</strong> the answers — here, a simple vote.</p>
      <p class="muted">Note: the survey asked Genuine/Fake, not a percentage, so the crowd's “probability” is the share of votes.
      Survey figures use only the people who answered all 20 videos.</p>
    </div>`;
}

function stepAnswers({ videos, answers }) {
  return `
    <img class="combined" src="${COMBINED_ANSWER_IMAGE}" alt="All 20 answers at a glance" loading="lazy">
    <ul class="review-list">${reviewListHtml(videos, answers, (video, a) => `${a.prob}%`)}</ul>`;
}

const STEP_RENDERERS = [stepCount, stepBrier, stepDecomp, stepCalibration, stepCrowd, stepAnswers];

export function renderAdvancedResults({ step, score, analysis, crowd, videos, answers, onStep, onRestart }) {
  const rows = itemRows(videos, answers, analysis);
  const ctx = { score, analysis, crowd, videos, answers, rows };
  const last = step === RESULTS_STEPS - 1;
  const dots = STEP_TITLES.map(
    (t, i) => `<li class="${i === step ? "is-current" : i < step ? "is-done" : ""}"><span class="sr-only">${t}</span></li>`,
  ).join("");
  const root = screen(`
    <section class="screen results advanced">
      <div class="stepper">
        <div class="progress-text">Step ${step + 1} of ${RESULTS_STEPS}</div>
        <ol class="step-dots" aria-hidden="true">${dots}</ol>
      </div>
      <h1 class="title">${STEP_TITLES[step]}</h1>
      ${STEP_RENDERERS[step](ctx)}
      <nav class="step-nav">
        <button class="btn btn-secondary" id="back-btn" type="button" ${step === 0 ? "disabled" : ""}>← Back</button>
        ${
          last
            ? `<button class="btn btn-primary" id="restart-btn" type="button">Take the test again</button>`
            : `<button class="btn btn-primary" id="next-step-btn" type="button">Next: ${STEP_TITLES[step + 1]} →</button>`
        }
      </nav>
    </section>
  `);
  root.querySelector("#back-btn").addEventListener("click", () => onStep(step - 1));
  root.querySelector("#next-step-btn")?.addEventListener("click", () => onStep(step + 1));
  root.querySelector("#restart-btn")?.addEventListener("click", onRestart);
}
