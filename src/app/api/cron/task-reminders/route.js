import { NextResponse } from "next/server";
import { processDueTaskReminders } from "@/lib/notifications/task-reminders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const result = await processDueTaskReminders(supabase);

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      dueCount: result.dueCount,
    });
  } catch (error) {
    console.error("task-reminders cron:", error);
    return NextResponse.json(
      { error: "Failed to process task reminders." },
      { status: 500 },
    );
  }
}
