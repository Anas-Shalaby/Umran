import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PurposeOnboarding } from "./purpose-onboarding";

export const dynamic = "force-dynamic";

export default async function UltimatePurposeOnboardingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ultimate_purpose, display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.display_name || !profile?.phone) {
    redirect("/profile/setup");
  }

  if (profile?.ultimate_purpose?.trim()) {
    redirect("/dashboard");
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-zinc-950 text-start text-zinc-50"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.07),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(24,24,27,0.9),transparent_60%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
        <PurposeOnboarding />
      </div>
    </main>
  );
}
