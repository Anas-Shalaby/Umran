export const RECURRENCE_TYPES = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
};

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "أحد" },
  { value: 1, label: "إثنين" },
  { value: 2, label: "ثلاثاء" },
  { value: 3, label: "أربعاء" },
  { value: 4, label: "خميس" },
  { value: 5, label: "جمعة" },
  { value: 6, label: "سبت" },
];

export function getWeekdayFromDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.getDay();
}

export function normalizeRecurrenceWeekdays(weekdays) {
  if (!Array.isArray(weekdays)) return [];

  return [...new Set(weekdays.map((day) => Number(day)).filter((day) => day >= 0 && day <= 6))]
    .sort((a, b) => a - b);
}

export function validateRecurrenceInput(recurrenceType, weekdays) {
  const type = String(recurrenceType || RECURRENCE_TYPES.NONE).trim();

  if (type === RECURRENCE_TYPES.NONE) {
    return { valid: true, type };
  }

  if (type === RECURRENCE_TYPES.DAILY) {
    return { valid: true, type, weekdays: [] };
  }

  if (type === RECURRENCE_TYPES.WEEKLY) {
    const normalized = normalizeRecurrenceWeekdays(weekdays);

    if (!normalized.length) {
      return {
        valid: false,
        error: "اختر يوماً واحداً على الأقل من أيام الأسبوع.",
      };
    }

    return { valid: true, type, weekdays: normalized };
  }

  return { valid: false, error: "نوع التكرار غير صالح." };
}

export function shouldOccurOnDate(rule, dateStr) {
  if (!rule?.is_active) return false;
  if (!dateStr || dateStr < rule.starts_on) return false;

  const skipped = rule.recurrence_skipped_dates || [];
  if (skipped.includes(dateStr)) return false;

  if (rule.recurrence_type === RECURRENCE_TYPES.DAILY) {
    return true;
  }

  if (rule.recurrence_type === RECURRENCE_TYPES.WEEKLY) {
    const weekdays = normalizeRecurrenceWeekdays(rule.recurrence_weekdays);
    return weekdays.includes(getWeekdayFromDate(dateStr));
  }

  return false;
}

export function getRecurrenceLabel(task) {
  const type = task?.recurrence_rule?.recurrence_type;

  if (type === RECURRENCE_TYPES.DAILY) return "يومياً";
  if (type === RECURRENCE_TYPES.WEEKLY) return "أسبوعياً";
  if (task?.recurrence_rule_id) return "متكررة";

  return null;
}

export function buildDateRange(startDateStr, endDateStr) {
  const dates = [];
  const cursor = new Date(`${startDateStr}T12:00:00`);
  const end = new Date(`${endDateStr}T12:00:00`);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNextCalendarWeekBounds(todayStr) {
  const today = new Date(`${todayStr}T12:00:00`);
  const dayOfWeek = today.getDay();

  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + (6 - dayOfWeek));

  const nextWeekStart = new Date(currentWeekEnd);
  nextWeekStart.setDate(currentWeekEnd.getDate() + 1);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  return {
    start: formatLocalDate(nextWeekStart),
    end: formatLocalDate(nextWeekEnd),
  };
}

export function shouldShowTaskInUpcomingSection(task, todayStr) {
  if (!task?.task_date || task.task_date <= todayStr) {
    return false;
  }

  const recurrenceType = task.recurrence_rule?.recurrence_type;

  if (!task.recurrence_rule_id) {
    return true;
  }

  if (recurrenceType === RECURRENCE_TYPES.DAILY) {
    return false;
  }

  if (recurrenceType === RECURRENCE_TYPES.WEEKLY) {
    const { start, end } = getNextCalendarWeekBounds(todayStr);
    return task.task_date >= start && task.task_date <= end;
  }

  return false;
}

export function filterTasksForUpcomingSection(tasks, todayStr) {
  return (tasks || []).filter((task) =>
    shouldShowTaskInUpcomingSection(task, todayStr),
  );
}
