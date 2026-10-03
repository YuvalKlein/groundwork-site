# Groundwork

Groundwork is an application/service/product that uses Business Anatomy; it does not define Business Anatomy.

Business Anatomy = model of the business organism
Groundwork = observes / diagnoses / discovers opportunities / prioritizes / intervenes / measures / learns

## Source-of-truth boundaries

- Before designing or changing business ontology/domain concepts, read the connected/local business-anatomy repository's AGENTS.md, README.md, relevant canonical chapters and current versioned schema. Do not create a competing ontology for concepts that already exist canonically. Record the model/schema version used; never claim an unavailable source was inspected.
- Keep descriptive business state (Business Anatomy) separate from Groundwork operational/intervention state: observations, diagnoses, opportunities, priorities, interventions, improvement-cycle runs, impact evidence, and learning/recommendations. Link intervention records to descriptive records using stable references.
- UX/product convenience does not justify changing canonical theory. Do not silently mutate Business Anatomy from this repository. When a case challenges it, record a structured research finding/gap for review there: canonical concept/version, case/workspace, source/locator, observation versus interpretation, uncertainty/conflict, proposed question/change, and review state. Findings are not automatically canonical.
- Fresh Air is the first real pilot. Use its repository as implementation/case data, but do not hard-code the reusable engine around it or promote client-specific schemas to the shared ontology.
- Prefer one shared reusable domain/source of truth and workspace/business isolation over duplicated client implementations. Keep shared backend validation, evidence arithmetic and state rules authoritative; the UI must not invent parallel domain rules.
- Preserve impact evidence labels: **Measured / Estimated / Expected / Not measured-Baseline needed**. Never present expected or estimated impact as measured. Retain baseline, metric/version, scope/window, source, method and assumptions; missing evidence is an explicit gap, not zero or a claimed outcome.

## Reading and routing

Verified local repositories are under /Users/yuvalklein/dev. On another machine/worktree, resolve the corresponding connected checkout by repository identity; do not assume a sibling exists or treat an exported snapshot as authority.

| Task | Repository / entry points |
|---|---|
| Business ontology / model / unit boundary | /Users/yuvalklein/dev/business-anatomy (YuvalKlein/business-anatomy): AGENTS.md, README.md, chapters/02-business-holon.md, chapters/02a-business-holon-schema.md; follow its reading map |
| Groundwork product / service behavior | This repo: /Users/yuvalklein/dev/groundwork-site (YuvalKlein/groundwork-site), index.html; where present, client-os/README.md and system/README.md |
| Shared backend / runtime architecture | /Users/yuvalklein/dev/unitism-backend (YuvalKlein/unitism-backend) plus this repo; inspect its instructions and docs/groundwork/continuous-improvement.md when available |
| Fresh Air-specific data / UI / integration | /Users/yuvalklein/dev/freshair-analytics (YuvalKlein/freshair-analytics); inspect its instructions and implementation, keeping reusable domain shared |
| Lobby / customer intelligence | /Users/yuvalklein/dev/lobby-web (YuvalKlein/lobby-web), only when relevant; inspect its instructions first |

Some pilot documentation/implementation may be local or pending commit. Verify availability and branch before relying on it. If a required canonical source is unavailable, report the gap before making dependent conceptual changes.

## Repository discipline

Inspect existing instructions, status and relevant documentation before editing. Preserve unrelated local work and stage only task-owned changes. Keep service credentials out of client code; respect the app-registration/callback approval requirement documented in client-os/README.md when present. Where the shared Client OS bundle exists, preserve its documented exact-byte sync contract with Fresh Air rather than forking client implementations. Documentation-only changes need git diff --check and referenced-path validation; use relevant repository checks when behavior changes.
