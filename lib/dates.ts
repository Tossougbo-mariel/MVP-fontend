import type { Locale } from 'next-intl';

export const monthName = (date: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);

export const monthNameShort = (date: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);

export const weekdayShort = (date: Date, locale: Locale | string = 'fr'): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
};

export const formatDay = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);

export const formatDayLong = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(d);

export const formatDateShort = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);

export const formatDateLong = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

export const formatDateTimeShort = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

export const formatDateTimeLong = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

export const formatDateISO = (d: Date, locale: Locale | string = 'fr'): string =>
  new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(d);

export const formatNumber = (n: number, locale: Locale | string = 'fr'): string =>
  new Intl.NumberFormat(locale).format(n);

export const formatFileSize = (bytes: number, locale: Locale | string = 'fr'): string => {
  if (!bytes || bytes < 1024) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'byte' }).format(bytes || 0);
  }
  const units = ['kilobyte', 'megabyte', 'gigabyte'] as const;
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[i],
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value);
};

/** Temps relatif court (« il y a 5 min » / « 5 min ago »), via Intl.RelativeTimeFormat. */
export const relativeTime = (date: Date | string, locale: Locale | string = 'fr'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const diffMs = d.getTime() - Date.now();
  const absMin = Math.floor(Math.abs(diffMs) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (absMin < 1) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  }
  if (absMin < 60) return rtf.format(Math.trunc(diffMs / 60000), 'minute');
  const hours = Math.trunc(absMin / 60);
  if (hours < 24) return rtf.format(Math.trunc(diffMs / 3600000), 'hour');
  const days = Math.trunc(hours / 24);
  if (days < 7) return rtf.format(Math.trunc(diffMs / 86400000), 'day');
  const weeks = Math.trunc(days / 7);
  if (weeks < 5) return rtf.format(Math.trunc(diffMs / (7 * 86400000)), 'week');
  return formatDay(d, locale);
};

/** Jour relatif d'une échéance (0 = aujourd'hui, 1 = demain…), via Intl.RelativeTimeFormat. */
export const relativeDayLabel = (dayDiff: number, locale: Locale | string = 'fr'): string =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(dayDiff, 'day');

