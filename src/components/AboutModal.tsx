import React from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2, Layers, QrCode, FileSpreadsheet, RefreshCw, X, Award, HardDrive } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto dir-rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  سامانه هوشمند چیدمان بار رادیاتور (Radiator-AI)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  نسخه 1.0 صنعتی
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                طراحی تخصصی برای کارخانجات تولید رادیاتور، انبارها و ناوگان‌های حمل‌ونقل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>ایمنی و تعادل بار صنعتی</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              محاسبه دقیق مرکز ثقل (CoG)، توزیع وزن محورها، و کنترل فشار روی لایه‌های رادیاتور.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>موتور هوش مصنوعی یادگیرنده</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              تحلیل سوابق بارگیری کارخانه، پیش‌بینی زمان بارگیری و پیشنهاد بهترین الگوی چیدمان.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>مدیریت چند سناریو و Undo/Redo</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              ثبت چند سناریوی چیدمان به صورت همزمان، مقایسه بازدهی و قابلیت قفل سفارش.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <HardDrive className="w-4 h-4" />
              <span>پشتیبانی کامل از PWA و کارکرد آفلاین</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              قابل نصب روی اندروید، iOS و دسکتاپ سالن بارگیری بدون نیاز به اینترنت مداوم.
            </p>
          </div>
        </div>

        {/* Road Map for v1.1 */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-800 text-white space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Award className="w-4 h-4" />
            <span>قابلیت‌های آماده‌شده جهت نسخه 1.1 صنعتی:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 list-disc list-inside">
            <li>ورود خودکار اطلاعات از اکسل و سیستم BOM</li>
            <li>اسکن بارکد QR رادیاتورها موقع بارگیری</li>
            <li>چاپ برچسب چیدمان روی پالت‌ها</li>
            <li>چندزبانه (فارسی، انگلیسی، عربی)</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>سازگار با انواع رادیاتورهای پنلی، پره‌ای، سفالی و آلومینیومی</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl text-xs hover:bg-black transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
