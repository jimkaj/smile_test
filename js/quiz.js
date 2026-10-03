// Core quiz engine + flow controller.
//
// Owns the in-memory quiz state and orchestrates persistence (storage.js) and
// rendering (render.js). It is NOT DOM-aware itself — every bit of DOM work is
// delegated to render.js, which is handed plain data and callbacks.
//
// State shape:
//   {
//     sessionId,          // random UUID for the aggregate-mode payload
//     mode,               // "basic" | "advanced" (missing in old saves = basic)
//     videoIndex,         // index of the NEXT unanswered video
//     answers: { [videoId]: { chosen: "G"|"F"|null, correct: bool, prob? } },
//                         // advanced only: prob = slider value 0–100;
//                         // chosen = G if ≥ 51, F if ≤ 49, null at 50 (wrong)
//     resultsStep,        // advanced only: current results walkthrough step
//     startedAt,          // ISO timestamp
//     finished,           // bool
//     submitted,          // bool — guards against double-submit on refresh
//   }

import { VIDEOS } from "../data/videos.js";
import { CROWD } from "../data/crowd_data.js";
import { loadState, saveState, clearState } from "./storage.js";
import { renderIntro, renderVideoScreen, renderSummary } from "./render.js";
import { renderSliderScreen, renderAdvancedResults, RESULTS_STEPS } from "./renderAdvanced.js";
import { toOutcome, brierScore, perItemErrors, covarianceDecomp, murphyDecomp } from "./brier.js";
import { submitResults } from "./submit.js";

let state = null;

// Entry point, called once from app.js. Resumes a saved session if present,
// otherwise shows the intro.
export function start() {
  state = loadState();
  if (state && !state.mode) state.mode = "basic";
  route();
}

function route() {
  if (!state) {
    renderIntro({ onBegin: begin });
  } else if (state.finished) {
    showSummary();
  } else {
    showCurrentVideo();
  }
}

function initState(mode) {
  return {
    mode,
    sessionId:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2),
    videoIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    finished: false,
    submitted: false,
    resultsStep: 0,
  };
}

function begin(mode = "basic") {
  state = initState(mode === "advanced" ? "advanced" : "basic");
  saveState(state);
  showCurrentVideo();
}

function showCurrentVideo() {
  const video = VIDEOS[state.videoIndex];
  if (state.mode === "advanced") {
    renderSliderScreen({
      video,
      index: state.videoIndex,
      total: VIDEOS.length,
      onAnswer: (prob) => answerProbability(video, prob),
    });
    return;
  }
  renderVideoScreen({
    video,
    index: state.videoIndex,
    total: VIDEOS.length,
    onAnswer: (chosen) => answer(video, chosen),
  });
}

function answer(video, chosen) {
  const correct = chosen === video.correctAnswer;
  state.answers[video.id] = { chosen, correct };
  advance();
}

// Advanced mode: prob is the slider value, 0–100. 50 is neither side, so it
// is scored as wrong.
function answerProbability(video, prob) {
  const chosen = prob >= 51 ? "G" : prob <= 49 ? "F" : null;
  state.answers[video.id] = { prob, chosen, correct: chosen === video.correctAnswer };
  advance();
}

function advance() {
  state.videoIndex += 1;
  if (state.videoIndex >= VIDEOS.length) {
    state.finished = true;
  }
  saveState(state);
  route();
}

function showSummary() {
  const score = computeScore();
  const analysis = state.mode === "advanced" ? computeAnalysis() : null;
  // Submit once, ever, per finished session — guarded so refreshing the
  // summary screen does not fire submitResults again.
  if (!state.submitted) {
    submitResults(buildPayload(score, analysis));
    state.submitted = true;
    saveState(state);
  }
  if (analysis) {
    renderAdvancedResults({
      step: state.resultsStep ?? 0,
      score,
      analysis,
      crowd: CROWD,
      videos: VIDEOS,
      answers: state.answers,
      onStep: goToStep,
      onRestart: restart,
    });
    return;
  }
  renderSummary({
    score,
    videos: VIDEOS,
    answers: state.answers,
    onRestart: restart,
  });
}

function goToStep(step) {
  state.resultsStep = Math.max(0, Math.min(RESULTS_STEPS - 1, step));
  saveState(state);
  showSummary();
}

function restart() {
  clearState();
  state = null;
  renderIntro({ onBegin: begin });
}

function computeScore() {
  const totalCorrect = Object.values(state.answers).filter(
    (a) => a.correct,
  ).length;
  return { totalCorrect, totalCount: VIDEOS.length };
}

// Everything the advanced results walkthrough needs, computed once from the
// answers. f = judgments as 0–1, d = outcomes (1 = Genuine), in VIDEOS order.
function computeAnalysis() {
  const f = VIDEOS.map((v) => state.answers[v.id].prob / 100);
  const d = VIDEOS.map((v) => toOutcome(v.correctAnswer));
  return {
    f,
    d,
    brier: brierScore(f, d),
    errors: perItemErrors(f, d),
    cov: covarianceDecomp(f, d),
    murphy: murphyDecomp(f, d),
    fifties: VIDEOS.filter((v) => state.answers[v.id].prob === 50).length,
  };
}

function computeCategoryBreakdown() {
  const breakdown = {};
  for (const video of VIDEOS) {
    if (!video.category) continue;
    const a = state.answers[video.id];
    if (!a) continue;
    const bucket = (breakdown[video.category] ??= { correct: 0, count: 0 });
    bucket.count += 1;
    if (a.correct) bucket.correct += 1;
  }
  return breakdown;
}

function buildPayload(score, analysis) {
  return {
    sessionId: state.sessionId,
    mode: state.mode,
    brierScore: analysis ? analysis.brier : null,
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    totalCorrect: score.totalCorrect,
    totalCount: score.totalCount,
    categoryBreakdown: computeCategoryBreakdown(),
    answers: VIDEOS.map((v) => ({
      videoId: v.id,
      chosen: state.answers[v.id]?.chosen ?? null,
      correct: state.answers[v.id]?.correct ?? null,
      prob: state.answers[v.id]?.prob ?? null,
    })),
  };
}
