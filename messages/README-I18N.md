# نظام الترجمة (i18n)

## الحالة الحالية

- **موجود ويعمل:**
  - مسارات اللغات: `/ar` و `/en`
  - زر تبديل اللغة (يغيّر المسار ويحافظ على الصفحة)
  - اتجاه الصفحة: RTL للعربية، LTR للإنجليزية (`dir` و `lang` في الـ layout)
  - ترجمة النصوص في: **HeroSlider**، **NewsSection**، **GreenCard**

- **ما زال بعربية ثابتة (بدون ترجمة):**
  - Header (القوائم)
  - Footer
  - ProgramsSection، InnovationSection، TuitionFeesSection، ContactSection
  - NewsPageClient، NewsDetailsView، SocialShare، NewsTicker

## كيفية إضافة ترجمة لمكوّن جديد

### 1. إضافة المفاتيح في `messages/ar.json` و `messages/en.json`

```json
// messages/ar.json
{
  "newSection": {
    "title": "العنوان بالعربية",
    "description": "الوصف بالعربية"
  }
}
```

```json
// messages/en.json
{
  "newSection": {
    "title": "Title in English",
    "description": "Description in English"
  }
}
```

### 2. استعمال الترجمة في المكوّن

**مكوّن خادم (Server Component)** — يمرّر له الصفحة `locale`:

```tsx
import { getTranslations, type Locale } from "@/lib/i18n";

export default async function MySection({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  return <h2>{t.newSection.title}</h2>;
}
```

**مكوّن عميل (Client Component)** — يستنتج اللغة من المسار:

```tsx
"use client";
import { usePathname } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";

export default function MyClientSection() {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);
  return <h2>{t.newSection.title}</h2>;
}
```

### 3. التأكد من تمرير `locale` من الصفحة

في `app/ar/page.tsx` و `app/en/page.tsx`، عند استدعاء مكوّن خادم جديد:

```tsx
<MySection locale="ar" />   // في ar/page.tsx
<MySection locale="en" />  // في en/page.tsx
```

## ملاحظات

- لا تغيّر `className` أو بنية الـ HTML عند استبدال النصوص؛ فقط استبدل النص بـ `{t.xxx}`.
- للتنسيق حسب اللغة (مثلاً التاريخ): استخدم `Intl.DateTimeFormat` مع `locale === "ar" ? "ar-IQ" : "en-GB"`.
- المكوّنات المشتركة بين `/ar` و `/en` (مثل Header و Footer داخل الـ layout) تحتاج لاستنتاج اللغة من `usePathname()` لأنها لا تستلم `locale` من الصفحة.
