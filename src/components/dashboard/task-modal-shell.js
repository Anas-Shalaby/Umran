"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export const taskModalInputClassName =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";

export const taskModalLabelClassName =
  "text-xs font-bold text-zinc-600 sm:text-[11px] dark:text-zinc-400";

export const taskModalFooterClassName =
  "flex flex-col-reverse gap-2 sm:flex-row sm:gap-2";

export const taskModalCancelButtonClassName =
  "inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

export const taskModalSubmitButtonClassName =
  "inline-flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400";

export function TaskModalShell({
  open,
  onClose,
  ariaLabel,
  eyebrow,
  title,
  maxWidth = "max-w-lg",
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            dir="rtl"
            className={`flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[1.75rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-h-[90vh] sm:rounded-2xl`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-200 sm:hidden dark:bg-zinc-700"
              aria-hidden
            />

            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800 sm:px-6 sm:pt-4">
              <div className="min-w-0 pe-2">
                {eyebrow ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-1 text-lg font-black leading-8 text-zinc-950 sm:text-xl dark:text-zinc-50">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              {children}
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-zinc-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
