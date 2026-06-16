"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSignupErrorMessage(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("rate limit") || message.includes("email rate")) {
    return "وصلنا للحد المؤقت لإرسال رسائل التأكيد. انتظر قليلاً ثم حاول مرة أخرى، أو عطّل تأكيد البريد أثناء التطوير من إعدادات Supabase.";
  }

  if (message.includes("already registered")) {
    return "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.";
  }

  return "تعذر إنشاء الحساب الآن. تحقق من بياناتك وحاول مرة أخرى.";
}

function getLoginErrorMessage(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (message.includes("email not confirmed")) {
    return "يرجى تأكيد بريدك الإلكتروني أولاً قبل تسجيل الدخول.";
  }

  if (message.includes("rate limit")) {
    return "تمت محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مرة أخرى.";
  }

  return error.message;
}

export async function getUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { error: error.message };
  }
  return { user: data.user };
}

export async function signup(formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { error: "أكمل بياناتك أولاً حتى نبدأ الرحلة بوضوح." };
  }

  if (password.length < 8) {
    return { error: "اجعل كلمة المرور ٨ أحرف على الأقل لحماية حسابك." };
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        display_name: name,
      },
    },
  });

  if (error) {
    return {
      error: getSignupErrorMessage(error),
    };
  }

  return {
    success: true,
    next: data.session ? "/profile/setup" : null,
    message: data.session
      ? "تم إنشاء حسابك بنجاح. أكمل بيانات ظهورك في عُمران."
      : "تم إنشاء حسابك بنجاح. تحقق من بريدك الإلكتروني لتأكيد الدخول.",
  };
}

export async function login(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "اكتب بريدك وكلمة المرور للمتابعة." };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: getLoginErrorMessage(error),
    };
  }

  return {
    success: true,
    next: "/dashboard",
    message: "تم تسجيل الدخول بنجاح. أهلاً بعودتك إلى عُمران.",
  };
}

export async function updateProfile(formData) {
  const displayName = String(formData.get("display_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!displayName) {
    return { error: "اكتب الاسم الذي تريد أن يظهر داخل عُمران." };
  }

  if (!phone) {
    return { error: "اكتب رقم الهاتف حتى يكتمل ملفك." };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      phone,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: error.message || "تعذر حفظ بياناتك الآن. حاول مرة أخرى." };
  }

  return {
    success: true,
    message: "تم حفظ بياناتك بنجاح.",
  };
}
