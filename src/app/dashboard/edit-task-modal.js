"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  TaskModalShell,
  taskModalCancelButtonClassName,
  taskModalFooterClassName,
  taskModalInputClassName,
  taskModalLabelClassName,
  taskModalSubmitButtonClassName,
} from "@/components/dashboard/task-modal-shell";
import { updateTask } from "./actions";
import { FixedHabitToggle } from "./fixed-habit-toggle";
import { isFixedHabitTask } from "./fixed-habits-settings";
import { getLocalTodayDate } from "./prayer-time";
import { formatTaskScheduledTime } from "./upcoming-tasks-section";

const PRAYER_OPTIONS = [
  { value: "fajr", label: "بعد الفجر" },
  { value: "dhuhr", label: "بين الظهر والعصر" },
  { value: "asr", label: "بعد العصر" },
  { value: "maghrib", label: "بين المغرب والعشاء" },
  { value: "isha", label: "بعد العشاء" },
];

function formatTimeForInput(value) {
  return formatTaskScheduledTime(value);
}

function buildFormFromTask(task, fixedHabits = []) {
  if (!task) {
    return {
      task_name: "",
      prayer_anchor: "fajr",
      task_date: getLocalTodayDate(),
      scheduled_time: "",
      is_fixed_habit: false,
    };
  }

  return {
    task_name: task.task_name || "",
    prayer_anchor: task.prayer_anchor || "fajr",
    task_date: task.task_date || getLocalTodayDate(),
    scheduled_time: formatTimeForInput(task.scheduled_time),
    is_fixed_habit: isFixedHabitTask(task, fixedHabits),
  };
}

export function EditTaskModal({
  open,
  task,
  fixedHabits = [],
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => buildFormFromTask(task, fixedHabits));
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();
  const todayDate = getLocalTodayDate();

  useEffect(() => {
    if (open) {
      setForm(buildFormFromTask(task, fixedHabits));
      setError("");
    }
  }, [open, task, fixedHabits]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!task?.id) return;

    if (!form.task_name.trim()) {
      setError("اكتب اسم المهمة أولاً.");
      return;
    }

    startSave(async () => {
      const result = await updateTask(
        task.id,
        form.task_name,
        form.prayer_anchor,
        form.task_date,
        form.scheduled_time || null,
        form.is_fixed_habit,
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
      open={open && Boolean(task)}
      onClose={onClose}
      ariaLabel="تعديل المهمة"
      eyebrow="تعديل المهمة"
      title="عدّل تفاصيل مهمتك"
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
            form="edit-task-form"
            disabled={isSaving}
            className={`${taskModalSubmitButtonClassName} dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ الحفظ
              </>
            ) : (
              "حفظ التعديلات"
            )}
          </button>
        </div>
      }
    >
      <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className={taskModalLabelClassName}>اسم المهمة</label>
          <input
            type="text"
            value={form.task_name}
            onChange={(event) => updateField("task_name", event.target.value)}
            disabled={isSaving}
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
          id="edit-task-fixed-habit"
          checked={form.is_fixed_habit}
          onChange={(value) => updateField("is_fixed_habit", value)}
          disabled={isSaving}
        />

        {error ? (
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </form>
    </TaskModalShell>
  );
}
