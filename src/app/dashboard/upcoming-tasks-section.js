"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, ChevronDown, Loader2, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteTask } from "./actions";
import { PRAYER_ANCHOR_LABELS } from "./prayer-time";
import { RecurrenceEditScopeDialog } from "@/components/dashboard/recurrence-edit-scope-dialog";
import { getRecurrenceLabel, shouldShowTaskInUpcomingSection } from "@/lib/tasks/recurrence";
import { getLocalTodayDate } from "./prayer-time";

const toastStyle = { fontFamily: "Umran" };

function formatScheduledTime(value) {
  if (!value) return "";

  const raw = String(value);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatDateGroupLabel(taskDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${taskDate}T00:00:00`);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "غداً";
  if (diffDays > 1 && diffDays <= 7) return `بعد ${diffDays} أيام`;

  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(target);
}

function groupTasksByDate(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    const key = task.task_date;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(task);
  }

  return [...groups.entries()].map(([date, dateTasks]) => ({
    date,
    label: formatDateGroupLabel(date),
    tasks: dateTasks,
  }));
}

export function UpcomingTasksSection({
  tasks = [],
  onTasksChange,
  onEditTask,
  onFixedHabitsChange,
  defaultCollapsed = true,
}) {
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [deleteScopeTask, setDeleteScopeTask] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isPending, startTransition] = useTransition();

  const visibleTasks = useMemo(() => {
    const today = getLocalTodayDate();
    return tasks.filter((task) =>
      shouldShowTaskInUpcomingSection(task, today),
    );
  }, [tasks]);

  const groupedTasks = useMemo(
    () => groupTasksByDate(visibleTasks),
    [visibleTasks],
  );

  function handleDelete(task, deleteScope = "instance") {
    const previous = tasks;
    onTasksChange?.(tasks.filter((item) => item.id !== task.id));
    setPendingTaskId(task.id);

    startTransition(async () => {
      const result = await deleteTask(task.id, deleteScope);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        onTasksChange?.(previous);
      } else {
        if (result.fixedHabits) {
          onFixedHabitsChange?.(result.fixedHabits);
        }
        toast.success("تم حذف المهمة المجدولة.", {
          position: "top-right",
          style: toastStyle,
        });
      }

      setPendingTaskId("");
    });
  }

  function requestDelete(task) {
    if (task.recurrence_rule_id) {
      setDeleteScopeTask(task);
      return;
    }

    handleDelete(task);
  }

  if (!visibleTasks.length) {
    return null;
  }

  return (
    <>
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex min-h-[44px] w-full touch-manipulation items-center gap-2 px-4 py-3 text-start sm:px-5"
        aria-expanded={isExpanded}
      >
        <CalendarClock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
        <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
          مهام قادمة
        </h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {visibleTasks.length}
        </span>
        <ChevronDown
          className={`ms-auto h-4 w-4 shrink-0 text-zinc-400 transition ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded ? (
      <div className="space-y-4 border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800 sm:px-5 sm:pb-5">
        <AnimatePresence initial={false}>
          {groupedTasks.map((group) => (
            <motion.div
              key={group.date}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {group.label}
              </p>
              <ul className="space-y-2">
                {group.tasks.map((task) => {
                  const recurrenceLabel = getRecurrenceLabel(task);

                  return (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {task.task_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                          {PRAYER_ANCHOR_LABELS[task.prayer_anchor] ||
                            task.prayer_anchor}
                        </span>
                        {task.scheduled_time ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {formatScheduledTime(task.scheduled_time)}
                          </span>
                        ) : null}
                        {recurrenceLabel ? (
                          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                            {recurrenceLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onEditTask?.(task)}
                        disabled={isPending && pendingTaskId === task.id}
                        className="grid h-9 w-9 touch-manipulation place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        aria-label={`تعديل ${task.task_name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(task)}
                        disabled={isPending && pendingTaskId === task.id}
                        className="grid h-9 w-9 touch-manipulation place-items-center rounded-full text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        aria-label={`حذف ${task.task_name}`}
                      >
                        {isPending && pendingTaskId === task.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      ) : null}
    </motion.section>

    <RecurrenceEditScopeDialog
      open={Boolean(deleteScopeTask)}
      mode="delete"
      onClose={() => setDeleteScopeTask(null)}
      onConfirm={(scope) => {
        const task = deleteScopeTask;
        setDeleteScopeTask(null);
        if (task) {
          handleDelete(task, scope);
        }
      }}
    />
    </>
  );
}

export function formatTaskScheduledTime(value) {
  return formatScheduledTime(value);
}
