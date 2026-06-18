"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function saveUltimatePurpose(purposeText) {
  const cleanPurpose = String(purposeText || "").trim();

  if (!cleanPurpose) {
    return { error: "اكتب غايتك الكبرى بصدق قبل المتابعة." };
  }

  if (cleanPurpose.length < 8) {
    return { error: "خذ لحظة أطول لتعبير غايتك بوضوح." };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "يجب تسجيل الدخول أولاً." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ultimate_purpose: cleanPurpose })
    .eq("id", user.id);

  if (error) {
    return { error: "تعذر حفظ غايتك. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  redirect("/dashboard");
}
