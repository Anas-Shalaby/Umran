"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MoonStar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { submitJournal } from "./actions";

const reflectionFields = [
  {
    name: "proud_accomplishment",
    label: "بوابة الحمد",
    question: "ما هي العبادة أو المهمة التي جعلتك فخوراً بنفسك اليوم؟",
    placeholder: "اكتب بصدق ما أنجزته اليوم مما يقرّبك إلى الله...",
  },
  {
    name: "biggest_distraction",
    label: "رصد الثغرات",
    question: "ما هو المشتت الأكبر الذي سرق وقتك اليوم، وكيف تتجنبه غداً؟",
    placeholder: "حدّد الثغرة بوضوح، واكتب خطوة عملية لتجنبها غداً...",
  },
  {
    name: "tomorrow_note",
    label: "رسالة الفجر",
    question: "اكتب رسالة لنفسك تقرأها غداً قبل صلاة الفجر.",
    placeholder: "رسالة قصيرة، صادقة، تلهمك لبداية يوم جديد بوعي...",
  },
];

const journalEntries = [
  {
    key: "proud_accomplishment",
    label: "بوابة الحمد",
  },
  {
    key: "biggest_distraction",
    label: "رصد الثغرات",
  },
  {
    key: "tomorrow_note",
    label: "رسالة الفجر",
  },
];

export function NightlyJournal({ initialJournal }) {
  const [journal, setJournal] = useState(initialJournal);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const proud = String(formData.get("proud_accomplishment") || "");
    const distraction = String(formData.get("biggest_distraction") || "");
    const note = String(formData.get("tomorrow_note") || "");

    startTransition(async () => {
      const result = await submitJournal(proud, distraction, note);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.journal) {
        setJournal(result.journal);
        toast.success("الحمد لله، تم إغلاق دفتر اليوم بنجاح!", {
          position: "top-right",
          style: {
            fontFamily: "Umran",
          },
        });
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-bold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <MoonStar className="h-3.5 w-3.5 text-indigo-500" />
          وقت الإغلاق
        </div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          دفتر الليل
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
          أغلق دفتر يومك بوعي، فرّغ تشتتك، واستعد لغد أفضل.
        </p>
        <p className="mx-auto mt-1 block max-w-2xl text-[11px] font-medium leading-relaxed text-zinc-400">
          عصبياً: الإجابة على هذه الأسئلة الثلاثة ليلاً تُغلق ملفات الدوبامين
          المفتوحة والمعلقة في دماغك، مما يمنحك نوماً عميقاً بلا قلق واستيقاظاً
          حاد التركيز لصلاة الفجر.
        </p>
      </div>

      {journal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900 dark:bg-zinc-900/50 sm:p-8"
        >
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              الحمد لله، تم إغلاق دفتر اليوم بنجاح!
            </p>
          </div>

          <div className="space-y-6">
            {journalEntries.map((entry, index) => (
              <motion.div
                key={entry.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.25 }}
                className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                  <p className="text-xs font-bold text-zinc-500">
                    {entry.label}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm font-medium leading-8 text-zinc-800 dark:text-zinc-200">
                  {journal[entry.key]}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-8"
        >
          {reflectionFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
              className="space-y-3"
            >
              <div>
                <p className="text-xs font-bold tracking-wide text-zinc-500">
                  {field.label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                  {field.question}
                </p>
              </div>
              <textarea
                name={field.name}
                rows={4}
                disabled={isPending}
                placeholder={field.placeholder}
                className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="border-t border-zinc-100 pt-6 dark:border-zinc-800"
          >
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الإغلاق...
                </>
              ) : (
                "أغلق دفتر اليوم.. الحمد لله"
              )}
            </button>
          </motion.div>
        </form>
      )}
    </motion.div>
  );
}
