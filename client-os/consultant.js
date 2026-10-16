/* Groundwork consultant home: every client in one view, the consultant's own note takers, the unassigned-call inbox and
   adding a client. Shown only when GET /projects/improvement/overview answers (the Groundwork admin); anyone else gets a
   403 there and never sees this. All numbers, matching and rules come from the backend. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(n,cur)=>n===null||n===undefined?'—':(cur==='ILS'?'₪':'$')+Number(n).toLocaleString('en-US',{maximumFractionDigits:0});
const day=s=>s?new Date(s).toLocaleDateString():'—';
const list=s=>String(s||'').split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
const NAME={fathom:'Fathom',fireflies:'Fireflies'};

const CSS=`<style>
#consultant{max-width:1300px;margin:auto}#consultant h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#4d6b60;margin:30px 0 10px}
#consultant .muted,#consultant small{color:#5c776d}#consultant .err{color:#943715}
#consultant .cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#consultant .card{background:#fff;border:1px solid #dbe4df;border-radius:12px;padding:14px}
#consultant .line{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;margin-top:6px}#consultant .line b{font-size:20px}
#consultant .tag{font-size:11px;font-weight:650;border:1px solid #bdcfc4;border-radius:20px;padding:1px 8px}
#consultant table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dbe4df;border-radius:12px;overflow:hidden}
#consultant th,#consultant td{text-align:start;padding:10px 12px;border-top:1px solid #e4ece7;vertical-align:top}#consultant th{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#5c776d;border-top:0}
#consultant .late{color:#943715;font-weight:650}#consultant .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
#consultant details{background:#fff;border:1px solid #dbe4df;border-radius:12px;padding:12px 14px;margin:10px 0}#consultant summary{cursor:pointer;font-weight:650}
#consultant label{margin:8px 0}#consultant input,#consultant select{padding:8px}#consultant button.primary{background:#1d7a5c;color:#fff;border-color:#1d7a5c}
@media(max-width:860px){#consultant .cols{grid-template-columns:1fr}#consultant .hide-sm{display:none}}
</style>`;

function headline(h,cur){
  const col=(title,lines,sub)=>{const shown=lines.filter(l=>l.records&&(l.usd!==null||l.time_usd!==null||l.unpriced_hours!==null));
    return `<div class="card"><b>${title}</b><br><small>${sub}</small>${shown.map(l=>`<div class="line"><span class="tag">${esc(l.type)}${l.confirmed?' · confirmed':''}</span><b>${money(l.usd,cur)}</b>${l.time_usd!==null?`<small>+ ${money(l.time_usd,cur)} of time (conversion)</small>`:''}${l.unpriced_hours!==null?`<small>${Number(l.unpriced_hours).toLocaleString('en-US',{maximumFractionDigits:1})} h saved, not priced</small>`:''}</div>`).join('')||'<p class="muted">Nothing quantified yet</p>'}</div>`;};
  return `<div class="cols">${col('One-time',h.one_time,'once')}${col('Monthly',h.per_month,'every month')}${col('Annualized',h.annualized,'monthly × 12 · run-rate')}</div>`;
}

/**
 * Mount the consultant home into `root`. `api(path, options)` is the page's signed-in fetch; `open(workspaceId)` shows
 * that client's board. Resolves false when this account is not the Groundwork admin (the overview answers 403).
 */
export async function mountConsultant(root,api,open){
  let data,sources;
  try{[data,sources]=await Promise.all([api('/projects/improvement/overview'),api('/projects/improvement/calls/sources')]);}
  catch(e){if(/admin|403|Forbidden/i.test(e.message))return false;throw e;}
  const reload=async()=>{[data,sources]=await Promise.all([api('/projects/improvement/overview'),api('/projects/improvement/calls/sources')]);draw();};
  const act=async(btn,fn,msgEl)=>{btn.disabled=true;if(msgEl)msgEl.textContent='';try{await fn();await reload();}catch(e){if(msgEl)msgEl.textContent=e.message;btn.disabled=false;}};
  function draw(){
    root.innerHTML=CSS+`
    <h1>All clients</h1><p class="muted">Every number says how we know it; lines are never added to each other, and shekels never to dollars.</p>
    ${(data.totals_by_currency||[]).map(t=>`<h2>Across clients · ${t.currency==='ILS'?'₪ shekels':'$ dollars'}</h2>${headline(t,t.currency)}`).join('')}
    <h2>Clients · ${data.clients.length}</h2>
    <table><tr><th>Client</th><th>Waiting on you</th><th class="hide-sm">On the business</th><th class="hide-sm">Measuring</th><th>Ideas to review</th><th class="hide-sm">Last call</th><th class="hide-sm">Next review</th><th></th></tr>
    ${data.clients.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${c.waiting_on_consultant}</td><td class="hide-sm">${c.waiting_on_business}</td><td class="hide-sm">${c.measuring}</td><td>${c.pending_candidates}</td><td class="hide-sm">${day(c.last_call_at)}</td><td class="hide-sm ${c.overdue.length?'late':''}">${c.overdue.length?c.overdue.length+' overdue':esc(c.next_review_date||'—')}</td><td><button class="primary" data-open="${esc(c.id)}">Open board</button></td></tr>`).join('')}</table>
    ${data.clients.map(c=>`<details data-client="${esc(c.id)}"><summary>${esc(c.name)} · how my calls reach it</summary>
      <label class="row"><input type="checkbox" data-include ${c.include_consultant_calls?'checked':''} style="width:auto"> Bring calls from my note takers to this client</label>
      <small>When off, only the note takers this business connected itself bring its calls.</small>
      <div class="row"><label>Email domains<br><input data-domains value="${esc(c.client_identifiers.email_domains.join(', '))}" placeholder="blueedge.co.il" dir="ltr"></label>
      <label>Emails<br><input data-emails value="${esc(c.client_identifiers.emails.join(', '))}" placeholder="someone@gmail.com" dir="ltr"></label>
      <label>Company names<br><input data-names value="${esc(c.client_identifiers.company_names.join(', '))}" placeholder="name in meeting titles"></label></div>
      <small>A call goes to this client when an attendee matches. Leave out freelancers who work with several clients.</small>
      <div class="row"><button data-save-client>Save</button><span class="err" data-msg></span></div></details>`).join('')}
    <h2>Unassigned calls · ${data.unassigned_calls.length}</h2>
    ${data.unassigned_calls.map(c=>`<div class="card" data-call="${esc(c.id)}" style="margin:8px 0"><b>${esc(c.title||'Untitled call')}</b> <small>· ${day(c.started_at)}${/^https:\/\//.test(c.url||'')?` · <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Open recording</a>`:''}</small><br>
      <small>${c.status==='failed'?'Reading failed: '+esc(c.error||''):c.match_reason==='ambiguous'?'Matches more than one client':'Matches no client'} · ${esc((c.attendees||[]).map(a=>a.email||a.name).filter(Boolean).join(', '))}</small>
      ${c.status==='failed'?'<div class="row"><button data-retry>Read again</button></div>':`<div class="row"><select data-to><option value="">Choose a client…</option>${data.clients.map(w=>`<option value="${esc(w.id)}">${esc(w.name)}</option>`).join('')}</select><button data-assign>Assign and read</button><input data-reason placeholder="Why ignore (required)"><button data-ignore>Ignore</button></div>`}<span class="err" data-msg></span></div>`).join('')||'<p class="muted">No unassigned calls.</p>'}
    <h2>My note takers</h2>
    <p class="muted">Your own Fathom or Fireflies. Each call goes to the client whose people attended; calls that match nobody wait above.</p>
    ${sources.sources.map(s=>`<div class="card" data-source="${esc(s.id)}" style="margin:8px 0"><b>${esc(NAME[s.provider]||s.provider)}${s.label?' · '+esc(s.label):''}</b> ${s.paused?'<span class="tag">Paused</span>':''}<br><small>key …${esc(s.credential_hint)} · ${s.last_synced_at?'last checked '+new Date(s.last_synced_at).toLocaleString():'not checked yet'}</small>${s.last_error?`<p class="err">${esc(s.last_error)}</p>`:''}
      <div class="row"><button data-sync>Check now</button><button data-pause="${s.paused?'':'1'}">${s.paused?'Resume':'Pause'}</button><button data-disconnect>Disconnect</button><span class="err" data-msg></span></div></div>`).join('')||'<p class="muted">None connected here yet.</p>'}
    <details><summary>Connect a note taker</summary><form data-connect>
      <label>Note taker <select name="provider">${(sources.providers||[]).map(p=>`<option value="${esc(p)}">${esc(NAME[p]||p)}</option>`).join('')}</select></label>
      <label>API key <input name="api_key" type="password" autocomplete="off" required dir="ltr"></label>
      <label>Name (optional) <input name="label" maxlength="100"></label>
      <small>Fathom: Settings → API Access. Fireflies: Settings → Developer settings. Checked, stored encrypted, never shown again.</small>
      <div class="row"><button class="primary">Connect</button><span class="err" data-msg></span></div></form></details>
    <h2>Add a client</h2>
    <details><summary>New client</summary><form data-new-client>
      <label>Business name <input name="name" required maxlength="120"></label>
      <div class="row"><label>Currency <select name="currency"><option value="ils">₪ Shekel</option><option value="usd">$ Dollar</option></select></label>
      <label>Board language <select name="locale"><option value="he">Hebrew</option><option value="en">English</option></select></label></div>
      <label>Email domains <input name="domains" placeholder="blueedge.co.il, bluetech-ed.co.il" dir="ltr"></label>
      <label>Emails <input name="emails" placeholder="owner@gmail.com" dir="ltr"></label>
      <small>How your note takers recognize this client's calls. Not freelancers who work with several clients.</small>
      <div class="row"><button class="primary">Add client</button><span class="err" data-msg></span></div></form></details>`;
    wire();
  }
  function wire(){
    root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>open(b.dataset.open));
    root.querySelectorAll('[data-client]').forEach(box=>{const id=box.dataset.client,msg=box.querySelector('[data-msg]');
      box.querySelector('[data-save-client]').onclick=e=>act(e.currentTarget,()=>api(`/projects/improvement/workspaces/${id}/settings`,{method:'PATCH',body:JSON.stringify({include_consultant_calls:box.querySelector('[data-include]').checked,
        client_identifiers:{email_domains:list(box.querySelector('[data-domains]').value),emails:list(box.querySelector('[data-emails]').value),company_names:box.querySelector('[data-names]').value.split(',').map(s=>s.trim()).filter(Boolean)}})}),msg);});
    root.querySelectorAll('[data-call]').forEach(box=>{const id=box.dataset.call,msg=box.querySelector('[data-msg]'),base=`/projects/improvement/calls/${id}`;
      box.querySelector('[data-retry]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(base+'/retry',{method:'POST'}),msg));
      box.querySelector('[data-assign]')?.addEventListener('click',e=>{const to=box.querySelector('[data-to]').value;if(!to){msg.textContent='Choose a client first.';return;}act(e.currentTarget,()=>api(base+'/assign',{method:'POST',body:JSON.stringify({workspace_id:to})}),msg);});
      box.querySelector('[data-ignore]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(base+'/ignore',{method:'POST',body:JSON.stringify({reason:box.querySelector('[data-reason]').value})}),msg));});
    root.querySelectorAll('[data-source]').forEach(box=>{const id=box.dataset.source,msg=box.querySelector('[data-msg]'),base=`/projects/improvement/calls/sources/${id}`;
      box.querySelector('[data-sync]').onclick=e=>act(e.currentTarget,()=>api(base+'/sync',{method:'POST'}),msg);
      box.querySelector('[data-pause]').onclick=e=>act(e.currentTarget,()=>api(base,{method:'PATCH',body:JSON.stringify({paused:!!e.currentTarget.dataset.pause})}),msg);
      box.querySelector('[data-disconnect]').onclick=e=>act(e.currentTarget,()=>api(base,{method:'DELETE'}),msg);});
    const connect=root.querySelector('[data-connect]');
    connect.onsubmit=ev=>{ev.preventDefault();const f=connect.elements;act(connect.querySelector('button'),()=>api('/projects/improvement/calls/sources',{method:'POST',body:JSON.stringify({provider:f.provider.value,api_key:f.api_key.value,...(f.label.value.trim()?{label:f.label.value.trim()}:{})})}),connect.querySelector('[data-msg]'));};
    const add=root.querySelector('[data-new-client]');
    add.onsubmit=ev=>{ev.preventDefault();const f=add.elements;act(add.querySelector('button'),()=>api('/projects/improvement/overview/clients',{method:'POST',body:JSON.stringify({name:f.name.value,currency:f.currency.value,locale:f.locale.value,
      client_identifiers:{email_domains:list(f.domains.value),emails:list(f.emails.value),company_names:[]}})}),add.querySelector('[data-msg]'));};
  }
  draw();
  return true;
}
