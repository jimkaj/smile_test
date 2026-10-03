// All DOM rendering. Each render function fully replaces the contents of
// <main id="app"> and wires up its own event handlers via the callbacks it is
// passed. This module is deliberately the ONLY place that touches the DOM;
// quiz.js hands it plain data and callbacks.

import { DEFAULT_OPTION_LABELS, COMBINED_ANSWER_IMAGE } from "../data/videos.js";

export function screen(html) {
  const root = document.getElementById("app");
  root.innerHTML = html;
  window.scrollTo(0, 0);
  return root;
}

function optionLabels(video) {
  return { ...DEFAULT_OPTION_LABELS, ...(video.optionLabels || {}) };
}

export function labelFor(video, code) {
  const labels = optionLabels(video);
  if (code === "G") return labels.g;
  if (code === "F") return labels.f;
  return "—";
}

// --- Intro screen -----------------------------------------------------------

export function renderIntro({ onBegin }) {
  const root = screen(`
    <section class="screen intro">
      <h1 class="title">The Smile Test <span aria-hidden="true">🙂</span></h1>
      <p class="lead">Can you tell a real smile from a fake one?</p>
      <div class="prose">
        <p>
          The clips in this test were created by psychologist Dr. Paul Ekman for
          his research on facial expression. Some of the smiles are genuine and
          spontaneous — filmed while people watched clips of playful baby
          animals. Others were simply posed on request.
        </p>
        <p>
          There is a real physical difference between the two. A genuine smile —
          a <em>“Duchenne”</em> smile, after the French neurologist who first
          described it — engages the muscles around the eyes as well as the
          mouth. Those eye muscles are hard to move on purpose, so a posed smile
          often lacks that crinkle, or looks a little forced.
        </p>
        <p>
          You'll watch <strong>20 short clips</strong> and judge each one:
          genuine or fake? In the original online survey, people who finished
          all 20 got about 15 right on average (74%). See how you do — then
          find out the answers.
        </p>
      </div>
      <h2 class="section-title">Choose your test</h2>
      <div class="mode-cards">
        <div class="mode-card">
          <h3>The Smile Test</h3>
          <p>Watch each clip and tap <strong>Genuine</strong> or <strong>Fake</strong>. Quick, fun, and for everyone.</p>
          <button class="btn btn-primary btn-lg" type="button" data-mode="basic">Begin the Smile Test!</button>
        </div>
        <div class="mode-card">
          <h3>Advanced: probability &amp; statistics</h3>
          <p>Say <em>how sure</em> you are with a 0–100% slider. Afterwards, learn how forecasters are scored (the Brier score), what kinds of mistakes you make, and why crowds beat individuals.</p>
          <button class="btn btn-secondary btn-lg" type="button" data-mode="advanced">Begin the advanced test</button>
        </div>
      </div>
    </section>
  `);
  root.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => onBegin(btn.dataset.mode));
  });
}

// --- Quiz screen ------------------------------------------------------------

export function renderPlayer(video) {
  if (video.sourceType === "direct") {
    // autoplay requires muted (browser policy). No controls attribute: a
    // plain <video> has no title/logo/branding chrome to begin with, so
    // nothing needs suppressing (unlike the YouTube embed case below).
    return `<video class="video-frame" src="${video.url}" autoplay muted playsinline></video>`;
  }
  // YouTube embed (fallback, currently unused by any entry in videos.js).
  // autoplay=1 needs mute=1 — browsers block autoplay with sound, so the
  // clip starts muted and the viewer can unmute in-player. A fresh iframe is
  // created per video, so each one autoplays as the user advances.
  // Distraction-reducing params: controls=0 (no control bar/logo),
  // disablekb=1 (no keyboard scrubbing), iv_load_policy=3 (no annotations),
  // rel=0 (end-screen suggestions limited to the same channel).
  // NOTE: none of these params remove the hover title/channel bar, share
  // icon, or logo watermark YouTube draws whenever the player is paused or
  // loading — that chrome is baked into the embed itself and cannot be
  // suppressed from the parent page. See CLAUDE.md.
  const params =
    "autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&iv_load_policy=3";
  const src = video.url + (video.url.includes("?") ? "&" : "?") + params;
  return `<iframe
      class="video-frame"
      src="${src}"
      title="${video.label}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>`;
}

export function renderVideoScreen({ video, index, total, onAnswer }) {
  const labels = optionLabels(video);
  const num = index + 1;
  const pct = (num / total) * 100;
  const root = screen(`
    <section class="screen quiz">
      <div class="progress">
        <div class="progress-text">Video ${num} of ${total}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="player">${renderPlayer(video)}</div>
      <p class="prompt">Is this smile genuine or fake?</p>
      <div class="choices">
        <button class="btn btn-genuine" type="button" data-choice="G">${labels.g}</button>
        <button class="btn btn-fake" type="button" data-choice="F">${labels.f}</button>
      </div>
    </section>
  `);
  root.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => onAnswer(btn.dataset.choice));
  });
}

// --- Summary screen ---------------------------------------------------------

function scoreBlurb({ totalCorrect, totalCount }) {
  const pct = totalCorrect / totalCount;
  if (pct >= 0.9) return "Remarkable — you have a real eye for this.";
  if (pct >= 0.8) return "Great result, above average.";
  if (pct >= 0.65) return "Right around where most people land.";
  if (pct >= 0.5) return "A coin flip would get about 10 — you're in that range.";
  return "A tricky set — these smiles fool a lot of people.";
}

// Per-video answer review list. formatYours(video, answer) lets the advanced
// mode show "62%" instead of "Genuine".
export function reviewListHtml(videos, answers, formatYours = (video, a) => labelFor(video, a.chosen)) {
  return videos
    .map((video) => {
      const a = answers[video.id] || {};
      const yours = formatYours(video, a);
      const truth = labelFor(video, video.correctAnswer);
      const ok = !!a.correct;
      return `
        <li class="review-row ${ok ? "is-correct" : "is-wrong"}">
          <img class="thumb" src="${video.answerImage}" alt="Answer key for ${video.label}" loading="lazy">
          <div class="review-meta">
            <div class="review-label">${video.label}</div>
            <div class="review-answers">
              <span class="badge">You: ${yours}</span>
              <span class="badge">Answer: ${truth}</span>
              <span class="mark" aria-hidden="true">${ok ? "✓" : "✗"}</span>
              <span class="sr-only">${ok ? "correct" : "incorrect"}</span>
            </div>
          </div>
        </li>`;
    })
    .join("");
}

export function renderSummary({ score, videos, answers, onRestart }) {
  const rows = reviewListHtml(videos, answers);

  const root = screen(`
    <section class="screen summary">
      <h1 class="title">Your Results</h1>
      <p class="score">You got <strong>${score.totalCorrect}</strong> out of <strong>${score.totalCount}</strong> correct.</p>
      <p class="score-sub">${scoreBlurb(score)}</p>

      <h2 class="section-title">The answers</h2>
      <img class="combined" src="${COMBINED_ANSWER_IMAGE}" alt="All 20 answers at a glance" loading="lazy">

      <h2 class="section-title">Answer by answer</h2>
      <ul class="review-list">${rows}</ul>

      <div class="summary-actions">
        <button class="btn btn-primary btn-lg" id="restart-btn" type="button">Take the test again</button>
      </div>
    </section>
  `);
  root.querySelector("#restart-btn").addEventListener("click", onRestart);
}
