"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { UltimatePurposeBanner } from "@/components/dashboard/ultimate-purpose-banner";
import { LoadingLink } from "@/components/loading-link";
import { TodayTasksBoard } from "./today-tasks-board";

const fadeTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export function DashboardShell({
  todayLabel,
  userDisplayName,
  ultimatePurpose,
  initialTasks,
  initialFixedHabits,
  initialUpcomingTasks = [],
  tasksError,
}) {
  const [isFocusActive, setIsFocusActive] = useState(false);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("umran:hyper-focus-change", {
        detail: { active: isFocusActive },
      }),
    );
  }, [isFocusActive]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-surface-canvas text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[100vw] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:p-6">
        <motion.div
          animate={{ opacity: isFocusActive ? 0 : 1 }}
          transition={fadeTransition}
          className={`w-full shrink-0 lg:w-72 ${isFocusActive ? "pointer-events-none" : ""}`}
        >
          <DashboardSidebar
            activeHref="/dashboard"
            userName={userDisplayName}
          />
        </motion.div>

        <section className="relative min-h-0 w-full min-w-0 flex-1 rounded-2xl border border-zinc-200/80 bg-surface-elevated p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-[2rem] sm:p-5 lg:min-h-[calc(100vh-3rem)] lg:p-8">
          <motion.div
            animate={{ opacity: isFocusActive ? 0 : 1 }}
            transition={fadeTransition}
            className={`mb-3 flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800 ${
              isFocusActive ? "pointer-events-none" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black tracking-tight text-zinc-950 sm:text-2xl dark:text-zinc-50">
                مهام اليوم
              </h1>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{todayLabel}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: isFocusActive ? 0 : 1 }}
            transition={fadeTransition}
            className={`flex min-h-0 flex-1 flex-col space-y-3 sm:space-y-4 ${isFocusActive ? "pointer-events-none" : ""}`}
          >
            {tasksError ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                {tasksError}
              </p>
            ) : (
              <TodayTasksBoard
                initialTasks={initialTasks}
                initialFixedHabits={initialFixedHabits}
                initialUpcomingTasks={initialUpcomingTasks}
                isFocusActive={isFocusActive}
                onFocusActiveChange={setIsFocusActive}
              />
            )}

            <UltimatePurposeBanner purpose={ultimatePurpose} />
          </motion.div>
        </section>
      </div>
    </main>
  );
}
