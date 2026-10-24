// Living Atlas: turn the Atlas projection into systems (views), parts and flows. Pure and read-only.
// Nothing is inferred from names or layout: a flow is shown only where the map records one, and a value only
// where the backend linked an observation to that part or flow ("measures" link).
import { list } from "./atlas-data.mjs";

export function buildLivingMap(data) {
  const views = list(data?.views).filter((v) => v && typeof v.key === "string");
  if (!views.length) return null;
  const viewKeys = new Set(views.map((v) => v.key));
  const entities = list(data.entities).filter((e) =>
    list(e?.properties?.atlas?.views).some((v) => viewKeys.has(v)),
  );
  if (!entities.length) return null;
  const observations = new Map(list(data.observations).map((o) => [o.id, o]));
  const measuredBy = new Map();
  for (const l of list(data.observation_links))
    if (l.type === "measures" && observations.has(l.origin_entity_id))
      measuredBy.set(l.target_id, observations.get(l.origin_entity_id));
  const cards = new Map(list(data.improvement_refs).map((c) => [c.id, c]));
  const ids = new Set(entities.map((e) => e.id));
  const parts = entities.map((e) => {
    const atlas = e.properties.atlas;
    const inViews = list(atlas.views).filter((v) => viewKeys.has(v));
    return {
      id: e.id,
      name: e.name,
      type: e.entity_type,
      description: e.properties.description ?? "",
      views: inViews,
      home: inViews[0],
      declared: !!atlas.measure,
      measured: measuredBy.get(e.id) ?? null,
      cards: list(atlas.card_ids).map((id) => cards.get(id)).filter(Boolean),
    };
  });
  const flows = list(data.relationships)
    .filter((r) => r && r.id && viewKeys.has(r.view) && ids.has(r.from) && ids.has(r.to))
    .map((r) => ({
      id: r.id,
      from: r.from,
      to: r.to,
      view: r.view,
      type: r.type,
      item: r.item ?? r.type,
      declared: !!r.measure,
      measured: measuredBy.get(r.id) ?? null,
    }));
  return { views, parts, flows, status: data.observation_status ?? "not_enabled" };
}

/** A measured value for display, or null when there is none. Null is never shown as zero. */
export function valueOf(observation) {
  if (!observation || observation.value === null || observation.value === undefined) return null;
  const n = Number(observation.value);
  if (!Number.isFinite(n)) return null;
  return observation.unit === "usd" ? "$" + n.toLocaleString("en-US") : n.toLocaleString("en-US");
}
export const numberOf = (o) => (o && o.value !== null && o.value !== undefined && Number.isFinite(Number(o.value)) ? Number(o.value) : null);
