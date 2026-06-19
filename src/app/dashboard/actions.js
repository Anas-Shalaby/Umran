"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";

import { getLocalTodayDate } from "@/app/dashboard/prayer-time";
import {
  RECURRENCE_TYPES,
  buildDateRange,
  filterTasksForUpcomingSection,
  getNextCalendarWeekBounds,
  shouldOccurOnDate,
  validateRecurrenceInput,
} from "@/lib/tasks/recurrence";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const TASK_FIELDS =
  "id, user_id, goal_id, task_name, prayer_anchor, is_completed, duration_minutes, task_date, scheduled_time, created_at, source_camp_task_id, recurrence_rule_id, recurrence_rule:task_recurrence_rules(recurrence_type, recurrence_weekdays), goals:goals(title)";

const RECURRENCE_RULE_FIELDS =
  "id, user_id, task_name, prayer_anchor, scheduled_time, recurrence_type, recurrence_weekdays, starts_on, recurrence_skipped_dates, is_active, created_at";

function getTodayDate() {
  return getLocalTodayDate();
}

function parseScheduledTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function isValidTaskDate(taskDate) {
  return /^\d{4}-\d{2}-\d{2}$/.test(taskDate);
}

function isFixedHabitTask(task, fixedHabits) {
  return (fixedHabits || []).some(
    (habit) =>
      habit.habit_name === task.task_name &&
      habit.prayer_anchor === task.prayer_anchor,
  );
}

function sortTasksBySchedule(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = a.scheduled_time || "";
    const bTime = b.scheduled_time || "";

    if (aTime && bTime && aTime !== bTime) {
      return aTime.localeCompare(bTime);
    }

    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

async function fetchUserFixedHabits(supabase, userId) {
  const { data } = await supabase
    .from("fixed_habits")
    .select("id, user_id, habit_name, prayer_anchor, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return data || [];
}

async function mutateFixedHabitForTask(
  supabase,
  userId,
  { wasFixed, willBeFixed, previousName, nextName, nextAnchor },
) {
  if (wasFixed && previousName && (previousName !== nextName || !willBeFixed)) {
    const { error } = await supabase
      .from("fixed_habits")
      .delete()
      .eq("user_id", userId)
      .eq("habit_name", previousName);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (willBeFixed) {
    const { error } = await supabase.from("fixed_habits").upsert(
      {
        user_id: userId,
        habit_name: nextName,
        prayer_anchor: nextAnchor,
      },
      { onConflict: "user_id,habit_name" },
    );

    if (error) {
      throw new Error(error.message);
    }
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

function sortSyncedTodayTasks(tasks) {
  const grouped = new Map();

  for (const task of tasks) {
    const anchor = task.prayer_anchor || "dhuhr";
    if (!grouped.has(anchor)) {
      grouped.set(anchor, []);
    }
    grouped.get(anchor).push(task);
  }

  return PRAYER_ANCHORS.flatMap((anchor) =>
    sortTasksBySchedule(grouped.get(anchor) || []),
  );
}

function countCustomTasksForDate(tasks, fixedHabits, dateStr) {
  return (tasks || []).filter(
    (task) =>
      task.task_date === dateStr &&
      !task.source_camp_task_id &&
      !isFixedHabitTask(task, fixedHabits),
  ).length;
}

async function appendSkippedRecurrenceDate(supabase, ruleId, userId, dateStr) {
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

async function syncRecurrenceRules(
  supabase,
  userId,
  dateStrings,
  existingTasks = [],
  fixedHabits = [],
  allowedRecurrenceTypes = [RECURRENCE_TYPES.DAILY, RECURRENCE_TYPES.WEEKLY],
) {
  if (!dateStrings.length) {
    return existingTasks;
  }

  const { data: rules, error: rulesError } = await supabase
    .from("task_recurrence_rules")
    .select(RECURRENCE_RULE_FIELDS)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (rulesError || !rules?.length) {
    return existingTasks;
  }

  const tasksByDate = new Map();
  for (const task of existingTasks) {
    if (!tasksByDate.has(task.task_date)) {
      tasksByDate.set(task.task_date, []);
    }
    tasksByDate.get(task.task_date).push(task);
  }

  const toInsert = [];

  for (const dateStr of dateStrings) {
    const dayTasks = tasksByDate.get(dateStr) || [];

    for (const rule of rules) {
      if (!allowedRecurrenceTypes.includes(rule.recurrence_type)) continue;
      if (!shouldOccurOnDate(rule, dateStr)) continue;

      const exists = dayTasks.some(
        (task) => task.recurrence_rule_id === rule.id,
      );
      if (exists) continue;

      const isRuleFixedHabit = isFixedHabitTask(
        { task_name: rule.task_name, prayer_anchor: rule.prayer_anchor },
        fixedHabits,
      );

      if (
        !isRuleFixedHabit &&
        countCustomTasksForDate(dayTasks, fixedHabits, dateStr) >= 3
      ) {
        continue;
      }

      toInsert.push({
        user_id: userId,
        task_name: rule.task_name,
        prayer_anchor: rule.prayer_anchor,
        scheduled_time: rule.scheduled_time,
        task_date: dateStr,
        recurrence_rule_id: rule.id,
        is_completed: false,
      });
    }
  }

  if (!toInsert.length) {
    return existingTasks;
  }

  const { data: insertedTasks, error } = await supabase
    .from("tasks")
    .insert(toInsert)
    .select(TASK_FIELDS);

  if (error) {
    return existingTasks;
  }

  return [...existingTasks, ...(insertedTasks || [])];
}

export async function deleteTask(taskId, deleteScope = "instance") {
  const cleanTaskId = String(taskId || "").trim();

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد المهمة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, task_name, prayer_anchor, task_date, recurrence_rule_id")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!task) {
    return { error: "المهمة غير موجودة." };
  }

  const fixedHabits = await fetchUserFixedHabits(supabase, user.id);
  const wasFixed = isFixedHabitTask(task, fixedHabits);
  const cleanDeleteScope = deleteScope === "rule" ? "rule" : "instance";
  const today = getTodayDate();

  if (task.recurrence_rule_id && cleanDeleteScope === "rule") {
    const { error: deactivateError } = await supabase
      .from("task_recurrence_rules")
      .update({ is_active: false })
      .eq("id", task.recurrence_rule_id)
      .eq("user_id", user.id);

    if (deactivateError) {
      return { error: "تعذر إيقاف التكرار." };
    }

    const { error: bulkDeleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("user_id", user.id)
      .eq("recurrence_rule_id", task.recurrence_rule_id)
      .gte("task_date", today)
      .eq("is_completed", false);

    if (bulkDeleteError) {
      return { error: "تعذر حذف نسخ التكرار القادمة." };
    }
  } else {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", cleanTaskId)
      .eq("user_id", user.id);

    if (error) {
      return { error: "تعذر حذف المهمة." };
    }

    if (task.recurrence_rule_id && task.task_date) {
      try {
        await appendSkippedRecurrenceDate(
          supabase,
          task.recurrence_rule_id,
          user.id,
          task.task_date,
        );
      } catch (skipError) {
        console.error("deleteTask recurrence skip:", skipError);
      }
    }
  }

  if (wasFixed) {
    try {
      await mutateFixedHabitForTask(supabase, user.id, {
        wasFixed: true,
        willBeFixed: false,
        previousName: task.task_name,
        nextName: task.task_name,
        nextAnchor: task.prayer_anchor,
      });
    } catch (habitError) {
      console.error("deleteTask fixed habit:", habitError);
    }
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    taskId: cleanTaskId,
    fixedHabits: await fetchUserFixedHabits(supabase, user.id),
  };
}

export async function updateTask(
  taskId,
  taskName,
  prayerAnchor,
  taskDate = null,
  scheduledTime = null,
  isFixedHabit = false,
  recurrenceType = RECURRENCE_TYPES.NONE,
  recurrenceWeekdays = [],
  editScope = "instance",
) {
  const cleanTaskId = String(taskId || "").trim();
  const cleanTaskName = String(taskName || "").trim();
  const cleanPrayerAnchor = String(prayerAnchor || "").trim();
  const cleanTaskDate = String(taskDate || getTodayDate()).trim();
  const cleanScheduledTime = parseScheduledTime(scheduledTime);
  const willBeFixed = Boolean(isFixedHabit);

  if (!cleanTaskId) {
    return { error: "لم يتم تحديد المهمة." };
  }

  if (!cleanTaskName) {
    return { error: "اكتب اسم المهمة أولاً." };
  }

  if (!PRAYER_ANCHORS.includes(cleanPrayerAnchor)) {
    return { error: "اختر وقتاً صحيحاً للمهمة." };
  }

  if (!isValidTaskDate(cleanTaskDate)) {
    return { error: "تاريخ المهمة غير صالح." };
  }

  if (cleanTaskDate < getTodayDate()) {
    return { error: "لا يمكن نقل المهمة إلى يوم ماضٍ." };
  }

  if (scheduledTime && !cleanScheduledTime) {
    return { error: "الوقت التذكيري غير صالح." };
  }

  const recurrenceValidation = validateRecurrenceInput(
    recurrenceType,
    recurrenceWeekdays,
  );

  if (!recurrenceValidation.valid) {
    return { error: recurrenceValidation.error };
  }

  const cleanRecurrenceType = recurrenceValidation.type;
  const cleanRecurrenceWeekdays = recurrenceValidation.weekdays || [];
  const cleanEditScope = editScope === "rule" ? "rule" : "instance";

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: existingTask, error: existingError } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError || !existingTask) {
    return { error: "المهمة غير موجودة." };
  }

  const fixedHabits = await fetchUserFixedHabits(supabase, user.id);
  const wasFixed = isFixedHabitTask(existingTask, fixedHabits);

  if (cleanTaskDate !== existingTask.task_date && !willBeFixed) {
    const { data: dateTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, task_name, prayer_anchor, source_camp_task_id")
      .eq("user_id", user.id)
      .eq("task_date", cleanTaskDate);

    if (tasksError) {
      return { error: "تعذر التحقق من عدد مهام اليوم المستهدف." };
    }

    const customTaskCount = (dateTasks || []).filter(
      (task) =>
        task.id !== cleanTaskId &&
        !task.source_camp_task_id &&
        !isFixedHabitTask(task, fixedHabits),
    ).length;

    if (customTaskCount >= 3) {
      return {
        error:
          cleanTaskDate === getTodayDate()
            ? "وصلت إلى ثلاث مهام دنيوية لليوم. ركز على ثغورك الثلاثة الأساسية."
            : "وصلت إلى ثلاث مهام مجدولة في هذا اليوم.",
      };
    }
  }

  try {
    await mutateFixedHabitForTask(supabase, user.id, {
      wasFixed,
      willBeFixed,
      previousName: existingTask.task_name,
      nextName: cleanTaskName,
      nextAnchor: cleanPrayerAnchor,
    });
  } catch (habitError) {
    return { error: "تعذر تحديث الورد الراتب." };
  }

  const today = getTodayDate();
  const hadRecurrence = Boolean(existingTask.recurrence_rule_id);
  const wantsRecurrence = cleanRecurrenceType !== RECURRENCE_TYPES.NONE;

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
    } catch (skipError) {
      return { error: "تعذر فصل هذه النسخة عن التكرار." };
    }
  }

  let recurrenceRuleId = existingTask.recurrence_rule_id;

  if (cleanEditScope === "rule" && wantsRecurrence) {
    if (hadRecurrence && existingTask.recurrence_rule_id) {
      const { error: ruleUpdateError } = await supabase
        .from("task_recurrence_rules")
        .update({
          task_name: cleanTaskName,
          prayer_anchor: cleanPrayerAnchor,
          scheduled_time: cleanScheduledTime,
          recurrence_type: cleanRecurrenceType,
          recurrence_weekdays:
            cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
              ? cleanRecurrenceWeekdays
              : null,
          starts_on: cleanTaskDate < today ? today : cleanTaskDate,
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
          task_name: cleanTaskName,
          prayer_anchor: cleanPrayerAnchor,
          scheduled_time: cleanScheduledTime,
          reminder_sent_at: null,
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
          task_name: cleanTaskName,
          prayer_anchor: cleanPrayerAnchor,
          scheduled_time: cleanScheduledTime,
          recurrence_type: cleanRecurrenceType,
          recurrence_weekdays:
            cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
              ? cleanRecurrenceWeekdays
              : null,
          starts_on: cleanTaskDate < today ? today : cleanTaskDate,
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

  const scheduleChanged =
    cleanTaskDate !== existingTask.task_date ||
    cleanScheduledTime !== (existingTask.scheduled_time || null);

  const updatePayload = {
    task_name: cleanTaskName,
    prayer_anchor: cleanPrayerAnchor,
    task_date: cleanTaskDate,
    scheduled_time: cleanScheduledTime,
    recurrence_rule_id:
      cleanEditScope === "instance" && hadRecurrence
        ? null
        : wantsRecurrence
          ? recurrenceRuleId
          : null,
  };

  if (scheduleChanged) {
    updatePayload.reminder_sent_at = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .select(TASK_FIELDS)
    .single();

  if (error) {
    return { error: "تعذر تحديث المهمة." };
  }

  revalidatePath("/dashboard");

  return {
    task: data,
    wasToday: existingTask.task_date === today,
    isToday: data.task_date === today,
    wasScheduled: existingTask.task_date > today,
    isScheduled: data.task_date > today,
    fixedHabits: await fetchUserFixedHabits(supabase, user.id),
  };
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
      error: error.message,
      tasks: [],
      fixedHabits: fixedHabits || [],
    };
  }

  const afterFixedHabits = await syncFixedHabitsToToday(
    supabase,
    user.id,
    fixedHabits || [],
    todayTasks || [],
  );

  const afterRecurrence = await syncRecurrenceRules(
    supabase,
    user.id,
    [getTodayDate()],
    afterFixedHabits,
    fixedHabits || [],
  );

  const syncedTasks = sortSyncedTodayTasks(afterRecurrence);

  return {
    tasks: syncedTasks,
    fixedHabits: fixedHabits || [],
  };
}

export async function getTodayCustomTasksCount() {
  const result = await getTasksForToday();

  if (result.error) {
    return { error: result.error, customTasksCount: 0 };
  }

  const customTasksCount = (result.tasks || []).filter(
    (task) => !isFixedHabitTask(task, result.fixedHabits || []),
  ).length;

  return { customTasksCount };
}

export async function getUpcomingTasks() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, tasks: [] };
  }

  const today = getTodayDate();
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + 60);
  const horizon = getLocalTodayDate(horizonDate);
  const nextWeek = getNextCalendarWeekBounds(today);
  const nextWeekDates = buildDateRange(nextWeek.start, nextWeek.end);

  const [{ data: fixedHabits }, { data: nextWeekTasks, error: nextWeekError }] =
    await Promise.all([
      supabase
        .from("fixed_habits")
        .select("id, user_id, habit_name, prayer_anchor, created_at")
        .eq("user_id", user.id),
      supabase
        .from("tasks")
        .select(TASK_FIELDS)
        .eq("user_id", user.id)
        .gte("task_date", nextWeek.start)
        .lte("task_date", nextWeek.end),
    ]);

  if (nextWeekError) {
    return { error: "تعذر تحميل المهام القادمة.", tasks: [] };
  }

  await syncRecurrenceRules(
    supabase,
    user.id,
    nextWeekDates,
    nextWeekTasks || [],
    fixedHabits || [],
    [RECURRENCE_TYPES.WEEKLY],
  );

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("user_id", user.id)
    .gt("task_date", today)
    .lte("task_date", horizon)
    .order("task_date", { ascending: true })
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(60);

  if (error) {
    return { error: "تعذر تحميل المهام القادمة.", tasks: [] };
  }

  return {
    tasks: filterTasksForUpcomingSection(data ?? [], today),
    error: null,
  };
}

export async function addTask(
  taskName,
  prayerAnchor,
  taskDate = null,
  scheduledTime = null,
  isFixedHabit = false,
  recurrenceType = RECURRENCE_TYPES.NONE,
  recurrenceWeekdays = [],
) {
  const cleanTaskName = String(taskName || "").trim();
  const cleanPrayerAnchor = String(prayerAnchor || "").trim();
  const cleanTaskDate = String(taskDate || getTodayDate()).trim();
  const cleanScheduledTime = parseScheduledTime(scheduledTime);
  const isFixed = Boolean(isFixedHabit);

  if (!cleanTaskName) {
    return { error: "اكتب اسم المهمة أولاً." };
  }

  if (!PRAYER_ANCHORS.includes(cleanPrayerAnchor)) {
    return { error: "اختر وقتاً صحيحاً للمهمة." };
  }

  if (!isValidTaskDate(cleanTaskDate)) {
    return { error: "تاريخ المهمة غير صالح." };
  }

  if (cleanTaskDate < getTodayDate()) {
    return { error: "لا يمكن جدولة مهمة في يوم ماضٍ." };
  }

  if (scheduledTime && !cleanScheduledTime) {
    return { error: "الوقت التذكيري غير صالح." };
  }

  const recurrenceValidation = validateRecurrenceInput(
    recurrenceType,
    recurrenceWeekdays,
  );

  if (!recurrenceValidation.valid) {
    return { error: recurrenceValidation.error };
  }

  const cleanRecurrenceType = recurrenceValidation.type;
  const cleanRecurrenceWeekdays = recurrenceValidation.weekdays || [];
  const wantsRecurrence = cleanRecurrenceType !== RECURRENCE_TYPES.NONE;

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const [{ data: fixedHabits }, { data: dateTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("fixed_habits")
        .select("habit_name, prayer_anchor")
        .eq("user_id", user.id),
      supabase
        .from("tasks")
        .select(TASK_FIELDS)
        .eq("user_id", user.id)
        .eq("task_date", cleanTaskDate),
    ]);

  if (tasksError) {
    return { error: "تعذر التحقق من عدد مهام اليوم." };
  }

  const customTaskCount = (dateTasks || []).filter(
    (task) => !isFixedHabitTask(task, fixedHabits || []),
  ).length;

  if (!isFixed && customTaskCount >= 3) {
    return {
      error:
        cleanTaskDate === getTodayDate()
          ? "وصلت إلى ثلاث مهام دنيوية لليوم. ركز على ثغورك الثلاثة الأساسية لضمان أعلى مستويات التركيز."
          : "وصلت إلى ثلاث مهام مجدولة في هذا اليوم. ركز على ثغورك الثلاثة الأساسية.",
    };
  }

  let recurrenceRuleId = null;

  if (wantsRecurrence) {
    const { data: rule, error: ruleError } = await supabase
      .from("task_recurrence_rules")
      .insert({
        user_id: user.id,
        task_name: cleanTaskName,
        prayer_anchor: cleanPrayerAnchor,
        scheduled_time: cleanScheduledTime,
        recurrence_type: cleanRecurrenceType,
        recurrence_weekdays:
          cleanRecurrenceType === RECURRENCE_TYPES.WEEKLY
            ? cleanRecurrenceWeekdays
            : null,
        starts_on: cleanTaskDate,
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
      task_name: cleanTaskName,
      prayer_anchor: cleanPrayerAnchor,
      task_date: cleanTaskDate,
      scheduled_time: cleanScheduledTime,
      recurrence_rule_id: recurrenceRuleId,
    })
    .select(TASK_FIELDS)
    .single();

  if (error) {
    if (recurrenceRuleId) {
      await supabase
        .from("task_recurrence_rules")
        .delete()
        .eq("id", recurrenceRuleId)
        .eq("user_id", user.id);
    }
    return { error: "تعذر إضافة المهمة الآن." };
  }

  if (isFixed) {
    try {
      await mutateFixedHabitForTask(supabase, user.id, {
        wasFixed: false,
        willBeFixed: true,
        previousName: null,
        nextName: cleanTaskName,
        nextAnchor: cleanPrayerAnchor,
      });
    } catch (habitError) {
      await supabase.from("tasks").delete().eq("id", data.id);
      return { error: "تعذر حفظ الورد الراتب." };
    }
  }

  revalidatePath("/dashboard");
  return {
    task: data,
    isScheduled: cleanTaskDate > getTodayDate(),
    fixedHabits: await fetchUserFixedHabits(supabase, user.id),
  };
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

  if (data?.source_camp_task_id) {
    await markUserCampTaskComplete(data.source_camp_task_id);
    await revalidateCampForTask(supabase, data.source_camp_task_id);
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

  if (!currentState && data?.source_camp_task_id) {
    await markUserCampTaskComplete(data.source_camp_task_id);
    await revalidateCampForTask(supabase, data.source_camp_task_id);
  }

  revalidatePath("/dashboard");
  return { task: data };
}
