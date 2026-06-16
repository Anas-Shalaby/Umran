"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "يجب تسجيل الدخول أولاً." };
  }

  return { supabase, user, error: null };
}

export async function updateProfileName(newName) {
  const displayName = String(newName || "").trim();

  if (!displayName) {
    return { error: "اكتب الاسم الكامل أولاً." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("id, display_name")
    .single();

  if (error) {
    return { error: "تعذر حفظ الاسم. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { profile: data };
}

export async function deleteFixedHabit(habitId) {
  const cleanHabitId = String(habitId || "").trim();

  if (!cleanHabitId) {
    return { error: "لم يتم تحديد العادة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase
    .from("fixed_habits")
    .delete()
    .eq("id", cleanHabitId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف العادة الروحية." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true, habitId: cleanHabitId };
}

export async function signOutUser() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "تعذر تسجيل الخروج. حاول مرة أخرى." };
  }

  redirect("/login");
}
