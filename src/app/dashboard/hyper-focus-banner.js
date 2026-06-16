"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { getCurrentPrayerAnchor, PRAYER_ANCHOR_LABELS } from "./prayer-time";
import { isFixedHabitTask } from "./fixed-habits-settings";

export function HyperFocusBanner({
  tasks,
  fixedHabits,
  pendingTaskId,
  onToggleTask,
}) {
  const [celebrateKey, setCelebrateKey] = useState("");

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

  function handleComplete(task) {
    setCelebrateKey(task.id);
    onToggleTask(task);
    window.setTimeout(() => setCelebrateKey(""), 500);
  }

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={focusState + (liveTask?.id || "idle")}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`rounded-2xl border p-5 sm:p-6 ${
          focusState === "focus"
            ? "border-zinc-800 bg-zinc-950 text-zinc-50 shadow-lg shadow-zinc-950/20 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/40"
            : focusState === "success"
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-zinc-200 bg-zinc-50/80 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
        }`}
      >
        {focusState === "focus" && liveTask ? (
          <div className="flex items-center gap-4 sm:gap-5">
            <motion.button
              type="button"
              onClick={() => handleComplete(liveTask)}
              disabled={pendingTaskId === liveTask.id}
              whileTap={{ scale: 0.92 }}
              animate={
                celebrateKey === liveTask.id
                  ? { scale: [1, 1.12, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.35 }}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-zinc-600 bg-zinc-900 text-zinc-50 transition hover:border-zinc-400 hover:bg-zinc-800 disabled:opacity-60 sm:h-16 sm:w-16"
              aria-label={`إكمال ${liveTask.task_name}`}
            >
              {pendingTaskId === liveTask.id ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
              ) : (
                <Check className="h-7 w-7 text-zinc-300" />
              )}
            </motion.button>

            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                ثغرك الحالي الحقيقي
              </div>

              <p className="mb-1 text-[11px] font-semibold text-zinc-400">
                {PRAYER_ANCHOR_LABELS[currentAnchor]}
              </p>

              <div className="flex items-start gap-2">
                {isFixed ? (
                  <Sparkles className="mt-1.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : null}
                <h2 className="text-xl font-black leading-snug text-zinc-50 sm:text-2xl">
                  {liveTask.task_name}
                </h2>
              </div>
              <p className="mt-2 block text-[11px] font-medium leading-relaxed text-zinc-400">
                وضع التركيز المطلق: باقي مهام يومك مخفية عمداً الآن لتجنب تشتت
                العين. سدّ ثغرك الحالي أولاً، ثم التفت لما بعده.
              </p>
            </div>
          </div>
        ) : null}

        {focusState === "success" ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">وضع الراحة</p>
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
}
