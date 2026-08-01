import React from 'react';
import { Sparkles, Truck, CheckCircle2, AlertTriangle, Layers, Percent, ArrowLeft, Award, Scale } from 'lucide-react';
import { RadiatorCounts, CustomWeights, LayoutRules, PalletConfig, VehiclePreset, EvaluationResult, FeatureAccess } from '../types';
import { VEHICLE_PRESETS } from '../data/presets';
import { buildRadiatorData, evaluateTruck, getVehicleRecommendations } from '../utils/calculation';
import { toPersianDigits } from '../utils/persianDigits';

interface VehicleRecommendationCardProps {
  counts: RadiatorCounts;
  customWeights: CustomWeights;
  rules: LayoutRules;
  palletConfig: PalletConfig;
  selectedTruckIndex: number;
  onSelectVehiclePreset: (index: number, preset: VehiclePreset) => void;
  access?: FeatureAccess;
}

export const VehicleRecommendationCard: React.FC<VehicleRecommendationCardProps> = ({
  counts,
  customWeights,
  rules,
  palletConfig,
  selectedTruckIndex,
  onSelectVehiclePreset,
  access = 'active'
}) => {
  if (access === 'disabled') return null;

  // Build cargo data
  const data = buildRadiatorData(counts, undefined, customWeights);
  if (data.totalPieces === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        لطفاً ابتدا تعداد رادیاتورها را وارد کنید تا بهترین خودرو بر اساس تعداد لایه‌ها پیشنهاد داده شود.
      </div>
    );
  }

  // Get recommendations based on PDF table ranges and layer requirements
  const rec = getVehicleRecommendations(
    data,
    rules.maxH,
    rules.rowW,
    rules.layerH,
    rules.axleLimit,
    rules.overloadMargin,
    palletConfig,
    rules.manualLayers
  );

  const bestOption = rec.bestResult ? {
    preset: rec.bestResult.truck,
    index: rec.bestPresetIndex,
    result: rec.bestResult
  } : null;

  const targetLayers = rec.activeLayersCount;
  const effectiveMaxH = targetLayers * rules.layerH;
  const evaluations = rec.allEvaluations;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-blue-900/40 mb-6 relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-5 gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-white">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            پیشنهاد هوشمند ماشین بر اساس تعداد لایه‌ها ({toPersianDigits(targetLayers)} لایه)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ارزیابی درصد پر شدن، گنجایش حجمی و توازن وزن برای {toPersianDigits(data.totalPieces)} عدد رادیاتور ({toPersianDigits(Math.round(palletConfig.usePallets && rec.bestResult?.palletTotalWeight ? rec.bestResult.palletTotalWeight : data.totalWeight))} کیلوگرم{palletConfig.usePallets ? ' با پالت' : ''})
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-300">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>ارتفاع موثر: <strong className="text-white font-bold">{toPersianDigits(effectiveMaxH)} cm</strong></span>
        </div>
      </div>

      {/* BEST RECOMMENDED VEHICLE BANNER */}
      {bestOption ? (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-800/90 to-blue-950/80 border border-emerald-500/30 rounded-2xl p-4 md:p-5 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0">
              {/* Circular Fill Badge */}
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-emerald-300 tracking-tighter">
                  {toPersianDigits(Math.round(bestOption.result.fill))}٪
                </span>
                <span className="text-[10px] text-emerald-200 font-medium">پر شدن</span>
              </div>
              <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1 shadow-md">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                  بیشترین میزان پرشدگی ظرفیت
                </span>
                <span className="text-xs text-slate-300">
                  (خودرویی که بیشترین میزان ظرفیت آن پر می‌شود: {toPersianDigits(Math.round(bestOption.result.fill))}٪)
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                {bestOption.preset.name} (ظرفیت {toPersianDigits(bestOption.preset.cap)} کیلوگرم)
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                استفاده از <strong className="text-emerald-300">{toPersianDigits(bestOption.result.usedLayers)}</strong> لایه | رزرو وزنی مجاز: <strong className="text-emerald-300">{toPersianDigits(bestOption.result.reserve)} کیلوگرم</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectVehiclePreset(bestOption.index, bestOption.preset)}
            className={`px-5 py-3 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition shadow-lg shrink-0 ${
              selectedTruckIndex === bestOption.index
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-900/50'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50'
            }`}
          >
            {selectedTruckIndex === bestOption.index ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                خودرو انتخاب شده است
              </>
            ) : (
              <>
                انتخاب فوری این خودرو
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 mb-6 flex items-center gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            با تعداد لایه‌های انتخابی ({toPersianDigits(targetLayers)} لایه) و حجم فعلی بار، هیچ خودرویی از فهرست استاندارد کامل پاسخگو نیست. لطفاً تعداد لایه‌ها را افزایش داده یا تعداد رادیاتورها را تعدیل فرمایید.
          </span>
        </div>
      )}

      {/* ALL VEHICLES FILL COMPARISON MATRIX */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-blue-400" />
            جدول مقایسه‌ای درصد پر شدن همه خودروها:
          </span>
          <span className="text-[11px] text-slate-400 normal-case font-normal">
            بر اساس {toPersianDigits(targetLayers)} لایه چیدمان
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {evaluations.map((item) => {
            const preset = item.preset;
            const index = item.presetIndex;
            const result = item.result;
            const isSelected = selectedTruckIndex === index;
            const isBest = item.isBest;
            const fillPct = Math.round(result.fill);
            
            let statusBg = 'bg-slate-800/60 border-slate-700/60';
            let badgeText = 'مناسب';
            let badgeStyle = 'bg-blue-900/60 text-blue-300 border-blue-700/60';
            let progressColor = 'bg-blue-500';

            if (!result.ok) {
              if (result.reason?.includes('وزن')) {
                badgeText = 'اضافه‌بار وزنی';
                badgeStyle = 'bg-rose-900/60 text-rose-300 border-rose-700/60';
                progressColor = 'bg-rose-500';
              } else {
                badgeText = 'عدم گنجایش';
                badgeStyle = 'bg-amber-900/60 text-amber-300 border-amber-700/60';
                progressColor = 'bg-amber-500';
              }
            } else if (isBest) {
              badgeText = 'بهترین پیشنهاد ⭐';
              badgeStyle = 'bg-emerald-500 text-slate-950 font-black border-emerald-400';
              progressColor = 'bg-emerald-400';
            } else if (fillPct >= 80) {
              progressColor = 'bg-emerald-500';
            } else if (fillPct >= 50) {
              progressColor = 'bg-blue-500';
            } else {
              progressColor = 'bg-slate-500';
            }

            if (isSelected) {
              statusBg = 'bg-blue-900/40 border-blue-500 shadow-md ring-1 ring-blue-500/50';
            }

            return (
              <div
                key={preset.name}
                onClick={() => onSelectVehiclePreset(index, preset)}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${statusBg} hover:border-blue-400/80 hover:bg-slate-800/80`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Truck className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                      {preset.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>

                  {preset.radiatorMeterRange && (
                    <div className="text-[11px] text-amber-300 font-medium mb-1.5">
                      محدوده بار استاندارد: {preset.radiatorMeterRange} (تناژ: {preset.nominalTonnage || `${preset.cap / 1000} تن`})
                    </div>
                  )}

                  {/* Fill percentage progress bar */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">درصد تکمیل ظرفیت:</span>
                      <span className="font-bold text-white text-xs">
                        {result.ok ? `${toPersianDigits(fillPct)}٪` : '---'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden p-0.5 border border-slate-600/40">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${result.ok ? Math.min(100, fillPct) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Details stats */}
                  <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-700/40">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ظرفیت وزن:</span>
                      <span>{toPersianDigits(preset.cap)} kg</span>
                    </div>
                    {result.ok ? (
                      <div className="flex justify-between">
                        <span className="text-slate-400">لایه‌های مصرفی:</span>
                        <span className="text-emerald-300 font-semibold">
                          {toPersianDigits(result.usedLayers)} از {toPersianDigits(result.maxLayers)} لایه
                        </span>
                      </div>
                    ) : (
                      <div className="text-rose-300 text-[10px] truncate mt-0.5" title={result.reason}>
                        {result.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 flex justify-end">
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${isSelected ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                    {isSelected ? '✓ انتخاب شده' : 'انتخاب این خودرو'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
