import React from 'react';
import { Sliders, ShieldCheck, CheckSquare, Eye, Box, Layers } from 'lucide-react';
import { LayoutRules, FeatureAccess } from '../types';
import { clamp, toPersianDigits } from '../utils/persianDigits';

interface LayoutRulesCardProps {
  rules: LayoutRules;
  onChange: (rules: LayoutRules) => void;
  onRunCalc: () => void;
  access: FeatureAccess;
}

export const LayoutRulesCard: React.FC<LayoutRulesCardProps> = ({
  rules,
  onChange,
  onRunCalc,
  access
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const handleMaxHChange = (val: number) => {
    const safeH = clamp(val, 11, 180);
    onChange({ ...rules, maxH: safeH });
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          تنظیمات چیدمان و استانداردهای کنترل بار
        </h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">
          محدوده ارتفاع: ۱۱ تا ۱۸۰ cm
        </span>
      </div>

      {/* Grid of numeric rule inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-5">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">ارتفاع مجاز چیدمان (cm)</label>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{toPersianDigits(rules.maxH)} cm</span>
          </div>
          <input
            type="number"
            min="11"
            max="180"
            onFocus={(e) => e.target.select()}
            value={rules.maxH}
            onChange={(e) => handleMaxHChange(parseInt(e.target.value) || 150)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="range"
            min="11"
            max="180"
            value={rules.maxH}
            onChange={(e) => handleMaxHChange(parseInt(e.target.value) || 150)}
            className="w-full mt-2 accent-blue-600 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">عرض هر ردیف (cm)</label>
          <input
            type="number"
            min="1"
            onFocus={(e) => e.target.select()}
            value={rules.rowW}
            onChange={(e) => onChange({ ...rules, rowW: Math.max(1, parseInt(e.target.value) || 60) })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ارتفاع هر لایه (cm)</label>
          <input
            type="number"
            min="1"
            onFocus={(e) => e.target.select()}
            value={rules.layerH}
            onChange={(e) => onChange({ ...rules, layerH: Math.max(1, parseInt(e.target.value) || 11) })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">هشدار اضافه‌بار (kg)</label>
          <input
            type="number"
            onFocus={(e) => e.target.select()}
            value={rules.overloadMargin}
            onChange={(e) => onChange({ ...rules, overloadMargin: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">حد وزن هر محور (kg)</label>
          <input
            type="number"
            onFocus={(e) => e.target.select()}
            value={rules.axleLimit}
            onChange={(e) => onChange({ ...rules, axleLimit: parseInt(e.target.value) || 4500 })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checkboxes & View options */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rules.confirmLoading}
            onChange={(e) => onChange({ ...rules, confirmLoading: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            تأیید بارگیری
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rules.autoVehicle}
            onChange={(e) => onChange({ ...rules, autoVehicle: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-bold text-slate-800">انتخاب خودکار بهینه‌ترین خودرو</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rules.show2D}
            onChange={(e) => onChange({ ...rules, show2D: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            نمایش دوبعدی چیدمان
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rules.show3D}
            onChange={(e) => onChange({ ...rules, show3D: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-purple-500" />
            نمایش سه‌بعدی / ایزومتریک
          </span>
        </label>
      </div>

      {/* Execute Button */}
      {!isReadOnly && (
        <button
          onClick={onRunCalc}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm md:text-base rounded-xl transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Layers className="w-5 h-5" />
          محاسبه بهترین ماشین و الگوی چیدمان
        </button>
      )}
    </div>
  );
};
