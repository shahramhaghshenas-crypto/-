import React from 'react';
import { User, Truck, Box, Cpu, BarChart3, Settings, ShieldCheck, CheckCircle2, QrCode, ArrowLeft, Activity, Sparkles, Scale, FileSpreadsheet } from 'lucide-react';
import { DashboardTab, DriverRecord, TruckDetails, EvaluationResult } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface DashboardHomeProps {
  onNavigateTab: (tab: DashboardTab) => void;
  driversCount: number;
  activeDriverName?: string;
  truckDetails: TruckDetails;
  totalCargoPieces: number;
  result: EvaluationResult | null;
  onOpenScanner: () => void;
  onRunCalc: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onNavigateTab,
  driversCount,
  activeDriverName,
  truckDetails,
  totalCargoPieces,
  result,
  onOpenScanner,
  onRunCalc
}) => {
  return (
    <div className="space-y-6">
      {/* Industrial Bosch & Siemens Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border-2 border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600/80 text-white text-xs font-black rounded-lg border border-blue-400/40">
                Bosch / Siemens Industrial UI
              </span>
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                آماده بارگیری کارخانه
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>🚛 Smart Radiator Loading</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed font-medium">
              سیستم هوشمند مدیریت ناوگان، ثبت بار، محاسبه مرکز ثقل و چیدمان سه‌بعدی کارخانه‌ای. طراحی شده برای کار با دستکش در سالن تولید.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-white text-sm font-black rounded-xl border border-slate-700 shadow-md transition flex items-center gap-2"
            >
              <QrCode className="w-5 h-5 text-amber-400" />
              <span>اسکن بارکد / QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onRunCalc();
                onNavigateTab('layout');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-900/50 transition flex items-center gap-2"
            >
              <Cpu className="w-5 h-5" />
              <span>محاسبه سریع چیدمان</span>
            </button>
          </div>
        </div>
      </div>

      {/* Factory Dashboard KPI Cards */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base md:text-lg font-black text-white">📊 داشبورد کارخانه (Factory Dashboard)</h2>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/30 animate-pulse">
            زنده - شیفت فعال
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">🚛 کامیون‌های امروز</span>
            <span className="text-xl font-black text-amber-400 font-mono">{toPersianDigits(14)}</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">📦 رادیاتور بارگیری شده</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{toPersianDigits(2865)} <span className="text-xs font-normal">عدد</span></span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">⚖ وزن حمل شده</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{toPersianDigits(63.8)} <span className="text-xs font-normal">تن</span></span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">📈 میانگین پرشدن کامیون</span>
            <span className="text-xl font-black text-indigo-400 font-mono">{toPersianDigits(91)}٪</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">⏱️ میانگین زمان بارگیری</span>
            <span className="text-xl font-black text-blue-400 font-mono">{toPersianDigits(38)} <span className="text-xs font-normal">دقیقه</span></span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">⚠ هشدارها</span>
            <span className="text-xl font-black text-rose-400 font-mono">{toPersianDigits(3)} <span className="text-xs font-normal">مورد</span></span>
          </div>
        </div>

        {/* Second Row ERP Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400">پراستفاده‌ترین خودرو:</span>
            <strong className="text-amber-300 font-bold">خاور ۶ تن ({toPersianDigits(42)}٪)</strong>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400">بیشترین مقصد ارسال:</span>
            <strong className="text-emerald-300 font-bold">تهران (چراغ برق / شوش)</strong>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400">دقت چیدمان هوش مصنوعی:</span>
            <strong className="text-cyan-300 font-bold">{toPersianDigits(98.4)}٪ ایمنی</strong>
          </div>
        </div>
      </div>

      {/* Main 6 Phase Cards (Glove-Friendly Touch Panels matching user specs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Drivers */}
        <div
          onClick={() => onNavigateTab('drivers')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                {toPersianDigits(driversCount)} راننده ثبت شده
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              👤 ثبت و مدیریت راننده
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ثبت نام، نام خانوادگی، شماره تماس، گواهینامه، پلاک و شرکت باربری.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>راننده جاری: {activeDriverName || 'تعیین نشده'}</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Vehicles */}
        <div
          onClick={() => onNavigateTab('vehicles')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {truckDetails.model}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              🚚 ثبت و تنظیمات کامیون
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تعیین نوع خودرو، ظرفیت وزنی، طول، عرض، ارتفاع و پلاک ناوگان.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>ظرفیت: {toPersianDigits(truckDetails.cap)} kg | ابعاد: {toPersianDigits(truckDetails.L)}×{toPersianDigits(truckDetails.W)}</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Cargo Entry */}
        <div
          onClick={() => onNavigateTab('cargo')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                {toPersianDigits(totalCargoPieces)} رادیاتور
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
              📦 ثبت بار و مقادیر
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ورود سریع تعداد رادیاتورهای ۶۰، ۸۰، ۱۰۰، ۱۲۰ سانت و محاسبه فوری.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>کل رادیاتورهای بار: {toPersianDigits(totalCargoPieces)} عدد</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: AI Smart Loading & 3D */}
        <div
          onClick={() => onNavigateTab('layout')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {result ? `${toPersianDigits(result.fillPercentage)}٪ پرشده` : 'آماده محاسبه'}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              🧠 چیدمان هوشمند و ۳بعدی
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              محاسبه تعادل مرکز ثقل، توزیع بار روی اکسل‌ها و نمایش ۳بعدی چرخشی.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>مشاهده نتیجه و نمای ۳بعدی</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 5: Reports */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800">
                PDF & Excel
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
              📊 گزارش‌ها و آمار کارخانه
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              آمار روزانه/ماهانه، صدور حواله، پرینت فرم بارگیری و اکسل.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
            <span>مشاهده نمودارها و دریافت فایل</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 6: Settings */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800">
                نسخه کارخانه
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
              ⚙ تنظیمات و سطح دسترسی
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ورود با رمز، اسکن بارکد، ثبت عکس/امضا، همگام‌سازی آفلاین و ERP.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
            <span>مدیریت قوانین و ماژول‌ها</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Industrial Quick Live Ticker Status */}
      {result && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="font-black text-sm">وضعیت آنلاین بارگیری جاری (خلاصه هوش مصنوعی):</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('layout')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>مشاهده جزئیات سه‌بعدی</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-[11px] font-bold">ماشین پیشنهادی</span>
              <strong className="text-sm sm:text-base font-black text-amber-300">{result.recommendedTruckName}</strong>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-[11px] font-bold">وزن کل بار</span>
              <strong className="text-sm sm:text-base font-black text-emerald-400 font-mono">{toPersianDigits(result.totalWeight)} kg</strong>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-[11px] font-bold">تعداد رادیاتور</span>
              <strong className="text-sm sm:text-base font-black text-white font-mono">{toPersianDigits(result.totalPieces)} عدد</strong>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-[11px] font-bold">ظرفیت باقی‌مانده</span>
              <strong className="text-sm sm:text-base font-black text-cyan-300 font-mono">{toPersianDigits(result.remainingCap)} kg</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
