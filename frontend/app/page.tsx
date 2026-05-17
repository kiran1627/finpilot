"use client";

import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    // Observe all sections with animations
    const sections = document.querySelectorAll(
      ".proof-section, .problem-section, .flow-section, .trust-strip, .process-section, .usecase-section, .testimonial-section, .mid-cta-section, .security-section, .faq-section, .contact-section, .landing-footer"
    );
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      <div className="matrix-bg" aria-hidden="true">
        <span className="matrix-stream">$ BTC ETH FX QQQ SPX</span>
        <span className="matrix-stream">EUR JPY INR 4.2% 3.1%</span>
        <span className="matrix-stream">RISK LOW MED HIGH</span>
        <span className="matrix-stream">ALPHA 1.8x NAV 48032</span>
        <span className="matrix-stream">BUY HOLD HEDGE SELL</span>
        <span className="matrix-stream">$ BTC ETH FX QQQ SPX</span>
        <span className="matrix-stream">EUR JPY INR 4.2% 3.1%</span>
        <span className="matrix-stream">RISK LOW MED HIGH</span>
        <span className="matrix-stream">ALPHA 1.8x NAV 48032</span>
        <span className="matrix-stream">BUY HOLD HEDGE SELL</span>
      </div>
      <div className="candle-particles" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} className="candle-particle" />
        ))}
      </div>

      <header className="landing-header">
        <a href="/" className="landing-brand">
          <div className="landing-logo">FP</div>
          <div>
            <p className="landing-kicker">FinPilot</p>
            <p className="landing-subtitle">Autonomous finance engine</p>
          </div>
        </a>
        <div className="landing-actions">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            className="theme-toggle-btn"
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            <span className="theme-icon-wrap">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </span>
          </button>
          <a href="/auth" className="landing-button ghost">
            Sign In
          </a>
          <a href="/auth" className="landing-button primary">
            Launch Terminal
          </a>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-left">
            <p className="hero-kicker">AI driven, human controlled</p>
            <h1 className="hero-title">
              Stop guessing your money moves.
              <span className="hero-gradient"> trading-floor intensity</span>.
            </h1>
            <p className="hero-copy">
              FinPilot turns financial chaos into an autonomous, audited system.
              Every cycle observes your cashflow, simulates outcomes, applies
              guardrails, and executes with deterministic logs.
            </p>
            <div className="hero-stats">
              <article>
                <strong>10,000+</strong>
                <span>simulated cycles</span>
              </article>
              <article>
                <strong>100%</strong>
                <span>replayable ledger</span>
              </article>
              <article>
                <strong>0</strong>
                <span>manual intervention loops</span>
              </article>
            </div>
            <div className="hero-cta">
              <a href="/auth" className="landing-button primary">
                Start a cycle
              </a>
              <a href="#experience" className="landing-button ghost">
                See the flow
              </a>
            </div>
            <div className="ticker">
              <div className="ticker-track">
                <span>Portfolio ₹48,320</span>
                <span>Risk MEDIUM</span>
                <span>Sharpe 1.42</span>
                <span>Allocation 62/22/10/6</span>
                <span>Autonomy ACTIVE</span>
                <span>Portfolio ₹48,320</span>
                <span>Risk MEDIUM</span>
                <span>Sharpe 1.42</span>
                <span>Allocation 62/22/10/6</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="glass-panel hero-widget">
              <div className="widget-header">
                <p>Live AI Simulation</p>
                <span className="pulse-dot" />
              </div>
              <div className="widget-body">
                <div className="sim-row">
                  <span>Perception</span>
                  <div className="sim-bar">
                    <div className="sim-fill" />
                  </div>
                </div>
                <div className="sim-row">
                  <span>Prediction</span>
                  <div className="sim-bar">
                    <div className="sim-fill delay-1" />
                  </div>
                </div>
                <div className="sim-row">
                  <span>Simulation</span>
                  <div className="sim-bar">
                    <div className="sim-fill delay-2" />
                  </div>
                </div>
                <div className="sim-row">
                  <span>Decision</span>
                  <div className="sim-bar">
                    <div className="sim-fill delay-3" />
                  </div>
                </div>
                <div className="sim-row">
                  <span>Execution</span>
                  <div className="sim-bar">
                    <div className="sim-fill delay-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="terminal-demo">
              <div className="terminal-header">Autonomy Console</div>
              <div className="terminal-body">
                <div className="terminal-line typewriter">
                  [Perception] Ingested balances, expenses, events
                </div>
                <div className="terminal-line typewriter delay-1">
                  [Prediction] Projected balance: ₹35,120 | Risk MEDIUM
                </div>
                <div className="terminal-line typewriter delay-2">
                  [Simulation] Balanced strategy selected, guardrail passed
                </div>
                <div className="terminal-line typewriter delay-3">
                  [Execution] Invested ₹12,500 across funds, bonds, gold
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-section">
          <div className="proof-grid">
            <article>
              <p>10,000+</p>
              <span>Autonomous cycles simulated</span>
            </article>
            <article>
              <p>₹5Cr+</p>
              <span>Ledger-logged virtual capital routed</span>
            </article>
            <article>
              <p>100%</p>
              <span>Deterministic decision replay coverage</span>
            </article>
            <article>
              <p>24x7</p>
              <span>Agentic supervision with human override</span>
            </article>
          </div>
        </section>

        <section className="problem-section">
          <div className="problem-copy">
            <p className="hero-kicker">Why existing tools fail</p>
            <h2 className="hero-title small">
              Dashboards show numbers. They don’t make defensible decisions.
            </h2>
            <p className="hero-copy">
              Most finance apps stop at charts, leaving users to manually choose
              strategy under uncertainty. FinPilot closes that gap with a
              complete decision loop.
            </p>
          </div>
          <div className="problem-grid">
            <article className="problem-card">
              <h3>Problem</h3>
              <p>Scattered data, reactive decisions, and no guardrail enforcement.</p>
            </article>
            <article className="problem-card">
              <h3>Agitation</h3>
              <p>One wrong move can violate your liquidity floor and compound risk.</p>
            </article>
            <article className="problem-card">
              <h3>Solution</h3>
              <p>FinPilot simulates, scores, validates, and executes with traceable confidence.</p>
            </article>
          </div>
        </section>

        <section id="experience" className="feature-grid">
          <div className="grid gap-6 md:grid-cols-4 items-stretch">
            {[
              {
                title: "Autonomous decisioning",
                desc: "Agents scan inflows, expenses, and events to propose the safest path.",
                meter: "72%",
              },
              {
                title: "Risk intelligence",
                desc: "Guardrails enforce minimum balances and stress-tested outcomes.",
                meter: "54%",
              },
              {
                title: "Investment optimization",
                desc: "Portfolio allocation adapts to forecasted volatility.",
                meter: "81%",
              },
              {
                title: "Transparent audit trail",
                desc: "Replay every step with full agent state snapshots.",
                meter: "92%",
              },
            ].map((item) => (
              <article key={item.title} className="feature-card h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold leading-tight wrap-break-word flex-1">{item.title}</h3>
                    <div className="risk-meter shrink-0">
                      <div className="risk-fill" style={{ width: item.meter }} />
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="pie-chart shrink-0" />
                  <pre className="code-snippet wrap-break-word whitespace-pre-wrap text-xs flex-1">agent.execute(&quot;{item.title}&quot;)</pre>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="flow-section">
          <div className="flow-shell">
            <div className="flow-connector" aria-hidden="true" />
            <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] items-start relative z-10">
            <div className="flow-copy space-y-6 self-start">
              <p className="hero-kicker">Decision timeline</p>
              <h2 className="hero-title small max-w-xl">
                From perception to execution in seconds.
              </h2>
              <p className="hero-copy max-w-lg">
                Watch the full decision loop unfold with a progressive timeline
                and risk gauges calibrated to your constraints.
              </p>
              <div className="flow-signals">
                <span>30-60 day forecast window</span>
                <span>3 strategy simulation paths</span>
                <span>Deterministic constraint scoring</span>
                <span>Guardrail-first execution checks</span>
              </div>
            </div>
            <div className="self-start">
              <div className="timeline-card timeline-live relative px-8 py-8">
                <div className="timeline-spine" aria-hidden="true" />

              {[
                {
                  title: "Perception",
                  description:
                    "Transactions, balances and recurring flows ingested and categorized.",
                  output: "Data ingestion complete",
                },
                {
                  title: "Prediction",
                  description:
                    "Cashflow forecast generated and risk level computed.",
                  output: "Risk MEDIUM | Forecast ₹48,900",
                },
                {
                  title: "Simulation",
                  description:
                    "Conservative, balanced and aggressive strategies simulated on the digital twin.",
                  output: "Balanced strategy dominant",
                },
                {
                  title: "Decision",
                  description:
                    "Optimal strategy selected using scoring and constraint penalties.",
                  output: "Constraint-safe path selected",
                },
                {
                  title: "Execution",
                  description:
                    "Ledger updated and allocation applied under guardrail validation.",
                  output: "Allocation committed to ledger",
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="timeline-step relative flex items-start gap-6 pb-10 last:pb-0"
                  style={{ animationDelay: `${0.08 * (index + 1)}s` }}
                >
                  <div className="timeline-dot" aria-hidden="true" />

                  <div className="timeline-step-content">
                    <div className="timeline-step-head">
                      <p className="font-semibold text-base text-(--landing-ink)">{step.title}</p>
                      <span className="timeline-step-output">{step.output}</span>
                    </div>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-(--landing-muted)">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}

              </div>
            </div>
            </div>

          </div>
        </section>

        <section className="cta-section">
          <div>
            <h2>Deploy autonomous finance with full transparency.</h2>
            <p>
              Start a cycle, inspect the agent logs, and take control of every
              move.
            </p>
          </div>
          <a href="/auth" className="landing-button primary">
            Launch FinPilot
          </a>
        </section>

        {/* TRUST STRIP */}
        <section className="trust-strip">
          <p>Trusted for autonomous finance simulations</p>
          <div className="trust-metrics">
            <span>10,000+ Simulated Cycles</span>
            <span>100% Deterministic Ledger</span>
            <span>Zero Manual Execution</span>
            <span>Full Guardrail Compliance</span>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="process-section">
          <div className="flow-copy">
            <p className="hero-kicker">How FinPilot works</p>
            <h2 className="hero-title small">
              Structured multi-agent financial intelligence.
            </h2>
          </div>

          <div className="process-grid">
            <div className="process-card">
              <h3>1. Observe</h3>
              <p>
                The Perception Agent ingests transactions, recurring flows,
                balances and constraints.
              </p>
            </div>
            <div className="process-card">
              <h3>2. Simulate</h3>
              <p>
                A Financial Digital Twin runs conservative, balanced and
                aggressive strategies.
              </p>
            </div>
            <div className="process-card">
              <h3>3. Execute</h3>
              <p>
                Guardrails validate constraints before autonomous execution in
                a fully auditable ledger.
              </p>
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="usecase-section">
          <h2 className="hero-title small">Built for precision control</h2>
          <div className="usecase-grid">
            <div className="usecase-card">
              <h3>Students</h3>
              <p>Manage monthly constraints with minimum balance enforcement.</p>
            </div>
            <div className="usecase-card">
              <h3>Professionals</h3>
              <p>Optimize surplus allocation without micromanaging flows.</p>
            </div>
            <div className="usecase-card">
              <h3>Freelancers</h3>
              <p>Simulate irregular income streams safely before committing capital.</p>
            </div>
            <div className="usecase-card">
              <h3>Organizations</h3>
              <p>Run deterministic, policy-compliant finance automation loops.</p>
            </div>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="flow-copy">
            <p className="hero-kicker">Social proof</p>
            <h2 className="hero-title small">Teams trust FinPilot to act with discipline.</h2>
          </div>
          <div className="testimonial-grid">
            <article className="testimonial-card">
              <p>
                “We finally moved from spreadsheet anxiety to deterministic capital planning.
                The replay trail changed how we review every decision.”
              </p>
              <div>
                <strong>Priya S.</strong>
                <span>Finance lead, consulting team</span>
              </div>
            </article>
            <article className="testimonial-card">
              <p>
                “The guardrails are the differentiator. I can run autonomy daily without
                worrying about minimum balance violations.”
              </p>
              <div>
                <strong>Arjun R.</strong>
                <span>Independent professional</span>
              </div>
            </article>
            <article className="testimonial-card">
              <p>
                “It feels like having an investment desk with full auditability.
                Every recommendation is explainable and replayable.”
              </p>
              <div>
                <strong>Meera K.</strong>
                <span>Founder, early-stage startup</span>
              </div>
            </article>
          </div>
        </section>

        <section className="mid-cta-section">
          <div>
            <p className="hero-kicker">Ready to start</p>
            <h2>Start your autonomous finance journey.</h2>
            <p>
              Configure once, simulate continuously, and supervise outcomes with
              complete confidence.
            </p>
          </div>
          <div className="mid-cta-actions">
            <a href="/auth" className="landing-button primary">Launch FinPilot</a>
            <a href="/setup" className="landing-button ghost">Run a sample cycle</a>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section className="security-section">
          <div className="security-grid">
            <div className="security-copy-block">
              <p className="hero-kicker">Auditability you can verify</p>
              <h2 className="hero-title small">Security & transparency with inspectable evidence.</h2>
              <p className="hero-copy">
                Every cycle emits signed run records, guardrail outcomes, and
                deterministic replay data so teams can review exactly what
                happened, why it happened, and what constraints were enforced.
              </p>
              <div className="security-artifacts">
                <article>
                  <strong>Run Trace</strong>
                  <span>Agent inputs, scores, and decisions per step</span>
                </article>
                <article>
                  <strong>Constraint Report</strong>
                  <span>Minimum balance, liquidity floor, veto results</span>
                </article>
                <article>
                  <strong>Replay Snapshot</strong>
                  <span>Deterministic state to reproduce every cycle</span>
                </article>
              </div>
            </div>
            <ul className="security-list">
              <li>✓ Immutable append-only ledger with signed run IDs</li>
              <li>✓ Guardrail vetoes before execution commit</li>
              <li>✓ Cycle-level risk scoring and rationale trail</li>
              <li>✓ User-scoped data isolation and access control</li>
              <li>✓ Simulation sandbox (no real money rail access)</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <h2 className="hero-title small">Frequently asked questions</h2>
          <div className="faq-grid">
            <div>
              <h3>Is real money invested?</h3>
              <p>No. All executions are ledger-based simulations.</p>
            </div>
            <div>
              <h3>Can I override decisions?</h3>
              <p>You remain in supervisory control at all times.</p>
            </div>
            <div>
              <h3>How is risk calculated?</h3>
              <p>Cashflow forecasting + constraint penalty scoring.</p>
            </div>
            <div>
              <h3>Is my data secure?</h3>
              <p>All data is user-scoped and access-controlled.</p>
            </div>
          </div>
        </section>

        <section className="contact-section">
          <div className="contact-card">
            <div>
              <p className="hero-kicker">Contact</p>
              <h2 className="hero-title small">Want FinPilot for your team?</h2>
              <p className="hero-copy">
                Talk to us about deployment, policy tuning, and supervised
                autonomy rollout.
              </p>
            </div>
            <div className="contact-actions">
              <a href="mailto:hello@finpilot.ai" className="landing-button ghost">
                hello@finpilot.ai
              </a>
              <a href="/auth" className="landing-button primary">
                Get started now
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <a href="/" className="landing-brand">
              <div className="landing-logo">FP</div>
              <div>
                <p className="landing-kicker">FinPilot</p>
                <p className="landing-subtitle">
                  Self-driving intelligence for personal finance.
                </p>
              </div>
            </a>
            <p className="footer-copy">
              Autonomous financial operating system. Simulation-only execution.
            </p>
          </div>

          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="/auth">Login</a></li>
              <li><a href="/setup">Run Cycle</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} FinPilot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
