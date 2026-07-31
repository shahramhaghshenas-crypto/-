import React, { useState } from 'react';
import { EvaluationResult } from '../types';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';
import { pieceWeight } from '../utils/calculation';
import { Scale, Info } from 'lucide-react';

interface Layout2DViewProps {
  result: EvaluationResult;
}

const SIZE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  60: { bg: 'bg-amber-100 dark:bg-amber-950/80', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' }, // زرد
  80: { bg: 'bg-red-100 dark:bg-red-950/80', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' }, // قرمز
  100: { bg: 'bg-blue-100 dark:bg-blue-950/80', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' }, // آبی
  120: { bg: 'bg-emerald-100 dark:bg-emerald-950/80', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700' }, // سبز
  140: { bg: 'bg-purple-100 dark:bg-purple-950/80', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' }, // بنفش
  160: { bg: 'bg-orange-100 dark:bg-orange-950/80', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' }, // نارنجی
  180: { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-400 dark:border-slate-600' }, // طوسی
};

export const Layout2DView: React.FC<Layout2DViewProps> = React.memo(({ result }) => {
  const { packed, truck, maxLayers, lanesCount, frontAxleWeight, rearAxleWeight, axleBalanceScore } = result;
  const [selectedPiece, setSelectedPiece] = useState<{ len: number; weight: number; layer: number; row: number } | null>(null);

  const totalW = (frontAxleWeight || 0) + (rearAxleWeight || 0);
  const frontPct = totalW > 0 ? Math.round(((frontAxleWeight || 0) / totalW) * 100) : 50;
  const rearPct = totalW > 0 ? 100 - frontPct : 50;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 my-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
        <div>
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-blue-400">
            <span>🗺️</span>
            نقشه دوبعدی هندسی چیدمان رادیاتورها (نمای بالا / مقطع لایه‌ها)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            طول مفید ماشین: {toPersianDigits(truck.L)}cm | عرض: {toPersianDigits(truck.W)}cm | تعداد ردیف: {toPersianDigits(lanesCount)} | حداکثر لایه‌ها: {toPersianDigits(maxLayers)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          <span className="text-slate-300">راهنمای رنگ بر اساس طول</span>
        </div>
      </div>

      {/* Center of Gravity & Axle Weight Balance Gauge */}
      <div className="mb-5 p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Scale className="w-4 h-4 text-amber-400" />
            سنجش تعادل طولی بار و مرکز ثقل (جلو / عقب)
          </span>
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] border border-amber-500/30">
            امتیاز توازن: {toPersianDigits(axleBalanceScore || 95)}٪ (عالی)
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>سمت اتاق / محور جلو: {toPersianDigits(frontAxleWeight || 0)} kg ({toPersianDigits(frontPct)}٪)</span>
            <span>سمت درب / محور عقب: {toPersianDigits(rearAxleWeight || 0)} kg ({toPersianDigits(rearPct)}٪)</span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 flex border border-slate-700 relative">
            <div
              className="h-full bg-blue-500 rounded-r-full transition-all duration-300"
              style={{ width: `${frontPct}%` }}
            />
            <div
              className="h-full bg-indigo-500 rounded-l-full transition-all duration-300"
              style={{ width: `${rearPct}%` }}
            />
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-amber-400 z-10" title="مرکز تقارن ایده آل" />
          </div>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
        {[60, 80, 100, 120, 140, 160, 180].map((size) => (
          <div key={size} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs">
            <span className={`w-3 h-3 rounded border ${SIZE_COLORS[size]?.bg} ${SIZE_COLORS[size]?.border}`}></span>
            <span className="font-bold">{toPersianDigits(size)}cm</span>
            <span className="text-slate-400 text-[10px]">({fmtPersian(pieceWeight(size), 1)}kg)</span>
          </div>
        ))}
      </div>

      {/* Selected Piece Details Toast */}
      {selectedPiece && (
        <div className="mb-4 p-3 bg-indigo-950/80 border border-indigo-500/50 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>
              رادیاتور انتخابی: <strong>{toPersianDigits(selectedPiece.len)} سانتی‌متر</strong> | وزن:{' '}
              <strong>{fmtPersian(selectedPiece.weight, 1)} کیلوگرم</strong> | لایه {toPersianDigits(selectedPiece.layer)} | ردیف {toPersianDigits(selectedPiece.row)}
            </span>
          </div>
          <button
            onClick={() => setSelectedPiece(null)}
            className="text-slate-400 hover:text-white text-xs underline"
          >
            بستن
          </button>
        </div>
      )}

      {/* Layers Container */}
      <div className="space-y-6">
        {packed.map((layer, li) => {
          const hasItems = layer.lanes.some((r) => r.list.length > 0);
          if (!hasItems) return null;

          return (
            <div key={li} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
                <span className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs border border-amber-500/30">
                    لایه {toPersianDigits(li + 1)}
                  </span>
                  (ارتفاع تجمعی: {toPersianDigits((li + 1) * 11)} سانتی‌متر)
                </span>
                <span className="text-xs text-slate-400">
                  مجموع متراژ لایه: {fmtPersian(layer.usedLength / 100, 1)} متر
                </span>
              </div>

              {/* Lanes/Rows inside this layer */}
              <div className="space-y-3">
                {layer.lanes.map((lane, ri) => (
                  <div key={ri} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">
                        ردیف {toPersianDigits(ri + 1)} (عرض: ~۶۰cm)
                      </span>
                      <span>
                        فضای باقیمانده طول: <strong className="text-amber-400">{toPersianDigits(lane.rem)} cm</strong>
                      </span>
                    </div>

                    {/* Visual lane bed representation */}
                    <div className="w-full h-10 bg-slate-900 rounded-md border border-slate-700 p-1 flex items-center gap-1 overflow-x-auto relative">
                      {lane.list.length > 0 ? (
                        lane.list.map((itemLen, idx) => {
                          const widthPct = (itemLen / truck.L) * 100;
                          const color = SIZE_COLORS[itemLen] || SIZE_COLORS[100];
                          const w = pieceWeight(itemLen);
                          return (
                            <div
                              key={idx}
                              style={{ width: `${widthPct}%` }}
                              onClick={() => setSelectedPiece({ len: itemLen, weight: w, layer: li + 1, row: ri + 1 })}
                              title={`برای جزئیات کلیک کنید: رادیاتور ${itemLen}cm (${fmtPersian(w, 1)}kg)`}
                              className={`h-full ${color.bg} ${color.text} border ${color.border} rounded font-bold text-[11px] flex items-center justify-center shrink-0 transition hover:brightness-125 hover:scale-105 shadow-xs cursor-pointer`}
                            >
                              <span>{toPersianDigits(itemLen)}cm</span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-600 px-2 italic">ردیف خالی</span>
                      )}

                      {/* Remaining free space block */}
                      {lane.rem > 0 && (
                        <div
                          style={{ width: `${(lane.rem / truck.L) * 100}%` }}
                          className="h-full bg-slate-800/50 border border-dashed border-slate-700 rounded flex items-center justify-center text-[10px] text-slate-500 shrink-0"
                        >
                          خالی ({toPersianDigits(lane.rem)}cm)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

Layout2DView.displayName = 'Layout2DView';

