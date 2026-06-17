"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCurrentPrayerAnchor } from "../prayer-time";

const GOAL_FIELDS = "id, user_id, title, is_completed, created_at";
const GOAL_TASK_FIELDS =
  "id, user_id, goal_id, task_name, is_completed, created_at";

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

export async function createGoal(title) {
  const cleanTitle = String(title || "").trim();

  if (!cleanTitle) {
    return { error: "اكتب عنوان الهدف أولاً." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: cleanTitle,
      is_completed: false,
    })
    .select(GOAL_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر إنشاء الهدف. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/goals");
  return { goal: { ...data, tasks: [] } };
}

export async function getGoalsWithTasks() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, goals: [] };
  }

  const { data, error } = await supabase
    .from("goals")
    .select(
      `
      ${GOAL_FIELDS},
      tasks:tasks (
        ${GOAL_TASK_FIELDS}
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "تعذر تحميل الأهداف.", goals: [] };
  }

  const goals = (data || []).map((goal) => ({
    ...goal,
    tasks: (goal.tasks || []).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  }));

  return { goals };
}

export async function addTaskToGoal(goalId, taskTitle) {
  const cleanGoalId = String(goalId || "").trim();
  const cleanTitle = String(taskTitle || "").trim();

  if (!cleanGoalId) {
    return { error: "لم يتم تحديد الهدف." };
  }

  if (!cleanTitle) {
    return { error: "اكتب خطوة عملية أولاً." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id")
    .eq("id", cleanGoalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (goalError || !goal) {
    return { error: "لم يُعثر على هذا الهدف." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      goal_id: cleanGoalId,
      task_name: cleanTitle,
      is_completed: false,
      prayer_anchor: getCurrentPrayerAnchor(),
    })
    .select(GOAL_TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر إضافة الخطوة." };
  }

  revalidatePath("/dashboard/goals");
  return { task: data };
}

export async function toggleGoalStatus(goalId, isCompleted) {
  const cleanGoalId = String(goalId || "").trim();

  if (!cleanGoalId) {
    return { error: "لم يتم تحديد الهدف." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("goals")
    .update({ is_completed: Boolean(isCompleted) })
    .eq("id", cleanGoalId)
    .eq("user_id", user.id)
    .select(GOAL_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر تحديث حالة الهدف." };
  }

  revalidatePath("/dashboard/goals");
  return { goal: data };
}

export async function deleteGoal(goalId) {
  const cleanGoalId = String(goalId || "").trim();

  if (!cleanGoalId) {
    return { error: "لم يتم تحديد الهدف." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", cleanGoalId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف الهدف. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/goals");
  return { success: true };
}

export async function toggleGoalTask(taskId, isCompleted) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد الخطوة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ is_completed: Boolean(isCompleted) })
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .not("goal_id", "is", null)
    .select(GOAL_TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر تحديث الخطوة." };
  }

  revalidatePath("/dashboard/goals");
  return { task: data };
}
