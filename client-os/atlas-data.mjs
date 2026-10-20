// Read-only projection helpers. Never derive business relationships from layout.
export const list = (value) => (Array.isArray(value) ? value : []);
export const targetId = (edge) =>
  edge.target_id ?? edge.to_id ?? edge.target_entity_id ?? "";
export function fromBoard(board) {
  const entities = list(board.anatomy);
  return {
    workspace: board.workspace,
    entities,
    relationships: entities.flatMap((e) =>
      list(e.relationships).map((r) => ({ ...r, origin_entity_id: e.id })),
    ),
    unknowns: list(board.research_findings).map((f) => ({
      ...f,
      question: f.suggested_question,
      gap: f.schema_gap,
    })),
    sources: [],
    compatibility: true,
    readonly: true,
  };
}
export async function readAtlas(api, workspace, board) {
  const path =
    "/projects/improvement/workspaces/" + encodeURIComponent(workspace);
  try {
    return await api(path + "/atlas");
  } catch (error) {
    if (error.status !== 404) throw error;
    return fromBoard(board ?? (await api(path)));
  }
}
export function visibleGraph(data, active) {
  const entities = list(data.entities).filter((e) =>
    active.has(e.entity_type || "Unclassified"),
  );
  const ids = new Set(entities.map((e) => String(e.id)));
  const relationships = list(data.relationships).filter(
    (r) => ids.has(String(r.origin_entity_id)) && ids.has(String(targetId(r))),
  );
  return {
    entities,
    relationships,
    omitted: list(data.relationships).length - relationships.length,
  };
}
