import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { getCalendarImpactData } from "./actions";
import { ImpactCalendar } from "./impact-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.has_onboarded) {
    redirect("/dashboard/onboarding");
  }

  const impactResult = await getCalendarImpactData();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-surface-canvas text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <DashboardSidebar activeHref="/dashboard/calendar" />

        <section className="min-h-[calc(100vh-2rem)] flex-1 rounded-[2rem] border border-zinc-200/80 bg-surface-elevated p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                تقويم الأثر
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-8 text-zinc-500 dark:text-zinc-400">
                أثر صِيَك وثغورك على مدار الأيام. الاستمرارية هي بناء النواة
                الحقيقية.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-8">
              {impactResult.error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                  {impactResult.error}
                </p>
              ) : (
                <ImpactCalendar impactData={impactResult.data} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
