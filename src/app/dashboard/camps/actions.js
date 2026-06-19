"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getLocalTodayDate } from "@/app/dashboard/prayer-time";

const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const CAMP_FIELDS =
  "id, title, description, target_hours, current_hours, is_active, is_public, created_by, starts_at, ends_at, created_at";
const PARTICIPATION_FIELDS =
  "id, camp_id, contribution_minutes, joined_at, camps(id, title, is_active)";

function getArabicInitials(name) {
  const parts = String(name || "معمر")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}. ${parts[1][0]}`;
  }

  if (parts[0]?.[0]) {
    return `${parts[0][0]}.`;
  }

  return "م.";
}

function minutesToHours(minutes) {
  const hours = (Number(minutes) || 0) / 60;
  return Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
}

function formatHours(value) {
  const hours = Number(value) || 0;
  return Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
}

async function fetchCampFocusMinutes(supabase, campId) {
  const { data, error } = await supabase.rpc("get_camp_focus_minutes", {
    p_camp_id: campId,
  });

  if (error) {
    return 0;
  }

  return Math.max(0, Number(data) || 0);
}

async function fetchCampParticipantFocusMap(supabase, campId) {
  const { data, error } = await supabase.rpc("get_camp_focus_by_participants", {
    p_camp_id: campId,
  });

  if (error) {
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => [row.user_id, Math.max(0, Number(row.focus_minutes) || 0)]),
  );
}

function buildCampProgress(targetHours, focusMinutes) {
  const targetMinutes = Math.max(1, (Number(targetHours) || 1) * 60);
  const currentHours = focusMinutes / 60;
  const progressPercent = Math.min(
    100,
    Math.round((focusMinutes / targetMinutes) * 100),
  );
  const remainingHours = Math.max(
    0,
    formatHours(Number(targetHours) - currentHours),
  );

  return { currentHours, progressPercent, remainingHours, focusMinutes };
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

export async function getActiveCamps() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { camps: [], error: authError };
  }

  const { data: participations, error: participationError } = await supabase
    .from("camp_participants")
    .select("camp_id")
    .eq("user_id", user.id);

  if (participationError) {
    return { camps: [], error: "تعذر تحميل المعسكرات." };
  }

  const joinedCampIds = (participations ?? [])
    .map((row) => row.camp_id)
    .filter(Boolean);

  const visibilityFilters = ["is_public.eq.true", `created_by.eq.${user.id}`];

  if (joinedCampIds.length) {
    visibilityFilters.push(`id.in.(${joinedCampIds.join(",")})`);
  }

  const { data, error } = await supabase
    .from("camps")
    .select(CAMP_FIELDS)
    .eq("is_active", true)
    .or(visibilityFilters.join(","))
    .order("created_at", { ascending: false });

  if (error) {
    return { camps: [], error: "تعذر تحميل المعسكرات." };
  }

  const camps = await Promise.all(
    (data ?? []).map(async (camp) => {
      const focusMinutes = await fetchCampFocusMinutes(supabase, camp.id);
      const progress = buildCampProgress(camp.target_hours, focusMinutes);

      return {
        ...camp,
        current_hours: progress.currentHours,
        progressPercent: progress.progressPercent,
        focusMinutes: progress.focusMinutes,
      };
    }),
  );

  return { camps, error: null };
}

export async function getUserCamps() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { participations: [], error: authError };
  }

  const { data, error } = await supabase
    .from("camp_participants")
    .select(PARTICIPATION_FIELDS)
    .eq("user_id", user.id);

  if (error) {
    return { participations: [], error: "تعذر تحميل مشاركاتك." };
  }

  const participations = (data ?? []).map((row) => ({
    campId: row.camp_id,
    contributionMinutes: row.contribution_minutes ?? 0,
    joinedAt: row.joined_at,
    camp: row.camps,
  }));

  return { participations, error: null };
}

export async function getCampDetails(campId) {
  const cleanCampId = String(campId || "").trim();

  if (!cleanCampId) {
    return { error: "لم يتم تحديد المعسكر.", camp: null };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, camp: null };
  }

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select(CAMP_FIELDS)
    .eq("id", cleanCampId)
    .eq("is_active", true)
    .maybeSingle();

  if (campError || !camp) {
    return { error: "المعسكر غير موجود أو لم يعد نشطاً.", camp: null };
  }

  const isCreator = camp.created_by === user.id;

  const { data: participants, error: participantsError } = await supabase
    .from("camp_participants")
    .select("id, user_id, contribution_minutes, joined_at")
    .eq("camp_id", cleanCampId)
    .order("contribution_minutes", { ascending: false });

  if (participantsError) {
    return { error: "تعذر تحميل المشاركين.", camp: null };
  }

  const participantRows = participants ?? [];
  const userIds = participantRows.map((row) => row.user_id);
  const focusByUser = await fetchCampParticipantFocusMap(supabase, cleanCampId);

  let profileMap = new Map();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    profileMap = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
    );
  }

  const enrichedParticipants = participantRows
    .map((row) => {
      const displayName = profileMap.get(row.user_id) || "معمر";
      const focusMinutes = focusByUser.get(row.user_id) ?? 0;

      return {
        userId: row.user_id,
        contributionMinutes: focusMinutes,
        contributionHours: minutesToHours(focusMinutes),
        displayName,
        initials: getArabicInitials(displayName),
        isCurrentUser: row.user_id === user.id,
      };
    })
    .sort((a, b) => b.contributionMinutes - a.contributionMinutes);

  const userParticipation = enrichedParticipants.find(
    (participant) => participant.isCurrentUser,
  );

  if (!camp.is_public && !isCreator && !userParticipation) {
    return {
      error: "هذا المعسكر خاص ولا تملك صلاحية الوصول إليه.",
      camp: null,
    };
  }

  const targetHours = Number(camp.target_hours) || 1;
  const campFocusMinutes = await fetchCampFocusMinutes(supabase, cleanCampId);
  const { currentHours, progressPercent, remainingHours } = buildCampProgress(
    targetHours,
    campFocusMinutes,
  );

  return {
    error: null,
    camp: {
      ...camp,
      current_hours: currentHours,
      progressPercent,
      remainingHours,
      focusMinutes: campFocusMinutes,
      totalParticipants: enrichedParticipants.length,
      userContributionMinutes: userParticipation?.contributionMinutes ?? 0,
      joined: Boolean(userParticipation),
      participants: enrichedParticipants,
      topContributors: enrichedParticipants.slice(0, 5),
      isCreator,
    },
  };
}

export async function getCampTasks(campId) {
  const cleanCampId = String(campId || "").trim();

  if (!cleanCampId) {
    return { tasks: [], error: "لم يتم تحديد المعسكر." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { tasks: [], error: authError };
  }

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, is_public, created_by, is_active")
    .eq("id", cleanCampId)
    .maybeSingle();

  if (campError || !camp || !camp.is_active) {
    return { tasks: [], error: "المعسكر غير موجود أو لم يعد نشطاً." };
  }

  const isCreator = camp.created_by === user.id;

  const { data: participation } = await supabase
    .from("camp_participants")
    .select("id")
    .eq("camp_id", cleanCampId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!camp.is_public && !isCreator && !participation) {
    return { tasks: [], error: "لا تملك صلاحية عرض خريطة هذا المعسكر." };
  }

  const { data: campTasks, error: tasksError } = await supabase
    .from("camp_tasks")
    .select("id, camp_id, title, description, created_at")
    .eq("camp_id", cleanCampId)
    .order("created_at", { ascending: true });

  if (tasksError) {
    return { tasks: [], error: "تعذر تحميل ثغرات المعسكر." };
  }

  const taskIds = (campTasks ?? []).map((task) => task.id);

  let completionMap = new Map();

  if (taskIds.length) {
    const { data: completions } = await supabase
      .from("user_camp_tasks")
      .select("camp_task_id, completed_at")
      .eq("user_id", user.id)
      .in("camp_task_id", taskIds);

    completionMap = new Map(
      (completions ?? []).map((row) => [row.camp_task_id, row.completed_at]),
    );
  }

  const tasks = (campTasks ?? []).map((task) => ({
    id: task.id,
    campId: task.camp_id,
    title: task.title,
    description: task.description || "",
    createdAt: task.created_at,
    completed: completionMap.has(task.id),
    completedAt: completionMap.get(task.id) ?? null,
  }));

  return { tasks, error: null };
}

export async function addCampTask(campId, title, description) {
  const cleanCampId = String(campId || "").trim();
  const cleanTitle = String(title || "").trim();
  const cleanDescription = String(description || "").trim();

  if (!cleanCampId) {
    return { error: "لم يتم تحديد المعسكر." };
  }

  if (!cleanTitle) {
    return { error: "عنوان الثغر مطلوب." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, created_by, is_active")
    .eq("id", cleanCampId)
    .maybeSingle();

  if (campError || !camp) {
    return { error: "المعسكر غير موجود." };
  }

  if (!camp.is_active) {
    return { error: "هذا المعسكر لم يعد نشطاً." };
  }

  if (camp.created_by !== user.id) {
    return { error: "فقط منشئ المعسكر يمكنه إضافة ثغرات للخريطة." };
  }

  const { data, error } = await supabase
    .from("camp_tasks")
    .insert({
      camp_id: cleanCampId,
      title: cleanTitle,
      description: cleanDescription || null,
    })
    .select("id, camp_id, title, description, created_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return {
        error:
          "صلاحية إضافة ثغرات المعسكر غير مفعّلة. شغّل supabase/camp-tasks.sql في Supabase SQL Editor.",
      };
    }

    return { error: "تعذر إضافة الثغر. حاول مرة أخرى." };
  }

  revalidatePath(`/dashboard/camps/${cleanCampId}`);

  return {
    task: {
      id: data.id,
      campId: data.camp_id,
      title: data.title,
      description: data.description || "",
      createdAt: data.created_at,
      completed: false,
      completedAt: null,
    },
  };
}

export async function pullTaskToPrayer(campTaskId, prayerAnchor) {
  const cleanCampTaskId = String(campTaskId || "").trim();
  const cleanPrayerAnchor = String(prayerAnchor || "").trim().toLowerCase();

  if (!cleanCampTaskId) {
    return { error: "لم يتم تحديد ثغر المعسكر." };
  }

  if (!PRAYER_ANCHORS.includes(cleanPrayerAnchor)) {
    return { error: "اختر وقتاً صحيحاً للصلاة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: campTask, error: campTaskError } = await supabase
    .from("camp_tasks")
    .select("id, camp_id, title, description, camps!inner(id, is_active, is_public, created_by)")
    .eq("id", cleanCampTaskId)
    .maybeSingle();

  if (campTaskError || !campTask) {
    return { error: "ثغر المعسكر غير موجود." };
  }

  const camp = campTask.camps;

  if (!camp?.is_active) {
    return { error: "هذا المعسكر لم يعد نشطاً." };
  }

  const isCreator = camp.created_by === user.id;

  const { data: participation } = await supabase
    .from("camp_participants")
    .select("id")
    .eq("camp_id", campTask.camp_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!camp.is_public && !isCreator && !participation) {
    return { error: "يجب الانضمام للمعسكر لسحب الثغر." };
  }

  const today = getLocalTodayDate();

  const { data: existingPull } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("source_camp_task_id", cleanCampTaskId)
    .eq("task_date", today)
    .maybeSingle();

  if (existingPull) {
    return { error: "سحبت هذا الثغر ليومك بالفعل." };
  }

  const [{ data: fixedHabits }, { data: todayTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("fixed_habits")
        .select("habit_name, prayer_anchor")
        .eq("user_id", user.id),
      supabase
        .from("tasks")
        .select("id, task_name, prayer_anchor, source_camp_task_id")
        .eq("user_id", user.id)
        .eq("task_date", today),
    ]);

  if (tasksError) {
    return { error: "تعذر التحقق من مهام اليوم." };
  }

  const customTaskCount = (todayTasks ?? []).filter(
    (task) =>
      !task.source_camp_task_id &&
      !(fixedHabits ?? []).some(
        (habit) =>
          habit.habit_name === task.task_name &&
          habit.prayer_anchor === task.prayer_anchor,
      ),
  ).length;

  if (customTaskCount >= 3) {
    return {
      error:
        "وصلت إلى ثلاث مهام دنيوية لليوم. ركز على ثغورك الثلاثة الأساسية لضمان أعلى مستويات التركيز.",
    };
  }

  const taskDescription = campTask.description
    ? `من معسكر: ${campTask.description}`
    : "من خريطة المعسكر";

  const { data: insertedTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      task_name: campTask.title,
      description: taskDescription,
      prayer_anchor: cleanPrayerAnchor,
      task_date: today,
      source_camp_task_id: cleanCampTaskId,
      is_completed: false,
    })
    .select("id, task_name, prayer_anchor, task_date, source_camp_task_id")
    .single();

  if (insertError) {
    return { error: "تعذر سحب الثغر ليومك. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/camps/${campTask.camp_id}`);

  return { task: insertedTask };
}

export async function markUserCampTaskComplete(campTaskId) {
  const cleanCampTaskId = String(campTaskId || "").trim();

  if (!cleanCampTaskId) {
    return { error: "لم يتم تحديد ثغر المعسكر." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: campTask, error: campTaskError } = await supabase
    .from("camp_tasks")
    .select("id, camp_id")
    .eq("id", cleanCampTaskId)
    .maybeSingle();

  if (campTaskError || !campTask) {
    return { error: "ثغر المعسكر غير موجود." };
  }

  const { error } = await supabase.from("user_camp_tasks").upsert(
    {
      user_id: user.id,
      camp_task_id: cleanCampTaskId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,camp_task_id" },
  );

  if (error) {
    return { error: "تعذر تسجيل إنجاز الثغر." };
  }

  revalidatePath(`/dashboard/camps/${campTask.camp_id}`);
  return { ok: true };
}

export async function revalidateCampForTask(supabase, sourceCampTaskId) {
  if (!sourceCampTaskId) {
    return;
  }

  const { data: campTask } = await supabase
    .from("camp_tasks")
    .select("camp_id")
    .eq("id", sourceCampTaskId)
    .maybeSingle();

  if (!campTask?.camp_id) {
    return;
  }

  revalidatePath("/dashboard/camps");
  revalidatePath(`/dashboard/camps/${campTask.camp_id}`);
}

export async function joinCamp(campId) {
  const cleanCampId = String(campId || "").trim();

  if (!cleanCampId) {
    return { error: "لم يتم تحديد المعسكر." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, is_active")
    .eq("id", cleanCampId)
    .maybeSingle();

  if (campError || !camp) {
    return { error: "المعسكر غير موجود." };
  }

  if (!camp.is_active) {
    return { error: "هذا المعسكر لم يعد نشطاً." };
  }

  const { data, error } = await supabase
    .from("camp_participants")
    .insert({
      camp_id: cleanCampId,
      user_id: user.id,
    })
    .select("id, camp_id, contribution_minutes, joined_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "أنت مشارك في هذا المعسكر بالفعل." };
    }

    return { error: "تعذر الانضمام للمعسكر. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/camps");
  revalidatePath(`/dashboard/camps/${cleanCampId}`);
  return {
    participation: {
      campId: data.camp_id,
      contributionMinutes: data.contribution_minutes ?? 0,
      joinedAt: data.joined_at,
    },
  };
}

function parseDateBoundary(value, endOfDay = false) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const date = new Date(`${raw}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export async function createCamp(formData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const targetHours = Number(formData.get("target_hours"));
  const startsAt = parseDateBoundary(formData.get("starts_at"));
  const endsAt = parseDateBoundary(formData.get("ends_at"), true);
  const visibility = String(formData.get("visibility") || "public");
  const isPublic = visibility !== "private";

  if (!title) {
    return { error: "اكتب عنوان المعسكر أولاً." };
  }

  if (!Number.isFinite(targetHours) || targetHours <= 0) {
    return { error: "حدد هدف ساعات صالحاً أكبر من صفر." };
  }

  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data: camp, error } = await supabase
    .from("camps")
    .insert({
      title,
      description: description || null,
      target_hours: targetHours,
      current_hours: 0,
      is_active: true,
      is_public: isPublic,
      created_by: user.id,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select(CAMP_FIELDS)
    .single();

  if (error) {
    if (error.code === "42501") {
      return {
        error:
          "صلاحية إنشاء المعسكر غير مفعّلة. شغّل supabase/camps-rls-fix.sql في Supabase SQL Editor.",
      };
    }

    return { error: error.message || "تعذر تأسيس المعسكر. حاول مرة أخرى." };
  }

  const { error: joinError } = await supabase.from("camp_participants").insert({
    camp_id: camp.id,
    user_id: user.id,
  });

  if (joinError) {
    return { error: "تم إنشاء المعسكر لكن تعذر تسجيلك كمشارك." };
  }

  revalidatePath("/dashboard/camps");
  revalidatePath(`/dashboard/camps/${camp.id}`);

  return { camp };
}
