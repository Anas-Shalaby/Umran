"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addTaskToGoal,
  createGoal,
  toggleGoalStatus,
  toggleGoalTask,
  deleteGoal,
} from "./actions";

const toastStyle = { fontFamily: "Umran" };

const primaryInputClassName =
  "h-12 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm transition placeholder:font-medium placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:border-emerald-500 dark:focus-visible:ring-emerald-500/20";

const stepInputClassName =
  "h-11 w-full rounded-xl border-2 border-dashed border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm transition placeholder:font-medium placeholder:text-zinc-400 hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:border-emerald-500 focus-visible:border-solid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 dark:focus-visible:border-emerald-500";

function getProgress(tasks) {
  if (!tasks?.length) return 0;
  const completed = tasks.filter((task) => task.is_completed).length;
  return Math.round((completed / tasks.length) * 100);
}

export function GoalsBoard({ initialGoals }) {
  const [goals, setGoals] = useState(initialGoals);
  const [goalDraft, setGoalDraft] = useState("");
  const [taskDrafts, setTaskDrafts] = useState({});
  const [pendingGoalId, setPendingGoalId] = useState("");
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [deletingGoalId, setDeletingGoalId] = useState("");
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [isCreatingGoal, startCreateGoal] = useTransition();
  const [victoryPopped, setVictoryPopped] = useState({});

  const sortedGoals = useMemo(
    () =>
      [...goals].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [goals],
  );

  function handleCreateGoal(event) {
    event.preventDefault();

    const title = goalDraft.trim();
    if (!title) return;

    startCreateGoal(async () => {
      const result = await createGoal(title);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      if (result?.goal) {
        setGoals((current) => [result.goal, ...current]);
        setGoalDraft("");
        toast.success("تم إضافة الهدف بنجاح.", {
          position: "top-right",
          style: toastStyle,
        });
      }
    });
  }

  function handleAddTask(goalId, event) {
    event.preventDefault();

    const title = String(taskDrafts[goalId] || "").trim();
    if (!title) return;

    setPendingGoalId(goalId);

    addTaskToGoal(goalId, title).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setPendingGoalId("");
        return;
      }

      if (result?.task) {
        setGoals((current) =>
          current.map((goal) =>
            goal.id === goalId
              ? { ...goal, tasks: [...(goal.tasks || []), result.task] }
              : goal,
          ),
        );
        setTaskDrafts((current) => ({ ...current, [goalId]: "" }));
      }

      setPendingGoalId("");
    });
  }

  function handleToggleTask(goalId, task) {
    const nextValue = !task.is_completed;
    setPendingTaskId(task.id);

    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: (goal.tasks || []).map((item) =>
                item.id === task.id
                  ? { ...item, is_completed: nextValue }
                  : item,
              ),
            }
          : goal,
      ),
    );

    toggleGoalTask(task.id, nextValue).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setGoals((current) =>
          current.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  tasks: (goal.tasks || []).map((item) =>
                    item.id === task.id
                      ? { ...item, is_completed: task.is_completed }
                      : item,
                  ),
                }
              : goal,
          ),
        );
      }

      setPendingTaskId("");
    });
  }

  function handleToggleGoal(goal) {
    const nextValue = !goal.is_completed;

    setGoals((current) =>
      current.map((item) =>
        item.id === goal.id ? { ...item, is_completed: nextValue } : item,
      ),
    );

    toggleGoalStatus(goal.id, nextValue).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setGoals((current) =>
          current.map((item) =>
            item.id === goal.id
              ? { ...item, is_completed: goal.is_completed }
              : item,
          ),
        );
      }
    });
  }

  function handleDeleteGoal(goal) {
    if (deletingGoalId || !goal?.id) return;

    setGoalToDelete(goal);
  }

  function handleConfirmDeleteGoal() {
    if (!goalToDelete?.id || deletingGoalId) return;
    setDeletingGoalId(goalToDelete.id);

    const previousGoals = goals;
    setGoals((current) => current.filter((item) => item.id !== goalToDelete.id));

    deleteGoal(goalToDelete.id).then((result) => {
      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        setGoals(previousGoals);
      } else {
        toast.success("تم حذف الهدف وخطواته المرتبطة به.", {
          position: "top-right",
          style: toastStyle,
        });
      }

      setDeletingGoalId("");
      setGoalToDelete(null);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <AnimatePresence>
        {goalToDelete ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label="تأكيد حذف الهدف"
            >
              <h3 className="text-base font-black text-zinc-950 dark:text-zinc-50">
                تأكيد حذف الهدف
              </h3>
              <p className="mt-2 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
                هل أنت متأكد من حذف الهدف:
                <span className="mx-1 font-bold text-zinc-900 dark:text-zinc-50">
                  {goalToDelete.title}
                </span>
                ؟ سيتم حذف كل الخطوات المرتبطة به.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalToDelete(null)}
                  disabled={Boolean(deletingGoalId)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteGoal}
                  disabled={Boolean(deletingGoalId)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deletingGoalId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  حذف الهدف
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header className="space-y-3 text-center sm:text-start">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          الأهداف والخطوات
        </h1>
        <p className="max-w-2xl text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
          حدد غاياتك الكبرى، وقسّمها إلى خطوات عملية واضحة لتصعد في عُمران يومك.
        </p>
      </header>

      <form
        onSubmit={handleCreateGoal}
        className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-5"
      >
        <label
          htmlFor="new-goal-input"
          className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200"
        >
          هدف جديد
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="new-goal-input"
            type="text"
            value={goalDraft}
            onChange={(event) => setGoalDraft(event.target.value)}
            disabled={isCreatingGoal}
            placeholder=" اكتب هدفاً كبيراً تريد تحقيقه (مثال: إنهاء معسكر البرمجة)..."
            className={primaryInputClassName}
          />
          <button
            type="submit"
            disabled={isCreatingGoal || !goalDraft.trim()}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isCreatingGoal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            إضافة
          </button>
        </div>
        <p className="mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          اضغط Enter أو زر الإضافة لحفظ الهدف فوراً.
        </p>
      </form>

      {sortedGoals.length ? (
        <motion.div
          layout
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {sortedGoals.map((goal, index) => {
              const progress = getProgress(goal.tasks);
              const isGoalPending = pendingGoalId === goal.id;
              const isVictory = progress === 100;
              const shouldPop = isVictory && victoryPopped[goal.id] !== true;

              return (
                <motion.article
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.99 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.03)",
                  }}
                  animate={
                    shouldPop
                      ? { opacity: 1, y: 0, scale: [1, 1.02, 1] }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  onAnimationComplete={() => {
                    if (shouldPop) {
                      setVictoryPopped((current) => ({ ...current, [goal.id]: true }));
                    }
                  }}
                  transition={{
                    opacity: {
                      duration: 0.3,
                      delay: index * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    y: { duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] },
                    boxShadow: { type: "spring", stiffness: 300, damping: 30 },
                    scale: shouldPop
                      ? { type: "tween", duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                      : { type: "spring", stiffness: 300, damping: 20 },
                  }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950 ${
                    isVictory
                      ? "border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)] dark:border-emerald-800"
                      : "border-zinc-200/60 dark:border-zinc-800"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2
                        className={`truncate text-base font-black leading-7 text-zinc-950 dark:text-zinc-50 ${
                          goal.is_completed ? "text-zinc-400 line-through" : ""
                        }`}
                      >
                        {goal.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleGoal(goal)}
                        aria-label={
                          goal.is_completed
                            ? "إلغاء إكمال الهدف"
                            : "تحديد الهدف كمكتمل"
                        }
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] transition ${
                          goal.is_completed
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-zinc-300 bg-white text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-500"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        disabled={deletingGoalId === goal.id}
                        aria-label="حذف الهدف"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-red-100 bg-white text-[10px] text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/40"
                      >
                        {deletingGoalId === goal.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <span>شريط الإنجاز</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <motion.div
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 15 }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                  </div>

                  <ul className="mb-4 space-y-2">
                    {(goal.tasks || []).length ? (
                      <AnimatePresence initial={false}>
                        {goal.tasks.map((task) => (
                          <motion.li
                            key={task.id}
                            layout
                            initial={{ opacity: 0, height: 0, y: -6 }}
                            animate={{
                              opacity: 1,
                              height: "auto",
                              y: 0,
                              scale: task.is_completed ? 0.99 : 1,
                            }}
                            exit={{ opacity: 0, height: 0, y: -6 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          >
                          <button
                            type="button"
                            onClick={() => handleToggleTask(goal.id, task)}
                            disabled={pendingTaskId === task.id}
                            className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-start transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                          >
                            <span
                              className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                                task.is_completed
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-950"
                              }`}
                            >
                              {pendingTaskId === task.id ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin text-zinc-500" />
                              ) : (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </span>
                            <span
                              className={`text-xs font-semibold text-zinc-800 dark:text-zinc-200 ${
                                task.is_completed
                                  ? "text-zinc-400 line-through"
                                  : ""
                              }`}
                            >
                              {task.task_name}
                            </span>
                          </button>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <li className="rounded-lg border border-dashed border-zinc-200/60 px-3 py-4 text-center text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                        لا توجد خطوات بعد. أضف أول خطوة عملية.
                      </li>
                    )}
                  </ul>

                  <form
                    onSubmit={(event) => handleAddTask(goal.id, event)}
                    className="mt-auto rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <label
                      htmlFor={`task-input-${goal.id}`}
                      className="mb-2 block text-[11px] font-bold text-zinc-600 dark:text-zinc-300"
                    >
                      خطوة عملية جديدة
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`task-input-${goal.id}`}
                        type="text"
                        value={taskDrafts[goal.id] || ""}
                        onChange={(event) =>
                          setTaskDrafts((current) => ({
                            ...current,
                            [goal.id]: event.target.value,
                          }))
                        }
                        disabled={isGoalPending}
                        placeholder="＋ أضف خطوة عملية لهذا الهدف..."
                        className={stepInputClassName}
                      />
                      <button
                        type="submit"
                        disabled={
                          isGoalPending ||
                          !String(taskDrafts[goal.id] || "").trim()
                        }
                        aria-label="إضافة خطوة"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-zinc-200 bg-white text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                      >
                        {isGoalPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-zinc-200/60 bg-zinc-50/50 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            لم تُضف أهدافاً بعد.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ابدأ بهدف واحد كبير، ثم قسّمه إلى خطوات صغيرة قابلة للتنفيذ.
          </p>
        </motion.div>
      )}
    </div>
  );
}
