"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PRAYER_ANCHOR_LABELS } from "../prayer-time";
import {
  deleteFixedHabit,
  signOutUser,
  updateProfileName,
} from "./actions";

export function SettingsPanel({
  initialDisplayName,
  initialFixedHabits,
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [fixedHabits, setFixedHabits] = useState(initialFixedHabits);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [deletingHabitId, setDeletingHabitId] = useState("");
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isSignOutPending, startSignOutTransition] = useTransition();

  function handleSaveProfile(event) {
    event.preventDefault();

    startProfileTransition(async () => {
      const result = await updateProfileName(displayName);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.profile?.display_name) {
        setDisplayName(result.profile.display_name);
      }

      toast.success("تم حفظ التغييرات بنجاح.");
    });
  }

  function handleDeleteHabit(habitId) {
    setDeletingHabitId(habitId);

    startDeleteTransition(async () => {
      const result = await deleteFixedHabit(habitId);

      if (result?.error) {
        toast.error(result.error);
        setDeletingHabitId("");
        return;
      }

      setFixedHabits((current) =>
        current.filter((habit) => habit.id !== habitId),
      );
      setDeletingHabitId("");
      toast.success("تم حذف العادة الروحية.");
    });
  }

  function handleSignOut() {
    startSignOutTransition(async () => {
      const result = await signOutUser();

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-5">
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">الحساب الشخصي</h2>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            عدّل الاسم الذي يظهر لك داخل عُمران.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="display_name"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              الاسم الكامل
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isProfilePending}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            />
          </div>

          <button
            type="submit"
            disabled={isProfilePending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {isProfilePending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جارٍ الحفظ
              </>
            ) : (
              "حفظ التغييرات"
            )}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-5">
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
            الأوراد والسنن الراتبة النشطة
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            عاداتك الثابتة المربوطة بمرتكزات يومك.
          </p>
        </div>

        {fixedHabits.length ? (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {fixedHabits.map((habit) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">
                      {habit.habit_name}
                    </span>
                    <span className="mx-2 text-zinc-300 dark:text-zinc-600">←</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {PRAYER_ANCHOR_LABELS[habit.prayer_anchor] ||
                        habit.prayer_anchor}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDeleteHabit(habit.id)}
                    disabled={isDeletePending}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    aria-label={`حذف ${habit.habit_name}`}
                  >
                    {deletingHabitId === habit.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-100 bg-zinc-50/40 px-4 py-6 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
            لا توجد أوراد راتبة مفعّلة حالياً.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-red-100 bg-red-50/30 p-4 dark:border-red-900/50 dark:bg-red-950/30">
        <div className="mb-4">
          <h2 className="text-sm font-black text-red-900 dark:text-red-300">منطقة الأمان</h2>
          <p className="mt-1 text-xs font-medium text-red-700/80 dark:text-red-400/80">
            إنهاء الجلسة الحالية والخروج من حسابك.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSignOutPending}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          {isSignOutPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الخروج...
            </>
          ) : (
            "تسجيل الخروج من الحساب"
          )}
        </button>
      </section>
    </div>
  );
}
