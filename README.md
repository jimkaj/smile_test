# The Smile Test

A small browser quiz: can you tell a **genuine** smile from a **posed** one? Watch 20 short clips, judge each as Genuine or Fake, then see how you scored — and compare yourself against tens of thousands of other people who've taken the same test.

No installation, no login, no build step. It's a static site meant to be hosted on GitHub Pages.

## Background

The video clips were originally created by psychologist Dr. Paul Ekman for his research into facial expression. Some of the smiles are genuine and spontaneous; others are posed on request. The two have a real physical difference — a genuine ("Duchenne") smile engages the muscles around the eyes as well as the mouth, and those eye muscles are hard to control voluntarily, so a posed smile often lacks that engagement or looks forced.

The clips were once featured on the BBC website as a public test of this skill, and later formed the basis of a long-running research survey that collected tens of thousands of responses and was used to study the "wisdom of crowds" and overconfidence bias in judgment and decision-making. See `docs/Kajdasz_Eschen_W200_Project2_Final.pdf` for the full write-up (Kajdasz & Eschen, 2018).

## How it works

1. **Intro** — a short history of the test, then "Begin the Smile Test!"
2. **Quiz** — 20 videos, one at a time. Pick Genuine or Fake for each; no going back.
3. **Summary** — your score, plus a full answer reveal with the correct answer for every video.
4. **Explore the Crowd** *(optional, from the summary screen)* — compare yourself against ~94,000 real responses to the original survey, through three interactive demos:
   - **Wisdom of the Crowd** — simulate random groups of respondents and watch accuracy climb with group size.
   - **T-test demo** — compare two groups' scores (e.g. gender, or professional experience "reading" people) with a live independent-samples t-test.
   - **Correlation explorer** — see how confidence and actual performance relate (the overconfidence-bias finding from the original research).

## Status

This repo is under active development. The video manifest (`data/videos.js`), answer-key images, and the crowd-response dataset pipeline are planned/in progress; the app itself (`index.html`, `js/*`, `styles.css`) has not been built yet. See `CLAUDE.md` for the current build status and full architecture notes.

## Project structure

```
index.html          Page shell, mounts js/app.js
styles.css           Styling for all screens
js/
  app.js             Entry point, screen dispatch
  quiz.js            Quiz state and scoring
  storage.js         sessionStorage persistence
  render.js           All DOM rendering (intro/quiz/summary/explore screens)
  submit.js          Aggregate-mode extension point (no-op by default)
  crowdStats.js      Stats helpers for the crowd-exploration screen
data/
  videos.js          Video manifest: URLs, correct answers, answer images
  crowd_data.js      Anonymized crowd-response dataset (generated, not hand-edited)
  Smile*.jpg          Per-video and combined answer-key images
scripts/
  build_crowd_data.py Generates data/crowd_data.js from the raw survey export
docs/                Reference material (original research write-up)
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
{ id: "v01", label: "Video 1", sourceType: "youtube", url: "...", correctAnswer: "G", answerImage: "data/Smile01Answer.jpg" }
```

- `correctAnswer` is always the literal `"G"` (Genuine) or `"F"` (Fake) — this is what scoring compares against, regardless of button text.
- `sourceType` is `"youtube"` (unlisted embed) or `"direct"` (a plain `<video>` tag pointing at an external CDN URL).
- **Never commit video files to this repo.** Host them externally (YouTube unlisted, or a CDN) and reference the URL here — GitHub blocks files over 100MB and warns above 50MB, and git keeps every past version of a binary forever.

## Hosting

Deployed via GitHub Pages, **Settings → Pages → Deploy from a branch → `master` / root**. No build step, no GitHub Actions workflow, no `/docs` folder needed.

## Aggregate results

By default, quiz results exist only in the user's own browser for the duration of their session (`sessionStorage`, cleared when the tab closes) and are never sent anywhere. `js/submit.js` exports a `submitResults(payload)` function that's a no-op stub in v1 — it's the single extension point for wiring up cross-user result collection later (e.g. a Google Sheets + Apps Script Web App endpoint), without any PII and without touching any other file.

## Crowd-response data

`data/crowd_data.js` is a small, anonymized dataset derived from a raw SurveyMonkey export of ~94,000 real responses to the original survey. The raw export contains respondent IP addresses and is **never committed** to this (public) repo — it's excluded via `.gitignore`.

To regenerate `data/crowd_data.js` from a fresh raw export:

```sh
uv run scripts/build_crowd_data.py
```

The script strips every identifying column (IDs, IP address, email, name, timestamps) and keeps only what the crowd-exploration screen needs: gender, age, career experience, confidence estimate, each of the 20 answers, and a computed correct-answer count.

## Credits

Smile videos and the genuine/posed smile research: Dr. Paul Ekman. The "Duchenne smile" distinction: Guillaume Duchenne. Survey design and crowd-wisdom/overconfidence analysis: James Kajdasz & Kyle Eschen, *"How Videos of People Smiling Can Explore the Psychology of Judgment and Decision Making"* (2018) — see `docs/Kajdasz_Eschen_W200_Project2_Final.pdf`.
