"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Crosshair,
  Loader2,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { joinCamp } from "./actions";
import { CampRoadmap } from "./camp-roadmap";
import { ShareCampButton } from "./share-camp-button";

const toastStyle = { fontFamily: "Umran" };

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function formatHours(value) {
  const hours = Number(value) || 0;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function minutesToHours(minutes) {
  const hours = (Number(minutes) || 0) / 60;
  return formatHours(hours);
}

function formatCampStatus(endsAt, startsAt) {
  if (endsAt) {
    const endDate = new Date(endsAt);
    if (!Number.isNaN(endDate.getTime())) {
      return `ينتهي في ${endDate.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`;
    }
  }

  if (startsAt) {
    const startDate = new Date(startsAt);
    if (!Number.isNaN(startDate.getTime())) {
      return `انطلق في ${startDate.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
      })} — معسكر نشط`;
    }
  }

  return "معسكر نشط — استمر في الاستغراق بصمت";
}

function BackNav({ campId, campTitle }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
    >
      <Link
        href="/dashboard/camps"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-zinc-500 backdrop-blur-md transition hover:border-emerald-300 hover:text-emerald-600 sm:w-auto sm:justify-start dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للمعسكرات
      </Link>
      <ShareCampButton
        campId={campId}
        title={campTitle}
        showLabel
        label="مشاركة المعسكر"
        className="w-full sm:w-auto"
      />
    </motion.div>
  );
}

function CampHeader({ title, description, statusLabel }) {
  return (
    <motion.header
      variants={fadeUp}
      className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-7 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-md sm:rounded-3xl sm:px-6 sm:py-10 lg:px-10 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:shadow-[0_0_80px_rgba(16,185,129,0.15)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_60%)]" />
      <div className="relative space-y-2 sm:space-y-3">
        <p className="text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-500/80">
          غرفة العمليات
        </p>
        <h1 className="text-2xl font-black leading-tight text-zinc-950 sm:text-3xl lg:text-5xl dark:text-zinc-50">
          {title}
        </h1>
        <p className="text-xs font-medium text-zinc-500 sm:text-sm">{statusLabel}</p>
        {description ? (
          <p className="max-w-2xl text-sm font-medium leading-6 text-zinc-600 sm:leading-7 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
    </motion.header>
  );
}

function EmeraldGauge({ progress, currentHours, size = 260 }) {
  const stroke = Math.max(8, Math.round(size * 0.046));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const glowInset = Math.round(size * 0.31);

  return (
    <motion.div
      variants={fadeUp}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10"
        style={{ inset: glowInset }}
      />
      <svg
        width={size}
        height={size}
        className="-rotate-90 text-zinc-200 dark:text-zinc-800"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            type: "spring",
            stiffness: 48,
            damping: 14,
            delay: 0.2,
          }}
          style={{ filter: "drop-shadow(0 0 16px rgba(16,185,129,0.4))" }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 14,
            delay: 0.45,
          }}
          className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl dark:text-zinc-50"
        >
          {formatHours(currentHours)}
        </motion.p>
        <p className="mt-1 text-xs font-bold text-emerald-600 sm:text-sm dark:text-emerald-500">
          ساعة إنجاز
        </p>
        <p className="mt-1 text-[11px] font-semibold text-zinc-500 sm:mt-2 sm:text-xs">
          {progress}% من الهدف
        </p>
      </div>
    </motion.div>
  );
}

function ResponsiveEmeraldGauge({ progress, currentHours }) {
  const [gaugeSize, setGaugeSize] = useState(200);

  useEffect(() => {
    function updateGaugeSize() {
      const width = window.innerWidth;

      if (width >= 1024) {
        setGaugeSize(260);
        return;
      }

      if (width >= 640) {
        setGaugeSize(230);
        return;
      }

      setGaugeSize(200);
    }

    updateGaugeSize();
    window.addEventListener("resize", updateGaugeSize);
    return () => window.removeEventListener("resize", updateGaugeSize);
  }, []);

  return (
    <EmeraldGauge
      progress={progress}
      currentHours={currentHours}
      size={gaugeSize}
    />
  );
}

function GaugeHub({ camp, onJoin, isPending }) {
  return (
    <motion.section
      variants={fadeUp}
      className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-200/80 bg-white/60 px-4 py-8 backdrop-blur-md sm:gap-8 sm:rounded-3xl sm:px-6 sm:py-12 lg:px-10 dark:border-zinc-800/50 dark:bg-zinc-900/40"
    >
      <ResponsiveEmeraldGauge
        progress={camp.progressPercent}
        currentHours={camp.current_hours}
      />

      {!camp.joined ? (
        <motion.button
          type="button"
          onClick={onJoin}
          disabled={isPending}
          aria-busy={isPending}
          animate={isPending ? undefined : { scale: [1, 1.03, 1] }}
          transition={
            isPending
              ? undefined
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
          className="inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600 disabled:opacity-70 sm:h-12 sm:min-w-[220px] sm:w-auto sm:px-8 dark:shadow-[0_0_28px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-400"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          {isPending ? "جارٍ الانضمام..." : "انضم للمعسكر"}
        </motion.button>
      ) : (
        <span className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-bold text-emerald-700 sm:w-auto dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          أنت داخل الغرفة — استمر بصمت
        </span>
      )}
    </motion.section>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-md sm:rounded-2xl sm:p-6 dark:border-zinc-800/50 dark:bg-zinc-900/50"
    >
      <div className="mb-3 flex items-center gap-2 text-zinc-500 sm:mb-4">
        <Icon className="h-4 w-4 shrink-0 text-emerald-600/80 dark:text-emerald-500/80" />
        <p className="text-[11px] font-bold sm:text-xs">{label}</p>
      </div>
      <p className="text-2xl font-black text-zinc-950 sm:text-3xl dark:text-zinc-50">
        {value}
      </p>
    </motion.div>
  );
}

function StatGrid({ camp }) {
  return (
    <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard icon={Users} label="المعمرون" value={camp.totalParticipants} />
      <StatCard
        icon={Crosshair}
        label="مساهمتك"
        value={`${minutesToHours(camp.userContributionMinutes)} س`}
      />
      <div className="col-span-2 sm:col-span-1">
        <StatCard
          icon={Target}
          label="الهدف الكلي"
          value={`${formatHours(camp.target_hours)} س`}
        />
      </div>
    </motion.div>
  );
}

function SilentHallOfFame({ contributors }) {
  return (
    <motion.section
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200/80 bg-white/60 p-4 backdrop-blur-md sm:rounded-3xl sm:p-6 lg:p-8 dark:border-zinc-800/50 dark:bg-zinc-900/40"
    >
      <div className="mb-4 flex items-center gap-2 sm:mb-6">
        <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
        <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
          قائمة الشرف
        </h2>
      </div>

      {contributors.length === 0 ? (
        <p className="text-sm font-medium text-zinc-500">
          لا توجد مساهمات بعد. كن أول معمر يفتح الأثر.
        </p>
      ) : (
        <ul className="space-y-2">
          {contributors.map((contributor, index) => (
            <motion.li
              key={contributor.userId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.07 }}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 ${
                contributor.isCurrentUser
                  ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/5"
                  : "border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/50 dark:bg-zinc-950/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {index === 0 ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] dark:shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                ) : null}
                <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-sm font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {contributor.initials}
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {contributor.contributionHours} س
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

export function CampDetail({ initialCamp, initialTasks = [] }) {
  const router = useRouter();
  const [camp, setCamp] = useState(initialCamp);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCamp(initialCamp);
  }, [initialCamp]);

  function handleJoin() {
    startTransition(async () => {
      const result = await joinCamp(camp.id);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      setCamp((current) => ({
        ...current,
        joined: true,
        userContributionMinutes: 0,
      }));

      toast.success("دخلت غرفة العمليات. استغراقك القادم يصب هنا.", {
        position: "top-right",
        style: toastStyle,
      });
      router.refresh();
    });
  }

  const statusLabel = formatCampStatus(camp.ends_at, camp.starts_at);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full min-w-0 max-w-4xl space-y-5 sm:space-y-8 lg:space-y-10"
    >
      <BackNav campId={camp.id} campTitle={camp.title} />
      <CampHeader
        title={camp.title}
        description={camp.description}
        statusLabel={statusLabel}
      />
      <GaugeHub camp={camp} onJoin={handleJoin} isPending={isPending} />
      <StatGrid camp={camp} />
      <CampRoadmap
        campId={camp.id}
        initialTasks={initialTasks}
        isCreator={Boolean(camp.isCreator)}
        canInteract={Boolean(camp.joined || camp.isCreator)}
      />
      <SilentHallOfFame contributors={camp.topContributors} />
    </motion.div>
  );
}
