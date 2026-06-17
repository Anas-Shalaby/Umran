"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarRange,
  Clock,
  Globe,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createCamp } from "./actions";

const toastStyle = { fontFamily: "Umran" };

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition placeholder:font-medium placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const labelClass =
  "mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200";

export function CreateCampForm() {
  const router = useRouter();
  const [visibility, setVisibility] = useState("public");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await createCamp(formData);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      toast.success("تم تأسيس المعسكر بنجاح.", {
        position: "top-right",
        style: toastStyle,
      });
      router.push("/dashboard/camps");
      router.refresh();
    });
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-xl space-y-8"
    >
      <motion.div variants={fadeUp}>
        <Link
          href="/dashboard/camps"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-500 backdrop-blur-md transition hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمعسكرات
        </Link>
      </motion.div>

      <motion.header
        variants={fadeUp}
        className="space-y-3 text-center sm:text-start"
      >
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          تأسيس معسكر جديد
        </h1>
        <p className="text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
          أنت الآن تبني مساحة للأثر المشترك. حدد معالم المعسكر بدقة.
        </p>
      </motion.header>

      <motion.form
        variants={fadeUp}
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/40 sm:p-8"
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            عنوان المعسكر
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="مثال: دفعة التركيز العميق — رمضان"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="target_hours" className={labelClass}>
            هدف الساعات
          </label>
          <div className="relative">
            <Clock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-500" />
            <input
              id="target_hours"
              name="target_hours"
              type="number"
              min="1"
              step="1"
              required
              placeholder="1000"
              className={`${fieldClass} ps-10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            وصف المعسكر
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="اكتب رؤية المعسكر، قواعد الاستغراق، وما الذي يجمع المشاركين..."
            className={`${fieldClass} resize-none leading-7`}
          />
        </div>

        <div>
          <label className={labelClass}>نطاق المعسكر الزمني</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="starts_at"
                name="starts_at"
                type="date"
                className={`${fieldClass} ps-10`}
              />
            </div>
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="ends_at"
                name="ends_at"
                type="date"
                className={`${fieldClass} ps-10`}
              />
            </div>
          </div>
          <p className="mt-2 text-xs font-medium text-zinc-500">
            اختياري — يحدد إطار زمني واضح للمعسكر.
          </p>
        </div>

        <div>
          <label className={labelClass}>هوية المعسكر</label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/50">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                visibility === "public"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Globe className="h-4 w-4" />
              عام
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                visibility === "private"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Lock className="h-4 w-4" />
              خاص
            </button>
          </div>
          <input type="hidden" name="visibility" value={visibility} />
        </div>

        <motion.button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          whileTap={{ scale: 0.98 }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-600 disabled:opacity-70 dark:shadow-[0_0_28px_rgba(16,185,129,0.35)]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "جارٍ التأسيس..." : "تأسيس المعسكر الآن "}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
