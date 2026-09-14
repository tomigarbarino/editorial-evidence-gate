import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDraft,validateReview } from '../src/core.mjs';
const packet=JSON.parse(readFileSync(new URL('../data/evidence.json',import.meta.url)));
const initial=JSON.parse(readFileSync(new URL('../examples/initial-report.json',import.meta.url)));
test('actual first live run contains unsupported free-text question; new handoff blocks it',()=>{
 assert.equal(initial.review.decision,'approve');
 assert.ok(initial.draft.questions.some(q=>q.includes('often overlooked')));
 assert.ok(validateDraft(initial.draft,packet).includes('unapproved editor question'));
});
test('malformed question object returns a validation error instead of throwing',()=>{
 assert.ok(validateDraft({...initial.draft,questions:{}},packet).includes('unapproved editor question'));
});
test('null critic entry blocks instead of crashing the validator',()=>{
 assert.ok(validateReview({...initial.review,claim_checks:[null]},initial.draft).includes('critic coverage incomplete'));
});
