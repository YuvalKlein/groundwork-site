# Source observations in Atlas

Continues consolidated PR #24 from `0290e5ce2205009ea811b5df0e873a084888f47f`.
The shared Atlas element renders additive server-supplied `observations` separately from the
existing anatomy graph. Both standalone Atlas and embedded Client OS consume the same element.
No direct source access, credentials, client-specific model, calculations, or inferred graph links.
Units, windows, unknown counts, timestamps, freshness, metric definitions and provenance are retained.
Missing values render Unknown; source errors never render zero. All supplied text is escaped.

The existing tenant-selected Atlas fetch and 404-only authorized-board fallback remain unchanged.
Workspace changes, authorization failures and logout clear observations along with the projection.
The shared `improvement-view.js` bundle is unchanged. The production API base is unchanged;
Preview continues targeting Dev. This does not activate any source or deploy the backend adapter.
Backend implementation and activation/role gates are documented in unitism-backend's
`docs/groundwork/atlas-observations.md`. Until it is deployed and explicitly configured, the
panel states that no source observations are supplied.

Tests use synthetic measurements only. No private business measurements are bundled in this public
repository. Keep draft until authenticated adapter-preview acceptance, source permissions and live
query verification are complete. Production merge/deployment requires explicit approval.

Local verification: 22 node tests, Preview build, and Chromium acceptance passed. Browser fixtures
exercise measurement rendering plus clearing on 403 and workspace switching; no private data is used.
