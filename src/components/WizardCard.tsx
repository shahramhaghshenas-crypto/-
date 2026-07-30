import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Truck, Box, MapPin, Sliders, Calculator } from 'lucide-react';
import { RadiatorCounts, VehiclePreset } from '../types';
import { RADIATOR_SIZES, VEHICLE_PRESETS } from '../data/presets';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

interface WizardCardProps {
  counts: RadiatorCounts;
  onCountsChange: (counts: RadiatorCounts) => void;
  destination: string;
  onDestinationChange: (val: string) => void;
  driverName: string;
  onDriverNameChange: (val: string) => void;
  plate: string;
  onPlateChange: (val: string) => void;
  selectedTruckIndex: number;
  onTruckSelect: (index: number) => void;
  tL: number;
  onTLChange: (val: number) => void;
  tW: number;
  onTWChange: (val: number) => void;
  tCap: number;
  onTCapChange: (val: number) => void;
  maxH: number;
  onMaxHChange: (val: number) => void;
  rowW: number;
  onRowWChange: (val: number) => void;
  layerH: number;
  onLayerHChange: (val: number) => void;
  confirmLoading: boolean;
  onConfirmLoadingChange: (val: boolean) => void;
  onFinishWizard: () => void;
}

export const WizardCard: React.FC<WizardCardProps> = ({
  counts,
  onCountsChange,
  destination,
  onDestinationChange,
  driverName,
  onDriverNameChange,
  plate,
  onPlateChange,
  selectedTruckIndex,
  onTruckSelect,
  tL,
  onTLChange,
  tW,
  onTWChange,
  tCap,
  onTCapChange,
  maxH,
  onMaxHChange,
  rowW,
  onRowWChange,
  layerH,
  onLayerHChange,
  confirmLoading,
  onConfirmLoadingChange,
  onFinishWizard,
}) => {
  const [step, setStep] = useState<number>(1);

  const steps = [
    { num: 1, title: 'تعداد رادیاتورها', icon: Box },
    { num: 2, title: 'مقصد و راننده', icon: MapPin },
    { num: 3, title: 'خودرو و ارتفاع', icon: Truck },
    { num: 4, title: 'تأیید و محاسبه', icon: CheckCircle2 },
  ];

  const handleCountChange = (size: number, val: number) => {
    onCountsChange({
      ...counts,
      [size]: Math.max(0, val),
    });
  };

  const handleTruckPresetClick = (idx: number) => {
    onTruckSelect(idx);
    const p = VEHICLE_PRESETS[idx];
    if (p) {
      onTLChange(p.L);
      onTWChange(p.W);
      onTCapChange(p.cap);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 no-print">
      {/* Step Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            راهنمای مرحله‌به‌مرحله بارگیری (Wizard)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مرحله {toPersianDigits(step)} از ۴: {steps[step - 1].title}
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{toPersianDigits(s.num)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Radiators count */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 p-3 rounded-xl">
            تعداد رادیاتورهای مورد نیاز به سانتی‌متر را وارد کنید:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {RADIATOR_SIZES.map((size) => (
              <div key={size} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {toPersianDigits(size)} سانتی
                </label>
                <input
                  type="number"
                  min="0"
                  value={counts[size] || 0}
                  onChange={(e) => handleCountChange(size, parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Destination & Driver */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 p-3 rounded-xl">
            اطلاعات مقصد و راننده را مشخص کنید:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">شهر/مقصد</label>
              <input
                type="text"
                placeholder="مثلاً تهران، خیابان آزادی"
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">نام راننده</label>
              <input
                type="text"
                placeholder="نام و نام خانوادگی راننده"
                value={driverName}
                onChange={(e) => onDriverNameChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">پلاک خودرو</label>
              <input
                type="text"
                placeholder="۱۲الف۳۴۵-۶۷"
                value={plate}
                onChange={(e) => onPlateChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Vehicle & Height */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 p-3 rounded-xl">
            خودروی مورد نظر و ابعاد مجاز ارتفاع چیدمان را تنظیم کنید:
          </p>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_PRESETS.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => handleTruckPresetClick(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  selectedTruckIndex === idx
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ارتفاع مجاز (cm)</label>
              <input
                type="number"
                min="11"
                max="180"
                value={maxH}
                onChange={(e) => onMaxHChange(parseInt(e.target.value) || 150)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">طول مفید (cm)</label>
              <input
                type="number"
                value={tL}
                onChange={(e) => onTLChange(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">عرض مفید (cm)</label>
              <input
                type="number"
                value={tW}
                onChange={(e) => onTWChange(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ظرفیت وزنی (kg)</label>
              <input
                type="number"
                value={tCap}
                onChange={(e) => onTCapChange(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">عرض هر ردیف (cm)</label>
              <input
                type="number"
                value={rowW}
                onChange={(e) => onRowWChange(parseInt(e.target.value) || 60)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ارتفاع هر لایه (cm)</label>
              <input
                type="number"
                value={layerH}
                onChange={(e) => onLayerHChange(parseInt(e.target.value) || 11)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation & Execute */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
            اطلاعات واردشده آماده محاسبه است. لطفاً تایید نهایی را علامت بزنید:
          </p>
          <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmLoading}
              onChange={(e) => onConfirmLoadingChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-slate-800">تأیید نهایی بارگیری و شروع الگوریتم</span>
          </label>
        </div>
      )}

      {/* Bottom Wizard Toolbar */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition"
        >
          <ArrowRight className="w-4 h-4" />
          مرحله قبل
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((prev) => Math.min(4, prev + 1))}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition"
          >
            مرحله بعد
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onFinishWizard}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 transition shadow-md shadow-emerald-200"
          >
            <Calculator className="w-4 h-4" />
            محاسبه چیدمان از روی Wizard
          </button>
        )}
      </div>
    </div>
  );
};
