"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTimerDueAtIso,
  getTimerSecondsLeft,
  INTERVAL_SECONDS,
  isDeskSessionActive,
} from "@/lib/physiolo";

type NotificationStatus = "default" | "granted" | "denied" | "unsupported";

type UseMovementTimerArgs = {
  onReminder?: () => void;
};

export function useMovementTimer({ onReminder }: UseMovementTimerArgs = {}) {
  const [secondsLeft, setSecondsLeft] = useState(INTERVAL_SECONDS);
  const [activeDeskSession, setActiveDeskSession] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>("default");
  const [showAlert, setShowAlert] = useState(false);

  const syncFromStorage = useCallback(() => {
    const active = isDeskSessionActive();
    const nextSeconds = getTimerSecondsLeft(new Date());

    setActiveDeskSession(active);
    setSecondsLeft(nextSeconds);
    setShowAlert(active && nextSeconds <= 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
    } else {
      setNotificationStatus(Notification.permission as NotificationStatus);
    }

    syncFromStorage();

    const handleSync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key && event.key !== "physiolo.v3") return;
      }
      syncFromStorage();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("physiolo-sync", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("physiolo-sync", handleSync);
    };
  }, [syncFromStorage]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      const active = isDeskSessionActive();
      const left = getTimerSecondsLeft(new Date());

      setActiveDeskSession(active);
      setSecondsLeft(left);

      if (active && left <= 0) {
        setShowAlert(true);
        onReminder?.();
      } else {
        setShowAlert(false);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [onReminder]);

  const startTimer = useCallback(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const pauseTimer = useCallback(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const resetTimer = useCallback(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const dismissAndRestart = useCallback(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const progress = useMemo(() => {
    return ((INTERVAL_SECONDS - secondsLeft) / INTERVAL_SECONDS) * 100;
  }, [secondsLeft]);

  const isRunning = activeDeskSession && !showAlert && !!getTimerDueAtIso();

  return {
    secondsLeft,
    isRunning,
    showAlert,
    notificationStatus,
    progress,
    startTimer,
    pauseTimer,
    resetTimer,
    dismissAndRestart,
    activeDeskSession,
  };
}