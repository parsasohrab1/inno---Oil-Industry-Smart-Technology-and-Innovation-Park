# بک‌اند سامانه پارک هوشمند نفت (OIPMS)

Express + `node:sqlite` (بدون وابستگی نیتیو) + JWT. اجرای مستقیم TypeScript روی Node ۲۲٫۵+ (بدون مرحله build در توسعه).

## راه‌اندازی

```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:8787  (بار اول دیتاست سنتتیک را seed می‌کند)
```

| دستور | کاربرد |
| :--- | :--- |
| `npm run dev` | اجرا با watch |
| `npm start` | اجرای نسخه build‌شده (`dist/`) |
| `npm run build` | کامپایل TypeScript |
| `npm run seed` | بازتولید کامل دیتاست (`--reset`) |
| `npm run typecheck` | بررسی نوع |

## کاربران نمونه (پس از seed)

| نقش | ایمیل | رمز |
| :--- | :--- | :--- |
| مدیر پارک | `admin@naftpark.ir` | `admin1234` |
| اپراتور | `operator@naftpark.ir` | `operator1234` |
| مدیر شرکت | `company@naftpark.ir` | `company1234` |
| استارتاپ | `startup@naftpark.ir` | `startup1234` |
| سرمایه‌گذار | `investor@naftpark.ir` | `investor1234` |
| منتور | `mentor@naftpark.ir` | `mentor1234` |

## مسیرهای اصلی API

```
POST  /api/auth/login | /api/auth/register        احراز هویت (JWT در پاسخ)
GET   /api/auth/me                                 کاربر جاری + مجوزها
GET   /api/health                                  سلامت سرویس
GET   /api/public/companies                        فهرست شرکت‌ها (برای ثبت‌نام)

GET   /api/dataset            [dataset:read:all]   دیتاست کامل (اپراتور/مدیر)
GET   /api/dataset/mine                            برش دیتاست شرکتِ کاربر

# شرکت / استارتاپ (نقش company/startup)
GET   /api/company/me | /invoices | /contracts | /funding | /bookings | /mentoring
POST  /api/company/invoices/:id/pay                پرداخت صورتحساب (رفع مسدودی گیت)
POST  /api/company/contracts/:id/sign              امضای دیجیتال طرف مستأجر
POST  /api/company/funding                         ثبت درخواست تأمین مالی
POST  /api/company/bookings | /bookings/:id/cancel رزرو/لغو اتاق جلسه

# قرارداد هوشمند (اپراتور/مدیر)
GET   /api/contracts | /contracts/:id             فهرست + جزئیات + رویدادها + صحت زنجیره هش
POST  /api/contracts                              ایجاد قرارداد
POST  /api/contracts/:id/sign                     امضای طرف پارک
POST  /api/contracts/:id/run-conditions           اجرای خودکار شرط‌ها
POST  /api/contracts/run-conditions/all           اجرای خودکار برای همه قراردادهای فعال
POST  /api/contracts/:id/terminate                فسخ (مدیر)

# منتور
GET   /api/mentor/mentees | /sessions
PATCH /api/mentor/mentees/:id                     به‌روزرسانی پیشرفت
POST  /api/mentor/sessions                        ثبت جلسه منتورینگ

# سرمایه‌گذار
GET   /api/investor/startups | /startups/:id | /funding | /interests
POST  /api/investor/interests | /interests/:id/withdraw

# گزارش‌گیری
GET   /api/reports                                فهرست گزارش‌های مجاز نقش
GET   /api/reports/:id.(html|csv|xlsx)            خروجی گزارش (HTML قابل چاپ → PDF)

# مدیر
GET   /api/admin/users | /audit
POST  /api/admin/users        DELETE /api/admin/users/:id
```

## قرارداد هوشمند — دفتر تغییرناپذیر

هر تغییر قرارداد در جدول `contract_events` با **زنجیره هش SHA-256** ثبت می‌شود
(`hash = sha256(event + prevHash)`). مسیر `GET /api/contracts/:id` صحت کل زنجیره را
بازبینی می‌کند (`chain.valid`). شرط‌های خودکار: جریمه دیرکرد ≥ ۲ ماه، مسدودسازی گیت،
تمدید خودکار در سررسید، و انقضا.

## معماری ذخیره‌سازی

`users` (جدول اختصاصی) + `entities(collection, id, company_id, data JSON)` به‌عنوان انبار
عمومی موجودیت‌ها + `contract_events` + `audit_log`. جای‌گذاری API واقعی صرفاً با
پیاده‌سازی مجدد `lib/dataset.ts` و روت‌ها روی منبع داده جدید ممکن است.
