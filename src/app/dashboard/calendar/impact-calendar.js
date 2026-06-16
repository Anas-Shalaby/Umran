"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const LEVEL_STYLES = {
  0: "border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
  1: "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  2: "border-emerald-200 bg-emerald-200 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-800 dark:text-emerald-50",
  3: "border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 dark:border-emerald-600 dark:bg-emerald-500",
};

const LEGEND_ITEMS = [
  { level: 0, label: "مطفأ" },
  { level: 1, label: "أثر خفيف" },
  { level: 2, label: "أثر مشهود" },
  { level: 3, label: "ثغر مسدود" },
];

function getImpactLevel(day) {
  if (!day || (day.total_tasks === 0 && !day.journal_submitted)) {
    return 0;
  }

  if (day.completion_percentage === 100 && day.journal_submitted) {
    return 3;
  }

  if (day.completion_percentage > 50) {
    return 2;
  }

  return 1;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 1) % 7;
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatMonthTitle(year, month) {
  return new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function formatTooltipDate(dateString) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateString}T00:00:00`));
}

function buildTooltipText(day) {
  if (!day) {
    return "لا يوجد أثر مسجّل في هذا اليوم.";
  }

  const dateLabel = formatTooltipDate(day.impact_date);

  if (day.total_tasks === 0 && !day.journal_submitted) {
    return `${dateLabel} — لا يوجد نشاط مسجّل.`;
  }

  if (day.completion_percentage === 100 && day.journal_submitted) {
    return `${dateLabel} — تم إنجاز ${day.completed_tasks} مهام وكتابة الدفتر.`;
  }

  if (day.total_tasks > 0 && day.journal_submitted) {
    return `${dateLabel} — تم إنجاز ${day.completed_tasks} من ${day.total_tasks} مهام وكتابة الدفتر.`;
  }

  if (day.total_tasks > 0) {
    return `${dateLabel} — تم إنجاز ${day.completed_tasks} من ${day.total_tasks} مهام.`;
  }

  return `${dateLabel} — تم كتابة الدفتر دون مهام مسجّلة.`;
}

function getMonthStats(monthCells, dayMap) {
  const monthDays = monthCells
    .filter(Boolean)
    .map((date) => dayMap.get(date))
    .filter(Boolean);

  const activeDays = monthDays.filter((day) => day.level > 0);
  const perfectDays = monthDays.filter((day) => day.level === 3);

  return {
    activeDays: activeDays.length,
    perfectDays: perfectDays.length,
  };
}

export function ImpactCalendar({ impactData }) {
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);
  const earliestDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 89);
    return date;
  }, [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDate, setHoveredDate] = useState(null);

  const dayMap = useMemo(() => {
    const map = new Map();

    impactData.forEach((entry) => {
      map.set(entry.impact_date, {
        ...entry,
        level: getImpactLevel(entry),
      });
    });

    return map;
  }, [impactData]);

  const monthCells = useMemo(() => {
    return buildMonthGrid(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const monthStats = useMemo(() => {
    return getMonthStats(monthCells, dayMap);
  }, [monthCells, dayMap]);

  const hasAnyImpact = useMemo(() => {
    return impactData.some((entry) => getImpactLevel(entry) > 0);
  }, [impactData]);

  const hoveredDay = hoveredDate ? dayMap.get(hoveredDate) || null : null;

  const canGoNext =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const canGoPrev =
    new Date(viewYear, viewMonth, 1) >
    new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

  function goToPreviousMonth() {
    if (!canGoPrev) return;

    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
      return;
    }

    setViewMonth((month) => month - 1);
  }

  function goToNextMonth() {
    if (!canGoNext) return;

    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
      return;
    }

    setViewMonth((month) => month + 1);
  }

  return (
    <div className="space-y-6">
      {!hasAnyImpact ? (
        <p className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-sm font-medium leading-7 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          رحلتك بدأت للتو. كل يوم هنا سيحكي قريباً قصة أثرٍ بنيتَه بوعي — ابدأ
          اليوم بخطوة واحدة صادقة.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <button
            type="button"
            onClick={goToPreviousMonth}
            disabled={!canGoPrev}
            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <h2 className="min-w-[10rem] text-center text-lg font-black text-zinc-950 dark:text-zinc-50">
            {formatMonthTitle(viewYear, viewMonth)}
          </h2>

          <button
            type="button"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {monthStats.activeDays} يوم بأثر
          </span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            {monthStats.perfectDays} يوم ثغر مسدود
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-5">
        <div className="mb-3 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="py-1 text-center text-[11px] font-bold text-zinc-500 dark:text-zinc-400"
            >
              {weekday}
            </div>
          ))}
        </div>

        <motion.div
          key={`${viewYear}-${viewMonth}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-7 gap-2"
        >
          {monthCells.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-xl bg-transparent"
                  aria-hidden="true"
                />
              );
            }

            const day = dayMap.get(date);
            const level = day?.level ?? 0;
            const dayNumber = Number(date.split("-")[2]);
            const isToday = date === todayKey;
            const isFuture = new Date(`${date}T00:00:00`) > today;

            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                onFocus={() => setHoveredDate(date)}
                onBlur={() => setHoveredDate(null)}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-bold transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-35 ${LEVEL_STYLES[level]} ${
                  isToday ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-50 dark:ring-offset-zinc-900" : ""
                }`}
                aria-label={buildTooltipText(
                  day || {
                    impact_date: date,
                    total_tasks: 0,
                    completed_tasks: 0,
                    completion_percentage: 0,
                    journal_submitted: false,
                  },
                )}
              >
                <span>{dayNumber}</span>
                {level === 3 ? (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-white/90" />
                ) : null}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {hoveredDay || hoveredDate ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-xs font-semibold leading-6 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {buildTooltipText(
                hoveredDay || {
                  impact_date: hoveredDate,
                  total_tasks: 0,
                  completed_tasks: 0,
                  completion_percentage: 0,
                  journal_submitted: false,
                },
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">الدليل البصري</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-medium text-zinc-400">
            من أقل أثراً إلى الأعلى أثراً
          </span>
          {LEGEND_ITEMS.map((item) => (
            <div key={item.level} className="flex items-center gap-1.5">
              <span
                className={`h-4 w-4 rounded-md border ${LEVEL_STYLES[item.level]}`}
              />
              <span className="text-[11px] font-medium text-zinc-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
