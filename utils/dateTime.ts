export type DateTimeInput = Date | string | number | null | undefined;

/** Format date/time as `MM-dd-yyyy, hh:mm a` (e.g. `04-14-2026, 05:42 PM`). */
export function formatDateTime(value: DateTimeInput): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const mm = get("month");
  const dd = get("day");
  const yyyy = get("year");
  const hh = get("hour");
  const min = get("minute");
  const dayPeriod = get("dayPeriod");

  return `${mm}-${dd}-${yyyy}, ${hh}:${min} ${dayPeriod}`.trim();
}

