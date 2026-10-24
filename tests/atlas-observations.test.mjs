import test from 'node:test';
import assert from 'node:assert/strict';
import { observationsMarkup } from '../client-os/atlas-observations.mjs';
test('no retained observations after clearing or denied access', () => {
  assert.equal(observationsMarkup(null), '');
  assert.doesNotMatch(observationsMarkup({}), /<article/);
  assert.match(observationsMarkup({observation_status:'unavailable'}), /does not mean zero/);
});
test('renders server counts, unknowns and provenance without interpreting a sequential funnel', () => {
  const html=observationsMarkup({observations:[{id:'o',name:'Visited',value:6,unit:'rows',unknown_count:null,window:{from:'2026-10-01',to:'2026-10-20',timezone:'America/Chicago'},provenance:{refreshed_at:null},gaps:['Not sequential']},{name:'Booked',value:4,unit:'rows'},{name:'Unknown',value:null,unit:'rows'}]});
  assert.match(html,/6 rows/);assert.match(html,/4 rows/);assert.match(html,/<strong>Unknown<\/strong>/);
  assert.match(html,/Unknown status rows: Not supplied/);assert.match(html,/Source refreshed: Unknown/);
  assert.match(html,/Counts may overlap/);assert.match(html,/2026-10-01/);
});
test('escapes source values, gaps and evidence JSON', () => {
  const html=observationsMarkup({observations:[{name:'<img onerror=alert(1)>',value:0,unit:'rows',gaps:['<script>'],provenance:{locator:'<script>'}}]});
  assert.doesNotMatch(html,/<script>|<img/);assert.match(html,/&lt;script&gt;/);assert.match(html,/0 rows/);
});
