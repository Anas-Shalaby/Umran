"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import {
  TaskModalShell,
  taskModalCancelButtonClassName,
  taskModalFooterClassName,
  taskModalInputClassName,
  taskModalLabelClassName,
  taskModalSubmitButtonClassName,
} from "@/components/dashboard/task-modal-shell";
import { addTask } from "./actions";
import { FixedHabitToggle } from "./fixed-habit-toggle";
import { getLocalTodayDate } from "./prayer-time";
import { TaskRecurrencePicker } from "@/components/dashboard/task-recurrence-picker";
import { RECURRENCE_TYPES } from "@/lib/tasks/recurrence";

const PRAYER_OPTIONS = [
  { value: "fajr", label: "بعد الفجر" },
  { value: "dhuhr", label: "بين الظهر والعصر" },
  { value: "asr", label: "بعد العصر" },
  { value: "maghrib", label: "بين المغرب والعشاء" },
  { value: "isha", label: "بعد العشاء" },
];

const emptyForm = (prayerAnchor) => ({
  task_name: "",
  prayer_anchor: prayerAnchor,
  task_date: getLocalTodayDate(),
  scheduled_time: "",
  is_fixed_habit: false,
  recurrence_type: RECURRENCE_TYPES.NONE,
  recurrence_weekdays: [],
});

export function FloatingAddTaskButton({ onClick, hidden = false }) {
  if (hidden) return null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-label="إضافة مهمة"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-[max(1rem,env(safe-area-inset-right))] z-50 grid h-14 w-14 touch-manipulation place-items-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/30 transition hover:bg-zinc-800 sm:bottom-6 sm:right-6 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/25 dark:hover:bg-emerald-400"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </motion.button>
  );
}

export function AddTaskModal({
  open,
  onClose,
  defaultPrayerAnchor = "fajr",
  customTasksCount = 0,
  onSaved,
  fixedHabitToggleId = "fab-add-task-fixed-habit",
}) {
  const [form, setForm] = useState(() => emptyForm(defaultPrayerAnchor));
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();
  const todayDate = getLocalTodayDate();
  const isAtTodayLimit =
    form.task_date === todayDate &&
    customTasksCount >= 3 &&
    !form.is_fixed_habit;

  useEffect(() => {
    if (open) {
      setForm(emptyForm(defaultPrayerAnchor));
      setError("");
    }
  }, [open, defaultPrayerAnchor]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.task_name.trim()) {
      setError("اكتب اسم المهمة أولاً.");
      return;
    }

    if (isAtTodayLimit) {
      setError(
        "وصلت إلى ثلاث مهام دنيوية لليوم. فعّل «جعلها راتبة» أو ركّز على ثغورك الحالية.",
      );
      return;
    }

    startSave(async () => {
      const result = await addTask(
        form.task_name,
        form.prayer_anchor,
        form.task_date,
        form.scheduled_time || null,
        form.is_fixed_habit,
        form.recurrence_type,
        form.recurrence_weekdays,
      );

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.task) {
        onSaved?.(result);
        onClose?.();
      }
    });
  }

  return (
    <TaskModalShell
      open={open}
      onClose={onClose}
      ariaLabel="إضافة مهمة"
      eyebrow="مهمة جديدة"
      title="أضف مهمة ليومك"
      footer={
        <div className={taskModalFooterClassName}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={taskModalCancelButtonClassName}
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="add-task-form"
            disabled={isSaving || isAtTodayLimit}
            className={taskModalSubmitButtonClassName}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ الإضافة
              </>
            ) : (
              "إضافة المهمة"
            )}
          </button>
        </div>
      }
    >
      <form id="add-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className={taskModalLabelClassName}>اسم المهمة</label>
          <input
            type="text"
            value={form.task_name}
            onChange={(event) => updateField("task_name", event.target.value)}
            disabled={isSaving}
            autoFocus
            placeholder="ماذا ستنجز؟"
            className={taskModalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label className={taskModalLabelClassName}>مرتكز الصلاة</label>
          <select
            value={form.prayer_anchor}
            onChange={(event) =>
              updateField("prayer_anchor", event.target.value)
            }
            disabled={isSaving}
            className={taskModalInputClassName}
          >
            {PRAYER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={taskModalLabelClassName}>اليوم</label>
            <input
              type="date"
              value={form.task_date}
              min={todayDate}
              onChange={(event) => updateField("task_date", event.target.value)}
              disabled={isSaving}
              className={taskModalInputClassName}
            />
          </div>
          <div className="space-y-1.5">
            <label className={taskModalLabelClassName}>
              وقت تذكيري (اختياري)
            </label>
            <input
              type="time"
              value={form.scheduled_time}
              onChange={(event) =>
                updateField("scheduled_time", event.target.value)
              }
              disabled={isSaving}
              className={taskModalInputClassName}
            />
          </div>
        </div>

        <FixedHabitToggle
          id={fixedHabitToggleId}
          checked={form.is_fixed_habit}
          onChange={(value) => updateField("is_fixed_habit", value)}
          disabled={isSaving}
        />

        <TaskRecurrencePicker
          recurrenceType={form.recurrence_type}
          recurrenceWeekdays={form.recurrence_weekdays}
          onTypeChange={(value) => updateField("recurrence_type", value)}
          onWeekdaysChange={(value) => updateField("recurrence_weekdays", value)}
          disabled={isSaving}
        />

        {isAtTodayLimit ? (
          <p className="text-xs font-medium leading-relaxed text-amber-600 dark:text-amber-400">
            وصلت لحد الثغرات الثلاث اليوم. يمكنك إضافة مهمة راتبة فقط أو جدولة
            ليوم آخر.
          </p>
        ) : null}

        {error ? (
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </form>
    </TaskModalShell>
  );
}
