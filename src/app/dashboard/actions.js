"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import {
  markUserCampTaskComplete,
  revalidateCampForTask,
} from "@/app/dashboard/camps/actions";
import { getLocalTodayDate } from "@/app/dashboard/prayer-time";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const TASK_FIELDS =
  "id, user_id, goal_id, task_name, prayer_anchor, is_completed, duration_minutes, task_date, scheduled_time, created_at, source_camp_task_id, goals:goals(title), camp_source:camp_tasks!source_camp_task_id(title, camps(title))";

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
export async function deleteTask(taskId) {
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
    .select("id, task_name, prayer_anchor")
    .eq("id", cleanTaskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!task) {
    return { error: "المهمة غير موجودة." };
  }

  const fixedHabits = await fetchUserFixedHabits(supabase, user.id);
  const wasFixed = isFixedHabitTask(task, fixedHabits);

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", cleanTaskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف المهمة." };
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

  const scheduleChanged =
    cleanTaskDate !== existingTask.task_date ||
    cleanScheduledTime !== (existingTask.scheduled_time || null);

  const updatePayload = {
    task_name: cleanTaskName,
    prayer_anchor: cleanPrayerAnchor,
    task_date: cleanTaskDate,
    scheduled_time: cleanScheduledTime,
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

  const today = getTodayDate();
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
      error: "تعذر تحميل مهام اليوم. حاول تحديث الصفحة.",
      tasks: [],
      fixedHabits: fixedHabits || [],
    };
  }

  const syncedTasks = sortSyncedTodayTasks(
    await syncFixedHabitsToToday(
      supabase,
      user.id,
      fixedHabits || [],
      todayTasks || [],
    ),
  );

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

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("user_id", user.id)
    .gt("task_date", today)
    .lte("task_date", horizon)
    .order("task_date", { ascending: true })
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(30);

  if (error) {
    return { error: "تعذر تحميل المهام القادمة.", tasks: [] };
  }

  return { tasks: data ?? [], error: null };
}

export async function addTask(
  taskName,
  prayerAnchor,
  taskDate = null,
  scheduledTime = null,
  isFixedHabit = false,
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

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      task_name: cleanTaskName,
      prayer_anchor: cleanPrayerAnchor,
      task_date: cleanTaskDate,
      scheduled_time: cleanScheduledTime,
    })
    .select(TASK_FIELDS)
    .single();

  if (error) {
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
