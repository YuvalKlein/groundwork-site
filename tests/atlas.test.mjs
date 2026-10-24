import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  readAtlas,
  fromBoard,
  visibleGraph,
} from "../client-os/atlas-data.mjs";
const plate = {
  workspace: { id: "a", name: "Fixture A" },
  entities: [
    { id: "a", entity_type: "Process", provenance: { source: "fixture" } },
    { id: "b", entity_type: "Resource" },
  ],
  relationships: [
    { origin_entity_id: "a", target_entity_id: "b" },
    { origin_entity_id: "a", target_id: "missing" },
  ],
};
test("404-only fallback uses the authorized board and preserves edges", async () => {
  const calls = [];
  const board = {
    workspace: plate.workspace,
    anatomy: [
      {
        ...plate.entities[0],
        relationships: [{ type: "depends_on", target_id: "b" }],
      },
    ],
  };
  const result = await readAtlas(
    async (path) => {
      calls.push(path);
      throw Object.assign(new Error(), { status: 404 });
    },
    "a/b",
    board,
  );
  assert.deepEqual(calls, ["/projects/improvement/workspaces/a%2Fb/atlas"]);
  assert.equal(result.compatibility, true);
  assert.equal(result.relationships[0].origin_entity_id, "a");
  for (const status of [401, 403, 429, 500]) {
    let count = 0;
    await assert.rejects(
      readAtlas(async () => {
        count++;
        throw Object.assign(new Error(), { status });
      }, "a"),
    );
    assert.equal(count, 1);
  }
});
test("fallback fetch failure is not hidden; malformed arrays remain gaps", async () => {
  let calls = 0;
  await assert.rejects(
    readAtlas(async () => {
      throw Object.assign(new Error("denied"), {
        status: ++calls === 1 ? 404 : 403,
      });
    }, "a"),
    /denied/,
  );
  assert.deepEqual(fromBoard({ anatomy: null }).entities, []);
});
test("graph preserves IDs and counts omitted endpoints without inferring edges", () => {
  const graph = visibleGraph(plate, new Set(["Process", "Resource"]));
  assert.equal(graph.relationships.length, 1);
  assert.equal(graph.omitted, 1);
  assert.equal(
    visibleGraph(plate, new Set(["Process"])).relationships.length,
    0,
  );
  assert.equal(plate.entities[0].provenance.source, "fixture");
});
const source = readFileSync("atlas/atlas.js", "utf8").replace(
  /^import .*;\n/gm,
  "",
);
const flush = () => new Promise((resolve) => setImmediate(resolve));
async function setup(fetcher, session = "synthetic") {
  const nodes = {
    summary: {},
    workspaces: {
      value: "",
      replaceChildren(...rows) {
        this.value = rows[0]?.value || "";
      },
    },
    refresh: {},
    "groundwork-atlas": {},
  };
  const calls = [];
  vm.runInNewContext(source, {
    readAtlas,
    document: { querySelector: (s) => nodes[s.replace(/^#/, "")] },
    window: { GROUNDWORK_CONFIG: { apiBase: "https://example.test/api/v1" } },
    sessionStorage: { getItem: () => session },
    Option: function (name, id) {
      this.value = id;
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return fetcher(url);
    },
  });
  await flush();
  return { nodes, calls };
}
const json = (data) => ({ ok: true, json: async () => data });
test("anonymous host does not request data", async () => {
  const { calls } = await setup(() => assert.fail(), null);
  assert.equal(calls.length, 0);
});
test("host clears records on errors and ignores late workspace responses", async () => {
  const pending = new Map();
  const { nodes, calls } = await setup((url) =>
    url.endsWith("/workspaces")
      ? json([{ id: "a" }])
      : new Promise((resolve) => pending.set(url, resolve)),
  );
  nodes.workspaces.value = "b";
  const next = nodes.workspaces.onchange();
  pending.get(
    "https://example.test/api/v1/projects/improvement/workspaces/b/atlas",
  )(json({ ...plate, workspace: { id: "b" } }));
  await next;
  pending.get(
    "https://example.test/api/v1/projects/improvement/workspaces/a/atlas",
  )(json(plate));
  await flush();
  assert.equal(nodes["groundwork-atlas"].projection.workspace.id, "b");
  const fail = nodes.workspaces.onchange();
  assert.equal(nodes["groundwork-atlas"].projection, null);
  pending.get(
    "https://example.test/api/v1/projects/improvement/workspaces/b/atlas",
  )({ ok: false, status: 403 });
  await fail;
  assert.match(nodes.summary.textContent, /403/);
  assert.equal(nodes["groundwork-atlas"].projection, null);
  assert.equal(calls[1].options.cache, "no-store");
  assert.equal(calls[1].options.credentials, "omit");
});
