"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Loader2, Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { joinCamp } from "./actions";
import { ShareCampButton } from "./share-camp-button";

const toastStyle = { fontFamily: "Umran" };

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

function formatHours(value) {
  const hours = Number(value) || 0;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function campMatchesQuery(camp, query) {
  if (!query) return true;

  const haystack = normalizeSearchText(
    [camp.title, camp.description].filter(Boolean).join(" "),
  );

  return haystack.includes(query);
}

function LiquidProgressBar({ progress }) {
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/90">
      <motion.div
        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.35)] dark:shadow-[0_0_20px_rgba(16,185,129,0.55)]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-l from-transparent via-white/40 to-transparent dark:via-white/25"
        initial={{ right: "100%" }}
        animate={{ right: `${Math.max(0, progress - 35)}%` }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </div>
  );
}

function CampCard({ camp, onJoined }) {
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(camp.joined);
  const [contributionMinutes, setContributionMinutes] = useState(
    camp.contributionMinutes ?? 0,
  );

  function handleJoin(event) {
    event.preventDefault();
    event.stopPropagation();

    startTransition(async () => {
      const result = await joinCamp(camp.id);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      setJoined(true);
      setContributionMinutes(result.participation?.contributionMinutes ?? 0);
      onJoined(camp.id, result.participation?.contributionMinutes ?? 0);
      toast.success("انضممت للمعسكر بنجاح.", {
        position: "top-right",
        style: toastStyle,
      });
    });
  }

  return (
    <motion.article variants={cardVariants} exit="exit" layout>
      <Link
        href={`/dashboard/camps/${camp.id}`}
        className="group flex h-full flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 backdrop-blur-md transition hover:border-emerald-200 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)] dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-emerald-500/20 dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-base font-black leading-7 text-zinc-950 transition group-hover:text-emerald-700 dark:text-zinc-50 dark:group-hover:text-emerald-50">
              {camp.title}
            </h2>
            <div className="flex shrink-0 items-center gap-1.5">
              <ShareCampButton
                campId={camp.id}
                title={camp.title}
                stopPropagation
              />
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                {camp.progressPercent}%
              </span>
            </div>
          </div>
          {camp.description ? (
            <p className="line-clamp-2 text-xs font-medium leading-6 text-zinc-500">
              {camp.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <LiquidProgressBar progress={camp.progressPercent} />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            تم إنجاز{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {formatHours(camp.current_hours)}
            </span>{" "}
            من أصل{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {formatHours(camp.target_hours)}
            </span>{" "}
            ساعة
          </p>
        </div>

        <div
          className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800/80"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          role="presentation"
        >
          {joined ? (
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500 dark:border-zinc-700/80 dark:bg-zinc-950/60 dark:text-zinc-400">
                أنت مشارك في هذا المعسكر
              </span>
              <p className="text-sm font-medium text-zinc-500">
                مساهمتك:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {contributionMinutes} دقيقة
                </span>
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500/80">
                ادخل للمعسكر
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              aria-busy={isPending}
              animate={isPending ? undefined : { scale: [1, 1.02, 1] }}
              transition={
                isPending
                  ? undefined
                  : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              }
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-[0_0_16px_rgba(16,185,129,0.2)] transition hover:bg-emerald-600 disabled:opacity-70 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {isPending ? "جارٍ الانضمام..." : "انضم للمعسكر"}
            </motion.button>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

function CampsSearchBar({ value, onChange, resultsCount, totalCount }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ابحث عن معسكر بالاسم أو الوصف..."
          className="w-full rounded-xl border border-zinc-200/80 bg-white/80 py-3 pe-10 ps-10 text-sm font-semibold text-zinc-900 outline-none transition placeholder:font-medium placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="مسح البحث"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {value ? (
        <p className="text-xs font-medium text-zinc-500">
          {resultsCount} من {totalCount} معسكر
        </p>
      ) : null}
    </div>
  );
}

export function CampsHub({ initialCamps }) {
  const [camps, setCamps] = useState(initialCamps);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = normalizeSearchText(searchQuery);

  const filteredCamps = useMemo(
    () => camps.filter((camp) => campMatchesQuery(camp, normalizedQuery)),
    [camps, normalizedQuery],
  );

  function handleJoined(campId, contributionMinutes) {
    setCamps((current) =>
      current.map((camp) =>
        camp.id === campId
          ? { ...camp, joined: true, contributionMinutes }
          : camp,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Flame className="h-4 w-4" />
            <p className="text-xs font-bold tracking-wide">دفعات الإنجاز</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
            المعسكرات المفتوحة
          </h1>
          <p className="max-w-2xl text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
            شارك في دفعات الإنجاز الجماعي. استغراقك الفردي يصب في الأثر المشترك.
          </p>
        </div>

        <Link
          href="/dashboard/camps/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600 dark:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
        >
          <Plus className="h-4 w-4" />
          تأسيس معسكر
        </Link>
      </header>

      {camps.length > 0 ? (
        <CampsSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultsCount={filteredCamps.length}
          totalCount={camps.length}
        />
      ) : null}

      {camps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-14 text-center backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-500">
            لا توجد معسكرات نشطة حالياً. تابعنا قريباً.
          </p>
        </div>
      ) : filteredCamps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-14 text-center backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm font-medium text-zinc-500">
            لا توجد نتائج لـ «{searchQuery}». جرّب كلمات أخرى.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {filteredCamps.map((camp) => (
              <CampCard key={camp.id} camp={camp} onJoined={handleJoined} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
