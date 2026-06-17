"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRIORITY_LEVELS = ["critical", "medium", "normal"];
const GOAL_FIELDS = "id, user_id, title, is_completed, created_at";
const GOAL_TASK_FIELDS =
  "id, user_id, goal_id, task_name, description, is_completed, prayer_anchor, task_date, priority_level, expected_minutes, created_at";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function revalidateGoalPaths(goalId) {
  revalidatePath("/dashboard/goals");
  if (goalId) {
    revalidatePath(`/dashboard/goals/${goalId}`);
  }
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

export async function getGoalById(goalId) {
  const cleanGoalId = String(goalId || "").trim();

  if (!cleanGoalId) {
    return { error: "لم يتم تحديد الهدف.", goal: null };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, goal: null };
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
    .eq("id", cleanGoalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return { error: "لم يُعثر على هذا الهدف.", goal: null };
  }

  return {
    goal: {
      ...data,
      tasks: (data.tasks || []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    },
  };
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
    return { error: error.message || "تعذر تحميل الأهداف.", goals: [] };
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

function normalizeTaskPayload(formData) {
  const taskName = String(formData?.task_name || "").trim();
  const description = String(formData?.description || "").trim();
  const prayerValue = String(formData?.prayer_anchor || "fajr").trim();
  const priorityLevel = String(formData?.priority_level || "normal").trim();
  const rawMinutes = String(formData?.expected_minutes ?? "").trim();
  const parsedMinutes = rawMinutes ? Number.parseInt(rawMinutes, 10) : null;

  const prayerAnchor = PRAYER_ANCHORS.includes(prayerValue)
    ? prayerValue
    : "fajr";

  const priority_level = PRIORITY_LEVELS.includes(priorityLevel)
    ? priorityLevel
    : "normal";

  const expected_minutes =
    Number.isFinite(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : null;

  return {
    taskName,
    description: description || null,
    prayerAnchor,
    priority_level,
    expected_minutes,
  };
}

export async function saveGoalTask(goalId, formData, taskId = null) {
  const cleanGoalId = String(goalId || "").trim();
  const cleanTaskId = taskId ? String(taskId).trim() : "";

  if (!cleanGoalId) {
    return { error: "لم يتم تحديد الهدف." };
  }

  const {
    taskName,
    description,
    prayerAnchor,
    priority_level,
    expected_minutes,
  } = normalizeTaskPayload(formData);

  if (!taskName) {
    return { error: "اسم الثغرة مطلوب." };
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

  const payload = {
    task_name: taskName,
    description,
    priority_level,
    expected_minutes,
    prayer_anchor: prayerAnchor,
  };

  if (cleanTaskId) {
    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", cleanTaskId)
      .eq("user_id", user.id)
      .eq("goal_id", cleanGoalId)
      .select(GOAL_TASK_FIELDS)
      .single();

    if (error) {
      return { error: "تعذر تحديث الثغرة." };
    }

    revalidateGoalPaths(cleanGoalId);
    revalidatePath("/dashboard");
    return { task: data };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      goal_id: cleanGoalId,
      is_completed: false,
      ...payload,
    })
    .select(GOAL_TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر إضافة الثغرة." };
  }

  revalidateGoalPaths(cleanGoalId);
  return { task: data };
}

export async function deleteGoalTask(taskId) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد الثغرة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: taskRow, error: taskLookupError } = await supabase
    .from("tasks")
    .select("goal_id")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskLookupError || !taskRow?.goal_id) {
    return { error: "لم يُعثر على هذه الثغرة." };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", cleanTaskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف الثغرة." };
  }

  revalidateGoalPaths(taskRow.goal_id);
  revalidatePath("/dashboard");
  return { success: true, goalId: taskRow.goal_id };
}

export async function addTaskToGoal(goalId, taskTitle) {
  return saveGoalTask(goalId, {
    task_name: taskTitle,
    description: "",
    prayer_anchor: "fajr",
    priority_level: "normal",
    expected_minutes: "",
  });
}

export async function activateGoalTaskForToday(taskId, prayerAnchor) {
  const cleanTaskId = String(taskId || "").trim();
  const cleanAnchor = String(prayerAnchor || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد الثغرة." };
  }

  if (!PRAYER_ANCHORS.includes(cleanAnchor)) {
    return { error: "وقت الصلاة غير صالح." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: taskRow, error: taskLookupError } = await supabase
    .from("tasks")
    .select("goal_id")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskLookupError || !taskRow?.goal_id) {
    return { error: "لم يُعثر على هذه الثغرة." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      prayer_anchor: cleanAnchor,
      task_date: getTodayDate(),
    })
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .not("goal_id", "is", null)
    .select(GOAL_TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر إرسال الثغرة إلى يومك." };
  }

  revalidateGoalPaths(taskRow.goal_id);
  revalidatePath("/dashboard");
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

  revalidateGoalPaths(cleanGoalId);
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

  revalidateGoalPaths(cleanGoalId);
  return { success: true };
}

export async function toggleGoalTask(taskId, isCompleted) {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد الثغرة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: taskRow, error: taskLookupError } = await supabase
    .from("tasks")
    .select("goal_id")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskLookupError || !taskRow?.goal_id) {
    return { error: "لم يُعثر على هذه الثغرة." };
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
    return { error: "تعذر تحديث الثغرة." };
  }

  revalidateGoalPaths(taskRow.goal_id);
  revalidatePath("/dashboard");
  return { task: data };
}
