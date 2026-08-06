import React, { useState } from 'react';
import { 
  Undo2, Redo2, Lock, Unlock, Save, History, GitCompare, Plus, Trash2, 
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileSpreadsheet, Eye, RefreshCw 
} from 'lucide-react';
import { LayoutScenario, AuditLogEntry, RadiatorCounts, TruckDetails, LayoutRules, EvaluationResult } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface IndustrialControlSuiteProps {
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // Auto-save
  lastSavedTime: string;
  isSaving: boolean;

  // Order Lock
  isOrderLocked: boolean;
  onToggleOrderLock: () => void;

  // Scenarios
  scenarios: LayoutScenario[];
  onSaveCurrentScenario: (name: string) => void;
  onDeleteScenario: (id: string) => void;
  onApplyScenario: (scenario: LayoutScenario) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  operatorName?: string;

  // Current State for scenario creation
  counts: RadiatorCounts;
  truckDetails: TruckDetails;
  rules: LayoutRules;
  result: EvaluationResult | null;
  totalPieces: number;
  totalWeight: number;
}

export const IndustrialControlSuite: React.FC<IndustrialControlSuiteProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastSavedTime,
  isSaving,
  isOrderLocked,
  onToggleOrderLock,
  scenarios,
  onSaveCurrentScenario,
  onDeleteScenario,
  onApplyScenario,
  auditLogs,
  operatorName = 'شهرام',
  counts,
  truckDetails,
  rules,
  result,
  totalPieces,
  totalWeight
}) => {
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = newScenarioName.trim() || `سناریو ${scenarios.length + 1} (${truckDetails.model})`;
    onSaveCurrentScenario(nameToUse);
    setNewScenarioName('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm space-y-4 dir-rtl mb-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        {/* Left Side: Title & Auto-Save Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                پنل پیشرفته کنترل صنعتی کارخانه
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
                isSaving 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Clock className="w-3 h-3" />
                {isSaving ? 'در حال ذخیره خودکار...' : `ذخیره‌شده در ${lastSavedTime}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              قابلیت بازگشت تغییرات (Undo)، قفل سفارش، ثبت لاین عملیات و مقایسه سناریوها
            </p>
          </div>
        </div>

        {/* Right Side: Quick Tool Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo || isOrderLocked}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              canUndo && !isOrderLocked
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 dark:bg-slate-800/40 dark:border-slate-800'
            }`}
            title="بازگشت تغییر قبلی (Undo)"
          >
            <Undo2 className="w-4 h-4" />
            <span>بازگشت (Undo)</span>
          </button>

          {/* Redo Button */}
          <button
            onClick={onRedo}
            disabled={!canRedo || isOrderLocked}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              canRedo && !isOrderLocked
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 dark:bg-slate-800/40 dark:border-slate-800'
            }`}
            title="انجام مجدد تغییر (Redo)"
          >
            <Redo2 className="w-4 h-4" />
            <span>تکرار (Redo)</span>
          </button>

          {/* Order Lock Toggle */}
          <button
            onClick={onToggleOrderLock}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border shadow-sm ${
              isOrderLocked
                ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
            }`}
          >
            {isOrderLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>سفارش قفل شده است</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>قفل‌کردن سفارش جهت بارگیری</span>
              </>
            )}
          </button>

          {/* Audit Trail Log Button */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 text-amber-400 hover:bg-black font-bold text-xs rounded-xl transition border border-slate-800 flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>لاگ عملیات ({toPersianDigits(auditLogs.length)})</span>
          </button>
        </div>
      </div>

      {/* Lock Notice Banner if Locked */}
      {isOrderLocked && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border-r-4 border-rose-600 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              سفارش جاری جهت جلوگیری از تغییرات همزمان در سالن بارگیری قفل گردیده است. برای ویرایش، سفارش را از حالت قفل خارج کنید.
            </span>
          </div>
          <button
            onClick={onToggleOrderLock}
            className="underline text-rose-700 dark:text-rose-300 hover:text-rose-900 font-bold shrink-0"
          >
            بازکردن قفل
          </button>
        </div>
      )}

      {/* Scenarios Management Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100">
              مدیریت و مقایسه چند سناریوی چیدمان (Scenarios)
            </h4>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {toPersianDigits(scenarios.length)} سناریو
            </span>
          </div>

          <div className="flex items-center gap-2">
            {scenarios.length >= 2 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>مقایسه همزمان سناریوها</span>
              </button>
            )}
          </div>
        </div>

        {/* Save Current Scenario Form */}
        <form onSubmit={handleCreateScenario} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            disabled={isOrderLocked}
            placeholder={`نام سناریو جدید (مثلاً: سناریو خاور 6 تن)...`}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isOrderLocked}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>ذخیره وضعیت فعلی به‌عنوان سناریو</span>
          </button>
        </form>

        {/* Saved Scenarios List */}
        {scenarios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xs flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-800 dark:text-slate-100">{sc.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{sc.createdAt}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                    <div>کامیون: <b>{sc.truckDetails.model}</b></div>
                    <div>تعداد رادیاتور: <b>{toPersianDigits(sc.totalPieces)} عدد</b> ({toPersianDigits(sc.weight)} kg)</div>
                    <div>بازده چیدمان: <b className="text-emerald-600">{toPersianDigits(sc.fill)}٪</b> | توازن: <b className="text-blue-600">{toPersianDigits(sc.balance)}٪</b></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onApplyScenario(sc)}
                    disabled={isOrderLocked}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px] rounded-lg transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اعمال این سناریو</span>
                  </button>

                  <button
                    onClick={() => onDeleteScenario(sc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="حذف سناریو"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 text-center py-1">
            هنوز سناریویی ذخیره نشده است. با دکمه بالا می‌توانید گزینه‌های مختلف چیدمان (مثلاً سناریو نیسان vs ایسوزو) را ذخیره و مقایسه کنید.
          </p>
        )}
      </div>

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  مقایسه تطبیقی سناریوهای بارگیری (Side-by-Side Comparison)
                </h3>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                بستن
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
                    <th className="p-3">معیار مقایسه</th>
                    {scenarios.map(sc => (
                      <th key={sc.id} className="p-3 text-center">{sc.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">کامیون پیشنهادی</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center font-bold text-slate-900 dark:text-white">{sc.truckDetails.model}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">تعداد رادیاتور (عدد)</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center font-mono font-bold">{toPersianDigits(sc.totalPieces)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">وزن کل (kg)</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center font-mono font-bold text-amber-600">{toPersianDigits(sc.weight)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">بازده پرشدن حجم کانتینر</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center font-mono font-bold text-emerald-600">{toPersianDigits(sc.fill)}٪</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">شاخص تعادل چپ/راست</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center font-mono font-bold text-blue-600">{toPersianDigits(sc.balance)}٪</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">عملیات</td>
                    {scenarios.map(sc => (
                      <td key={sc.id} className="p-3 text-center">
                        <button
                          onClick={() => {
                            onApplyScenario(sc);
                            setIsCompareModalOpen(false);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition"
                        >
                          انتخاب این سناریو
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تاریخچه و لاگ عملیات سیستم (Audit Trail)
                </h3>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                بستن
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto p-1">
              {auditLogs.length > 0 ? (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{log.details}</p>
                    <span className="text-[10px] text-slate-400 block">اپراتور: <b>{log.operator}</b></span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">هنوز ثبتی در لاگ انجام نشده است.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
