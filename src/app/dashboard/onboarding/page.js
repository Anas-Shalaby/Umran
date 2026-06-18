import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded, ultimate_purpose")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.has_onboarded) {
    redirect("/dashboard");
  }

  if (!profile?.ultimate_purpose?.trim()) {
    redirect("/onboarding");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/80 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <div className="absolute left-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-lg font-black text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
            ع
          </div>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            مرحباً بك في عُمران
          </p>
          <h2 className="mt-1 text-xl font-black text-zinc-900 dark:text-zinc-50">
            لنُهيّئ يومك في دقائق
          </h2>
        </div>

        <OnboardingWizard savedPurpose={profile?.ultimate_purpose || ""} />
      </div>
    </main>
  );
}
