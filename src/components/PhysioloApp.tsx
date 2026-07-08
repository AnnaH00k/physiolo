"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMovementTimer } from "@/hooks/useMovementTimer";
import {
  endDeskSession,
  formatDuration,
  formatTime,
  getDailyPercentageOfFullDay,
  getFullDayTarget,
  getTodayDeskSummary,
  recordMovement,
  startDeskSession,
} from "@/lib/physiolo";
import { StatsPanel } from "./StatsPanel";
import { FolioPanel } from "./SteampunkDecor";

type PhysioloAppProps = {
  mode?: "full" | "widget";
  nowIso: string;
};

export function PhysioloApp({ mode = "full", nowIso }: PhysioloAppProps) {
  const isWidget = mode === "widget";
  const [completed, setCompleted] = useState(0);
  const [statsKey, setStatsKey] = useState(0);
  const [currentNowIso, setCurrentNowIso] = useState(nowIso);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deskSeconds, setDeskSeconds] = useState(0);
  const [requiredMovements, setRequiredMovements] = useState(0);
  const [activeDeskSession, setActiveDeskSession] = useState(false);

  const refreshStats = useCallback(() => {
    const now = new Date();
    const summary = getTodayDeskSummary(now);

    setCompleted(summary.completedMovements);
    setDeskSeconds(summary.deskSeconds);
    setRequiredMovements(summary.requiredMovements);
    setActiveDeskSession(summary.activeSession);
    setStatsKey((key) => key + 1);
    setCurrentNowIso(now.toISOString());
  }, []);

  const handleMovementRecorded = useCallback(() => {
    recordMovement(new Date());
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    setIsHydrated(true);
    refreshStats();

    const sync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key && event.key !== "physiolo.v3") return;
      }
      refreshStats();
    };

    const interval = setInterval(refreshStats, 60_000);

    window.addEventListener("storage", sync);
    window.addEventListener("physiolo-sync", sync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", sync);
      window.removeEventListener("physiolo-sync", sync);
    };
  }, [refreshStats]);

  const now = useMemo(() => new Date(currentNowIso), [currentNowIso]);

  const timer = useMovementTimer({
    onReminder: refreshStats,
  });

  const {
    secondsLeft,
    isRunning,
    showAlert,
    progress,
    dismissAndRestart,
    activeDeskSession: timerDeskActive,
  } = timer;

  const fullTarget = getFullDayTarget(now);
  const fullDayPct = getDailyPercentageOfFullDay(completed, now);

  const handleMoved = useCallback(() => {
    handleMovementRecorded();
    dismissAndRestart();
  }, [handleMovementRecorded, dismissAndRestart]);

  const handleDeskStart = useCallback(() => {
    startDeskSession(new Date());
    refreshStats();
  }, [refreshStats]);

  const handleDeskEnd = useCallback(() => {
    endDeskSession(new Date());
    refreshStats();
  }, [refreshStats]);

const launchWidget = useCallback(() => {
  const features =
    "width=300,height=240,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no";

  const basePath = process.env.NODE_ENV === "production" ? "/physiolo" : "";
  window.open(`${basePath}/widget/`, "physiolo-widget", features);
}, []);

  const currentDeskActive = activeDeskSession || timerDeskActive;

  if (isWidget) {
    return (
      <main className="min-h-screen bg-transparent px-3 py-3">
        <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
            Physiolo
          </p>

          <div
            className={`mt-2 font-mono text-5xl leading-none tabular-nums ${
              showAlert
                ? "animate-steam-pulse text-[var(--color-oxide)]"
                : "text-[var(--color-ink)]"
            }`}
          >
            {formatTime(secondsLeft)}
          </div>

          <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
            {!currentDeskActive
              ? "Not at desk"
              : showAlert
                ? "Move now"
                : isRunning
                  ? "At desk"
                  : "Paused"}
          </p>

          <p className="mt-2 text-[11px] text-[var(--color-ink-faint)]">
            {completed}/{requiredMovements} moves · {formatDuration(deskSeconds)}
          </p>

          {showAlert ? (
            <button
              onClick={handleMoved}
              className="mt-5 text-sm font-medium text-[var(--color-ink)] underline underline-offset-4"
            >
              Record movement
            </button>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)]">
              {!currentDeskActive ? (
                <button
                  onClick={handleDeskStart}
                  className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-2 py-1 hover:text-[var(--color-ink)]"
                >
                  At desk
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMoved}
                    className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-2 py-1 hover:text-[var(--color-ink)]"
                  >
                    Move
                  </button>
                  <button
                    onClick={handleDeskEnd}
                    className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-2 py-1 hover:text-[var(--color-ink)]"
                  >
                    Leave desk
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="steampunk-bg min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="w-full text-center font-display text-4xl leading-[0.95] text-[var(--color-ink)] md:text-5xl">
            Physiolo
          </h1>
        </header>

        <FolioPanel className="mb-6 p-6 md:p-8">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-faint)]">
              Daily register
            </p>

            <div
              className={`mt-3 font-mono text-6xl leading-none tabular-nums md:text-7xl ${
                showAlert
                  ? "animate-steam-pulse text-[var(--color-oxide)]"
                  : "text-[var(--color-ink)]"
              }`}
            >
              {formatTime(secondsLeft)}
            </div>

            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              {!currentDeskActive
                ? "You are currently not marked as sitting at the desk."
                : showAlert
                  ? "Movement due. Record activity to reset the interval."
                  : "Desk session active. Movement is required every 30 minutes."}
            </p>

            <div className="mt-5 h-[4px] overflow-hidden rounded-full bg-[rgb(70_45_25_/_0.10)]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  showAlert ? "bg-[var(--color-oxide)]" : "bg-[var(--color-sepia-dark)]"
                }`}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left md:grid-cols-4">
              <div className="rounded-sm bg-[rgb(255_251_242_/_0.34)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                  Desk time
                </p>
                <p className="mt-1 font-mono text-xl text-[var(--color-ink)]">
                  {formatDuration(deskSeconds)}
                </p>
              </div>

              <div className="rounded-sm bg-[rgb(255_251_242_/_0.34)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                  Required
                </p>
                <p className="mt-1 font-mono text-xl text-[var(--color-ink)]">
                  {requiredMovements}
                </p>
              </div>

              <div className="rounded-sm bg-[rgb(255_251_242_/_0.34)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                  Completed
                </p>
                <p className="mt-1 font-mono text-xl text-[var(--color-ink)]">
                  {completed}
                </p>
              </div>

              <div className="rounded-sm bg-[rgb(255_251_242_/_0.34)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
                  Completion
                </p>
                <p className="mt-1 font-mono text-xl text-[var(--color-ink)]">
                  {requiredMovements > 0 ? `${fullDayPct}%` : "—"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
              {completed} of {fullTarget} required movements completed during{" "}
              {formatDuration(deskSeconds)} of desk time.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--color-ink-soft)]">
              {!currentDeskActive ? (
                <button
                  onClick={handleDeskStart}
                  className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-3 py-1.5 hover:text-[var(--color-ink)]"
                >
                  At desk
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMoved}
                    className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-3 py-1.5 hover:text-[var(--color-ink)]"
                  >
                    Record movement
                  </button>
                  <button
                    onClick={handleDeskEnd}
                    className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-3 py-1.5 hover:text-[var(--color-ink)]"
                  >
                    Leave desk
                  </button>
                </>
              )}

              <button
                onClick={launchWidget}
                className="rounded-sm border border-[rgb(70_45_25_/_0.15)] px-3 py-1.5 hover:text-[var(--color-ink)]"
              >
                Open widget
              </button>
            </div>
          </div>
        </FolioPanel>

        {isHydrated && (
          <StatsPanel
            completed={completed}
            refreshKey={statsKey}
            nowIso={currentNowIso}
          />
        )}
      </div>
    </main>
  );
}