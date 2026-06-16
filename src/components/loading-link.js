"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export function LoadingLink({ href, children, className = "" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(event) {
    event.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={isPending}
      className={`gap-2 ${className} ${isPending ? "pointer-events-none opacity-70" : ""}`}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ التحميل...
        </>
      ) : (
        children
      )}
    </Link>
  );
}
