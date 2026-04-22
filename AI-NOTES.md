# AI usage notes

This document describes how AI tooling (GitHub Copilot / Claude) was used while building this app, per the user story's `CLAUDE.md / AI-NOTES.md` requirement.

## What was AI-generated

- **Scaffolding files** (inbox, request-form, request-detail component shells, CSS layouts) were drafted with AI assistance and then reviewed and tightened by hand.
- **Seed data** — the 18 example requests in `src/app/services/seed-data.ts` were generated as realistic-sounding placeholders and hand-edited for variety across categories (bug / data / access / feature / integration / security / infra / docs).
- **README architecture diagram and scaling section** were drafted with AI help and then edited to match what this repository actually does (rather than the full-stack version described in the user story).

## What was written (or heavily rewritten) by hand

- `RuleBasedClassifier` — the keyword lists, priority signals, tag-building heuristic, and summary truncation are hand-tuned. AI suggestions here tended to over-generalise (too many synonyms producing false-positive categories), so the keyword sets were trimmed back.
- `TfIdfSimilarity` — the TF-IDF vector build, cosine, and "shared key terms" reasoning were written by hand. An AI-suggested version used a flat Jaccard overlap, which produced poor rankings on short text; TF-IDF with IDF-weighted shared-term reasoning gave much better results on the seed set.
- `STATUS_TRANSITIONS` and `TriageService.changeStatus()` — the state-machine semantics (no skipping, limited backward transitions, terminal `Closed`) were specified by hand so the unit tests could pin the rules.
- The Promise-chain "worker" (`workerTail`) — AI initially suggested `setTimeout(() => classify(), 0)` per submission, which would have broken FIFO ordering. Overridden with a single-worker Promise chain to model the `BackgroundService` + `Channels` semantics called for in the user story.

## Where AI suggestions were overridden

- **Similarity scoring display.** AI defaulted to showing a raw cosine score (e.g. `0.4217`). Overridden to render as a percent via `PercentPipe` because that reads more naturally to a non-engineer triage lead.
- **Seed volume.** AI offered to generate 50+ seed requests; capped at 18 per the "15–20 example requests" requirement.
- **Tests.** AI initially produced snapshot-style tests against the rendered HTML. Replaced with behaviour-focused unit tests targeting the classifier, similarity engine, and status-transition rules — matching what the user story explicitly calls out ("Unit tests on the API covering the classification logic, similarity logic, and the status transition rules").

## Commit history

Commits have been kept small and scoped (plan → scaffolding → service → components → tests → docs) rather than a single squashed dump, per the non-functional expectations in the user story.
EOF