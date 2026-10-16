import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('atlas/atlas.js','utf8');
// Execute the shipped script, including boot, against a small DOM fixture. A
// duplicated/truncated script must fail here even if static deployment succeeds.
class Element {
  children=[]; attrs={}; dataset={}; textContent=''; value=''; events={};
  constructor(tag){this.tag=tag;}
  setAttribute(k,v){this.attrs[k]=v;}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;if(this.tag==='select')this.value=nodes[0]?.value||'';}
  addEventListener(k,v){this.events[k]=v;}
  querySelectorAll(){return this.children.flatMap(x=>x.children).filter(x=>x.tag==='input'&&x.checked);}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(fetcher,session='synthetic-session') {
  const nodes=Object.fromEntries(['map','layers','detail','summary','workspaces','workspace','refresh','unknowns'].map(id=>[id,new Element(id==='workspaces'?'select':id)]));
  const calls=[];
  vm.runInNewContext(source,{
    document:{querySelector:s=>nodes[s.slice(1)],createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),createTextNode:text=>({textContent:text})},
    window:{GROUNDWORK_CONFIG:{apiBase:'https://example.test/api/v1'}},
    sessionStorage:{getItem:()=>session},Option:function(name,id){this.textContent=name;this.value=id;},
    fetch:async(url,options)=>{calls.push({url,options});return fetcher(url,options);},
  });
  await flush();return {nodes,calls};
}
const json=data=>({ok:true,json:async()=>data});
const plate={workspace:{name:'Fixture A'},entities:[{id:'a',name:'Alpha',entity_type:'Process',provenance:['fixture']},{id:'b',name:'Beta',entity_type:'Actor',gaps:['Unmeasured']}],relationships:[{origin_entity_id:'a',target_id:'b'},{origin_entity_id:'a',target_id:'missing'}],unknowns:[{question:'What is unknown?'}],sources:[]};
test('unauthenticated Atlas does not request workspace data',async()=>{
  const {nodes,calls}=await setup(()=>assert.fail('must not fetch'),null);
  assert.equal(calls.length,0);assert.match(nodes.summary.textContent,/Sign in/);
});
test('authorized fixture renders recorded endpoints, filters layers and displays details safely',async()=>{
  const {nodes,calls}=await setup(url=>json(url.endsWith('/workspaces')?[{id:'fixture/a',name:'Fixture A'}]:plate));
  assert.match(calls[1].url,/fixture%2Fa\/atlas$/);
  assert.equal(calls[1].options.headers.Authorization,'Bearer synthetic-session');
  assert.equal(calls[1].options.cache,'no-store');assert.equal(calls[1].options.credentials,'omit');
  assert.equal(nodes.map.children.filter(x=>x.tag==='line').length,1);
  assert.match(nodes.summary.textContent,/2 of 2 recorded entities; 1 visible/);
  nodes.map.children.find(x=>x.tag==='g').events.click();
  assert.match(nodes.detail.textContent,/Alpha\nType: Process/);
  const input=nodes.layers.children.find(x=>x.children[0].dataset.layer==='Actor').children[0];
  input.checked=false;input.onchange();
  assert.match(nodes.summary.textContent,/1 of 2 recorded entities; 0 visible/);
});
test('workspace request failures clear old data and are reported',async()=>{
  let fail=false;
  const {nodes}=await setup(url=>fail?{ok:false,status:403}:json(url.endsWith('/workspaces')?[{id:'a',name:'A'}]:plate));
  fail=true;nodes.workspaces.value='b';await nodes.workspaces.onchange();
  assert.equal(nodes.map.children.length,0);assert.equal(nodes.layers.children.length,0);
  assert.equal(nodes.workspace.textContent,'');assert.equal(nodes.unknowns.children.length,0);
  assert.match(nodes.summary.textContent,/403/);assert.doesNotMatch(nodes.detail.textContent,/Alpha/);
});
test('late response from a previous workspace cannot replace current selection',async()=>{
  const pending=new Map();
  const {nodes}=await setup(url=>url.endsWith('/workspaces')?json([{id:'a',name:'A'}]):new Promise(resolve=>pending.set(url,resolve)));
  nodes.workspaces.value='b';const latest=nodes.workspaces.onchange();
  pending.get('https://example.test/api/v1/projects/improvement/workspaces/b/atlas')(json({...plate,workspace:{name:'B'}}));
  await latest;assert.equal(nodes.workspace.textContent,'B');
  pending.get('https://example.test/api/v1/projects/improvement/workspaces/a/atlas')(json(plate));
  await flush();assert.equal(nodes.workspace.textContent,'B');
});
