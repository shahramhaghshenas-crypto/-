import React, { useState } from 'react';
import { Truck, CheckCircle, AlertTriangle, Scale, Ruler, Layers, DollarSign, MapPin, User, FileText, CheckSquare, Play, Sparkles, ShieldCheck, Box, RefreshCw, Clock, Cpu, Zap, Activity, Eye, EyeOff } from 'lucide-react';
import { EvaluationResult, RadiatorData, TruckDetails, DestinationInfo, LayoutRules } from '../types';
import { fmtPersian, toPersianDigits } from '../utils/persianDigits';
import { pieceWeight } from '../utils/calculation';
import { Layout2DView } from './Layout2DView';
import { Layout3DView } from './Layout3DView';
import { LiveLoadingModal } from './LiveLoadingModal';
import { calculateAIScenarioScore, estimateLoadingTimeMinutes, findSimilarHistoricalOrder, generateAILoadingSequence } from '../utils/aiLearningEngine';

interface CalculationResultViewProps {
  result: EvaluationResult | null;
  data: RadiatorData;
  truckDetails: TruckDetails;
  destinationInfo: DestinationInfo;
  rules: LayoutRules;
  shippingCost: number;
  profileName: string;
  appModeName: string;
  photoUrl: string | null;
  signatureUrl: string | null;
}

export const CalculationResultView: React.FC<CalculationResultViewProps> = React.memo(({
  result,
  data,
  truckDetails,
  destinationInfo,
  rules,
  shippingCost,
  profileName,
  appModeName,
  photoUrl,
  signatureUrl,
}) => {
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [show2DSection, setShow2DSection] = useState(false);

  if (data.totalPieces === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">آماده محاسبه بارگیری</h3>
        <p className="text-xs text-slate-500 mt-1">
          لطفاً تعداد رادیاتورها را در فرم بالا وارد کرده و دکمه «محاسبه بهترین ماشین و چیدمان» را فشار دهید.
        </p>
      </div>
    );
  }

  if (!result || !result.ok) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm my-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-rose-900">عدم امکان بارگیری با شرایط فعلی</h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {result?.reason || 'بار مورد نظر در ابعاد کانتینر جا نگرفت یا از سقف وزن مجاز عبور کرد.'}
            </p>
          </div>
        </div>

        {/* Failed summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-rose-200/60 text-xs">
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">تعداد کل</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(data.totalPieces)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">وزن کل</span>
            <span className="text-base font-bold text-rose-700">{fmtPersian(data.totalWeight, 0)} kg</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">متراژ کل</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(data.totalMeter, 1)} m</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">سقف لایه مجاز</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(Math.floor(rules.maxH / rules.layerH))}</span>
          </div>
        </div>
      </div>
    );
  }

  const { truck, lanesCount, maxLayers, usedLayers, packed, fill, approxAxle, axleOk } = result;
  const confirmText = rules.confirmLoading ? 'تأیید شده' : 'در انتظار تأیید';

  // Stack Pressure calculations (Step 7)
  const bottomLayerWeight = Math.round(data.totalWeight * (1 / Math.max(1, usedLayers)));
  const topWeightPressing = Math.round(data.totalWeight - bottomLayerWeight);
  const isPressureExceeded = usedLayers > 4 || topWeightPressing > 3500;

  // AI Better Recommendations (Step 8)
  const isOptimal = fill >= 75 && axleOk && !isPressureExceeded;

  // AI Learning Engine calculations
  const aiScore = calculateAIScenarioScore(fill, result.axleBalanceScore || 90, result);
  const timeEst = estimateLoadingTimeMinutes(data.totalPieces, data.totalWeight);
  const historyMatch = findSimilarHistoricalOrder(data.counts, data.totalWeight, []);
  const loadingSequence = generateAILoadingSequence(data.counts);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm my-6 card-print space-y-6">
      {/* Live Loading Assistant Modal */}
      <LiveLoadingModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        result={result}
        data={data}
        truckDetails={truckDetails}
        operatorName={profileName}
      />

      {/* Printable Cargo Bill Header */}
      <div className="hidden print-only text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black">حواله و مجوز بارگیری رادیاتور</h1>
        <p className="text-sm mt-1">سامانه تخصصی مدیریت چیدمان و ناوگان باربری</p>
      </div>

      {/* Main Header Result & Live Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              پیشنهاد هوشمند اصلی: {truck.name}
            </h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
              بازده چیدمان: {fmtPersian(fill, 1)}٪
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Loading AI Engine v4.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پروفایل فعلی: <b>{profileName}</b> | حالت: <b>{appModeName}</b> | وضعیت بارگیری: <b className="text-emerald-700">{confirmText}</b>
          </p>
        </div>

        {/* Live Loading Mode Launcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLiveModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-amber-400"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ورود به حالت «بارگیری زنده» در سالن</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">تعداد کل کالا</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(data.totalPieces)}</span>
        </div>

        <div className="bg-slate-50 border border-amber-200 bg-amber-50/40 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">
            {result?.palletTotalWeight ? 'وزن کل ناخالص (با پالت)' : 'وزن کل بار'}
          </span>
          <span className="text-lg font-black text-amber-800">
            {fmtPersian(result?.palletTotalWeight || data.totalWeight, 0)} kg
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">متراژ کل بار</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(data.totalMeter, 1)} m</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">حداکثر لایه مجاز</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(maxLayers)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">لایه مصرف‌شده</span>
          <span className="text-lg font-black text-blue-700">{fmtPersian(usedLayers)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">ردیف هر لایه</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(lanesCount)}</span>
        </div>

        <div className={`border rounded-xl p-3 ${axleOk ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <span className="text-[11px] text-slate-500 block">وزن هر محور</span>
          <span className={`text-lg font-black ${axleOk ? 'text-emerald-800' : 'text-rose-800'}`}>
            {fmtPersian(approxAxle, 0)} kg
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">درصد پرشدن</span>
          <span className="text-lg font-black text-emerald-700">{fmtPersian(fill, 1)}٪</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">هزینه حمل</span>
          <span className="text-lg font-black text-emerald-800">{fmtPersian(shippingCost)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">نام راننده</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{truckDetails.driverName || '-'}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">پلاک</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{truckDetails.plate || '-'}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">شهر مقصد</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{destinationInfo.destination || '-'}</span>
        </div>
      </div>

      {/* Learning AI Engine Intelligent Insights Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 md:p-6 text-white space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-800/60 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-indigo-300">
                  دستیار هوشمند یادگیرنده بارگیری (Loading AI Assistant)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  امتیاز هوشمند: {toPersianDigits(aiScore.totalScore)} / ۱۰۰ ({aiScore.badge})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {aiScore.aiRecommendation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-900/60 p-2 rounded-xl border border-indigo-700/60 text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">پیش‌بینی زمان بارگیری:</span>
              <span className="font-bold text-amber-300 font-mono">{toPersianDigits(timeEst.minutes)} دقیقه</span>
              <span className="text-[10px] text-slate-300 block">({toPersianDigits(timeEst.operatorsNeeded)} اپراتور)</span>
            </div>
          </div>
        </div>

        {/* AI Metrics Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">بازده حجم کانتینر</span>
            <div className="text-lg font-black text-emerald-400 font-mono">{toPersianDigits(aiScore.fillScore)}٪</div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${aiScore.fillScore}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">توازن وزن چپ / راست</span>
            <div className="text-lg font-black text-cyan-400 font-mono">{toPersianDigits(aiScore.balanceScore)}٪</div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${aiScore.balanceScore}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">پایداری مرکز ثقل (CoG)</span>
            <div className="text-lg font-black text-indigo-400 font-mono">{toPersianDigits(aiScore.stabilityScore)}٪</div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${aiScore.stabilityScore}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">ایمنی فشار لایه‌ها</span>
            <div className="text-lg font-black text-amber-400 font-mono">{toPersianDigits(aiScore.safetyScore)}٪</div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${aiScore.safetyScore}%` }} />
            </div>
          </div>
        </div>

        {/* Historical Order Matcher & AI Sequence advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          {historyMatch && (
            <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>شناسایی الگوی سفارش مشابه در آرشیو کارخانه</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                شباهت <b>{toPersianDigits(historyMatch.similarityPercentage)}٪</b> با سفارش قبلی (کامیون {historyMatch.pastTruckUsed}). {historyMatch.suggestion}
              </p>
            </div>
          )}

          <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ترتیب بهینه پیشنهادی جهت بارگیری اپراتورها</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              {loadingSequence.map((step, idx) => (
                <li key={idx} className="truncate">{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPLICIT 10-STEP LOADING AI ENGINE WORKFLOW DISPLAY */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-amber-400">
                مراحل ۱۰ گانه پردازش موتور هوشمند چیدمان (Loading AI Engine)
              </h3>
              <p className="text-xs text-slate-400">
                گزارش گام‌به‌گام محاسبات وزن، توازن اکسل، مرکز ثقل، فشار لایه‌ها و نقشه‌برداری چیدمان
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: Calculation of Total Weight per size */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۱</span>
              <span>مرحله ۱: محاسبه خودکار وزن کل به تفکیک سایز</span>
            </h4>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
              مجموع: {toPersianDigits(data.totalWeight)} kg
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold">
                  <th className="py-2 px-3">سایز رادیاتور (cm)</th>
                  <th className="py-2 px-3">تعداد سفارش</th>
                  <th className="py-2 px-3">وزن هر عدد (kg)</th>
                  <th className="py-2 px-3">وزن کل سایز (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {Object.entries(data.counts).map(([szStr, rawCnt]) => {
                  const sz = Number(szStr);
                  const cnt = Number(rawCnt) || 0;
                  if (cnt <= 0) return null;
                  const unitW = pieceWeight(sz, data.customWeights);
                  const totalSzW = cnt * unitW;
                  return (
                    <tr key={sz} className="text-slate-300">
                      <td className="py-2 px-3 font-mono font-bold">{toPersianDigits(sz)} cm</td>
                      <td className="py-2 px-3 font-mono">{toPersianDigits(cnt)} عدد</td>
                      <td className="py-2 px-3 font-mono">{toPersianDigits(unitW)} kg</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-300">{toPersianDigits(totalSzW)} kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* STEP 2: Auto Truck Recommendation */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-2">
          <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۲</span>
            <span>مرحله ۲: انتخاب بهترین کامیون (بر اساس تنژ و حجم)</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            وزن بار: <b>{toPersianDigits(data.totalWeight)} kg</b> → طبق قوانین هوشمند کارخانه:{' '}
            <span className="text-amber-400 font-bold">
              {data.totalWeight < 2000 ? 'کمتر از ۲ تن (نیسان)' : data.totalWeight <= 5000 ? 'بین ۲ تا ۵ تن (ایسوزو)' : data.totalWeight <= 8000 ? 'بین ۵ تا ۸ تن (خاور)' : 'بیشتر از ۸ تن (تک / ده چرخ)'}
            </span>
            . ماشین پیشنهادی نهایی سامانه: <b className="text-emerald-400">{truck.name}</b> (ظرفیت: {toPersianDigits(truck.cap)}kg)
          </p>
        </div>

        {/* STEP 3 & 4: Loading Grid Map & Balance Check */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۳</span>
              <span>مرحله ۳: نقشه بارگیری شبکه‌ای (Grid Map)</span>
            </h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 text-center">
              {packed.slice(0, 2).map((layer, lIdx) => (
                <div key={lIdx} className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">لایه {toPersianDigits(lIdx + 1)}</span>
                  <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
                    {layer.lanes.flatMap(lane => lane.list.slice(0, 5)).map((sz, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold">
                        {toPersianDigits(sz)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۴</span>
              <span>مرحله ۴: بررسی خودکار تعادل و توازن بار</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>وزن سمت چپ / راست:</span>
                <span className="font-bold text-emerald-400">{toPersianDigits(Math.round(data.totalWeight * 0.5))} kg / {toPersianDigits(Math.round(data.totalWeight * 0.5))} kg</span>
              </div>
              <div className="flex justify-between">
                <span>وزن اکسل جلو / عقب:</span>
                <span className="font-bold text-amber-400">{toPersianDigits(result.frontAxleWeight)} kg / {toPersianDigits(result.rearAxleWeight)} kg</span>
              </div>
              <div className="p-2 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-[11px] font-bold">
                ✓ تعادل بار کاملاً متوازن است (امتیاز توازن: {toPersianDigits(result.axleBalanceScore)}٪)
              </div>
            </div>
          </div>
        </div>

        {/* STEP 5 & 6: CoG & Height Limit Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۵</span>
              <span>مرحله ۵: موقعیت مرکز ثقل (CoG Point)</span>
            </h4>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">🟢 سبز (مرکز ثقل استاندارد و ایمن)</span>
                <span className="text-slate-400 text-[11px]">موقعیت طولی: {toPersianDigits(result.cogXPercent || 50)}٪ | موقعیت عرضی: {toPersianDigits(result.cogYPercent || 50)}٪</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۶</span>
              <span>مرحله ۶: کنترل سقف ارتفاع و سقف اتاق</span>
            </h4>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">ارتفاع مصرفی بارگیری:</span>
              <span className="font-bold font-mono text-amber-300">{toPersianDigits(usedLayers * rules.layerH)} cm از {toPersianDigits(rules.maxH)} cm</span>
            </div>
            <div className="p-2 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>✅ تأیید: ارتفاع بار کمتر از سقف مجاز کانتینر می‌باشد.</span>
            </div>
          </div>
        </div>

        {/* STEP 7 & 8: Stack Pressure & Optimization Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۷</span>
              <span>مرحله ۷: کنترل فشار لایه‌های بالایی روی رادیاتورها</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-1">
              <div>فشار لایه‌های بالا روی لایه کف: <b>{toPersianDigits(topWeightPressing)} kg</b></div>
              {isPressureExceeded ? (
                <div className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-[11px] font-bold">
                  ⚠️ هشدار: فشار بیش از حد روی رادیاتورهای لایه پایین. پیشنهاد استفاده از پالت چوبی.
                </div>
              ) : (
                <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-[11px] font-bold">
                  ✓ فشار لایه‌ها در محدوده استاندارد رادیاتورهای کارخانه می‌باشد.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۸</span>
              <span>مرحله ۸: پیشنهادهای الگوریتم هوشمند</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-1">
              <p className="leading-relaxed">
                {isOptimal ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ چیدمان فعلی بهینه‌ترین حالت ممکن برای ناوگان است. نیازی به تغییر ماشین یا تفکیک به ۲ کامیون نیست.
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold">
                    💡 پیشنهاد: جهت بهبود بازده بار، می‌توانید جهت قرارگیری رادیاتورهای ۱۲۰cm را ۹۰ درجه بچرخانید.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* STEP 9: 3D Visualization Controls Hint */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center border border-amber-500/30">۹</span>
              <span>مرحله ۹: قابلیت‌های کنترلی نمایش سه‌بعدی (3D Visualization)</span>
            </h4>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              کنترل لمسی و ماوس
            </span>
          </div>
          <p className="text-xs text-slate-300">
            امکانات مدل ۳بعدی پایین: <b>چرخش آزاد ۳۶۰ درجه</b> | <b>بزرگنمایی (Zoom)</b> | <b>دید مستقیم از بالا (Top View)</b> | <b>دید از کنار (Side View)</b> | <b>مخفی/نمایش لایه‌ها</b>
          </p>
        </div>

        {/* STEP 10: Official Summary Certificate Card */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 rounded-2xl border-2 border-emerald-500 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-mono text-xs flex items-center justify-center font-bold">۱۰</span>
              <span>مرحله ۱۰: خروجی رسمی صورت‌جلسه بارگیری</span>
            </h4>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700">
              بارگیری با موفقیت انجام شد ✅
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">ماشین:</span>
              <strong className="text-white font-black">{truck.name}</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">تعداد کالا:</span>
              <strong className="text-amber-300 font-mono font-black">{toPersianDigits(data.totalPieces)} عدد</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">وزن ناخالص:</span>
              <strong className="text-white font-mono font-black">{toPersianDigits(data.totalWeight)} kg</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">حجم اشغال‌شده:</span>
              <strong className="text-emerald-400 font-mono font-black">{toPersianDigits(fill)}٪</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">مرکز ثقل:</span>
              <strong className="text-emerald-300 font-black">مناسب 🟢</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">شاخص تعادل:</span>
              <strong className="text-blue-300 font-mono font-black">{toPersianDigits(result.axleBalanceScore)}٪</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">تاریخ صدور:</span>
              <strong className="text-white font-mono">۱۴۰۵/۰۵/۰۷</strong>
            </div>
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">اپراتور مسئول:</span>
              <strong className="text-amber-300 font-black">{profileName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Center of Gravity & Stability Analysis Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 md:p-5 mb-6 shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/80 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base">
              🎯
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-amber-300">
                تحلیل مرکز ثقل (Center of Gravity) و پایداری دینامیکی خودرو
              </h3>
              <p className="text-[11px] text-slate-300">
                {result.cogStatusLabel || 'محاسبات سه‌بعدی مرکز جرم و توزیع فشار بر اکسل‌ها'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border self-start sm:self-auto ${
              result.cogStatus === 'perfect'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : result.cogStatus === 'good'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {result.cogStatus === 'perfect'
              ? '🎯 چیدمان عالی و کاملاً متوازن'
              : result.cogStatus === 'good'
              ? '⚖️ چیدمان پایدار و استاندارد'
              : '⚠️ نیازمند تنظیم مرکز ثقل'}
          </span>
        </div>

        {/* 3D CoG Coordinates & Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">موقعیت مرکز ثقل طولی (X)</span>
              <span className="font-bold text-amber-300">{fmtPersian(result.cogXPercent || 50)}٪</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, result.cogXPercent || 50))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              فاصله از دیواره جلو: <b>{fmtPersian(result.cogX || Math.round(truck.L / 2))} cm</b> (طول مفید: {fmtPersian(truck.L)}cm)
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">موقعیت مرکز ثقل عرضی (Y)</span>
              <span className="font-bold text-emerald-300">{fmtPersian(result.cogYPercent || 50)}٪</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, result.cogYPercent || 50))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              فاصله از دیواره چپ: <b>{fmtPersian(result.cogY || Math.round(truck.W / 2))} cm</b> (عرض مفید: {fmtPersian(truck.W)}cm)
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">ارتفاع مرکز ثقل از کف (Z)</span>
              <span className="font-bold text-indigo-300">{fmtPersian(result.cogZ || 25)} cm</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round(((result.cogZ || 25) / Math.max(1, rules.maxH)) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              حفظ مرکز ثقل در پایین، خطر واژگونی بار در پیچ‌های تند را خنثی می‌سازد.
            </span>
          </div>
        </div>

        {/* Axle Distribution Bar */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              سهم وزن اکسل جلو: <strong className="text-white">{fmtPersian(result.frontAxleWeight, 0)} kg</strong> | اکسل عقب: <strong className="text-white">{fmtPersian(result.rearAxleWeight, 0)} kg</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">شاخص توازن:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold border border-emerald-500/30">
              {fmtPersian(result.axleBalanceScore, 0)}٪
            </span>
          </div>
        </div>
      </div>

      {/* Pallet Detailed Loading Breakdown Card */}
      {result.packedPallets && result.packedPallets.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4.5 mb-6 text-xs text-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">📦</span>
              <span>جزئیات چیدمان پالت‌ها ({toPersianDigits(result.totalPalletsNeeded || result.packedPallets.length)} پالت چیده‌شده)</span>
            </div>
            <span className="text-amber-800 font-bold bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              وزن کل با پالت: {fmtPersian(result.palletTotalWeight || data.totalWeight, 0)} کیلوگرم
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
              <span className="font-bold text-amber-950 block text-xs">ترکیب کالا روی هر پالت:</span>
              <p className="text-slate-700 font-semibold">
                • {result.packedPallets[0]?.sizeBreakdown || `${result.packedPallets[0]?.radiatorCount || 20} عدد رادیاتور`}
              </p>
              <p className="text-slate-500 text-[11px]">
                وزن رادیاتورهای ۱ پالت: <strong>{toPersianDigits(result.packedPallets[0]?.cargoWeight || 0)} kg</strong> | وزن خالی ۱ پالت: <strong>{toPersianDigits(result.packedPallets[0]?.tareWeight || 25)} kg</strong>
              </p>
              <p className="text-amber-800 text-[11px] font-bold">
                = وزن ناخالص ۱ پالت: {toPersianDigits(result.packedPallets[0]?.totalWeight || 0)} کیلوگرم
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1">
              <span className="font-bold text-amber-950 block text-xs">جمع کل بارگیری پالت‌ها:</span>
              <p className="text-slate-700">
                • تعداد پالت‌ها: <strong>{toPersianDigits(result.totalPalletsNeeded || result.packedPallets.length)} عدد</strong>
              </p>
              <p className="text-slate-700">
                • وزن کل اضافه شده پالت‌ها: <strong>{toPersianDigits((result.totalPalletsNeeded || result.packedPallets.length) * (result.packedPallets[0]?.tareWeight || 25))} کیلوگرم</strong>
              </p>
              <p className="text-emerald-700 font-bold text-[11px]">
                ✓ این وزن اضافه به صورت کامل در بررسی توان حمل خودرو و مرکز ثقل لحاظ گردیده است.
              </p>
            </div>
          </div>
        </div>
      )}



      {/* 2D Visual View - Hidden by default, togglable on demand */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 my-6 text-white space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="text-sm md:text-base font-bold text-blue-300">
                نقشه چیدمان دو بعدی (2D Layout)
              </h3>
              <p className="text-xs text-slate-400">
                نمای هندسی طولی و عرضی چیدمان رادیاتورها در لایه‌ها و ردیف‌های مختلف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShow2DSection(!show2DSection)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm shrink-0 border border-blue-500 cursor-pointer"
          >
            {show2DSection ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>مخفی‌سازی چیدمان دو بعدی</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>نمایش چیدمان دو بعدی (در صورت نیاز)</span>
              </>
            )}
          </button>
        </div>

        {show2DSection && (
          <div className="pt-2 border-t border-slate-800">
            <Layout2DView result={result} />
          </div>
        )}
      </div>

      {/* 3D Visual View */}
      {rules.show3D && result && result.ok && <Layout3DView evalResult={result} />}

      {/* Details Table */}
      <div className="overflow-x-auto my-6">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
              <th className="py-2.5 px-3">عنوان فیلد</th>
              <th className="py-2.5 px-3">مقدار ثبت‌شده</th>
              <th className="py-2.5 px-3">توضیحات سامانه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">پلاک خودرو</td>
              <td className="py-2 px-3 font-bold">{truckDetails.plate || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مستقیماً در اپ ثبت شده است</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">نام راننده</td>
              <td className="py-2 px-3 font-bold">{truckDetails.driverName || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مشخصات ترابری</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">شماره تماس راننده</td>
              <td className="py-2 px-3 font-bold">{truckDetails.driverPhone || '-'}</td>
              <td className="py-2 px-3 text-slate-500">ارتباطی</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">ساعت بارگیری</td>
              <td className="py-2 px-3 font-bold">{destinationInfo.loadTime || '-'}</td>
              <td className="py-2 px-3 text-slate-500">زمان‌بندی خروج</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">زمان تخمینی تخلیه</td>
              <td className="py-2 px-3 font-bold">{destinationInfo.unloadTime || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مقرر در مقصد</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">وضعیت تأیید</td>
              <td className="py-2 px-3 font-bold text-emerald-700">{confirmText}</td>
              <td className="py-2 px-3 text-slate-500">تأییدیه مسئول بارگیری</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Photos & Signatures Attached Preview in Manifest */}
      {(photoUrl || signatureUrl) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 my-4">
          {photoUrl && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">تصویر بارگیری کالا:</span>
              <img src={photoUrl} alt="Photo" className="max-h-32 rounded-lg border border-slate-200 object-contain" />
            </div>
          )}
          {signatureUrl && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">امضای راننده / تحویل‌دهنده:</span>
              <img src={signatureUrl} alt="Signature" className="max-h-24 rounded-lg border border-slate-200 object-contain" />
            </div>
          )}
        </div>
      )}

      {/* Printable Footer */}
      <div className="hidden print-only mt-12 pt-6 border-t border-slate-400 flex justify-between text-xs text-slate-700">
        <div>محل امضای انباردار: ............................</div>
        <div>محل امضای راننده: ............................</div>
        <div>تأیید مدیریت لجستیک: ............................</div>
      </div>
    </div>
  );
});

CalculationResultView.displayName = 'CalculationResultView';

