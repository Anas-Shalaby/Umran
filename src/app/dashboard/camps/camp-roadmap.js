"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown, Loader2, Map } from "lucide-react";
import { toast } from "sonner";
import { pullTaskToPrayer } from "./actions";
import { AddCampTaskModal } from "./add-camp-task-modal";

const toastStyle = { fontFamily: "Umran" };

const PRAYER_OPTIONS = [
  { value: "fajr", label: "الفجر" },
  { value: "dhuhr", label: "الظهر" },
  { value: "asr", label: "العصر" },
  { value: "maghrib", label: "المغرب" },
  { value: "isha", label: "العشاء" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function PullToPrayerMenu({ taskId, disabled, onPulled }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const menuWidth = Math.max(rect.width, 148);
    const maxLeft = window.innerWidth - menuWidth - viewportPadding;
    const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft);

    setMenuPosition({
      top: rect.bottom + 8,
      left,
      width: menuWidth,
    });
  }

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(event) {
      const target = event.target;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleToggle() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        updateMenuPosition();
      }
      return next;
    });
  }

  function handleSelect(prayerAnchor) {
    setOpen(false);

    startTransition(async () => {
      const result = await pullTaskToPrayer(taskId, prayerAnchor);

      if (result?.error) {
        toast.error(result.error, { position: "top-right", style: toastStyle });
        return;
      }

      const label =
        PRAYER_OPTIONS.find((option) => option.value === prayerAnchor)?.label ||
        prayerAnchor;

      toast.success(`سُحب الثغر ليومك — ${label}`, {
        position: "top-right",
        style: toastStyle,
      });

      onPulled?.();
    });
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled || isPending}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-60 sm:w-auto sm:py-1.5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CalendarDays className="h-3.5 w-3.5" />
        )}
        سحب ليومي 📅
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && menuPosition ? (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  dir="rtl"
                  style={{
                    position: "fixed",
                    top: menuPosition.top,
                    left: menuPosition.left,
                    width: menuPosition.width,
                    zIndex: 100,
                  }}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <ul className="p-1">
                    {PRAYER_OPTIONS.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

function CampTaskRow({ task, canInteract, onPulled }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-3 shadow-sm transition hover:border-emerald-200 sm:px-4 sm:py-4 dark:border-zinc-800/50 dark:bg-zinc-950/30 dark:hover:border-emerald-500/20"
    >
      <div className="pointer-events-none absolute inset-y-3 start-0 w-0.5 rounded-full bg-emerald-500/0 transition group-hover:bg-emerald-500/60" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
            {task.title}
          </h3>
          {task.description ? (
            <p className="text-xs font-medium leading-6 text-zinc-600 dark:text-zinc-400">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="w-full sm:w-auto sm:shrink-0">
          {task.completed ? (
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:w-auto sm:justify-start dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              مكتمل
            </span>
          ) : canInteract ? (
            <div className="w-full sm:w-auto">
              <PullToPrayerMenu taskId={task.id} onPulled={onPulled} />
            </div>
          ) : (
            <span className="block text-center text-[11px] font-semibold text-zinc-500 sm:text-start">
              انضم للمعسكر للمشاركة
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export function CampRoadmap({
  campId,
  initialTasks = [],
  isCreator = false,
  canInteract = false,
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  function handleTaskSaved(newTask) {
    setTasks((current) => [...current, newTask]);
    toast.success("أُضيف ثغر جديد لخريطة المعسكر.", {
      position: "top-right",
      style: toastStyle,
    });
  }

  return (
    <>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="rounded-2xl border border-zinc-200/80 bg-white/60 p-4 backdrop-blur-md sm:rounded-3xl sm:p-6 lg:p-8 dark:border-zinc-800/50 dark:bg-zinc-900/40"
      >
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
              خريطة المعسكر
            </h2>
          </div>

          {isCreator ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 sm:w-auto sm:py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/15"
            >
              ＋ إضافة ثغر للمعسكر
            </button>
          ) : null}
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm font-medium text-zinc-500">
            لا توجد ثغرات في الخريطة بعد.
            {isCreator
              ? " أضف أول ثغر يوجّه المعمرين."
              : " سيضيف المنشئ خريطة المشاركة قريباً."}
          </p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <CampTaskRow
                  key={task.id}
                  task={task}
                  canInteract={canInteract}
                  onPulled={() => router.refresh()}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <AddCampTaskModal
        open={modalOpen}
        campId={campId}
        onClose={() => setModalOpen(false)}
        onSaved={handleTaskSaved}
      />
    </>
  );
}
