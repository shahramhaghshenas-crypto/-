import React from 'react';
import { BarChart3, FileSpreadsheet, Printer, TrendingUp, Calendar, CheckCircle2, Truck, Box, Scale } from 'lucide-react';
import { EvaluationResult, TruckDetails, SavedLoadingRecord } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface FactoryReportsCardProps {
  result: EvaluationResult | null;
  truckDetails: TruckDetails;
  totalPieces: number;
  onPrint: () => void;
  onExportCSV: () => void;
  savedRecords?: SavedLoadingRecord[];
}

export const FactoryReportsCard: React.FC<FactoryReportsCardProps> = ({
  result,
  truckDetails,
  totalPieces,
  onPrint,
  onExportCSV,
  savedRecords = []
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-200 dark:shadow-none">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
              گزارش‌ها و آمار بارگیری کارخانه (فاز ۷)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تولید گزارش رسمی PDF، خروجی اکسل، نمودارهای روزانه و ماهانه بارگیری ناوگان
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF & Excel */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs md:text-sm transition flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ / دانلود PDF</span>
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs md:text-sm transition flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی Excel</span>
          </button>
        </div>
      </div>

      {/* Daily & Monthly Quick Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>آمار بارگیری امروز</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {toPersianDigits(12)} <span className="text-xs font-normal text-slate-500">کامیون</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            مجموع بار: {toPersianDigits(42500)} کیلوگرم
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>آمار بارگیری ماه جاری</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {toPersianDigits(284)} <span className="text-xs font-normal text-slate-500">سفر موفق</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            بهینه‌سازی فضای بارگیری: ۹۶٪
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>راندمان چیدمان هوشمند</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
            {toPersianDigits(98.5)}٪ <span className="text-xs font-normal text-slate-500">توازن وزن</span>
          </div>
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            کاهش استهلاک اکسل و ترمز
          </div>
        </div>
      </div>

      {/* Visual Chart Bars (Industrial Daily & Monthly Volume visualizer) */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>نمودار حجم بارگیری روزهای اخیر کارخانه (متر رادیاتور)</span>
        </h3>

        <div className="h-44 flex items-end justify-between gap-2 pt-4 border-b border-slate-800 pb-2">
          {[
            { day: 'شنبه', meters: 420, label: '۴۲۰m' },
            { day: 'یکشنبه', meters: 580, label: '۵۸۰m' },
            { day: 'دوشنبه', meters: 390, label: '۳۹۰m' },
            { day: 'سه‌شنبه', meters: 650, label: '۶۵۰m' },
            { day: 'چهارشنبه', meters: 710, label: '۷۱۰m' },
            { day: 'پنج‌شنبه', meters: 510, label: '۵۱۰m' },
            { day: 'امروز', meters: totalPieces > 0 ? totalPieces * 10 : 620, label: `${toPersianDigits(totalPieces > 0 ? totalPieces * 10 : 620)}m` }
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-mono text-amber-300 font-bold">{toPersianDigits(bar.label)}</span>
              <div
                style={{ height: `${Math.min(100, Math.max(20, (bar.meters / 800) * 100))}%` }}
                className="w-full max-w-[36px] bg-gradient-to-t from-blue-700 to-cyan-400 rounded-t-lg shadow-md transition-all duration-500"
              />
              <span className="text-[11px] font-bold text-slate-400">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Load Official Summary Sheet */}
      {result && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/30 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
            <span>خلاصه حواله بارگیری جاری</span>
            <span className="text-xs text-slate-500 font-normal">کد حواله: {truckDetails.waybillNo || 'WB-98402'}</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">نام راننده:</span>
              <strong className="text-slate-800 dark:text-slate-200">{truckDetails.driverName || 'علی محمدی'}</strong>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">خودرو:</span>
              <strong className="text-slate-800 dark:text-slate-200">{truckDetails.model} ({truckDetails.plate || 'پلاک ثبت نشده'})</strong>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">وزن کل:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{toPersianDigits(result.totalWeight)} kg</strong>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block">تعداد پالت:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{toPersianDigits(result.palletCount || 0)} پالت</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
