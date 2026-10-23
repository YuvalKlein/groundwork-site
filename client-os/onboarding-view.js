/* Groundwork onboarding: one checklist per retainer client. 1. Sign the agreement. 2. Connect a US bank (Stripe-hosted,
   ACH only), which debits the deposit and schedules the monthly retainer. 3. Access tasks: give the consultant access by
   inviting his email in each system, never by sending a password, key or code.
   The consultant (Groundwork admin) sees the same page plus task controls, and a list of retainer clients with a
   New client form. All rules (who may do what, amounts, dates) live in the backend; this file only shows and asks. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=c=>'$'+(Number(c)/100).toLocaleString('en-US',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});
const day=s=>s?new Date(s).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'—';
const ymd=s=>s?new Date(s+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}):'—';
const mdLite=t=>esc(t).split(/\n{2,}/).map(b=>{const l=b.split('\n');if(l.every(x=>/^- /.test(x)))return '<ul>'+l.map(x=>'<li>'+x.slice(2)+'</li>').join('')+'</ul>';const h=b.match(/^(#{1,3}) (.*)$/);if(h&&l.length===1)return `<h${h[1].length+2}>${h[2]}</h${h[1].length+2}>`;return '<p>'+b.replace(/\n/g,'<br>')+'</p>';}).join('').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const CONSENT='I have read this agreement and I sign it electronically. My typed name is my signature.';
const CHARGE={scheduled:'Scheduled',processing:'Processing · bank debits take about 4 business days',paid:'Paid',failed:'Failed',void:'Void'};
const TASK={published:'To do',client_done:'Done · waiting for Groundwork to check',verified:'Verified',reopened:'Needs another look'};
const W='/projects/improvement/workspaces/';

/** The standard access tasks. `{email}` is the consultant's access email for this client. No step ever asks for a secret. */
export const PRESETS=[
  {system:'Google Cloud',title:'Create a Google Cloud project with billing and add {email} as Owner',instructions:'1. Open console.cloud.google.com and create a new project (for example "{company} data").\n2. Billing: link the project to your billing account so billing is on.\n3. IAM & Admin → IAM → Grant access. New principal: {email}. Role: Owner. Save.\n4. APIs & Services → Library → search "BigQuery API" → Enable.'},
  {system:'GitHub',title:'Create a GitHub organization and invite {email} as Owner',instructions:'1. On github.com, click + → New organization → Free plan. Name it after the company.\n2. Organization → People → Invite member → {email}.\n3. Role: Owner → Send invitation.'},
  {system:'Workiz',title:'Add {email} as an admin user in Workiz',instructions:'1. In Workiz, open Settings → Team (Users) → Add user.\n2. Email: {email}. Role: Admin (full access).\n3. Save. Workiz emails the invitation to {email}.'},
  {system:'Call tracking',title:'Add {email} as an admin in your call tracking (CallRail or the tool you use)',instructions:'1. CallRail: Settings → Users → Add user → {email}, role Administrator → Invite.\n2. Another tool: invite {email} as an admin user from its users or team page.\n3. In the note, tell us which tool you use.'},
  {system:'Google Ads',title:'Invite {email} to your Google Ads account',instructions:'1. ads.google.com → Admin (gear) → Access and security → +.\n2. Email: {email}. Access level: Admin.\n3. Send invitation.'},
  {system:'Local Services Ads',title:'Give {email} access to Local Services Ads',instructions:'1. If Local Services Ads is linked to your Google Ads account, the Google Ads invitation covers it: mark this done and say so in the note.\n2. Otherwise open the Local Services Ads dashboard → Settings → Account access (Users) → invite {email} as a manager.'},
  {system:'Meta Ads',title:'Add {email} to your Meta Business account',instructions:'1. business.facebook.com → Settings → Users → People → Add.\n2. Email: {email}. Access: Full control (admin).\n3. Assign your ad account(s) and Facebook/Instagram pages → Invite.'},
  {system:'Website',title:'Add {email} as an administrator of your website',instructions:'1. WordPress: Users → Add New User. Email: {email}. Role: Administrator. Keep "Send the new user an email" checked → Add New User.\n2. Wix, Squarespace or another builder: Settings → Contributors (Permissions) → invite {email} as Admin.\n3. In the note, tell us the platform.'},
  {system:'Google Analytics',title:'Add {email} to Google Analytics',instructions:'1. analytics.google.com → Admin (gear) → Account access management → + → Add users.\n2. Email: {email}. Role: Administrator → Add.'},
  {system:'Search Console',title:'Add {email} to Google Search Console',instructions:'1. search.google.com/search-console → choose your site → Settings → Users and permissions → Add user.\n2. Email: {email}. Permission: Owner (or Full) → Add.'},
  {system:'Google Business Profile',title:'Add {email} as a manager of your Google Business Profile',instructions:'1. Search your business name on Google (signed in as the profile owner) or open business.google.com.\n2. ⋮ (More) → Business Profile settings → People and access → Add.\n3. Email: {email}. Access: Manager (or Owner) → Invite.'},
];
const fill=(s,email,company)=>s.replaceAll('{email}',email).replaceAll('{company}',company||'Company');

const CSS=`<style>
.gw-onb{max-width:900px;margin:0 auto 28px}.gw-onb h2{font-size:22px;margin:4px 0 6px}.gw-onb h3{margin:0 0 6px;font-size:17px}
.gw-onb .muted,.gw-onb small{color:#5c776d}.gw-onb .err{color:#943715}.gw-onb .ok{color:#1d7a5c}
.gw-onb .step{background:#fff;border:1px solid #dbe4df;border-radius:12px;padding:16px 18px;margin:12px 0}
.gw-onb .step.done{border-color:#9cc9b4}.gw-onb .badge{display:inline-block;font-size:12px;font-weight:650;border:1px solid #bdcfc4;border-radius:20px;padding:2px 9px;margin-inline-start:6px}
.gw-onb .done .badge.state{background:#e4f3ec;border-color:#9cc9b4;color:#1d7a5c}
.gw-onb .agrtext{background:#fafcfb;border:1px solid #dbe4df;border-radius:10px;padding:10px 16px;max-height:50vh;overflow:auto;margin:8px 0}
.gw-onb .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.gw-onb label{margin:6px 0}
.gw-onb button.primary{background:#1d7a5c;color:#fff;border-color:#1d7a5c}.gw-onb button[disabled]{opacity:.55;cursor:default}
.gw-onb .task{border-top:1px solid #e4ece7;padding:12px 0}.gw-onb .task:first-of-type{border-top:0}.gw-onb pre{white-space:pre-wrap;font:inherit;margin:6px 0}
.gw-onb input,.gw-onb select,.gw-onb textarea{max-width:100%;box-sizing:border-box}.gw-onb textarea{width:100%;min-height:110px;font:14px/1.45 system-ui;padding:8px}
.gw-onb table{width:100%;border-collapse:collapse}.gw-onb td,.gw-onb th{text-align:start;padding:6px 8px;border-top:1px solid #e4ece7}
</style>`;

/**
 * Mount the onboarding checklist for workspace `w` into `root`. `api(path, options)` is the page's signed-in fetch.
 * `opts.admin`: the consultant's controls. `opts.bankSession`: the Checkout session id Stripe returned with.
 */
export async function mountOnboarding(root,api,w,opts={}){
  const admin=!!opts.admin;
  let engagement,agreements=[],billing,tasks=[],consultantClient=null,msg='';
  if(opts.bankSession){
    try{await api(`${W}${w}/billing/checkout/${encodeURIComponent(opts.bankSession)}/complete`,{method:'POST'});msg='Your bank is connected. Thank you.';}
    catch(e){msg=e.message;}
  }
  const load=async()=>{
    // The workspace endpoint answers members only; the consultant (not a member) finds the retainer in his client list.
    engagement=admin?(await api('/projects/improvement/consultant/clients').catch(()=>[])).find(c=>c.workspace_id===w)||null:await api(`${W}${w}/engagement`).catch(()=>null);
    if(!engagement&&!admin)return false;
    [agreements,billing,tasks]=await Promise.all([admin?api('/projects/improvement/consultant/agreements').then(all=>all.filter(g=>g.workspace_id===w)).catch(()=>[]):api(`${W}${w}/agreements`).catch(()=>[]),api(`${W}${w}/billing`).catch(()=>null),api(`${W}${w}/access-tasks`).catch(()=>[])]);
    if(admin)consultantClient=engagement;
    return true;
  };
  if(!(await load()))return false;
  const act=async(btn,fn,out)=>{btn.disabled=true;if(out)out.textContent='';try{await fn();await load();draw();}catch(e){if(out)out.textContent=e.message;btn.disabled=false;}};

  function agreementStep(){
    const g=agreements.find(a=>a.status!=='cancelled'&&a.status!=='draft')||(admin?agreements.find(a=>a.status==='draft'):null);
    const signed=g&&['client_signed','active'].includes(g.status);
    let body;
    if(!g)body='<p class="muted">Your agreement will appear here.</p>';
    else if(g.status==='draft')body=`<p class="muted">Draft: not sent yet. Send it from the client list below (without an email), then share this page's link.</p>`;
    else body=`<details ${signed?'':'open'}><summary>${esc(g.title)}</summary><div class="agrtext">${mdLite(g.sent_body||g.body||'')}</div>${g.sha256?`<small>Fingerprint ${esc(g.sha256.slice(0,16))}…</small>`:''}</details>
      ${(g.signatures||[]).map(x=>`<p><span class="badge">Signed</span> ${esc(x.signer_name)} <small>· ${esc(x.side||x.signer_role||'')} · ${new Date(x.signed_at).toLocaleString()}</small></p>`).join('')}
      ${g.status==='sent'&&!admin?`<div class="row"><label>Your full name <input data-sign-name autocomplete="name"></label></div><label class="row"><input type="checkbox" data-sign-consent style="width:auto"> ${esc(CONSENT)}</label><div class="row"><button class="primary" data-sign="${esc(g.id)}">Sign the agreement</button><span class="err" data-out></span></div>`:''}
      ${g.status==='sent'&&admin?'<p class="muted">Waiting for the client to sign.</p>':''}`;
    return `<div class="step ${signed?'done':''}" data-step="agreement"><h3>1. Sign the agreement <span class="badge state">${signed?'Done':'To do'}</span></h3>${body}</div>`;
  }
  function bankStep(){
    const b=billing,connected=b?.bank?.connected;
    let body;
    if(!b)body='<p class="muted">Billing is not available yet.</p>';
    else if(connected)body=`<p>Bank: <b>${esc(b.bank.bank_name||'Bank account')}</b> ••••${esc(b.bank.last4||'')} <small>· connected ${day(b.bank.connected_at)}</small></p>`;
    else if(!b.agreement_signed)body='<p class="muted">Sign the agreement first. Then connect the US bank account the retainer is debited from.</p>';
    else if(!b.configured)body='<p class="muted">Bank connection opens shortly. Please check back later.</p>';
    else body=admin?'<p class="muted">Waiting for the client to connect a bank.</p>':`<p>Connect the US business bank account the retainer is debited from. Stripe, our payment provider, verifies it with your bank's own sign-in; we never see your bank sign-in, and we keep only the bank's name and the last 4 digits.</p>
      <div class="row"><button class="primary" data-bank>Connect bank and pay the deposit</button><span class="err" data-out></span></div>`;
    const deposit=engagement?Math.floor(engagement.retainer_cents/2):null;
    const charges=(b?.charges||[]).map(c=>`<tr><td>${c.kind==='deposit'?'Deposit':c.kind==='monthly'?'Monthly retainer':'Final'}</td><td>${usd(c.amount_cents)}</td><td>${esc(CHARGE[c.status]||c.status)}${c.failure_message?` <span class="err">${esc(c.failure_message)}</span>`:''}</td><td>${day(c.created_at)}</td><td>${/^https:\/\//.test(c.hosted_invoice_url||'')?`<a href="${esc(c.hosted_invoice_url)}" target="_blank" rel="noopener noreferrer">Invoice</a>`:''}</td></tr>`).join('');
    const plan=engagement?`<p class="muted">Deposit ${usd(deposit)} when the bank is connected. Then ${usd(engagement.retainer_cents)} on ${ymd(b?.first_monthly_date)} and the same day each month, by ACH debit only. No card is ever charged.</p>`:'';
    return `<div class="step ${connected?'done':''}" data-step="bank"><h3>2. Connect your bank and pay the deposit <span class="badge state">${connected?'Done':'To do'}</span></h3>${plan}${body}
      ${charges?`<table><tr><th>Charge</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr>${charges}</table>`:''}
      ${b?.monthly_scheduled?`<p class="ok"><small>Monthly debits are scheduled from ${ymd(b.first_monthly_date)}.</small></p>`:''}</div>`;
  }
  function tasksStep(){
    const open=tasks.filter(t=>t.status!=='verified').length,allDone=tasks.length&&!open;
    const item=t=>`<div class="task" data-task="${esc(t.id)}"><b>${esc(t.system)}</b> · ${esc(t.title)} <span class="badge">${esc(TASK[t.status]||t.status)}</span>
      <pre>${esc(t.instructions)}</pre>
      ${t.status==='reopened'&&t.consultant_note?`<p class="err">Groundwork: ${esc(t.consultant_note)}</p>`:''}
      ${t.client_note?`<small>Note: ${esc(t.client_note)}</small>`:''}
      ${!admin&&['published','reopened'].includes(t.status)?`<div class="row"><input data-note placeholder="Note (optional)" maxlength="1000"><button class="primary" data-done>Mark done</button><span class="err" data-out></span></div>`:''}
      ${admin?`<div class="row">${t.status!=='verified'?'<button class="primary" data-verify>Verified</button>':''}${['client_done','verified'].includes(t.status)?'<input data-note placeholder="What is missing (to reopen)"><button data-reopen>Reopen</button>':''}<button data-remove>Remove</button><span class="err" data-out></span></div>`:''}</div>`;
    return `<div class="step ${allDone?'done':''}" data-step="tasks"><h3>3. Give Groundwork access <span class="badge state">${tasks.length?`${tasks.length-open} of ${tasks.length} verified`:'None yet'}</span></h3>
      <p class="muted">Each step invites our email through the system's own invite feature. We will never ask for a password, an API key or a sign-in code; if anyone does, don't send it.</p>
      ${tasks.map(item).join('')||'<p class="muted">Your access steps will appear here.</p>'}${admin?adminTaskForm():''}</div>`;
  }
  function adminTaskForm(){
    const dom=(consultantClient?.contact_email||'').split('@')[1]||'';
    const email=localStorage.getItem('gw-access-email:'+w)||(dom?'yuvalk@'+dom:'');
    const have=new Set(tasks.map(t=>t.system));
    return `<details style="margin-top:12px" open><summary><b>Add access tasks</b></summary>
      <div class="row"><label>Access email (invited everywhere) <input data-email value="${esc(email)}" dir="ltr" size="32"></label></div>
      <div class="row"><button class="primary" data-presets>Add the standard set (${PRESETS.filter(p=>!have.has(p.system)).length} missing)</button><span class="err" data-out-presets></span></div>
      <form data-new-task><div class="row"><label>System <input name="system" required maxlength="100"></label><label style="flex:1">Title <input name="title" required maxlength="200" style="width:100%"></label></div>
      <label>Instructions (must name the access email; never ask for a password, key or code)<textarea name="instructions" required maxlength="4000"></textarea></label>
      <div class="row"><button>Add task</button><span class="err" data-out></span></div></form></details>`;
  }
  function draw(){
    root.innerHTML=CSS+`<div class="gw-onb"><h2>Welcome${engagement?.business_name?', '+esc(engagement.business_name):''}</h2>
      <p class="muted">Three steps to start. Do them in any order that works; this page saves your progress.</p>
      ${msg?`<p class="${/connected/.test(msg)?'ok':'err'}" role="status">${esc(msg)}</p>`:''}
      ${engagement?agreementStep()+bankStep():'<p class="muted">No retainer on this workspace.</p>'}${tasksStep()}</div>`;
    wire();
  }
  function wire(){
    const sign=root.querySelector('[data-sign]');
    if(sign)sign.onclick=e=>{const box=root.querySelector('[data-step="agreement"]');act(e.currentTarget,()=>api(`${W}${w}/agreements/${sign.dataset.sign}/sign`,{method:'POST',body:JSON.stringify({full_name:box.querySelector('[data-sign-name]').value,consent:box.querySelector('[data-sign-consent]').checked})}),box.querySelector('[data-out]'));};
    const bank=root.querySelector('[data-bank]');
    if(bank)bank.onclick=async e=>{const b=e.currentTarget,out=root.querySelector('[data-step="bank"] [data-out]');b.disabled=true;out.textContent='';
      try{const {url}=await api(`${W}${w}/billing/bank-checkout`,{method:'POST'});if(!/^https:\/\/checkout\.stripe\.com\//.test(url))throw new Error('Unexpected payment page');location.assign(url);}catch(x){out.textContent=x.message;b.disabled=false;}};
    root.querySelectorAll('[data-task]').forEach(box=>{const id=box.dataset.task,out=box.querySelector('[data-out]'),note=()=>box.querySelector('[data-note]')?.value.trim();
      box.querySelector('[data-done]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`${W}${w}/access-tasks/${id}/done`,{method:'POST',body:JSON.stringify(note()?{note:note()}:{})}),out));
      box.querySelector('[data-verify]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`/projects/improvement/consultant/access-tasks/${id}/verify`,{method:'POST',body:'{}'}),out));
      box.querySelector('[data-reopen]')?.addEventListener('click',e=>act(e.currentTarget,()=>api(`/projects/improvement/consultant/access-tasks/${id}/reopen`,{method:'POST',body:JSON.stringify({note:note()||''})}),out));
      box.querySelector('[data-remove]')?.addEventListener('click',e=>confirm('Remove this task?')&&act(e.currentTarget,()=>api(`/projects/improvement/consultant/access-tasks/${id}`,{method:'DELETE'}),out));});
    if(!admin)return;
    const emailIn=root.querySelector('[data-email]');
    const email=()=>{const v=emailIn.value.trim().toLowerCase();try{localStorage.setItem('gw-access-email:'+w,v);}catch{}return v;};
    const company=engagement?.business_name||'';
    const presets=root.querySelector('[data-presets]');
    if(presets)presets.onclick=e=>act(e.currentTarget,async()=>{const to=email(),have=new Set(tasks.map(t=>t.system));let n=tasks.length;
      for(const p of PRESETS.filter(p=>!have.has(p.system)))await api(`${W}${w}/access-tasks`,{method:'POST',body:JSON.stringify({system:p.system,title:fill(p.title,to,company),instructions:fill(p.instructions,to,company),grant_to_email:to,sort_order:n++})});},root.querySelector('[data-out-presets]'));
    const form=root.querySelector('[data-new-task]');
    if(form)form.onsubmit=ev=>{ev.preventDefault();const f=form.elements;act(form.querySelector('button'),()=>api(`${W}${w}/access-tasks`,{method:'POST',body:JSON.stringify({system:f.system.value,title:f.title.value,instructions:f.instructions.value,grant_to_email:email(),sort_order:tasks.length})}),form.querySelector('[data-out]'));};
  }
  draw();
  return true;
}

/**
 * The consultant's retainer clients (ACH): the list, a New client form, "Send without email" for a draft agreement, and
 * the onboarding link to copy. `open(workspaceId)` shows that client's onboarding page.
 */
export async function mountRetainerClients(root,api,open){
  let clients=[],agreements=[];
  const portal=w=>`${location.origin}/client-os/?ws=${encodeURIComponent(w)}&view=onboarding`;
  const load=async()=>{[clients,agreements]=await Promise.all([api('/projects/improvement/consultant/clients'),api('/projects/improvement/consultant/agreements').catch(()=>[])]);};
  try{await load();}catch(e){if(/admin|403|Forbidden/i.test(e.message))return false;throw e;}
  const act=async(btn,fn,out)=>{btn.disabled=true;if(out)out.textContent='';try{await fn();await load();draw();}catch(e){if(out)out.textContent=e.message;btn.disabled=false;}};
  function draw(){
    const agr=c=>agreements.find(a=>a.id===c.agreement?.id);
    root.innerHTML=CSS+`<div class="gw-onb" style="max-width:1300px"><h2>Retainer clients (ACH) · ${clients.length}</h2>
      <table><tr><th>Client</th><th>Retainer</th><th>Start</th><th>Status</th><th>Agreement</th><th></th></tr>
      ${clients.map(c=>`<tr data-c="${esc(c.id)}"><td><b>${esc(c.business_name)}</b><br><small>${esc(c.contact_name)} · ${esc(c.contact_email||'')}</small></td><td>${usd(c.retainer_cents)}/mo</td><td>${ymd(c.start_date)}</td><td>${esc(c.status)}</td>
        <td>${esc(c.agreement?.status||'—')}${c.agreement?.status==='draft'?`<br><button data-send>Send without email</button>`:''}</td>
        <td><button class="primary" data-open-onb="${esc(c.workspace_id)}">Onboarding</button><br><button data-copy="${esc(portal(c.workspace_id))}">Copy client link</button><br><span class="err" data-out></span></td></tr>`).join('')}</table>
      <details style="margin-top:10px"><summary><b>New retainer client</b></summary><form data-new>
        <div class="row"><label>Business name <input name="business_name" required maxlength="200"></label><label>Legal name <input name="legal_name" maxlength="200" placeholder="same as business"></label></div>
        <div class="row"><label>Contact name <input name="contact_name" required></label><label>Contact email <input name="contact_email" type="email" required dir="ltr"></label></div>
        <div class="row"><label>Tier <input name="tier" required value="Retainer" maxlength="60"></label><label>Monthly retainer (USD) <input name="retainer" type="number" min="1" step="0.01" required></label>
        <label>Start date (day 1–28) <input name="start_date" type="date" required></label><label>AI <select name="ai_mode"><option value="own_key">Client's own key</option><option value="included">Included</option></select></label></div>
        <label>Governing law <input name="governing_law" required value="the State of Texas" size="40"></label>
        <small>Creates the business, the workspace, the contact as owner, the engagement and a draft ACH agreement. Nothing is emailed.</small>
        <div class="row"><button class="primary">Create client</button><span class="err" data-out></span></div></form></details></div>`;
    root.querySelectorAll('[data-c]').forEach(row=>{const c=clients.find(x=>x.id===row.dataset.c),out=row.querySelector('[data-out]');
      row.querySelector('[data-open-onb]').onclick=()=>open(c.workspace_id,c.business_name);
      row.querySelector('[data-copy]').onclick=async e=>{try{await navigator.clipboard.writeText(e.currentTarget.dataset.copy);out.className='ok';out.textContent='Copied';}catch{out.textContent=e.currentTarget.dataset.copy;}};
      row.querySelector('[data-send]')?.addEventListener('click',e=>{const g=agr(c);if(!g){out.textContent='Agreement not found';return;}
        confirm('Freeze and send this agreement without emailing the client? The text can no longer change. You send the link yourself.')&&act(e.currentTarget,()=>api(`/projects/improvement/consultant/agreements/${g.id}/send`,{method:'POST',body:JSON.stringify({revision:g.revision,notify:false})}),out);});});
    const form=root.querySelector('[data-new]');
    form.onsubmit=ev=>{ev.preventDefault();const f=form.elements;act(form.querySelector('button'),()=>api('/projects/improvement/consultant/clients',{method:'POST',body:JSON.stringify({business_name:f.business_name.value,...(f.legal_name.value.trim()?{legal_name:f.legal_name.value.trim()}:{}),
      contact_name:f.contact_name.value,contact_email:f.contact_email.value,tier:f.tier.value,retainer_cents:Math.round(Number(f.retainer.value)*100),start_date:f.start_date.value,ai_mode:f.ai_mode.value,governing_law:f.governing_law.value})}),form.querySelector('[data-out]'));};
  }
  draw();
  return true;
}
