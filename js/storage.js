// Thin sessionStorage wrapper for the quiz state.
//
// The full state object is persisted after every answer so a mid-quiz refresh
// resumes at the same video with prior answers intact. sessionStorage is a
// deliberate choice: it is scoped to a single browser tab and clears when that
// tab closes, matching the session-only, no-PII privacy goal of the project.
//
// If sessionStorage is unavailable (e.g. some private-browsing modes throw on
// access), we fail soft to an in-memory fallback so the quiz still works for
// the life of the page — it just won't survive a reload in that edge case.

const KEY = "smile_test:quizState";

let memoryFallback = null;

export function saveState(state) {
  memoryFallback = state;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked/full — the in-memory copy above is our fallback.
  }
}

export function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall through to the in-memory copy.
  }
  return memoryFallback;
}

export function clearState() {
  memoryFallback = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing persisted; in-memory copy already cleared above.
  }
}
