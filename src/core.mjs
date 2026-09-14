export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = v => typeof v === 'string' && v.trim().length > 0;
const unique = xs => new Set(xs).size === xs.length;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validateEvidence(packet, now = new Date()) {
  const issues = [];
  if (!isObject(packet) || !Array.isArray(packet.claims) || !packet.claims.length || !Array.isArray(packet.sources) || !packet.sources.length) return ['missing evidence packet'];
  if (packet.claims.some(x => !isObject(x)) || packet.sources.some(x => !isObject(x))) return ['malformed evidence entries'];
  if (!unique(packet.claims.map(x => x.id)) || !unique(packet.sources.map(x => x.id))) issues.push('duplicate evidence IDs');
  for (const source of packet.sources) {
    let url; try { url = new URL(source.url); } catch {}
    if (!url || url.protocol !== 'https:' || !['www.nhs.uk', 'www.aad.org'].includes(url.hostname)) issues.push('unapproved source URL');
    const age = (now - new Date(source.checked_on)) / 86400000;
    if (!Number.isFinite(age) || age < 0 || age > 30) issues.push('source check is stale or invalid');
  }
  for (const claim of packet.claims) {
    if (!text(claim.id) || !text(claim.text) || !packet.sources.some(x => x.id === claim.source_id)) issues.push('claim has no approved source');
  }
  return issues;
}
export function validateDraft(draft, packet) {
  const issues = [];
  if (!isObject(draft)) return ['draft is not an object'];
  if (!text(draft.title) || draft.title.length > 120) issues.push('invalid title');
  if (!text(draft.angle) || draft.angle.length > 400) issues.push('invalid editorial angle');
  if (!Array.isArray(draft.claim_ids) || !draft.claim_ids.length || !unique(draft.claim_ids)) issues.push('invalid claim selection');
  else if (draft.claim_ids.some(id => !packet.claims.some(c => c.id === id))) issues.push('unknown claim ID');
  if (!Array.isArray(draft.questions) || !draft.questions.length || draft.questions.length > 3 || !unique(draft.questions) || draft.questions.some(q => !packet.editor_questions?.some(approved => approved.id === q))) issues.push('unapproved editor question');
  const content = [draft.title, draft.angle, ...(Array.isArray(draft.questions) ? draft.questions : [])].join(' ');
  if (/\b(guaranteed|cure|perfect jaw|ugly|inferior|alpha male)\b|\b\d+\s*\/\s*10\b|<script/i.test(content)) issues.push('unsafe or appearance-ranking language');
  return issues;
}
export function validateReview(review, draft) {
  if (!isObject(review)) return ['review is not an object'];
  const issues = [];
  if (review.decision !== 'approve') issues.push('critic did not approve');
  if (review.title_and_angle_supported !== true) issues.push('unsupported framing');
  if (review.harm_check_passed !== true) issues.push('critic harm check failed');
  if (!text(review.reason)) issues.push('review explanation missing');
  const checks = review.claim_checks;
  if (!Array.isArray(checks) || checks.some(x => !isObject(x)) || !unique(checks.map(x => x.id)) || checks.length !== draft.claim_ids.length ||
      draft.claim_ids.some(id => !checks.some(x => x.id === id && x.supported === true && text(x.reason)))) issues.push('critic coverage incomplete');
  return issues;
}
export function decide(packet, draft, review, now = new Date()) {
  const evidenceIssues = validateEvidence(packet, now);
  const draftIssues = evidenceIssues.length ? [] : validateDraft(draft, packet);
  const criticIssues = evidenceIssues.length || draftIssues.length ? [] : validateReview(review, draft);
  const issues = [...evidenceIssues, ...draftIssues, ...criticIssues];
  return {status: issues.length ? 'blocked' : 'needs_editor_review', publishable: false, issues};
}
export function renderMarkdown(packet, draft, review, decision) {
  const lines = ['# Editorial review artifact', '', '**Status: ' + decision.status + '**', '', 'Not published. Human editorial review is required.', ''];
  if (decision.issues.length) return lines.concat(decision.issues.map(x => '- ' + x)).join('\n');
  lines.push('## ' + draft.title, '', draft.angle, '');
  for (const id of draft.claim_ids) {
    const claim = packet.claims.find(c => c.id === id);
    const source = packet.sources.find(s => s.id === claim.source_id);
    lines.push('- ' + claim.text + ' [' + source.title + '](' + source.url + ')');
  }
  lines.push('', '### Questions for the editor', ...draft.questions.map(q => '- ' + packet.editor_questions.find(x => x.id === q).text), '', '### Separate critic step', review.reason, '', 'Source checks are manual snapshots; checked ' + packet.checked_at + '.');
  return lines.join('\n');
}
