"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "./actions";

const DEFAULT_PURPOSE = "إرضاء الله عز وجل";

const HABIT_PRESETS = [
  { name: "صلاة الجماعة في المسجد", defaultAnchor: "fajr" },
  { name: "الورد القرآني اليومي", defaultAnchor: "fajr" },
  { name: "أذكار الصباح والمساء", defaultAnchor: "fajr" },
];

const anchorOptions = [
  { value: "fajr", label: "بعد الفجر" },
  { value: "dhuhr", label: "بين الظهر والعصر" },
  { value: "asr", label: "بعد العصر" },
  { value: "maghrib", label: "بين المغرب والعشاء" },
  { value: "isha", label: "بعد العشاء" },
];

const defaultTaskAnchors = ["fajr", "dhuhr", "maghrib"];

function buildInitialHabits() {
  return HABIT_PRESETS.reduce((draft, preset) => {
    draft[preset.name] = {
      enabled: false,
      prayer_anchor: preset.defaultAnchor,
    };
    return draft;
  }, {});
}

function getAnchorLabel(value) {
  return anchorOptions.find((option) => option.value === value)?.label || value;
}

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [ultimatePurpose, setUltimatePurpose] = useState(DEFAULT_PURPOSE);
  const [habits, setHabits] = useState(buildInitialHabits);
  const [tasks, setTasks] = useState(["", "", ""]);
  const [isPending, startTransition] = useTransition();

  const enabledHabits = useMemo(() => {
    return HABIT_PRESETS.filter((preset) => habits[preset.name]?.enabled).map(
      (preset) => ({
        habit_name: preset.name,
        prayer_anchor: habits[preset.name].prayer_anchor,
      }),
    );
  }, [habits]);

  const filledTasks = useMemo(() => {
    return tasks
      .map((taskName, index) => ({
        task_name: taskName.trim(),
        prayer_anchor: defaultTaskAnchors[index],
      }))
      .filter((task) => task.task_name);
  }, [tasks]);

  function updateHabit(name, patch) {
    setHabits((current) => ({
      ...current,
      [name]: { ...current[name], ...patch },
    }));
  }

  function updateTask(index, value) {
    setTasks((current) =>
      current.map((task, taskIndex) => (taskIndex === index ? value : task)),
    );
  }

  function handleNextFromStep1() {
    if (!ultimatePurpose.trim()) {
      toast.error("اكتب غايتك الكبرى قبل المتابعة.");
      return;
    }

    setStep(2);
  }

  function handleNextFromStep3() {
    if (tasks.some((task) => !task.trim())) {
      toast.error("اكتب ثغورك الثلاثة كاملة قبل المتابعة.");
      return;
    }

    setStep(4);
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeOnboarding(
        ultimatePurpose,
        enabledHabits,
        filledTasks,
      );

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`h-1.5 rounded-full transition-all ${
              item === step
                ? "w-10 bg-zinc-900 dark:bg-zinc-50"
                : item < step
                  ? "w-6 bg-zinc-400 dark:bg-zinc-600"
                  : "w-6 bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center sm:text-start">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  الخطوة ١ من ٤
                </p>
                <h1 className="mt-2 text-2xl font-black leading-10 text-zinc-950 dark:text-zinc-50">
                  قبل أن نهندس يومك.. ما هي غايتك الكبرى من هذا السعي؟
                </h1>
                <p className="mt-2 text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
                  اكتب غايتك مرة واحدة، وستبقى أمامك كتذكير هادئ في كل يوم.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="ultimate-purpose"
                  className="text-sm font-bold text-zinc-800 dark:text-zinc-200"
                >
                  غايتك الكبرى
                </label>
                <input
                  id="ultimate-purpose"
                  type="text"
                  value={ultimatePurpose}
                  onChange={(event) => setUltimatePurpose(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>

              <div className="flex justify-end border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  الخطوة ٢ من ٤
                </p>
                <h1 className="mt-2 text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  الأوراد الثابتة
                </h1>
                <p className="mt-2 text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
                  اختر عاداتك الروحية اليومية وحدّد وقت ظهورها في جدولك.
                </p>
              </div>

              <div className="space-y-3">
                {HABIT_PRESETS.map((preset) => {
                  const config = habits[preset.name];

                  return (
                    <div
                      key={preset.name}
                      className={`rounded-xl border p-4 transition ${
                        config.enabled
                          ? "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/40"
                          : "border-zinc-100 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {preset.name}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            updateHabit(preset.name, {
                              enabled: !config.enabled,
                            })
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            config.enabled
                              ? "bg-zinc-900 dark:bg-zinc-50"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                          aria-label={`تفعيل ${preset.name}`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                              config.enabled ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {config.enabled ? (
                        <div className="mt-4">
                          <label className="mb-2 block text-[11px] font-bold text-zinc-500">
                            وقت الظهور
                          </label>
                          <select
                            value={config.prayer_anchor}
                            onChange={(event) =>
                              updateHabit(preset.name, {
                                prayer_anchor: event.target.value,
                              })
                            }
                            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                          >
                            {anchorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div
              key="step-3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  الخطوة ٣ من ٤
                </p>
                <h1 className="mt-2 text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  ثغورك الثلاثة
                </h1>
                <p className="mt-2 text-sm font-semibold leading-8 text-zinc-700 dark:text-zinc-300">
                  العقل المشتت يفشل بكثرة الخيارات. اكتب ٣ ثغور (مهام كبرى) فقط
                  تلتزم بدكّها اليوم.
                </p>
              </div>

              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">
                      الثغرة {index + 1}
                    </label>
                    <input
                      type="text"
                      value={task}
                      onChange={(event) => updateTask(index, event.target.value)}
                      placeholder={`مهمتك الكبرى رقم ${index + 1}...`}
                      className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                    />
                  </div>
                ))}
              </div>

              <p className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs font-medium leading-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                (علمياً: حصر يومك في ٣ مهام كبرى يقضي على الشلل الهروبي ويرفع نسبة
                إنجازك إلى ٩٠٪)
              </p>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === 4 ? (
            <motion.div
              key="step-4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  الخطوة ٤ من ٤
                </p>
                <h1 className="mt-2 text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  الانطلاق
                </h1>
                <p className="mt-2 text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
                  راجع اختياراتك.. ثم ابدأ يومك بوعي.
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div>
                  <p className="mb-2 text-[11px] font-bold text-zinc-500">
                    غايتك الكبرى
                  </p>
                  <p className="text-sm font-semibold leading-7 text-zinc-800 dark:text-zinc-200">
                    {ultimatePurpose.trim()}
                  </p>
                </div>

                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-bold text-zinc-900">
                      الأوراد الثابتة
                    </p>
                  </div>
                  {enabledHabits.length ? (
                    <ul className="space-y-2">
                      {enabledHabits.map((habit) => (
                        <li
                          key={habit.habit_name}
                          className="flex items-start gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>
                            {habit.habit_name} —{" "}
                            {getAnchorLabel(habit.prayer_anchor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-medium text-zinc-500">
                      لم تُفعّل أوراداً ثابتة بعد.
                    </p>
                  )}
                </div>

                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-zinc-700" />
                    <p className="text-sm font-bold text-zinc-900">
                      ثغورك الثلاثة
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {filledTasks.map((task, index) => (
                      <li
                        key={`${task.task_name}-${index}`}
                        className="flex items-start gap-2 text-sm font-medium text-zinc-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" />
                        <span>{task.task_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isPending}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-base font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جارٍ تجهيز يومك...
                    </>
                  ) : (
                    "ابدأ عُمران يومك.. بسم الله"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isPending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
