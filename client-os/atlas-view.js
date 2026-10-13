/* Groundwork Atlas: read-only, workspace-scoped descriptive anatomy.
 * Uses the existing Groundwork API board.anatomy. No client-specific sources or arithmetic.
 */
const safe = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
class GroundworkAtlas extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this.selectedId=null;}
  set board(value){this.data=value;this.selectedId=null;this.render();}
  set projection(value){this.data=value?{anatomy:value.entities,workspace:value.workspace,atlasProjection:true}:null;this.selectedId=null;this.render();}
  connectedCallback(){this.render();}
  render(){
    if(!this.shadowRoot)return;
    const data=this.data,records=Array.isArray(data?.anatomy)?data.anatomy:[];
    const chosen=records.find(x=>x.id===this.selectedId);
    this.shadowRoot.innerHTML=`<style>
      :host{display:block;font:15px/1.5 system-ui;color:#203c38}
      *{box-sizing:border-box}.intro{margin:0 0 16px;color:#60736f}
      .header{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap}
      h2{font-size:24px;margin:0 0 8px}h3{margin:0 0 12px}button{font:inherit;border:1px solid #afc4bc;border-radius:12px;background:white;padding:12px;text-align:left;cursor:pointer;color:inherit}
      button:focus-visible{outline:3px solid #dbac48}button[aria-pressed=true]{background:#e2f4ef;border-color:#17816b}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:18px 0}
      .node{display:block;width:100%}.type{color:#447668;font-size:12px}.empty,.detail{border:1px solid #d3dfd9;border-radius:15px;padding:18px;background:#f7faf8}
      .detail{margin-top:20px}.detail p{overflow-wrap:anywhere}.gap{color:#866121}
      small{display:block;color:#60736f}
      </style>
      <div class="header"><div><h2>Business Anatomy Atlas</h2><p class="intro">A living map of this workspace, grounded in known business records.</p></div><small>Read-only · Groundwork-owned data</small></div>
      ${!data?'<div class="empty">Sign in and select a workspace to view its anatomy.</div>':
        !records.length?'<div class="empty"><strong>Your map starts here.</strong><p>No verified anatomy records have been added for this business. Connectors and guided discovery are planned, not yet available.</p></div>':
        `<p>${records.length} descriptive record(s). Unknown boundaries and relationships are not invented.</p>
        <div class="grid">${records.map(x=>`<button class="node" data-id="${safe(x.id)}" aria-pressed="${x.id===this.selectedId}">
          <span class="type">${safe(x.entity_type||'Unclassified')}</span><strong style="display:block">${safe(x.name||x.id)}</strong>
          <small>${safe(x.review_status||'Review not yet confirmed')}</small>
        </button>`).join('')}</div>
        ${chosen?`<section class="detail" aria-label="Selected anatomy record"><h3>${safe(chosen.name||chosen.id)}</h3>
          <small>${safe(chosen.entity_type)} · ${safe(chosen.id)}</small>
          <p>${safe(chosen.properties?.description||'No verified description yet')}</p>
          ${Array.isArray(chosen.gaps)&&chosen.gaps.length?`<p class="gap"><strong>Knowledge gaps:</strong> ${safe(chosen.gaps.join(' · '))}</p>`:''}
          <small>Relationships are shown only when typed and confirmed by the shared backend.</small>
        </section>`:''}`}`;
    this.shadowRoot.querySelectorAll('button[data-id]').forEach(btn=>btn.addEventListener('click',()=>{this.selectedId=btn.dataset.id;this.render();}));
  }
}
customElements.define('groundwork-atlas',GroundworkAtlas);
