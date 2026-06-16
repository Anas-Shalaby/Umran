"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

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

export async function completeOnboarding(fixedHabitsArray, dailyTasksArray) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const habits = Array.isArray(fixedHabitsArray) ? fixedHabitsArray : [];
  const tasks = Array.isArray(dailyTasksArray) ? dailyTasksArray : [];

  const cleanedHabits = habits
    .map((habit) => ({
      habit_name: String(habit?.habit_name || "").trim(),
      prayer_anchor: String(habit?.prayer_anchor || "").trim(),
    }))
    .filter((habit) => habit.habit_name);

  for (const habit of cleanedHabits) {
    if (!PRAYER_ANCHORS.includes(habit.prayer_anchor)) {
      return { error: "وقت العادة الروحية غير صالح." };
    }
  }

  const cleanedTasks = tasks
    .map((task) => ({
      task_name: String(task?.task_name || "").trim(),
      prayer_anchor: String(task?.prayer_anchor || "dhuhr").trim(),
    }))
    .filter((task) => task.task_name);

  if (cleanedTasks.length !== 3) {
    return { error: "يجب كتابة ثغورك الثلاثة قبل الانطلاق." };
  }

  for (const task of cleanedTasks) {
    if (!PRAYER_ANCHORS.includes(task.prayer_anchor)) {
      return { error: "وقت المهمة غير صالح." };
    }
  }

  if (cleanedHabits.length) {
    const { error: habitsError } = await supabase.from("fixed_habits").upsert(
      cleanedHabits.map((habit) => ({
        user_id: user.id,
        habit_name: habit.habit_name,
        prayer_anchor: habit.prayer_anchor,
      })),
      { onConflict: "user_id,habit_name" },
    );

    if (habitsError) {
      return { error: "تعذر حفظ الأوراد الثابتة." };
    }

    const { error: habitTasksError } = await supabase.from("tasks").insert(
      cleanedHabits.map((habit) => ({
        user_id: user.id,
        task_name: habit.habit_name,
        prayer_anchor: habit.prayer_anchor,
        task_date: getTodayDate(),
        is_completed: false,
      })),
    );

    if (habitTasksError) {
      return { error: "تعذر مزامنة الأوراد مع جدول اليوم." };
    }
  }

  const { error: tasksError } = await supabase.from("tasks").insert(
    cleanedTasks.map((task) => ({
      user_id: user.id,
      task_name: task.task_name,
      prayer_anchor: task.prayer_anchor,
      task_date: getTodayDate(),
      is_completed: false,
    })),
  );

  if (tasksError) {
    return { error: "تعذر حفظ ثغورك الثلاثة." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ has_onboarded: true })
    .eq("id", user.id);

  if (profileError) {
    return { error: "تعذر إكمال الإعداد. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  redirect("/dashboard");
}
