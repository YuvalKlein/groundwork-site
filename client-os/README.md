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
