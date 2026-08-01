export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null || n === '') return '';
  return String(n);
}

export function fmtPersian(n: number | undefined | null, decimals: number = 0): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  const formatted = Number(n).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
  return formatted;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

