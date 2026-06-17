"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, Loader2, Mail, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { PRAYER_ANCHOR_LABELS } from "../prayer-time";
import {
  deleteFixedHabit,
  linkGoogleAccount,
  linkLinkedInAccount,
  signOutUser,
  unlinkGoogleAccount,
  unlinkLinkedInAccount,
  updateNewsletterSubscription,
  updateProfileName,
} from "./actions";
import { GoogleIcon, LinkedInIcon } from "@/components/auth/google-sign-in-button";

function ConnectedAppCard({
  name,
  icon,
  connected,
  email,
  canUnlink,
  pending,
  onLink,
  onUnlink,
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {connected
                ? email || `حساب ${name} مرتبط`
                : `غير مرتبط — اربط حسابك لتسجيل دخول أسرع`}
            </p>
          </div>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={onUnlink}
            disabled={pending || !canUnlink}
            title={
              !canUnlink
                ? `لا يمكن الفصل لأن ${name} هي وسيلة الدخول الوحيدة`
                : undefined
            }
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlink className="h-3.5 w-3.5" />
            )}
            فصل الحساب
          </button>
        ) : (
          <button
            type="button"
            onClick={onLink}
            disabled={pending}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            ربط {name}
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsPanel({
  initialDisplayName,
  initialFixedHabits,
  initialNewsletterSubscribed,
  connectedApps,
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [fixedHabits, setFixedHabits] = useState(initialFixedHabits);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(
    initialNewsletterSubscribed,
  );
  const [googleConnected, setGoogleConnected] = useState(
    connectedApps?.google?.connected || false,
  );
  const [googleEmail, setGoogleEmail] = useState(
    connectedApps?.google?.email || "",
  );
  const [canUnlinkGoogle, setCanUnlinkGoogle] = useState(
    connectedApps?.google?.canUnlink || false,
  );
  const [linkedinConnected, setLinkedinConnected] = useState(
    connectedApps?.linkedin?.connected || false,
  );
  const [linkedinEmail, setLinkedinEmail] = useState(
    connectedApps?.linkedin?.email || "",
  );
  const [canUnlinkLinkedin, setCanUnlinkLinkedin] = useState(
    connectedApps?.linkedin?.canUnlink || false,
  );
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isNewsletterPending, startNewsletterTransition] = useTransition();
  const [pendingOAuthProvider, setPendingOAuthProvider] = useState("");
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

  function handleNewsletterToggle() {
    const nextValue = !newsletterSubscribed;

    startNewsletterTransition(async () => {
      const result = await updateNewsletterSubscription(nextValue);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setNewsletterSubscribed(result.newsletterSubscribed);
      toast.success(
        result.newsletterSubscribed
          ? "تم الاشتراك في النشرة البريدية لعُمران."
          : "تم إلغاء الاشتراك في النشرة البريدية.",
        {
          style: {
            fontFamily: "Umran",
          },
          position: "top-right",
        },
      );
    });
  }

  function handleLinkGoogle() {
    setPendingOAuthProvider("google");
    linkGoogleAccount().then((result) => {
      if (result?.error) {
        toast.error(result.error);
        setPendingOAuthProvider("");
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    });
  }

  function handleUnlinkGoogle() {
    setPendingOAuthProvider("google");
    unlinkGoogleAccount().then((result) => {
      if (result?.error) {
        toast.error(result.error);
        setPendingOAuthProvider("");
        return;
      }

      setGoogleConnected(false);
      setGoogleEmail("");
      setCanUnlinkGoogle(false);
      setPendingOAuthProvider("");
      toast.success("تم فصل حساب Google عن عُمران.");
    });
  }

  function handleLinkLinkedIn() {
    setPendingOAuthProvider("linkedin");
    linkLinkedInAccount().then((result) => {
      if (result?.error) {
        toast.error(result.error);
        setPendingOAuthProvider("");
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    });
  }

  function handleUnlinkLinkedIn() {
    setPendingOAuthProvider("linkedin");
    unlinkLinkedInAccount().then((result) => {
      if (result?.error) {
        toast.error(result.error);
        setPendingOAuthProvider("");
        return;
      }

      setLinkedinConnected(false);
      setLinkedinEmail("");
      setCanUnlinkLinkedin(false);
      setPendingOAuthProvider("");
      toast.success("تم فصل حساب LinkedIn عن عُمران.");
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
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
            الحساب الشخصي
          </h2>
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
        <div className="mb-5 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Mail className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
              النشرة البريدية
            </h2>
            <p className="mt-1 text-xs font-medium leading-6 text-zinc-500 dark:text-zinc-400">
              اشترك لتصلك تحديثات عُمران، نصائح الإنتاجية، والميزات الجديدة على
              بريدك.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              الاشتراك في نشرة عُمران
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {newsletterSubscribed
                ? "أنت مشترك حالياً وسنرسل لك آخر أخبار المنصة."
                : "يمكنك الاشتراك في أي وقت دون التأثير على حسابك."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={newsletterSubscribed}
            aria-label="الاشتراك في النشرة البريدية"
            disabled={isNewsletterPending}
            onClick={handleNewsletterToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950 ${
              newsletterSubscribed
                ? "bg-zinc-900 dark:bg-zinc-50"
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all dark:bg-zinc-950 ${
                newsletterSubscribed ? "left-1" : "right-1"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Link2 className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
              التطبيقات المرتبطة
            </h2>
            <p className="mt-1 text-xs font-medium leading-6 text-zinc-500 dark:text-zinc-400">
              حسابات الطرف الثالث المرتبطة بعُمران لتسهيل تسجيل الدخول.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <ConnectedAppCard
            name="Google"
            icon={<GoogleIcon />}
            connected={googleConnected}
            email={googleEmail}
            canUnlink={canUnlinkGoogle}
            pending={pendingOAuthProvider === "google"}
            onLink={handleLinkGoogle}
            onUnlink={handleUnlinkGoogle}
          />
          <ConnectedAppCard
            name="LinkedIn"
            icon={<LinkedInIcon />}
            connected={linkedinConnected}
            email={linkedinEmail}
            canUnlink={canUnlinkLinkedin}
            pending={pendingOAuthProvider === "linkedin"}
            onLink={handleLinkLinkedIn}
            onUnlink={handleUnlinkLinkedIn}
          />
        </div>
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
                    <span className="mx-2 text-zinc-300 dark:text-zinc-600">
                      ←
                    </span>
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
          <h2 className="text-sm font-black text-red-900 dark:text-red-300">
            منطقة الأمان
          </h2>
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
