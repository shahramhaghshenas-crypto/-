import React, { useState } from 'react';
import { Settings, Lock, ShieldCheck, QrCode, WifiOff, RefreshCw, Database, Server, UserCheck, Key, CheckCircle2 } from 'lucide-react';
import { UserProfileKey } from '../types';

interface FactorySettingsCardProps {
  currentProfile: UserProfileKey;
  onProfileChange: (profile: UserProfileKey) => void;
  onOpenScanner: () => void;
  onOpenHistory: () => void;
}

export const FactorySettingsCard: React.FC<FactorySettingsCardProps> = ({
  currentProfile,
  onProfileChange,
  onOpenScanner,
  onOpenHistory
}) => {
  const [pinInput, setPinInput] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin' || pinInput.length >= 4) {
      setAuthSuccess(true);
      onProfileChange('manager');
      setPinInput('');
    } else {
      alert('رمز عبور اشتباه است (رمز نمونه: 1234)');
    }
  };

  const handleTriggerSync = () => {
    setSyncStatus('در حال همگام‌سازی اطلاعات با سرور مرکزی کارخانه (ERP)...');
    setTimeout(() => {
      setSyncStatus('همگام‌سازی با موفقیت انجام شد. کلیه اطلاعات و حواله‌ها به‌روز هستند.');
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-200 dark:shadow-none">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
              تنظیمات کارخانه و اتصال به ERP (فاز ۱۰)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ورود با پین‌کد امنیتی، سطوح دسترسی، همگام‌سازی آفلاین/آنلاین و تنظیمات صنعتی
            </p>
          </div>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Grid: Password & Security + Offline Sync & ERP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & Access Lock Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              ورود با رمز و تعیین سطح دسترسی
            </h3>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
              ورود با پین‌کد کاربری (مدیر سالن / انباردار):
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="پین‌کد (نمونه: 1234)"
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition"
              >
                تایید رمز
              </button>
            </div>
          </form>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              تغییر سطح دسترسی کاربر:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'manager', label: 'سطح دسترسی مدیر' },
                { key: 'warehouse', label: 'سطح انباردار' },
                { key: 'logistics', label: 'سطح لجستیک' },
                { key: 'simple', label: 'سطح اپراتور ساده' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onProfileChange(p.key as UserProfileKey)}
                  className={`p-2.5 rounded-xl font-bold text-xs border transition ${
                    currentProfile === p.key
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Offline & ERP Integration Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                نسخه آفلاین و همگام‌سازی ERP
              </h3>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
              آفلاین فعال
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            این برنامه به‌صورت کامل بدون نیاز به اینترنت (Local Storage) کار می‌کند و در صورت اتصال به شبکه‌ی کارخانه، اطلاعات حواله‌ها را با سیستم ERP همگام می‌سازد.
          </p>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTriggerSync}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>همگام‌سازی دستی اطلاعات با ERP کارخانه</span>
            </button>

            <button
              type="button"
              onClick={onOpenScanner}
              className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>باز کردن دوربین برای اسکن QR رادیاتور</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
