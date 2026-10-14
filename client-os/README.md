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

Meeting recordings, 13 Oct 2026: owner and editor. The bundle reads `GET /call-sources` and `GET /calls/awaiting` and
writes `POST /call-sources`, `PATCH|DELETE /call-sources/ID`, `POST /call-sources/ID/sync`, `POST /calls/ID/send|skip`
through the `request` event. Hosts must refuse all of these to readers: they name attendees and hold the connection.

## Authentication deployment and Dev verification (13 Oct 2026)

The callback uses the existing UNITISM `/api/v1/platform/auth/magic-link/verify`
endpoint. It clears the URL before resource loads, verifies in place, stores only
`access_token` in sessionStorage, and redirects to `/client-os/` without credentials.
The initial email URL still contains the backend-issued query token: hosting logs
must redact that query. Referrer-Policy and no-store do not erase edge access logs.
Missing, duplicate, empty and non-Groundwork slugs fail closed.

Run `node --test tests/*.test.mjs`. Vercel (project `groundwork`, team yuval-kleins-projects) runs
`node scripts/build.mjs` and serves `dist`. The API base is public and set by environment: Preview →
`https://unitism-backend-dev.up.railway.app/api/v1`, Production → `https://unitism-backend-production.up.railway.app/api/v1`.
`GROUNDWORK_API_BASE` overrides either; a Production build refuses the Dev API. A plain static copy of the source stays
unconfigured. The shared improvement-view.js bundle is unchanged.

### Hosts and backend settings (14 Oct 2026)

- Production `groundwork-woad.vercel.app`; Dev `groundwork-dev-yuval-kleins-projects.vercel.app` (behind Vercel SSO,
  so only team members can open it). Both are allowlisted host-exact in the backend (#1093).
- Backend `GROUNDWORK_MAGIC_LINK_URL` lives in `src/config/settings/platform.settings.ts` (#1098), `<host>/auth/verify/`.
- Backend `CORS_ORIGIN` (Railway, per environment) must list the frontend origin.
- The backend, not this client, keeps call notes and the review queue editor-only (#1094): a signed-in owner or
  reader calls the API directly, with no host in between to filter.
