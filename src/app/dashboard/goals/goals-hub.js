"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { createGoal } from "./actions";

const toastStyle = { fontFamily: "Umran" };

function getProgress(tasks) {
  if (!tasks?.length) return 0;
  const completed = tasks.filter((task) => task.is_completed).length;
  return Math.round((completed / tasks.length) * 100);
}

export function GoalsHub({ initialGoals }) {
  const [goals, setGoals] = useState(initialGoals);
  const [goalDraft, setGoalDraft] = useState("");
  const [isCreatingGoal, startCreateGoal] = useTransition();

  const sortedGoals = useMemo(
    () =>
      [...goals].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [goals],
  );

  function handleCreateGoal(event) {
    event.preventDefault();

    const title = goalDraft.trim();
    if (!title) return;

    startCreateGoal(async () => {
      const result = await createGoal(title);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      if (result?.goal) {
        setGoals((current) => [result.goal, ...current]);
        setGoalDraft("");
        toast.success("تم إضافة الهدف.", {
          position: "top-right",
          style: toastStyle,
        });
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Target className="h-4 w-4 shrink-0" />
          <p className="text-xs font-bold tracking-wide">مركز الأهداف</p>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl dark:text-zinc-50">
          غاياتك الكبرى
        </h1>
        <p className="max-w-xl text-xs font-medium leading-6 text-zinc-500 sm:text-sm sm:leading-7 dark:text-zinc-400">
          أضف هدفاً واحداً في كل مرة. ثم ادخل لبناء خطته بهدوء.
        </p>
      </header>

      <form
        onSubmit={handleCreateGoal}
        className="rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={goalDraft}
            onChange={(event) => setGoalDraft(event.target.value)}
            disabled={isCreatingGoal}
            placeholder="مثال: قراءة كتاب الأدب المفرد"
            className="h-11 min-h-[44px] flex-1 rounded-xl border-0 bg-transparent px-3 text-sm font-semibold text-zinc-950 placeholder:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 sm:h-12 sm:px-4 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={isCreatingGoal || !goalDraft.trim()}
            className="inline-flex h-11 min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:px-5 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isCreatingGoal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            إضافة هدف
          </button>
        </div>
      </form>

      {sortedGoals.length ? (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGoals.map((goal, index) => {
            const progress = getProgress(goal.tasks);

            return (
              <motion.article
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group flex flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <h2
                  className={`mb-3 line-clamp-3 text-sm font-black leading-7 text-zinc-950 sm:mb-4 sm:line-clamp-2 sm:text-base dark:text-zinc-50 ${
                    goal.is_completed ? "text-zinc-400 line-through" : ""
                  }`}
                >
                  {goal.title}
                </h2>

                <div className="mb-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                    <span>التقدم</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 90,
                        damping: 18,
                      }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>

                <Link
                  href={`/dashboard/goals/${goal.id}`}
                  className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-800 transition group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:group-hover:border-emerald-900 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-300"
                >
                  اضغط لبناء الخطة
                  <span aria-hidden>
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-12 text-center sm:px-6 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950/50"
        >
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            لا توجد أهداف بعد.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            ابدأ بهدف واحد واضح، ثم ابنِ خطته في مساحة مخصصة.
          </p>
        </motion.div>
      )}
    </div>
  );
}
