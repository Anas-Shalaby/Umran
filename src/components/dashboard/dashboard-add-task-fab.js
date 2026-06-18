"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  AddTaskModal,
  FloatingAddTaskButton,
} from "@/app/dashboard/add-task-modal";
import { getTodayCustomTasksCount } from "@/app/dashboard/actions";
import { getCurrentPrayerAnchor } from "@/app/dashboard/prayer-time";

const HYPER_FOCUS_EVENT = "umran:hyper-focus-change";
export const TASK_ADDED_EVENT = "umran:task-added";

const HIDDEN_PATH_PREFIXES = ["/dashboard/onboarding"];

function shouldHideFab(pathname) {
  return HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
}

export function DashboardAddTaskFab() {
  const pathname = usePathname();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customTasksCount, setCustomTasksCount] = useState(0);
  const [isFocusActive, setIsFocusActive] = useState(false);

  const loadTaskCount = useCallback(async () => {
    const result = await getTodayCustomTasksCount();
    if (!result.error) {
      setCustomTasksCount(result.customTasksCount);
    }
  }, []);

  useEffect(() => {
    function handleFocusChange(event) {
      setIsFocusActive(Boolean(event.detail?.active));
    }

    window.addEventListener(HYPER_FOCUS_EVENT, handleFocusChange);

    return () => {
      window.removeEventListener(HYPER_FOCUS_EVENT, handleFocusChange);
    };
  }, []);

  useEffect(() => {
    if (!isAddModalOpen) return;
    loadTaskCount();
  }, [isAddModalOpen, loadTaskCount]);

  function handleSaved(result) {
    if (!result?.task) return;

    window.dispatchEvent(
      new CustomEvent(TASK_ADDED_EVENT, { detail: result }),
    );

    if (result.isScheduled) {
      toast.success("تمت جدولة المهمة.", {
        position: "top-right",
        style: { fontFamily: "Umran" },
      });
    } else {
      toast.success("تمت إضافة المهمة.", {
        position: "top-right",
        style: { fontFamily: "Umran" },
      });
    }

    loadTaskCount();
  }

  if (shouldHideFab(pathname)) {
    return null;
  }

  return (
    <>
      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultPrayerAnchor={getCurrentPrayerAnchor()}
        customTasksCount={customTasksCount}
        onSaved={handleSaved}
        fixedHabitToggleId="global-add-task-fixed-habit"
      />

      <FloatingAddTaskButton
        hidden={isFocusActive}
        onClick={() => setIsAddModalOpen(true)}
      />
    </>
  );
}
