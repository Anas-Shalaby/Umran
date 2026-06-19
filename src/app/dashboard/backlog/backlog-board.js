"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  getCurrentPrayerAnchor,
  getLocalTodayDate,
  PRAYER_ANCHOR_LABELS,
} from "../prayer-time";
import { activateBacklogTask, addBacklogTask } from "./actions";

const VAULT_COLUMNS = [
  {
    key: "work",
    title: "💼 ثغور العمل والإنتاج",
  },
  {
    key: "study",
    title: "📚 ثغور المذاكرة والطلب",
  },
  {
    key: "life",
    title: "🌱 ثغور الحياة والذات",
  },
];

const AREA_OPTIONS = [
  { key: "work", label: "عمل" },
  { key: "study", label: "طلب" },
  { key: "life", label: "ذات" },
];

const toastStyle = { fontFamily: "Umran" };

export function BacklogBoard({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draft, setDraft] = useState("");
  const [selectedArea, setSelectedArea] = useState("work");
  const [activatingId, setActivatingId] = useState("");
  const [exitingTaskId, setExitingTaskId] = useState("");
  const [exitingAnchor, setExitingAnchor] = useState("");
  const [isPending, startTransition] = useTransition();

  const tasksByArea = useMemo(() => {
    return VAULT_COLUMNS.reduce((groups, column) => {
      groups[column.key] = tasks.filter(
        (task) => task.backlog_area === column.key,
      );
      return groups;
    }, {});
  }, [tasks]);

  function handleSubmit(event) {
    event.preventDefault();

    const taskName = draft.trim();
    if (!taskName) return;

    startTransition(async () => {
      const result = await addBacklogTask(
        taskName,
        selectedArea,
        getCurrentPrayerAnchor(),
      );

      if (result?.error) {
        toast.error(result.error, {
          position: "top-right",
          style: toastStyle,
        });
        return;
      }

      if (result?.task) {
        setTasks((current) => [result.task, ...current]);
        setDraft("");
        toast.success("تم تفريغ الفكرة في المستودع.", {
          position: "top-right",
          style: toastStyle,
        });
      }
    });
  }

  function handleActivate(taskId) {
    const currentPrayerAnchor = getCurrentPrayerAnchor();
    const today = getLocalTodayDate();

    setActivatingId(taskId);

    startTransition(async () => {
      const result = await activateBacklogTask(
        taskId,
        currentPrayerAnchor,
        today,
      );

      if (result?.error) {
        toast.error(result.error, {
          position: "top-right",
          style: toastStyle,
        });
        setActivatingId("");
        return;
      }

      setActivatingId("");
      setExitingTaskId(taskId);
      setExitingAnchor(result.prayerAnchor || currentPrayerAnchor);
    });
  }

  function handleExitComplete(taskId) {
    if (exitingTaskId !== taskId) return;

    const anchorLabel = PRAYER_ANCHOR_LABELS[exitingAnchor] || "وقتك الحالي";

    setTasks((current) => current.filter((task) => task.id !== taskId));
    setExitingTaskId("");
    setExitingAnchor("");

    toast.success(`دخل الثغر نافذة التركيز — ${anchorLabel}. بارك الله في يومك.`, {
      position: "top-right",
      style: toastStyle,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="space-y-3 text-center sm:text-start">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          مُستودع الثغور والمهام
        </h1>
        <p className="max-w-2xl text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
          أفرغ زحام أفكارك هنا، واحفظ ملفاتك العصبية بعيداً عن تشتيت اليوم.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {AREA_OPTIONS.map((option) => {
            const isSelected = selectedArea === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedArea(option.key)}
                className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                  isSelected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-zinc-200/60 bg-white text-zinc-500 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isPending}
          placeholder="💡 طرأت في عقلك مهمة أو فكرة مستقبليّة؟ اكتبها واضغط Enter لتفريغ رأسك فوراً..."
          className="h-12 w-full rounded-xl border border-zinc-200/60 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 shadow-sm transition placeholder:text-zinc-400 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-emerald-500"
        />
      </form>

      <div className="grid gap-5 lg:grid-cols-3">
        {VAULT_COLUMNS.map((column) => (
          <section
            key={column.key}
            className="rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-black text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
              {column.title}
            </h2>

            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {(tasksByArea[column.key] || []).length ? (
                  tasksByArea[column.key].map((task) => (
                    <BacklogTaskStrip
                      key={task.id}
                      task={task}
                      pending={activatingId === task.id}
                      isExiting={exitingTaskId === task.id}
                      onActivate={() => handleActivate(task.id)}
                      onExitComplete={() => handleExitComplete(task.id)}
                    />
                  ))
                ) : (
                  <motion.p
                    key={`empty-${column.key}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-zinc-200/60 px-3 py-6 text-center text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
                  >
                    لا توجد ثغور مخزّنة هنا بعد.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BacklogTaskStrip({
  task,
  pending,
  isExiting,
  onActivate,
  onExitComplete,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={
        isExiting
          ? {
              opacity: 0,
              x: -24,
              scale: 0.96,
              filter: "blur(2px)",
            }
          : { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }
      }
      exit={{
        opacity: 0,
        x: -24,
        scale: 0.96,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
      }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (isExiting) onExitComplete();
      }}
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
        isExiting
          ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-zinc-200/60 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-zinc-800 dark:text-zinc-200">
        {task.task_name}
      </p>

      <button
        type="button"
        onClick={onActivate}
        disabled={pending || isExiting}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200/60 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Zap className="h-3 w-3" />
        )}
        تفعيل لليوم ⚡
      </button>
    </motion.div>
  );
}
