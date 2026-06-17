"use client";

let deferredPrompt = null;
let installed = false;
let initialized = false;

const stateListeners = new Set();
let iosGuideOpen = false;
const iosGuideListeners = new Set();

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

let cachedSnapshot = { installed: false, canDirectInstall: false };

function getSnapshot() {
  const canDirectInstall = Boolean(deferredPrompt);

  if (
    cachedSnapshot.installed !== installed ||
    cachedSnapshot.canDirectInstall !== canDirectInstall
  ) {
    cachedSnapshot = { installed, canDirectInstall };
  }

  return cachedSnapshot;
}

function notifyState() {
  const snapshot = getSnapshot();
  stateListeners.forEach((listener) => listener(snapshot));
}

function notifyIosGuide() {
  iosGuideListeners.forEach((listener) => listener(iosGuideOpen));
}

export function getPwaInstallSnapshot() {
  return getSnapshot();
}

export const PWA_INSTALL_SERVER_SNAPSHOT = {
  installed: false,
  canDirectInstall: false,
};

export function getPwaInstallServerSnapshot() {
  return PWA_INSTALL_SERVER_SNAPSHOT;
}

export function getIosGuideSnapshot() {
  return iosGuideOpen;
}

export function subscribePwaInstall(listener) {
  stateListeners.add(listener);
  listener(getSnapshot());
  return () => stateListeners.delete(listener);
}

export function subscribeIosGuide(listener) {
  iosGuideListeners.add(listener);
  listener(iosGuideOpen);
  return () => iosGuideListeners.delete(listener);
}

export function openIosGuide() {
  iosGuideOpen = true;
  notifyIosGuide();
}

export function closeIosGuide() {
  iosGuideOpen = false;
  notifyIosGuide();
}

export function initPwaInstall() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  if (isStandaloneMode()) {
    installed = true;
    notifyState();
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notifyState();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notifyState();
  });
}

export function waitForInstallPrompt(timeoutMs = 2000) {
  if (deferredPrompt) return Promise.resolve(deferredPrompt);

  return new Promise((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (deferredPrompt) {
        resolve(deferredPrompt);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }

      window.setTimeout(check, 150);
    };

    check();
  });
}

export async function requestPwaInstall() {
  const prompt = deferredPrompt || (await waitForInstallPrompt());

  if (!prompt) {
    return { ok: false, reason: "unavailable" };
  }

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;

  if (outcome === "accepted") {
    deferredPrompt = null;
    installed = true;
    notifyState();
    return { ok: true, outcome };
  }

  return { ok: false, reason: "dismissed", outcome };
}
