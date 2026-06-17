"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  completeNavigation,
  getNavigationProgressServerSnapshot,
  getNavigationProgressSnapshot,
  subscribeNavigationProgress,
} from "@/lib/navigation-progress";

function useNavigationProgress() {
  return useSyncExternalStore(
    subscribeNavigationProgress,
    getNavigationProgressSnapshot,
    getNavigationProgressServerSnapshot,
  );
}

function NavigationProgressListener() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    completeNavigation();
  }, [pathname]);

  return null;
}

export function NavigationProgressBar() {
  const { active, completing } = useNavigationProgress();
  const visible = active || completing;

  return (
    <>
      <NavigationProgressListener />
      <div
        aria-hidden={!visible}
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full overflow-hidden bg-emerald-500/10">
          {active ? (
            <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]" />
          ) : null}
          {completing ? (
            <span className="block h-full w-full origin-left animate-nav-progress-complete rounded-full bg-emerald-500" />
          ) : null}
        </div>
      </div>
    </>
  );
}
