import { list, targetId, visibleGraph, fromBoard } from "./atlas-data.mjs";
/* Groundwork Atlas: read-only, workspace-scoped descriptive anatomy.
 * Uses the existing Groundwork API board.anatomy. No client-specific sources or arithmetic.
 */
const safe = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
class GroundworkAtlas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedId = null;
    this.active = null;
    this.mode = "graph";
  }
  set board(value) {
    this.projection = value ? fromBoard(value) : null;
  }
  set projection(value) {
    this.data = value;
    this.selectedId = null;
    this.active = null;
    this.render();
  }
  connectedCallback() {
    this.render();
  }
  render() {
    if (!this.shadowRoot) return;
    const data = this.data,
      records = list(data?.entities);
    const types = [
      ...new Set(records.map((e) => e.entity_type || "Unclassified")),
    ].sort();
    this.active ??= new Set(types);
    const graph = visibleGraph(data || {}, this.active);
    const chosen = graph.entities.find((x) => x.id === this.selectedId);
    const edges = Array.isArray(data?.relationships)
      ? data.relationships.filter(
          (x) =>
            chosen &&
            (x?.origin_entity_id === chosen.id ||
              String(targetId(x)) === String(chosen.id)),
        )
      : [];
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;font:15px/1.5 system-ui;color:#203c38}
      *{box-sizing:border-box}.intro{margin:0 0 16px;color:#60736f}
      .header{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap}
      h2{font-size:24px;margin:0 0 8px}h3{margin:0 0 12px}button{font:inherit;border:1px solid #afc4bc;border-radius:12px;background:white;padding:12px;text-align:left;cursor:pointer;color:inherit}
      button:focus-visible{outline:3px solid #dbac48}button[aria-pressed=true]{background:#e2f4ef;border-color:#17816b}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:18px 0}
      .node{display:block;width:100%}.type{color:#447668;font-size:12px}.empty,.detail{border:1px solid #d3dfd9;border-radius:15px;padding:18px;background:#f7faf8}
      .detail{margin-top:20px}.detail p{overflow-wrap:anywhere}.gap{color:#866121}
      svg{width:100%;min-width:650px} .map{overflow:auto} line{stroke:#748c83;stroke-width:2} circle{fill:#e2f4ef;stroke:#17816b} text{fill:#203c38;font:13px system-ui} fieldset{display:flex;gap:12px;flex-wrap:wrap} [hidden]{display:none} pre{white-space:pre-wrap;overflow-wrap:anywhere} small{display:block;color:#60736f}
      </style>
      <div class="header"><div><h2>Business Anatomy Atlas</h2><p class="intro">What entities and relationships are recorded for this workspace?</p></div><small>Read-only · Groundwork-owned data</small></div>
      ${
        !data
          ? '<div class="empty">Sign in and select a workspace to view its anatomy.</div>'
          : !records.length
            ? '<div class="empty"><strong>Your map starts here.</strong><p>No anatomy records are available in this view. Connectors and guided discovery are planned, not yet available.</p></div>'
            : `<p>${safe(data.workspace?.name || "Workspace")} · ${records.length} descriptive record(s). ${data.compatibility ? "Compatibility view: Atlas endpoint unavailable (404); using authorized board records." : ""}</p>
        <p>Model reference: Business Anatomy v0.1.1 clarification candidate · Holon Schema 0.1 · human review pending. Each record retains its own versions. Current records only; historical state and observation date are not inferred.</p>
        <button data-mode="graph" aria-pressed="${this.mode === "graph"}">Map</button> <button data-mode="cards" aria-pressed="${this.mode === "cards"}">Cards</button>
        <fieldset><legend>Visible entity types</legend>${types.map((t) => `<label><input type="checkbox" data-layer="${safe(t)}" ${this.active.has(t) ? "checked" : ""}>${safe(t)}</label>`).join("")}</fieldset>
        <p role="status">${graph.entities.length} visible entities; ${graph.relationships.length} visible relationships; ${graph.omitted} omitted (filtered or unresolved endpoints).</p>
        <p>Equal node sizes and line widths carry no metric. Arrows show stored direction, not causation. Missing evidence is unknown, not poor health.</p>
        <div class="map" ${this.mode === "graph" ? "" : "hidden"}>${this.graphMarkup(graph)}</div>
        <div class="grid" ${this.mode === "cards" ? "" : "hidden"}>${graph.entities
          .map(
            (
              x,
            ) => `<button class="node" data-id="${safe(x.id)}" aria-pressed="${x.id === this.selectedId}">
          <span class="type">${safe(x.entity_type || "Unclassified")}</span><strong style="display:block">${safe(x.name || x.id)}</strong>
          <small>${safe(x.review_status || "Review not yet confirmed")}</small>
        </button>`,
          )
          .join("")}</div>
        ${
          chosen
            ? `<section class="detail" tabindex="-1" aria-label="Selected anatomy record"><h3>${safe(chosen.name || chosen.id)}</h3>
          <small>${safe(chosen.entity_type)} · ${safe(chosen.id)}</small>
          <p>${safe(chosen.properties?.description || "No verified description yet")}</p>
          ${Array.isArray(chosen.gaps) && chosen.gaps.length ? `<p class="gap"><strong>Knowledge gaps:</strong> ${safe(chosen.gaps.join(" · "))}</p>` : ""}
          ${edges.length ? `<h3>Recorded relationships</h3><ul>${edges.map((e) => `<li>${safe(e.origin_entity_id)} — ${safe(e.type || e.relationship_type || "Relationship type unknown")} → ${safe(targetId(e) || "Target not resolved")}</li>`).join("")}</ul>` : "<small>No relationships available for this record.</small>"}
          <details><summary>Record evidence and versions</summary><pre>${safe(JSON.stringify({ model_revision: chosen.model_revision ?? "Unknown", schema_version: chosen.schema_version ?? "Unknown", record_version: chosen.record_version ?? "Unknown", review_status: chosen.review_status ?? "Not supplied", properties: chosen.properties ?? {}, provenance: chosen.provenance ?? [], relationships: edges }, null, 2))}</pre></details>
          <small>Connections are listed exactly as stored; none are inferred from visual proximity.</small>
        </section>`
            : ""
        }`
      }`;
    if (data)
      this.shadowRoot.innerHTML += `<h3>Recorded research gaps</h3><ul>${
        list(data.unknowns)
          .map((u) => `<li>${safe(u.question || u.gap || "Unknown")}</li>`)
          .join("") ||
        "<li>No gaps supplied; this does not prove complete coverage.</li>"
      }</ul><p>Connector registry: ${list(data.sources).length} records supplied. An empty registry does not prove that business integrations are disconnected.</p>`;
    this.shadowRoot.querySelectorAll("[data-mode]").forEach(
      (btn) =>
        (btn.onclick = () => {
          this.mode = btn.dataset.mode;
          this.render();
        }),
    );
    this.shadowRoot.querySelectorAll("[data-layer]").forEach(
      (input) =>
        (input.onchange = () => {
          input.checked
            ? this.active.add(input.dataset.layer)
            : this.active.delete(input.dataset.layer);
          this.selectedId = null;
          this.render();
        }),
    );
    this.shadowRoot.querySelectorAll("[data-id]").forEach((btn) => {
      const choose = () => {
        this.selectedId = btn.dataset.id;
        this.render();
        this.shadowRoot.querySelector(".detail")?.focus();
      };
      btn.addEventListener("click", choose);
      if (btn.tagName?.toLowerCase() === "g")
        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            choose();
          }
        });
    });
  }
  graphMarkup(graph) {
    const points = new Map(
      graph.entities.map((e, i) => [
        String(e.id),
        { e, x: 120 + (i % 4) * 240, y: 70 + Math.floor(i / 4) * 130 },
      ]),
    );
    const height = Math.max(220, Math.ceil(points.size / 4) * 130 + 30);
    return `<svg viewBox="0 0 1000 ${height}" role="group" aria-label="Recorded relationships"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#748c83"/></marker></defs>${graph.relationships
      .map((r) => {
        const a = points.get(String(r.origin_entity_id)),
          b = points.get(String(targetId(r)));
        const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x - ((b.x - a.x) * 32) / length}" y2="${b.y - ((b.y - a.y) * 32) / length}" marker-end="url(#arrow)"><title>${safe(r.type || r.relationship_type || "Unknown type")}</title></line>`;
      })
      .join(
        "",
      )}${[...points.values()].map(({ e, x, y }) => `<g role="button" tabindex="0" data-id="${safe(e.id)}" aria-label="${safe(e.name || e.id)}"><circle cx="${x}" cy="${y}" r="30"/><text x="${x}" y="${y + 52}" text-anchor="middle">${safe(String(e.name || e.id).slice(0, 30))}</text></g>`).join("")}</svg>`;
  }
}
customElements.define("groundwork-atlas", GroundworkAtlas);
