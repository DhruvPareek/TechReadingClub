type DatePrecision = "year" | "month" | "day";

function parsePublicationDate(value?: string) {
  if (!value) return null;
  const iso = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value.trim());
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!iso && !us) return null;

  const year = Number(iso ? iso[1] : us![3]);
  const month = Number(iso ? iso[2] ?? 1 : us![1]);
  const day = Number(iso ? iso[3] ?? 1 : us![2]);
  const precision: DatePrecision = iso
    ? iso[3] ? "day" : iso[2] ? "month" : "year"
    : "day";
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return { date, precision };
}

export function publicationDateTimestamp(value?: string) {
  // Partial dates sort at the start of their known month or year.
  return parsePublicationDate(value)?.date.getTime() ?? NaN;
}

export function formatPublicationDate(value?: string) {
  const parsed = parsePublicationDate(value);
  if (!parsed) return "—";
  const { date, precision } = parsed;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    ...(precision !== "year" && { month: "2-digit" }),
    ...(precision === "day" && { day: "2-digit" }),
    timeZone: "UTC",
  });
}
