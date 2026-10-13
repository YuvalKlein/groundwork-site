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

Run `node --test tests/*.test.mjs`. Vercel runs `node scripts/build.mjs` and serves
`dist`. Preview builds use `https://unitism-backend-dev.up.railway.app/api/v1`.
`GROUNDWORK_API_BASE` is a public build-time override. Production remains
unconfigured unless explicitly set, and a Production build refuses the Dev API.
The source config.js remains blank for direct/static hosting; use the build for Dev.
The shared improvement-view.js bundle is unchanged.

### Pending Dev setup — do not apply Railway changes before the host is ready

Proposed stable Dev host: `groundwork-dev.unitism.world`. This is a new proposed
host, not a verified existing deployment. The backend already trusts unitism.world
subdomains; this avoids adding arbitrary Vercel tenants to its token allowlist.

1. In Vercel project `groundwork` (`prj_bOk6OPXluhKhApOVlChsMym1HUwv`), attach
   `groundwork-dev.unitism.world` to the Preview branch
   `feat/groundwork-magic-link-callback`. Add the DNS record Vercel specifies.
   Ensure the domain serves this branch, not main, and email recipients can open
   the preview under its deployment-protection policy. Verify TLS and config.js.
2. In Railway UNITISM / Dev / unitism-backend, review staged patch
   `557935d9-c364-4bea-bade-a58c49018e2b`. It contains ONLY:
   - GROUNDWORK_MAGIC_LINK_URL=https://groundwork-dev.unitism.world/auth/verify/
   - Existing CORS_ORIGIN preserved, with https://groundwork-dev.unitism.world appended.
   These changes have NOT been applied. Apply only once step 1 is verified.
3. Confirm preflight allows that exact origin and a new email request succeeds.
   Use a tester-controlled mailbox; no real email was sent in this audit.
4. Open the link: verify the URL clears, the JWT session works, and only granted
   workspaces appear. Test logout, expired links, replay (must return 401), and
   wrong-app links. No-workspace is a valid authenticated result; a workspace
   administrator must grant membership to test the real board. Do not bypass auth.
5. Keep PR #11 Draft until the real email/session/workspace flow passes. Production
   requires a separately tested backend release on main, its own API configuration,
   CORS entry and GROUNDWORK_MAGIC_LINK_URL. Do not merge this PR to enable Dev.

Live Dev smoke checks: health 200, invalid Groundwork verification 401,
unauthenticated workspace list 401, localhost preflight 204. The existing production
frontend origin failed Dev preflight (404 with no allow-origin). Vercel connector
listed the project but denied deployment reads (403/404); no Vercel CLI is installed.
