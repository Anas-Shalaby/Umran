import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CreateCampForm } from "../create-camp-form";

export const dynamic = "force-dynamic";

export default async function CreateCampPage() {
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
      <div className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <DashboardSidebar
          activeHref="/dashboard/camps"
          userName={userDisplayName}
        />

        <section className="flex min-h-[calc(100vh-2rem)] flex-1 items-start justify-center rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:p-10">
          <CreateCampForm />
        </section>
      </div>
    </main>
  );
}
