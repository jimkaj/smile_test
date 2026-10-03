# The Smile Test

A small browser quiz: can you tell a **genuine** smile from a **posed** one? Watch 20 short clips, judge each as Genuine or Fake, then see how you scored — and compare yourself against tens of thousands of other people who've taken the same test.

No installation, no login, no build step. It's a static site meant to be hosted on GitHub Pages.

## Background

The video clips were originally created by psychologist Dr. Paul Ekman for his research into facial expression. Some of the smiles are genuine and spontaneous; others are posed on request. The two have a real physical difference — a genuine ("Duchenne") smile engages the muscles around the eyes as well as the mouth, and those eye muscles are hard to control voluntarily, so a posed smile often lacks that engagement or looks forced.

The clips were once featured on the BBC website as a public test of this skill, and later formed the basis of a long-running research survey that collected tens of thousands of responses and was used to study the "wisdom of crowds" and overconfidence bias in judgment and decision-making. See `docs/Kajdasz_Eschen_W200_Project2_Final.pdf` for the full write-up (Kajdasz & Eschen, 2018).

## How it works

The intro screen offers two versions of the test:

- **The Smile Test** — 20 videos, one at a time. Pick Genuine or Fake for each; no going back. Then see your score and the answer for every video.
- **Advanced: probability & statistics** — the same 20 videos, but you answer with a 0–100% "how likely is this genuine?" slider. Afterwards a six-step walkthrough (written for upper high school / early college students) covers:
  1. Number correct (51%+ counts as Genuine, 49%− as Fake, 50% counts as wrong).
  2. Your **Brier score** and how it's calculated.
  3. The Yates **covariance decomposition** of that score — task difficulty, bias, slope (discrimination), scatter.
  4. **Calibration** — a calibration curve and the Murphy calibration/discrimination indices.
  5. The **wisdom of the crowd** — your score against 67,427 real survey respondents; the crowd's majority vote gets 20/20.
  6. The answers.

## Status

Both modes are built. Remaining: enable GitHub Pages.

## Project structure

```
index.html          Page shell, mounts js/app.js
styles.css           Styling for all screens
js/
  app.js             Entry point, screen dispatch
  quiz.js            Quiz state and scoring
  storage.js         sessionStorage persistence
  render.js          DOM rendering: intro, basic quiz, basic summary
  renderAdvanced.js  DOM rendering: slider quiz, advanced results walkthrough
  charts.js          Inline-SVG chart builders (no chart library)
  brier.js           Brier score + covariance and Murphy decompositions
  submit.js          Aggregate-mode extension point (no-op by default)
data/
  videos.js          Video manifest: URLs, correct answers, answer images
  crowd_data.js      Aggregate crowd statistics (generated, not hand-edited)
  smilecontent-qNN.mp4  The 20 video clips
  Smile*.jpg         Per-video and combined answer-key images
scripts/
  build_crowd_data.py Generates data/crowd_data.js from the raw survey export
tests/
  brier.test.html    Browser test page for brier.js (workbook sample data)
docs/                Reference material (research write-ups, proposal, Brier workbook)
```

## Running locally

Plain static site, no build step. Serve the repo root with any static file server and open it over `http://` (ES module `<script>` tags require `http://`, not `file://`):

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Adding or editing videos

Videos are defined in `data/videos.js` as a `VIDEOS` array. Each entry looks like:

```js
{ id: "v01", label: "Video 1", sourceType: "direct", url: "data/smilecontent-q01.mp4", correctAnswer: "G", answerImage: "data/Smile01Answer.jpg" }
```

- `correctAnswer` is always the literal `"G"` (Genuine) or `"F"` (Fake) — this is what scoring compares against, regardless of button text.
- `sourceType` is `"direct"` (a plain `<video>` tag) for all current entries, pointing at the clips committed in `data/`. `"youtube"` (unlisted embed) is still supported but unused, because YouTube's embed chrome can't be hidden.

## Hosting

Deployed via GitHub Pages, **Settings → Pages → Deploy from a branch → `master` / root**. No build step, no GitHub Actions workflow, no `/docs` folder needed.

## Aggregate results

By default, quiz results exist only in the user's own browser for the duration of their session (`sessionStorage`, cleared when the tab closes) and are never sent anywhere. `js/submit.js` exports a `submitResults(payload)` function that's a no-op stub in v1 — it's the single extension point for wiring up cross-user result collection later (e.g. a Google Sheets + Apps Script Web App endpoint), without any PII and without touching any other file.

## Crowd-response data

`data/crowd_data.js` holds **aggregate statistics only** — per-video share answering Genuine, the distribution of scores, the mean, and the crowd's majority-vote and Brier scores — derived from a raw SurveyMonkey export of the original survey (respondents who answered all 20 videos). No per-respondent rows are shipped. The raw export contains respondent IP addresses and is **never committed** to this (public) repo — it's excluded via `.gitignore`.

To regenerate `data/crowd_data.js` from the raw export:

```sh
uv run scripts/build_crowd_data.py
```

## Credits

Smile videos and the genuine/posed smile research: Dr. Paul Ekman. The "Duchenne smile" distinction: Guillaume Duchenne. Survey design and crowd-wisdom/overconfidence analysis: James Kajdasz & Kyle Eschen, *"How Videos of People Smiling Can Explore the Psychology of Judgment and Decision Making"* (2018) — see `docs/Kajdasz_Eschen_W200_Project2_Final.pdf`.
