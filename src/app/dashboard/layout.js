import { redirect } from "next/navigation";
import { DashboardAddTaskFab } from "@/components/dashboard/dashboard-add-task-fab";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { NavigationProgressBar } from "@/components/navigation-progress-bar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ultimate_purpose")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.ultimate_purpose?.trim()) {
      redirect("/onboarding");
    }
  }

  return (
    <NotificationsProvider>
      <NavigationProgressBar />
      {children}
      <DashboardAddTaskFab />
    </NotificationsProvider>
  );
}
