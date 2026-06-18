"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications } from "./notifications-provider";

function formatRelativeTime(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "منذ يوم";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function computePanelPosition(button) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 16);
  const left = Math.min(
    Math.max(8, rect.right - width),
    window.innerWidth - width - 8,
  );

  return {
    top: rect.bottom + 8,
    left,
    width,
  };
}

export function NotificationBell() {
  const router = useRouter();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState(null);
  const {
    notifications,
    unreadCount,
    fetchError,
    hasLoaded,
    isRefreshing,
    isPending,
    refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const showPanelLoader =
    open && (!hasLoaded || (isRefreshing && notifications.length === 0));

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return undefined;
    }

    function updatePosition() {
      if (!buttonRef.current) return;
      setPanelPosition(computePanelPosition(buttonRef.current));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    refreshNotifications({ processReminders: false });

    function handlePointerDown(event) {
      const target = event.target;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, refreshNotifications]);

  function handleToggle() {
    setOpen((current) => {
      const nextOpen = !current;

      if (nextOpen && buttonRef.current) {
        setPanelPosition(computePanelPosition(buttonRef.current));
      }

      return nextOpen;
    });
  }

  function handleNotificationClick(notification) {
    if (!notification.read_at) {
      markRead(notification.id);
    }

    setOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label="الإشعارات"
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -start-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && panelPosition ? (
                <motion.div
                  key="notification-panel"
                  ref={panelRef}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  dir="rtl"
                  style={{
                    position: "fixed",
                    top: panelPosition.top,
                    left: panelPosition.left,
                    width: panelPosition.width,
                    zIndex: 200,
                  }}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                      الإشعارات
                    </p>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllRead}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        تعليم الكل كمقروء
                      </button>
                    ) : null}
                  </div>

                  <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                    {showPanelLoader ? (
                      <div className="grid place-items-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      </div>
                    ) : fetchError ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {fetchError}
                        </p>
                      </div>
                    ) : notifications.length ? (
                      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {notifications.map((notification) => (
                          <li key={notification.id}>
                            <button
                              type="button"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className={`w-full px-4 py-3 text-start transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                                notification.read_at
                                  ? "opacity-70"
                                  : "bg-emerald-50/40 dark:bg-emerald-500/5"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                                  {notification.title}
                                </p>
                                {!notification.read_at ? (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                ) : null}
                              </div>
                              <p className="mt-1 text-[11px] font-medium leading-5 text-zinc-600 dark:text-zinc-400">
                                {notification.body}
                              </p>
                              <p className="mt-1.5 text-[10px] font-bold text-zinc-400">
                                {formatRelativeTime(notification.created_at)}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-10 text-center">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          لا توجد إشعارات بعد.
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          ستظهر هنا عند حلول وقت مهامك المجدولة.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

export { refreshNotificationBell } from "./notifications-provider";
