"use server";

import { revalidatePath } from "next/cache";
import { getLocalTodayDate } from "@/app/dashboard/prayer-time";
import {
  RECURRENCE_TYPES,
  validateRecurrenceInput,
} from "@/lib/tasks/recurrence";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRIORITY_LEVELS = ["critical", "medium", "normal"];
const GOAL_FIELDS = "id, user_id, title, is_completed, created_at";
const GOAL_TASK_FIELDS =
  "id, user_id, goal_id, task_name, description, is_completed, prayer_anchor, task_date, priority_level, expected_minutes, created_at, recurrence_rule_id, recurrence_rule:task_recurrence_rules(recurrence_type, recurrence_weekdays)";
const RECURRENCE_RULE_FIELDS =
  "id, user_id, task_name, prayer_anchor, scheduled_time, recurrence_type, recurrence_weekdays, starts_on, recurrence_skipped_dates, is_active, created_at";

function getTodayDate() {
  return getLocalTodayDate();
}

async function appendSkippedRecurrenceDate(supabase, ruleId, userId, dateStr) {
  if (!dateStr) return;

  const { data: rule, error: fetchError } = await supabase
    .from("task_recurrence_rules")
    .select("recurrence_skipped_dates")
    .eq("id", ruleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !rule) {
    throw new Error(fetchError?.message || "تعذر تحديث قاعدة التكرار.");
  }

  const skipped = rule.recurrence_skipped_dates || [];
  if (skipped.includes(dateStr)) {
    return;
  }

  const { error } = await supabase
    .from("task_recurrence_rules")
    .update({ recurrence_skipped_dates: [...skipped, dateStr] })
    .eq("id", ruleId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
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
  const recurrenceValidation = validateRecurrenceInput(
    formData?.recurrence_type,
    formData?.recurrence_weekdays,
  );

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
    recurrenceValidation,
    editScope: formData?.edit_scope === "rule" ? "rule" : "instance",
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
    recurrenceValidation,
    editScope,
  } = normalizeTaskPayload(formData);

  if (!taskName) {
    return { error: "اسم الثغرة مطلوب." };
  }

  if (!recurrenceValidation.valid) {
    return { error: recurrenceValidation.error };
  }

  const cleanRecurrenceType = recurrenceValidation.type;
  const cleanRecurrenceWeekdays = recurrenceValidation.weekdays || [];
  const wantsRecurrence = cleanRecurrenceType !== RECURRENCE_TYPES.NONE;
  const cleanEditScope = editScope === "rule" ? "rule" : "instance";
  const today = getTodayDate();

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
    const { data: existingTask, error: existingError } = await supabase
      .from("tasks")
      .select(GOAL_TASK_FIELDS)
      .eq("id", cleanTaskId)
      .eq("user_id", user.id)
      .eq("goal_id", cleanGoalId)
      .maybeSingle();

    if (existingError || !existingTask) {
      return { error: "لم يُعثر على هذه الثغرة." };
    }

    const hadRecurrence = Boolean(existingTask.recurrence_rule_id);

    if (
      hadRecurrence &&
      cleanEditScope === "instance" &&
      existingTask.recurrence_rule_id
    ) {
      try {
        await appendSkippedRecurrenceDate(
          supabase,
          existingTask.recurrence_rule_id,
          user.id,
          existingTask.task_date,
        );
      } catch {
        return { error: "تعذر فصل هذه الثغرة عن التكرار." };
      }
    }

    let recurrenceRuleId = existingTask.recurrence_rule_id;

    if (cleanEditScope === "rule" && wantsRecurrence) {
      if (hadRecurrence && existingTask.recurrence_rule_id) {
        const { error: ruleUpdateError } = await supabase
          .from("task_recurrence_rules")
          .update({
            task_name: taskName,
            prayer_anchor: prayerAnchor,
            recurrence_type: cleanRecurrenceType,
            recurrence_weekdays:
              cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
                ? cleanRecurrenceWeekdays
                : null,
          })
          .eq("id", existingTask.recurrence_rule_id)
          .eq("user_id", user.id);

        if (ruleUpdateError) {
          return { error: "تعذر تحديث قاعدة التكرار." };
        }

        recurrenceRuleId = existingTask.recurrence_rule_id;

        const { error: bulkUpdateError } = await supabase
          .from("tasks")
          .update({
            task_name: taskName,
            prayer_anchor: prayerAnchor,
            priority_level,
            expected_minutes,
            description,
          })
          .eq("user_id", user.id)
          .eq("recurrence_rule_id", existingTask.recurrence_rule_id)
          .gte("task_date", today);

        if (bulkUpdateError) {
          return { error: "تعذر تحديث نسخ التكرار القادمة." };
        }
      } else {
        const { data: newRule, error: createRuleError } = await supabase
          .from("task_recurrence_rules")
          .insert({
            user_id: user.id,
            task_name: taskName,
            prayer_anchor: prayerAnchor,
            recurrence_type: cleanRecurrenceType,
            recurrence_weekdays:
              cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
                ? cleanRecurrenceWeekdays
                : null,
            starts_on: today,
          })
          .select(RECURRENCE_RULE_FIELDS)
          .single();

        if (createRuleError || !newRule) {
          return { error: "تعذر إنشاء قاعدة التكرار." };
        }

        recurrenceRuleId = newRule.id;
      }
    } else if (cleanEditScope === "rule" && !wantsRecurrence && hadRecurrence) {
      const { error: deactivateError } = await supabase
        .from("task_recurrence_rules")
        .update({ is_active: false })
        .eq("id", existingTask.recurrence_rule_id)
        .eq("user_id", user.id);

      if (deactivateError) {
        return { error: "تعذر إيقاف التكرار." };
      }

      recurrenceRuleId = null;
    } else if (cleanEditScope === "instance") {
      recurrenceRuleId = wantsRecurrence ? existingTask.recurrence_rule_id : null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...payload,
        recurrence_rule_id:
          cleanEditScope === "instance" && hadRecurrence
            ? null
            : wantsRecurrence
              ? recurrenceRuleId
              : null,
      })
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

  let recurrenceRuleId = null;

  if (wantsRecurrence) {
    const { data: rule, error: ruleError } = await supabase
      .from("task_recurrence_rules")
      .insert({
        user_id: user.id,
        task_name: taskName,
        prayer_anchor: prayerAnchor,
        recurrence_type: cleanRecurrenceType,
        recurrence_weekdays:
          cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
            ? cleanRecurrenceWeekdays
            : null,
        starts_on: today,
      })
      .select(RECURRENCE_RULE_FIELDS)
      .single();

    if (ruleError || !rule) {
      return { error: "تعذر إنشاء قاعدة التكرار." };
    }

    recurrenceRuleId = rule.id;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      goal_id: cleanGoalId,
      is_completed: false,
      recurrence_rule_id: recurrenceRuleId,
      ...payload,
    })
    .select(GOAL_TASK_FIELDS)
    .single();

  if (error) {
    if (recurrenceRuleId) {
      await supabase
        .from("task_recurrence_rules")
        .delete()
        .eq("id", recurrenceRuleId)
        .eq("user_id", user.id);
    }
    return { error: "تعذر إضافة الثغرة." };
  }

  revalidateGoalPaths(cleanGoalId);
  revalidatePath("/dashboard");
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
    .select("goal_id, recurrence_rule_id")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskLookupError || !taskRow?.goal_id) {
    return { error: "لم يُعثر على هذه الثغرة." };
  }

  if (taskRow.recurrence_rule_id) {
    const today = getTodayDate();

    await supabase
      .from("task_recurrence_rules")
      .update({ is_active: false })
      .eq("id", taskRow.recurrence_rule_id)
      .eq("user_id", user.id);

    await supabase
      .from("tasks")
      .delete()
      .eq("user_id", user.id)
      .eq("recurrence_rule_id", taskRow.recurrence_rule_id)
      .gte("task_date", today)
      .eq("is_completed", false)
      .neq("id", cleanTaskId);
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
