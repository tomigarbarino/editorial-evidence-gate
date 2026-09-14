# Evidence-gated editorial draft

Build a small, isolated Node workflow that prepares a sourced skincare editorial draft, then asks a separate agent to critique it. Only a complete, valid handoff may produce an editor-review artifact. Nothing publishes to a CMS or sends email.

Current state: new directory; no existing application modified. Local Ollama with qwen3.5:4b is available. A manually checked public NHS source packet is the initial input; no live crawler or customer data.

Scope: two distinct structured model calls, deterministic evidence and review gates, recorded stage outputs and hashes, a local readable review page, and fault-focused tests. Use built-in Node modules and no paid APIs.

Acceptance: actual writer and critic outputs captured; source IDs resolved only from the checked packet; missing/unknown evidence or incomplete review blocks; HTML is escaped; stale inputs block; dry-run replay is clearly labeled; tests and one live run complete; committed code is reviewable. No medical accuracy certification is claimed.

Risks: models share correlated errors; primary-source notes need human verification; titles can overstate evidence; source freshness is a checked date, not an automatic refresh. Every result requires editorial review. No automatic publication.

Validation: unit/contract tests for missing evidence, incomplete critic coverage, injection and stale input; one live two-agent run; desktop/mobile review of the generated artifact. No database, account or production API changes.

Rollback: stop the local server and discard this isolated prototype. It has no CMS or sending credentials and cannot affect the existing portfolio.
