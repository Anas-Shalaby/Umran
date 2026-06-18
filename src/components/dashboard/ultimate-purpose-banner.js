"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function UltimatePurposeBanner({ purpose }) {
  const [expanded, setExpanded] = useState(false);

  if (!purpose?.trim()) return null;

  const isLong = purpose.trim().length > 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-white px-3.5 py-3.5 text-center sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-transparent sm:dark:bg-transparent"
    >
      <p className="text-[10px] font-bold tracking-wide text-emerald-600 sm:text-[11px] dark:text-emerald-400">
        غايتك الكبرى
      </p>
      <p
        className={`mt-1.5 break-words text-xs font-medium leading-7 text-zinc-700 sm:text-sm sm:leading-8 dark:text-zinc-300 ${
          !expanded && isLong ? "line-clamp-3" : ""
        }`}
      >
        {purpose}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </motion.div>
  );
}
