"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Compass } from "lucide-react";

export function UltimatePurposeBanner({ purpose }) {
  const [expanded, setExpanded] = useState(false);

  if (!purpose?.trim()) return null;

  const isLong = purpose.trim().length > 72;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-zinc-200/80 bg-surface-muted px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:px-4 sm:py-3.5"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-100 bg-white text-emerald-600 dark:border-emerald-900/60 dark:bg-zinc-900 dark:text-emerald-400">
          <Compass className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-emerald-600 sm:text-[11px] dark:text-emerald-400">
            غايتك الكبرى
          </p>
          <p
            className={`mt-1 break-words text-xs font-medium leading-6 text-zinc-700 sm:text-[13px] sm:leading-7 dark:text-zinc-300 ${
              !expanded && isLong ? "line-clamp-2 sm:line-clamp-1" : ""
            }`}
          >
            {purpose}
          </p>
          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {expanded ? "عرض أقل" : "عرض المزيد"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
