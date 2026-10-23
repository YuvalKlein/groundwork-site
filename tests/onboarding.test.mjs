import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS} from '../client-os/onboarding-view.js';

// The backend refuses a task that mentions a secret (unitism-backend access-tasks.ts); the presets must never trip it.
const SECRET = /\b(pass(word|code|phrase)s?|pwd|api[\s_-]*keys?|secret[\s_-]*keys?|private[\s_-]*keys?|access[\s_-]*tokens?|tokens?|2fa|two[\s-]*factor|mfa|multi[\s-]*factor|one[\s-]*time[\s-]*(code|password)s?|otp|verification[\s-]*codes?|recovery[\s-]*codes?|backup[\s-]*codes?|security[\s-]*codes?|credentials?|log[\s-]*in[\s-]*details|seed[\s-]*phrase)\b/i;

test('every standard access task invites the access email and never asks for a secret', () => {
  assert.equal(PRESETS.length, 11);
  assert.equal(new Set(PRESETS.map(p => p.system)).size, PRESETS.length);
  for (const p of PRESETS) {
    for (const f of ['system', 'title', 'instructions']) assert.equal(SECRET.exec(p[f]), null, `${p.system} ${f}`);
    assert.ok(p.instructions.includes('{email}'), p.system);
    assert.ok(p.title.length < 160 && p.instructions.length < 3000, p.system);
  }
});
