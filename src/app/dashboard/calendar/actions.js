"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

function getStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 89);
  return date.toISOString().slice(0, 10);
}

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

export async function getCalendarImpactData() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, data: [] };
  }

  const { data, error } = await supabase
    .from("daily_impact_summary")
    .select(
      "impact_date, total_tasks, completed_tasks, completion_percentage, journal_submitted",
    )
    .eq("user_id", user.id)
    .gte("impact_date", getStartDate())
    .order("impact_date", { ascending: true });

  if (error) {
    return { error: "تعذر تحميل تقويم الأثر.", data: [] };
  }

  return { data: data || [] };
}
