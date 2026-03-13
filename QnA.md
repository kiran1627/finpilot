# FinPilot Deep Q&A (Panel + Investor + Judge + R&D)

Version: 1.0  
Date: 2026-03-12  
Scope: Whole repository scan of source/docs in `backend/` and `frontend/` (excluding generated/cache dirs like `.next/`, `venv/`, `__pycache__/`, `node_modules/`).

---

## Executive Quick Answers (Your 4 Panel Questions)

### Q1) What are the models used by each and every agent?
**Answer:**

| Agent | Model Type | Exact Model/Engine Used |
|---|---|---|
| `PerceptionAgent` | Rule-based deterministic | No ML model; reads Digital Twin state |
| `PredictionAgent` | Rule-based deterministic scoring | Handcrafted risk scoring (signals + thresholds) |
| `SimulationAgent` | Stochastic simulation with deterministic seed | Numpy RNG (seed from `run_id`), volatility assumptions, Sharpe scoring engine |
| `DecisionAgent` | Deterministic utility model | Weighted scoring formula (balance + Sharpe - violations - drawdown) |
| `GuardrailAgent` | Deterministic policy checks | Hard constraints (`autonomy_enabled`, projection availability, min balance) |
| `RealityExecutionAgent` | Deterministic cashflow execution | Calendar-driven rule engine (`day % 30`) |
| `InvestmentAllocationAgent` | Deterministic allocation gate | Risk-tier + policy-cap + safety buffer engine |
| `InvestmentAdvisorLLM` (investment_llm_agent) | Hybrid (LLM + strict parser + fallback) | OpenRouter chat completions using `google/gemma-3n-e2b-it:free`; safe fallback when unavailable |
| `InvestmentExecutionAgent` | Deterministic portfolio executor | `PortfolioAllocator` + `PortfolioCompoundingEngine` |
| `InvestmentExplanationAgent` | Deterministic template/knowledge-based explainer | Knowledge selector from local `explanation_knowledge.json` |
| `ExplanationAgent` | Deterministic narrative summarizer | Rule-based explanation text |

**Important nuance:** The LLM advice is advisory; final invest execution uses deterministic allocator logic.

---

### Q2) How are multi-agents communicating?
**Answer:**
- FinPilot uses **LangGraph `StateGraph(dict)`** orchestration.
- Every node gets a shared **state dictionary**, reconstructed into `SystemState` in `orchestrator/nodes.py`.
- Each agent returns **partial updates** (dict), and `_run()` merges them immutably into the shared state.
- Runtime dependency `db` is injected per node call (not part of pure domain state), then reattached.
- Graph order is explicit in `orchestrator/graph.py`:
  1. `perception`
  2. `prediction`
  3. `simulation`
  4. `decision`
  5. `guardrail`
  6. `reality_execution`
  7. conditional: autonomy on => investment pipeline (`investment_allocation -> investment_llm -> investment_execution -> investment_explanation`) else skip to `explanation`
  8. `explanation` -> END

In short: **state-passing over a graph**, not direct agent-to-agent calls.

---

### Q3) What type of MCPs are used in this project?
**Answer:**
- **No project-level MCP (Model Context Protocol) integration is implemented** in backend or frontend source.
- The project’s AI integration is direct **OpenRouter REST API** call in `backend/app/utils/openrouter_client.py`.
- Any MCP references found in `.next` are from Next.js dev tooling internals, not FinPilot application logic.

So for panel answer: **“No MCP architecture is used by FinPilot code currently; AI is integrated via direct OpenRouter HTTP call.”**

---

### Q4) If I am getting salary at end of month, how will this cycle be used by agents?
**Answer (code-accurate):**
1. Salary is represented as monthly `IncomeStream` in the Digital Twin.
2. `RealityExecutionAgent` applies recurring monthly cashflows only when `day % 30 == 0`.
3. The graph first evaluates risk/strategy and executes event-window progression, then may move into investment pipeline.
4. If an event occurs before day 30, that step may finish and still invest (based on current state), and the loop can stop once investment is executed.
5. Monthly salary gets applied only if execution reaches day 30 inside loop progression.

**Critical implementation nuance for panel discussion:**
- `PredictionAgent` currently subtracts monthly expenses but does **not** add monthly incomes in projected balance computation.  
- Salary effect is primarily realized in `RealityExecutionAgent` (calendar execution), not in prediction projection math.

---

## Architecture Q&A

### Q5) What is FinPilot in one line?
A multi-agent autonomous personal-finance decision system with explainability, guardrails, and ledger-backed replay.

### Q6) What are the two major runtime parts?
Backend: FastAPI + LangGraph orchestration. Frontend: Next.js App Router UI with agent output visualization.

### Q7) What is the central domain abstraction?
`FinancialDigitalTwin`, a simulatable and mutable financial state model containing balances, recurring flows, and events.

### Q8) What is the central orchestration abstraction?
`SystemState` dataclass, the single source-of-truth payload flowing through all agent nodes.

### Q9) Is this event-driven or request-driven?
Both. Request starts cycle (`/run-autonomy-cycle`), then event/cycle logic advances time in graph execution.

### Q10) Why graph orchestration over chained function calls?
It makes stage order explicit, allows conditional edges (autonomy gate), and keeps state transitions inspectable/replayable.

### Q11) Where does the cycle start?
API endpoint `POST /run-autonomy-cycle`.

### Q12) Where is graph built?
`backend/app/orchestrator/graph.py` via `build_finpilot_graph()`.

### Q13) Is the execution deterministic?
Mostly deterministic. One advisory LLM node is nondeterministic, but has strict parse/validation and deterministic fallback.

### Q14) How is replayability improved?
Seeded simulation RNG from `run_id`, append-only ledger entries, and run snapshots persisted per cycle.

### Q15) Is business logic in frontend?
No. Frontend consumes backend outputs and displays pipeline/ledger details.

### Q16) What is persisted per run?
Run metadata, ledger entries (what happened), snapshots, and final state summary.

### Q17) How are users isolated?
JWT-authenticated routes query data by current `user_id` and DB rows include `user_id` FK.

### Q18) Is there an autonomy kill switch?
Yes, `autonomy_enabled` in profile and state; graph condition can skip investment stages.

### Q19) Is real broker execution integrated?
Not currently. Investment execution is internal ledger + simulated instrument mapping.

### Q20) Is this production-ready as-is?
Good architecture foundation, but some gaps remain (e.g., SQLite scaling, legacy tests mismatch, no rate limiting).

---

## Agent-by-Agent Deep Q&A

### Q21) What does `PerceptionAgent` output?
Current day, current balance, and next event metadata into `agent_outputs["perception"]`.

### Q22) Does `PerceptionAgent` mutate money?
No. It is pure observation.

### Q23) How does `PredictionAgent` compute risk?
Rule score based on projected balance, runway, event proximity, income stability, expense burden, volatility buffer, and user-type bias.

### Q24) What are prediction risk tiers?
`LOW` (<3), `MEDIUM` (3–5), `HIGH` (>=6) by current scoring thresholds.

### Q25) Does `PredictionAgent` include salary in projected balance?
Currently, no explicit income add in projection loop; it subtracts monthly expenses and upcoming event burden.

### Q26) What does `SimulationAgent` simulate?
Three strategies (`conservative`, `balanced`, `aggressive`) over a horizon up to 30 days or until next event window.

### Q27) Is simulation random each time?
Pseudo-random but reproducible per run due to seed from `run_id`.

### Q28) Why include Sharpe score?
To penalize volatility-adjusted poor return behavior beyond raw ending balance.

### Q29) How does `DecisionAgent` choose strategy?
Stable weighted utility of normalized ending balance + clamped Sharpe - constraint violations - drawdown.

### Q30) What prevents scoring explosion?
Sharpe clamping to [-3, 3] and drawdown clamping to [0, 1].

### Q31) What does `GuardrailAgent` block?
Investment execution if autonomy disabled, projection missing, or projected balance below minimum threshold.

### Q32) Does `GuardrailAgent` stop reality execution too?
No. Reality execution is intentionally always run in graph before autonomy gate branch decision.

### Q33) What does `RealityExecutionAgent` do exactly?
Advances day, applies recurring income/expenses when due, applies event expenses, appends ledger entries, updates outputs.

### Q34) What is cycle day constant?
`CYCLE_DAYS = 30`.

### Q35) How is investable amount calculated?
By `InvestmentAllocationAgent` using surplus after `1.5 * min_balance` safety buffer and risk/policy caps.

### Q36) What if risk is HIGH?
Investment is blocked (`investable_amount = 0`).

### Q37) What if risk is MEDIUM?
Cap is limited to `min(user_cap, 40%)` of surplus.

### Q38) What if risk is LOW?
User policy cap can be fully used (default 50%).

### Q39) What does `InvestmentAdvisorLLM` return?
JSON allocation with percentages, category, and example funds for mutual_funds/bonds/gold/cash.

### Q40) What if LLM call fails or rate-limits?
Node falls back safely to deterministic allocation-like structure and does not break autonomy.

### Q41) Does LLM directly execute money movement?
No. It produces advisory suggestions only.

### Q42) Who actually deducts the invested amount?
`InvestmentExecutionAgent` deducts from `twin.current_balance` and writes investment ledger entry.

### Q43) Which allocator is used for final percentages?
`PortfolioAllocator` (deterministic) from `backend/app/portfolio/allocator.py`.

### Q44) Is long-term growth shown?
Yes, 10-year projection is produced by `PortfolioCompoundingEngine` in execution stage.

### Q45) What does `InvestmentExplanationAgent` add?
Readable explanation text from executed allocation + local explanation knowledge base.

### Q46) What does final `ExplanationAgent` add?
Overall cycle narrative: projected balance context, risk interpretation, strategy selection reason, confidence heuristic.

### Q47) Are agents stateful across requests?
No. They are instantiated per node run and operate on passed state.

### Q48) How do agents expose UI-ready data?
Through structured `state.agent_outputs` per agent key.

### Q49) Are there hard idempotency guards?
Yes. `investment_executed` checks in allocation/execution stages prevent duplicate invest actions.

### Q50) Is there any hidden side-channel communication between agents?
No. Communication is exclusively through shared state fields and returned updates.

---

## Multi-Agent Communication & Orchestration Q&A

### Q51) Where is node-to-agent binding done?
In `orchestrator/nodes.py`, each node function calls `_run(Agent(), state)`.

### Q52) How is DB session made available to agents?
`db` is popped from state dict, injected as `agent.db`, and reattached after node update.

### Q53) Why not include DB session inside `SystemState`?
To keep `SystemState` pure domain data and avoid runtime dependency pollution.

### Q54) What type is graph state?
Dictionary (`StateGraph(dict)`).

### Q55) How is loop bounded?
`run_autonomy_loop` has `max_steps=30` safety bound.

### Q56) What are stop conditions in autonomy loop?
Break when autonomy disabled, investment executed, or no next event.

### Q57) Where are snapshots persisted?
`autonomy_loop.py` writes `state_snapshot` per iteration and `final_snapshot` at end.

### Q58) Is event logging duplicated?
Some event and investment traces are persisted both at agent execution and service-level snapshot stages (intentional audit richness but should be discussed).

### Q59) Is there branch for autonomy-off behavior?
Yes. Graph conditional from `reality_execution` routes to `explanation` when autonomy is off.

### Q60) Does guardrail branch graph edges directly?
No direct graph branching on guardrail output; guardrail output affects downstream investable behavior/pipeline safety semantics.

### Q61) Can investment pipeline run with zero investable amount?
Pipeline nodes can still execute but execution agent will hard-noop if amount <= 0.

### Q62) Is concurrency handled at graph level?
No explicit concurrent multi-run control in graph; request-level concurrency is via API server/DB transaction boundaries.

### Q63) Is graph execution synchronous?
Current implementation uses synchronous invoke and loop.

### Q64) Is there retry logic around node failures?
Not centralized in graph loop; robust behavior comes from agent-level guards and LLM fallback.

### Q65) Can we explain communication in one sentence for panel?
“Agents communicate by reading/writing a shared typed state object orchestrated through LangGraph node transitions.”

---

## MCP, AI, and Model Governance Q&A

### Q66) Does FinPilot run an MCP server?
No.

### Q67) Does FinPilot consume MCP tools from third-party servers?
No.

### Q68) Is there any MCP config file in project source?
No project-level MCP config detected.

### Q69) Then what AI integration is used?
Direct HTTP call to OpenRouter chat-completions API from backend utility client.

### Q70) Which exact LLM identifier is configured?
`google/gemma-3n-e2b-it:free`.

### Q71) Is AI mandatory for cycle success?
No. AI advisory node gracefully degrades to deterministic fallback.

### Q72) How is hallucination risk contained?
Strict JSON parsing, required key checks, range checks, and fallback behavior.

### Q73) Are output percentages normalized?
Yes; parsed percentages are normalized to sum to 100.

### Q74) Are there explicit policy constraints in prompt?
Yes, equity bounds by risk/user context and gold diversification range constraints.

### Q75) Can panel ask “why this model?”
Answer: chosen as low-cost advisory layer; not critical path, safe fallback guarantees continuity.

### Q76) Is provider lock-in high?
Low. Single utility function can swap model/provider centrally.

### Q77) Is temperature controlled?
Yes, low-ish value used for more stable advisory output.

### Q78) Is model output trusted blindly?
No. It is validated and not directly used for cash movement.

### Q79) Is there PII sent to LLM?
Prompt includes financial context; no explicit direct masking layer shown, so this is a valid governance question.

### Q80) How to answer “Why no MCP?”
Because this architecture currently needs one bounded advisory call; direct API reduced integration complexity at this stage.

---

## Salary / Monthly Cycle / Cashflow Q&A

### Q81) Where are monthly incomes defined?
Input profile `incomes` mapped to `IncomeStream` in Digital Twin.

### Q82) Which component applies salary credit?
`RealityExecutionAgent` when day hits monthly trigger (`day % 30 == 0`).

### Q83) Are monthly expenses and salary applied in same pass?
Yes, both processed on monthly trigger days in recurring loops.

### Q84) What if next event is on day 15?
Reality execution may only advance to event day first, apply event, then proceed in later iterations depending on stop conditions.

### Q85) Could investment happen before day-30 salary posting?
Yes, depending on event timing and whether loop stops after investment execution.

### Q86) How should panel interpret this behavior?
Current design prioritizes event-window decisioning and may not always wait for month-end posting before invest action.

### Q87) Is that a bug or policy?
More a policy/flow choice in current implementation; can be adjusted if month-end-first behavior is desired.

### Q88) Does prediction currently over-penalize users with salary streams?
Potentially yes, because projected balance does not currently add recurring income in prediction formula.

### Q89) Does simulation include incomes?
Yes, simulation loop applies monthly incomes/expenses at monthly boundaries.

### Q90) Why is this important for demos?
Panel may ask why prediction and execution differ in salary treatment; acknowledging this increases credibility.

### Q91) How to explain “end-of-month salary” in practical terms?
“Salary is encoded as recurring income and applied when cycle day reaches the month boundary; whether that occurs before investment depends on event timing and stop condition.”

### Q92) What if user is paid weekly?
Schema allows weekly timing; recurring execution logic is presently monthly-focused in core reality/simulation loops.

### Q93) What if income is irregular?
Input supports irregular nature/timing, but current recurring application logic primarily implements monthly paths.

### Q94) How does min balance affect salary-cycle investing?
Investable amount is constrained by projected safety and surplus after `1.5x min_balance` buffer.

### Q95) Can user directly limit investment from salary surplus?
Yes, via `investment_policy.max_investment_pct` (0–100, default 50).

---

## API & Data Contract Q&A

### Q96) Main execution API?
`POST /run-autonomy-cycle`.

### Q97) Is the endpoint protected?
Yes, it requires authenticated user via dependency injection (`get_current_user`).

### Q98) What goes in request body?
Current/min balances, incomes, expenses, upcoming events, autonomy flag, user type, optional investment policy.

### Q99) What comes back?
`run_id`, `final_balance`, `risk_level`, `strategy`, ledger entries, and `agent_outputs`.

### Q100) Routes for run history?
`/api/runs` (list runs), `/{run_id}/replay` under same prefix.

### Q101) Route for ledger history?
`/api/ledger`, optional `run_id` filter.

### Q102) Route for dashboard summary?
`/api/dashboard/summary`.

### Q103) Route for investments list?
`/api/investments`.

### Q104) Route for sandbox bank flow?
`/api/bank/sandbox-verify` and `/api/bank/sandbox-balance`.

### Q105) Is schema strict on user type?
Yes: `student | freelancer | professional | organisation`.

### Q106) Is investment cap validated?
Yes (`ge=0`, `le=100`).

### Q107) Are event amounts signed convention documented?
Yes, event comment indicates expense (+), income (-).

### Q108) Is there versioned API namespace?
Partially (`/api/*` for many routes, but `/run-autonomy-cycle` is top-level).

### Q109) Are there response models everywhere?
Not everywhere; some routes return plain dicts/lists.

### Q110) Is CORS configured?
Yes, with env-driven override and localhost/prod defaults.

---

## Persistence, Audit, and Replay Q&A

### Q111) Core DB tables?
`runs`, `ledger_entries`, `audit_logs`, plus auth `users`.

### Q112) What does ledger store?
Append-only event/income/expense/investment/snapshot payloads as JSON text.

### Q113) Why append-only ledger matters?
Supports forensic audit, traceability, and deterministic replay narratives.

### Q114) What does audit log store?
Decision-trace style payload entries for explainability/compliance trails.

### Q115) How are runs tied to users?
`user_id` foreign keys with cascade behavior.

### Q116) What repositories are used?
`RunRepository`, `LedgerDBRepository`, `AuditLogRepository`.

### Q117) When is run record created?
At start of `run_autonomy_loop` before graph iterations.

### Q118) When is final run summary written?
After loop exit via `update_run` and final snapshot ledger write.

### Q119) Is DB engine production-grade by default?
Current setup is SQLite-focused; suitable for dev/demo, limited for large-scale multi-worker production.

### Q120) Is replay endpoint deterministic?
Designed to be deterministic at architecture level; actual reproducibility quality depends on exact state snapshot and random-seed strategy.

---

## Frontend & Demo UX Q&A

### Q121) Which frontend framework/version style?
Next.js App Router project using React, TS, Tailwind-based styling.

### Q122) How are API calls handled?
Axios service layer (`frontend/services/*`), with auth context and route-specific service functions.

### Q123) Where is cycle trigger from UI?
Setup flow calls autonomy service `runCycle` posting to `/run-autonomy-cycle`.

### Q124) How are agent outputs shown to judges?
`AgentExecutionDisplay` renders per-agent cards in pipeline order with replay-style progressive visualization.

### Q125) Can judges see final decision summary quickly?
Yes, dashboard presents final balance, risk badge, and chosen strategy summary.

### Q126) Is run history discoverable?
Yes, recent runs and dedicated run/replay pages are present.

### Q127) Is there route protection?
Yes, `ProtectedRoute` wraps authenticated pages.

### Q128) Where is local snapshot persisted for quick dashboard view?
Dashboard reads latest execution snapshot from local storage keyed by user.

### Q129) Are charts present?
Yes, NAV trend chart and risk/summary UI components.

### Q130) Is frontend tied to backend agent key names?
Yes, display component expects canonical keys like `prediction`, `decision`, `guardrail`, `investment_execution`.

---

## Security, Governance, and Reliability Q&A

### Q131) Authentication mechanisms?
Local email/password + Google OAuth, JWT bearer for protected routes.

### Q132) Password hashing approach?
Passlib with bcrypt configured rounds.

### Q133) JWT algorithm and expiry?
HS256 with expiry hours from settings/env.

### Q134) What if JWT secret missing?
Token creation/decoding raises runtime error by design.

### Q135) Is brute-force rate limiting present on login?
No explicit limiter shown in current backend route definitions.

### Q136) Is OAuth client validation done?
Yes, Google token verified against configured client id; email verified claim required.

### Q137) Is authorization per-user on data routes?
Yes, route handlers use current user and query by user id.

### Q138) Is there data encryption at rest?
No explicit at-rest encryption layer shown for DB payloads.

### Q139) Is LLM timeout controlled?
Yes, short timeout with graceful fail-open to fallback path.

### Q140) Is LLM rate limit handled?
Yes, 429 returns are caught and treated as advisory unavailability.

### Q141) Is OpenRouter key optional?
Yes. If missing, LLM advisory is disabled safely.

### Q142) Is system resilient without LLM?
Yes, deterministic pipeline still runs and can execute allocations.

### Q143) Is there an explicit compliance/audit story?
Yes: ledger + audit repositories + reasoned outputs across agents.

### Q144) Are there known reliability caveats?
Legacy tests and some paths suggest interface drift in parts of codebase (important panel honesty point).

### Q145) Should this be pitched as “fully autonomous real-money platform”?
Safer pitch: “autonomy engine with guardrails and simulated execution-ready architecture,” unless broker integration is added.

---

## Testing and Quality Q&A

### Q146) What test suites exist?
Agent-focused backend tests for decision logic, guardrails, simulations, and end-to-end placeholder flow.

### Q147) Are tests perfectly aligned with current agent return style?
Not fully; some tests appear written for older in-place mutation patterns.

### Q148) Why does this matter for panel?
Shows system evolved quickly; architecture is stronger than current test maturity and should be acknowledged.

### Q149) Is there frontend automated test suite in repo?
No substantial frontend test suite observed in current tree.

### Q150) Is there CI workflow visible?
No explicit CI workflow files observed in scanned top-level project structure.

### Q151) What is a credible response if asked about quality assurance?
“Core agent logic is unit-tested in backend; next milestone is tightening contract tests and end-to-end integration coverage.”

### Q152) How to demonstrate confidence live?
Use replay and agent outputs screen to show deterministic, explainable state transitions per run.

---

## Investor-Focused Q&A

### Q153) What is the monetizable differentiator?
Transparent multi-agent decisioning + explainable ledger trail vs opaque recommendation-only systems.

### Q154) Why is explainability commercially useful?
Improves trust, adoption, and enterprise/regulatory readiness.

### Q155) Is LLM cost a blocker?
No, LLM is advisory-only and can be disabled/fallback; core engine remains deterministic.

### Q156) What de-risks model outages?
Graceful no-throw OpenRouter wrapper with deterministic fallback.

### Q157) Where is lock-in risk?
Low-to-moderate: mostly in one adapter function; orchestration and policy logic remain provider-agnostic.

### Q158) What would enterprise clients ask first?
Auditability, policy controls, and user-level data isolation — all represented in current architecture.

### Q159) What scaling bottleneck appears first?
SQLite and synchronous execution flow under high concurrent usage.

### Q160) What is immediate scale roadmap?
Migrate to Postgres, add queue/worker execution, strengthen observability and rate limiting.

### Q161) Why should investor believe this team can ship?
Codebase already has full stack + auth + orchestration + dashboard + replay primitives integrated.

### Q162) What is one honest weakness to disclose?
Some test/legacy path drift exists; cleanup and consistency hardening are near-term technical priority.

### Q163) Is there an expansion path?
Yes: bank integrations, broker APIs, policy personalization, and institutional risk controls.

### Q164) Can this support B2B use-cases?
Architecture can adapt to advisor dashboards/compliance workflows due to ledger and explainability-first design.

### Q165) Is current value proposition “returns maximization” only?
No; it’s balanced autonomy + safety + explainability + replay/audit.

---

## Panel/Judge Challenge Questions (with crisp answers)

### Q166) Why multi-agent, not one monolithic model?
Separation of concerns improves controllability, testability, and explainability per stage.

### Q167) Where exactly is safety enforced?
Guardrail + allocation + execution hard checks; not in one place only.

### Q168) Is this truly autonomous?
Autonomous within user-defined constraints and policy caps.

### Q169) Can user disable autonomy?
Yes, via profile flag.

### Q170) If autonomy is off, does everything stop?
Investment path is skipped; reality/event processing remains in graph by current design.

### Q171) How are decisions explained to non-tech users?
Dedicated explanation agents produce plain-language summaries and allocation narratives.

### Q172) Are decisions reproducible?
Mostly, due seeded simulations and persisted snapshots/ledger entries.

### Q173) Could LLM output break system?
No; strict parser and fallback prevent pipeline crashes.

### Q174) Is there any hidden manual override in code?
No hidden backdoor; control is via explicit flags and policies.

### Q175) Why trust scoring weights in decision agent?
They are explicit and inspectable; can be calibrated as product matures.

### Q176) How does frontend prove pipeline reality?
By rendering per-agent outputs with run id and final summary tied to backend response.

### Q177) What is strongest technical novelty?
Combining deterministic finance pipeline + optional LLM advisory + replayable ledger under graph orchestration.

### Q178) What is strongest practical novelty?
Auditable autonomous cycle with user override and clear rationale surfaces.

### Q179) What’s the best panel-safe claim?
“FinPilot is an explainable autonomous finance engine, not a black-box trading bot.”

### Q180) What’s one thing to avoid claiming?
Avoid claiming fully broker-integrated real-money execution unless implemented.

---

## R&D Faculty Deep Questions

### Q181) Is this a learning system or rule-based engine?
Current implementation is primarily rule-based/deterministic with one bounded LLM advisory component.

### Q182) Are there trainable parameters in deployed pipeline?
Not in current code path; weights and thresholds are configured constants.

### Q183) Is there Bayesian/probabilistic risk model?
Not currently; risk is heuristic scoring plus stochastic scenario simulation.

### Q184) Why use both prediction and simulation?
Prediction gives immediate risk diagnostics; simulation compares strategy outcomes under volatility assumptions.

### Q185) Are correlations across assets modeled explicitly?
Not deeply; allocator relies on expected-return and volatility-adjustment components with simplified assumptions.

### Q186) How to improve research depth?
Add regime-aware models, dynamic covariance estimation, and calibrated probabilistic risk forecasts.

### Q187) Is explainability post-hoc or intrinsic?
Mostly intrinsic deterministic logic + structured explanatory outputs.

### Q188) Is there causal attribution?
No explicit causal inference layer currently.

### Q189) How is uncertainty quantified for users?
Through risk level/signals and simulated metrics (drawdown/volatility/sharpe), not full probabilistic intervals.

### Q190) Is benchmark comparison built-in?
No direct benchmark (e.g., index baseline) module found in current API outputs.

### Q191) What about behavioral personalization?
Limited to user-type bias and policy constraints at present.

### Q192) Can this become adaptive?
Yes, architecture allows plugging adaptive agents while retaining same state contract.

### Q193) Is there experiment framework in repo?
No explicit experimentation framework observed.

### Q194) Are assumptions transparent?
Yes, because thresholds/weights are in code and can be reviewed line-by-line.

### Q195) Is reproducibility publishable?
Reasonably, with caveat that external LLM advisory should be frozen or disabled for strict reproducibility.

---

## Deployment / Ops / Engineering Management Q&A

### Q196) Runtime stack?
Python FastAPI backend + Next.js frontend.

### Q197) Key Python dependencies?
FastAPI, uvicorn, numpy, pandas, pydantic, langgraph, passlib, PyJWT, google-auth.

### Q198) Is env management present?
Yes via `.env` and pydantic settings.

### Q199) Is DB migration tooling present?
No explicit migration framework observed in scanned files.

### Q200) Is task queue present?
No dedicated background queue/worker layer observed.

### Q201) Can backend be containerized easily?
Yes, structure is straightforward though Docker artifacts were not central in scanned summary.

### Q202) Observability maturity?
Basic logging exists; no full tracing/metrics stack shown.

### Q203) What should be prioritized for production hardening?
Rate limits, DB migration to Postgres, contract tests, centralized logs/metrics, secrets hygiene.

### Q204) Is there strict typing in frontend?
TypeScript is used, but some service payloads still use broad `any` typing.

### Q205) Is code organization modular?
Yes, clear separation across agents, API, services, db, orchestrator, and frontend service/component layers.

---

## Honest Limitations You Can State Confidently

### Q206) Are all tests green and modernized?
Not guaranteed; some tests appear legacy relative to current endpoint/function signatures.

### Q207) Is MCP implemented?
No.

### Q208) Is direct market execution implemented?
No direct broker integration in current flow.

### Q209) Is salary handling perfect in prediction?
No; salary inclusion in projection is currently limited/inconsistent versus recurring execution stage.

### Q210) Is this still panel-worthy despite gaps?
Yes — architecture, orchestration, explainability, and safety controls are strong and demonstrable.

---

## One-Minute Viva Script (Optional)

**“FinPilot is a LangGraph-orchestrated, multi-agent autonomous finance engine. Each agent has a single responsibility and communicates through a shared `SystemState`. Most agents are deterministic rule/simulation engines; only one advisory node uses OpenRouter Gemma, with strict parsing and deterministic fallback. Safety is enforced by guardrails, risk-tier investment caps, and a min-balance buffer. Every step is persisted in an append-only ledger for replay and audit. There is no MCP integration today; AI is direct API-based. For end-of-month salary, recurring income is applied by reality execution on monthly boundaries, and investment is then constrained by risk and policy caps.”**



End of document.
