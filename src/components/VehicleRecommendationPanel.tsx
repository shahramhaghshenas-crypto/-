import React, { useState } from 'react';
import { Truck, Sparkles, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Layers, Scale, Percent } from 'lucide-react';
import { VehicleRecommendation } from '../utils/calculation';
import { toPersianDigits } from '../utils/persianDigits';

interface VehicleRecommendationPanelProps {
  recommendation: VehicleRecommendation;
  onSelectPreset: (presetIndex: number) => void;
  selectedPresetIndex?: number;
}

export const VehicleRecommendationPanel: React.FC<VehicleRecommendationPanelProps> = ({
  recommendation,
  onSelectPreset,
  selectedPresetIndex
}) => {
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const { bestResult, bestPresetIndex, activeLayersCount, allEvaluations } = recommendation;

  const bestItem = allEvaluations.find((item) => item.isBest);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/30 rounded-2xl p-4 md:p-5 text-white shadow-xl mb-6 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-blue-800/60 mb-4 gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              پیشنهاد هوشمند بهترین ماشین بارگیری
            </h3>
            <p className="text-xs text-blue-200/80">
              محاسبه بر اساس {toPersianDigits(activeLayersCount)} لایه چیدمان انتخاب‌شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-900/60 border border-blue-700/50 px-3 py-1.5 rounded-xl">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-200">
            تعداد لایه‌ها: {toPersianDigits(activeLayersCount)} لایه
          </span>
        </div>
      </div>

      {/* Best Recommendation Hero Box */}
      {bestItem ? (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  بهترین گزینه سیستم
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {bestItem.preset.L} × {bestItem.preset.W} cm | ظرفیت {toPersianDigits(bestItem.preset.cap.toLocaleString('fa-IR'))} kg
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Truck className="w-7 h-7 text-amber-400" />
                <h4 className="text-lg md:text-xl font-black text-white">
                  {bestItem.preset.name}
                </h4>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Fill percentage metric */}
              <div className="bg-blue-900/80 border border-blue-600/40 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] text-blue-200/80 font-medium mb-0.5">درصد پر شدن فضای ماشین</span>
                <div className="flex items-center justify-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-base font-black text-emerald-300">
                    {toPersianDigits(bestItem.volumeFillPercent)}٪
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, bestItem.volumeFillPercent)}%` }}
                  />
                </div>
              </div>

              {/* Weight percentage metric */}
              <div className="bg-blue-900/80 border border-blue-600/40 p-2.5 rounded-xl text-center">
                <span className="block text-[10px] text-blue-200/80 font-medium mb-0.5">درصد اشغال ظرفیت وزنی</span>
                <div className="flex items-center justify-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-base font-black text-cyan-300">
                    {toPersianDigits(bestItem.weightFillPercent)}٪
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, bestItem.weightFillPercent)}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="col-span-2 sm:col-span-1 flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectPreset(bestItem.presetIndex)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center gap-1.5 shadow-md ${
                    selectedPresetIndex === bestItem.presetIndex
                      ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95'
                  }`}
                >
                  {selectedPresetIndex === bestItem.presetIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      ماشین فعال
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      انتخاب این ماشین
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 mb-4 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>با تعداد لایه و بار فعلی، هیچ‌یک از ماشین‌های استاندارد پاسخگو نیستند. بار را کاهش دهید یا تعداد لایه‌ها را افزایش دهید.</span>
        </div>
      )}

      {/* Toggle comparison view for all candidate vehicles */}
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => setShowAllVehicles(!showAllVehicles)}
          className="w-full py-2 bg-blue-900/40 hover:bg-blue-900/80 border border-blue-700/50 rounded-xl text-xs font-bold text-blue-200 transition flex items-center justify-center gap-1.5"
        >
          {showAllVehicles ? (
            <>
              بستن جدول مقایسه کامل ماشین‌ها
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              مشاهده درصد پر شدن تمام ماشین‌های موجود ({toPersianDigits(allEvaluations.length)} ماشین)
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {showAllVehicles && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1 custom-scrollbar">
            {allEvaluations.map((item) => {
              const isSelected = selectedPresetIndex === item.presetIndex;
              return (
                <div
                  key={item.preset.name}
                  className={`p-3 rounded-xl border text-xs transition flex flex-col justify-between ${
                    item.isBest
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                      : item.result.ok
                      ? 'bg-blue-950/30 border-blue-800/50 text-blue-100'
                      : 'bg-rose-950/20 border-rose-900/40 opacity-70 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-sm">{item.preset.name}</span>
                      {item.isBest ? (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                          بهترین گزینه
                        </span>
                      ) : item.result.ok ? (
                        <span className="bg-blue-600/60 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          مناسب
                        </span>
                      ) : (
                        <span className="bg-rose-900/60 text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          غیرمجاز
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-blue-200/80 mb-2 space-y-0.5">
                      <div>ابعاد: {toPersianDigits(item.preset.L)}×{toPersianDigits(item.preset.W)} cm | تناژ: {item.preset.nominalTonnage || `${toPersianDigits(item.preset.cap / 1000)} تن`}</div>
                      {item.preset.radiatorMeterRange && (
                        <div className="text-[10px] text-amber-300 font-semibold">متراژ رادیاتور: {item.preset.radiatorMeterRange}</div>
                      )}
                    </div>

                    {item.result.ok ? (
                      <div className="space-y-1.5 my-2 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span>درصد پر شدن فضای چیدمان:</span>
                          <span className="font-bold text-emerald-400">{toPersianDigits(item.volumeFillPercent)}٪</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${item.volumeFillPercent}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span>اشغال وزن:</span>
                          <span className="font-bold text-cyan-400">{toPersianDigits(item.weightFillPercent)}٪</span>
                        </div>
                      </div>
                    ) : (
                      <div className="my-2 p-1.5 bg-rose-950/40 rounded text-[10px] text-rose-300 leading-tight">
                        {item.result.reason}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPreset(item.presetIndex)}
                    disabled={!item.result.ok}
                    className={`w-full py-1.5 rounded-lg font-bold text-[11px] mt-2 transition ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : item.result.ok
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isSelected ? 'ماشین انتخاب‌شده' : 'انتخاب این ماشین'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
