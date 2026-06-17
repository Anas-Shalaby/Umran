"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getSiteOrigin } from "@/lib/site-origin";

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "يجب تسجيل الدخول أولاً." };
  }

  return { supabase, user, error: null };
}

export async function updateProfileName(newName) {
  const displayName = String(newName || "").trim();

  if (!displayName) {
    return { error: "اكتب الاسم الكامل أولاً." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)
    .select("id, display_name")
    .single();

  if (error) {
    return { error: "تعذر حفظ الاسم. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { profile: data };
}

export async function deleteFixedHabit(habitId) {
  const cleanHabitId = String(habitId || "").trim();

  if (!cleanHabitId) {
    return { error: "لم يتم تحديد العادة." };
  }

  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase
    .from("fixed_habits")
    .delete()
    .eq("id", cleanHabitId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "تعذر حذف العادة الروحية." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true, habitId: cleanHabitId };
}

export async function updateNewsletterSubscription(subscribed) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      newsletter_subscribed: Boolean(subscribed),
    },
  });

  if (error) {
    return { error: "تعذر تحديث اشتراك النشرة البريدية. حاول مرة أخرى." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, newsletterSubscribed: Boolean(subscribed) };
}

export async function linkGoogleAccount() {
  return linkOAuthAccount("google", {
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });
}

export async function unlinkGoogleAccount() {
  return unlinkOAuthAccount("google", "Google");
}

export async function linkLinkedInAccount() {
  return linkOAuthAccount("linkedin_oidc");
}

export async function unlinkLinkedInAccount() {
  return unlinkOAuthAccount("linkedin_oidc", "LinkedIn");
}

async function linkOAuthAccount(provider, options = {}) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const providerLabel = provider === "linkedin_oidc" ? "LinkedIn" : "Google";
  const hasProvider = user.identities?.some(
    (identity) => identity.provider === provider,
  );

  if (hasProvider) {
    return { error: `حساب ${providerLabel} مرتبط بالفعل.` };
  }

  const origin = getSiteOrigin();
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
      ...options,
    },
  });

  if (error || !data?.url) {
    return { error: `تعذر ربط حساب ${providerLabel}. حاول مرة أخرى.` };
  }

  return { url: data.url };
}

async function unlinkOAuthAccount(provider, providerLabel) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError) {
    return { error: authError };
  }

  const providerIdentity = user.identities?.find(
    (identity) => identity.provider === provider,
  );

  if (!providerIdentity) {
    return { error: `لا يوجد حساب ${providerLabel} مرتبط.` };
  }

  const otherIdentities = (user.identities || []).filter(
    (identity) => identity.provider !== provider,
  );

  if (!otherIdentities.length) {
    return {
      error: `لا يمكن فصل ${providerLabel} لأنه وسيلة الدخول الوحيدة. أضف بريداً وكلمة مرور أو طريقة دخول أخرى أولاً.`,
    };
  }

  const { error } = await supabase.auth.unlinkIdentity(providerIdentity);

  if (error) {
    return { error: `تعذر فصل حساب ${providerLabel}. حاول مرة أخرى.` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function signOutUser() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "تعذر تسجيل الخروج. حاول مرة أخرى." };
  }

  redirect("/login");
}
