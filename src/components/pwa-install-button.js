"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import {
  closeIosGuide,
  getIosGuideSnapshot,
  getPwaInstallServerSnapshot,
  getPwaInstallSnapshot,
  initPwaInstall,
  openIosGuide,
  requestPwaInstall,
  subscribeIosGuide,
  subscribePwaInstall,
} from "@/lib/pwa-install";

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

const variantClasses = {
  primary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
  outline:
    "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
  ghost:
    "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
  nav: "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
};

function usePwaInstallState() {
  return useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallServerSnapshot,
  );
}

function useIosGuideOpen() {
  return useSyncExternalStore(
    subscribeIosGuide,
    getIosGuideSnapshot,
    () => false,
  );
}

export function PwaInstallGuideHost() {
  const [mounted, setMounted] = useState(false);
  const iosGuideOpen = useIosGuideOpen();

  useEffect(() => {
    initPwaInstall();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <IosInstallGuide open={iosGuideOpen} onClose={closeIosGuide} />,
    document.body,
  );
}

export function PwaInstallButton({
  className = "",
  variant = "outline",
  label = "تنزيل التطبيق",
  showIcon = true,
}) {
  const [mounted, setMounted] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { installed } = usePwaInstallState();

  useEffect(() => {
    initPwaInstall();
    setMounted(true);
  }, []);

  if (!mounted || installed) return null;

  async function handleInstall() {
    if (isIosDevice()) {
      openIosGuide();
      return;
    }

    setIsInstalling(true);
    try {
      const result = await requestPwaInstall();

      if (result.ok) return;

      if (result.reason === "dismissed") return;

      toast.error("التثبيت المباشر غير متاح حالياً", {
        description:
          "افتح الموقع من Chrome أو Edge على النسخة المنشورة لتثبيت التطبيق مباشرة.",
      });
    } finally {
      setIsInstalling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={isInstalling}
      aria-busy={isInstalling}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-70 ${variantClasses[variant] || variantClasses.outline} ${className}`}
    >
      {isInstalling ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : showIcon ? (
        <Download className="h-4 w-4" />
      ) : null}
      {isInstalling ? "جارٍ التثبيت..." : label}
    </button>
  );
}

function InstallModalShell({ open, onClose, children, titleId }) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!portalReady) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200]"
          role="presentation"
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-zinc-950/60"
            onClick={onClose}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(event) => event.stopPropagation()}
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function IosInstallGuide({ open, onClose }) {
  return (
    <InstallModalShell open={open} onClose={onClose} titleId="pwa-ios-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="pwa-ios-title"
              className="text-base font-black text-zinc-950 dark:text-zinc-50"
            >
              تثبيت عُمران على iPhone
            </h2>
            <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Safari لا يدعم التثبيت المباشر — اتبع الخطوات
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="space-y-3 text-sm font-medium leading-7 text-zinc-600 dark:text-zinc-300">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            ١
          </span>
          <span>
            اضغط <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" />{" "}
            <strong className="font-bold text-zinc-800 dark:text-zinc-100">
              مشاركة
            </strong>{" "}
            في شريط Safari
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            ٢
          </span>
          <span>
            اختر{" "}
            <strong className="font-bold text-zinc-800 dark:text-zinc-100">
              إضافة إلى الشاشة الرئيسية
            </strong>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            ٣
          </span>
          <span>
            اضغط{" "}
            <strong className="font-bold text-zinc-800 dark:text-zinc-100">
              إضافة
            </strong>
          </span>
        </li>
      </ol>
    </InstallModalShell>
  );
}
