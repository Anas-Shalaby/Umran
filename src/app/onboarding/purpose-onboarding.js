"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { saveUltimatePurpose } from "@/app/actions/user";

const fadeIn = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.1,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function PurposeOnboarding({ initialPurpose = "" }) {
  const [purpose, setPurpose] = useState(initialPurpose);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await saveUltimatePurpose(purpose);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-2xl"
    >
      <motion.div
        custom={0.05}
        variants={fadeIn}
        className="mb-3 text-center"
      >
        <div className="mx-auto mb-6 grid h-11 w-11 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900 text-base font-black text-emerald-500">
          ع
        </div>
      </motion.div>

      <motion.h1
        custom={0.18}
        variants={fadeIn}
        className="text-center text-2xl font-black leading-tight tracking-tight text-zinc-50 sm:text-4xl"
      >
        قبل أن تبدأ السعي..
      </motion.h1>

      <motion.p
        custom={0.34}
        variants={fadeIn}
        className="mx-auto mt-4 max-w-xl text-center text-sm font-medium leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-9"
      >
        الصحابة لم يمتلكوا إرادة خارقة من فراغ، بل امتلكوا غاية واضحة. ما هي
        غايتك الكبرى التي يهون لأجلها كل تعب وتشتت؟
      </motion.p>

      <motion.form
        custom={0.52}
        variants={fadeIn}
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 sm:mt-10 sm:space-y-5"
      >
        <div className="space-y-2">
          <label htmlFor="ultimate-purpose" className="sr-only">
            غايتك الكبرى
          </label>
          <textarea
            id="ultimate-purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            disabled={isPending}
            rows={5}
            placeholder="مثال: إرضاء الله عز وجل، وترك أثر نافع في أمتي..."
            className="min-h-[140px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3.5 text-sm font-medium leading-7 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-md transition placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:opacity-60 sm:min-h-[168px] sm:px-5 sm:py-4 sm:text-base sm:leading-8"
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-center text-sm font-semibold text-red-300">
            {error}
          </p>
        ) : null}

        <motion.button
          type="submit"
          disabled={isPending || !purpose.trim()}
          whileTap={{ scale: 0.985 }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white shadow-[0_0_32px_rgba(16,185,129,0.22)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "جارٍ التوثيق..." : "توثيق الغاية ودخول المحراب"}
        </motion.button>
      </motion.form>

      <motion.p
        custom={0.68}
        variants={fadeIn}
        className="mt-8 text-center text-xs font-medium leading-6 text-zinc-600"
      >
        ما تكتبه هنا ليس شعاراً تسويقياً — بل بوصلة تُراجعها كلما ضاقت عليك
        الدنيا.
      </motion.p>
    </motion.div>
  );
}
