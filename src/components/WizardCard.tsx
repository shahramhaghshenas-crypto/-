import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Box,
  MapPin,
  Sliders,
  Calculator,
  LayoutGrid,
  Sparkles,
  PackageCheck,
  DollarSign
} from 'lucide-react';
import {
  RadiatorCounts,
  CustomWeights,
  PalletConfig,
  TruckDetails,
  DestinationInfo,
  LayoutRules,
  ShippingCostInfo,
  FeatureAccess,
  FeatureKey
} from '../types';
import { toPersianDigits } from '../utils/persianDigits';

import { VEHICLE_PRESETS } from '../data/presets';
import { OrderPresetsImporter } from './OrderPresetsImporter';
import { QuantitiesCard } from './QuantitiesCard';
import { PalletConfigCard } from './PalletConfigCard';
import { DestinationCard } from './DestinationCard';
import { MultiStopCard } from './MultiStopCard';
import { VehicleCard } from './VehicleCard';
import { VehicleRecommendationCard } from './VehicleRecommendationCard';
import { LayoutRulesCard } from './LayoutRulesCard';
import { ShippingCostCard } from './ShippingCostCard';
import { PhotosSignatureCard } from './PhotosSignatureCard';

interface WizardCardProps {
  counts: RadiatorCounts;
  onCountsChange: (counts: RadiatorCounts) => void;
  customWeights: CustomWeights;
  onCustomWeightsChange: (weights: CustomWeights) => void;
  palletConfig: PalletConfig;
  onPalletConfigChange: (config: PalletConfig) => void;
  truckDetails: TruckDetails;
  onTruckDetailsChange: (details: TruckDetails) => void;
  selectedTruckIndex: number;
  onTruckSelect: (index: number) => void;
  destinationInfo: DestinationInfo;
  onDestinationInfoChange: (info: DestinationInfo) => void;
  rules: LayoutRules;
  onRulesChange: (rules: LayoutRules) => void;
  shippingCostInfo: ShippingCostInfo;
  onShippingCostInfoChange: (info: ShippingCostInfo) => void;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  signatureUrl: string | null;
  onSignatureChange: (url: string | null) => void;
  getFeatureAccess?: (key: FeatureKey) => FeatureAccess;
  onFinishWizard: () => void;
}

export const WizardCard: React.FC<WizardCardProps> = ({
  counts,
  onCountsChange,
  customWeights,
  onCustomWeightsChange,
  palletConfig,
  onPalletConfigChange,
  truckDetails,
  onTruckDetailsChange,
  selectedTruckIndex,
  onTruckSelect,
  destinationInfo,
  onDestinationInfoChange,
  rules,
  onRulesChange,
  shippingCostInfo,
  onShippingCostInfoChange,
  photoUrl,
  onPhotoChange,
  signatureUrl,
  onSignatureChange,
  getFeatureAccess = (_key: FeatureKey) => 'active' as FeatureAccess,
  onFinishWizard,
}) => {
  const [step, setStep] = useState<number>(1);
  const [showAllCardsInWizard, setShowAllCardsInWizard] = useState<boolean>(false);

  const totalPieces = Object.values(counts).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);

  const steps = [
    { num: 1, title: 'تعداد و پالت‌بندی', icon: Box },
    { num: 2, title: 'مقصد و راننده', icon: MapPin },
    { num: 3, title: 'خودرو و قوانین چیدمان', icon: Truck },
    { num: 4, title: 'تأیید و محاسبه n-بعدی', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6 no-print">
      {/* Top Header & Wizard Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                راهنمای گام‌به‌گام بارگیری (حالت Wizard)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تغییر کامل تمام پارامترهای بارگیری به صورت گام‌به‌گام با پیش‌نمایش آنلاین چیدمان
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View Mode in Wizard */}
          <button
            type="button"
            onClick={() => setShowAllCardsInWizard(!showAllCardsInWizard)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              showAllCardsInWizard
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {showAllCardsInWizard ? 'حالت گام‌به‌گام' : 'نمایش یکجای همه پارامترها'}
          </button>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = s.num < step;
              const isCurrent = s.num === step && !showAllCardsInWizard;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    setStep(s.num);
                    setShowAllCardsInWizard(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
      </div>

      {/* VIEW MODE: SHOW ALL CARDS IN WIZARD OR STEP-BY-STEP */}
      {showAllCardsInWizard ? (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            در این حالت، تمام کارت‌ها و پارامترها به صورت کامل جهت تغییر باز هستند و نتایج فوراً در مدل ۳بعدی پایین محاسبه می‌شود.
          </div>

          <OrderPresetsImporter onApplyCounts={onCountsChange} />
          <QuantitiesCard
            counts={counts}
            onChange={onCountsChange}
            customWeights={customWeights}
            onCustomWeightsChange={onCustomWeightsChange}
            access={getFeatureAccess('loading_items')}
          />
          <PalletConfigCard
            config={palletConfig}
            onChange={onPalletConfigChange}
            totalRadiators={totalPieces}
            access={getFeatureAccess('pallets')}
          />
          <VehicleCard
            details={truckDetails}
            onChange={onTruckDetailsChange}
            selectedIndex={selectedTruckIndex}
            onSelectPreset={onTruckSelect}
            access={getFeatureAccess('manual_vehicle')}
            autoVehicleActive={rules.autoVehicle}
            onManualCustomized={() => onRulesChange({ ...rules, autoVehicle: false })}
          />
          <DestinationCard
            info={destinationInfo}
            onChange={onDestinationInfoChange}
            access={getFeatureAccess('destination')}
          />
          <MultiStopCard
            destinationInfo={destinationInfo}
            onChange={onDestinationInfoChange}
            lifoEnabled={rules.lifoPriority}
            onToggleLifo={(val) => onRulesChange({ ...rules, lifoPriority: val })}
          />
          <LayoutRulesCard
            rules={rules}
            onChange={onRulesChange}
            onRunCalc={onFinishWizard}
            access={getFeatureAccess('layout_rules')}
          />
          <VehicleRecommendationCard
            counts={counts}
            customWeights={customWeights}
            rules={rules}
            palletConfig={palletConfig}
            selectedTruckIndex={selectedTruckIndex}
            onSelectVehiclePreset={(idx, preset) => {
              onTruckSelect(idx);
              onTruckDetailsChange({ ...truckDetails, model: preset.name, L: preset.L, W: preset.W, cap: preset.cap });
            }}
            access={getFeatureAccess('manual_vehicle')}
          />
          <ShippingCostCard
            costInfo={shippingCostInfo}
            palletTotalCost={shippingCostInfo.palletTotalCost}
            usePallets={palletConfig.usePallets}
            palletCount={0}
            onChange={onShippingCostInfoChange}
            access={getFeatureAccess('cost')}
          />
          <PhotosSignatureCard
            access={getFeatureAccess('photos_sign')}
            photoUrl={photoUrl}
            onPhotoChange={onPhotoChange}
            signatureUrl={signatureUrl}
            onSignatureChange={onSignatureChange}
          />
        </div>
      ) : (
        <div>
          {/* STEP 1: QUANTITIES, ORDER IMPORT & PALLET CONFIG */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <PackageCheck className="w-4 h-4 text-blue-600" />
                  گام ۱: مشخص کردن تعداد رادیاتورها، بارگذاری پیش‌فرض‌ها و تنظیمات پالت‌بندی
                </span>
                <span className="font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-700">
                  مجموع: {toPersianDigits(Number(totalPieces))} عدد
                </span>
              </div>

              <OrderPresetsImporter onApplyCounts={onCountsChange} />

              <QuantitiesCard
                counts={counts}
                onChange={onCountsChange}
                customWeights={customWeights}
                onCustomWeightsChange={onCustomWeightsChange}
                access={getFeatureAccess('loading_items')}
              />

              <PalletConfigCard
                config={palletConfig}
                onChange={onPalletConfigChange}
                totalRadiators={totalPieces}
                access={getFeatureAccess('pallets')}
              />
            </div>
          )}

          {/* STEP 2: DESTINATION, DRIVER & MULTI-STOP LIFO */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4 text-blue-600" />
                گام ۲: مشخصات شهر/مقصد، اطلاعات راننده، شماره بارنامه و مقاصد چندگانه (LIFO)
              </div>

              <DestinationCard
                info={destinationInfo}
                onChange={onDestinationInfoChange}
                access={getFeatureAccess('destination')}
              />

              <MultiStopCard
                destinationInfo={destinationInfo}
                onChange={onDestinationInfoChange}
                lifoEnabled={rules.lifoPriority}
                onToggleLifo={(val) => onRulesChange({ ...rules, lifoPriority: val })}
              />
            </div>
          )}

          {/* STEP 3: VEHICLE PRESETS & LAYOUT RULES */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-semibold">
                <Truck className="w-4 h-4 text-blue-600" />
                گام ۳: انتخاب خودرو، تغییر ابعاد، ارتفاع مجاز و قوانین فیزیکی اکسل‌ها
              </div>

              <VehicleCard
                details={truckDetails}
                onChange={onTruckDetailsChange}
                selectedIndex={selectedTruckIndex}
                onSelectPreset={onTruckSelect}
                access={getFeatureAccess('manual_vehicle')}
                autoVehicleActive={rules.autoVehicle}
                onManualCustomized={() => onRulesChange({ ...rules, autoVehicle: false })}
              />

              <LayoutRulesCard
                rules={rules}
                onChange={onRulesChange}
                onRunCalc={onFinishWizard}
                access={getFeatureAccess('layout_rules')}
              />

              <VehicleRecommendationCard
                counts={counts}
                customWeights={customWeights}
                rules={rules}
                palletConfig={palletConfig}
                selectedTruckIndex={selectedTruckIndex}
                onSelectVehiclePreset={(idx, preset) => {
                  onTruckSelect(idx);
                  onTruckDetailsChange({ ...truckDetails, model: preset.name, L: preset.L, W: preset.W, cap: preset.cap });
                }}
                access={getFeatureAccess('manual_vehicle')}
              />
            </div>
          )}

          {/* STEP 4: FINAL CONFIRMATION, FREIGHT COSTS & EXECUTE */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                گام ۴: تأیید نهایی بارگیری، تنظیمات کرایه حمل، عکس/امضا و شروع الگوریتم
              </div>

              {/* Confirmation box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.confirmLoading}
                    onChange={(e) => onRulesChange({ ...rules, confirmLoading: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      تأیید نهایی عملیات بارگیری و انطباق با انبار
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      با تایید این بخش، گزارش نهایی آماده صدور و چاپ با امضای دیجیتال می‌شود.
                    </p>
                  </div>
                </label>
              </div>

              <ShippingCostCard
                costInfo={shippingCostInfo}
                palletTotalCost={shippingCostInfo.palletTotalCost}
                usePallets={palletConfig.usePallets}
                palletCount={0}
                onChange={onShippingCostInfoChange}
                access={getFeatureAccess('cost')}
              />

              <PhotosSignatureCard
                access={getFeatureAccess('photos_sign')}
                photoUrl={photoUrl}
                onPhotoChange={onPhotoChange}
                signatureUrl={signatureUrl}
                onSignatureChange={onSignatureChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Stepper Actions Bar */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1 || showAllCardsInWizard}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <ArrowRight className="w-4 h-4" />
          مرحله قبل
        </button>

        <div className="flex items-center gap-3">
          {step < 4 && !showAllCardsInWizard ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(4, prev + 1))}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm shadow-blue-200 dark:shadow-none"
            >
              مرحله بعد
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinishWizard}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 transition shadow-md shadow-emerald-200 dark:shadow-none"
            >
              <Calculator className="w-4 h-4" />
              محاسبه مجدد چیدمان و ثبت نهایی
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

