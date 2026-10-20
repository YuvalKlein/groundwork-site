# Atlas consolidation — 21 October 2026

Draft for review. No release authorization, merge to main, or production deployment.

## Preserved work

Starting main: `cd8e52bce2d68899035f8d3f34aa19d7d7a3593a`.
Both original heads are merge ancestors, not discarded patches:

| Original | Head | Preserved behavior |
| --- | --- | --- |
| #9 | `989487ed9dd6d209a6fabfec663b14cf372193e5` | Embedded cards and selected-record details; authorized board fallback on Atlas HTTP 404 only |
| #17 | `c1b85407c9fc414e64713ab3fb73075c9e4742ce` | Standalone map, entity-type filters, keyboard selection, refresh, clearing on transition/error, stale-response protection, shipped-script parsing checks |

Both routes now use one `groundwork-atlas` component and one read adapter. Map and cards share the same record IDs, filters and details. The embedded host preserves current main's consultant home, authentication, Hebrew shell, agreements, FormData uploads and blob downloads. `improvement-view.js` remains byte-identical to main and Fresh Air's shared bundle.

Additional repairs: object-shaped provenance is retained rather than tested as an array; incoming and outgoing relationships retain their evidence; relationship endpoint aliases are consistent; unresolved/filtered links are counted; SVG height grows with the records; arrows indicate stored direction. Evidence is not reduced to “verified” merely because a source exists. Empty sources do not mean integrations are disconnected.

## Canonical boundary

Inspected committed Business Anatomy `99df49c639cab3e44710389c327cfe74d8f5594b`: README; Business Holon chapter 02; schema 02a; graph 03; measurement 07; Atlas 13. Business Anatomy v0.1.1 clarification candidate / Holon Schema 0.1 remains human-review-pending. Local uncommitted theory changes were not adopted.

The UI is a projection, not a new ontology or data store. It retains each record's model/schema/record version and evidence. Position, node size and line width encode no health or magnitude. No universal health score, invented provider-to-unit mapping, inferred causal edges, metric arithmetic, historical reconstruction or parallel opportunity engine.

## Cross-repository audit

Backend #1063 is already merged (`d9cdb040...`) and is an ancestor of main `93317599136acaad927f9d5fadf04a409c023796`. Its old PR description saying “documentation only” is stale: the current source includes a membership-checked read-only Atlas endpoint. The actual payload uses `origin_entity_id`, existing anatomy records and research gaps, and an empty sources registry. The illustrative JSON in `docs/groundwork/atlas-platform-contract.md` is not the runtime contract. Current endpoint tests passed (2).

Fresh Air #11 is already merged (`1759cfe5...`) and is an ancestor of main `5f08a19950a3371806e3dacdeb9299236758800d`. Its adapter `web/lib/atlasPilotData.ts` reads qualified lead-date cohorts from `fct_flow_v1`, over 30 America/Chicago dates. It does not provide a universal graph, paid-lead CPL denominator, advertising-click attribution, or historical graph snapshots. Source counts do not establish individual campaign-to-lead edges. The private data verification is reported separately; no client measurements are bundled in this public site.

No open Atlas backend/Fresh Air PR remains to consolidate. Unrelated backend #1130 and Fresh Air #78 were left untouched.

## Verification and release gates

- `node --test tests/*.test.mjs` (19 tests, including preview/production configuration and shipped syntax).
- `node scripts/build.mjs` with `VERCEL_ENV=preview`.
- `git diff --check` and shared-bundle exact-byte check.
- `NODE_PATH=<playwright installation> CHROME_PATH=<Chrome binary> node tests/browser-atlas.cjs`: actual browser, localhost and synthetic data only. Exercises anonymous access, map/cards, keyboard details, escaping, object provenance, research gaps, filters, 404 fallback, 403 clearing and embedded board switching.
- Backend Atlas authorization/projection tests on the audited main snapshot (2 tests).

Still required: authenticated real-workspace acceptance on the remote preview, role/tenant acceptance with real accounts, an authorized server-side adapter for Fresh Air observations, and explicit production-release approval. Current backend sources are empty; this PR does not claim Fresh Air metrics are ingested into Groundwork. Live aggregate verification alone does not establish a deployed frontend integration or causal attribution. Existing dated outage reports must not be hard-coded as current state.
