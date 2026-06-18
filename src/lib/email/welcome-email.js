import { Resend } from "resend";
import { getSiteOrigin } from "@/lib/site-origin";

function getWelcomeEmailFrom() {
  return (
    process.env.WELCOME_EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "عُمران <onboarding@resend.dev>"
  );
}

function getRecipientName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "بك"
  );
}

function buildWelcomeEmailHtml({ name, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>أهلاً بك في عُمران</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f3f4;font-family:Tahoma,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f3f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;text-align:center;">
                <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:16px;background:#18181b;color:#ffffff;font-size:22px;font-weight:bold;">ع</div>
                <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.5;color:#09090b;">أهلاً ${name}</h1>
                <p style="margin:0;font-size:15px;line-height:1.9;color:#52525b;">
                  سعداء بانضمامك إلى عُمران. من هنا تبدأ رحلة بناء يومك حول أوقات الصلاة،
                  وتركيزك على ما يهم فعلاً.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;text-align:center;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                  ادخل إلى لوحة مهامك
                </a>
                <p style="margin:18px 0 0;font-size:13px;line-height:1.8;color:#71717a;">
                  بارك الله في يومك، وفقك الله على ما تحب وترضى.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export async function sendWelcomeEmail(user) {
  const apiKey = process.env.RESEND_API_KEY;
  const email = user?.email?.trim();

  if (!apiKey) {
    return { ok: false, skipped: true, reason: "missing_api_key" };
  }

  if (!email) {
    return { ok: false, skipped: true, reason: "missing_email" };
  }

  const resend = new Resend(apiKey);
  const name = getRecipientName(user);
  const dashboardUrl = `${getSiteOrigin()}/dashboard`;

  const { data, error } = await resend.emails.send({
    from: getWelcomeEmailFrom(),
    to: email,
    subject: "أهلاً بك في عُمران",
    html: buildWelcomeEmailHtml({ name, dashboardUrl }),
  });

  if (error) {
    console.error("sendWelcomeEmail:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}
