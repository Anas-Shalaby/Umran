"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/app/(auth)/actions";
import {
  AuthDivider,
  OAuthSignInButtons,
} from "@/components/auth/google-sign-in-button";

const fields = [
  {
    id: "email",
    name: "email",
    type: "email",
    label: "البريد الإلكتروني",
    placeholder: "you@example.com",
    autoComplete: "email",
    description: "استخدم البريد الذي أنشأت به حسابك.",
  },
  {
    id: "password",
    name: "password",
    type: "password",
    label: "كلمة المرور",
    placeholder: "كلمة المرور",
    autoComplete: "current-password",
    description: "أدخل كلمة المرور الخاصة بحسابك.",
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-50/50 px-5 py-8 text-start text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8"
    >
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </section>
    </main>
  );
}

function LoginPageContent() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setMessage(oauthError);
      setMessageType("error");
    }
  }, [searchParams]);
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("error");
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await login(formData);

      if (result?.error) {
        setMessage(result.error);
        setMessageType("error");
      }

      if (result?.success) {
        setMessage(result.message || "تم تسجيل الدخول بنجاح.");
        setMessageType("success");
        event.target.reset();
        router.push(result.next || "/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(error.message || "تعذر تسجيل الدخول الآن. حاول مرة أخرى.");
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
          <ArrowLeft
            className="absolute hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full p-2 top-4 left-4 cursor-pointer transition-all duration-300"
            size={34}
            onClick={() => router.push("/")}
          />
          <div className="mx-auto max-w-md">
            <LoginHeader />
            <LoginForm
              pending={pending}
              message={message}
              messageType={messageType}
              onSubmit={handleSubmit}
            />
            <AuthDivider />
            <OAuthSignInButtons
              disabled={pending}
              onError={(errorMessage) => {
                setMessage(errorMessage);
                setMessageType("error");
              }}
            />
            <RegisterPrompt />
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function LoginHeader() {
  return (
    <div className="mb-10 text-center">
      <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        عُمران
      </p>
      <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
        تسجيل الدخول
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-7 text-zinc-500 dark:text-zinc-400">
        عد إلى مساحتك الهادئة، وتابع وردك وتركيزك مع فوجك من حيث توقفت.
      </p>
    </div>
  );
}

function LoginForm({ pending, message, messageType, onSubmit }) {
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
            جارٍ تسجيل الدخول
          </>
        ) : (
          <>
            دخول
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

function RegisterPrompt() {
  return (
    <p className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
      ليس لديك حساب؟{" "}
      <Link
        href="/register"
        className="font-semibold text-zinc-950 underline-offset-4 transition hover:underline dark:text-zinc-50"
      >
        أنشئ حساباً جديداً
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
        autoComplete={autoComplete}
        className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950"
      />
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
