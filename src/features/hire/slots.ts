import type { OnlineHourModel } from '@/api/types';

/** Minutes of notice a player reasonably needs before a session can begin. */
const MINIMUM_LEAD_MS = 15 * 60_000;
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;
const BOOKING_HORIZON_DAYS = 7;

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export type BookableSlot = {
  /** ISO instant the session would start at. */
  startsAt: string;
  label: string;
};

export type BookableDay = {
  key: string;
  label: string;
  slots: BookableSlot[];
};

/**
 * The legacy model counts days from Monday = 2 and puts Sunday at 8; the wire
 * model and `getDay()` use Monday = 1 and Sunday = 0.
 */
const weekdayOf = (dayInWeek: number): number => (dayInWeek === 8 ? 0 : dayInWeek - 1);

const minuteLabel = (minuteOfDay: number): string =>
  `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;

/**
 * Turns the hours a player publishes into the start times a hirer can pick.
 *
 * Slots are generated on the hour inside each published window, and a slot only
 * survives if the whole session fits before the window closes — a player who
 * says they are on until 22:00 cannot be booked for a three-hour session at 20:30.
 *
 * The app timezone the backend validates against is Asia/Ho_Chi_Minh; these
 * slots are built in the device's own timezone. For the audience today those are
 * the same, and if they ever are not, the backend answers
 * `slot_outside_availability` rather than booking something wrong.
 */
export type Window = { start: number; end: number };

export const buildBookableDays = (
  windows: OnlineHourModel[],
  hours: number,
  now: Date = new Date(),
): BookableDay[] => {
  const byWeekday = new Map<number, Window[]>();
  for (const window of windows) {
    const day = weekdayOf(window.dayInWeek);
    const list = byWeekday.get(day) ?? [];
    list.push({ start: window.fromHour, end: window.toHour });
    byWeekday.set(day, list);
  }
  if (byWeekday.size === 0) return [];

  const earliest = now.getTime() + MINIMUM_LEAD_MS;
  const days: BookableDay[] = [];

  for (let offset = 0; offset <= BOOKING_HORIZON_DAYS; offset += 1) {
    const date = new Date(now.getTime() + offset * MS_DAY);
    const ranges = byWeekday.get(date.getDay());
    if (!ranges || ranges.length === 0) continue;

    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const slots: BookableSlot[] = [];

    for (const range of ranges) {
      const lastStart = range.end - hours * 60;
      for (
        let minute = Math.ceil(range.start / 60) * 60;
        minute <= lastStart;
        minute += 60
      ) {
        const startsAt = midnight + minute * 60_000;
        if (startsAt < earliest) continue;
        slots.push({ startsAt: new Date(startsAt).toISOString(), label: minuteLabel(minute) });
      }
    }

    if (slots.length === 0) continue;
    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    days.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label: offset === 0 ? 'Hôm nay' : offset === 1 ? 'Ngày mai' : `${WEEKDAY_LABELS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`,
      slots,
    });
  }

  return days;
};

/** The end instant of a session, for the "từ A đến B" line in the summary. */
export const slotEndsAt = (startsAt: string, hours: number): string =>
  new Date(new Date(startsAt).getTime() + hours * MS_HOUR).toISOString();
