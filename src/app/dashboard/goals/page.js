import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { getGoalsWithTasks } from "./actions";
import { GoalsHub } from "./goals-hub";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
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

  const goalsResult = await getGoalsWithTasks();
  const userDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/50 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[100vw] flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:p-6">
        <DashboardSidebar
          activeHref="/dashboard/goals"
          userName={userDisplayName}
        />

        <section className="relative min-h-0 w-full min-w-0 flex-1 rounded-2xl border border-zinc-200/70 bg-white p-4 pb-24 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-[2rem] sm:p-6 lg:min-h-[calc(100vh-3rem)] lg:p-10">
          {goalsResult.error ? (
            <p className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
              {goalsResult.error}
            </p>
          ) : (
            <GoalsHub initialGoals={goalsResult.goals} />
          )}
        </section>
      </div>
    </main>
  );
}
