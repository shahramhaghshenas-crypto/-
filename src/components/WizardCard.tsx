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
  DollarSign,
  FileText,
  Layers,
  CheckSquare
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
  onSelectBestVehicle?: () => void;
  bestVehicleName?: string;
  bestVehicleFill?: number;
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
  onSelectBestVehicle,
  bestVehicleName,
  bestVehicleFill,
}) => {
  const [step, setStep] = useState<number>(1);
  const [showAllCardsInWizard, setShowAllCardsInWizard] = useState<boolean>(false);

  const totalPieces = Object.values(counts).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);

  const steps = [
    { num: 1, title: '۱. شماره سفارش و حواله', icon: FileText },
    { num: 2, title: '۲. ثبت مقادیر رادیاتورها', icon: Box },
    { num: 3, title: '۳. تنظیم تعداد لایه‌ها', icon: Layers },
    { num: 4, title: '۴. انتخاب هوشمند خودرو', icon: Truck },
    { num: 5, title: '۵. بازبینی چیدمان کانتینر', icon: Calculator },
    { num: 6, title: '۶. تأیید نهایی بارگیری', icon: CheckCircle2 },
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
                مراحل ۶گانه گردش‌کار ثبت بارگیری (ثبت سفارش انبار)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تکمیل گردش کار ثبت بار با دقت بالا و توازن مرکز ثقل
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
            {showAllCardsInWizard ? 'حالت گام‌به‌گام' : 'نمایش یکجای همه مراحل'}
          </button>

          {/* Stepper Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
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
                  <span className="hidden xl:inline">{s.title}</span>
                  <span>{toPersianDigits(s.num)}</span>
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

          <DestinationCard
            info={destinationInfo}
            onChange={onDestinationInfoChange}
            access={getFeatureAccess('destination')}
          />
          <OrderPresetsImporter onApplyCounts={onCountsChange} />
          <QuantitiesCard
            counts={counts}
            onChange={onCountsChange}
            customWeights={customWeights}
            onCustomWeightsChange={onCustomWeightsChange}
            access={getFeatureAccess('loading_items')}
            manualLayers={rules.manualLayers}
            onManualLayersChange={(layers) => onRulesChange({ ...rules, manualLayers: layers })}
          />
          <PalletConfigCard
            config={palletConfig}
            onChange={onPalletConfigChange}
            totalRadiators={totalPieces}
            access={getFeatureAccess('pallets')}
          />
          <LayoutRulesCard
            rules={rules}
            onChange={onRulesChange}
            onRunCalc={onFinishWizard}
            access={getFeatureAccess('layout_rules')}
          />
          <VehicleCard
            details={truckDetails}
            onChange={onTruckDetailsChange}
            selectedIndex={selectedTruckIndex}
            onSelectPreset={onTruckSelect}
            access={getFeatureAccess('manual_vehicle')}
            autoVehicleActive={rules.autoVehicle}
            onManualCustomized={() => onRulesChange({ ...rules, autoVehicle: false })}
            onSelectBestVehicle={onSelectBestVehicle}
            bestVehicleName={bestVehicleName}
            bestVehicleFill={bestVehicleFill}
          />
          <VehicleRecommendationCard
            counts={counts}
            customWeights={customWeights}
            rules={rules}
            palletConfig={palletConfig}
            selectedTruckIndex={selectedTruckIndex}
            onSelectVehiclePreset={(idx, preset) => {
              onTruckSelect(idx);
              onTruckDetailsChange({ ...truckDetails, id: preset.id, model: preset.name, L: preset.L, W: preset.W, H: preset.H, cap: preset.cap });
            }}
            access={getFeatureAccess('manual_vehicle')}
          />
          <MultiStopCard
            destinationInfo={destinationInfo}
            onChange={onDestinationInfoChange}
            lifoEnabled={rules.lifoPriority}
            onToggleLifo={(val) => onRulesChange({ ...rules, lifoPriority: val })}
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
          {/* STAGE 1: ORDER NUMBER */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <FileText className="w-4 h-4 text-blue-600" />
                  مرحله ۱: وارد کردن شماره حواله سفارش و مشخصات ترابری مقصد
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره حواله / سفارش:</label>
                    <input
                      type="text"
                      value={truckDetails.waybillNo || ''}
                      onChange={(e) => onTruckDetailsChange({ ...truckDetails, waybillNo: e.target.value })}
                      placeholder="مثال: حواله-۸۸۳۱"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام راننده کانتینر:</label>
                    <input
                      type="text"
                      value={truckDetails.driverName || ''}
                      onChange={(e) => onTruckDetailsChange({ ...truckDetails, driverName: e.target.value })}
                      placeholder="مثال: علیرضا محمدی"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره پلاک کامیون:</label>
                    <input
                      type="text"
                      value={truckDetails.plate || ''}
                      onChange={(e) => onTruckDetailsChange({ ...truckDetails, plate: e.target.value })}
                      placeholder="مثال: ۲۲ ع ۸۴۳ ایران ۴۴"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <DestinationCard
                info={destinationInfo}
                onChange={onDestinationInfoChange}
                access={getFeatureAccess('destination')}
              />
            </div>
          )}

          {/* STAGE 2: RADIATOR REGISTRATION */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <Box className="w-4 h-4 text-blue-600" />
                  مرحله ۲: ثبت و وارد کردن تعداد رادیاتورهای پنلی سفارش
                </span>
                <span className="font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-700 text-xs">
                  تعداد کل ثبت‌شده: {toPersianDigits(Number(totalPieces))} عدد
                </span>
              </div>

              <OrderPresetsImporter onApplyCounts={onCountsChange} />

              <QuantitiesCard
                counts={counts}
                onChange={onCountsChange}
                customWeights={customWeights}
                onCustomWeightsChange={onCustomWeightsChange}
                access={getFeatureAccess('loading_items')}
                onConfirm={() => setStep(3)}
                manualLayers={rules.manualLayers}
                onManualLayersChange={(layers) => onRulesChange({ ...rules, manualLayers: layers })}
              />

              <PalletConfigCard
                config={palletConfig}
                onChange={onPalletConfigChange}
                totalRadiators={totalPieces}
                radiatorCounts={counts}
                access={getFeatureAccess('pallets')}
              />
            </div>
          )}

          {/* STAGE 3: NUMBER OF LAYERS */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-bold">
                <Layers className="w-4 h-4 text-blue-600" />
                مرحله ۳: تنظیم محدودیت تعداد لایه‌ها و قوانین فنی چیدمان بارگیری
              </div>

              <LayoutRulesCard
                rules={rules}
                onChange={onRulesChange}
                onRunCalc={onFinishWizard}
                access={getFeatureAccess('layout_rules')}
              />

              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">تعیین تعداد لایه‌های چیدمان دستی (Requested Layers):</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={rules.manualLayers || 10}
                    onChange={(e) => onRulesChange({ ...rules, manualLayers: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm font-black font-mono bg-blue-100 dark:bg-blue-950/60 px-3 py-1 rounded text-blue-700 dark:text-blue-300">
                    {toPersianDigits(rules.manualLayers || 10)} لایه
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  تعداد لایه‌های درخواستی (requestedLayers) جهت محدود کردن چیدمان به ارتفاع دلخواه استفاده می‌شود. تعداد لایه‌های نهایی (usedLayers) به صورت هوشمند از خروجی چیدمان کانتینر محاسبه خواهد شد.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 4: SMART VEHICLE SELECTION */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-bold">
                <Truck className="w-4 h-4 text-blue-600" />
                مرحله ۴: پیشنهاد هوشمند و انتخاب مدل خودرو بر اساس ظرفیت، ابعاد کانتینر و وزن
              </div>

              {/* Automatic Vehicle Recommendation Engine */}
              <VehicleRecommendationCard
                counts={counts}
                customWeights={customWeights}
                rules={rules}
                palletConfig={palletConfig}
                selectedTruckIndex={selectedTruckIndex}
                onSelectVehiclePreset={(idx, preset) => {
                  onTruckSelect(idx);
                  onTruckDetailsChange({ ...truckDetails, id: preset.id, model: preset.name, L: preset.L, W: preset.W, H: preset.H, cap: preset.cap });
                }}
                access={getFeatureAccess('manual_vehicle')}
              />

              {/* Vehicle Specs & Manual Adjustments */}
              <VehicleCard
                details={truckDetails}
                onChange={onTruckDetailsChange}
                selectedIndex={selectedTruckIndex}
                onSelectPreset={onTruckSelect}
                access={getFeatureAccess('manual_vehicle')}
                autoVehicleActive={rules.autoVehicle}
                onManualCustomized={() => onRulesChange({ ...rules, autoVehicle: false })}
                onSelectBestVehicle={onSelectBestVehicle}
                bestVehicleName={bestVehicleName}
                bestVehicleFill={bestVehicleFill}
              />
            </div>
          )}

          {/* STAGE 5: LAYOUT REVIEW */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3.5 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-bold">
                <Calculator className="w-4 h-4 text-blue-600" />
                مرحله ۵: بازبینی توزیع اکسل جلو/عقب، محاسبات تراز مرکز ثقل (CoG) و بازده پرشدن
              </div>

              <MultiStopCard
                destinationInfo={destinationInfo}
                onChange={onDestinationInfoChange}
                lifoEnabled={rules.lifoPriority}
                onToggleLifo={(val) => onRulesChange({ ...rules, lifoPriority: val })}
              />

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <h4 className="text-xs font-black text-amber-400">راهنما و دستورالعمل بازبینی چیدمان:</h4>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  قبل از تایید نهایی، مطمئن شوید که بازده کانتینر بیش از ۷۰٪ باشد و هیچ همپوشانی (overlap) در 3D چیدمان وجود نداشته باشد. مرکز ثقل باید در محدوده ۴۵٪ تا ۵۵٪ طولی و دقیقاً ۵۰٪ عرضی باشد تا از واژگونی یا اضافه بار روی اکسل فرمان پیشگیری شود.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 6: FINAL CONFIRMATION */}
          {step === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                مرحله ۶: ثبت تصویر بارگیری نهایی، هزینه حمل، امضای دیجیتال و صدور حواله
              </div>

              {/* Confirmation box */}
              <div className="p-4 bg-white dark:bg-slate-800 border-2 border-dashed border-blue-400/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.confirmLoading}
                    onChange={(e) => onRulesChange({ ...rules, confirmLoading: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                      تأیید نهایی عملیات بارگیری و تطابق بار با انبار کارخانه رادیاتور
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      با فعال‌سازی تاییدیه بارگیری، مجوز حواله خروج رسمی برای نگهبانی کارخانه صادر می‌گردد.
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
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <ArrowRight className="w-4 h-4" />
          مرحله قبل
        </button>

        <div className="flex items-center gap-3">
          {step < 6 && !showAllCardsInWizard ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(6, prev + 1))}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm shadow-blue-200 dark:shadow-none cursor-pointer"
            >
              مرحله بعد
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinishWizard}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs md:text-sm flex items-center gap-2 transition shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              محاسبه مجدد چیدمان و نمایش الگوی ۳بعدی
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
