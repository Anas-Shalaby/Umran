"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Brain,
  CalendarRange,
  Check,
  Layers3,
  ListChecks,
  MoonStar,
} from "lucide-react";
import { getUser } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const rotatingWords = ["المسلوب", "المشتت", "الضائع"];

const marqueeItems = [
  "🎯 حصر التركيز في ٣ ثغور",
  "📖 الورد القرآني بعد الفجر",
  "🧠 إعادة ضبط الدوبامين الطبيعي",
  "🌙 كُناشة الليل لإغلاق اليوم",
  "🕌 صلاة الجماعة في المسجد",
];

const prayerTabs = [
  "بعد الفجر",
  "بين الظهر والعصر",
  "بعد العصر",
  "بين المغرب والعشاء",
  "بعد العشاء",
];

const pillars = [
  {
    title: "هندسة المرتكزات",
    subtitle: "Habit Stacking",
    description:
      "اربط مهامك اليومية بمرتكزاتك الثابتة — الصلوات الخمس — فتتحول الإرادة إلى نظام تلقائي. الدماغ لا يبحث عن وقت، بل يجد المهمة جاهزة في نافذة الصلاة نفسها، فتُبنى الاستمرارية دون جهد إرادي مستنزف.",
    icon: Layers3,
  },
  {
    title: "قانون الثغور الثلاثة",
    subtitle: "قاعدة التركيز",
    description:
      "حصر أهدافك الدنيوية في ثلاث ثغور يومية فقط يُسكت استجابة الهروب والقتال في الدماغ، ويقضي على شلل الاختيار. عقلك يعرف بالضبط أين يضع طاقته، فترتفع جودة التنفيذ بشكل ملموس.",
    icon: ListChecks,
  },
  {
    title: "إغلاق ملفات الدماغ العصبية",
    subtitle: "كُناشة الليل",
    description:
      "الإجابة على ثلاثة أسئلة انعكاسية ليلاً تُغلق تبويبات الدوبامين المفتوحة في عقلك. تنام بعمق أهدأ، وتستيقظ بتركيز حاد لصلاة الفجر دون ضباب ذهني معلّق.",
    icon: MoonStar,
  },
];

const impactGridPattern = [
  0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1,
  0, 1, 2, 1, 3, 2, 1, 0, 2, 1, 3, 2, 1, 0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1,
  0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3, 2, 1,
  0, 1, 2, 1, 3, 2, 1, 0, 1, 2, 3,
];

const levelColors: Record<number, string> = {
  0: "bg-zinc-100 dark:bg-zinc-800",
  1: "bg-emerald-100 dark:bg-emerald-900",
  2: "bg-emerald-300 dark:bg-emerald-700",
  3: "bg-emerald-600 dark:bg-emerald-500",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const pillarsContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
};

const pillarCard: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function UmranLanding() {
  const router = useRouter();

  useEffect(() => {
    getUser().then((result) => {
      if (result.user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white text-start text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <LandingNav />

      <div className="space-y-32">
        <HeroSection />
        <MarqueeSection />
        <DashboardPreviewSection />
        <PillarsSection />
        <ConsistencyGridSection />
        <FinalCtaSection />
      </div>

      <LandingFooter />
    </main>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          عُمران
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200/60 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
          >
            تسجيل الدخول
          </Link>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-4xl font-black leading-[1.15] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl"
        >
          استعد تركيزك <HeroRotatingWord />. ابنِ عُمران يومك.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-8 max-w-3xl text-base font-medium leading-8 text-zinc-500 dark:text-zinc-400 sm:text-lg"
        >
          منصة تبسيطية مبرمجة عصبياً وسلوكياً لمساعدتك على دك التشتت، وإعادة ضبط
          مستويات الدوبامين، وتنظيم مهامك الحياتية حول المرتكزات الثابتة لليوم.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.18 }}
          className="mt-12"
        >
          <Link
            href="/register"
            className="inline-flex min-w-[240px] items-center justify-center rounded-xl bg-zinc-900 px-8 py-3.5 text-sm font-bold text-zinc-50 shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            ابدأ تهيئة يومك مجاناً
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function MarqueeSection() {
  return (
    <section className="w-full">
      <ImpactMarquee />
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-4xl"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-xl sm:p-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              وضع التركيز المطلق
            </div>

            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-zinc-600 bg-zinc-900 text-emerald-400">
                <Check className="h-5 w-5" />
              </span>
              <p className="text-xl font-black leading-snug text-zinc-50 sm:text-2xl">
                ⚡ ثغرك الحالي:{" "}
                <span className="text-emerald-300">
                  برمجة محرك الـ API الرئيسي
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
            {prayerTabs.map((tab, index) => (
              <span
                key={tab}
                className={`flex-1 rounded-lg py-2.5 text-center text-[10px] font-bold sm:text-xs ${
                  index === 0
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {["قراءة الورد القرآني", "مراجعة ملاحظات المحاضرة"].map((task) => (
              <div
                key={task}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/40 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <span className="h-4 w-4 rounded border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {task}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function PillarsSection() {
  return (
    <section className="border-t border-zinc-200/60 bg-zinc-50/30 py-24 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            لماذا يعمل النظام علمياً؟
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
            ثلاث ركائز سلوكية وعصبية صُممت لتبني عادات مستدامة دون ازدحام.
          </p>
        </motion.div>

        <motion.div
          variants={pillarsContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-5 md:grid-cols-3"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <motion.article
                key={pillar.title}
                variants={pillarCard}
                className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-zinc-200/60 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-bold text-emerald-600">
                  {pillar.subtitle}
                </p>
                <h3 className="mt-1 text-base font-black text-zinc-900 dark:text-zinc-50">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
                  {pillar.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function ConsistencyGridSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              تقويم الأثر
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {impactGridPattern.map((level, index) => (
              <span
                key={`cube-${index}`}
                className={`h-3.5 w-3.5 rounded-sm sm:h-4 sm:w-4 ${levelColors[level]}`}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {[
              { level: 0, label: "مطفأ" },
              { level: 1, label: "خفيف" },
              { level: 2, label: "مشهود" },
              { level: 3, label: "مسدود" },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-1.5">
                <span
                  className={`h-3 w-3 rounded-sm ${levelColors[item.level]}`}
                />
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Brain className="h-3.5 w-3.5" />
            الاستمرارية البصرية
          </div>
          <h2 className="text-2xl font-black leading-snug text-zinc-900 sm:text-3xl">
            الاستمرارية هي النواة الحقيقية للإنجاز
          </h2>
          <p className="mt-4 text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
            تتبع أثر صِيَك اليومي، واحمِ السلسلة البصرية من الانكسار. كل مربع في
            تقويم الأثر يحكي قصة يومٍ أغلقت فيه ثغورك بوعي — فتتحول الالتزامات
            الصغيرة إلى بناء نواة لا تُهزم.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ابدأ تتبع أثرك اليوم
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl rounded-3xl border border-zinc-100 bg-zinc-50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900 sm:p-12"
      >
        <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
          هل أنت جاهز لاستعادة ملكية وقتك؟
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
          انضم إلى أكثر من ٥,٠٠٠ شاب يستيقظون يومياً بنوايا حادة وثغور مسدودة.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex min-w-[240px] items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          سجّل حسابك الآن مجاناً
        </Link>
      </motion.div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200/60 py-10 dark:border-zinc-800">
      <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
        عُمران © ٢٠٢٦ — معاً لبناء النواة الحقيقية للإنجاز.
      </p>
    </footer>
  );
}

function HeroRotatingWord() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % rotatingWords.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  const currentWord = rotatingWords[wordIndex];

  return (
    <span className="relative inline-block h-[1.15em] min-w-[8ch] overflow-hidden align-bottom text-emerald-600">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 whitespace-nowrap"
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function ImpactMarquee() {
  const loopItems = [...marqueeItems, ...marqueeItems];

  return (
    <div className="relative overflow-hidden border-y border-zinc-200/60 bg-zinc-50/50 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent dark:from-zinc-950" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent dark:from-zinc-950" />

      <motion.div
        className="flex w-max gap-3 pe-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex shrink-0 items-center rounded-full border border-zinc-200/60 bg-white px-4 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
