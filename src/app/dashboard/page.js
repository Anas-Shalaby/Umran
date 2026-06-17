import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTasksForToday } from "./actions";
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
    .select("has_onboarded, display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/dashboard/onboarding");
  }

  const tasksResult = await getTasksForToday();
  const userDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "";
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
      initialTasks={tasksResult.tasks || []}
      initialFixedHabits={tasksResult.fixedHabits || []}
      tasksError={tasksResult.error}
    />
  );
}
