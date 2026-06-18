"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  TaskModalShell,
  taskModalCancelButtonClassName,
  taskModalFooterClassName,
  taskModalInputClassName,
} from "@/components/dashboard/task-modal-shell";
import { saveGoalTask } from "./actions";

const PRAYER_OPTIONS = [
  { value: "fajr", label: "الفجر" },
  { value: "dhuhr", label: "الظهر" },
  { value: "asr", label: "العصر" },
  { value: "maghrib", label: "المغرب" },
  { value: "isha", label: "العشاء" },
];

const PRIORITY_OPTIONS = [
  {
    value: "critical",
    label: "حرِج",
    emoji: "🔴",
    ring: "ring-red-500/30",
    active:
      "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  {
    value: "medium",
    label: "متوسط",
    emoji: "🟡",
    ring: "ring-amber-500/30",
    active:
      "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    value: "normal",
    label: "عادي",
    emoji: "🟢",
    ring: "ring-emerald-500/30",
    active:
      "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
];

const EMPTY_FORM = {
  task_name: "",
  description: "",
  prayer_anchor: "fajr",
  priority_level: "normal",
  expected_minutes: "",
};

const labelClassName = "text-xs font-bold text-zinc-800 sm:text-sm dark:text-zinc-200";

const textareaClassName =
  "min-h-[96px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium leading-7 text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function buildFormFromTask(task) {
  if (!task) return { ...EMPTY_FORM };

  return {
    task_name: task.task_name || "",
    description: task.description || "",
    prayer_anchor: task.prayer_anchor || "fajr",
    priority_level: task.priority_level || "normal",
    expected_minutes:
      task.expected_minutes != null && task.expected_minutes !== ""
        ? String(task.expected_minutes)
        : "",
  };
}

export function TaskModal({ open, goalId, task, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();
  const isEditing = Boolean(task?.id);

  useEffect(() => {
    if (open) {
      setForm(buildFormFromTask(task));
      setError("");
    }
  }, [open, task]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.task_name.trim()) {
      setError("اسم الثغرة مطلوب.");
      return;
    }

    startSave(async () => {
      const result = await saveGoalTask(goalId, form, task?.id || null);

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.task) {
        onSaved(result.task, { isEditing });
        onClose();
      }
    });
  }

  return (
    <TaskModalShell
      open={open}
      onClose={onClose}
      ariaLabel="تفاصيل الثغر"
      eyebrow={isEditing ? "تعديل الثغر" : "ثغر جديد"}
      title="تفاصيل الثغر"
      maxWidth="max-w-2xl"
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
            form="goal-task-form"
            disabled={isSaving}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            حفظ الثغر
          </button>
        </div>
      }
    >
      <form id="goal-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="task-name" className={labelClassName}>
            اسم الثغرة <span className="text-red-500">*</span>
          </label>
          <input
            id="task-name"
            type="text"
            value={form.task_name}
            onChange={(event) => updateField("task_name", event.target.value)}
            disabled={isSaving}
            placeholder="مثال: قراءة ١٥ صفحة"
            className={taskModalInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="task-prayer" className={labelClassName}>
            موعد الصلاة
          </label>
          <select
            id="task-prayer"
            value={form.prayer_anchor}
            onChange={(event) => updateField("prayer_anchor", event.target.value)}
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

        <div className="space-y-2">
          <p className={labelClassName}>الأولوية</p>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITY_OPTIONS.map((option) => {
              const isActive = form.priority_level === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSaving}
                  onClick={() => updateField("priority_level", option.value)}
                  className={`min-h-[72px] rounded-xl border px-1.5 py-2 text-center text-[11px] font-bold transition sm:px-2 sm:py-2.5 sm:text-xs ${
                    isActive
                      ? `${option.active} ring-2 ${option.ring}`
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <span className="block text-base">{option.emoji}</span>
                  <span className="mt-1 block">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="task-duration" className={labelClassName}>
            الوقت المتوقع بالدقائق
          </label>
          <input
            id="task-duration"
            type="number"
            min="1"
            max="480"
            inputMode="numeric"
            value={form.expected_minutes}
            onChange={(event) =>
              updateField("expected_minutes", event.target.value)
            }
            disabled={isSaving}
            placeholder="مثال: 25"
            className={taskModalInputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="task-description" className={labelClassName}>
            الوصف / الملاحظات
          </label>
          <textarea
            id="task-description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            disabled={isSaving}
            placeholder="أضف ملاحظات أو تفاصيل الثغر..."
            className={textareaClassName}
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </form>
    </TaskModalShell>
  );
}

export const TASK_PRIORITY_META = {
  critical: {
    label: "حرِج",
    border: "border-s-red-500",
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.55)]",
  },
  medium: {
    label: "متوسط",
    border: "border-s-amber-500",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]",
  },
  normal: {
    label: "عادي",
    border: "border-s-emerald-500",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]",
  },
};

export const TASK_PRAYER_LABELS = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};
