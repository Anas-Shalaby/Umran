import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTasksForToday, getUpcomingTasks } from "./actions";
import { DashboardShell } from "./dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded, display_name, phone, ultimate_purpose")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/dashboard/onboarding");
  }

  const [tasksResult, upcomingResult] = await Promise.all([
    getTasksForToday(),
    getUpcomingTasks(),
  ]);
  const userDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "";
  const ultimatePurpose = profile?.ultimate_purpose || "";
  const todayLabel = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <DashboardShell
      todayLabel={todayLabel}
      userDisplayName={userDisplayName}
      ultimatePurpose={ultimatePurpose}
      initialTasks={tasksResult.tasks || []}
      initialFixedHabits={tasksResult.fixedHabits || []}
      initialUpcomingTasks={upcomingResult.tasks || []}
      tasksError={tasksResult.error || upcomingResult.error}
    />
  );
}
