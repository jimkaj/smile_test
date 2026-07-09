// All DOM rendering. Each render function fully replaces the contents of
// <main id="app"> and wires up its own event handlers via the callbacks it is
// passed. This module is deliberately the ONLY place that touches the DOM;
// quiz.js hands it plain data and callbacks.

import { DEFAULT_OPTION_LABELS, COMBINED_ANSWER_IMAGE } from "../data/videos.js";

function screen(html) {
  const root = document.getElementById("app");
  root.innerHTML = html;
  window.scrollTo(0, 0);
  return root;
}

function optionLabels(video) {
  return { ...DEFAULT_OPTION_LABELS, ...(video.optionLabels || {}) };
}

function labelFor(video, code) {
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
          genuine or fake? Most people get about 13–14 right. See how you do —
          then find out the answers.
        </p>
      </div>
      <button class="btn btn-primary btn-lg" id="begin-btn" type="button">
        Begin the Smile Test!
      </button>
    </section>
  `);
  root.querySelector("#begin-btn").addEventListener("click", onBegin);
}

// --- Quiz screen ------------------------------------------------------------

export function renderPlayer(video) {
  if (video.sourceType === "direct") {
    // autoplay requires muted (browser policy); viewer can unmute via controls.
    return `<video class="video-frame" src="${video.url}" autoplay muted playsinline controls></video>`;
  }
  // YouTube embed (default). autoplay=1 needs mute=1 — browsers block autoplay
  // with sound, so the clip starts muted and the viewer can unmute in-player.
  // rel=0 keeps related videos to the same channel; a fresh iframe is created
  // for each video, so each one autoplays as the user advances.
  const params = "autoplay=1&mute=1&playsinline=1&rel=0";
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
  if (pct >= 0.75) return "Great result, well above average.";
  if (pct >= 0.6) return "Right around where most people land.";
  if (pct >= 0.5) return "A coin flip would get about 10 — you're in that range.";
  return "A tricky set — these smiles fool a lot of people.";
}

export function renderSummary({ score, videos, answers, onRestart }) {
  const rows = videos
    .map((video) => {
      const a = answers[video.id] || {};
      const yours = labelFor(video, a.chosen);
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
        <p class="soon">Coming soon: explore how ~94,000 other people answered, and see the “wisdom of the crowd” in action.</p>
      </div>
    </section>
  `);
  root.querySelector("#restart-btn").addEventListener("click", onRestart);
}
