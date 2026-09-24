import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Eyebrow, StatusChip } from "@/components/ui";
import { claimsAgent, type StepState } from "@/lib/demo-data";
import shell from "@/components/shell.module.css";
import u from "@/components/ui.module.css";
import s from "./agent.module.css";

const stepClass: Record<StepState, string> = {
  done: s.stepDone,
  active: s.stepActive,
  pending: s.stepPending,
};

/** Connector below step i: mint between done steps, glowing into the active step, neutral after. */
function connectorClass(current: StepState, next: StepState) {
  if (next === "active") return s.connectorToActive;
  if (current === "done") return s.connectorDone;
  return s.connectorIdle;
}

export default function ClaimsAgentPage() {
  const { steps, run, details, recentRuns } = claimsAgent;
  const activeIndex = steps.findIndex((st) => st.state === "active");

  return (
    <main className={`${shell.main} ${s.main}`}>
      <div className={`${shell.orb} ${shell.orbCyan}`} aria-hidden="true" />

      <header className={s.header}>
        <nav aria-label="Breadcrumb" className={s.breadcrumb}>
          <Link href="/">Agents</Link>
          <span aria-hidden="true">/</span>
          <span className={s.crumbCurrent} aria-current="page">
            {claimsAgent.name}
          </span>
        </nav>
        <div className={s.headerRow}>
          <div className={s.identity}>
            <div className={s.agentTile}>
              <Icon name="clipboard" size={26} strokeWidth={1.5} />
            </div>
            <div className={s.identityText}>
              <div className={s.titleRow}>
                <h1 className={s.title}>{claimsAgent.name}</h1>
                <StatusChip tone="live" height={26}>
                  Running
                </StatusChip>
              </div>
              <span className={s.description}>{claimsAgent.description}</span>
            </div>
          </div>
          <div className={s.actions}>
            <button type="button" className={u.btnGlass}>
              Edit workflow
            </button>
            <button type="button" className={u.btnGlass}>
              Pause agent
            </button>
          </div>
        </div>
      </header>

      <div className={s.body}>
        <section className={`dots ${s.workflow}`} aria-label="Workflow, current run">
          <div className={u.cardHead}>
            <Eyebrow>WORKFLOW · CURRENT RUN</Eyebrow>
            <span className={s.stepCount}>
              step {activeIndex + 1} / {steps.length}
            </span>
          </div>

          <ol className={s.flow}>
            {steps.map((step, i) => {
              const num = String(i + 1).padStart(2, "0");
              const next = steps[i + 1];
              return (
                <Fragment key={step.title}>
                  <li className={s.stepRow}>
                    <span className={`${s.stepNum} ${step.state === "active" ? s.stepNumActive : ""}`}>{num}</span>
                    <div className={`${s.step} ${stepClass[step.state]}`}>
                      <div className={s.stepIcon}>
                        <Icon name={step.icon} size={20} />
                      </div>
                      <div className={s.stepText}>
                        <span className={s.stepTitle}>{step.title}</span>
                        <span className={s.stepMeta}>{step.meta}</span>
                      </div>
                      {step.state === "done" && (
                        <>
                          <span className={s.duration}>{step.duration}</span>
                          <span className={s.check}>
                            <Icon name="check" size={20} strokeWidth={2} label="Done" />
                          </span>
                        </>
                      )}
                      {step.state === "active" && <span className={s.runningDot} role="img" aria-label="Running" />}
                      {step.state === "pending" && <span className={s.pendingRing} role="img" aria-label="Up next" />}
                    </div>
                  </li>
                  {next && (
                    <li className={s.connectorRow} aria-hidden="true">
                      <div className={`${s.connector} ${connectorClass(step.state, next.state)}`} />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </section>

        <div className={s.side}>
          <div className={s.run}>
            <div className={s.runOrb} aria-hidden="true" />
            <div className={s.runGlass}>
              <div className={s.runTop}>
                <div className={s.runText}>
                  <span className={s.runTitle}>{run.title}</span>
                  <span className={s.runSub}>{run.subtitle}</span>
                </div>
                <span className={s.runPct}>{run.progress}%</span>
              </div>
              <div
                className={s.progress}
                role="progressbar"
                aria-valuenow={run.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Run progress"
              >
                <div className={s.progressFill} style={{ width: `${run.progress}%` }} />
              </div>
              <div className={s.runActions}>
                <button type="button" className={`${u.btnPrimary} ${s.grow}`}>
                  Open draft
                </button>
                <button type="button" className={u.btnFrost}>
                  Pause
                </button>
              </div>
            </div>
          </div>

          <section className={`${u.listCard} ${s.card}`} aria-label="Extracted details">
            <Eyebrow>EXTRACTED DETAILS</Eyebrow>
            {details.map((d) => (
              <div key={d.key} className={s.row}>
                <span className={s.rowKey}>{d.key}</span>
                <span className={d.mono ? s.mono : undefined}>{d.value}</span>
              </div>
            ))}
            <div className={`${s.row} ${s.rowCenter}`}>
              <span className={s.rowKey}>Coverage</span>
              <StatusChip tone="done" height={24} padX={10}>
                {claimsAgent.coverage}
              </StatusChip>
            </div>
          </section>

          <section className={`${u.listCard} ${s.card} ${s.cardGrow}`} aria-label="Recent runs">
            <div className={u.cardHead}>
              <Eyebrow>RECENT RUNS</Eyebrow>
              <a href="#" className={u.textLink}>
                View all
              </a>
            </div>
            {recentRuns.map((r, i) => (
              <div key={i} className={s.runItem}>
                <span className={s.runDot} />
                <span className={s.runItemText}>{r.text}</span>
                <span className={s.runTime}>{r.time}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
