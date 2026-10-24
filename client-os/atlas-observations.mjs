// Render server-supplied measurements separately from descriptive anatomy.
// No arithmetic, source-specific rules, campaign links or health interpretation.
const list = x => Array.isArray(x) ? x : [];
const safe = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function observationsMarkup(data) {
  if (!data) return '';
  const observations = list(data.observations);
  if (!observations.length) {
    const unavailable = ['unavailable','configuration_unavailable'].includes(data.observation_status);
    return `<section aria-label="Source observations"><h3>Source observations</h3><p>${unavailable ? 'Source observations are unavailable. This does not mean zero activity.' : 'No source observations are supplied for this view.'}</p></section>`;
  }
  return `<section aria-label="Source observations"><h3>Source observations</h3>
    <p>Reported measurements are separate from the anatomy map. Counts may overlap; their order does not imply a funnel or causation.</p>
    <div class="grid">${observations.map(o => {
      const value = typeof o.value === 'number' && Number.isFinite(o.value) ? String(o.value) : 'Unknown';
      const p = o.provenance ?? {}, window = o.window ?? {};
      const metric = list(data.metrics).find(m => m.id === o.metric_id);
      return `<article class="empty"><h4>${safe(o.name || 'Observation')}</h4>
        <strong>${safe(value)}${value === 'Unknown' ? '' : ` ${safe(o.unit || '')}`}</strong>
        <small>${safe(o.evidence_label || 'Evidence label not supplied')}</small>
        <p>${safe(window.from || 'Unknown start')} – ${safe(window.to || 'Unknown end')} · ${safe(window.timezone || 'Timezone unknown')}</p>
        <p>${safe(window.basis || 'Time basis unknown')}</p>
        <small>Observed: ${safe(p.observed_at || 'Unknown')}<br>Source refreshed: ${safe(p.refreshed_at || 'Unknown')}<br>Freshness: ${safe(p.quality?.freshness || 'Unknown')}</small>
        <p>Unknown status rows: ${safe(o.unknown_count ?? 'Not supplied')}</p>
        <details><summary>Measurement evidence and limits</summary>
          <ul>${list(o.gaps).map(g => `<li>${safe(g)}</li>`).join('')}</ul>
          <pre>${safe(JSON.stringify({id:o.id,record_version:o.record_version,metric,provenance:p}, null, 2))}</pre>
        </details></article>`;
    }).join('')}</div></section>`;
}
