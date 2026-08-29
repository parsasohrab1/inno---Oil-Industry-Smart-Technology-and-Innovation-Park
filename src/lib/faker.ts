import { Rng } from './rng'

const FIRST_NAMES = [
  'علی', 'محمد', 'رضا', 'حسین', 'مهدی', 'امیر', 'سعید', 'حسن', 'مجید', 'کاوه',
  'سارا', 'مریم', 'زهرا', 'فاطمه', 'نگار', 'شیما', 'الهام', 'نازنین', 'پریسا', 'مینا',
  'بهروز', 'کیان', 'آرش', 'پویا', 'سینا', 'فرهاد', 'بابک', 'نیما', 'یاسمن', 'رها',
]
const LAST_NAMES = [
  'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'احمدی', 'صادقی', 'قاسمی', 'جعفری', 'کاظمی',
  'نجفی', 'یوسفی', 'عباسی', 'رحیمی', 'شریفی', 'اکبری', 'زارع', 'فرهادی', 'مرادی', 'سلطانی',
]
const COMPANY_PREFIX = [
  'فناوران', 'دانش‌بنیان', 'پیشگامان', 'نوآوران', 'صنایع', 'مهندسی', 'توسعه', 'پژوهش',
  'گسترش', 'آرمان', 'پارس', 'کیان', 'هوشمند', 'زیست‌فناوری',
]
const COMPANY_CORE = [
  'نفت', 'انرژی', 'پتروشیمی', 'پالایش', 'کاتالیست', 'ابزار دقیق', 'اتوماسیون', 'حفاری',
  'خوردگی', 'پلیمر', 'داده', 'سنجش', 'کنترل', 'مواد پیشرفته',
]
const COMPANY_SUFFIX = ['پارسیان', 'خاورمیانه', 'ایرانیان', 'آسیا', 'زاگرس', 'کارون', 'خلیج فارس', 'البرز']

const IDEA_ADJ = ['هوشمند', 'یکپارچه', 'بلادرنگ', 'مبتنی بر هوش مصنوعی', 'کم‌مصرف', 'ابری', 'پیش‌بینانه']
const IDEA_NOUN = [
  'سامانه پایش خوردگی خطوط لوله',
  'پلتفرم بهینه‌سازی مصرف انرژی پالایشگاه',
  'دوقلوی دیجیتال مخازن نفتی',
  'سنسور اندازه‌گیری جریان چندفازی',
  'سیستم تشخیص نشت گاز',
  'نرم‌افزار مدیریت دارایی فیزیکی',
  'کاتالیست نسل جدید فرآیند پالایش',
  'ربات بازرسی مخازن',
  'سامانه مدیریت هوشمند مشعل',
  'پلتفرم تحلیل داده حفاری',
]

export class Faker {
  constructor(private rng: Rng) {}

  name() {
    return `${this.rng.pick(FIRST_NAMES)} ${this.rng.pick(LAST_NAMES)}`
  }

  company() {
    return `${this.rng.pick(COMPANY_PREFIX)} ${this.rng.pick(COMPANY_CORE)} ${this.rng.pick(COMPANY_SUFFIX)}`
  }

  teamName() {
    return `تیم ${this.rng.pick(COMPANY_CORE)} ${this.rng.pick(COMPANY_SUFFIX)}`
  }

  ideaTitle() {
    return `${this.rng.pick(IDEA_NOUN)} ${this.rng.pick(IDEA_ADJ)}`
  }

  licensePlate() {
    const letters = ['الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'د', 'ع', 'ق', 'ن']
    return `${this.rng.int(10, 99)} ${this.rng.pick(letters)} ${this.rng.int(100, 999)} - ${this.rng.int(11, 99)}`
  }

  /** تاریخ تصادفی بین offsetDaysStart و offsetDaysEnd نسبت به now */
  dateBetween(offsetDaysStart: number, offsetDaysEnd: number, now = Date.now()): Date {
    const start = now + offsetDaysStart * 86400000
    const end = now + offsetDaysEnd * 86400000
    return new Date(this.rng.float(start, end))
  }
}
