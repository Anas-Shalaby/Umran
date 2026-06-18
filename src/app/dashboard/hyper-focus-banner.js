"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play, Sparkles, Square } from "lucide-react";
import { completeFocusTask } from "./actions";
import { getCurrentPrayerAnchor, PRAYER_ANCHOR_LABELS } from "./prayer-time";
import { isFixedHabitTask } from "./fixed-habits-settings";

function formatElapsedTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getCelebrationMinutes(elapsedTime) {
  const minutes = Math.round(elapsedTime / 60);
  if (minutes > 0) return minutes;
  return elapsedTime > 0 ? "أقل من دقيقة" : 0;
}

export function HyperFocusBanner({
  tasks,
  fixedHabits,
  isFocusActive,
  onFocusActiveChange,
  onTaskCompleted,
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationLabel, setCelebrationLabel] = useState("");
  const celebrationTimeoutRef = useRef(null);
  const isCelebratingRef = useRef(false);

  const currentAnchor = useMemo(() => getCurrentPrayerAnchor(), []);

  const anchorTasks = useMemo(() => {
    return tasks.filter((task) => task.prayer_anchor === currentAnchor);
  }, [tasks, currentAnchor]);

  const liveTask = useMemo(() => {
    return anchorTasks.find((task) => !task.is_completed) || null;
  }, [anchorTasks]);

  const focusState = useMemo(() => {
    if (!anchorTasks.length) return "empty";
    if (!liveTask) return "success";
    return "focus";
  }, [anchorTasks.length, liveTask]);

  const isFixed = liveTask ? isFixedHabitTask(liveTask, fixedHabits) : false;

  useEffect(() => {
    if (!isFocusActive) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedTime((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isFocusActive]);

  useEffect(() => {
    if (isCelebratingRef.current) return;

    setElapsedTime(0);
    onFocusActiveChange(false);
  }, [liveTask?.id, onFocusActiveChange]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

  function handleStartFocus() {
    setElapsedTime(0);
    setShowCelebration(false);
    onFocusActiveChange(true);
  }

  function handleCancelSession() {
    if (isSaving) return;

    setElapsedTime(0);
    onFocusActiveChange(false);
  }

  async function handleEndFocus() {
    if (!liveTask || isSaving) return;

    onFocusActiveChange(false);
    setIsSaving(true);

    const durationMinutes = Math.round(elapsedTime / 60);
    const celebrationMinutes = getCelebrationMinutes(elapsedTime);

    try {
      const result = await completeFocusTask(liveTask.id, durationMinutes);

      if (result?.error) {
        onFocusActiveChange(true);
        setIsSaving(false);
        return;
      }

      if (result?.task) {
        onTaskCompleted(result.task);
      }

      setCelebrationLabel(
        typeof celebrationMinutes === "number"
          ? `${celebrationMinutes}`
          : celebrationMinutes,
      );
      isCelebratingRef.current = true;
      setShowCelebration(true);
      setElapsedTime(0);

      celebrationTimeoutRef.current = window.setTimeout(() => {
        setShowCelebration(false);
        setCelebrationLabel("");
        isCelebratingRef.current = false;
      }, 3200);
    } finally {
      setIsSaving(false);
    }
  }

  const bannerContent = (
    <AnimatePresence mode="wait">
      <motion.section
        key={focusState + (liveTask?.id || "idle") + String(showCelebration)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl border shadow-sm ${
          focusState === "focus"
            ? isFocusActive
              ? "border-emerald-200 bg-white dark:border-emerald-500/40 dark:bg-zinc-950"
              : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
            : focusState === "success"
              ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
              : "border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40"
        }`}
      >
        <AnimatePresence>
          {showCelebration ? (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-4 text-center backdrop-blur-sm sm:p-6 dark:bg-zinc-950/95"
            >
              <p className="max-w-md text-sm font-black leading-8 text-emerald-700 sm:text-base sm:leading-9 dark:text-emerald-400">
                {typeof celebrationLabel === "number" ? (
                  <>
                    أحسن الله إليك! قضيت{" "}
                    <span className="font-[Umran] text-xl text-emerald-600 sm:text-2xl dark:text-emerald-300">
                      {celebrationLabel}
                    </span>{" "}
                    دقيقة من التركيز النقي في هذا الثغر.
                  </>
                ) : (
                  <>
                    أحسن الله إليك! قضيت {celebrationLabel} من التركيز النقي في
                    هذا الثغر.
                  </>
                )}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="p-3 sm:p-4">
          {focusState === "focus" && liveTask ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    <span className="relative flex h-1.5 w-1.5">
                      {isFocusActive ? (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                      ) : null}
                      <span
                        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                          isFocusActive ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                    </span>
                    {isFocusActive ? "وضع الاستغراق" : "ثغرك الحالي"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {PRAYER_ANCHOR_LABELS[currentAnchor]}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  {isFixed ? (
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  <h2
                    className={`min-w-0 font-black leading-snug text-zinc-950 dark:text-zinc-50 ${
                      isFocusActive
                        ? "text-lg sm:text-xl"
                        : "text-base sm:text-lg"
                    }`}
                  >
                    {liveTask.task_name}
                  </h2>
                </div>

                {!isFocusActive ? (
                  <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                    ابدأ عداد الاستغراق — أنت وثغرك حتى تنتهي.
                  </p>
                ) : (
                  <p
                    className="mt-1 font-[Umran] text-2xl tracking-wider text-emerald-600 sm:hidden dark:text-emerald-500"
                    aria-live="polite"
                  >
                    {formatElapsedTime(elapsedTime)}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {isFocusActive ? (
                  <p
                    className="hidden font-[Umran] text-3xl tracking-wider text-emerald-600 sm:block dark:text-emerald-500"
                    aria-live="polite"
                    aria-label={`الوقت المنقضي ${formatElapsedTime(elapsedTime)}`}
                  >
                    {formatElapsedTime(elapsedTime)}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {!isFocusActive ? (
                    <button
                      type="button"
                      onClick={handleStartFocus}
                      disabled={isSaving || showCelebration}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:h-9 sm:w-auto sm:text-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      بدء الاستغراق
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleEndFocus}
                        disabled={isSaving}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-60 sm:h-9 sm:w-auto sm:text-sm"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Square className="h-3.5 w-3.5 fill-current" />
                        )}
                        إنهاء الثغر
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSession}
                        disabled={isSaving}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 sm:h-9 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        إلغاء
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {focusState === "success" ? (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-100 bg-white text-emerald-600 dark:border-emerald-900/60 dark:bg-zinc-900 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  وضع الراحة · {PRAYER_ANCHOR_LABELS[currentAnchor]}
                </p>
                <p className="mt-1 text-xs font-semibold leading-6 text-emerald-900 sm:text-sm sm:leading-7 dark:text-emerald-100">
                  الحمد لله، تم سد ثغور هذا الوقت. خذ قسطاً من الراحة واستعد
                  للوقت القادم.
                </p>
              </div>
            </div>
          ) : null}

          {focusState === "empty" ? (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <Play className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  ثغرك الحالي · {PRAYER_ANCHOR_LABELS[currentAnchor]}
                </p>
                <p className="mt-1 text-xs font-medium leading-6 text-zinc-600 sm:text-sm sm:leading-7 dark:text-zinc-300">
                  هذا الوقت خالٍ من المهام. ارتح أو أضف ثغراً من زر الإضافة.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </motion.section>
    </AnimatePresence>
  );

  if (isFocusActive && focusState === "focus") {
    const overlay = (
      <motion.div
        layout
        className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          layout
          className="w-full max-w-lg sm:max-w-2xl"
          initial={{ scale: 0.98, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {bannerContent}
        </motion.div>
      </motion.div>
    );

    if (typeof document !== "undefined") {
      return createPortal(overlay, document.body);
    }

    return overlay;
  }

  return bannerContent;
}
