"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { addCampTask } from "./actions";

const EMPTY_FORM = { title: "", description: "" };

const inputClassName =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const textareaClassName =
  "min-h-[96px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium leading-7 text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function AddCampTaskModal({ open, campId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("عنوان الثغر مطلوب.");
      return;
    }

    startSave(async () => {
      const result = await addCampTask(campId, form.title, form.description);

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.task) {
        onSaved(result.task);
        onClose();
      }
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="إضافة ثغر للمعسكر"
            dir="rtl"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  خريطة المعسكر
                </p>
                <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-zinc-50">
                  ＋ إضافة ثغر للمعسكر
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="camp-task-title"
                  className="text-sm font-bold text-zinc-800 dark:text-zinc-200"
                >
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  id="camp-task-title"
                  type="text"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  disabled={isSaving}
                  placeholder="مثال: إنهاء الفصل الثالث"
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="camp-task-description"
                  className="text-sm font-bold text-zinc-800 dark:text-zinc-200"
                >
                  الوصف
                </label>
                <textarea
                  id="camp-task-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  disabled={isSaving}
                  placeholder="تفاصيل الثغر أو معايير الإنجاز..."
                  className={textareaClassName}
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600 disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isSaving ? "جارٍ الحفظ..." : "إضافة الثغر"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
