import React, { useState } from 'react';
import { QrCode, CheckCircle2, Scan, RefreshCw, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { EvaluationResult } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult | null;
  totalPieces: number;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  result,
  totalPieces
}) => {
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScannedItem, setLastScannedItem] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen || !result || !result.ok) return null;

  const handleSimulateScanOne = () => {
    if (scannedCount >= totalPieces) return;
    setIsSimulating(true);
    setTimeout(() => {
      const nextCount = scannedCount + 1;
      setScannedCount(nextCount);
      const sizes = [60, 80, 100, 120, 140, 160, 180];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      const code = `RAD-${randomSize}-#${Math.floor(1000 + Math.random() * 9000)}`;
      setLastScannedItem(code);
      setIsSimulating(false);
    }, 400);
  };

  const handleScanAllAuto = () => {
    setScannedCount(totalPieces);
    setLastScannedItem(`RAD-DONE-#9999 (تکمیل اسکن کلی)`);
  };

  const handleResetScan = () => {
    setScannedCount(0);
    setLastScannedItem(null);
  };

  const progressPct = totalPieces > 0 ? Math.round((scannedCount / totalPieces) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            <QrCode className="w-5 h-5 text-indigo-500" />
            <span>اسکنر صحت‌سنجی بارگیری (بارکد خوان)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          {/* Scanner View Box */}
          <div className="relative border-2 border-dashed border-indigo-400/60 dark:border-indigo-600/60 rounded-2xl p-6 bg-slate-900 text-white overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[160px]">
            {/* Animated Scan Line */}
            {isSimulating && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_15px_#10b981]" />
            )}

            <Scan className={`w-12 h-12 mb-2 ${isSimulating ? 'text-emerald-400 animate-spin' : 'text-indigo-400'}`} />
            
            <p className="text-xs text-slate-300 font-medium">
              {isSimulating ? 'در حال خواندن بارکد...' : 'بارکد رادیاتور را مقابل دوربین یا اسکنر قرار دهید'}
            </p>

            {lastScannedItem && (
              <div className="mt-3 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg font-mono flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>آخرین بارکد ثبت‌شده: {lastScannedItem}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">پیشرفت بارگیری و تایید قطعات:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                {toPersianDigits(scannedCount)} / {toPersianDigits(totalPieces)} ({toPersianDigits(progressPct)}٪)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Scan Controls */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSimulateScanOne}
              disabled={scannedCount >= totalPieces || isSimulating}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Scan className="w-4 h-4" />
              <span>اسکن قطعه بعدی (+۱)</span>
            </button>
            <button
              onClick={handleScanAllAuto}
              disabled={scannedCount >= totalPieces}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>تایید یکباره کل بار</span>
            </button>
          </div>

          {scannedCount > 0 && (
            <button
              onClick={handleResetScan}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center gap-1 mx-auto transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازنشانی آمار اسکن</span>
            </button>
          )}

          {scannedCount === totalPieces && totalPieces > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>تمام رادیاتورها با بارنامه تطبیق داده شدند! بار آماده خروج است.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            بستن اسکنر
          </button>
        </div>
      </div>
    </div>
  );
};
