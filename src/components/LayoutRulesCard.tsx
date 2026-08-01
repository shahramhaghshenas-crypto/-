import React, { useState } from 'react';
import { Sliders, ShieldCheck, CheckSquare, CheckCircle2, Eye, Box, Layers } from 'lucide-react';
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

  const currentLayers = rules.manualLayers && rules.manualLayers > 0
    ? rules.manualLayers
    : Math.max(1, Math.floor(rules.maxH / rules.layerH));

  const [confirmedLayers, setConfirmedLayers] = useState<number>(currentLayers);
  const [justConfirmed, setJustConfirmed] = useState<boolean>(false);

  const handleMaxHChange = (val: number) => {
    const safeH = clamp(val, 11, 350);
    const newLayers = Math.max(1, Math.floor(safeH / rules.layerH));
    onChange({ ...rules, maxH: safeH, manualLayers: newLayers });
  };

  const handleLayerCountChange = (layerCount: number) => {
    const safeLayers = Math.max(1, Math.min(25, layerCount));
    const calculatedH = clamp(safeLayers * rules.layerH, 11, 350);
    onChange({
      ...rules,
      manualLayers: safeLayers,
      maxH: calculatedH
    });
  };

  const handleConfirmLayers = () => {
    setConfirmedLayers(currentLayers);
    setJustConfirmed(true);
    onRunCalc();
    setTimeout(() => setJustConfirmed(false), 3000);
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          تنظیمات لایه‌ها و استانداردهای چیدمان
        </h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">
          ارتفاع هر لایه: {toPersianDigits(rules.layerH)} cm
        </span>
      </div>

      {/* DEDICATED MANUAL LAYER SELECTION SECTION */}
      <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 md:p-5 mb-5 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                تعیین دستی تعداد لایه‌های چیدمان
              </h3>
              <p className="text-xs text-slate-500">
                تعداد لایه‌های عمودی بارگیری را مشخص کنید تا بهترین خودرو پیشنهاد داده شود
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm shrink-0">
            <span className="text-xs text-slate-500 font-medium">ارتفاع کل بار:</span>
            <span className="text-sm font-black text-blue-700">
              {toPersianDigits(currentLayers * rules.layerH)} cm
            </span>
          </div>
        </div>

        {/* Quick Layer Buttons + Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-slate-300 bg-white rounded-xl p-1 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => handleLayerCountChange(currentLayers - 1)}
              disabled={currentLayers <= 1}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base disabled:opacity-40 transition flex items-center justify-center"
            >
              -
            </button>
            <div className="px-3 flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="25"
                value={currentLayers}
                onChange={(e) => handleLayerCountChange(parseInt(e.target.value) || 1)}
                className="w-12 text-center text-sm font-black text-slate-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-600">لایه</span>
            </div>
            <button
              type="button"
              onClick={() => handleLayerCountChange(currentLayers + 1)}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-base transition flex items-center justify-center shadow-sm"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 18, 20].map((lCount) => {
              const active = currentLayers === lCount;
              return (
                <button
                  key={lCount}
                  type="button"
                  onClick={() => handleLayerCountChange(lCount)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 border border-blue-600'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {toPersianDigits(lCount)} لایه
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Confirm Layer Count Action Button */}
        <div className="mt-4 pt-3 border-t border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {confirmedLayers === currentLayers ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                تعداد {toPersianDigits(currentLayers)} لایه تأیید شد | آماده نمایش سه‌بعدی و انتخاب بهینه‌ترین ماشین
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300">
                <Layers className="w-4 h-4 text-amber-600" />
                تعداد لایه‌ها تغییر یافته است ({toPersianDigits(currentLayers)} لایه) — جهت ثبت دکمه زیر را فشار دهید
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmLayers}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition flex items-center justify-center gap-2 shadow-md shrink-0 ${
              justConfirmed || confirmedLayers === currentLayers
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 animate-pulse'
            }`}
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            تأیید تعداد لایه‌ها و اعمال چیدمان سه‌بعدی
          </button>
        </div>
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
            max="350"
            onFocus={(e) => e.target.select()}
            value={rules.maxH}
            onChange={(e) => handleMaxHChange(parseInt(e.target.value) || 150)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="range"
            min="11"
            max="350"
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
