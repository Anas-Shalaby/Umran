"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sunrise,
  Sun,
  Sunset,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { addTask, toggleTask, deleteTask } from "./actions";
import { FixedHabitsSettings, isFixedHabitTask } from "./fixed-habits-settings";
import { HyperFocusBanner } from "./hyper-focus-banner";
import { getCurrentPrayerAnchor } from "./prayer-time";

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

export function TodayTasksBoard({
  initialTasks,
  initialFixedHabits,
  isFocusActive = false,
  onFocusActiveChange,
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [fixedHabits, setFixedHabits] = useState(initialFixedHabits);
  const [activeTab, setActiveTab] = useState(() => getCurrentPrayerAnchor());
  const [pendingTaskId, setPendingTaskId] = useState("");
  const [showSpiritualBanner, setShowSpiritualBanner] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => task.prayer_anchor === activeTab);
  }, [tasks, activeTab]);

  const customTasksCount = useMemo(() => {
    return tasks.filter((task) => !isFixedHabitTask(task, fixedHabits)).length;
  }, [tasks, fixedHabits]);

  const currentBlock = prayerBlocks.find((block) => block.key === activeTab);
  const Icon = currentBlock?.icon;

  useEffect(() => {
    const isDismissed =
      localStorage.getItem(SPIRITUAL_BANNER_STORAGE_KEY) === "true";
    setShowSpiritualBanner(!isDismissed);
  }, []);

  function handleBoardRefresh({ tasks: nextTasks, fixedHabits: nextHabits }) {
    setTasks(nextTasks);
    setFixedHabits(nextHabits);
  }

  function handleAddTask(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const taskName = String(formData.get("task_name") || "").trim();

    if (!taskName) {
      toast.error("اكتب اسم المهمة أولاً.", {
        style: {
          fontFamily: "Umran",
        },
        position: "top-right",
      });
      return;
    }

    if (customTasksCount >= 3) {
      toast.warning("اكتفي بثلاث مهام دنيوية اليوم", {
        style: {
          fontFamily: "Umran",
        },
        position: "top-right",
        id: "rule-of-three-limit",
        description:
          "ركز على ثغورك الثلاثة الأساسية لليوم لضمان أعلى مستويات التركيز. حقيقة علمية: حصر يومك في ٣ مهام كبرى يقضي على الشلل الهروبي لعقلك المشتت ويرفع جودة التنفيذ بنسبة ٨٥٪.",
      });
      return;
    }

    startTransition(async () => {
      const result = await addTask(taskName, activeTab);

      if (result?.error) {
        toast.error(result.error);
      }

      if (result?.task) {
        setTasks((currentTasks) => [...currentTasks, result.task]);
        event.target.reset();
        toast.success("تمت إضافة المهمة.", {
          position: "top-right",
          style: {
            fontFamily: "Umran",
          },
        });
      }
    });
  }

  function handleToggleTask(task) {
    setPendingTaskId(task.id);

    const previousTasks = tasks;
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? { ...currentTask, is_completed: !task.is_completed }
          : currentTask,
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

  function handleDeleteTask(task) {
    const previousTasks = tasks;
    setTasks((currentTasks) =>
      currentTasks.filter((currentTask) => currentTask.id !== task.id),
    );

    startTransition(async () => {
      const result = await deleteTask(task.id);

      if (result?.error) {
        toast.error(result.error);
        setTasks(previousTasks);
        return;
      }

      toast.success("تم حذف المهمة.", {
        position: "top-right",
        style: {
          fontFamily: "Umran",
        },
      });
    });
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

  return (
    <div className="relative mx-auto w-full min-w-0 space-y-4 sm:space-y-6" dir="rtl">
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
              className="relative me-1 mt-1"
            >
              <button
                type="button"
                onClick={handleDismissSpiritualBanner}
                className="absolute -end-2 -top-2 z-20 grid h-6 w-6 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="إغلاق قسم الزاد الروحي"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      الزاد الروحي
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

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
        className={`space-y-6 ${isFocusActive ? "pointer-events-none" : ""}`}
      >
        <div className="-mx-0.5 flex gap-1 overflow-x-auto rounded-xl border border-zinc-100 bg-white p-1 [scrollbar-width:none] dark:border-zinc-800 dark:bg-zinc-900 sm:mx-0 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {prayerBlocks.map((block) => {
            const isSelected = activeTab === block.key;
            const BlockIcon = block.icon;

            return (
              <button
                key={block.key}
                type="button"
                onClick={() => setActiveTab(block.key)}
                className={`relative min-w-[4.25rem] shrink-0 rounded-lg px-2 py-2 text-center transition-all sm:min-w-0 sm:flex-1 sm:px-1 ${
                  isSelected
                    ? "text-zinc-950 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {isSelected ? (
                  <motion.div
                    layoutId="activePrayerTab"
                    className="absolute inset-0 rounded-lg border border-zinc-200/40 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <BlockIcon className="h-3.5 w-3.5 sm:hidden" />
                  <span className="text-[11px] font-bold leading-none sm:text-xs">
                    <span className="sm:hidden">{block.shortTitle}</span>
                    <span className="hidden sm:inline">
                      {block.title.split(" ")[1] || block.title}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-h-[320px] overflow-hidden sm:min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.article
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:min-h-[380px] sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-zinc-50 pb-3 sm:mb-6 sm:gap-4 sm:pb-4 dark:border-zinc-800">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-zinc-900 sm:text-xl dark:text-zinc-50">
                      {currentBlock?.title}
                    </h2>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-zinc-400 sm:mt-1.5">
                      {currentBlock?.description}
                    </p>
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-100/50 bg-zinc-50 text-zinc-700 sm:h-10 sm:w-10 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                    {Icon ? <Icon className="h-5 w-5" /> : null}
                  </div>
                </div>

                <div className="custom-scrollbar max-h-[min(220px,40vh)] space-y-2 overflow-y-auto pe-0.5 sm:max-h-[220px]">
                  {activeTasks.length ? (
                    activeTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isFixed={isFixedHabitTask(task, fixedHabits)}
                        pending={pendingTaskId === task.id}
                        onToggleTask={handleToggleTask}
                        onDeleteTask={handleDeleteTask}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-100 bg-zinc-50/30 py-8 text-center text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/30">
                      لا توجد مهام مجدولة لهذا الوقت.
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleAddTask}
                className="mt-4 flex flex-col gap-2 border-t border-zinc-50 pt-3 sm:mt-6 sm:pt-4 dark:border-zinc-800"
              >
                {customTasksCount >= 3 ? (
                  <div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      وصلت إلى ثغورك الثلاثة الدنيوية لليوم. لن تتم إضافة مهام
                      جديدة للحفاظ على التركيز.
                    </p>
                    <p className="mt-1 block text-[11px] font-medium leading-relaxed text-zinc-400">
                      حقيقة علمية: حصر يومك في ٣ مهام كبرى يقضي على الشلل
                      الهروبي لعقلك المشتت ويرفع جودة التنفيذ بنسبة ٨٥٪.
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <input
                    name="task_name"
                    type="text"
                    disabled={isPending || customTasksCount >= 3}
                    placeholder={`أضف مهمة لوقت ${currentBlock?.shortTitle}...`}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:opacity-50 sm:h-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50"
                  />
                  <button
                    type="submit"
                    disabled={isPending || customTasksCount >= 3}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 sm:h-9 sm:w-9"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            </motion.article>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function TaskItem({ task, isFixed, pending, onToggleTask, onDeleteTask }) {
  const goalTitle = task?.goals?.title || "";
  const campTitle = task?.camp_source?.camps?.title || "";

  return (
    <motion.div
      layout
      className={`group flex w-full items-start gap-2 rounded-xl border p-2.5 text-start transition sm:items-center sm:gap-3 sm:p-3 ${
        isFixed
          ? "border-emerald-100 bg-emerald-50/70 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60"
          : "border-zinc-100/60 bg-zinc-50/30 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        disabled={pending}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-start disabled:opacity-60 sm:items-center sm:gap-3"
      >
        <span
          className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition ${
            task.is_completed
              ? isFixed
                ? "border-emerald-700 bg-emerald-700 text-emerald-50"
                : "border-zinc-900 bg-zinc-900 text-zinc-50"
              : isFixed
                ? "border-emerald-300 bg-white text-transparent group-hover:border-emerald-700 dark:border-emerald-700 dark:bg-zinc-900"
                : "border-zinc-300 bg-white text-transparent group-hover:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:group-hover:border-zinc-400"
          }`}
        >
          {pending ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-zinc-500" />
          ) : (
            <Check className="h-2.5 w-2.5" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          {isFixed ? (
            <Star className="hidden h-3.5 w-3.5 shrink-0 fill-emerald-500 text-emerald-500 sm:block" />
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="flex items-start gap-1.5 sm:items-center">
              {isFixed ? (
                <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-emerald-500 text-emerald-500 sm:hidden" />
              ) : null}
              <span
                className={`block text-xs font-semibold leading-5 transition sm:truncate ${
                task.is_completed
                  ? "text-zinc-400 line-through"
                  : isFixed
                    ? "text-emerald-900 dark:text-emerald-300"
                    : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {task.task_name}
            </span>
            </span>
            <div className="flex flex-wrap gap-1">
            {goalTitle ? (
              <span className="inline-flex max-w-full items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300">
                الهدف: {goalTitle}
              </span>
            ) : null}
            {campTitle ? (
              <span className="inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                معسكر: {campTitle}
              </span>
            ) : null}
            </div>
          </span>
        </span>
      </button>

      {isFixed ? (
        <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:self-center dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" />
          راتب
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onDeleteTask(task)}
          disabled={pending}
          className="grid h-7 w-7 shrink-0 self-start place-items-center rounded-full text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50 sm:self-center dark:hover:bg-red-950/50 dark:hover:text-red-400"
          aria-label={`حذف ${task.task_name}`}
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
