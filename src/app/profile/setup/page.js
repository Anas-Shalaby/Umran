import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileSetupForm } from "./profile-setup-form";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main
      dir="rtl"
      className="relative min-h-screen bg-zinc-50/50 px-5 py-8 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8"
    >
      <div className="absolute left-5 top-8 sm:left-6 lg:left-8">
        <ThemeToggle />
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="w-full rounded-[2rem] border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12 lg:p-16">
          <div className="mx-auto max-w-md">
            <div className="mb-10 text-center">
              <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                عُمران
              </p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                أكمل بيانات ظهورك
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
                اختر الاسم الذي تريد أن يراك به أعضاء الفوج، وأضف رقم هاتفك
                لتجهيز حسابك بالكامل.
              </p>
            </div>

            <ProfileSetupForm
              initialDisplayName={
                profile?.display_name ||
                user.user_metadata?.display_name ||
                user.user_metadata?.name ||
                ""
              }
              initialPhone={profile?.phone || ""}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
