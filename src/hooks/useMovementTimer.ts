"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const notificationShownRef = useRef(false);

  const syncFromStorage = useCallback(() => {
    const active = isDeskSessionActive();
    const nextSeconds = getTimerSecondsLeft(new Date());

    setActiveDeskSession(active);
    setSecondsLeft(nextSeconds);
    setShowAlert(active && nextSeconds <= 0);
  }, []);

  const showDesktopReminder = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Movement due", {
          body: "Take a quick stretch or walk now.",
          tag: "physiolo-movement-reminder",
        });
      } else {
        new Notification("Movement due", {
          body: "Take a quick stretch or walk now.",
          tag: "physiolo-movement-reminder",
        });
      }
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission as NotificationStatus);

      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Movement due", {
            body: "Take a quick stretch or walk now.",
            tag: "physiolo-movement-reminder",
          });
        } else {
          new Notification("Movement due", {
            body: "Take a quick stretch or walk now.",
            tag: "physiolo-movement-reminder",
          });
        }
      }
    }
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
        if (!notificationShownRef.current) {
          notificationShownRef.current = true;
          void showDesktopReminder();
        }
        onReminder?.();
      } else {
        setShowAlert(false);
        notificationShownRef.current = false;
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [onReminder, showDesktopReminder]);

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