import './atlas-view.js';
import './living-atlas.js';
import {readAtlas} from './atlas-data.mjs';
import './improvement-view.js';
import {captureMagicLink, verifyMagicLink, SESSION_KEY} from './auth.js';
import {mountConsultant} from './consultant.js';
import {mountOnboarding,mountRetainerClients} from './onboarding-view.js';
const config=window.GROUNDWORK_CONFIG,el=document.querySelector('groundwork-improvement'),err=document.querySelector('#error');
let token='',workspace='',loadVersion=0,view='board',boardReady=false;
const atlas=document.querySelector('groundwork-atlas'),living=document.querySelector('groundwork-living-atlas'),atlasNav=document.querySelector('#atlas-nav');
// The Living Atlas sits above the descriptive Atlas in the same tab; it hides itself when the workspace has no map.
const setProjection=data=>{atlas.projection=data;living.projection=data;if(view!=='atlas')living.hidden=true;};
function selectView(next){view=next;el.hidden=next!=='board'||!boardReady;atlas.hidden=next!=='atlas';living.hidden=next!=='atlas'||!living.map;document.querySelector('#show-board').setAttribute('aria-pressed',String(next==='board'));document.querySelector('#show-atlas').setAttribute('aria-pressed',String(next==='atlas'));}
document.querySelector('#show-board').onclick=()=>selectView('board');
document.querySelector('#show-atlas').onclick=()=>selectView('atlas');
// A link to onboarding (`?ws=…&view=onboarding`) and Stripe's return (`&bank_session=cs_…`); read before the URL is scrubbed.
const link=new URLSearchParams(window.groundworkCallback||'');
const want={ws:link.get('ws')||'',bankSession:/^cs_[A-Za-z0-9_]{6,200}$/.test(link.get('bank_session')||'')?link.get('bank_session'):''};
const onboarding=document.createElement('section');onboarding.id='onboarding';onboarding.hidden=true;el.before(onboarding);
const retainers=document.createElement('section');retainers.id='retainers';retainers.hidden=true;
const say=s=>window.groundworkShell?.t(s)??s;
const report=e=>{err.textContent=say(e.message||String(e));};
// `as`: 'blob' returns a file's bytes. A FormData body (an upload) goes as multipart, so no JSON content type.
async function api(path,options={},as){
 if(!config?.apiBase)throw new Error('The shared backend connection has not been configured.');
 const form=options.body instanceof FormData;
 const r=await fetch(config.apiBase.replace(/\/$/,'')+path,{...options,headers:{...(form?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),...options.headers},cache:'no-store'});
 if(as==='blob'&&r.ok)return r.blob();
 // An empty 2xx body is no data (null), not an outage.
 const text=await r.text().catch(()=>null);let body;try{body=text?JSON.parse(text):(r.ok?null:{message:'Backend unavailable'});}catch{body={message:'Backend unavailable'};}if(r.status===401){token='';sessionStorage.removeItem(SESSION_KEY);document.querySelector('#login').hidden=false;document.querySelector('#logout').hidden=true;document.querySelector('#picker').hidden=true;document.querySelector('#workspace-role').hidden=true;boardReady=false;el.hidden=true;el.board=null;setProjection(null);atlasNav.hidden=true;loadVersion++;}if(!r.ok){const error=new Error(Array.isArray(body.message)?body.message.join('\n'):body.message||'Request failed');error.status=r.status;throw error;}return body;
}
// The page around the board follows the workspace's language once signed in.
async function load(){
 const version=++loadVersion,selected=workspace;boardReady=false;el.hidden=true;el.board=null;setProjection(null);err.textContent='';document.querySelector('#workspace-role').hidden=true;
 const board=await api('/projects/improvement/workspaces/'+encodeURIComponent(selected));
 if(version!==loadVersion)return;
 el.board=board;boardReady=true;selectView(view);window.groundworkShell?.apply(board.workspace?.locale==='he'?'he':'en');
 const roleLabel=document.querySelector('#workspace-role');const roles={editor:['Consultant','יועץ'],owner:['Business owner','בעל העסק'],reader:['Viewer','צופה']};const label=roles[board.role];roleLabel.hidden=!label;roleLabel.textContent=label?(board.workspace?.locale==='he'?label[1]:label[0]):'';
 try{const data=await readAtlas(api,selected,board);if(version===loadVersion)setProjection(data);}
 catch(e){if(version===loadVersion){setProjection(null);report(e);}}
}
// The consultant (Groundwork admin) lands on "All clients"; a business owner straight on their own board.
const home=document.querySelector('#consultant');home.after(retainers);
function showBoard(on){loadVersion++;setProjection(null);boardReady=false;el.board=null;atlasNav.hidden=!on;home.hidden=on;retainers.hidden=on||!retainers.childElementCount;if(on)selectView(view);else{el.hidden=true;atlas.hidden=true;living.hidden=true;onboarding.hidden=true;}if(!on){document.querySelector('#workspace-role').hidden=true;window.groundworkShell?.apply();}}
async function start(){
 const workspaces=await api('/projects/improvement/workspaces');
 document.querySelector('#login').hidden=true;document.querySelector('#logout').hidden=false;
 // A client with one workspace (or none) never sees a picker; the consultant always does.
 document.querySelector('#picker').hidden=workspaces.length<=1;
 const select=document.querySelector('#workspaces');select.replaceChildren(...workspaces.map(w=>new Option(w.name,w.id)));
 let admin=false;
 // The onboarding checklist sits above the board while the workspace has a retainer; nothing shows when it has none.
 const showOnboarding=id=>{onboarding.hidden=true;onboarding.replaceChildren();mountOnboarding(onboarding,api,id,{admin,bankSession:id===want.ws?want.bankSession:''}).then(on=>{onboarding.hidden=!on;if(on&&id===want.ws)onboarding.scrollIntoView();}).catch(report);};
 const openClient=(id,name)=>{if(![...select.options].some(o=>o.value===id))select.add(new Option(name||id,id));select.value=id;workspace=id;showBoard(true);showOnboarding(id);load().catch(report);};
 const consultant=await mountConsultant(home,api,openClient).catch(e=>{report(e);return false;});
 select.onchange=()=>{if(!select.value){showBoard(false);return;}workspace=select.value;showBoard(true);showOnboarding(workspace);load().catch(report);};
 if(consultant){admin=true;document.querySelector('#picker').hidden=false;await mountRetainerClients(retainers,api,openClient).catch(report);
  // Retainer clients the consultant is not a member of still belong in his picker.
  for(const c of await api('/projects/improvement/consultant/clients').catch(()=>[]))if(![...select.options].some(o=>o.value===c.workspace_id))select.add(new Option(c.business_name,c.workspace_id));
 select.prepend(new Option(say('All clients'),''));select.value='';showBoard(false);if(want.ws)openClient(want.ws);return;}
 if(!workspaces.length){err.textContent=say('No workspace has been granted to this account yet.');return;}
 workspace=(workspaces.find(w=>w.id===want.ws)||workspaces[0]).id;select.value=workspace;showBoard(true);showOnboarding(workspace);await load();
}
document.querySelector('#login').onsubmit=async e=>{e.preventDefault();try{await api('/platform/auth/magic-link',{method:'POST',body:JSON.stringify({email:new FormData(e.target).get('email'),app_slug:config.appSlug})});err.textContent=say('Check your email for your sign-in link.');}catch(e){report(e);}};
document.querySelector('#logout').onclick=()=>{sessionStorage.removeItem('groundwork-session');location.reload();};
el.addEventListener('refresh',()=>load().catch(report));
el.addEventListener('save',async({detail:d})=>{try{await api('/projects/improvement/workspaces/'+workspace+'/nodes'+(d.id?'/'+d.id:''),{method:d.id?'PUT':'POST',body:JSON.stringify(d.body)});d.done();await load();}catch(e){d.done(e.message);}});
// Proposals, approval, comments, archive: the bundle names a path under the workspace; the backend enforces who may do what.
el.addEventListener('request',async({detail:d})=>{try{d.done(null,await api('/projects/improvement/workspaces/'+workspace+d.path,{method:d.method,...(d.body!==undefined?{body:d.body instanceof FormData?d.body:JSON.stringify(d.body)}:{})},d.as));}catch(e){d.done(e.message);}});
el.addEventListener('settings',async({detail:d})=>{try{await api('/projects/improvement/workspaces/'+workspace+'/settings',{method:'PATCH',body:JSON.stringify(d.body)});d.done();await load();}catch(e){d.done(e.message);}});
el.addEventListener('history',async({detail:d})=>{try{const rows=await api('/projects/improvement/workspaces/'+workspace+'/nodes/'+d.id+'/events');d.target.textContent=rows.map(r=>r.created_at+' · '+r.event_type+' · '+(r.metadata.actor||'Historical backfill')+'\n'+JSON.stringify(r.metadata.after?.cycle||{})).join('\n\n');d.target.className='pre';}catch(e){report(e);}});
(async()=>{try{
 const search=window.groundworkCallback;delete window.groundworkCallback;
 const magic=captureMagicLink({search,pathname:location.pathname},history);
 if(magic){
  sessionStorage.removeItem(SESSION_KEY);
  token=await verifyMagicLink(magic,config);
  sessionStorage.setItem(SESSION_KEY,token);
 }else token=sessionStorage.getItem(SESSION_KEY)||'';
 if(token)await start();
}catch(e){report(e);}})();
