import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/welcome-email";

function hasWelcomeEmailBeenSent(user) {
  return Boolean(user?.user_metadata?.welcome_email_sent_at);
}

export async function maybeSendWelcomeEmailForUser(user) {
  if (!user?.id || !user?.email) {
    return { ok: false, skipped: true, reason: "missing_user" };
  }

  if (hasWelcomeEmailBeenSent(user)) {
    return { ok: true, skipped: true, reason: "already_sent" };
  }

  const sendResult = await sendWelcomeEmail(user);

  if (!sendResult.ok) {
    return sendResult;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: currentUser, error: fetchError } =
      await admin.auth.admin.getUserById(user.id);

    if (fetchError) {
      console.error("maybeSendWelcomeEmailForUser:getUserById", fetchError);
      return { ok: true, sent: true, warning: "metadata_not_updated" };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...(currentUser.user?.user_metadata || {}),
          welcome_email_sent_at: new Date().toISOString(),
        },
      },
    );

    if (updateError) {
      console.error("maybeSendWelcomeEmailForUser:updateUserById", updateError);
      return { ok: true, sent: true, warning: "metadata_not_updated" };
    }
  } catch (error) {
    console.error("maybeSendWelcomeEmailForUser:", error);
    return { ok: true, sent: true, warning: "metadata_not_updated" };
  }

  return { ok: true, sent: true };
}
