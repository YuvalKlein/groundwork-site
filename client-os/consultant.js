/* Groundwork consultant home: every client in one view, the consultant's own note takers, the unassigned-call inbox and
   adding a client. Shown only when GET /projects/improvement/overview answers (the Groundwork admin); anyone else gets a
   403 there and never sees this. All numbers, matching and rules come from the backend. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(n,cur)=>n===null||n===undefined?'—':(cur==='ILS'?'₪':'$')+Number(n).toLocaleString('en-US',{maximumFractionDigits:0});
const day=s=>s?new Date(s).toLocaleDateString():'—';
const list=s=>String(s||'').split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
const NAME={fathom:'Fathom',fireflies:'Fireflies'};
const STATUS={draft:'Draft',sent:'Sent · waiting for the client',client_signed:'Client signed · your turn',active:'Signed by both',cancelled:'Cancelled'};
/** Agreement text: escape, then only # headings, - lists, **bold** and paragraphs. */
const mdLite=t=>esc(t).split(/\n{2,}/).map(b=>{const l=b.split('\n');if(l.every(x=>/^- /.test(x)))return '<ul>'+l.map(x=>'<li>'+x.slice(2)+'</li>').join('')+'</ul>';const h=b.match(/^(#{1,3}) (.*)$/);if(h&&l.length===1)return `<h${h[1].length+2}>${h[2]}</h${h[1].length+2}>`;return '<p>'+b.replace(/\n/g,'<br>')+'</p>';}).join('').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const CONSENT='I have read this agreement and I sign it electronically. My typed name is my signature. / קראתי את ההסכם ואני חותם/ת עליו באופן אלקטרוני. השם שהקלדתי הוא החתימה שלי.';

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
#consultant .agrtext{background:#fafcfb;border:1px solid #dbe4df;border-radius:10px;padding:12px 16px;max-height:55vh;overflow:auto;margin:8px 0}#consultant textarea{width:100%;min-height:320px;font:13px/1.5 ui-monospace,monospace;padding:10px}
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
  let data,sources,agreements=[],templates=[];
  const loadAgreements=async()=>{[agreements,templates]=await Promise.all([api('/projects/improvement/consultant/agreements').catch(()=>[]),api('/projects/improvement/consultant/agreement-templates').catch(()=>[])]);};
  try{[data,sources]=await Promise.all([api('/projects/improvement/overview'),api('/projects/improvement/calls/sources')]);}
  catch(e){if(/admin|403|Forbidden/i.test(e.message))return false;throw e;}
  await loadAgreements();
  const reload=async()=>{[data,sources]=await Promise.all([api('/projects/improvement/overview'),api('/projects/improvement/calls/sources')]);await loadAgreements();draw();};
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
    ${agreementsHtml()}
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
    wireAgreements();
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

  // ── Agreements: write from a template, send (freezes the text, emails the owner), countersign, cancel ──
  function agreementsHtml(){
    const fee=f=>!f?'—':`${f.fee_one_time!==null?money(f.fee_one_time,f.currency)+' one-time':'no confirmed one-time value yet'} · ${f.fee_per_month!==null?money(f.fee_per_month,f.currency)+'/mo':'no confirmed monthly value yet'}`;
    const row=g=>`<details data-agr="${esc(g.id)}"><summary><b>${esc(g.client_name)}</b> · ${esc(g.title)} · <span class="tag">${esc(STATUS[g.status]||g.status)}</span>${g.sent_at?` <small>sent ${day(g.sent_at)}${g.client_viewed_at?' · opened '+day(g.client_viewed_at):' · not opened yet'}</small>`:''}</summary>
      <p><small>Retainer ${money(g.terms.retainer.amount,g.terms.retainer.currency)} ${g.terms.retainer.period==='month'?'per month':'one-time'} · success fee ${g.terms.success_fee?g.terms.success_fee.percent+'% of confirmed value':'none'} · earned: ${fee(g.success_fee)}</small></p>
      ${(g.signatures||[]).map(x=>`<p><span class="tag">Signed</span> ${esc(x.signer_name)} <small>· ${x.side} · ${new Date(x.signed_at).toLocaleString()}</small></p>`).join('')}
      ${g.cancel_reason?`<p class="muted">Cancelled: ${esc(g.cancel_reason)}</p>`:''}
      <div class="agrtext" dir="${g.language==='he'?'rtl':'ltr'}">${mdLite(g.body||'')}</div>${g.sha256?`<small>Fingerprint ${esc(g.sha256.slice(0,16))}…</small>`:''}
      ${g.status==='draft'?`<label>Edit the text (placeholders must be filled)<textarea data-body dir="${g.language==='he'?'rtl':'ltr'}">${esc(g.body||'')}</textarea></label><div class="row"><button data-save-text>Save text</button><button class="primary" data-send>Send to the client</button></div>`:''}
      ${g.status==='client_signed'?`<div class="row"><label>Your full name <input data-name></label><label class="row"><input type="checkbox" data-consent style="width:auto"> <bdi>${esc(CONSENT)}</bdi></label><button class="primary" data-countersign>Countersign</button></div>`:''}
      ${g.status!=='cancelled'?`<div class="row"><input data-reason placeholder="Why cancel (required)"><button data-cancel>Cancel agreement</button></div>`:''}
      <span class="err" data-msg></span></details>`;
    const tpl=t=>`<details data-tpl="${esc(t.key)}"><summary>${esc(t.name)} <small>· ${t.language==='he'?'Hebrew':'English'}${t.built_in?' · built in':''}</small></summary>
      <label>Name <input data-tname value="${esc(t.built_in?t.name+' (copy)':t.name)}"></label><label>Language <select data-tlang><option value="he" ${t.language==='he'?'selected':''}>Hebrew</option><option value="en" ${t.language==='en'?'selected':''}>English</option></select></label>
      <label>Text · placeholders: {{client_legal_name}} {{client_company_id}} {{client_signer_name}} {{consultant_name}} {{start_date}} {{payment_day}} {{compensation}} {{success_fee_clause}} {{minimum_months}} {{notice_days}} {{governing_law}}<textarea data-tbody dir="${t.language==='he'?'rtl':'ltr'}">${esc(t.body)}</textarea></label>
      <div class="row"><button class="primary" data-tsave>${t.built_in?'Save as my template':'Save'}</button><span class="err" data-msg></span></div></details>`;
    const opts=(rows,v,l)=>rows.map(r=>`<option value="${esc(r[v])}">${esc(r[l])}</option>`).join('');
    return `<h2>Agreements · ${agreements.length}</h2>
    ${agreements.map(row).join('')||'<p class="muted">No agreements yet.</p>'}
    <details><summary>New agreement</summary><form data-new-agr>
      <div class="row"><label>Client <select name="workspace">${opts(data.clients,'id','name')}</select></label><label>Template <select name="template">${opts(templates,'key','name')}</select></label></div>
      <label>Title <input name="title" required value="הסכם ייעוץ"></label>
      <div class="row"><label>Client legal name <input name="client_legal_name" required></label><label>Company no. <input name="client_company_id" dir="ltr"></label><label>Client signer <input name="client_signer_name" required></label><label>Your name <input name="consultant_name" required></label></div>
      <div class="row"><label>Start date <input name="start_date" type="date" required></label><label>Pay by day <input name="payment_day" type="number" min="1" max="28" value="5"></label><label>Minimum months <input name="minimum_months" type="number" min="0" max="36" value="3"></label><label>Notice days <input name="notice_days" type="number" min="0" max="365" value="30"></label></div>
      <div class="row"><label>Retainer <input name="amount" type="number" min="0" step="any" required></label><label>Currency <select name="currency"><option value="ILS">₪ Shekel</option><option value="USD">$ Dollar</option></select></label><label>Period <select name="period"><option value="month">per month</option><option value="one-time">one-time</option></select></label><label>Success fee % <input name="percent" type="number" min="0" max="50" step="any" placeholder="none"></label></div>
      <label>Governing law <input name="governing_law" required value="מדינת ישראל, וסמכות השיפוט תהיה לבתי המשפט המוסמכים בתל אביב"></label>
      <small>The success fee is a percent of value the client confirmed on its board (Revenue created or Cost reduced at Business confirmed). Expected or estimated value never earns a fee.</small>
      <div class="row"><button type="button" data-preview>Preview</button><button class="primary">Save as draft</button><span class="err" data-msg></span></div>
      <div data-preview-out></div></form></details>
    <details><summary>Templates · ${templates.length}</summary>${templates.map(tpl).join('')}</details>`;
  }
  function wireAgreements(){
    const base='/projects/improvement/consultant';
    root.querySelectorAll('[data-agr]').forEach(box=>{const id=box.dataset.agr,g=agreements.find(x=>x.id===id),msg=box.querySelector('[data-msg]');
      box.querySelector('[data-save-text]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`${base}/agreements/${id}`,{method:'PATCH',body:JSON.stringify({body:box.querySelector('[data-body]').value,revision:g.revision})}),msg));
      box.querySelector('[data-send]')?.addEventListener('click',e=>confirm('Send this agreement to the client? They get an email, and the text can no longer change.')&&act(e.currentTarget,()=>api(`${base}/agreements/${id}/send`,{method:'POST',body:JSON.stringify({revision:g.revision})}),msg));
      box.querySelector('[data-countersign]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`${base}/agreements/${id}/countersign`,{method:'POST',body:JSON.stringify({full_name:box.querySelector('[data-name]').value,consent:box.querySelector('[data-consent]').checked})}),msg));
      box.querySelector('[data-cancel]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`${base}/agreements/${id}/cancel`,{method:'POST',body:JSON.stringify({reason:box.querySelector('[data-reason]').value})}),msg));});
    root.querySelectorAll('[data-tpl]').forEach(box=>{const t=templates.find(x=>x.key===box.dataset.tpl),msg=box.querySelector('[data-msg]');
      box.querySelector('[data-tsave]').onclick=e=>{const body={name:box.querySelector('[data-tname]').value,language:box.querySelector('[data-tlang]').value,body:box.querySelector('[data-tbody]').value};
        act(e.currentTarget,()=>t.built_in?api(`${base}/agreement-templates`,{method:'POST',body:JSON.stringify(body)}):api(`${base}/agreement-templates/${t.id}`,{method:'PUT',body:JSON.stringify({...body,revision:t.revision})}),msg);};});
    const form=root.querySelector('[data-new-agr]');if(!form)return;
    const terms=()=>{const f=form.elements,n=v=>Number(v);return {client_legal_name:f.client_legal_name.value,client_company_id:f.client_company_id.value,client_signer_name:f.client_signer_name.value,consultant_name:f.consultant_name.value,
      start_date:f.start_date.value,payment_day:n(f.payment_day.value),retainer:{amount:n(f.amount.value),currency:f.currency.value,period:f.period.value},minimum_months:n(f.minimum_months.value),notice_days:n(f.notice_days.value),
      success_fee:f.percent.value?{percent:n(f.percent.value)}:null,governing_law:f.governing_law.value};};
    const msg=form.querySelector('[data-msg]');
    form.querySelector('[data-preview]').onclick=async()=>{msg.textContent='';try{const p=await api(`${base}/agreements/preview`,{method:'POST',body:JSON.stringify({template_key:form.elements.template.value,terms:terms()})});form.querySelector('[data-preview-out]').innerHTML=`<div class="agrtext" dir="${p.language==='he'?'rtl':'ltr'}">${mdLite(p.body)}</div>`;}catch(e){msg.textContent=e.message;}};
    form.onsubmit=ev=>{ev.preventDefault();act(form.querySelector('button.primary'),()=>api(`/projects/improvement/workspaces/${form.elements.workspace.value}/agreements`,{method:'POST',body:JSON.stringify({template_key:form.elements.template.value,title:form.elements.title.value,terms:terms()})}),msg);};
  }
  draw();
  return true;
}
