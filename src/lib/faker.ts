import { Rng } from './rng'

const FIRST_NAMES = [
  'Ali', 'Mohammad', 'Reza', 'Hossein', 'Mehdi', 'Amir', 'Saeed', 'Hassan', 'Majid', 'Kaveh',
  'Sara', 'Maryam', 'Zahra', 'Fatemeh', 'Negar', 'Shima', 'Elham', 'Nazanin', 'Parisa', 'Mina',
  'Behrooz', 'Kian', 'Arash', 'Pouya', 'Sina', 'Farhad', 'Babak', 'Nima', 'Yasaman', 'Raha',
]
const LAST_NAMES = [
  'Mohammadi', 'Hosseini', 'Rezaei', 'Karimi', 'Mousavi', 'Ahmadi', 'Sadeghi', 'Ghasemi', 'Jafari', 'Kazemi',
  'Najafi', 'Yousefi', 'Abbasi', 'Rahimi', 'Sharifi', 'Akbari', 'Zare', 'Farhadi', 'Moradi', 'Soltani',
]
const COMPANY_PREFIX = [
  'Technologists', 'Knowledge-based', 'Pioneers', 'Innovators', 'Industries', 'Engineering', 'Development', 'Research',
  'Expansion', 'Armane', 'Pars', 'Kian', 'Smart', 'Biotechnology',
]
const COMPANY_CORE = [
  'Oil', 'Energy', 'Petrochemical', 'Refining', 'Catalyst', 'Instrumentation', 'Automation', 'Drilling',
  'Corrosion', 'Polymer', 'Data', 'Measurement', 'Control', 'Advanced Materials',
]
const COMPANY_SUFFIX = ['Parsian', 'Middle East', 'Iranian', 'Asia', 'Zagros', 'Karoun', 'Persian Gulf', 'Alborz']

const IDEA_ADJ = ['Smart', 'Integrated', 'Real-time', 'AI-based', 'Low-power', 'Cloud', 'Predictive']
const IDEA_NOUN = [
  'Pipeline corrosion monitoring system',
  'Refinery energy consumption optimization platform',
  'Digital twin of oil tanks',
  'Multiphase flow measurement sensor',
  'Gas leak detection system',
  'Physical asset management software',
  'Next-generation refining process catalyst',
  'Tank inspection robot',
  'Smart flare management system',
  'Drilling data analytics platform',
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
    return `Team ${this.rng.pick(COMPANY_CORE)} ${this.rng.pick(COMPANY_SUFFIX)}`
  }

  ideaTitle() {
    return `${this.rng.pick(IDEA_NOUN)} ${this.rng.pick(IDEA_ADJ)}`
  }

  licensePlate() {
    const letters = ['A', 'B', 'P', 'T', 'S', 'J', 'D', 'E', 'Q', 'N']
    return `${this.rng.int(10, 99)} ${this.rng.pick(letters)} ${this.rng.int(100, 999)} - ${this.rng.int(11, 99)}`
  }

  /** Random date between offsetDaysStart and offsetDaysEnd relative to now */
  dateBetween(offsetDaysStart: number, offsetDaysEnd: number, now = Date.now()): Date {
    const start = now + offsetDaysStart * 86400000
    const end = now + offsetDaysEnd * 86400000
    return new Date(this.rng.float(start, end))
  }
}
