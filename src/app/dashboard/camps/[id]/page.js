import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CampDetail } from "../camp-detail";
import { getCampDetails, getCampTasks } from "../actions";

export const dynamic = "force-dynamic";

export default async function CampDetailPage({ params }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/dashboard/onboarding");
  }

  const [campResult, tasksResult] = await Promise.all([
    getCampDetails(params.id),
    getCampTasks(params.id),
  ]);

  if (campResult.error || !campResult.camp) {
    notFound();
  }

  const userDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-surface-canvas text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[100vw] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:p-6">
        <div className="w-full shrink-0 lg:w-72">
          <DashboardSidebar
            activeHref="/dashboard/camps"
            userName={userDisplayName}
          />
        </div>

        <section className="min-h-0 w-full min-w-0 flex-1 rounded-2xl border border-zinc-200/80 bg-surface-elevated p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-[2rem] sm:p-6 lg:min-h-[calc(100vh-3rem)] lg:p-10">
          <CampDetail
            initialCamp={campResult.camp}
            initialTasks={tasksResult.tasks ?? []}
          />
        </section>
      </div>
    </main>
  );
}
