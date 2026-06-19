"use client";

import { RECURRENCE_TYPES, WEEKDAY_OPTIONS } from "@/lib/tasks/recurrence";
import { taskModalLabelClassName } from "@/components/dashboard/task-modal-shell";

const RECURRENCE_OPTIONS = [
  { value: RECURRENCE_TYPES.NONE, label: "لا يتكرر" },
  { value: RECURRENCE_TYPES.DAILY, label: "يومياً" },
  { value: RECURRENCE_TYPES.WEEKLY, label: "أسبوعياً" },
];

export function TaskRecurrencePicker({
  recurrenceType = RECURRENCE_TYPES.NONE,
  recurrenceWeekdays = [],
  onTypeChange,
  onWeekdaysChange,
  disabled = false,
}) {
  function toggleWeekday(day) {
    const current = recurrenceWeekdays || [];
    const next = current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day].sort((a, b) => a - b);
    onWeekdaysChange?.(next);
  }

  return (
    <div className="space-y-3">
      <p className={taskModalLabelClassName}>التكرار</p>
      <div className="flex flex-wrap gap-2">
        {RECURRENCE_OPTIONS.map((option) => {
          const isSelected = recurrenceType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onTypeChange?.(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {recurrenceType === RECURRENCE_TYPES.WEEKLY ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            أيام الأسبوع
          </p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_OPTIONS.map((day) => {
              const isSelected = (recurrenceWeekdays || []).includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleWeekday(day.value)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
