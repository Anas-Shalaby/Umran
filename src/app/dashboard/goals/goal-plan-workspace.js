"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PRAYER_ANCHOR_LABELS } from "../prayer-time";
import { deleteGoalTask, toggleGoalTask } from "./actions";
import { TASK_PRIORITY_META, TaskModal } from "./task-modal";
import { getRecurrenceLabel } from "@/lib/tasks/recurrence";

const toastStyle = { fontFamily: "Umran" };

function getProgress(tasks) {
  if (!tasks?.length) return 0;
  const completed = tasks.filter((task) => task.is_completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function formatTotalHours(tasks) {
  const totalMinutes = tasks.reduce(
    (sum, task) => sum + (Number(task.expected_minutes) || 0),
    0,
  );

  if (!totalMinutes) return "—";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours} س ${minutes} د`;
  if (hours) return `${hours} ساعة`;
  return `${minutes} دقيقة`;
}

function ProgressRing({ progress, size = 88 }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-200 dark:text-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-emerald-500"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </svg>
      <span className="absolute text-sm font-black text-zinc-900 dark:text-zinc-50">
        {progress}%
      </span>
    </div>
  );
}

export function GoalPlanWorkspace({ goal: initialGoal }) {
  const [goal, setGoal] = useState(initialGoal);
  const [tasks, setTasks] = useState(initialGoal.tasks || []);
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const progress = useMemo(() => getProgress(tasks), [tasks]);
  const completedCount = useMemo(
    () => tasks.filter((task) => task.is_completed).length,
    [tasks],
  );
  const totalHoursLabel = useMemo(() => formatTotalHours(tasks), [tasks]);

  function openCreateModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  function handleTaskSaved(task, { isEditing }) {
    if (isEditing) {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)),
      );
      toast.success("تم تحديث الثغرة.", {
        position: "top-right",
        style: toastStyle,
      });
      return;
    }

    setTasks((current) => [...current, task]);
    toast.success("أُضيفت الثغرة إلى الخطة.", {
      position: "top-right",
      style: toastStyle,
    });
  }

  function handleToggleTask(task) {
    const nextValue = !task.is_completed;
    setPendingTaskId(task.id);

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, is_completed: nextValue } : item,
      ),
    );

    toggleGoalTask(task.id, nextValue).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id
              ? { ...item, is_completed: task.is_completed }
              : item,
          ),
        );
      }

      setPendingTaskId("");
    });
  }

  function handleDeleteTask(taskId) {
    setPendingDeleteId(taskId);

    deleteGoalTask(taskId).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setPendingDeleteId("");
        return;
      }

      setTasks((current) => current.filter((item) => item.id !== taskId));
      toast.success("تم حذف الثغرة.", {
        position: "top-right",
        style: toastStyle,
      });
      setPendingDeleteId("");
    });
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 pb-6 sm:space-y-8 sm:pb-10">
        <Link
          href="/dashboard/goals"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 transition hover:text-zinc-800 sm:text-sm dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowRight className="h-4 w-4 shrink-0" />
          العودة إلى الأهداف
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 lg:p-8"
        >
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-start">
            <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
              <p className="text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
                خطة الهدف
              </p>
              <h1 className="text-xl font-black leading-8 text-zinc-950 sm:text-2xl sm:leading-tight lg:text-4xl dark:text-zinc-50">
                {goal.title}
              </h1>

              <div className="flex flex-wrap justify-center gap-4 sm:justify-start sm:gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    الثغور المنجزة
                  </p>
                  <p className="mt-1 text-base font-black text-zinc-900 sm:text-lg dark:text-zinc-100">
                    {completedCount}/{tasks.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    إجمالي الساعات المتوقعة
                  </p>
                  <p className="mt-1 text-base font-black text-zinc-900 sm:text-lg dark:text-zinc-100">
                    {totalHoursLabel}
                  </p>
                </div>
              </div>
            </div>

            <ProgressRing progress={progress} size={76} />
          </div>
        </motion.section>

        <section className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h2 className="text-base font-black text-zinc-950 sm:text-lg dark:text-zinc-50">
              ثغور الخطة
            </h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              إضافة ثغر
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <AnimatePresence initial={false} mode="popLayout">
              {tasks.length ? (
                tasks.map((task, index) => {
                  const priorityMeta =
                    TASK_PRIORITY_META[task.priority_level] ||
                    TASK_PRIORITY_META.normal;
                  const prayerLabel = task.prayer_anchor
                    ? PRAYER_ANCHOR_LABELS[task.prayer_anchor]
                    : null;
                  const recurrenceLabel = getRecurrenceLabel(task);

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="group border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
                    >
                      <div className="flex items-start gap-2.5 px-3 py-3 sm:items-center sm:gap-3 sm:px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          disabled={pendingTaskId === task.id}
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition disabled:opacity-60 sm:mt-0 ${
                            task.is_completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-950"
                          }`}
                          aria-label={
                            task.is_completed ? "إلغاء الإكمال" : "إكمال الثغرة"
                          }
                        >
                          {pendingTaskId === task.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="flex min-w-0 flex-1 flex-col gap-1 text-start sm:flex-row sm:items-center sm:gap-2"
                        >
                          <span className="flex min-w-0 items-start gap-2 sm:items-center">
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full sm:mt-0 ${priorityMeta.dot}`}
                              aria-hidden
                            />
                            <span
                              className={`text-sm font-semibold leading-6 text-zinc-900 sm:truncate dark:text-zinc-100 ${
                                task.is_completed
                                  ? "text-zinc-400 line-through"
                                  : ""
                              }`}
                            >
                              {task.task_name}
                            </span>
                          </span>
                          {prayerLabel ? (
                            <span className="inline-flex w-fit shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 sm:hidden dark:bg-zinc-900 dark:text-zinc-400">
                              {prayerLabel}
                            </span>
                          ) : null}
                          {recurrenceLabel ? (
                            <span className="inline-flex w-fit shrink-0 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                              {recurrenceLabel}
                            </span>
                          ) : null}
                        </button>

                        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        {prayerLabel ? (
                          <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                            {prayerLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-400">
                            —
                          </span>
                        )}
                        {recurrenceLabel ? (
                          <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                            {recurrenceLabel}
                          </span>
                        ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={pendingDeleteId === task.id}
                          aria-label="مسح الثغرة"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 opacity-100 transition hover:bg-zinc-100 hover:text-red-500 disabled:opacity-50 sm:h-8 sm:w-8 sm:opacity-70 sm:group-hover:opacity-100 dark:hover:bg-zinc-900 dark:hover:text-red-400"
                        >
                          {pendingDeleteId === task.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-14 text-center"
                >
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    لا توجد ثغور بعد.
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    اضغط «إضافة ثغر» لبدء بناء خطتك.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <TaskModal
        open={isModalOpen}
        goalId={goal.id}
        task={editingTask}
        onClose={closeModal}
        onSaved={handleTaskSaved}
      />
    </>
  );
}
