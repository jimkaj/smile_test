// Core quiz engine + flow controller.
//
// Owns the in-memory quiz state and orchestrates persistence (storage.js) and
// rendering (render.js). It is NOT DOM-aware itself — every bit of DOM work is
// delegated to render.js, which is handed plain data and callbacks.
//
// State shape:
//   {
//     sessionId,          // random UUID for the aggregate-mode payload
//     videoIndex,         // index of the NEXT unanswered video
//     answers: { [videoId]: { chosen: "G"|"F", correct: bool } },
//     startedAt,          // ISO timestamp
//     finished,           // bool
//     submitted,          // bool — guards against double-submit on refresh
//   }

import { VIDEOS } from "../data/videos.js";
import { loadState, saveState, clearState } from "./storage.js";
import { renderIntro, renderVideoScreen, renderSummary } from "./render.js";
import { submitResults } from "./submit.js";

let state = null;

// Entry point, called once from app.js. Resumes a saved session if present,
// otherwise shows the intro.
export function start() {
  state = loadState();
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

function initState() {
  return {
    sessionId:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2),
    videoIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    finished: false,
    submitted: false,
  };
}

function begin() {
  state = initState();
  saveState(state);
  showCurrentVideo();
}

function showCurrentVideo() {
  const video = VIDEOS[state.videoIndex];
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
  state.videoIndex += 1;
  if (state.videoIndex >= VIDEOS.length) {
    state.finished = true;
  }
  saveState(state);
  route();
}

function showSummary() {
  const score = computeScore();
  // Submit once, ever, per finished session — guarded so refreshing the
  // summary screen does not fire submitResults again.
  if (!state.submitted) {
    submitResults(buildPayload(score));
    state.submitted = true;
    saveState(state);
  }
  renderSummary({
    score,
    videos: VIDEOS,
    answers: state.answers,
    onRestart: restart,
  });
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

function buildPayload(score) {
  return {
    sessionId: state.sessionId,
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    totalCorrect: score.totalCorrect,
    totalCount: score.totalCount,
    categoryBreakdown: computeCategoryBreakdown(),
    answers: VIDEOS.map((v) => ({
      videoId: v.id,
      chosen: state.answers[v.id]?.chosen ?? null,
      correct: state.answers[v.id]?.correct ?? null,
    })),
  };
}
