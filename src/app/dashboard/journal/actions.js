"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const JOURNAL_FIELDS =
  "id, user_id, proud_accomplishment, biggest_distraction, tomorrow_note, journal_date, created_at";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

export async function getTodayJournal() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, journal: null };
  }

  const { data, error } = await supabase
    .from("journals")
    .select(JOURNAL_FIELDS)
    .eq("user_id", user.id)
    .eq("journal_date", getTodayDate())
    .maybeSingle();

  if (error) {
    return { error: "تعذر تحميل كُناشة اليوم.", journal: null };
  }

  return { journal: data };
}

export async function submitJournal(proud, distraction, note) {
  const proudAccomplishment = String(proud || "").trim();
  const biggestDistraction = String(distraction || "").trim();
  const tomorrowNote = String(note || "").trim();

  if (!proudAccomplishment) {
    return { error: "اكتب ما أفتخر به اليوم في بوابة الحمد." };
  }

  if (!biggestDistraction) {
    return { error: "حدّد المشتت الأكبر في رصد الثغرات." };
  }

  if (!tomorrowNote) {
    return { error: "اكتب رسالة الفجر لنفسك قبل الإغلاق." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("journals")
    .insert({
      user_id: user.id,
      proud_accomplishment: proudAccomplishment,
      biggest_distraction: biggestDistraction,
      tomorrow_note: tomorrowNote,
      journal_date: getTodayDate(),
    })
    .select(JOURNAL_FIELDS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "لقد أغلقت دفتر اليوم بالفعل. لا يمكن إرسال أكثر من كُناشة واحدة يومياً." };
    }

    return { error: "تعذر حفظ كُناشة الليل. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/journal");
  return { journal: data };
}
