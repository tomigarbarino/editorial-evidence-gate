import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateEvidence, validateDraft, decide, renderMarkdown } from './core.mjs';
import { callAgent, writerSystem, criticSystem, writerSchema, criticSchema } from './agents.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const packet = JSON.parse(await readFile(resolve(root,'data/evidence.json'),'utf8'));
const replay = process.argv.includes('--replay');
const model = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
const endpoint = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const runId = new Date().toISOString().replace(/[:.]/g,'-');
const dir = resolve(root,'runs',runId);
await mkdir(dir,{recursive:true});
const trace = [];
const record = async (name,value) => {
  await writeFile(resolve(dir,name+'.json'),JSON.stringify(value,null,2));
  trace.push({stage:name,output_sha256:digest(value),at:new Date().toISOString()});
};
let draft=null, review=null, decision;
try {
  const evidenceErrors = validateEvidence(packet);
  if(evidenceErrors.length) throw new Error(evidenceErrors.join('; '));
  await record('00-evidence',packet);
  if(replay) {
    const sample=JSON.parse(await readFile(resolve(root,'examples/report.json'),'utf8'));
    draft=sample.draft;review=sample.review;
    await record('01-writer',{output:draft,mode:'replay'});
    await record('02-critic',{output:review,mode:'replay'});
  } else {
    console.log('writer: started');
    const writer=await callAgent({system:writerSystem,input:packet,schema:writerSchema,model,endpoint});
    await record('01-writer',writer);draft=writer.output;
    const errors=validateDraft(draft,packet);
    if(errors.length) throw new Error('Writer handoff: '+errors.join('; '));
    console.log('critic: started');
    const critic=await callAgent({system:criticSystem,input:{packet,draft},schema:criticSchema,model,endpoint});
    await record('02-critic',critic);review=critic.output;
  }
  decision=decide(packet,draft,review);
} catch(error) {
  decision={status:'blocked',publishable:false,issues:[error.message]};
}
const report={run_id:runId,mode:replay?'replay':'live',created_at:new Date().toISOString(),packet,draft,review,decision,trace};
await writeFile(resolve(dir,'report.json'),JSON.stringify(report,null,2));
await writeFile(resolve(dir,'review.md'),renderMarkdown(packet,draft,review,decision));
console.log(JSON.stringify({run_id:runId,mode:report.mode,status:decision.status,issues:decision.issues,directory:dir}));
if(decision.status==='blocked') process.exitCode=1;
