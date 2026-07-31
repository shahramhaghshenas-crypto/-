import React from 'react';
import { Truck, Sparkles, Layers, FileSpreadsheet, Printer, ShieldCheck, History, QrCode, Smartphone } from 'lucide-react';
import { AppMode, UserProfileKey } from '../types';

interface HeaderProps {
  currentProfile: UserProfileKey;
  onProfileChange: (p: UserProfileKey) => void;
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onPrint: () => void;
  onExportCSV: () => void;
  onRunCalc: () => void;
  onOpenHistory: () => void;
  onOpenScanner: () => void;
  isAndroidView?: boolean;
  onToggleAndroidView?: (v: boolean) => void;
}

const PROFILES: { key: UserProfileKey; label: string; desc: string }[] = [
  { key: 'simple', label: 'پروفایل ساده', desc: 'تعداد و خودرو' },
  { key: 'warehouse', label: 'پروفایل انباردار', desc: 'چیدمان + امضا و عکس' },
  { key: 'logistics', label: 'پروفایل لجستیک', desc: 'هزینه، GPS و مقصد' },
  { key: 'manager', label: 'پروفایل مدیر', desc: 'کامل‌ترین سطح دسترسی' },
];

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onProfileChange,
  mode,
  onModeChange,
  onPrint,
  onExportCSV,
  onRunCalc,
  onOpenHistory,
  onOpenScanner,
  isAndroidView = false,
  onToggleAndroidView
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm mb-6 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Main Title & Branding with App Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-md shadow-indigo-100 dark:shadow-none shrink-0 bg-slate-900 group">
            <img
              src="/icon-192.png"
              alt="لوگوی سامانه هوشمند بارگیری رادیاتور (ThermoLink)"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // If image fails to load, replace parent inner HTML with icon
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white bg-indigo-600 -z-10">
              <Truck className="w-7 h-7" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                سامانه هوشمند بارگیری رادیاتور
              </h1>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                نسخه ۲.۴ + پالت سه‌بعدی
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              چیدمان سه‌بعدی پالت (چوبی/فلزی/پلاستیکی)، تغییر دستی کرایه باربری، چیدمان LIFO و نسخه اندروید
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          {onToggleAndroidView && (
            <button
              onClick={() => onToggleAndroidView(!isAndroidView)}
              className={`px-3.5 py-2.5 font-bold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5 ${
                isAndroidView
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
              title="نمایش در قالب اپلیکیشن اندروید"
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>{isAndroidView ? 'خروج از اندروید' : 'برنامه اندروید (APK)'}</span>
            </button>
          )}

          <button
            onClick={onRunCalc}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5 shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <Layers className="w-4 h-4" />
            محاسبه چیدمان
          </button>
          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5"
            title="اسکن صحت‌سنجی بارگیری"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>اسکنر بارکد</span>
          </button>
          <button
            onClick={onOpenHistory}
            className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5"
            title="مشاهده آرشیو بارگیری‌های ذخیره‌شده"
          >
            <History className="w-4 h-4" />
            <span>آرشیو</span>
          </button>
          <button
            onClick={onPrint}
            className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5"
            title="چاپ یا ذخیره به‌صورت PDF"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ PDF</span>
          </button>
          <button
            onClick={onExportCSV}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs md:text-sm transition flex items-center gap-1.5"
            title="خروجی اکسل CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Profile selector & Mode Toggle Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Profile Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 ml-1 whitespace-nowrap">پروفایل کاربری:</span>
          {PROFILES.map((p) => {
            const active = currentProfile === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onProfileChange(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onModeChange('pro')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === 'pro'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              حالت حرفه‌ای
            </button>
            <button
              onClick={() => onModeChange('wizard')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === 'wizard'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              حالت Wizard (گام‌به‌گام)
            </button>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 rounded-lg items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            ارتفاع مجاز: ۱۱ تا ۱۸۰ سانتی‌متر
          </span>
        </div>
      </div>
    </header>
  );
};
