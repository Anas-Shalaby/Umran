"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Flame,
  Home,
  Menu,
  NotebookPen,
  Settings,
  Target,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { startNavigation } from "@/lib/navigation-progress";

const navigationLinks = [
  { label: "الرئيسية", href: "/dashboard", icon: Home },
  { label: "الأهداف والخطوات", href: "/dashboard/goals", icon: Target },
  { label: "المعسكرات المفتوحة", href: "/dashboard/camps", icon: Flame },
  { label: "دفتر الليل", href: "/dashboard/journal", icon: NotebookPen },
  { label: "تقويم الأثر", href: "/dashboard/calendar", icon: BarChart3 },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ activeHref = "/dashboard", userName = "" }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeHref]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function navigate(href, event) {
    if (href === activeHref) {
      event.preventDefault();
      setMobileOpen(false);
      return;
    }

    event.preventDefault();
    setMobileOpen(false);
    startNavigation();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      <div className="sticky top-0 z-30 -mx-1 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-base font-black text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
            ع
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-zinc-950 dark:text-zinc-50">
              عُمران
            </p>
            <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {userName ? `أهلاً، ${userName}` : "مساحة البناء"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="فتح القائمة"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
              aria-label="إغلاق القائمة"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 end-0 z-50 flex w-[min(100%,24rem)] flex-col border-s border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 lg:hidden"
              dir="rtl"
            >
              <div className="mb-5 flex items-center justify-between gap-3 px-1">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-lg font-black text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
                    ع
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-zinc-950 dark:text-zinc-50">
                      عُمران
                    </p>
                    <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {userName ? `أهلاً، ${userName}` : "مساحة البناء"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                {navigationLinks.map((item) => (
                  <SidebarLink
                    key={item.label}
                    {...item}
                    active={item.href === activeHref}
                    onNavigate={navigate}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <aside className="hidden rounded-[2rem] border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:block lg:min-h-[calc(100vh-3rem)] lg:w-72">
        <div className="mb-6 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-950 text-lg font-black text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
              ع
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                عُمران
              </p>
              {userName ? (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  أهلاً، {userName}
                </p>
              ) : (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  مساحة البناء
                </p>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex flex-col gap-1.5">
          {navigationLinks.map((item) => (
            <SidebarLink
              key={item.label}
              {...item}
              active={item.href === activeHref}
              onNavigate={navigate}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarLink({ label, href, icon: Icon, active = false, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={(event) => onNavigate(href, event)}
      aria-current={active ? "page" : undefined}
      className={`inline-flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
