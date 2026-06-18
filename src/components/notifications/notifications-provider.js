"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  processDueTaskRemindersForCurrentUser,
} from "@/app/dashboard/notifications/actions";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "@/lib/notifications/notification-sound";

const NOTIFICATIONS_REFRESH_EVENT = "umran:notifications-refresh";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const knownUnreadIdsRef = useRef(null);
  const hasInitializedNotificationsRef = useRef(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshNotifications = useCallback(
    async ({ processReminders = true } = {}) => {
      setIsRefreshing(true);

      try {
        if (processReminders) {
          await processDueTaskRemindersForCurrentUser();
        }

        const result = await getNotifications();
        if (result.error) {
          setFetchError(result.error);
          return;
        }

        const unreadNotifications = result.notifications.filter(
          (item) => !item.read_at,
        );
        const unreadIds = new Set(unreadNotifications.map((item) => item.id));

        if (!hasInitializedNotificationsRef.current) {
          knownUnreadIdsRef.current = unreadIds;
          hasInitializedNotificationsRef.current = true;
        } else {
          const hasNewUnread = [...unreadIds].some(
            (id) => !knownUnreadIdsRef.current?.has(id),
          );

          if (hasNewUnread) {
            playNotificationSound();
          }

          knownUnreadIdsRef.current = unreadIds;
        }

        setFetchError("");
        setNotifications(result.notifications);
        setUnreadCount(unreadNotifications.length);
        setHasLoaded(true);
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    refreshNotifications();

    const interval = window.setInterval(() => {
      refreshNotifications();
    }, 30_000);

    function handleExternalRefresh() {
      refreshNotifications({ processReminders: false });
    }

    function handleUserGesture() {
      unlockNotificationSound();
    }

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleExternalRefresh);
    window.addEventListener("pointerdown", handleUserGesture, { once: true });
    window.addEventListener("keydown", handleUserGesture, { once: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        NOTIFICATIONS_REFRESH_EVENT,
        handleExternalRefresh,
      );
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, [refreshNotifications]);

  const markRead = useCallback((notificationId) => {
    startTransition(async () => {
      await markNotificationRead(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, read_at: item.read_at || new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      knownUnreadIdsRef.current?.delete(notificationId);
    });
  }, []);

  const markAllRead = useCallback(() => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result?.error) return;

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      knownUnreadIdsRef.current = new Set();
    });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchError,
        hasLoaded,
        isRefreshing,
        isPending,
        refreshNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}

export function refreshNotificationBell() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
}
