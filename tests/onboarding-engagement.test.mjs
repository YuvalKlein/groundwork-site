import test from 'node:test';
import assert from 'node:assert/strict';
import {isEngagement} from '../client-os/onboarding-view.js';

// Fresh Air (no retainer) saw the retainer checklist: an unreadable empty body became {message:'Backend unavailable'},
// which the page took for an engagement. Only a real engagement of this workspace counts.
test('only a real engagement of this workspace shows the onboarding checklist', () => {
  const w = 'fb275cfa-da03-424b-8c35-77c3f3520c50';
  assert.equal(isEngagement({id: 'e1', workspace_id: w, retainer_cents: 250000}, w), true);
  for (const notOne of [null, undefined, {}, {message: 'Backend unavailable'}, [], 'null', {id: 'e1', workspace_id: 'other'}, {workspace_id: w}])
    assert.equal(isEngagement(notOne, w), false, JSON.stringify(notOne));
});
