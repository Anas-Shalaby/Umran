"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/(auth)/actions";
import { useRouter } from "next/navigation";

export function ProfileSetupForm({ initialDisplayName, initialPhone }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const router = useRouter();
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("error");
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateProfile(formData);

      if (result?.error) {
        setMessage(result.error);
        setMessageType("error");
      }

      if (result?.success) {
        setMessage(result.message || "تم حفظ بياناتك بنجاح.");
        setMessageType("success");
        router.push(result.next || "/");
      }
    } catch {
      setMessage("تعذر حفظ بياناتك الآن. حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <TextField
        id="display_name"
        name="display_name"
        label="الاسم الظاهر"
        placeholder="مثال: أحمد"
        defaultValue={initialDisplayName}
        autoComplete="name"
        disabled={pending}
        description="هذا الاسم سيظهر داخل المنصة ومع أعضاء فوجك."
      />

      <TextField
        id="phone"
        name="phone"
        type="tel"
        label="رقم الهاتف"
        placeholder="مثال: 01012345678"
        defaultValue={initialPhone}
        autoComplete="tel"
        disabled={pending}
        description="اكتب رقم هاتفك الأساسي لتجهيز ملفك."
      />

      {message ? <FormMessage type={messageType}>{message}</FormMessage> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ الحفظ
          </>
        ) : (
          <>
            حفظ البيانات
            <ArrowLeft className="h-4 w-4" />
          </>
        )}
      </button>
    </motion.form>
  );
}

function TextField({
  id,
  name,
  type = "text",
  label,
  placeholder,
  defaultValue,
  autoComplete,
  description,
  disabled,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
      />
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function FormMessage({ type, children }) {
  const isSuccess = type === "success";

  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm font-medium leading-6 ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      }`}
    >
      {children}
    </p>
  );
}
