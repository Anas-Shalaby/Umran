import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SettingsPanel } from "./settings-panel";

export const dynamic = "force-dynamic";

function getConnectedApp(user, provider) {
  const identity = user.identities?.find((item) => item.provider === provider);

  return {
    connected: Boolean(identity),
    email: identity?.identity_data?.email || user.email || "",
    canUnlink: Boolean(identity) && (user.identities?.length || 0) > 1,
  };
}

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, has_onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/dashboard/onboarding");
  }

  const { data: fixedHabits } = await supabase
    .from("fixed_habits")
    .select("id, habit_name, prayer_anchor, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-surface-canvas text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full  flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <DashboardSidebar activeHref="/dashboard/settings" />

        <section className="min-h-[calc(100vh-2rem)] flex-1 rounded-[2rem] border border-zinc-200/80 bg-surface-elevated p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:p-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                إعدادات الحساب
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
                إدارة هويتك الرقمية وتعديل مرتكزاتك الثابتة.
              </p>
            </div>

            <SettingsPanel
              initialDisplayName={profile?.display_name || ""}
              initialFixedHabits={fixedHabits || []}
              initialNewsletterSubscribed={
                user.user_metadata?.newsletter_subscribed === true
              }
              connectedApps={{
                google: getConnectedApp(user, "google"),
                linkedin: getConnectedApp(user, "linkedin_oidc"),
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
