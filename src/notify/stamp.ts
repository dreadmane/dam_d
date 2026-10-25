// When a notification fired or a roll was made, as the folder and the Rolls
// log stamp it (design review, 2026-10-12): the clock, because the folder is
// a log, not a chat. Never "4 min" or "Yesterday". The time alone on the day
// it fired, the day and month on another day, and the year too in another
// year.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n: number) => String(n).padStart(2, '0')

export function stamp(at: Date, now: Date): string {
  const sameYear = at.getFullYear() === now.getFullYear()
  const sameDay = sameYear && at.getMonth() === now.getMonth() && at.getDate() === now.getDate()
  return sameDay ? `${pad(at.getHours())}:${pad(at.getMinutes())}` : `${at.getDate()} ${MONTHS[at.getMonth()]}${sameYear ? '' : ` ${at.getFullYear()}`}`
}
