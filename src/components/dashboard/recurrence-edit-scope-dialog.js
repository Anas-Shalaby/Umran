"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function RecurrenceEditScopeDialog({
  open,
  onClose,
  onConfirm,
  mode = "edit",
}) {
  const isDelete = mode === "delete";
  const title = isDelete ? "حذف مهمة متكررة" : "تعديل مهمة متكررة";
  const description = isDelete
    ? "هل تريد حذف هذه النسخة فقط أم إيقاف التكرار بالكامل؟"
    : "هل تريد تطبيق التعديل على هذا اليوم فقط أم على كل التكرارات القادمة؟";
  const instanceLabel = isDelete ? "هذا اليوم فقط" : "هذا اليوم فقط";
  const ruleLabel = isDelete ? "كل التكرارات" : "كل التكرارات";

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onConfirm?.("instance")}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-start text-xs font-bold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {instanceLabel}
            </button>
            <button
              type="button"
              onClick={() => onConfirm?.("rule")}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-start text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              {ruleLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
