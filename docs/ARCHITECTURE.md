# معماری سامانه پارک هوشمند نفت (OIPMS)

## نمای کلی

سامانه بر پایه مدل **Physical–Cyber–Social (PCS)** طراحی شده است:

| لایه | مؤلفه‌ها | وضعیت در این مخزن |
| :--- | :--- | :--- |
| فیزیکی (Physical) | سنسورهای IoT، دوربین تشخیص چهره، پلاک‌خوان (LPR)، گیت‌های اتوماتیک | شبیه‌سازی‌شده با دیتاست سنتتیک |
| مجازی (Cyber) | پردازش داده، تحلیل، دوقلوی دیجیتال، داشبورد مدیریتی | **پیاده‌سازی‌شده** (این مخزن) |
| اجتماعی (Social) | پنل شرکت‌ها، استارت‌آپ‌ها، سرمایه‌گذاران، اپراتورها | داشبورد اپراتور پیاده‌سازی‌شده؛ پنل‌های سایر نقش‌ها در نقشه راه |

## لایه‌بندی فنی (Frontend)

```
src/
├── app/            پیکربندی مسیرها و ناوبری
├── layout/         پوسته اپلیکیشن: سایدبار (راست‌چین)، هدر، فوتر
├── pages/          صفحات داشبورد (هر ماژول SRS = یک صفحه)
├── components/     اجزای مشترک UI و نمودارها (Recharts)
├── services/       لایه دسترسی داده + توابع تحلیلی (analytics.ts)
├── data/           مولد دیتاست سنتتیک بازتولیدپذیر (seeded RNG)
├── lib/            انواع دامنه، قالب‌بندی فارسی/ریال/جلالی، RNG، Faker
├── hooks/          useDataset — بارگذاری و کش دیتاست
└── store/          وضعیت سراسری (پوسته، سایدبار) با Zustand
```

## جریان داده

1. `services/index.ts` → بسته به `VITE_DATA_SOURCE`:
   - `mock` (پیش‌فرض): از `data/dataset.ts` می‌خواند که `data/generate.ts` را با seed ثابت اجرا می‌کند.
   - `api`: از `GET {VITE_API_BASE_URL}/api/dataset` می‌خواند.
2. `hooks/useDataset.ts` نتیجه را یک‌بار می‌گیرد و در حافظه ماژول کش می‌کند.
3. صفحات، دیتاست خام را به `services/analytics.ts` می‌دهند تا KPIها و سری‌های نمودار محاسبه شود.

## بک‌اند واقعی (`server/`)

پیاده‌سازی شد. Express + `node:sqlite` (بدون وابستگی نیتیو، اجرای مستقیم TypeScript روی Node ۲۲٫۵+).

```
server/src/
├── index.ts          bootstrap + mount روت‌ها + seed خودکار
├── db/
│   ├── schema.sql     DDL (users, entities, contract_events, audit_log, meta)
│   ├── index.ts       اتصال SQLite + helper‌های entities + audit()
│   └── seed.ts        بارگذاری دیتاست سنتتیک + قراردادها + ۶ کاربر نمونه
├── lib/
│   ├── synth.ts       مولد دیتاست (پورت TS از src/data/generate.ts فرانت)
│   ├── auth.ts        bcrypt + JWT
│   ├── rbac.ts        نگاشت نقش → مجوز (Permission)
│   ├── dataset.ts     assembleDataset() از جداول
│   ├── contracts.ts   زنجیره هش، اجرای خودکار شرط‌ها
│   └── reports.ts     تعریف گزارش‌ها + خروجی xlsx/csv/html
├── middleware/auth.ts requireAuth / requireRole / requirePermission
└── routes/           auth, dataset, company, contracts, mentor, investor, reports, admin, misc
```

**احراز هویت:** JWT در پاسخ `login`/`register`، کلاینت آن را در `localStorage` نگه می‌دارد و در
هدر `Authorization: Bearer` می‌فرستد. میدلور `requireAuth` توکن را تأیید و `req.auth` را پر می‌کند.

**کنترل دسترسی:** شش نقش (`admin`, `operator`, `company`, `startup`, `investor`, `mentor`).
هر روت با `requirePermission('...')` محافظت می‌شود و داده به‌صورت ردیفی محدود می‌گردد
(کاربر شرکت فقط `company_id` خودش).

**قرارداد هوشمند:** جدول `contract_events` یک دفتر فقط‌افزودنی با زنجیره هش است:
`hash = sha256({event, prevHash})`. `verifyContractChain()` صحت کل زنجیره را بررسی می‌کند.
`runContractConditions()` شرط‌ها را اجرا می‌کند: جریمه دیرکرد ≥۲ ماه، مسدودسازی گیت،
تمدید خودکار یا انقضا در سررسید.

**گزارش‌گیری:** `GET /api/reports/:id.(xlsx|csv|html)` — xlsx با ExcelJS، html نسخه قابل چاپ
(کاربر از مرورگر PDF می‌گیرد).

**جای‌گذاری منبع داده:** انبار `entities` عمومی است؛ برای مهاجرت به Postgres کافی است
helper‌های `db/index.ts` بازنویسی شوند.

## یکپارچگی‌های کلیدی پیاده‌سازی‌شده در منطق سنتتیک

- **مالی ↔ کنترل تردد:** شرکتِ دارای بدهی معوق ≥ ۲ ماه → `gateAccessRevoked=true` و ترددهای خودروی مبدأ آن `authorized=false`.
- **نوتیفیکیشن‌های مشتق:** هشدارهای بحرانی/هشدار از روی بدهی‌ها، تردد غیرمجاز، رویدادهای پیش‌رو و تأمین مالی مصوب ساخته می‌شوند.
- **داوری استارت‌آپ:** فرمول SRS: `۰٫۳×تیم + ۰٫۳۵×محصول + ۰٫۳۵×بازار` × ضریب صنعت × ضریب مرحله رشد.
