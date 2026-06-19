export const PRAYER_ANCHORS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export function sortTasksBySchedule(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

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

export function sortTodayTasks(tasks) {
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

export function comparePrayerAnchor(anchor, currentAnchor) {
  const anchorIndex = PRAYER_ANCHORS.indexOf(anchor);
  const currentIndex = PRAYER_ANCHORS.indexOf(currentAnchor);

  if (anchorIndex < currentIndex) return -1;
  if (anchorIndex > currentIndex) return 1;
  return 0;
}

export function buildTodayTimeline(tasks, currentAnchor) {
  const grouped = new Map();

  for (const block of PRAYER_ANCHORS) {
    grouped.set(block, []);
  }

  for (const task of tasks) {
    const anchor = task.prayer_anchor || "dhuhr";
    if (!grouped.has(anchor)) {
      grouped.set(anchor, []);
    }
    grouped.get(anchor).push(task);
  }

  let step = 0;

  return PRAYER_ANCHORS.map((anchor) => {
    const blockTasks = sortTasksBySchedule(grouped.get(anchor) || []);
    const anchorStatus = comparePrayerAnchor(anchor, currentAnchor);
    const pendingCount = blockTasks.filter((task) => !task.is_completed).length;
    const isOverdue = anchorStatus < 0 && pendingCount > 0;

    const tasksWithSteps = blockTasks.map((task) => {
      if (task.is_completed) {
        return { task, step: null };
      }

      step += 1;
      return { task, step };
    });

    return {
      anchor,
      tasks: tasksWithSteps,
      anchorStatus,
      pendingCount,
      isOverdue,
      isCurrent: anchorStatus === 0,
    };
  }).filter((block) => block.tasks.length > 0);
}
