# /discover/: conversation-first discovery

An owner describes the business in their own words and watches a provisional map emerge. No sign-in, no form, nothing
to connect. Files: `discover/` (page, `discovery-view.mjs` pure helpers, `discovery-client.mjs` live + preview clients),
`tests/discover.test.mjs`.

## How it fits

- **Backend:** unitism-backend `/api/v1/groundwork/discovery/*` (PR #1286, `docs/groundwork/discovery.md` there). Every
  rule lives there: what counts as stated, what a correction may change, what is rejected, the spend caps. The page
  only shows its answers.
- **Map:** after each turn the page reads the conversation's `groundwork-workspace-seed/1` draft (`GET …/seed`), turns
  it into the Atlas projection (`seedToProjection`) and hands it to the existing `<groundwork-living-atlas>`
  (`client-os/living-atlas.js`, unchanged). Retracted parts are not in the seed, so they are not drawn; they stay in the
  side panel and the history.
- **How we know it:** stated / inferred (Groundwork's guess) / contested (in doubt) / retracted (removed by you), with the
  owner's quote where there is one. Owner figures are shown as "Your figure, not verified". Open questions are labelled
  suggestions, not findings. Changes the backend could not apply are listed as "Couldn't apply".
- **Corrections:** "Correct" on a part or handoff puts "About …:" in the message box; the owner's words go through the
  normal turn and the backend's rules (a stated opposite direction puts the guessed one in doubt).

## Modes

- **Preview** (`?preview`, or any build without an API base): scripted replies, no AI, no network, nothing saved. Use
  `&fail=503|404|409|429|network` to see each error state.
- **Live** (preview/production builds with an API base): calls the backend. Until PR #1286 is deployed and
  `GROUNDWORK_DISCOVERY_ENABLED=true` on that environment, starting a conversation shows "isn't open yet" with a link
  to the preview.

## Before it is public

Bot protection (e.g. Turnstile, verified by the backend on `POST sessions`) and a reviewed abuse plan. The backend caps
spend per conversation and per day, but a free anonymous AI endpoint must not go live without it.
