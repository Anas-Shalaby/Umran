import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { CampsHub } from "./camps-hub";
import { getActiveCamps, getUserCamps } from "./actions";

export const dynamic = "force-dynamic";

function mergeCampsWithParticipation(camps, participations) {
  const participationByCampId = new Map(
    participations.map((item) => [item.campId, item]),
  );

  return camps.map((camp) => {
    const participation = participationByCampId.get(camp.id);

    return {
      ...camp,
      joined: Boolean(participation),
      contributionMinutes: participation?.contributionMinutes ?? null,
      progressPercent: camp.progressPercent ?? 0,
    };
  });
}

export default async function CampsPage() {
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

  const [campsResult, userCampsResult] = await Promise.all([
    getActiveCamps(),
    getUserCamps(),
  ]);

  const userDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    "";

  const camps = mergeCampsWithParticipation(
    campsResult.camps,
    userCampsResult.participations,
  );

  const error = campsResult.error || userCampsResult.error;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-surface-canvas text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="mx-auto flex min-h-screen w-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <DashboardSidebar
          activeHref="/dashboard/camps"
          userName={userDisplayName}
        />

        <section className="min-h-[calc(100vh-2rem)] flex-1 rounded-[2rem] border border-zinc-200/80 bg-surface-elevated p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:p-10">
          {error ? (
            <p className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
              {error}
            </p>
          ) : (
            <CampsHub initialCamps={camps} />
          )}
        </section>
      </div>
    </main>
  );
}
