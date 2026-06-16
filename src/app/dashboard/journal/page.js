import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { getTodayJournal } from "./actions";
import { NightlyJournal } from "./nightly-journal";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const journalResult = await getTodayJournal();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/50 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <DashboardSidebar activeHref="/dashboard/journal" />

        <section className="min-h-[calc(100vh-2rem)] flex-1 rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:p-10">
          {journalResult.error ? (
            <p className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
              {journalResult.error}
            </p>
          ) : (
            <NightlyJournal initialJournal={journalResult.journal} />
          )}
        </section>
      </div>
    </main>
  );
}
