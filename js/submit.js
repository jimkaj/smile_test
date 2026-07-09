// Aggregate-mode extension point.
//
// v1 ships this as a NO-OP. Quiz results therefore live only in the user's own
// browser (in-memory + sessionStorage) for the life of the tab, and are never
// sent anywhere or written into this (public) repo.
//
// submitResults() is called exactly once, fire-and-forget, the moment the quiz
// finishes (see js/quiz.js). It is guarded there so a refresh on the summary
// screen does not re-submit.
//
// PAYLOAD CONTRACT (deliberately no PII):
//   {
//     sessionId,          // random per-session UUID, not tied to any identity
//     startedAt,          // ISO timestamp
//     finishedAt,         // ISO timestamp
//     totalCorrect,       // number
//     totalCount,         // number (20)
//     categoryBreakdown,  // { [category]: { correct, count } } — {} if unused
//     answers: [ { videoId, chosen: "G"|"F"|null, correct: bool|null } ]
//   }
//
// TO ENABLE CROSS-USER COLLECTION LATER: replace only this function's body —
// no other file needs to change. Recommended target is a Google Sheets +
// Apps Script Web App doPost endpoint: no infrastructure to provision, and the
// only exposed credential is a POST-only URL (not a write-capable API key).
// e.g.
//   await fetch(ENDPOINT_URL, {
//     method: "POST",
//     body: JSON.stringify(payload),
//     headers: { "Content-Type": "text/plain;charset=utf-8" },
//   });

export function submitResults(payload) {
  // No-op in v1. Keep the signature stable for the future backend.
  void payload;
  return Promise.resolve();
}
