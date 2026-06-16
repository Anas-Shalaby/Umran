"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Settings2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  getFixedHabits,
  getTasksForToday,
  removeFixedHabit,
  saveFixedHabit,
} from "./actions";

export const SPIRITUAL_HABIT_PRESETS = [
  {
    name: "صلاة الجماعة في المسجد",
    defaultAnchor: "fajr",
  },
  {
    name: "الورد القرآني اليومي",
    defaultAnchor: "fajr",
  },
  {
    name: "أذكار الصباح والمساء",
    defaultAnchor: "fajr",
  },
  {
    name: "صلاة الضحى / قيام الليل",
    defaultAnchor: "isha",
  },
];

const anchorOptions = [
  { value: "fajr", label: "بعد الفجر" },
  { value: "dhuhr", label: "الظهر" },
  { value: "asr", label: "بعد العصر" },
  { value: "maghrib", label: "المغرب" },
  { value: "isha", label: "بعد العشاء" },
];

function buildDraftFromHabits(fixedHabits) {
  return SPIRITUAL_HABIT_PRESETS.reduce((draft, preset) => {
    const saved = fixedHabits.find((habit) => habit.habit_name === preset.name);

    draft[preset.name] = {
      enabled: Boolean(saved),
      prayer_anchor: saved?.prayer_anchor || preset.defaultAnchor,
    };

    return draft;
  }, {});
}

export function FixedHabitsSettings({ fixedHabits, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => buildDraftFromHabits(fixedHabits));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setDraft(buildDraftFromHabits(fixedHabits));
    }
  }, [fixedHabits, open]);

  function updateDraft(habitName, patch) {
    setDraft((current) => ({
      ...current,
      [habitName]: {
        ...current[habitName],
        ...patch,
      },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      for (const preset of SPIRITUAL_HABIT_PRESETS) {
        const config = draft[preset.name];

        if (config.enabled) {
          const result = await saveFixedHabit(
            preset.name,
            config.prayer_anchor,
          );

          if (result?.error) {
            toast.error(result.error, {
              style: {
                fontFamily: "Umran",
              },
              position: "top-right",
            });
            return;
          }
        } else {
          const existing = fixedHabits.find(
            (habit) => habit.habit_name === preset.name,
          );

          if (existing) {
            const result = await removeFixedHabit(preset.name);

            if (result?.error) {
              toast.error(result.error, {
                style: {
                  fontFamily: "Umran",
                },
                position: "top-right",
              });
              return;
            }
          }
        }
      }

      const [tasksResult, habitsResult] = await Promise.all([
        getTasksForToday(),
        getFixedHabits(),
      ]);

      if (tasksResult.error || habitsResult.error) {
        toast.error(tasksResult.error || habitsResult.error);
        return;
      }

      onSaved({
        tasks: tasksResult.tasks,
        fixedHabits: habitsResult.habits,
      });

      toast.success("تم حفظ الأوراد والسنن الراتبة.", {
        description: "ستظهر تلقائياً في جدول يومك كل صباح.",
        style: {
          fontFamily: "Umran",
        },
        position: "top-right",
      });
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950 dark:focus-visible:ring-offset-zinc-950"
      >
        <Settings2 className="h-4 w-4" />
        تهيئة الأوراد والسنن الراتبة
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[min(560px,85dvh)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              dir="rtl"
            >
              <div className="shrink-0 border-b border-zinc-100 px-6 pb-5 pt-6 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-zinc-950 dark:text-zinc-50">
                      تهيئة الأوراد والسنن الراتبة
                    </h2>
                    <p className="mt-2 text-xs font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                      اختر عاداتك الثابتة ووقت ظهورها. ستُضاف تلقائياً كل يوم
                      ولا تُحسب ضمن مهامك الدنيوية الثلاث.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !isPending && setOpen(false)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    aria-label="إغلاق"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 py-4">
                {SPIRITUAL_HABIT_PRESETS.map((preset) => {
                  const config = draft[preset.name];

                  return (
                    <div
                      key={preset.name}
                      className={`rounded-2xl border p-4 transition ${
                        config.enabled
                          ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/40"
                          : "border-zinc-100 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {preset.name}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-zinc-500">
                            عادة روحية ثابتة
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(preset.name, {
                              enabled: !config.enabled,
                            })
                          }
                          className={`relative h-6 w-11 rounded-full transition ${
                            config.enabled ? "bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-700"
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

                      <AnimatePresence initial={false}>
                        {config.enabled ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="mt-4 block text-[11px] font-bold text-zinc-500">
                              وقت الظهور في الجدول
                            </label>
                            <select
                              value={config.prayer_anchor}
                              onChange={(event) =>
                                updateDraft(preset.name, {
                                  prayer_anchor: event.target.value,
                                })
                              }
                              className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                            >
                              {anchorOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
                <p className="text-[11px] text-zinc-400 block mt-1 font-medium leading-relaxed">
                  ممارسة سلوكية: ربط الأوراد بالمرتكزات الثابتة في يومك
                  (كالصلوات الخمس) يسمى علمياً بـ Habit Stacking، وهو أقوى تكنيك
                  لبناء العادات المستدامة دون  استهلاك طاقة الإرادة.
                </p>
              </div>

              <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جارٍ الحفظ
                      </>
                    ) : (
                      "حفظ الإعدادات"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function isFixedHabitTask(task, fixedHabits) {
  return fixedHabits.some(
    (habit) =>
      habit.habit_name === task.task_name &&
      habit.prayer_anchor === task.prayer_anchor,
  );
}
