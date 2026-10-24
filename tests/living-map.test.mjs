import test from "node:test";
import assert from "node:assert/strict";
import { buildLivingMap, valueOf } from "../client-os/living-map.mjs";

const views = [{ key: "value_flow", name: "Customer flow", question: "?" }, { key: "resources_finance", name: "Money flow", question: "?" }];
const part = (id, v, extra = {}) => ({ id, name: id.toUpperCase(), entity_type: "Process", properties: { description: "d", atlas: { views: v, ...extra } } });
const projection = () => ({
  views,
  entities: [
    part("a", ["value_flow"], { card_ids: ["c1", "gone"], measure: { adapter: "x", key: "calls" } }),
    part("b", ["value_flow", "resources_finance"]),
    part("m", ["resources_finance"]),
    { id: "old", entity_type: "Objective", name: "Old record", properties: {} },
  ],
  relationships: [
    { id: "f1", from: "a", to: "b", view: "value_flow", type: "transfers", item: "leads", measure: { adapter: "x", key: "leads" } },
    { id: "f2", from: "m", to: "a", view: "resources_finance", type: "transfers", item: "spend", measure: { adapter: "x", key: "spend" } },
    { id: "f3", from: "a", to: "old", view: "value_flow", type: "transfers", item: "not a map part" },
    { id: "f4", from: "a", to: "b", view: "unknown_view", type: "transfers" },
    { id: "f5", from: "a", to: "b", type: "serves" },
  ],
  observations: [
    { id: "o1", key: "leads", value: 1171, unit: "rows" },
    { id: "o2", key: "spend", value: null, unit: "usd" },
    { id: "o3", key: "calls", value: 1629, unit: "calls" },
  ],
  observation_links: [
    { type: "metric_reference", origin_entity_id: "o1", target_id: "metric" },
    { type: "measures", origin_entity_id: "o1", target_id: "f1" },
    { type: "measures", origin_entity_id: "o2", target_id: "f2" },
    { type: "measures", origin_entity_id: "o3", target_id: "a" },
  ],
  improvement_refs: [{ id: "c1", title: "Fix calls", status: "Measuring" }],
  observation_status: "available",
});

test("builds parts and flows only from the recorded map", () => {
  const m = buildLivingMap(projection());
  assert.deepEqual(m.parts.map((p) => [p.id, p.home]), [["a", "value_flow"], ["b", "value_flow"], ["m", "resources_finance"]]);
  assert.deepEqual(m.flows.map((f) => f.id), ["f1", "f2"]);
  assert.equal(m.parts[0].cards.length, 1);
  assert.equal(m.parts[0].measured.id, "o3");
  assert.equal(m.status, "available");
});
test("a value comes only from a measures link, and null is never zero", () => {
  const m = buildLivingMap(projection());
  assert.equal(valueOf(m.flows[0].measured), "1,171");
  assert.equal(m.flows[1].declared, true);
  assert.equal(valueOf(m.flows[1].measured), null);
  assert.equal(valueOf({ value: 554832, unit: "usd" }), "$554,832");
  assert.equal(valueOf({ value: 0, unit: "usd" }), "$0");
  assert.equal(valueOf(null), null);
});
test("no views or no map parts means no Living Atlas", () => {
  assert.equal(buildLivingMap({ ...projection(), views: undefined }), null);
  assert.equal(buildLivingMap({ ...projection(), entities: [{ id: "x", properties: {} }] }), null);
  assert.equal(buildLivingMap(null), null);
});
