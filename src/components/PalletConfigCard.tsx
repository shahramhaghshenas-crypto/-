import React, { useState, useEffect, useRef } from 'react';
import { Package, Layers, Scale, Ruler, Info, CheckCircle2, Box, Plus, Trash2, Edit3, Copy, ShoppingBag, ArrowRight, Settings2 } from 'lucide-react';
import { PalletConfig, PalletMaterial, FeatureAccess, CustomPalletItem, RadiatorCounts, SizePalletSpec } from '../types';
import { PALLET_MATERIAL_PRESETS, RADIATOR_SIZES, DEFAULT_PER_SIZE_PALLET_SPECS } from '../data/presets';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

interface PalletConfigCardProps {
  config: PalletConfig;
  onChange: (config: PalletConfig) => void;
  totalRadiators: number;
  radiatorCounts?: RadiatorCounts;
  access?: FeatureAccess;
  onSyncCounts?: (counts: RadiatorCounts) => void;
}

export const PalletConfigCard: React.FC<PalletConfigCardProps> = React.memo(({
  config,
  onChange,
  totalRadiators,
  radiatorCounts = {},
  access = 'active',
  onSyncCounts
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  // Mode: 'per_size' (manual per size), 'basket' (custom basket of individual pallets), or 'standard' (uniform pallets)
  const activeMode = config.sizeDistributionMode === 'basket' ? 'basket' : (config.sizeDistributionMode === 'standard' || config.sizeDistributionMode === 'auto' ? 'standard' : 'per_size');

  // Per-size pallet specs state
  const [perSizeInputs, setPerSizeInputs] = useState<Record<number, {
    length: string;
    width: string;
    height: string;
    tareWeight: string;
    radiatorsPerPallet: string;
    unitPrice: string;
  }>>(() => {
    const init: Record<number, any> = {};
    const specs = config.perSizeSpecs || DEFAULT_PER_SIZE_PALLET_SPECS;
    RADIATOR_SIZES.forEach((sz) => {
      const s = specs[sz] || DEFAULT_PER_SIZE_PALLET_SPECS[sz];
      init[sz] = {
        length: String(s?.length ?? 120),
        width: String(s?.width ?? 100),
        height: String(s?.height ?? 15),
        tareWeight: String(s?.tareWeight ?? 25),
        radiatorsPerPallet: String(s?.radiatorsPerPallet ?? 25),
        unitPrice: String(s?.unitPrice ?? 180000)
      };
    });
    return init;
  });

  // Local inputs for standard uniform mode
  const [localInputs, setLocalInputs] = useState({
    length: String(config.length ?? 120),
    width: String(config.width ?? 100),
    height: String(config.height ?? 15),
    tareWeight: String(config.tareWeight ?? 25),
    unitPrice: String(config.unitPrice ?? 180000),
    radiatorsPerPallet: String(config.radiatorsPerPallet ?? 20),
    customPalletCount: config.customPalletCount > 0 ? String(config.customPalletCount) : ''
  });

  const [customSizes, setCustomSizes] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    RADIATOR_SIZES.forEach((sz) => {
      const val = config.customSizeCounts?.[sz];
      init[sz] = val !== undefined && val > 0 ? String(val) : (sz === 100 || sz === 120 ? '10' : '0');
    });
    return init;
  });

  // State for Building a New Pallet Item in Basket Mode
  const [basket, setBasket] = useState<CustomPalletItem[]>(config.customPalletBasket || []);
  const [editingPalletId, setEditingPalletId] = useState<string | null>(null);

  const [newItemForm, setNewItemForm] = useState<{
    name: string;
    material: PalletMaterial;
    length: string;
    width: string;
    height: string;
    tareWeight: string;
    unitPrice: string;
    radiatorCounts: Record<number, string>;
  }>({
    name: 'پالت شماره ۱',
    material: 'wooden',
    length: '140',
    width: '110',
    height: '15',
    tareWeight: '25',
    unitPrice: '180000',
    radiatorCounts: { 60: '0', 80: '0', 100: '0', 120: '10', 140: '10', 160: '0', 180: '0' }
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate allocated radiators in custom pallet basket vs required order
  const basketAllocated: Record<number, number> = {};
  RADIATOR_SIZES.forEach((sz) => { basketAllocated[sz] = 0; });

  (config.customPalletBasket || basket || []).forEach((p) => {
    Object.entries(p.radiatorCounts || {}).forEach(([szStr, cnt]) => {
      const sz = Number(szStr);
      const c = Number(cnt);
      if (sz > 0 && c > 0) {
        basketAllocated[sz] = (basketAllocated[sz] || 0) + c;
      }
    });
  });

  const remainingPerSize: Record<number, number> = {};
  let totalRequiredInOrder = 0;
  let totalAllocatedInBasket = 0;

  RADIATOR_SIZES.forEach((sz) => {
    const req = radiatorCounts[sz] || 0;
    const alloc = basketAllocated[sz] || 0;
    const rem = Math.max(0, req - alloc);
    remainingPerSize[sz] = rem;
    totalRequiredInOrder += req;
    totalAllocatedInBasket += alloc;
  });

  const totalRemainingInOrder = Math.max(0, totalRequiredInOrder - totalAllocatedInBasket);

  const handleFillRemainingIntoForm = () => {
    const filledCounts: Record<number, string> = {};
    RADIATOR_SIZES.forEach((sz) => {
      filledCounts[sz] = String(remainingPerSize[sz] || 0);
    });
    setNewItemForm((prev) => ({
      ...prev,
      name: `پالت شماره ${basket.length + 1}`,
      radiatorCounts: filledCounts
    }));
  };

  // Sync inputs with config
  useEffect(() => {
    setLocalInputs({
      length: String(config.length ?? 120),
      width: String(config.width ?? 100),
      height: String(config.height ?? 15),
      tareWeight: String(config.tareWeight ?? 25),
      unitPrice: String(config.unitPrice ?? 180000),
      radiatorsPerPallet: String(config.radiatorsPerPallet ?? 25),
      customPalletCount: config.customPalletCount > 0 ? String(config.customPalletCount) : ''
    });

    if (config.perSizeSpecs) {
      const nextPerSize: Record<number, any> = {};
      RADIATOR_SIZES.forEach((sz) => {
        const s = config.perSizeSpecs?.[sz] || DEFAULT_PER_SIZE_PALLET_SPECS[sz];
        nextPerSize[sz] = {
          length: String(s?.length ?? 120),
          width: String(s?.width ?? 100),
          height: String(s?.height ?? 15),
          tareWeight: String(s?.tareWeight ?? 25),
          radiatorsPerPallet: String(s?.radiatorsPerPallet ?? 25),
          unitPrice: String(s?.unitPrice ?? 180000)
        };
      });
      setPerSizeInputs(nextPerSize);
    }

    if (config.customSizeCounts) {
      const nextSizes: Record<number, string> = {};
      RADIATOR_SIZES.forEach((sz) => {
        const val = config.customSizeCounts?.[sz];
        nextSizes[sz] = val !== undefined && val > 0 ? String(val) : '0';
      });
      setCustomSizes(nextSizes);
    }
    if (config.customPalletBasket) {
      setBasket(config.customPalletBasket);
    }
  }, [
    config.material,
    config.length,
    config.width,
    config.height,
    config.tareWeight,
    config.unitPrice,
    config.radiatorsPerPallet,
    config.customPalletCount,
    config.customSizeCounts,
    config.customPalletBasket,
    config.perSizeSpecs
  ]);

  const handlePerSizeSpecChange = (size: number, field: string, value: string) => {
    const updated = {
      ...perSizeInputs,
      [size]: {
        ...perSizeInputs[size],
        [field]: value
      }
    };
    setPerSizeInputs(updated);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const parsedSpecs: Record<number, SizePalletSpec> = {};
      RADIATOR_SIZES.forEach((sz) => {
        const inp = updated[sz];
        const def = DEFAULT_PER_SIZE_PALLET_SPECS[sz];
        parsedSpecs[sz] = {
          length: parseInt(inp.length, 10) || def.length,
          width: parseInt(inp.width, 10) || def.width,
          height: parseInt(inp.height, 10) || def.height,
          tareWeight: parseFloat(inp.tareWeight) || def.tareWeight,
          radiatorsPerPallet: parseInt(inp.radiatorsPerPallet, 10) || def.radiatorsPerPallet,
          unitPrice: parseFloat(inp.unitPrice) || def.unitPrice
        };
      });

      onChange({
        ...config,
        usePallets: true,
        sizeDistributionMode: 'per_size',
        perSizeSpecs: parsedSpecs
      });
    }, 50);
  };

  const propagateStandardChange = (
    newInputs: typeof localInputs,
    newSizes: typeof customSizes = customSizes,
    distMode: 'auto' | 'custom' = config.sizeDistributionMode === 'custom' ? 'custom' : 'auto'
  ) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const len = parseInt(newInputs.length, 10);
      const w = parseInt(newInputs.width, 10);
      const h = parseInt(newInputs.height, 10);
      const tare = parseFloat(newInputs.tareWeight);
      const price = parseFloat(newInputs.unitPrice);
      let rads = parseInt(newInputs.radiatorsPerPallet, 10);
      const customCnt = parseInt(newInputs.customPalletCount, 10);

      const parsedCustomSizes: Record<number, number> = {};
      let customRadsSum = 0;
      RADIATOR_SIZES.forEach((sz) => {
        const p = parseInt(newSizes[sz], 10);
        const val = !isNaN(p) && p >= 0 ? p : 0;
        parsedCustomSizes[sz] = val;
        customRadsSum += val;
      });

      if (distMode === 'custom' && customRadsSum > 0) {
        rads = customRadsSum;
      }

      onChange({
        ...config,
        usePallets: true,
        material: config.material,
        length: !isNaN(len) && len > 0 ? len : config.length,
        width: !isNaN(w) && w > 0 ? w : config.width,
        height: !isNaN(h) && h > 0 ? h : config.height,
        tareWeight: !isNaN(tare) && tare >= 0 ? tare : config.tareWeight,
        unitPrice: !isNaN(price) && price >= 0 ? price : config.unitPrice,
        radiatorsPerPallet: !isNaN(rads) && rads > 0 ? rads : 20,
        customPalletCount: !isNaN(customCnt) && customCnt >= 0 ? customCnt : 0,
        sizeDistributionMode: distMode,
        customSizeCounts: parsedCustomSizes
      });
    }, 40);
  };

  const handleFieldChange = (field: keyof typeof localInputs, valStr: string) => {
    const nextInputs = { ...localInputs, [field]: valStr };
    setLocalInputs(nextInputs);
    propagateStandardChange(nextInputs);
  };

  const handleSizeCountChange = (size: number, valStr: string) => {
    const nextSizes = { ...customSizes, [size]: valStr };
    setCustomSizes(nextSizes);

    let sum = 0;
    RADIATOR_SIZES.forEach((sz) => {
      const v = parseInt(sz === size ? valStr : customSizes[sz], 10);
      if (!isNaN(v) && v > 0) sum += v;
    });

    const nextInputs = {
      ...localInputs,
      radiatorsPerPallet: sum > 0 ? String(sum) : localInputs.radiatorsPerPallet
    };
    setLocalInputs(nextInputs);
    propagateStandardChange(nextInputs, nextSizes, 'custom');
  };

  const handleMaterialChange = (mat: PalletMaterial) => {
    const preset = PALLET_MATERIAL_PRESETS[mat];
    const nextInputs = {
      ...localInputs,
      tareWeight: String(preset.tareWeight),
      unitPrice: String(preset.unitPrice)
    };
    setLocalInputs(nextInputs);
    onChange({
      ...config,
      usePallets: true,
      material: mat,
      tareWeight: preset.tareWeight,
      unitPrice: preset.unitPrice
    });
  };

  // Switch between Per-Size specs mode, Custom Basket mode, or Standard Uniform mode
  const handleSwitchMode = (mode: 'per_size' | 'basket' | 'standard') => {
    if (mode === 'per_size') {
      const parsedSpecs: Record<number, SizePalletSpec> = {};
      RADIATOR_SIZES.forEach((sz) => {
        const inp = perSizeInputs[sz] || {};
        const def = DEFAULT_PER_SIZE_PALLET_SPECS[sz];
        parsedSpecs[sz] = {
          length: parseInt(inp.length, 10) || def.length,
          width: parseInt(inp.width, 10) || def.width,
          height: parseInt(inp.height, 10) || def.height,
          tareWeight: parseFloat(inp.tareWeight) || def.tareWeight,
          radiatorsPerPallet: parseInt(inp.radiatorsPerPallet, 10) || def.radiatorsPerPallet,
          unitPrice: parseFloat(inp.unitPrice) || def.unitPrice
        };
      });

      onChange({
        ...config,
        usePallets: true,
        sizeDistributionMode: 'per_size',
        perSizeSpecs: parsedSpecs
      });
    } else if (mode === 'basket') {
      onChange({
        ...config,
        usePallets: true,
        sizeDistributionMode: 'basket',
        customPalletBasket: basket
      });
    } else {
      onChange({
        ...config,
        usePallets: true,
        sizeDistributionMode: 'auto'
      });
    }
  };

  // Add or Update Pallet in Basket
  const handleAddOrUpdateBasketPallet = () => {
    const len = parseInt(newItemForm.length, 10) || 120;
    const w = parseInt(newItemForm.width, 10) || 100;
    const h = parseInt(newItemForm.height, 10) || 15;
    const tare = parseFloat(newItemForm.tareWeight) || 25;
    const price = parseFloat(newItemForm.unitPrice) || 180000;

    const radCounts: Record<number, number> = {};
    let totalRads = 0;
    RADIATOR_SIZES.forEach((sz) => {
      const cnt = parseInt(newItemForm.radiatorCounts[sz], 10) || 0;
      if (cnt > 0) {
        radCounts[sz] = cnt;
        totalRads += cnt;
      }
    });

    const item: CustomPalletItem = {
      id: editingPalletId || `pallet_${Date.now()}`,
      name: newItemForm.name || `پالت شماره ${basket.length + 1}`,
      material: newItemForm.material,
      length: len,
      width: w,
      height: h,
      tareWeight: tare,
      unitPrice: price,
      radiatorCounts: radCounts
    };

    let updatedBasket: CustomPalletItem[] = [];
    if (editingPalletId) {
      updatedBasket = basket.map((p) => (p.id === editingPalletId ? item : p));
      setEditingPalletId(null);
    } else {
      updatedBasket = [...basket, item];
    }

    setBasket(updatedBasket);

    // Reset form for next pallet
    setNewItemForm({
      name: `پالت شماره ${updatedBasket.length + 1}`,
      material: newItemForm.material,
      length: newItemForm.length,
      width: newItemForm.width,
      height: '15',
      tareWeight: newItemForm.tareWeight,
      unitPrice: newItemForm.unitPrice,
      radiatorCounts: { 60: '0', 80: '0', 100: '0', 120: '0', 140: '0', 160: '0', 180: '0' }
    });

    // Update global config with basket
    onChange({
      ...config,
      usePallets: true,
      sizeDistributionMode: 'basket',
      customPalletBasket: updatedBasket
    });
  };

  const handleEditPalletInBasket = (p: CustomPalletItem) => {
    setEditingPalletId(p.id);
    const radsStr: Record<number, string> = {};
    RADIATOR_SIZES.forEach((sz) => {
      radsStr[sz] = String(p.radiatorCounts[sz] || 0);
    });

    setNewItemForm({
      name: p.name || `پالت`,
      material: p.material,
      length: String(p.length),
      width: String(p.width),
      height: String(p.height),
      tareWeight: String(p.tareWeight),
      unitPrice: String(p.unitPrice),
      radiatorCounts: radsStr
    });
  };

  const handleDuplicatePallet = (p: CustomPalletItem) => {
    const clone: CustomPalletItem = {
      ...p,
      id: `pallet_${Date.now()}`,
      name: `${p.name || 'پالت'} (کپی)`
    };
    const updated = [...basket, clone];
    setBasket(updated);
    onChange({
      ...config,
      usePallets: true,
      sizeDistributionMode: 'basket',
      customPalletBasket: updated
    });
  };

  const handleDeletePalletFromBasket = (id: string) => {
    const updated = basket.filter((p) => p.id !== id);
    setBasket(updated);
    onChange({
      ...config,
      usePallets: true,
      sizeDistributionMode: 'basket',
      customPalletBasket: updated
    });
  };

  // Sync entire basket radiator totals into main QuantitiesCard counts state
  const handleSyncBasketToMainCounts = () => {
    const combinedCounts: RadiatorCounts = { 60: 0, 80: 0, 100: 0, 120: 0, 140: 0, 160: 0, 180: 0 };
    basket.forEach((p) => {
      Object.entries(p.radiatorCounts).forEach(([szStr, cnt]) => {
        const sz = Number(szStr);
        const c = Number(cnt);
        if (sz > 0 && c > 0) {
          combinedCounts[sz] = (combinedCounts[sz] || 0) + c;
        }
      });
    });
    if (onSyncCounts) {
      onSyncCounts(combinedCounts);
    }
  };

  // Calculations for basket summary
  const totalBasketRads = basket.reduce((sum, p) => {
    const pSum = Object.values(p.radiatorCounts).reduce((a: number, b: number) => a + Number(b), 0);
    return sum + pSum;
  }, 0);

  const totalBasketTare = basket.reduce((sum, p) => sum + p.tareWeight, 0);
  const totalBasketCost = basket.reduce((sum, p) => sum + p.unitPrice, 0);

  // Standard calculations
  const radsPerPallet = Math.max(1, parseInt(localInputs.radiatorsPerPallet, 10) || 20);
  const calculatedPalletCount = Math.ceil(totalRadiators / radsPerPallet);
  const activePalletCount = parseInt(localInputs.customPalletCount, 10) > 0
    ? parseInt(localInputs.customPalletCount, 10)
    : Math.max(1, calculatedPalletCount);

  const currentTareWeight = parseFloat(localInputs.tareWeight) || config.tareWeight || 25;
  const currentUnitPrice = parseFloat(localInputs.unitPrice) || config.unitPrice || 180000;

  const totalPalletCost = activePalletCount * currentUnitPrice;
  const totalPalletTareWeight = activePalletCount * currentTareWeight;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-5 md:p-6 shadow-sm space-y-5">
      {/* Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-base">
          <Box className="w-5 h-5 text-amber-500" />
          <span>تنظیمات هوشمند پالت‌بندی، ابعاد اختصاصی و سبد پالت‌ها</span>
        </div>

        {/* Pallet Mode Switcher Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-amber-950/50 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 transition hover:bg-amber-100">
          <input
            type="checkbox"
            checked={config.usePallets}
            disabled={isReadOnly}
            onChange={(e) => onChange({ ...config, usePallets: e.target.checked })}
            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
          />
          <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-amber-600" />
            فعال‌سازی چیدمان بر اساس پالت (با محاسبه وزن پالت)
          </span>
        </label>
      </div>

      {!config.usePallets ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            حالت ارسال فله/رادیاتور مستقیم فعال است. برای تعریف پالت‌ها با ابعاد متفاوت و چیدمان پالت‌محور، گزینه بالا را روشن کنید.
          </span>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Workflow Mode Tabs: Per-Size Specs vs Custom Pallet Basket vs Uniform Standard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSwitchMode('per_size')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'per_size'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Settings2 className="w-4 h-4 text-amber-200" />
              <span>ابعاد دستی پالت برای هر سایز</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('basket')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'basket'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ایجاد سبد پالت‌های اختصاصی</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('standard')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'standard'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>پالت‌های هم‌شکل و یکسان</span>
            </button>
          </div>

          {/* Live Order Balance & Remaining Radiator Ticker */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-black">
                <Box className="w-4 h-4 text-amber-400" />
                <span>وضعیت کسر و چیدمان سفارش کل بر روی پالت‌ها:</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-slate-400">کل سفارش: <strong className="text-white font-mono">{toPersianDigits(totalRequiredInOrder)}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">چیده‌شده: <strong className="font-mono">{toPersianDigits(totalAllocatedInBasket)}</strong></span>
                <span className="text-slate-600">|</span>
                <span className={totalRemainingInOrder > 0 ? "text-amber-400 font-black" : "text-emerald-400 font-black"}>
                  باقی‌مانده (کسری): <strong className="font-mono">{toPersianDigits(totalRemainingInOrder)}</strong>
                </span>
              </div>
            </div>

            {/* Per-size Breakdown Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {RADIATOR_SIZES.map((sz) => {
                const req = radiatorCounts[sz] || 0;
                if (req === 0) return null;
                const rem = remainingPerSize[sz] || 0;
                const isComplete = rem === 0;

                return (
                  <div
                    key={sz}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                      isComplete
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-800 text-amber-200'
                    }`}
                  >
                    <span>{toPersianDigits(sz)}cm:</span>
                    <span className="font-mono">{toPersianDigits(req - rem)} / {toPersianDigits(req)}</span>
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-900/80 px-1 rounded">
                        {toPersianDigits(rem)} باقی‌مانده
                      </span>
                    )}
                  </div>
                );
              })}

              {activeMode === 'basket' && totalRemainingInOrder > 0 && (
                <button
                  type="button"
                  onClick={handleFillRemainingIntoForm}
                  className="mr-auto px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>پر کردن فرم با {toPersianDigits(totalRemainingInOrder)} عدد باقی‌مانده سفارش</span>
                </button>
              )}
            </div>
          </div>

          {/* MODE 1: PER-SIZE CUSTOM PALLET SPECIFICATIONS */}
          {activeMode === 'per_size' ? (
            <div className="space-y-4 bg-amber-50/40 dark:bg-amber-950/20 p-4.5 rounded-2xl border border-amber-200 dark:border-amber-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-100 font-black text-sm">
                  <Ruler className="w-5 h-5 text-amber-600" />
                  <span>تنظیم ابعاد، وزن و ظرفیت پالت به‌صورت مجزا برای هر سایز رادیاتور</span>
                </div>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-lg">
                  هر چه سایز رادیاتور بزرگتر باشد، ابعاد پالت متناسب با آن محاسبه می‌شود
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {RADIATOR_SIZES.map((sz) => {
                  const inp = perSizeInputs[sz] || {
                    length: '120',
                    width: '100',
                    height: '15',
                    tareWeight: '25',
                    radiatorsPerPallet: '20',
                    unitPrice: '180000'
                  };

                  return (
                    <div
                      key={sz}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <span className="font-black text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-amber-500" />
                          پالت رادیاتور {sz} سانتی‌متر
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-mono">
                          {sz}cm
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            طول پالت (cm):
                          </label>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={inp.length}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePerSizeSpecChange(sz, 'length', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            عرض پالت (cm):
                          </label>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={inp.width}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePerSizeSpecChange(sz, 'width', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            وزن پالت (kg):
                          </label>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={inp.tareWeight}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePerSizeSpecChange(sz, 'tareWeight', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            ظرفیت چیدمان:
                          </label>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={inp.radiatorsPerPallet}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePerSizeSpecChange(sz, 'radiatorsPerPallet', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                            قیمت پالت (تومان):
                          </label>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={inp.unitPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePerSizeSpecChange(sz, 'unitPrice', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeMode === 'basket' ? (
            <div className="space-y-6 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
                <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-100 font-black text-sm">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <span>طراح و سازنده سبد پالت‌ها (Pallet Builder)</span>
                </div>
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-semibold bg-indigo-100 dark:bg-indigo-900/60 px-3 py-1 rounded-lg">
                  هر پالت می‌تواند ابعاد (طول×عرض) و ترکیب رادیاتورهای مجزا داشته باشد
                </span>
              </div>

              {/* Form to Build / Edit a Pallet */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingPalletId ? 'ویرایش پالت انتخابی' : 'تعریف و افزودن پالت جدید به سبد:'}
                  </span>
                  {editingPalletId && (
                    <button
                      type="button"
                      onClick={() => setEditingPalletId(null)}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      نام / شناسه پالت:
                    </label>
                    <input
                      type="text"
                      value={newItemForm.name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      طول پالت (cm):
                    </label>
                    <input
                      type="number"
                      value={newItemForm.length}
                      onChange={(e) => setNewItemForm({ ...newItemForm, length: e.target.value })}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      عرض پالت (cm):
                    </label>
                    <input
                      type="number"
                      value={newItemForm.width}
                      onChange={(e) => setNewItemForm({ ...newItemForm, width: e.target.value })}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      وزن پالت خالی (kg):
                    </label>
                    <input
                      type="number"
                      value={newItemForm.tareWeight}
                      onChange={(e) => setNewItemForm({ ...newItemForm, tareWeight: e.target.value })}
                      placeholder="25"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Radiator selection for THIS pallet */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 block mb-2">
                    انتخاب تعداد و سایز رادیاتورهای قرارگیری روی این پالت:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {RADIATOR_SIZES.map((sz) => (
                      <div key={sz} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          {toPersianDigits(sz)} cm
                        </span>
                        <input
                          type="number"
                          value={newItemForm.radiatorCounts[sz] || '0'}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            setNewItemForm({
                              ...newItemForm,
                              radiatorCounts: { ...newItemForm.radiatorCounts, [sz]: e.target.value }
                            })
                          }
                          className="w-full px-1 py-1 text-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddOrUpdateBasketPallet}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingPalletId ? 'بروزرسانی تغییرات این پالت' : 'افزودن این پالت به سبد محصولات'}</span>
                </button>
              </div>

              {/* Basket Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    لیست پالت‌های افزوده‌شده به سبد ({toPersianDigits(basket.length)} پالت):
                  </span>
                  {basket.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSyncBasketToMainCounts}
                      className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-300 hover:bg-indigo-200 transition flex items-center gap-1"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      همگام‌سازی تعداد رادیاتورهای سبد با لیست سفارش کالا
                    </button>
                  )}
                </div>

                {basket.length === 0 ? (
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    هنوز هیچ پالتی به سبد اضافه نشده است. ابعاد و رادیاتورهای پالت اول را در فرم بالا وارد کرده و دکمه افزودن را بزنید.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {basket.map((p, idx) => {
                      const radParts: string[] = [];
                      let totalPCount = 0;
                      Object.entries(p.radiatorCounts).forEach(([sz, cnt]) => {
                        const c = Number(cnt);
                        if (c > 0) {
                          radParts.push(`${toPersianDigits(c)} عدد ${toPersianDigits(sz)}cm`);
                          totalPCount += c;
                        }
                      });

                      return (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-2 relative"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                            <div>
                              <span className="font-black text-xs text-indigo-950 dark:text-indigo-200 block">
                                {toPersianDigits(idx + 1)}. {p.name || `پالت شماره ${idx + 1}`}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ابعاد: {toPersianDigits(p.length)}×{toPersianDigits(p.width)}cm | وزن خالی: {toPersianDigits(p.tareWeight)}kg
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="ویرایش"
                                onClick={() => handleEditPalletInBasket(p)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 rounded-lg transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="کپی پالت"
                                onClick={() => handleDuplicatePallet(p)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 rounded-lg transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="حذف"
                                onClick={() => handleDeletePalletFromBasket(p.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            <strong>محتوای پالت ({toPersianDigits(totalPCount)} عدد):</strong>
                            <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                              • {radParts.length > 0 ? radParts.join(' + ') : 'بدون رادیاتور'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Basket Overall Summary */}
              {basket.length > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-black text-emerald-950 dark:text-emerald-100 block text-sm mb-1">
                      خلاصه سبد پالت‌های تاییدشده:
                    </span>
                    <p className="text-emerald-800 dark:text-emerald-300 font-semibold">
                      • {toPersianDigits(basket.length)} عدد پالت با ابعاد اختصاصی | مجموع {toPersianDigits(totalBasketRads)} عدد رادیاتور | وزن پالت خالی: {toPersianDigits(totalBasketTare)} کیلوگرم
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[11px] text-slate-500 block">هزینه کل پالت‌های سبد:</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {fmtPersian(totalBasketCost)} تومان
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE 2: STANDARD UNIFORM PALLET MODE */
            <div className="space-y-6">
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
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 shadow-xs'
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

              {/* Editable Parameters Grid (Length, Width, Height, Tare Weight) */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    مشخصات ابعادی و وزن خالی هر پالت (قابل ویرایش دستی):
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    بروزرسانی زنده
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                      طول پالت (cm):
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={localInputs.length}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFieldChange('length', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                      عرض پالت (cm):
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={localInputs.width}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFieldChange('width', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                      ارتفاع کفی پالت (cm):
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={localInputs.height}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFieldChange('height', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                      <Scale className="w-3.5 h-3.5 text-amber-500" />
                      وزن پالت خالی (kg):
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={localInputs.tareWeight}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleFieldChange('tareWeight', e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-xl text-xs font-black font-mono text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Radiator Loading Configuration on Each Pallet */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-100">
                      تعیین تعداد و ترکیب سایز رادیاتورهای چیده شده روی هر پالت
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => propagateStandardChange(localInputs, customSizes, 'auto')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        config.sizeDistributionMode !== 'custom'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      خودکار (تناسب کلی)
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => propagateStandardChange(localInputs, customSizes, 'custom')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        config.sizeDistributionMode === 'custom'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      تعیین دستی سایزها
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        تعداد کل رادیاتور در ۱ پالت:
                      </label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={localInputs.radiatorsPerPallet}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleFieldChange('radiatorsPerPallet', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        قیمت هر پالت (تومان):
                      </label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={localInputs.unitPrice}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                        تعداد دستی پالت‌ها (۰ = محاسباتی):
                      </label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={localInputs.customPalletCount}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleFieldChange('customPalletCount', e.target.value)}
                        placeholder={`خودکار (${toPersianDigits(activePalletCount)} عدد)`}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block mb-2.5">
                      تفکیک سایزهای چیده‌شده روی «یک» پالت:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {RADIATOR_SIZES.map((size) => (
                        <div key={size} className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            {toPersianDigits(size)} cm
                          </span>
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={customSizes[size] || '0'}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleSizeCountChange(size, e.target.value)}
                            className="w-full px-1.5 py-1 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">عدد در پالت</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-black text-emerald-950 dark:text-emerald-100 block text-sm">
                      خلاصه محاسبه وزنی و پالت‌بندی (افزوده‌شده به بار کل)
                    </span>
                    <div className="text-emerald-800 dark:text-emerald-300 space-y-0.5 leading-relaxed">
                      <p>
                        • تعداد کل پالت مورد نیاز: <strong className="text-emerald-900 dark:text-emerald-100">{toPersianDigits(activePalletCount)} عدد</strong>
                      </p>
                      <p>
                        • وزن خالی پالت‌ها: <strong className="text-amber-800 dark:text-amber-300 font-bold">{toPersianDigits(totalPalletTareWeight)} کیلوگرم</strong> ({toPersianDigits(activePalletCount)} عدد × {toPersianDigits(currentTareWeight)} kg)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700/60 text-right md:text-left shrink-0 shadow-xs">
                  <span className="text-[11px] text-slate-500 block">جمع قیمت کل پالت‌ها:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {fmtPersian(totalPalletCost)} تومان
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PalletConfigCard.displayName = 'PalletConfigCard';
