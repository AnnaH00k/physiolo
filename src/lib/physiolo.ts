const STORAGE_KEY = "physiolo.v3";

export const INTERVAL_SECONDS = 30 * 60;
export const MOVES_PER_HOUR = 2;

type DeskSession = {
  startIso: string;
  endIso: string | null;
};

type MovementEntry = {
  atIso: string;
};

type PhysioloData = {
  sessions: DeskSession[];
  movements: MovementEntry[];
  timerDueAtIso: string | null;
};

type DayBreakdown = {
  date: string;
  completed: number;
  required: number;
  percentage: number;
};

type MonthStats = {
  label: string;
  completed: number;
  target: number;
  percentage: number;
  dailyBreakdown: DayBreakdown[];
};

type YearMonthStats = {
  month: number;
  label: string;
  completed: number;
  target: number;
  percentage: number;
};

type YearStats = {
  completed: number;
  target: number;
  percentage: number;
  months: YearMonthStats[];
};

type TodayDeskSummary = {
  deskSeconds: number;
  requiredMovements: number;
  completedMovements: number;
  percentage: number;
  activeSession: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitPhysioloSync() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event("physiolo-sync"));
}

function createEmptyData(): PhysioloData {
  return {
    sessions: [],
    movements: [],
    timerDueAtIso: null,
  };
}

function readData(): PhysioloData {
  if (!canUseStorage()) return createEmptyData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData();

    const parsed = JSON.parse(raw) as Partial<PhysioloData>;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      timerDueAtIso: typeof parsed.timerDueAtIso === "string" ? parsed.timerDueAtIso : null,
    };
  } catch {
    return createEmptyData();
  }
}

function writeData(data: PhysioloData) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  emitPhysioloSync();
}

function getBerlinDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfBerlinDay(date: Date) {
  const key = getBerlinDateKey(date);
  return new Date(`${key}T00:00:00+02:00`);
}

function endOfBerlinDay(date: Date) {
  const key = getBerlinDateKey(date);
  return new Date(`${key}T23:59:59.999+02:00`);
}

function overlapSeconds(startA: number, endA: number, startB: number, endB: number) {
  const start = Math.max(startA, startB);
  const end = Math.min(endA, endB);
  return Math.max(0, Math.floor((end - start) / 1000));
}

function getSessionsForDay(day: Date, sessions: DeskSession[]) {
  const dayStart = startOfBerlinDay(day).getTime();
  const dayEnd = endOfBerlinDay(day).getTime();

  return sessions
    .map((session) => {
      const start = new Date(session.startIso).getTime();
      const end = session.endIso ? new Date(session.endIso).getTime() : Date.now();
      const seconds = overlapSeconds(start, end, dayStart, dayEnd);
      return { session, seconds };
    })
    .filter((entry) => entry.seconds > 0);
}

function isMovementInsideAnySession(movementIso: string, sessions: DeskSession[]) {
  const movementTime = new Date(movementIso).getTime();

  return sessions.some((session) => {
    const start = new Date(session.startIso).getTime();
    const end = session.endIso ? new Date(session.endIso).getTime() : Date.now();
    return movementTime >= start && movementTime <= end;
  });
}

function getCompletedMovementsForDay(day: Date, data: PhysioloData) {
  const dayKey = getBerlinDateKey(day);
  const daySessions = getSessionsForDay(day, data.sessions).map((entry) => entry.session);

  return data.movements.filter((movement) => {
    const movementDate = new Date(movement.atIso);
    return (
      getBerlinDateKey(movementDate) === dayKey &&
      isMovementInsideAnySession(movement.atIso, daySessions)
    );
  }).length;
}

function getDeskSecondsForDay(day: Date, data: PhysioloData) {
  return getSessionsForDay(day, data.sessions).reduce((sum, entry) => sum + entry.seconds, 0);
}

function getRequiredMovementsFromSeconds(seconds: number) {
  return Math.floor(seconds / INTERVAL_SECONDS);
}

function getPercentage(completed: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(999, Math.round((completed / target) * 100)));
}

export function isDeskSessionActive() {
  const data = readData();
  return data.sessions.some((session) => session.endIso === null);
}

export function getTimerDueAtIso() {
  return readData().timerDueAtIso;
}

export function getTimerSecondsLeft(now = new Date()) {
  const dueAtIso = getTimerDueAtIso();
  if (!dueAtIso) return INTERVAL_SECONDS;

  const diffMs = new Date(dueAtIso).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / 1000));
}

export function setTimerDueAt(now = new Date()) {
  const data = readData();
  data.timerDueAtIso = new Date(now.getTime() + INTERVAL_SECONDS * 1000).toISOString();
  writeData(data);
  return data.timerDueAtIso;
}

export function clearTimerDueAt() {
  const data = readData();
  data.timerDueAtIso = null;
  writeData(data);
}

export function startDeskSession(now = new Date()) {
  const data = readData();
  const alreadyActive = data.sessions.some((session) => session.endIso === null);
  if (!alreadyActive) {
    data.sessions.push({
      startIso: now.toISOString(),
      endIso: null,
    });
  }

  data.timerDueAtIso = new Date(now.getTime() + INTERVAL_SECONDS * 1000).toISOString();
  writeData(data);
  return true;
}

export function endDeskSession(now = new Date()) {
  const data = readData();
  const active = [...data.sessions].reverse().find((session) => session.endIso === null);
  if (active) {
    active.endIso = now.toISOString();
  }
  data.timerDueAtIso = null;
  writeData(data);
  return true;
}

export function recordMovement(now = new Date()) {
  const data = readData();
  data.movements.push({
    atIso: now.toISOString(),
  });

  if (data.sessions.some((session) => session.endIso === null)) {
    data.timerDueAtIso = new Date(now.getTime() + INTERVAL_SECONDS * 1000).toISOString();
  }

  writeData(data);
  return getTodayDeskSummary(now).completedMovements;
}

export function getTodayCompleted(now = new Date()) {
  return getTodayDeskSummary(now).completedMovements;
}

export function getTodayDeskSummary(now = new Date()): TodayDeskSummary {
  const data = readData();
  const deskSeconds = getDeskSecondsForDay(now, data);
  const requiredMovements = getRequiredMovementsFromSeconds(deskSeconds);
  const completedMovements = getCompletedMovementsForDay(now, data);
  const percentage = getPercentage(completedMovements, requiredMovements);

  return {
    deskSeconds,
    requiredMovements,
    completedMovements,
    percentage,
    activeSession: isDeskSessionActive(),
  };
}

export function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function getFullDayTarget(now = new Date()) {
  return getTodayDeskSummary(now).requiredMovements;
}

export function getDailyPercentageOfFullDay(completed: number, now = new Date()) {
  const target = getTodayDeskSummary(now).requiredMovements;
  return getPercentage(completed, target);
}

export function getMonthStats(now = new Date()): MonthStats {
  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
    }).format(now),
  );

  const month = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      month: "2-digit",
    }).format(now),
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const data = readData();

  let completed = 0;
  let target = 0;

  const dailyBreakdown: DayBreakdown[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = new Date(year, month - 1, index + 1, 12, 0, 0);
    const date = getBerlinDateKey(day);

    const deskSeconds = getDeskSecondsForDay(day, data);
    const dayTarget = getRequiredMovementsFromSeconds(deskSeconds);
    const dayCompleted = getCompletedMovementsForDay(day, data);
    const percentage = getPercentage(dayCompleted, dayTarget);

    completed += dayCompleted;
    target += dayTarget;

    return {
      date,
      completed: dayCompleted,
      required: dayTarget,
      percentage,
    };
  });

  return {
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(now),
    completed,
    target,
    percentage: getPercentage(completed, target),
    dailyBreakdown,
  };
}

export function getYearStats(now = new Date()): YearStats {
  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
    }).format(now),
  );

  let completed = 0;
  let target = 0;

  const months: YearMonthStats[] = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 15, 12, 0, 0);
    const monthStats = getMonthStats(date);

    completed += monthStats.completed;
    target += monthStats.target;

    return {
      month: index,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "Europe/Berlin",
      }).format(date),
      completed: monthStats.completed,
      target: monthStats.target,
      percentage: monthStats.percentage,
    };
  });

  return {
    completed,
    target,
    percentage: getPercentage(completed, target),
    months,
  };
}