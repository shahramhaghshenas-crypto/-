import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, Trash2, Zap, Weight, Ruler, Settings2, Plus, X, CheckCircle2, ArrowLeft, Layers } from 'lucide-react';
import { RadiatorCounts, CustomWeights, FeatureAccess } from '../types';
import { RADIATOR_SIZES } from '../data/presets';
import { pieceWeight, buildRadiatorData } from '../utils/calculation';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

interface QuantitiesCardProps {
  counts: RadiatorCounts;
  onChange: (counts: RadiatorCounts) => void;
  customWeights?: CustomWeights;
  onCustomWeightsChange?: (weights: CustomWeights) => void;
  access?: FeatureAccess;
  onConfirm?: () => void;
  manualLayers?: number;
  onManualLayersChange?: (layers: number) => void;
}

export const QuantitiesCard: React.FC<QuantitiesCardProps> = ({
  counts,
  onChange,
  customWeights = {},
  onCustomWeightsChange,
  access = 'active',
  onConfirm,
  manualLayers = 10,
  onManualLayersChange
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newSize, setNewSize] = useState<string>('');
  const [newWeight, setNewWeight] = useState<string>('');

  // Local string inputs for instant 60 FPS input responsiveness
  const [localInputs, setLocalInputs] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    Object.entries(counts).forEach(([sz, val]) => {
      const numVal = Number(val);
      if (!isNaN(numVal) && numVal > 0) {
        init[Number(sz)] = String(numVal);
      }
    });
    return init;
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize local inputs whenever counts prop changes from outside (e.g. presets, sample, reset)
  useEffect(() => {
    setLocalInputs((prev) => {
      const next: Record<number, string> = { ...prev };
      const allSizes = Array.from(
        new Set([
          ...RADIATOR_SIZES,
          ...Object.keys(counts).map(Number).filter((n) => !isNaN(n)),
          ...Object.keys(customWeights).map(Number).filter((n) => !isNaN(n))
        ])
      );
      allSizes.forEach((s) => {
        const val = counts[s];
        next[s] = val && val > 0 ? String(val) : '';
      });
      return next;
    });
  }, [counts, customWeights]);

  // List of all active sizes
  const activeSizes = useMemo(() => {
    return Array.from(
      new Set([
        ...RADIATOR_SIZES,
        ...Object.keys(counts).map(Number).filter((n) => !isNaN(n)),
        ...Object.keys(customWeights).map(Number).filter((n) => !isNaN(n)),
        ...Object.keys(localInputs).map(Number).filter((n) => !isNaN(n))
      ])
    ).sort((a, b) => a - b);
  }, [counts, customWeights, localInputs]);

  // Compute local counts from local string inputs for zero-latency local stats banner
  const effectiveCounts = useMemo(() => {
    const res: RadiatorCounts = {};
    activeSizes.forEach((s) => {
      const raw = localInputs[s];
      if (raw !== undefined && raw !== '') {
        const parsed = parseInt(raw, 10);
        res[s] = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      } else {
        res[s] = 0;
      }
    });
    return res;
  }, [localInputs, activeSizes]);

  const data = useMemo(() => {
    return buildRadiatorData(effectiveCounts, undefined, customWeights);
  }, [effectiveCounts, customWeights]);

  // Propagate to parent state with a slight debounce (120ms) so typing isn't blocked by full 3D layout packing
  const triggerParentChange = (updatedInputs: Record<number, string>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const newCounts: RadiatorCounts = {};
      activeSizes.forEach((s) => {
        const raw = updatedInputs[s];
        if (raw !== undefined && raw !== '') {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed > 0) {
            newCounts[s] = parsed;
          }
        }
      });
      onChange(newCounts);
    }, 120);
  };

  const flushParentChange = (updatedInputs: Record<number, string>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const newCounts: RadiatorCounts = {};
    activeSizes.forEach((s) => {
      const raw = updatedInputs[s];
      if (raw !== undefined && raw !== '') {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) {
          newCounts[s] = parsed;
        }
      }
    });
    onChange(newCounts);
  };

  const handleInputChange = (size: number, valStr: string) => {
    const nextInputs = { ...localInputs, [size]: valStr };
    setLocalInputs(nextInputs);
    triggerParentChange(nextInputs);
  };

  const handleInputBlur = () => {
    flushParentChange(localInputs);
  };

  const handleWeightChange = (size: number, valStr: string) => {
    if (!onCustomWeightsChange) return;
    const val = valStr === '' ? 0 : Math.max(0, parseFloat(valStr) || 0);
    onCustomWeightsChange({
      ...customWeights,
      [size]: val
    });
  };

  const handleClearAll = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const emptyCounts: RadiatorCounts = {};
    const emptyInputs: Record<number, string> = {};
    activeSizes.forEach((s) => {
      emptyCounts[s] = 0;
      emptyInputs[s] = '';
    });
    setLocalInputs(emptyInputs);
    onChange(emptyCounts);
  };

  const handleLoadSample = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const sampleCounts: RadiatorCounts = { 60: 15, 80: 20, 100: 25, 120: 30, 140: 10, 160: 8, 180: 5 };
    const sampleInputs: Record<number, string> = {};
    Object.entries(sampleCounts).forEach(([s, v]) => {
      sampleInputs[Number(s)] = String(v);
    });
    setLocalInputs(sampleInputs);
    onChange(sampleCounts);
  };

  const handleAddCustomSize = () => {
    const s = parseInt(newSize);
    if (!s || s <= 0) return;
    const w = parseFloat(newWeight);
    const updatedInputs = { ...localInputs, [s]: localInputs[s] || '' };
    setLocalInputs(updatedInputs);
    triggerParentChange(updatedInputs);

    if (w > 0 && onCustomWeightsChange) {
      onCustomWeightsChange({
        ...customWeights,
        [s]: w
      });
    }
    setNewSize('');
    setNewWeight('');
  };

  const handleRemoveCustomSize = (size: number) => {
    const nextInputs = { ...localInputs };
    delete nextInputs[size];
    setLocalInputs(nextInputs);
    flushParentChange(nextInputs);

    if (onCustomWeightsChange) {
      const newW = { ...customWeights };
      delete newW[size];
      onCustomWeightsChange(newW);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
            تعداد رادیاتورها و مشخصات بارگیری
          </h2>
        </div>

        {/* Quick action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-3 py-1.5 font-bold rounded-lg text-xs flex items-center gap-1 transition border ${
                showAdvanced
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showAdvanced ? 'بستن تنظیمات وزن' : 'تغییر وزن و اندازه سفارشی'}
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold rounded-lg text-xs flex items-center gap-1 transition border border-blue-200 dark:border-blue-800"
            >
              <Zap className="w-3.5 h-3.5" />
              بارگذاری نمونه
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold rounded-lg text-xs flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              صفر کردن همه
            </button>
          </div>
        )}
      </div>

      {/* Layer Count Selector Bar (Top Prominent Placement) */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 mb-5 border border-indigo-700/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/40 text-amber-300 flex items-center justify-center font-bold border border-indigo-500/50 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-2">
              <span>تعداد لایه‌های چیدمان (ارتفاع چینش رادیاتور روی هم)</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                {toPersianDigits(manualLayers)} لایه
              </span>
            </h3>
            <p className="text-[11px] text-indigo-200/80 mt-0.5">
              تعداد لایه‌های عمودی رادیاتورهایی که روی هم چیده می‌شوند (پیش‌فرض ۱۰ لایه). خودروی مناسب بر اساس این ارتفاع پیشنهاد داده می‌شود.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onManualLayersChange && onManualLayersChange(Math.max(1, (manualLayers || 10) - 1))}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xl flex items-center justify-center border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            -
          </button>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-indigo-500/60 rounded-xl px-4 py-2 font-black text-base text-amber-300 min-w-[110px] justify-center shadow-inner">
            <input
              type="number"
              min="1"
              max="30"
              disabled={isReadOnly}
              value={manualLayers || 10}
              onChange={(e) => onManualLayersChange && onManualLayersChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center bg-transparent focus:outline-none font-black text-amber-300"
            />
            <span className="text-xs text-indigo-300 font-normal">لایه</span>
          </div>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onManualLayersChange && onManualLayersChange(Math.min(30, (manualLayers || 10) + 1))}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl flex items-center justify-center transition active:scale-95 disabled:opacity-50 shadow-md"
          >
            +
          </button>
        </div>
      </div>

      {/* Advanced Custom Weights & Custom Size Manager */}
      {showAdvanced && !isReadOnly && (
        <div className="mb-5 p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Weight className="w-4 h-4 text-indigo-600" />
              ویرایش وزن دقیق هر تکه رادیاتور (کیلوگرم)
            </h3>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
              مقداری که وارد کنید جایگزین وزن پیش‌فرض می‌شود
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {activeSizes.map((size) => {
              const currentW = pieceWeight(size, customWeights);
              return (
                <div key={`w_${size}`} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {toPersianDigits(size)} سانتی:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      onFocus={(e) => e.target.select()}
                      value={customWeights[size] !== undefined ? customWeights[size] : currentW}
                      onChange={(e) => handleWeightChange(size, e.target.value)}
                      className="w-full text-center text-xs font-bold font-mono py-1 px-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400">kg</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add custom size form */}
          <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">افزودن سایز طول جدید (مثلاً ۵۰ یا ۲۰۰ سانتی‌متر):</span>
            <input
              type="number"
              placeholder="طول (cm)"
              onFocus={(e) => e.target.select()}
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              className="w-24 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
            />
            <input
              type="number"
              step="0.1"
              placeholder="وزن (kg)"
              onFocus={(e) => e.target.select()}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-24 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن سایز
            </button>
          </div>
        </div>
      )}

      {/* Grid of Inputs for Each Radiator Size */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-5">
        {activeSizes.map((size) => {
          const rawInput = localInputs[size] ?? '';
          const count = effectiveCounts[size] || 0;
          const weightPerPiece = pieceWeight(size, customWeights);
          const totalSizeWeight = count * weightPerPiece;
          const isPreset = (RADIATOR_SIZES as readonly number[]).includes(size);

          return (
            <div
              key={size}
              className={`p-3 rounded-xl border transition relative ${
                count > 0
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              {!isPreset && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomSize(size)}
                  className="absolute top-1 left-1 p-0.5 text-rose-500 hover:bg-rose-100 rounded"
                  title="حذف این سایز سفارشی"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {toPersianDigits(size)} سانتی
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {fmtPersian(weightPerPiece, 1)} kg
                </span>
              </div>
              <input
                type="number"
                min="0"
                onFocus={(e) => e.target.select()}
                value={rawInput}
                placeholder="0"
                onChange={(e) => handleInputChange(size, e.target.value)}
                onBlur={handleInputBlur}
                className="w-full text-center font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium text-center mt-1 min-h-[16px]">
                {count > 0 ? `جمع: ${fmtPersian(totalSizeWeight, 0)} kg` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instant Summary Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 text-white rounded-xl p-3.5 mb-4">
        <div className="text-center border-l border-slate-700">
          <span className="text-slate-400 text-xs block">تعداد کل</span>
          <span className="text-lg md:text-xl font-black text-emerald-400">
            {fmtPersian(data.totalPieces)} <span className="text-xs font-normal">عدد</span>
          </span>
        </div>
        <div className="text-center md:border-l border-slate-700">
          <span className="text-slate-400 text-xs block flex items-center justify-center gap-1">
            <Weight className="w-3.5 h-3.5 text-amber-400 inline" />
            وزن کل (توناژ)
          </span>
          <span className="text-lg md:text-xl font-black text-amber-300">
            {fmtPersian(data.totalWeight, 0)} <span className="text-xs font-normal">کیلوگرم</span>
          </span>
        </div>
        <div className="text-center border-l border-slate-700">
          <span className="text-slate-400 text-xs block flex items-center justify-center gap-1">
            <Ruler className="w-3.5 h-3.5 text-blue-400 inline" />
            متراژ کل بار
          </span>
          <span className="text-lg md:text-xl font-black text-blue-300">
            {fmtPersian(data.totalMeter, 1)} <span className="text-xs font-normal">متر</span>
          </span>
        </div>
        <div className="text-center">
          <span className="text-slate-400 text-xs block flex items-center justify-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400 inline" />
            تعداد لایه‌ها
          </span>
          <span className="text-lg md:text-xl font-black text-indigo-300">
            {toPersianDigits(manualLayers)} <span className="text-xs font-normal">لایه</span>
          </span>
        </div>
      </div>

      {/* Confirmation Action Button */}
      {onConfirm && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={data.totalPieces === 0}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs md:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>تأیید مقادیر رادیاتورها و محاسبه ماشین مناسب</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>تأیید نهایی تعداد رادیاتورها</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              لطفاً ریز مقادیر، متراژ و توناژ بار مشخص‌شده زیر را بررسی و تأیید نمایید:
            </p>

            {/* List of non-zero radiators */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {Object.entries(counts)
                .filter(([_, qty]) => Number(qty) > 0)
                .map(([size, qty]) => {
                  const sizeNum = Number(size);
                  const wPerPiece = pieceWeight(sizeNum, customWeights);
                  const totalKg = Number(qty) * wPerPiece;
                  const totalM = (sizeNum / 100) * Number(qty);
                  return (
                    <div
                      key={size}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-semibold"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        رادیاتور {toPersianDigits(sizeNum)} سانتی‌متری
                      </span>
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span className="text-blue-600 dark:text-blue-400 font-black">
                          {toPersianDigits(Number(qty))} عدد
                        </span>
                        <span>•</span>
                        <span>{fmtPersian(totalM, 1)} متر</span>
                        <span>•</span>
                        <span>{fmtPersian(totalKg, 0)} kg</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Summary Box */}
            <div className="grid grid-cols-4 gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">تعداد کل</span>
                <span className="text-base font-black text-emerald-400">
                  {fmtPersian(data.totalPieces)} عدد
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">متراژ کل</span>
                <span className="text-base font-black text-blue-300">
                  {fmtPersian(data.totalMeter, 1)} متر
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">توناژ (وزن کل)</span>
                <span className="text-base font-black text-amber-300">
                  {fmtPersian(data.totalWeight, 0)} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">تعداد لایه‌ها</span>
                <span className="text-base font-black text-indigo-300">
                  {toPersianDigits(manualLayers)} لایه
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
              >
                ویرایش تعداد
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  if (onConfirm) onConfirm();
                }}
                className="w-full sm:w-2/3 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأیید و انتخاب ماشین مناسب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
