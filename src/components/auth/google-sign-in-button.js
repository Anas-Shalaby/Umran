"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithGoogle, signInWithLinkedIn } from "@/app/(auth)/actions";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        fill="#0A66C2"
      />
    </svg>
  );
}

const oauthButtonClassName =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950";

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-3 font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          أو
        </span>
      </div>
    </div>
  );
}

function OAuthSignInButton({
  label,
  pendingLabel,
  disabled,
  onError,
  onSignIn,
  icon,
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    try {
      const result = await onSignIn();

      if (result?.error) {
        onError?.(result.error);
        setPending(false);
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      onError?.(pendingLabel.replace("جارٍ التحويل إلى ", "تعذر بدء تسجيل الدخول عبر "));
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      className={oauthButtonClassName}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}

export function GoogleSignInButton({
  label = "المتابعة عبر Google",
  disabled = false,
  onError,
}) {
  return (
    <OAuthSignInButton
      label={label}
      pendingLabel="جارٍ التحويل إلى Google"
      disabled={disabled}
      onError={onError}
      onSignIn={signInWithGoogle}
      icon={<GoogleIcon />}
    />
  );
}

export function LinkedInSignInButton({
  label = "المتابعة عبر LinkedIn",
  disabled = false,
  onError,
}) {
  return (
    <OAuthSignInButton
      label={label}
      pendingLabel="جارٍ التحويل إلى LinkedIn"
      disabled={disabled}
      onError={onError}
      onSignIn={signInWithLinkedIn}
      icon={<LinkedInIcon />}
    />
  );
}

export function OAuthSignInButtons({ disabled = false, onError, registerMode = false }) {
  return (
    <div className="space-y-3">
      <GoogleSignInButton
        label={registerMode ? "إنشاء حساب عبر Google" : "المتابعة عبر Google"}
        disabled={disabled}
        onError={onError}
      />
      <LinkedInSignInButton
        label={registerMode ? "إنشاء حساب عبر LinkedIn" : "المتابعة عبر LinkedIn"}
        disabled={disabled}
        onError={onError}
      />
    </div>
  );
}

export { GoogleIcon, LinkedInIcon };
