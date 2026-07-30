import React from 'react';
import { Package, Layers, DollarSign, Scale, Ruler, Info, CheckCircle2, Box } from 'lucide-react';
import { PalletConfig, PalletMaterial, FeatureAccess } from '../types';
import { PALLET_MATERIAL_PRESETS } from '../data/presets';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

interface PalletConfigCardProps {
  config: PalletConfig;
  onChange: (config: PalletConfig) => void;
  totalRadiators: number;
  access?: FeatureAccess;
}

export const PalletConfigCard: React.FC<PalletConfigCardProps> = ({
  config,
  onChange,
  totalRadiators,
  access = 'active'
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const handleMaterialChange = (mat: PalletMaterial) => {
    const preset = PALLET_MATERIAL_PRESETS[mat];
    onChange({
      ...config,
      material: mat,
      tareWeight: preset.tareWeight,
      unitPrice: preset.unitPrice
    });
  };

  const radsPerPallet = Math.max(1, config.radiatorsPerPallet || 20);
  const calculatedPalletCount = Math.ceil(totalRadiators / radsPerPallet);
  const activePalletCount = config.customPalletCount > 0 ? config.customPalletCount : Math.max(1, calculatedPalletCount);
  const totalPalletCost = activePalletCount * config.unitPrice;
  const totalPalletTareWeight = activePalletCount * config.tareWeight;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
          <Box className="w-5 h-5 text-amber-500" />
          <span>تنظیمات هوشمند پالت‌بندی، ابعاد و جنس پالت (چوبی / فلزی / پلاستیکی)</span>
        </div>

        {/* Pallet Mode Switcher Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800/60 transition hover:bg-amber-100">
          <input
            type="checkbox"
            checked={config.usePallets}
            disabled={isReadOnly}
            onChange={(e) => onChange({ ...config, usePallets: e.target.checked })}
            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
          />
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <Package className="w-4 h-4 text-amber-600" />
            فعال‌سازی ارسال با پالت (محاسبه قیمت و وزن پالت)
          </span>
        </label>
      </div>

      {!config.usePallets ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            حالت ارسال فله/رادیاتور مستقیم فعال است. جهت پالت‌بندی رادیاتورها، گزینه «فعال‌سازی ارسال با پالت» در بالا را روشن کنید.
          </span>
        </div>
      ) : (
        <div className="space-y-5 animate-fadeIn">
          {/* Pallet Material Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 block">
              انتخاب جنس پالت:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['wooden', 'metal', 'plastic'] as PalletMaterial[]).map((mat) => {
                const preset = PALLET_MATERIAL_PRESETS[mat];
                const isSelected = config.material === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleMaterialChange(mat)}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between text-right relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute top-2.5 left-2.5" />
                    )}
                    <div>
                      <span className="font-bold text-sm block mb-1">
                        {preset.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        وزن خالی: {toPersianDigits(preset.tareWeight)} kg
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {fmtPersian(preset.unitPrice)} تومان / عدد
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Pallet Length */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                طول پالت (cm):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.length}
                onChange={(e) => onChange({ ...config, length: Math.max(10, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pallet Width */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                عرض پالت (cm):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.width}
                onChange={(e) => onChange({ ...config, width: Math.max(10, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pallet Base Height */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                ارتفاع کفی پالت (cm):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.height}
                onChange={(e) => onChange({ ...config, height: Math.max(5, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pallet Tare Weight */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                وزن پالت خالی (kg):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.tareWeight}
                onChange={(e) => onChange({ ...config, tareWeight: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing & Quantities Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
            {/* Unit Price Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                قیمت هر پالت (تومان - دستی):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.unitPrice}
                onChange={(e) => onChange({ ...config, unitPrice: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700 dark:text-emerald-400"
              />
            </div>

            {/* Radiators per Pallet */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                تعداد رادیاتور در هر پالت:
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.radiatorsPerPallet}
                onChange={(e) => onChange({ ...config, radiatorsPerPallet: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Custom Pallet Count Override */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                تعداد دستی پالت‌ها (۰ = خودکار):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={config.customPalletCount}
                onChange={(e) => onChange({ ...config, customPalletCount: Math.max(0, Number(e.target.value)) })}
                placeholder="خودکار"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pallet Summary Banner */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-sm">
                  خلاصه محاسبه قیمت و وزن پالت‌ها
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  تعداد کل پالت مورد نیاز: <strong>{toPersianDigits(activePalletCount)} عدد</strong> | وزن اضافه پالت‌ها: <strong>{toPersianDigits(totalPalletTareWeight)} کیلوگرم</strong>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 text-right sm:text-left shadow-xs">
              <span className="text-[11px] text-slate-500 block">جمع قیمت کل پالت‌ها:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {fmtPersian(totalPalletCost)} تومان
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
