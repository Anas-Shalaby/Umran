"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCurrentPrayerAnchor, getLocalTodayDate } from "../prayer-time";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const BACKLOG_AREAS = ["work", "study", "life"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BACKLOG_FIELDS =
  "id, user_id, task_name, status, backlog_area, prayer_anchor, is_completed, task_date, created_at";

function resolvePrayerAnchor(candidate) {
  const cleanAnchor = String(candidate || "").trim();
  if (PRAYER_ANCHORS.includes(cleanAnchor)) return cleanAnchor;
  return getCurrentPrayerAnchor();
}

function resolveTaskDate(candidate) {
  const cleanDate = String(candidate || "").trim();
  if (DATE_PATTERN.test(cleanDate)) return cleanDate;
  return getLocalTodayDate();
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

export async function getBacklogTasks() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, tasks: [] };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(BACKLOG_FIELDS)
    .eq("user_id", user.id)
    .eq("status", "backlog")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "تعذر تحميل مُستودع الثغور.", tasks: [] };
  }

  return { tasks: data || [] };
}

export async function addBacklogTask(taskName, backlogArea, prayerAnchor) {
  const cleanTaskName = String(taskName || "").trim();
  const cleanArea = String(backlogArea || "").trim();
  const provisionalAnchor = resolvePrayerAnchor(prayerAnchor);

  if (!cleanTaskName) {
    return { error: "اكتب فكرتك أو مهمتك أولاً." };
  }

  if (!BACKLOG_AREAS.includes(cleanArea)) {
    return { error: "اختر تصنيفاً صحيحاً للثغر." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      task_name: cleanTaskName,
      status: "backlog",
      backlog_area: cleanArea,
      prayer_anchor: provisionalAnchor,
      is_completed: false,
    })
    .select(BACKLOG_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر حفظ الثغر في المستودع." };
  }

  revalidatePath("/dashboard/backlog");
  return { task: data };
}

export async function activateBacklogTask(taskId, prayerAnchor, taskDate) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد الثغر." };
  }

  const currentPrayerAnchor = resolvePrayerAnchor(prayerAnchor);
  const today = resolveTaskDate(taskDate);

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: backlogTask, error: fetchError } = await supabase
    .from("tasks")
    .select(BACKLOG_FIELDS)
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .eq("status", "backlog")
    .maybeSingle();

  if (fetchError || !backlogTask) {
    return { error: "لم يُعثر على هذا الثغر في المستودع." };
  }

  const [{ data: fixedHabits }, { data: todayTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("fixed_habits")
        .select("habit_name, prayer_anchor")
        .eq("user_id", user.id),
      supabase
        .from("tasks")
        .select("id, task_name, prayer_anchor, status, task_date")
        .eq("user_id", user.id)
        .eq("task_date", today)
        .neq("status", "backlog"),
    ]);

  if (tasksError) {
    return { error: "تعذر التحقق من مهام اليوم." };
  }

  const customTaskCount = (todayTasks || []).filter(
    (task) => !isFixedHabitTask(task, fixedHabits || []),
  ).length;

  if (customTaskCount >= 3) {
    return {
      error:
        "وصلت إلى ثلاث مهام دنيوية لليوم. أنجز ثغورك الحالية قبل تفعيل ثغر جديد.",
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "active",
      task_date: today,
      prayer_anchor: currentPrayerAnchor,
      is_completed: false,
    })
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .eq("status", "backlog")
    .select(BACKLOG_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر تفعيل الثغر لليوم." };
  }

  revalidatePath("/dashboard/backlog");
  revalidatePath("/dashboard");
  return { task: data, prayerAnchor: currentPrayerAnchor };
}
