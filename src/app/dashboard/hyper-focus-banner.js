"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
          focusState === "focus"
            ? isFocusActive
              ? "border-emerald-200 bg-white text-zinc-950 shadow-2xl shadow-emerald-500/10 dark:border-emerald-500/40 dark:bg-zinc-950 dark:text-zinc-50 dark:shadow-emerald-950/20"
              : "border-zinc-200 bg-white text-zinc-950 shadow-lg shadow-zinc-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-zinc-950/40"
            : focusState === "success"
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-zinc-200 bg-zinc-50/80 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
        }`}
      >
        <AnimatePresence>
          {showCelebration ? (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 p-6 text-center backdrop-blur-sm dark:bg-zinc-950/95"
            >
              <p className="max-w-md text-lg font-black leading-10 text-emerald-700 sm:text-xl dark:text-emerald-400">
                {typeof celebrationLabel === "number" ? (
                  <>
                    أحسن الله إليك! قضيت{" "}
                    <span className="font-[Umran] text-2xl text-emerald-600 dark:text-emerald-300">
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

        {focusState === "focus" && liveTask ? (
          <div
            className={`flex flex-col gap-5 ${isFocusActive ? "sm:gap-8" : ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <span className="relative flex h-2 w-2">
                    {isFocusActive ? (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70 dark:bg-emerald-400" />
                    ) : null}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        isFocusActive
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-zinc-400 dark:bg-zinc-500"
                      }`}
                    />
                  </span>
                  {isFocusActive ? "وضع الاستغراق نشط" : "ثغرك الحالي الحقيقي"}
                </div>

                <p className="mb-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {PRAYER_ANCHOR_LABELS[currentAnchor]}
                </p>

                <div className="flex items-start gap-2">
                  {isFixed ? (
                    <Sparkles className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  <h2
                    className={`font-black leading-snug text-zinc-950 dark:text-zinc-50 ${
                      isFocusActive
                        ? "text-2xl sm:text-3xl"
                        : "text-xl sm:text-2xl"
                    }`}
                  >
                    {liveTask.task_name}
                  </h2>
                </div>

                {!isFocusActive ? (
                  <p className="mt-2 block text-[11px] font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                    ابدأ عداد الاستغراق المفتوح — بلا حدود زمنية صارمة، فقط أنت
                    وثغرك حتى تنتهي.
                  </p>
                ) : null}
              </div>

              {isFocusActive ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex shrink-0 items-baseline gap-3"
                >
                  <p
                    className="font-[Umran] text-3xl tracking-wider text-emerald-600 md:text-5xl dark:text-emerald-500"
                    aria-live="polite"
                    aria-label={`الوقت المنقضي ${formatElapsedTime(elapsedTime)}`}
                  >
                    {formatElapsedTime(elapsedTime)}
                  </p>
                </motion.div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isFocusActive ? (
                <button
                  type="button"
                  onClick={handleStartFocus}
                  disabled={isSaving || showCelebration}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-900 px-4 text-sm font-semibold text-zinc-50 transition hover:border-zinc-300 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700 dark:focus-visible:ring-offset-zinc-950"
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    )}
                    إنهاء الثغر وحفظ الأثر
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={isSaving}
                    className=" font-medium rounded-md text-zinc-800 bg-zinc-100 transition hover:text-zinc-600 disabled:opacity-40 hover:bg-zinc-200  p-2 dark:text-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    إلغاء الجلسة
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {focusState === "success" ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              وضع الراحة
            </p>
            <p className="text-sm font-semibold leading-8 text-emerald-900 dark:text-emerald-100">
              الحمد لله، تم سد ثغور هذا الوقت بنجاح. خذ قسطاً من الراحة واستعد
              للوقت القادم.
            </p>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80">
              {PRAYER_ANCHOR_LABELS[currentAnchor]}
            </p>
          </div>
        ) : null}

        {focusState === "empty" ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              واجهة التركيز المطلق
            </p>
            <p className="text-sm font-medium leading-8 text-zinc-600 dark:text-zinc-300">
              هذا الوقت خالٍ من المهام المجدولة. ارتح، أو أضف ثغراً سريعاً
              بالأسفل.
            </p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
              {PRAYER_ANCHOR_LABELS[currentAnchor]}
            </p>
          </div>
        ) : null}
      </motion.section>
    </AnimatePresence>
  );

  if (isFocusActive && focusState === "focus") {
    return (
      <motion.div
        layout
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 p-4 backdrop-blur-sm dark:bg-zinc-950/90 sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          layout
          className="w-full max-w-3xl"
          initial={{ scale: 0.96, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {bannerContent}
        </motion.div>
      </motion.div>
    );
  }

  return bannerContent;
}
