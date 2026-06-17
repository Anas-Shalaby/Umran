"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BarChart3, Home, NotebookPen, Settings, Target } from "lucide-react";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { startNavigation } from "@/lib/navigation-progress";

const navigationLinks = [
  { label: "الرئيسية", href: "/dashboard", icon: Home },
  { label: "الأهداف والخطوات", href: "/dashboard/goals", icon: Target },
  { label: "دفتر الليل", href: "/dashboard/journal", icon: NotebookPen },
  { label: "تقويم الأثر", href: "/dashboard/calendar", icon: BarChart3 },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ activeHref = "/dashboard", userName = "" }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function navigate(href, event) {
    if (href === activeHref) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    startNavigation();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <aside className="rounded-[2rem] border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[calc(100vh-3rem)] lg:w-72">
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

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
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
  );
}

function SidebarLink({ label, href, icon: Icon, active = false, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={(event) => onNavigate(href, event)}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
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
