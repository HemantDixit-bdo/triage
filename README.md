# Intake — Internal Request Triage (Angular)

A lightweight triage / intake SPA built with **Angular 21** (standalone components, signals). It lets a DT&I team lead capture ad-hoc requests, auto-classify them, surface similar past requests, and move items through a well-defined status workflow.

> **Scope note.** The original user story describes a full-stack reference implementation (React SPA + .NET 10 Minimal API + SQL Server LocalDB + BackgroundService + Ollama + …). This repository is Angular-only, so the backend concerns (classifier, similarity engine, async queue, audit log, CSV export) are implemented **in-process, in the browser**. The separation-of-concerns between UI, queue, worker, classifier, and storage is preserved so the pieces map 1-to-1 onto the described backend when/if one is introduced. See "Design decisions" below.

---

## Architecture

```
 ┌───────────────────────────────────────────────────────────────┐
 │                        Angular SPA                            │
 │                                                               │
 │   ┌───────────┐     ┌────────────────┐     ┌──────────────┐   │
 │   │  Inbox    │────▶│  Request       │◀────│  Request     │   │
 │   │ (list +   │     │  Detail        │     │  Form        │   │
 │   │ filters)  │     │ (status,       │     │ (submit)     │   │
 │   │           │     │  similar,      │     │              │   │
 │   │           │     │  history)      │     │              │   │
 │   └─────┬─────┘     └────────┬───────┘     └──────┬───────┘   │
 │         │                    │                    │           │
 │         └──────────┬─────────┴────────────────────┘           │
 │                    ▼                                          │
 │          ┌──────────────────────┐      ┌──────────────────┐   │
 │          │   TriageService      │─────▶│  Classifier      │   │
 │          │  (signal store,      │      │  (rule-based)    │   │
 │          │  in-memory queue,    │      └──────────────────┘   │
 │          │  audit history,      │      ┌──────────────────┐   │
 │          │  CSV export)         │─────▶│  TF-IDF          │   │
 │          └──────────────────────┘      │  Similarity      │   │
 │                    │                   └──────────────────┘   │
 │                    ▼                                          │
 │                  seed-data.ts (18 examples)                   │
 └───────────────────────────────────────────────────────────────┘
```

| Concern in the user story        | Where it lives in this app                                  |
| -------------------------------- | ----------------------------------------------------------- |
| Submit endpoint returns 202      | `TriageService.submit()` returns an id synchronously and enqueues classification on a Promise-chain worker |
| `BackgroundService` + `Channels` | `TriageService.workerTail` Promise chain — a single worker processes one request at a time |
| `IClassifier` interface          | `Classifier` interface + `RuleBasedClassifier` (default)    |
| Similarity engine                | `TfIdfSimilarity` (TF-IDF cosine, in-process)               |
| Status transition rules + audit  | `STATUS_TRANSITIONS` + `TriageService.changeStatus()` appending `StatusHistoryEntry` |
| Database seed on first run       | `SEED_REQUESTS` (18 examples) loaded in the service constructor |
| CSV / "gold layer" export        | `TriageService.exportCsv()` + "Export CSV" button in inbox  |
| Unit tests                       | `*.spec.ts` for classifier, similarity, and status transitions |

---

## Project structure

```
src/app/
├── app.ts / app.html / app.css       # shell component (header + router outlet)
├── app.config.ts                     # providers, router
├── app.routes.ts                     # route table
├── models/
│   ├── triage.models.ts              # types, enums, STATUS_TRANSITIONS
│   └── triage.models.spec.ts
├── services/
│   ├── triage.service.ts             # store, queue, CSV export
│   ├── classifier.ts                 # Classifier interface + RuleBasedClassifier
│   ├── classifier.spec.ts
│   ├── similarity.ts                 # TF-IDF cosine similarity
│   ├── similarity.spec.ts
│   └── seed-data.ts                  # 18 example requests
└── components/
    ├── inbox/                        # list + filters + CSV export
    ├── request-form/                 # submit a new request
    └── request-detail/               # classification, status, history, similar
```

---

## Getting started

### Prerequisites
- Node.js ^20.19, ^22.12, or >=24
- npm 10+

### Install & run
```bash
npm install
npm start        # dev server at http://localhost:4200
```

### Build for production
```bash
npm run build
```

### Run unit tests
```bash
npm test
```

---

## Features

- **Request Inbox** — lists all requests with status, priority, and category badges.
- **Filtering** — by status, priority, category, and free-text search (title / description / tags / requester / business unit).
- **Submit form** — captures title, description, requester, business unit, and optional context (code / log / doc).
- **Async classification** — submission returns immediately; a background Promise-chain worker produces category, priority (Low/Medium/High), a one-sentence summary, and 3–5 suggested tags. The UI shows a "classifying…" badge while the worker runs.
- **Similar past requests** — detail page shows top-3 similar requests with a similarity score (percent) and reasoning ("Shared key terms: …").
- **Status workflow** — `New → In Review → In Progress → Resolved → Closed`, with limited backward transitions (review ↔ new, progress ↔ review, resolved ↔ progress). Illegal transitions are rejected at the service level.
- **Audit history** — every status change records actor, timestamp, from, to. Visible on the detail page.
- **CSV export** — "Export CSV" button on the inbox produces a flat file of all requests (see "Gold layer" note below).
- **Seeds 18 example requests** on first run so the inbox is never empty.
- **Responsive** for a laptop; filter bar wraps on smaller widths.

---

## Design decisions

1. **Angular standalone + signals + `ChangeDetectionStrategy.OnPush`** throughout. No `NgModules`. The data model lives as a signal in `TriageService`; components subscribe via `computed()` for filtered/derived views.
2. **Similarity algorithm: TF-IDF cosine.** Chosen over BM25 or embeddings because it is:
   - Fully in-process, zero dependencies.
   - Deterministic — same input gives the same ranking, which matters for a reference implementation.
   - Good-enough for short request text (a few sentences). BM25 would win on longer documents; embeddings would win on paraphrases but require a model (ONNX) and a much heavier bundle.
3. **Classifier pluggability.** `Classifier` is an interface and `RuleBasedClassifier` is the default. A `LocalLlmClassifier` (calling Ollama) can be added by implementing the same interface and swapping it inside `TriageService`; nothing else changes.
4. **Async classification without a real queue.** A Promise chain (`workerTail`) acts as an in-memory FIFO worker with concurrency = 1. The UI never blocks on classification — submission returns an id right away, the worker updates the store when it finishes, and signals flow the update into the detail and inbox views.
5. **Status transitions as data, not code.** `STATUS_TRANSITIONS` is a `Record<RequestStatus, RequestStatus[]>`; the service and UI both consume it, which keeps rules in one place and easy to test.
6. **Parameterised everywhere.** User input is never concatenated into a query; the "query" here is the in-memory filter pipeline, which operates on typed fields, and the TF-IDF tokenizer strips punctuation before matching. There is no SQL surface in this build.
7. **Seed on bootstrap.** `TriageService` constructor submits the 18 seed requests through the same `submit()` path, so they exercise the same classification pipeline as user-submitted requests.

### Gold layer export
`GET` equivalent: the "Export CSV" button. Downstream, a gold-layer consumer would:
- Land the CSV in a lake/warehouse staging table.
- Join `category` and `priority` onto business-unit and SLA tables for triage-rate and time-to-resolve KPIs.
- Feed `tags` into a topic-modelling refresh to watch for emerging themes.

---

## What I'd do with more time
- Swap the in-memory store for a real backend (the described .NET 10 Minimal API + EF Core + LocalDB) and move `TriageService` into an HTTP client.
- Add an `LocalLlmClassifier` that calls `http://localhost:11434` (Ollama) with a small instruction prompt and falls back to the rule-based classifier on error.
- Replace the Promise-chain worker with `BackgroundService` + `System.Threading.Channels` on the server.
- Add a "bulk reassign / bulk status-change" action to the inbox.
- Persist filter state to the URL (query params) so views are shareable.
- Add end-to-end tests with Playwright for the submit → classify → similar flow.
- Replace TF-IDF with an ONNX MiniLM embedding model for better paraphrase recall.

---

## Scaling to 5,000 users and a real broker
- **Frontend.** Angular SPA served from a CDN behind long-cache hashed filenames. SSR or hydration isn't needed — this is an internal tool.
- **API.** Horizontally scale the .NET Minimal API stateless-ly behind a load balancer. Replace the in-memory channel with **Azure Service Bus / RabbitMQ / Kafka** (or Dapr pub/sub for broker portability). The submit handler becomes a simple publisher; a separate **classification worker** deployment consumes the topic.
- **Database.** Move from LocalDB to a managed SQL Server / Postgres with a read replica for the inbox list view; introduce outbox pattern between the API and the broker to avoid double-writes.
- **Similarity at scale.** TF-IDF stops scaling beyond a few thousand documents because every query recomputes the corpus. Replace with a persistent index (pgvector / OpenSearch BM25 / Qdrant) populated by the classification worker.
- **Classification at scale.** Keep the `IClassifier` interface but run the LLM classifier behind a pool (vLLM / Ollama cluster) with per-tenant rate limits and graceful fallback to the rule-based classifier.
- **Observability.** Keep the structured-JSON logging contract (Serilog on the server, a matching JSON logger in the browser shipped to the backend). Add OpenTelemetry traces on the publish → consume → persist path so the async workflow is debuggable.
- **AuthN/Z.** OIDC in front of the API, plus a per-business-unit authorisation layer on the inbox query.
- **Audit history.** The `RequestStatusHistory` table already captures the primitives; index on `(request_id, changed_at)` and expose via a cursor-paginated endpoint for long-running requests.

---

## AI usage notes

See [`AI-NOTES.md`](./AI-NOTES.md) for how AI tooling was used during development.
