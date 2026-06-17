"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const TASK_FIELDS =
  "id, user_id, goal_id, task_name, prayer_anchor, is_completed, duration_minutes, task_date, created_at, goals:goals(title)";

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

function isFixedHabitTask(task, fixedHabits) {
  return fixedHabits.some(
    (habit) =>
      habit.habit_name === task.task_name &&
      habit.prayer_anchor === task.prayer_anchor,
  );
}

async function syncFixedHabitsToToday(
  supabase,
  userId,
  fixedHabits,
  todayTasks,
) {
  if (!fixedHabits.length) {
    return todayTasks;
  }

  const missingHabits = fixedHabits.filter(
    (habit) =>
      !todayTasks.some(
        (task) =>
          task.task_name === habit.habit_name &&
          task.prayer_anchor === habit.prayer_anchor,
      ),
  );

  if (!missingHabits.length) {
    return todayTasks;
  }

  const { data: insertedTasks, error } = await supabase
    .from("tasks")
    .insert(
      missingHabits.map((habit) => ({
        user_id: userId,
        task_name: habit.habit_name,
        prayer_anchor: habit.prayer_anchor,
        task_date: getTodayDate(),
        is_completed: false,
      })),
    )
    .select(TASK_FIELDS);

  if (error) {
    return todayTasks;
  }

  return [...todayTasks, ...(insertedTasks || [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}
export async function deleteTask(taskId) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد المهمة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", cleanTaskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف المهمة." };
  }

  revalidatePath("/dashboard");
  return { success: true, taskId: cleanTaskId };
}

export async function getFixedHabits() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, habits: [] };
  }

  const { data, error } = await supabase
    .from("fixed_habits")
    .select("id, user_id, habit_name, prayer_anchor, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: "تعذر تحميل الأوراد الراتبة.", habits: [] };
  }

  return { habits: data || [] };
}

export async function saveFixedHabit(habitName, prayerAnchor) {
  const cleanHabitName = String(habitName || "").trim();
  const cleanPrayerAnchor = String(prayerAnchor || "").trim();

  if (!cleanHabitName) {
    return { error: "اختر عادة روحية صحيحة." };
  }

  if (!PRAYER_ANCHORS.includes(cleanPrayerAnchor)) {
    return { error: "اختر وقتاً صحيحاً للعادة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("fixed_habits")
    .upsert(
      {
        user_id: user.id,
        habit_name: cleanHabitName,
        prayer_anchor: cleanPrayerAnchor,
      },
      { onConflict: "user_id,habit_name" },
    )
    .select("id, user_id, habit_name, prayer_anchor, created_at")
    .single();

  if (error) {
    return { error: "تعذر حفظ العادة الروحية." };
  }

  revalidatePath("/dashboard");
  return { habit: data };
}

export async function removeFixedHabit(habitName) {
  const cleanHabitName = String(habitName || "").trim();

  if (!cleanHabitName) {
    return { error: "لم يتم تحديد العادة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase
    .from("fixed_habits")
    .delete()
    .eq("user_id", user.id)
    .eq("habit_name", cleanHabitName);

  if (error) {
    return { error: "تعذر إزالة العادة الروحية." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getTasksForToday() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, tasks: [], fixedHabits: [] };
  }

  const { data: fixedHabits, error: habitsError } = await supabase
    .from("fixed_habits")
    .select("id, user_id, habit_name, prayer_anchor, created_at")
    .eq("user_id", user.id);

  if (habitsError) {
    return {
      error: "تعذر تحميل الأوراد الراتبة.",
      tasks: [],
      fixedHabits: [],
    };
  }

  const { data: todayTasks, error } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("user_id", user.id)
    .eq("task_date", getTodayDate())
    .order("created_at", { ascending: true });

  if (error) {
    return {
      error: "تعذر تحميل مهام اليوم. حاول تحديث الصفحة.",
      tasks: [],
      fixedHabits: fixedHabits || [],
    };
  }

  const syncedTasks = await syncFixedHabitsToToday(
    supabase,
    user.id,
    fixedHabits || [],
    todayTasks || [],
  );

  return {
    tasks: syncedTasks,
    fixedHabits: fixedHabits || [],
  };
}

export async function addTask(taskName, prayerAnchor) {
  const cleanTaskName = String(taskName || "").trim();
  const cleanPrayerAnchor = String(prayerAnchor || "").trim();

  if (!cleanTaskName) {
    return { error: "اكتب اسم المهمة أولاً." };
  }

  if (!PRAYER_ANCHORS.includes(cleanPrayerAnchor)) {
    return { error: "اختر وقتاً صحيحاً للمهمة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const [{ data: fixedHabits }, { data: todayTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("fixed_habits")
        .select("habit_name, prayer_anchor")
        .eq("user_id", user.id),
      supabase
        .from("tasks")
        .select(TASK_FIELDS)
        .eq("user_id", user.id)
        .eq("task_date", getTodayDate())
        .neq("status", "backlog"),
    ]);

  if (tasksError) {
    return { error: "تعذر التحقق من عدد مهام اليوم." };
  }

  const customTaskCount = (todayTasks || []).filter(
    (task) => !isFixedHabitTask(task, fixedHabits || []),
  ).length;

  if (customTaskCount >= 3) {
    return {
      error:
        "وصلت إلى ثلاث مهام دنيوية لليوم. ركز على ثغورك الثلاثة الأساسية لضمان أعلى مستويات التركيز.",
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      task_name: cleanTaskName,
      prayer_anchor: cleanPrayerAnchor,
      task_date: getTodayDate(),
      status: "active",
    })
    .select(TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر إضافة المهمة الآن." };
  }

  revalidatePath("/dashboard");
  return { task: data };
}

export async function completeFocusTask(taskId, durationMinutes) {
  const cleanTaskId = String(taskId || "").trim();
  const cleanDuration = Math.max(0, Math.round(Number(durationMinutes) || 0));

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد المهمة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      is_completed: true,
      duration_minutes: cleanDuration,
    })
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .select(TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر حفظ أثر التركيز." };
  }

  revalidatePath("/dashboard");
  return { task: data };
}

export async function toggleTask(taskId, currentState) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد المهمة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ is_completed: !currentState })
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .select(TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر تحديث حالة المهمة." };
  }

  revalidatePath("/dashboard");
  return { task: data };
}
