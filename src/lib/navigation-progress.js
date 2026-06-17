"use client";

let active = false;
let completing = false;
let completeTimer = null;

const listeners = new Set();
let cachedSnapshot = { active: false, completing: false };

export const NAVIGATION_PROGRESS_SERVER_SNAPSHOT = {
  active: false,
  completing: false,
};

function getSnapshot() {
  if (
    cachedSnapshot.active !== active ||
    cachedSnapshot.completing !== completing
  ) {
    cachedSnapshot = { active, completing };
  }

  return cachedSnapshot;
}

function notify() {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
}

export function getNavigationProgressSnapshot() {
  return getSnapshot();
}

export function getNavigationProgressServerSnapshot() {
  return NAVIGATION_PROGRESS_SERVER_SNAPSHOT;
}

export function subscribeNavigationProgress(listener) {
  listeners.add(listener);
  listener(getSnapshot());
  return () => listeners.delete(listener);
}

export function startNavigation() {
  if (completeTimer) {
    window.clearTimeout(completeTimer);
    completeTimer = null;
  }

  completing = false;
  active = true;
  notify();
}

export function completeNavigation() {
  if (!active && !completing) return;

  active = false;
  completing = true;
  notify();

  completeTimer = window.setTimeout(() => {
    completing = false;
    completeTimer = null;
    notify();
  }, 400);
}
