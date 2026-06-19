"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Moon,
  Pencil,
  Sparkles,
  Star,
  Sunrise,
  Sun,
  Sunset,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { toggleTask, deleteTask } from "./actions";
import { EditTaskModal } from "./edit-task-modal";
import { TASK_ADDED_EVENT } from "@/components/dashboard/dashboard-add-task-fab";
import { RecurrenceEditScopeDialog } from "@/components/dashboard/recurrence-edit-scope-dialog";
import { FixedHabitsSettings, isFixedHabitTask } from "./fixed-habits-settings";
import { HyperFocusBanner } from "./hyper-focus-banner";
import { getCurrentPrayerAnchor, getLocalTodayDate } from "./prayer-time";
import {
  UpcomingTasksSection,
  formatTaskScheduledTime,
} from "./upcoming-tasks-section";
import {
  getRecurrenceLabel,
  shouldShowTaskInUpcomingSection,
} from "@/lib/tasks/recurrence";
import {
  buildTodayTimeline,
  sortTodayTasks,
} from "@/lib/tasks/sort-today-tasks";

const prayerBlocks = [
  {
    key: "fajr",
    title: "بعد الفجر",
    shortTitle: "الفجر",
    description: "ابدأ يومك بما يبني الأصل قبل ضجيج العالم.",
    icon: Sunrise,
  },
  {
    key: "dhuhr",
    title: "الظهر",
    shortTitle: "الظهر",
    description: "نافذة هادئة لإنجاز ما يحتاج حضوراً ذهنياً كاملاً.",
    icon: Sun,
  },
  {
    key: "asr",
    title: "بعد العصر",
    shortTitle: "العصر",
    description: "راجع، ثبّت، وأنهِ ما بدأته اليوم بتركيز.",
    icon: Sun,
  },
  {
    key: "maghrib",
    title: "المغرب",
    shortTitle: "المغرب",
    description: "مساحة قصيرة للتصفية المعرفية والالتزام الخفيف.",
    icon: Sunset,
  },
  {
    key: "isha",
    title: "بعد العشاء",
    shortTitle: "العشاء",
    description: "أغلق يومك بوعي، فرّغ عاداتك، واستعد لغد أفضل.",
    icon: Moon,
  },
];

const SPIRITUAL_BANNER_STORAGE_KEY = "umran-spiritual-banner-dismissed";

const fadeTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

function insertUpcomingTask(currentTasks, task) {
  return [...currentTasks, task].sort((a, b) => {
    if (a.task_date !== b.task_date) {
      return a.task_date.localeCompare(b.task_date);
    }

    const aTime = a.scheduled_time || "";
    const bTime = b.scheduled_time || "";

    if (aTime && bTime && aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function TodayTasksBoard({
  initialTasks,
  initialFixedHabits,
  initialUpcomingTasks = [],
  isFocusActive = false,
  onFocusActiveChange,
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [fixedHabits, setFixedHabits] = useState(initialFixedHabits);
  const [upcomingTasks, setUpcomingTasks] = useState(initialUpcomingTasks);
  const [selectedPrayer, setSelectedPrayer] = useState("all");
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [deleteScopeTask, setDeleteScopeTask] = useState(null);
  const [showSpiritualBanner, setShowSpiritualBanner] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sectionRefs = useRef({});
  const hasAutoScrolledRef = useRef(false);

  const currentAnchor = useMemo(() => getCurrentPrayerAnchor(), []);

  const todayTimeline = useMemo(
    () => buildTodayTimeline(tasks, currentAnchor),
    [tasks, currentAnchor],
  );

  const nextPendingStep = useMemo(() => {
    for (const block of todayTimeline) {
      const pendingTask = block.tasks.find(({ step }) => step !== null);
      if (pendingTask) {
        return pendingTask.step;
      }
    }
    return null;
  }, [todayTimeline]);

  const todayStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.is_completed).length;

    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setUpcomingTasks(initialUpcomingTasks);
  }, [initialUpcomingTasks]);

  useEffect(() => {
    const isDismissed =
      localStorage.getItem(SPIRITUAL_BANNER_STORAGE_KEY) === "true";
    setShowSpiritualBanner(!isDismissed);
  }, []);

  useEffect(() => {
    if (hasAutoScrolledRef.current || !todayTimeline.length) return;
    if (window.matchMedia("(max-width: 639px)").matches) return;

    hasAutoScrolledRef.current = true;

    const targetAnchor =
      todayTimeline.find((block) => block.isCurrent)?.anchor ||
      todayTimeline.find((block) => block.isOverdue)?.anchor ||
      todayTimeline[0]?.anchor;

    if (!targetAnchor) return;

    const timeoutId = window.setTimeout(() => {
      sectionRefs.current[targetAnchor]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [todayTimeline]);

  useEffect(() => {
    function handleTaskAdded(event) {
      applyNewTaskResult(event.detail, { silent: true });
    }

    window.addEventListener(TASK_ADDED_EVENT, handleTaskAdded);

    return () => {
      window.removeEventListener(TASK_ADDED_EVENT, handleTaskAdded);
    };
  }, []);

  function handleBoardRefresh({ tasks: nextTasks, fixedHabits: nextHabits }) {
    setTasks(nextTasks);
    setFixedHabits(nextHabits);
  }

  function applyNewTaskResult(result, { silent = false } = {}) {
    if (!result?.task) return;

    if (result.fixedHabits) {
      setFixedHabits(result.fixedHabits);
    }

    if (result.isScheduled) {
      if (shouldShowTaskInUpcomingSection(result.task, getLocalTodayDate())) {
        setUpcomingTasks((current) => insertUpcomingTask(current, result.task));
      }
      if (!silent) {
        toast.success("تمت جدولة المهمة.", {
          position: "top-right",
          style: { fontFamily: "Umran" },
        });
      }
      return;
    }

    setTasks((currentTasks) => sortTodayTasks([...currentTasks, result.task]));
    scrollToPrayer(result.task.prayer_anchor);
    if (!silent) {
      toast.success("تمت إضافة المهمة.", {
        position: "top-right",
        style: { fontFamily: "Umran" },
      });
    }
  }

  function handleToggleTask(task) {
    setPendingTaskId(task.id);

    const previousTasks = tasks;
    setTasks((currentTasks) =>
      sortTodayTasks(
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? { ...currentTask, is_completed: !task.is_completed }
            : currentTask,
        ),
      ),
    );

    startTransition(async () => {
      const result = await toggleTask(task.id, task.is_completed);

      if (result?.error) {
        toast.error(result.error, {
          style: {
            fontFamily: "Umran",
          },
          position: "top-right",
        });
        setTasks(previousTasks);
      }

      setPendingTaskId("");
    });
  }

  function handleEditSaved(result) {
    const {
      task,
      wasToday,
      isToday,
      wasScheduled,
      isScheduled,
      fixedHabits: nextHabits,
    } = result;

    if (nextHabits) {
      setFixedHabits(nextHabits);
    }

    if (wasToday && isScheduled) {
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setUpcomingTasks((current) => {
        const next = current.filter((item) => item.id !== task.id);
        if (shouldShowTaskInUpcomingSection(task, getLocalTodayDate())) {
          return insertUpcomingTask(next, task);
        }
        return next;
      });
    } else if (wasScheduled && isToday) {
      setUpcomingTasks((current) =>
        current.filter((item) => item.id !== task.id),
      );
      setTasks((current) =>
        sortTodayTasks([
          ...current.filter((item) => item.id !== task.id),
          task,
        ]),
      );
    } else if (isToday) {
      setTasks((current) =>
        sortTodayTasks(
          current.map((item) => (item.id === task.id ? task : item)),
        ),
      );
    } else if (isScheduled) {
      setUpcomingTasks((current) => {
        const next = current.filter((item) => item.id !== task.id);
        if (shouldShowTaskInUpcomingSection(task, getLocalTodayDate())) {
          return insertUpcomingTask(next, task);
        }
        return next;
      });
    }

    toast.success("تم تحديث المهمة.", {
      position: "top-right",
      style: {
        fontFamily: "Umran",
      },
    });
  }

  function handleDeleteTask(task, deleteScope = "instance") {
    const previousTasks = tasks;
    setTasks((currentTasks) =>
      currentTasks.filter((currentTask) => currentTask.id !== task.id),
    );

    startTransition(async () => {
      const result = await deleteTask(task.id, deleteScope);

      if (result?.error) {
        toast.error(result.error);
        setTasks(previousTasks);
        return;
      }

      if (result.fixedHabits) {
        setFixedHabits(result.fixedHabits);
      }

      toast.success("تم حذف المهمة.", {
        position: "top-right",
        style: {
          fontFamily: "Umran",
        },
      });
    });
  }

  function requestDeleteTask(task) {
    if (task.recurrence_rule_id) {
      setDeleteScopeTask(task);
      return;
    }

    handleDeleteTask(task);
  }

  function handleDismissSpiritualBanner() {
    localStorage.setItem(SPIRITUAL_BANNER_STORAGE_KEY, "true");
    setShowSpiritualBanner(false);
  }

  function handleFocusTaskCompleted(updatedTask) {
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === updatedTask.id ? updatedTask : currentTask,
      ),
    );
  }

  function scrollToPrayer(prayerKey) {
    setSelectedPrayer(prayerKey);
    sectionRefs.current[prayerKey]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div
      className="relative mx-auto w-full min-w-0 space-y-2 sm:space-y-4"
      dir="rtl"
    >
      <HyperFocusBanner
        tasks={tasks}
        fixedHabits={fixedHabits}
        isFocusActive={isFocusActive}
        onFocusActiveChange={onFocusActiveChange}
        onTaskCompleted={handleFocusTaskCompleted}
      />

      <motion.div
        animate={{ opacity: isFocusActive ? 0 : 1 }}
        transition={fadeTransition}
        className={`space-y-2 sm:space-y-4 ${isFocusActive ? "pointer-events-none" : ""}`}
      >
        <section className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-surface-elevated shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:min-h-[min(72vh,calc(100dvh-10rem))] sm:rounded-2xl">
          <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-200/80 px-3 py-2.5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                كل مهام اليوم
              </p>
              <p className="text-[11px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
                {todayStats.total
                  ? `${todayStats.completed} من ${todayStats.total} منجزة`
                  : "لا مهام بعد"}
              </p>
            </div>
            {todayStats.total ? (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  {todayStats.percent}%
                </span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200 sm:w-20 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${todayStats.percent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <aside className="sticky top-14 z-10 flex shrink-0 snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain border-b border-zinc-200/80 bg-surface-muted/95 p-2 backdrop-blur-md [scrollbar-width:none] sm:static sm:top-0 sm:w-32 sm:snap-none sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-s sm:bg-surface-muted sm:p-2 sm:backdrop-blur-none dark:border-zinc-800 dark:bg-zinc-950/80 sm:dark:bg-zinc-950/40 lg:w-36 [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrayer("all");
                  sectionRefs.current.all?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`min-h-[44px] shrink-0 snap-start rounded-lg border px-3 py-2 text-[11px] font-bold transition touch-manipulation sm:min-h-0 sm:px-2.5 sm:text-xs ${
                  selectedPrayer === "all"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-transparent bg-white text-zinc-600 hover:border-zinc-200 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                الكل ({tasks.length})
              </button>
              {todayTimeline.map((block, blockIndex) => {
                const prayerBlock = prayerBlocks.find(
                  (item) => item.key === block.anchor,
                );
                if (!prayerBlock) return null;

                const BlockIcon = prayerBlock.icon;
                const isSelected = block.anchor === selectedPrayer;
                const isCurrent = block.isCurrent;

                return (
                  <button
                    key={block.anchor}
                    type="button"
                    onClick={() => scrollToPrayer(block.anchor)}
                    className={`relative flex min-h-[44px] min-w-[5.25rem] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-lg border px-2.5 py-2 text-center transition touch-manipulation sm:min-h-0 sm:min-w-0 sm:flex-row sm:items-center sm:gap-1.5 sm:px-2 sm:py-1.5 sm:text-start ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : block.isOverdue
                          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/70 dark:bg-transparent dark:text-amber-400"
                          : isCurrent
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-transparent dark:text-emerald-400"
                            : "border-transparent bg-white text-zinc-600 hover:border-zinc-200 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span className="hidden text-[9px] font-black opacity-70 sm:inline">
                      {blockIndex + 1}
                    </span>
                    <BlockIcon className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
                    <span className="text-[11px] font-bold sm:text-[11px]">
                      {prayerBlock.shortTitle}
                    </span>
                    {block.tasks.length ? (
                      <span
                        className={`rounded-full px-1.5 w-5 h-5 flex items-center justify-center text-[9px] font-bold sm:ms-auto ${
                          isSelected
                            ? "bg-white/20 text-inherit"
                            : block.pendingCount
                              ? block.isOverdue
                                ? "bg-amber-200 text-amber-900 dark:border dark:border-amber-700/50 dark:bg-transparent dark:text-amber-400"
                                : "bg-amber-100 text-amber-800 dark:border dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300"
                              : "bg-emerald-100 text-emerald-700 dark:border dark:border-emerald-700/50 dark:bg-transparent dark:text-emerald-400"
                        }`}
                      >
                        {block.pendingCount || "✓"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </aside>

            <div
              ref={(element) => {
                sectionRefs.current.all = element;
              }}
              className="custom-scrollbar min-h-0 flex-1 p-2 sm:overflow-y-auto sm:p-3"
            >
              {!tasks.length ? (
                <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center sm:min-h-[12rem] dark:border-zinc-800 dark:bg-zinc-900/30">
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    لا مهام اليوم بعد
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    أضف مهمة من زر الإضافة
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTimeline.map((block, blockIndex) => {
                    const prayerBlock = prayerBlocks.find(
                      (item) => item.key === block.anchor,
                    );
                    if (!prayerBlock) return null;

                    const isHighlighted = selectedPrayer === block.anchor;
                    const BlockIcon = prayerBlock.icon;

                    return (
                      <section
                        key={block.anchor}
                        id={`prayer-${block.anchor}`}
                        ref={(element) => {
                          sectionRefs.current[block.anchor] = element;
                        }}
                        className={`scroll-mt-32 rounded-xl border bg-white p-2.5 sm:scroll-mt-2 dark:bg-zinc-900/70 ${
                          isHighlighted
                            ? "border-zinc-400 ring-1 ring-zinc-300 dark:border-zinc-500 dark:ring-zinc-600/60"
                            : block.isOverdue
                              ? "border-amber-300 bg-amber-50/40 dark:border-amber-700/50 dark:bg-zinc-900/70"
                              : block.isCurrent
                                ? "border-emerald-300 dark:border-emerald-700/50"
                                : "border-zinc-200 dark:border-zinc-700/70"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[11px] font-black ${
                              block.isOverdue
                                ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700/60 dark:bg-transparent dark:text-amber-400"
                                : block.isCurrent
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-transparent dark:text-emerald-400"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-400"
                            }`}
                          >
                            {blockIndex + 1}
                          </span>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600 dark:bg-transparent dark:text-zinc-400">
                            <BlockIcon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xs font-black text-zinc-900 dark:text-zinc-100">
                              {prayerBlock.title}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {block.isCurrent ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  الوقت الحالي
                                </span>
                              ) : null}
                              {block.isOverdue ? (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  متأخر — أنجزه الآن
                                </span>
                              ) : block.anchorStatus > 0 ? (
                                <span className="text-[10px] font-medium text-zinc-400">
                                  لاحقاً في اليوم
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {
                              block.tasks.filter(
                                ({ task }) => task.is_completed,
                              ).length
                            }
                            /{block.tasks.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {block.tasks.map(({ task, step }) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              isNextUp={step === nextPendingStep}
                              isFixed={isFixedHabitTask(task, fixedHabits)}
                              pending={pendingTaskId === task.id}
                              onToggleTask={handleToggleTask}
                              onEditTask={setEditingTask}
                              onDeleteTask={requestDeleteTask}
                              compact
                              dense
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <UpcomingTasksSection
          tasks={upcomingTasks}
          onTasksChange={setUpcomingTasks}
          onEditTask={setEditingTask}
          onFixedHabitsChange={setFixedHabits}
          defaultCollapsed
        />
      </motion.div>

      <motion.div
        animate={{ opacity: isFocusActive ? 0 : 1 }}
        transition={fadeTransition}
        className={isFocusActive ? "pointer-events-none" : ""}
      >
        <AnimatePresence initial={false}>
          {showSpiritualBanner ? (
            <motion.div
              key="spiritual-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <button
                type="button"
                onClick={handleDismissSpiritualBanner}
                className="absolute -end-1 -top-1 z-20 grid h-9 w-9 touch-manipulation place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="إغلاق قسم الزاد الروحي"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
                <div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    الزاد الروحي
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {fixedHabits.length
                      ? `${fixedHabits.length} عادة راتبة مفعّلة`
                      : "لم تُفعّل أورادك الراتبة بعد"}
                  </p>
                </div>
                <div className="shrink-0 self-start">
                  <FixedHabitsSettings
                    fixedHabits={fixedHabits}
                    onSaved={handleBoardRefresh}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <EditTaskModal
        open={Boolean(editingTask)}
        task={editingTask}
        fixedHabits={fixedHabits}
        onClose={() => setEditingTask(null)}
        onSaved={handleEditSaved}
      />

      <RecurrenceEditScopeDialog
        open={Boolean(deleteScopeTask)}
        mode="delete"
        onClose={() => setDeleteScopeTask(null)}
        onConfirm={(scope) => {
          const task = deleteScopeTask;
          setDeleteScopeTask(null);
          if (task) {
            handleDeleteTask(task, scope);
          }
        }}
      />
    </div>
  );
}

function TaskItem({
  task,
  isNextUp = false,
  isFixed,
  pending,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  compact = false,
  dense = false,
}) {
  const goalTitle = task?.goals?.title || "";
  const campTitle = task?.camp_source?.camps?.title || "";
  const scheduledTimeLabel = formatTaskScheduledTime(task.scheduled_time);
  const recurrenceLabel = getRecurrenceLabel(task);
  const hasMetaBadges =
    scheduledTimeLabel || goalTitle || campTitle || recurrenceLabel;

  return (
    <motion.div
      layout
      className={`group flex w-full items-center gap-2 rounded-lg border text-start transition touch-manipulation ${
        dense
          ? "min-h-[44px] gap-2 rounded-md p-2 shadow-none sm:min-h-0 sm:gap-1.5 sm:p-1.5"
          : compact
            ? "p-2.5"
            : "items-start p-3 sm:items-center sm:gap-3"
      } ${
        isNextUp
          ? "border-emerald-300 bg-emerald-50/90 ring-1 ring-emerald-200 dark:border-emerald-600/50 dark:bg-zinc-900/80 dark:ring-emerald-700/30"
          : ""
      } ${
        task.is_completed
          ? isFixed
            ? "border-emerald-200/80 bg-emerald-50/50 opacity-80 dark:border-emerald-800/50 dark:bg-zinc-900/50"
            : dense
              ? "border-zinc-200 bg-zinc-100/80 opacity-75 dark:border-zinc-700/60 dark:bg-zinc-900/40"
              : "border-zinc-200 bg-zinc-100/70 opacity-80 dark:border-zinc-700/60 dark:bg-zinc-900/40"
          : isFixed
            ? dense
              ? "border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/70 dark:border-emerald-800/50 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80"
              : "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/80 dark:border-emerald-800/50 dark:bg-zinc-900/60 dark:hover:border-emerald-700/50 dark:hover:bg-zinc-800/80"
            : dense
              ? "border-zinc-200 bg-zinc-50 hover:bg-white dark:border-zinc-700/70 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/70"
              : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/70"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        disabled={pending}
        className={`flex min-w-0 flex-1 items-center text-start disabled:opacity-60 ${
          dense
            ? "gap-1.5"
            : compact
              ? "gap-2.5"
              : "items-start gap-2.5 sm:items-center sm:gap-3"
        }`}
      >
        <span
          className={`grid shrink-0 place-items-center rounded border-2 transition ${
            dense ? "h-4 w-4 rounded-[4px]" : "h-5 w-5 rounded-md"
          } ${
            task.is_completed
              ? isFixed
                ? "border-emerald-600 bg-emerald-600 text-emerald-50 dark:border-emerald-500 dark:bg-emerald-500"
                : "border-zinc-700 bg-zinc-700 text-zinc-50 dark:border-zinc-400 dark:bg-zinc-400"
              : isNextUp
                ? "border-emerald-500 bg-transparent dark:border-emerald-500"
                : isFixed
                  ? "border-emerald-400 bg-transparent dark:border-emerald-600"
                  : "border-zinc-300 bg-transparent dark:border-zinc-500"
          }`}
        >
          {pending ? (
            <Loader2
              className={`animate-spin text-zinc-500 dark:text-zinc-400 ${dense ? "h-2.5 w-2.5" : "h-3 w-3"}`}
            />
          ) : task.is_completed ? (
            <Check className={dense ? "h-2.5 w-2.5" : "h-3 w-3"} />
          ) : null}
        </span>

        <span
          className={`flex min-w-0 flex-1 ${
            dense
              ? "flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2"
              : "items-center gap-2"
          }`}
        >
          {isFixed && !dense ? (
            <Star className="h-4 w-4 shrink-0 fill-emerald-500 text-emerald-500" />
          ) : null}
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate font-bold leading-5 transition ${
                dense ? "text-xs" : "text-sm leading-6"
              } ${
                task.is_completed
                  ? "text-zinc-400 line-through"
                  : isFixed
                    ? "text-emerald-900 dark:text-emerald-200"
                    : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {isNextUp ? "التالي: " : ""}
              {task.task_name}
            </span>
            {!compact && hasMetaBadges ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {scheduledTimeLabel ? (
                  <span className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {scheduledTimeLabel}
                  </span>
                ) : null}
                {recurrenceLabel ? (
                  <span className="inline-flex max-w-full items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                    {recurrenceLabel}
                  </span>
                ) : null}
                {goalTitle ? (
                  <span className="inline-flex max-w-full items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                    الهدف: {goalTitle}
                  </span>
                ) : null}
                {campTitle ? (
                  <span className="inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    معسكر: {campTitle}
                  </span>
                ) : null}
              </div>
            ) : null}
          </span>
          {compact && (scheduledTimeLabel || recurrenceLabel) ? (
            <span className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:shrink-0">
              {recurrenceLabel ? (
                <span
                  className={`rounded-full border border-violet-200 bg-violet-50 font-bold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300 ${
                    dense
                      ? "px-1.5 py-0 text-[10px]"
                      : "px-2 py-0.5 text-[11px]"
                  }`}
                >
                  {recurrenceLabel}
                </span>
              ) : null}
              {scheduledTimeLabel ? (
                <span
                  className={`rounded-full border border-zinc-200 bg-white font-bold text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 ${
                    dense
                      ? "px-1.5 py-0 text-[10px]"
                      : "px-2 py-0.5 text-[11px]"
                  }`}
                >
                  {scheduledTimeLabel}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </button>

      {isFixed && !compact && !dense ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Sparkles className="h-3 w-3" />
          راتب
        </span>
      ) : null}
      <div
        className={`flex shrink-0 items-center ${dense ? "gap-0" : "gap-0.5"}`}
      >
        <button
          type="button"
          onClick={() => onEditTask?.(task)}
          disabled={pending}
          className={`grid place-items-center rounded-lg border border-transparent text-zinc-500 transition hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 ${
            dense ? "h-9 w-9 sm:h-6 sm:w-6" : "h-10 w-10 sm:h-8 sm:w-8"
          }`}
          aria-label={`تعديل ${task.task_name}`}
        >
          <Pencil className={dense ? "h-3.5 w-3.5 sm:h-3 sm:w-3" : "h-4 w-4 sm:h-3.5 sm:w-3.5"} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteTask(task)}
          disabled={pending}
          className={`grid place-items-center rounded-lg border border-transparent text-red-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:border-red-900/50 dark:hover:bg-red-950/40 dark:hover:text-red-400 ${
            dense ? "h-9 w-9 sm:h-6 sm:w-6" : "h-10 w-10 sm:h-8 sm:w-8"
          }`}
          aria-label={`حذف ${task.task_name}`}
        >
          <Trash className={dense ? "h-3.5 w-3.5 sm:h-3 sm:w-3" : "h-4 w-4 sm:h-3.5 sm:w-3.5"} />
        </button>
      </div>
    </motion.div>
  );
}
