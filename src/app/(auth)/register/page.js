"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { signup } from "@/app/(auth)/actions";

const fields = [
  {
    id: "name",
    name: "name",
    type: "text",
    label: "اسمك الكامل",
    placeholder: "مثال: أحمد محمد",
    autoComplete: "name",
    description: "اكتب الاسم الذي سيظهر داخل فوجك.",
  },
  {
    id: "email",
    name: "email",
    type: "email",
    label: "البريد الإلكتروني",
    placeholder: "you@example.com",
    autoComplete: "email",
    description: "سنستخدمه لتأكيد حسابك وتسجيل دخولك.",
  },
  {
    id: "password",
    name: "password",
    type: "password",
    label: "كلمة المرور",
    placeholder: "٨ أحرف على الأقل",
    autoComplete: "new-password",
    description: "اختر كلمة مرور واضحة وقوية.",
  },
];

export default function RegisterPage() {
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
      const result = await signup(formData);

      if (result?.error) {
        setMessage(result.error);
        setMessageType("error");
      }

      if (result?.success) {
        setMessage(result.message || "تم إنشاء حسابك بنجاح.");
        setMessageType("success");
        event.currentTarget.reset();

        if (result.next) {
          router.push(result.next);
          router.refresh();
        }
      }
    } catch {
      setMessage("تعذر إنشاء الحساب الآن. حاول مرة أخرى بعد لحظات.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/50 px-5 py-8 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8"
    >
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-[2rem] border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12 lg:p-16"
        >
          <div className="mx-auto max-w-md">
            <RegisterHeader />
            <RegisterForm
              pending={pending}
              message={message}
              messageType={messageType}
              onSubmit={handleSubmit}
            />
            <LoginPrompt />
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function RegisterHeader() {
  return (
    <div className="mb-10 text-center">
      <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">عُمران</p>
      <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
        إنشاء حساب جديد
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
        افتح مساحة تجمع وردك، تركيزك، وفوجك في تجربة هادئة بلا مشتتات.
      </p>
    </div>
  );
}

function RegisterForm({ pending, message, messageType, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {fields.map((field) => (
        <TextField key={field.id} {...field} disabled={pending} />
      ))}

      {message ? <FormMessage type={messageType}>{message}</FormMessage> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ إنشاء الحساب
          </>
        ) : (
          <>
            إنشاء الحساب
            <ArrowLeft className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
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

function LoginPrompt() {
  return (
    <p className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
      لديك حساب بالفعل؟{" "}
      <Link
        href="/login"
        className="font-semibold text-zinc-950 underline-offset-4 transition hover:underline dark:text-zinc-50"
      >
        سجّل الدخول
      </Link>
    </p>
  );
}

function TextField({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  description,
  disabled,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
      />
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
