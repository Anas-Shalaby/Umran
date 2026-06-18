import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.")}`,
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("تعذر إكمال تسجيل الدخول. حاول مرة أخرى.")}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone, has_onboarded, ultimate_purpose")
    .eq("id", user.id)
    .maybeSingle();

  const requestedNext = searchParams.get("next");
  const needsProfileSetup = !profile?.display_name || !profile?.phone;

  if (needsProfileSetup) {
    return NextResponse.redirect(`${origin}/profile/setup`);
  }

  let next = "/dashboard";
  if (!profile?.ultimate_purpose?.trim()) {
    next = "/onboarding";
  } else if (!profile?.has_onboarded) {
    next = "/dashboard/onboarding";
  } else if (requestedNext?.startsWith("/")) {
    next = requestedNext;
  }

  return NextResponse.redirect(`${origin}${next}`);
}
