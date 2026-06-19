# عُمران — Umran

**منصة إنتاجية روحية للمسلم الشاب** — تربط بين الغاية الكبرى، الصلوات الخمس، والتركيز العميق، بدل الضياع في مهام لا تُغلق ولا تُنجز.

> _«لا تُدار الحياة بالحماس العابر، بل بغاية واضحة ونظام يومي هادئ.»_

---

## لماذا عُمران؟

كثير من أدوات الإنتاجية تفترض أن الإرادة لا تنفد. عُمران يبدأ من فرضية أخرى: الإنسان يحتاج **غاية** تُحمل التعب، و**إيقاعاً** يُذكّره بها، و**حدوداً** تحميه من التشتت.

الفكرة مستوحاة من منطق الصحابة — ليس «قوة خارقة من فراغ»، بل بوصلة واضحة وعمل متسق.

---

## الميزات الرئيسية

| المجال                  | الوصف                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **الغاية الكبرى**       | شاشة onboarding سينمائية (`/onboarding`) تُلزم المستخدم بتعريف غايته قبل دخول المحراب |
| **لوحة اليوم**          | مهام مرتبطة بمرتكزات الصلاة مع قاعدة **ثلاث ثغرات دنيوية** يومياً، **جدولة لأيام قادمة**، وقسم **مهام قادمة** |
| **الإشعارات**           | جرس في الشريط الجانبي — يُرسل تذكيراً عند حلول `scheduled_time` في يوم المهمة |
| **الاستغراق**           | جلسات Hyper Focus مفتوحة المدة مع حفظ `duration_minutes` لكل مهمة                     |
| **الأوراد الراتبة**     | عادات روحية ثابتة تُزامَن تلقائياً مع جدول اليوم                                      |
| **الأهداف والخطوات**    | أهداف كبرى + ثغرات تفصيلية بأولويات ومواعيد صلاة                                      |
| **دفتر الليل**          | إغلاق يومي انعكاسي (فخر، تشتت، ملاحظة للغد)                                           |
| **تقويم الأثر**         | عرض بصري لإنجاز الأيام السابقة                                                        |
| **المعسكرات المفتوحة**  | غرف عمليات تعاونية للتركيز العميق مع gauge جماعي وخريطة ثغر مشتركة                    |
| **تقدم المعسكر الصارم** | ساعات المعسكر تُحسب **فقط** من وقت التركيز على مهام مربوطة بثغرات المعسكر             |
| **PWA**                 | تثبيت التطبيق على الجوال/سطح المكتب (معطّل في وضع التطوير)                            |
| **وضع فاتح / داكن**     | دعم كامل عبر `next-themes`                                                            |

---

## التقنيات

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Auth & DB:** [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Motion:** [Framer Motion](https://www.framer.com/motion/)
- **UI:** Lucide Icons · Sonner (toasts) · Radix Dialog
- **PWA:** `@ducanh2912/next-pwa`

---

## البدء السريع

### المتطلبات

- Node.js 18+
- npm أو pnpm
- مشروع Supabase (مجاني يكفي للتطوير)

### 1. استنساخ المشروع

```bash
git clone <repo-url>
cd Umran
npm install
```

> المفاتيح من: Supabase Dashboard → **Project Settings** → **API**

### 2. إعداد قاعدة البيانات

شغّل ملفات SQL في **Supabase SQL Editor** بالترتيب:

#### أعمدة وميزات إضافية

```sql
-- عمود الغاية الكبرى (مطلوب لشاشة /onboarding)
alter table public.profiles
  add column if not exists ultimate_purpose text;
```

#### migrations (مجلد `supabase/migrations/`)

```
008_add_scheduled_time_to_tasks.sql
009_notifications.sql
010_task_reminder_sent_at.sql
011_task_reminder_rpc.sql
012_notifications_grants.sql
013_notifications_read_rpc.sql
014_task_recurrence.sql
```

شغّل كل migrations بالترتيب — **`013_notifications_read_rpc.sql` ضروري** لقراءة الإشعارات في الجرس، و**`014_task_recurrence.sql`** لتكرار المهام (يومي/أسبوعي).

> تأكد أيضاً من وجود جداول `tasks` و`goals` و`goal_tasks` في مشروعك إن لم تكن ضمن migrations — راجع schema مشروعك في Supabase.

#### المعسكرات (مجلد `supabase/`)

```
camps.sql
camps-rls-fix.sql      ← إن واجهت أخطاء RLS عند الإنشاء
camp-tasks.sql
camp-progress.sql
```

### 3. تشغيل التطوير

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### 5. البناء للإنتاج

```bash
npm run build
npm start
```

---

## مسار المستخدم

```
التسجيل / الدخول
    ↓
/profile/setup        ← الاسم والهاتف
    ↓
/onboarding           ← توثيق الغاية الكبرى (إلزامي)
    ↓
/dashboard            ← لوحة اليوم
    ↓
/dashboard/onboarding   ← الأوراد + الثغرات الثلاث (أول مرة)
```

أي محاولة دخول `/dashboard/*` بدون `ultimate_purpose` تُعاد توجيهاً تلقائياً إلى `/onboarding`.

---

## هيكل المشروع

```
src/
├── app/
│   ├── (auth)/              # تسجيل الدخول والتسجيل
│   ├── actions/user.js      # saveUltimatePurpose
│   ├── auth/callback/       # OAuth / magic link callback
│   ├── dashboard/           # المحراب الرئيسي
│   │   ├── camps/           # المعسكرات المفتوحة
│   │   ├── goals/           # الأهداف والخطوات
│   │   ├── journal/         # دفتر الليل
│   │   ├── calendar/        # تقويم الأثر
│   │   ├── onboarding/      # إعداد اليوم الأول
│   │   └── settings/
│   ├── onboarding/          # شاشة الغاية الكبرى
│   └── profile/setup/
├── components/
│   ├── dashboard/           # Sidebar وغيره
│   └── landing/             # الصفحة التعريفية
├── lib/                     # Supabase، PWA، navigation
└── middleware.js            # تجديد جلسة Supabase


---

## منطق المعسكرات (ملخص)

1. منشئ المعسكر يضيف **ثغرات** في `camp_tasks`.
2. المشارك ي **يسحب** ثغرة إلى يومه (`source_camp_task_id` في `tasks`).
3. عند إكمال جلسة استغراق، يُحفظ `duration_minutes`.
4. تقدم المعسكر = مجموع دقائق التركيز على المهام المربوطة ÷ (هدف الساعات × 60).

التركيز الشخصي غير المربوط **لا يحرك** المؤشر الجماعي.

---

## تذكير المهام (الإشعارات)

التذكير يُنشأ عند **حلول `scheduled_time`** في يوم `task_date` — وليس عند الجدولة.

| المتغير | الغرض |
|---------|--------|
| `CRON_SECRET` | حماية `/api/cron/task-reminders` |
| `SUPABASE_SERVICE_ROLE_KEY` | معالجة التذكيرات لكل المستخدمين عبر الـ cron |

عند فتح التطبيق، الجرس يفحص التذكيرات كل 30 ثانية للمستخدم الحالي. في الإنتاج (Vercel)، `vercel.json` يشغّل الـ cron كل 5 دقائق.

اختبار محلي:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/task-reminders
```

---

## الأوامر

| الأمر | الوصف |
|-------|--------|
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء الإنتاج |
| `npm start` | تشغيل البناء |
| `npm run lint` | فحص ESLint |

---

## التصميم والتجربة

- **RTL** افتراضي على كل الواجهة العربية
- **Zinc + Emerald** كنظام ألوان أساسي
- **Framer Motion** للانتقالات الهادئة والسينمائية
- **Mobile-first** على الداشبورد، تفاصيل المعسكر، والـ sidebar (drawer على الشاشات الصغيرة)

---

## المساهمة

المشروع خاص حالياً (`private`). للمساهمة الداخلية:

1. افتح branch من `main`
2. التزم بأسلوب الكود الموجود (Server Actions، `dark:` classes، نصوص عربية في الواجهة)
3. شغّل `npm run lint` قبل الـ PR
4. وثّق أي SQL جديد في `supabase/`

---

## الترخيص

جميع الحقوق محفوظة — مشروع خاص ما لم يُذكر خلاف ذلك.

---

<p align="center">
  <strong>عُمران</strong> — ابنِ يومك حول الصلاة، واترك أثراً.
</p>
```
