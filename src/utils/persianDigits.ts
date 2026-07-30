export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null || n === '') return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

export function fmtPersian(n: number | undefined | null, decimals: number = 0): string {
  if (n === undefined || n === null || isNaN(n)) return '۰';
  const formatted = Number(n).toLocaleString('fa-IR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
  return formatted;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
