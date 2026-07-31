import React from 'react';
import { Truck, AlertCircle, Sparkles } from 'lucide-react';
import { TruckDetails, FeatureAccess } from '../types';
import { VEHICLE_PRESETS } from '../data/presets';
import { VehicleRecommendation } from '../utils/calculation';
import { VehicleRecommendationPanel } from './VehicleRecommendationPanel';
import { toPersianDigits } from '../utils/persianDigits';

interface VehicleCardProps {
  details: TruckDetails;
  onChange: (details: TruckDetails) => void;
  selectedIndex: number;
  onSelectPreset: (index: number) => void;
  access?: FeatureAccess;
  onManualCustomized?: () => void;
  autoVehicleActive?: boolean;
  recommendation?: VehicleRecommendation;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  details,
  onChange,
  selectedIndex,
  onSelectPreset,
  access = 'active',
  onManualCustomized,
  autoVehicleActive = false,
  recommendation
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const handlePresetSelect = (idx: number) => {
    onSelectPreset(idx);
    const p = VEHICLE_PRESETS[idx];
    if (p) {
      onChange({
        ...details,
        model: p.name,
        L: p.L,
        W: p.W,
        cap: p.cap
      });
    }
  };

  const handleDimensionChange = (field: 'L' | 'W' | 'cap', valStr: string) => {
    const val = valStr === '' ? 0 : Math.max(0, parseInt(valStr) || 0);
    onChange({
      ...details,
      [field]: val
    });
    if (onManualCustomized) {
      onManualCustomized();
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
        <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          خودرو و مشخصات ابعاد و ظرفیت بارگیری
        </h2>
        
        {autoVehicleActive ? (
          <span className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            انتخاب خودکار کامیون فعال است (تغییر ابعاد پایین، حالت خودکار را به دستی تغییر می‌دهد)
          </span>
        ) : (
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            حالت سفارشی دستی (ابعاد و ظرفیت دقیق شما در چیدمان اعمال می‌شود)
          </span>
        )}
      </div>

      {/* Recommendation Panel */}
      {recommendation && (
        <VehicleRecommendationPanel
          recommendation={recommendation}
          onSelectPreset={handlePresetSelect}
          selectedPresetIndex={selectedIndex}
        />
      )}

      {/* Preset vehicle selector pills */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          انتخاب سریع الگوی خودرو (بر اساس ابعاد، تناژ مجاز و متراژ رادیاتور):
        </label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_PRESETS.map((p, idx) => {
            const active = selectedIndex === idx;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetSelect(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex flex-col items-start gap-1 text-right ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 dark:shadow-none'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{p.name}</span>
                  {p.nominalTonnage && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${active ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {p.nominalTonnage}
                    </span>
                  )}
                </div>
                <div className={`text-[10px] font-medium ${active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {toPersianDigits(p.L)}×{toPersianDigits(p.W)} cm {p.radiatorMeterRange ? ` | ${p.radiatorMeterRange}` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            طول مفید ماشین (سانتی‌متر)
          </label>
          <input
            type="number"
            min="0"
            onFocus={(e) => e.target.select()}
            value={details.L}
            onChange={(e) => handleDimensionChange('L', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            عرض مفید ماشین (سانتی‌متر)
          </label>
          <input
            type="number"
            min="0"
            onFocus={(e) => e.target.select()}
            value={details.W}
            onChange={(e) => handleDimensionChange('W', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ظرفیت وزنی مجاز (کیلوگرم)
          </label>
          <input
            type="number"
            min="0"
            onFocus={(e) => e.target.select()}
            value={details.cap}
            onChange={(e) => handleDimensionChange('cap', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            پلاک خودرو
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="۱۲الف۳۴۵-۶۷"
              value={details.plate}
              onChange={(e) => onChange({ ...details, plate: e.target.value })}
              className="w-full bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-sm font-black text-slate-800 dark:text-slate-100 tracking-wider focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            نوع / مدل خودرو
          </label>
          <input
            type="text"
            placeholder="مثلاً ده چرخ هیوندای"
            value={details.model}
            onChange={(e) => onChange({ ...details, model: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            نام راننده
          </label>
          <input
            type="text"
            placeholder="نام و نام خانوادگی"
            value={details.driverName}
            onChange={(e) => onChange({ ...details, driverName: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            شماره تماس راننده
          </label>
          <input
            type="text"
            placeholder="09123456789"
            value={details.driverPhone}
            onChange={(e) => onChange({ ...details, driverPhone: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            شماره حواله خروج / پالت
          </label>
          <input
            type="text"
            placeholder="مثلاً PL-9842"
            value={details.waybillNo}
            onChange={(e) => onChange({ ...details, waybillNo: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
