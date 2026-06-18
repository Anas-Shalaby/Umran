"use client";

function FixedHabitToggle({ checked, onChange, disabled = false, id }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition sm:py-2.5 ${
        checked
          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        id={id}
        name="is_fixed_habit"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
          جعلها راتبة
        </span>
        <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          تتكرر يومياً تلقائياً ولا تُحسب ضمن ثغورك الثلاثة الدنيوية.
        </span>
      </span>
    </label>
  );
}

export { FixedHabitToggle };
