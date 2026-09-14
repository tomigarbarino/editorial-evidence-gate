# Evidence Gate

A small two-agent editorial workflow for a grooming-content desk. It turns a checked primary-source packet into an **unpublished editor-review artifact**. The writer selects evidence; a separate critic audits the handoff; deterministic code decides whether it can reach an editor.

## Run

Node 22+; no npm dependencies, account, API key, or paid inference needed for replay.

```sh
npm test
npm run replay
npm run serve
```

Open http://127.0.0.1:4178. The desk displays the captured live run in `examples/report.json`, not an invented live status. “Test an invented citation” injects an unknown ID and demonstrates blocking despite a positive critic decision.

For a new live run, install Ollama, make `qwen3.5:4b` available, then:

```sh
npm run live
```

Each execution writes a separate `runs/<timestamp>/` containing evidence, both agent outputs, hashes, timings, the final decision and Markdown. Live inference is restricted to localhost. `OLLAMA_MODEL` and `OLLAMA_URL` may configure another local model. A 90-second deadline and output budget bound each call. Failures return a blocked report and nonzero exit status; there is no retry loop.

## The handoffs

1. **Checked evidence → writer agent.** A human-curated NHS packet is data, not model instructions. The writer produces a structured title, editorial angle, claim IDs and editor-question IDs.
2. **Validated writer output → critic agent.** Unknown evidence or question IDs stop the chain before the second call. The critic must check every selected claim, framing and harm concerns, and explain its decision.
3. **Critic output → deterministic gate.** Rejects missing coverage, duplicate IDs, stale sources, unsupported framing and negative reviews. Claim text is resolved from the checked packet, never invented by the writer.
4. **Gate → editorial desk.** Even a passing run is `needs_editor_review`, with `publishable: false`. The code contains no CMS or email capability.

The writer and critic use distinct prompts and separate calls to the **same** local model. This is separation of responsibilities, not independent-model consensus.

## A failure found in the actual first run

`examples/initial-report.json` preserves the first live result. Its writer asked why reapplication frequency is “often overlooked.” The NHS packet did not establish that behavioral premise, but the critic approved the draft anyway.

I changed the handoff rather than merely asking the model to be more careful: editor questions now come from an approved ID catalog. Unknown or free-text questions fail deterministically. `test/regression.test.mjs` loads the actual first output and proves that the new validator blocks it. The corrected live run selects three catalog IDs and reaches editor review.

Another integration defect appeared in the browser: the shared gate originally imported Node crypto for trace hashing, so the desk stayed on its loading state. Hashing now lives in the Node runner; the shared gate is browser-compatible. Browser verification then exercised the visible unknown-citation block.

## Evidence and verification

- Initial live run: 2026-09-14T14:54:29Z; raw writer and critic outputs retained.
- Corrected live run: 2026-09-14T14:57:48Z; two completed model calls, raw outputs and trace hashes retained.
- Fourteen automated tests cover the real regression, evidence fabrication, incomplete critic coverage, duplicate checks, stale/unapproved sources, malformed output, truncation, rendering escapes and remote-model refusal.
- Replay is separately labeled and does not call a model.
- The browser demonstration is a simulation of a fault, not a new model run.

## Sources and limits

The seed packet paraphrases a small part of [NHS sunscreen and sun-safety guidance](https://www.nhs.uk/live-well/seasonal-health/sunscreen-and-sun-safety/), checked on 14 September 2026. NHS lists a review date of 24 March 2026. Its UK sunscreen-labeling guidance needs regional editorial review before use elsewhere.

This is not a source crawler, clinical review, or proof that a model is safe. Source notes are manually trusted inputs; the 30-day age gate measures when they were checked, not when the source changed. Regex checks catch only a small subset of harmful framing. Both model stages can share errors, and title/angle review remains probabilistic. The draft requires a qualified editor; no live audience receives it.

No confidential hiring questions, personal CV data, customer information, production credentials or prior private project code are included.


Browser checks completed in Chrome at 1440x1000 and 390x844: no horizontal overflow; the citation fault changed the visible result to BLOCKED: unknown claim ID. The local desk loads after separating Node-only hashing from the shared gate.
