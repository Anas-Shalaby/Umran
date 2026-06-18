"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { processDueTaskReminders } from "@/lib/notifications/task-reminders";

const NOTIFICATION_FIELDS =
  "id, user_id, type, title, body, link, metadata, read_at, created_at";

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

export async function processDueTaskRemindersForCurrentUser() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, processed: 0 };
  }

  try {
    const result = await processDueTaskReminders(supabase, {
      userId: user.id,
      useRpc: true,
    });

    if (result.processed > 0) {
      revalidatePath("/dashboard");
    }

    return { processed: result.processed, error: null };
  } catch (error) {
    console.error("processDueTaskRemindersForCurrentUser:", error);
    return { error: "تعذر معالجة التذكيرات.", processed: 0 };
  }
}

export async function getNotifications(limit = 30) {
  noStore();

  const { supabase, error: authError } = await getAuthenticatedUser();
  if (authError) {
    return { error: authError, notifications: [] };
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const { data, error } = await supabase.rpc("get_my_notifications", {
    p_limit: safeLimit,
  });

  if (error) {
    console.error("getNotifications:", error.message);
    return {
      error: `تعذر تحميل الإشعارات: ${error.message}`,
      notifications: [],
    };
  }

  return { notifications: data ?? [], error: null };
}

export async function getUnreadNotificationCount() {
  noStore();

  const { supabase, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError, count: 0 };
  }

  const { data, error } = await supabase.rpc(
    "get_my_unread_notification_count",
  );

  if (error) {
    console.error("getUnreadNotificationCount:", error.message);
    return {
      error: error.message || "تعذر تحميل عدد الإشعارات.",
      count: 0,
    };
  }

  return { count: Number(data) || 0, error: null };
}

export async function markNotificationRead(notificationId) {
  const cleanId = String(notificationId || "").trim();

  if (!cleanId) {
    return { error: "لم يتم تحديد الإشعار." };
  }

  const { supabase, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase.rpc("mark_my_notification_read", {
    p_notification_id: cleanId,
  });

  if (error) {
    console.error("markNotificationRead:", error.message);
    return { error: error.message || "تعذر تعليم الإشعار كمقروء." };
  }

  revalidatePath("/dashboard");
  return { notification: data };
}

export async function markAllNotificationsRead() {
  const { supabase, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase.rpc("mark_all_my_notifications_read");

  if (error) {
    console.error("markAllNotificationsRead:", error.message);
    return { error: error.message || "تعذر تعليم الإشعارات كمقروءة." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
