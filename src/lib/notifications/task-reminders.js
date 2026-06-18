import { PRAYER_ANCHOR_LABELS } from "@/app/dashboard/prayer-time";

export const DEFAULT_REMINDER_TIMEZONE = "Asia/Riyadh";
const REMINDER_WINDOW_MINUTES = 5;

const TASK_REMINDER_FIELDS =
  "id, user_id, task_name, task_date, scheduled_time, prayer_anchor, is_completed, reminder_sent_at";

function parseTimeToMinutes(value) {
  const raw = String(value || "");
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getZonedDateTimeParts(date = new Date(), timeZone = DEFAULT_REMINDER_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    timeMinutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function isTaskDueForReminder(
  task,
  { date, timeMinutes },
  windowMinutes = REMINDER_WINDOW_MINUTES,
) {
  if (!task?.scheduled_time || task.is_completed || task.reminder_sent_at) {
    return false;
  }

  if (task.task_date !== date) {
    return false;
  }

  const scheduledMinutes = parseTimeToMinutes(task.scheduled_time);
  if (scheduledMinutes === null) {
    return false;
  }

  const windowStart = timeMinutes - windowMinutes;
  return scheduledMinutes <= timeMinutes && scheduledMinutes >= windowStart;
}

export function buildTaskReminderContent(task) {
  const taskName = task.task_name || "مهمة";
  const prayerLabel =
    PRAYER_ANCHOR_LABELS[task.prayer_anchor] || task.prayer_anchor || "";

  return {
    type: "task_reminder",
    title: "حان وقت المهمة",
    body: prayerLabel
      ? `حان وقت «${taskName}» — ${prayerLabel}.`
      : `حان وقت «${taskName}».`,
  };
}

async function insertTaskReminderNotification(supabase, task) {
  const { type, title, body } = buildTaskReminderContent(task);

  const { error } = await supabase.from("notifications").insert({
    user_id: task.user_id,
    type,
    title,
    body,
    link: "/dashboard",
    metadata: {
      task_id: task.id,
      task_name: task.task_name,
      task_date: task.task_date,
      scheduled_time: task.scheduled_time,
      prayer_anchor: task.prayer_anchor,
      prayer_anchor_label:
        PRAYER_ANCHOR_LABELS[task.prayer_anchor] || task.prayer_anchor,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function insertTaskReminderViaRpc(supabase, taskId) {
  const { data, error } = await supabase.rpc("create_task_reminder_notification", {
    p_task_id: taskId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function markTaskReminderSent(supabase, taskId, userId = null) {
  let query = supabase
    .from("tasks")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", taskId)
    .is("reminder_sent_at", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function processDueTaskReminders(
  supabase,
  {
    userId = null,
    timeZone = DEFAULT_REMINDER_TIMEZONE,
    windowMinutes = REMINDER_WINDOW_MINUTES,
    useRpc = false,
  } = {},
) {
  const zonedNow = getZonedDateTimeParts(new Date(), timeZone);

  let query = supabase
    .from("tasks")
    .select(TASK_REMINDER_FIELDS)
    .eq("task_date", zonedNow.date)
    .not("scheduled_time", "is", null)
    .eq("is_completed", false)
    .is("reminder_sent_at", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const dueTasks = (tasks || []).filter((task) =>
    isTaskDueForReminder(task, zonedNow, windowMinutes),
  );

  let processed = 0;

  for (const task of dueTasks) {
    try {
      if (useRpc) {
        const created = await insertTaskReminderViaRpc(supabase, task.id);
        if (created) {
          processed += 1;
        }
      } else {
        await insertTaskReminderNotification(supabase, task);
        await markTaskReminderSent(supabase, task.id, userId);
        processed += 1;
      }
    } catch (reminderError) {
      console.error("processDueTaskReminders:", reminderError.message);
    }
  }

  return { processed, dueCount: dueTasks.length };
}
