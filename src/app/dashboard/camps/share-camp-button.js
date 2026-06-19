"use client";

import { useState } from "react";
import { Check, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { shareCamp } from "./share-camp";

const toastStyle = { fontFamily: "Umran" };

export function ShareCampButton({
  campId,
  title,
  className = "",
  label = "مشاركة",
  showLabel = false,
  stopPropagation = false,
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare(event) {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    setIsSharing(true);

    try {
      const result = await shareCamp({ campId, title });

      if (result.cancelled) return;

      if (result.method === "native") {
        toast.success("تمت مشاركة المعسكر.", {
          position: "top-right",
          style: toastStyle,
        });
        return;
      }

      setCopied(true);
      toast.success("تم نسخ رابط المعسكر.", {
        position: "top-right",
        style: toastStyle,
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر مشاركة المعسكر.", {
        position: "top-right",
        style: toastStyle,
      });
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      aria-label="مشاركة المعسكر"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-600 backdrop-blur-md transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-70 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400 ${
        showLabel ? "px-4 py-2 text-sm font-semibold" : "h-9 w-9"
      } ${className}`}
    >
      {isSharing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : showLabel ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {showLabel ? <span>{isSharing ? "جارٍ المشاركة..." : label}</span> : null}
    </button>
  );
}
