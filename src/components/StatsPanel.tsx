"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthStats, getYearStats } from "@/lib/physiolo";
import { SteampunkGauge } from "./SteampunkGauge";
import { FolioPanel } from "./SteampunkDecor";

type StatsPanelProps = {
  completed: number;
  refreshKey: number;
  nowIso: string;
};

function getBerlinDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function StatsPanel({ refreshKey, nowIso }: StatsPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const now = useMemo(() => new Date(nowIso), [nowIso]);

  if (!mounted) {
    return (
      <div className="space-y-5">
        <FolioPanel className="p-5 md:p-6">
          <p className="paper-caption mb-2">Registers</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
            Loading monthly and yearly registers…
          </p>
        </FolioPanel>
      </div>
    );
  }

  const monthStats = getMonthStats(now);
  const yearStats = getYearStats(now);
  const todayKey = getBerlinDateKey(now);

  const currentMonthIndex =
    Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        month: "2-digit",
      }).format(now),
    ) - 1;

  const monthHasTarget = monthStats.target > 0;
  const yearHasTarget = yearStats.target > 0;

  return (
    <div className="space-y-5" key={refreshKey}>
      <FolioPanel className="p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="paper-caption mb-2">Monthly ledger</p>
            <h2 className="font-display text-2xl text-[var(--color-ink)] md:text-3xl">
              Monthly Register
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">
              A calendar ledger showing required and completed movement during desk time
              across the present month.
            </p>
          </div>

          <div className="md:text-right">
            <SteampunkGauge
              value={monthHasTarget ? monthStats.percentage : 0}
              label={monthStats.label}
              sublabel={monthHasTarget ? `${monthStats.percentage}%` : "—"}
              size="md"
            />
          </div>
        </div>

        <div className="paper-rule my-5" />

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="paper-caption mb-1">Completed movements</p>
            <p className="font-mono text-3xl text-[var(--color-ink)]">
              {monthStats.completed}
            </p>
          </div>

          <div className="text-sm text-[var(--color-ink-soft)]">
            <p>
              Required movements:{" "}
              <span className="font-mono font-semibold text-[var(--color-ink)]">
                {monthStats.target}
              </span>
            </p>
            <p>
              Completion:{" "}
              <span className="font-mono font-semibold text-[var(--color-ink)]">
                {monthHasTarget ? `${monthStats.percentage}%` : "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {monthStats.dailyBreakdown.map((day) => {
            const dayNum = parseInt(day.date.slice(-2), 10);
            const isToday = day.date === todayKey;
            const dayHasTarget = day.required > 0;

            const intensityStyle = !dayHasTarget
              ? "bg-[rgb(255_250_240_/_0.24)]"
              : day.percentage >= 80
                ? "bg-[rgb(103_79_55_/_0.34)]"
                : day.percentage >= 50
                  ? "bg-[rgb(103_79_55_/_0.22)]"
                  : day.percentage > 0
                    ? "bg-[rgb(103_79_55_/_0.12)]"
                    : "bg-[rgb(255_250_240_/_0.36)]";

            return (
              <div
                key={day.date}
                title={
                  dayHasTarget
                    ? `${day.date}: ${day.completed}/${day.required} movements (${day.percentage}%)`
                    : `${day.date}: no desk-time target`
                }
                className={`flex h-9 flex-col items-center justify-center rounded-sm border text-[10px] transition-colors ${
                  isToday
                    ? "border-[color:var(--color-sepia-dark)] ring-1 ring-[rgb(93_70_52_/_0.22)]"
                    : "border-[color:var(--line)]"
                } ${intensityStyle}`}
              >
                <span className="font-mono text-[var(--color-ink)]">{dayNum}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
          Darker cells indicate a higher share of completed movements relative to required desk-time breaks.
        </p>
      </FolioPanel>

      <FolioPanel className="p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="paper-caption mb-2">Annual abstract</p>
            <h2 className="font-display text-2xl text-[var(--color-ink)] md:text-3xl">
              Yearly Register
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">
              A condensed monthly index for the current year based on desk-time requirements
              and recorded movement during those sessions.
            </p>
          </div>

          <div className="md:text-right">
            <SteampunkGauge
              value={yearHasTarget ? yearStats.percentage : 0}
              label={`Year ${new Intl.DateTimeFormat("de-DE", {
                timeZone: "Europe/Berlin",
                year: "numeric",
              }).format(now)}`}
              sublabel={yearHasTarget ? `${yearStats.percentage}%` : "—"}
              size="md"
            />
          </div>
        </div>

        <div className="paper-rule my-5" />

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="paper-caption mb-1">Completed movements</p>
            <p className="font-mono text-3xl text-[var(--color-ink)]">
              {yearStats.completed}
            </p>
          </div>

          <div className="text-sm text-[var(--color-ink-soft)]">
            <p>
              Required movements:{" "}
              <span className="font-mono font-semibold text-[var(--color-ink)]">
                {yearStats.target}
              </span>
            </p>
            <p>
              Completion:{" "}
              <span className="font-mono font-semibold text-[var(--color-ink)]">
                {yearHasTarget ? `${yearStats.percentage}%` : "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {yearStats.months.map((month) => {
            const isCurrentMonth = month.month === currentMonthIndex;
            const monthHasTargetCell = month.target > 0;

            const intensityStyle = !monthHasTargetCell
              ? "bg-[rgb(255_250_240_/_0.24)]"
              : month.percentage >= 80
                ? "bg-[rgb(103_79_55_/_0.34)]"
                : month.percentage >= 50
                  ? "bg-[rgb(103_79_55_/_0.22)]"
                  : month.percentage > 0
                    ? "bg-[rgb(103_79_55_/_0.12)]"
                    : "bg-[rgb(255_250_240_/_0.36)]";

            return (
              <div
                key={month.month}
                title={
                  monthHasTargetCell
                    ? `${month.label}: ${month.completed}/${month.target} movements (${month.percentage}%)`
                    : `${month.label}: no desk-time target`
                }
                className={`rounded-sm border p-2 text-center ${
                  isCurrentMonth
                    ? "border-[color:var(--color-sepia-dark)] ring-1 ring-[rgb(93_70_52_/_0.22)]"
                    : "border-[color:var(--line)]"
                } ${intensityStyle}`}
              >
                <p className="font-display text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
                  {month.label}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-[var(--color-ink)]">
                  {monthHasTargetCell ? `${month.percentage}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </FolioPanel>
    </div>
  );
}