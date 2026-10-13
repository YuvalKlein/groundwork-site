# Groundwork Client OS

Reusable dependency-free improvement view backed by the shared UNITISM Projects API.
`index.html` provides workspace selection and the pending Groundwork magic-link sign-in client.
Set only public API settings in config.js. App registration and owned callback allowlisting
require the explicit approval requested in this task; standalone login is unconfigured meanwhile.
No service credential belongs in this directory.

The canonical shared UI is improvement-view.js. Sync its exact bytes into Fresh Air with
`python3 sync-to-freshair.py /path/to/freshair-analytics`; `--check` fails on drift.
The UI delegates all validation, evidence arithmetic and state rules to the backend.

See unitism-backend/docs/groundwork/continuous-improvement.md for setup, tests, backfill and limitations.

Schema alignment, 3 Oct 2026: Business view consumes read-only `anatomy` and `research_findings`;
editable work is only Opportunity/Task. No business ontology or impact arithmetic lives in this UI.
Unknown ratings remain unassessed; the server enforces measurement design before execution.

Board editing, 12 Oct 2026 (unitism-backend groundwork-os-build-plan.md Phases 1–2): each card shows its value sign-off,
missing required fields (`gaps`), comments, a proposal form for the owner and editor archive/restore. Calls other than
board/save/settings/history go out as one `request` event `{method, path, body, done(err, result)}`, where `path` is
relative to the workspace (`/proposals`, `/nodes/ID/approval`, `/nodes/ID/comments`, `/nodes/ID/archive|restore`); each
host maps it to its own proxy. Buttons follow `board.role` and each state's `allowed_roles`; the backend decides.

Review queue, 13 Oct 2026 (plan Phase 4): editor only. The bundle loads `GET /candidates` through the same `request` event
and decides with `POST /candidates/ID/accept|attach|dismiss` and `PATCH /candidates/ID`. A rejected idea from a call needs a
reason (the backend refuses one without). `board.call_log` shows decisions and commitments per call, also editor only,
because both name people. Hosts must not pass either to readers or the owner.
