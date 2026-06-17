"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LoadingLink } from "@/components/loading-link";
import { TodayTasksBoard } from "./today-tasks-board";

const fadeTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export function DashboardShell({
  todayLabel,
  userDisplayName,
  ultimatePurpose,
  initialTasks,
  initialFixedHabits,
  tasksError,
}) {
  const [isFocusActive, setIsFocusActive] = useState(false);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/50 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[100vw] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:p-6">
        <motion.div
          animate={{ opacity: isFocusActive ? 0 : 1 }}
          transition={fadeTransition}
          className={`w-full shrink-0 lg:w-72 ${isFocusActive ? "pointer-events-none" : ""}`}
        >
          <DashboardSidebar activeHref="/dashboard" userName={userDisplayName} />
        </motion.div>

        <section className="relative min-h-0 w-full min-w-0 flex-1 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-[2rem] sm:p-6 lg:min-h-[calc(100vh-3rem)] lg:p-10">
          {ultimatePurpose ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 border-b border-zinc-100 pb-3 text-center sm:mb-6 sm:pb-4 dark:border-zinc-800"
            >
              <p className="text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">
                غايتك الكبرى
              </p>
              <p className="mt-1 text-sm font-medium leading-8 text-zinc-600 dark:text-zinc-300">
                {ultimatePurpose}
              </p>
            </motion.div>
          ) : null}

          <motion.div
            animate={{ opacity: isFocusActive ? 0 : 1 }}
            transition={fadeTransition}
            className={`flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:gap-6 sm:pb-8 dark:border-zinc-800 md:flex-row md:items-start md:justify-between ${
              isFocusActive ? "pointer-events-none" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="truncate">{todayLabel}</span>
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl dark:text-zinc-50">
                مرحباً بك، بارك الله في يومك
              </h1>
              <p className="mt-2 max-w-2xl text-xs font-medium leading-6 text-zinc-500 sm:mt-3 sm:text-sm sm:leading-7 dark:text-zinc-400">
                قسّم مهامك حول أوقات الصلاة، واجعل اليوم واضحاً بما يكفي لتنجز
                أهم ما عليك دون ازدحام.
              </p>
            </div>

            <LoadingLink
              href="/profile/setup"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 md:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            >
              إعداد البروفايل
            </LoadingLink>
          </motion.div>

          <div className="py-4 sm:py-8">
            {tasksError ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                {tasksError}
              </p>
            ) : (
              <TodayTasksBoard
                initialTasks={initialTasks}
                initialFixedHabits={initialFixedHabits}
                isFocusActive={isFocusActive}
                onFocusActiveChange={setIsFocusActive}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
