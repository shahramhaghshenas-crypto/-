import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RadiatorCounts,
  CustomWeights,
  TruckDetails,
  DestinationInfo,
  LayoutRules,
  ShippingCostInfo,
  GPSInfo,
  PluginModule,
  FeatureAccess,
  UserRole,
  UserProfileKey,
  AppMode,
  EvaluationResult,
  FeatureKey,
  SavedLoadingRecord,
  PalletConfig,
  VehiclePreset,
  DashboardTab,
  DriverRecord,
  CustomVehicleRecord,
  LayoutScenario,
  AuditLogEntry
} from './types';
import {
  VEHICLE_PRESETS,
  PROFILE_FEATURES,
  INITIAL_FEATURE_ACCESS,
  INITIAL_PLUGINS,
  DEFAULT_PALLET_CONFIG
} from './data/presets';
import { buildRadiatorData, evaluateTruck, getVehicleRecommendations } from './utils/calculation';
import { clamp, toPersianDigits } from './utils/persianDigits';

import { Header } from './components/Header';
import { DashboardNavBar } from './components/DashboardNavBar';
import { DashboardHome } from './components/DashboardHome';
import { IndustrialControlSuite } from './components/IndustrialControlSuite';
import { DriverRegistrationCard } from './components/DriverRegistrationCard';
import { VehicleRegistrationCard } from './components/VehicleRegistrationCard';
import { FactoryReportsCard } from './components/FactoryReportsCard';
import { FactorySettingsCard } from './components/FactorySettingsCard';

import { WizardCard } from './components/WizardCard';
import { VehicleCard } from './components/VehicleCard';
import { VehicleRecommendationCard } from './components/VehicleRecommendationCard';
import { QuantitiesCard } from './components/QuantitiesCard';
import { RadiatorItemsTable } from './components/RadiatorItemsTable';
import { PalletConfigCard } from './components/PalletConfigCard';
import { OrderPresetsImporter } from './components/OrderPresetsImporter';
import { DestinationCard } from './components/DestinationCard';
import { MultiStopCard } from './components/MultiStopCard';
import { LayoutRulesCard } from './components/LayoutRulesCard';
import { ShippingCostCard } from './components/ShippingCostCard';
import { Layout3DView } from './components/Layout3DView';
import { GpsMapCard } from './components/GpsMapCard';
import { PhotosSignatureCard } from './components/PhotosSignatureCard';
import { PluginsCard } from './components/PluginsCard';
import { FeatureMatrixCard } from './components/FeatureMatrixCard';
import { CalculationResultView } from './components/CalculationResultView';
import { SmartTruckLoadingPlanner } from './components/SmartTruckLoadingPlanner';
import { HistoryModal } from './components/HistoryModal';
import { QrScannerModal } from './components/QrScannerModal';
import { AndroidAppFrame } from './components/AndroidAppFrame';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { AboutModal } from './components/AboutModal';
import { Validator } from './utils/validator';

export default function App() {
  // Profiles & Modes & Navigation Tabs
  const [currentProfile, setCurrentProfile] = useState<UserProfileKey>('manager');
  const [mode, setMode] = useState<AppMode>('pro');
  const [isAndroidView, setIsAndroidView] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

  // Driver Database State
  const [drivers, setDrivers] = useState<DriverRecord[]>([
    {
      id: 'drv-1',
      firstName: 'علی',
      lastName: 'محمدی',
      phone: '09123456789',
      licenseNo: '9823415678',
      plate: '78 ع 456 ایران 22',
      transportCompany: 'همسفر ترابر آریا',
      createdAt: new Date().toISOString()
    },
    {
      id: 'drv-2',
      firstName: 'حسین',
      lastName: 'رضایی',
      phone: '09351112233',
      licenseNo: '8876543210',
      plate: '12 ب 890 ایران 33',
      transportCompany: 'باربری کارخانه رادیاتور',
      createdAt: new Date().toISOString()
    }
  ]);

  // Custom Vehicles Database State
  const [customVehicles, setCustomVehicles] = useState<CustomVehicleRecord[]>([]);

  const handleAddDriver = (newDrv: Omit<DriverRecord, 'id' | 'createdAt'>) => {
    const item: DriverRecord = {
      ...newDrv,
      id: 'drv-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setDrivers(prev => [item, ...prev]);
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const handleSelectDriverForCurrentLoad = (drv: DriverRecord) => {
    setTruckDetails(prev => ({
      ...prev,
      driverName: `${drv.firstName} ${drv.lastName}`,
      driverPhone: drv.phone,
      plate: drv.plate || prev.plate
    }));
  };

  const handleAddCustomVehicle = (v: Omit<CustomVehicleRecord, 'id' | 'createdAt'>) => {
    const item: CustomVehicleRecord = {
      ...v,
      id: 'veh-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setCustomVehicles(prev => [item, ...prev]);
  };

  const handleDeleteCustomVehicle = (id: string) => {
    setCustomVehicles(prev => prev.filter(v => v.id !== id));
  };

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Radiator counts and custom weights
  const [counts, setCounts] = useState<RadiatorCounts>({
    60: 0,
    80: 0,
    100: 0,
    120: 0,
    140: 0,
    160: 0,
    180: 0
  });
  const [customWeights, setCustomWeights] = useState<CustomWeights>({});

  // Pallet Configuration State
  const [palletConfig, setPalletConfig] = useState<PalletConfig>(DEFAULT_PALLET_CONFIG);

  // Vehicle
  const [selectedTruckIndex, setSelectedTruckIndex] = useState<number>(0);
  const [truckDetails, setTruckDetails] = useState<TruckDetails>({
    id: VEHICLE_PRESETS[0].id,
    model: VEHICLE_PRESETS[0].name,
    L: VEHICLE_PRESETS[0].L,
    W: VEHICLE_PRESETS[0].W,
    H: VEHICLE_PRESETS[0].H,
    cap: VEHICLE_PRESETS[0].cap,
    plate: '',
    driverName: '',
    driverPhone: '',
    waybillNo: ''
  });

  // Destination & Timing
  const [destinationInfo, setDestinationInfo] = useState<DestinationInfo>({
    destination: '',
    loadDate: '',
    loadTime: '',
    unloadTime: '',
    notes: '',
    loadOrder: '',
    unloadOrder: '',
    stops: []
  });

  // Layout Rules
  const [rules, setRules] = useState<LayoutRules>({
    maxH: 150,
    manualLayers: 10,
    rowW: 11,
    layerH: 11,
    overloadMargin: 0,
    axleLimit: 4500,
    confirmLoading: false,
    autoVehicle: true,
    show2D: false,
    show3D: true,
    lifoPriority: true
  });

  // Shipping Cost State
  const [shippingCostInfo, setShippingCostInfo] = useState<ShippingCostInfo>({
    distanceKm: 100,
    ratePerKm: 30000,
    fixedCost: 0,
    insuranceCost: 150000,
    driverAllowance: 200000,
    customFreightCost: 3000000,
    isManualFreight: false,
    palletTotalCost: 0,
    totalCost: 3350000
  });

  // GPS & Map
  const [gpsInfo, setGpsInfo] = useState<GPSInfo>({
    lat: '',
    lng: '',
    cgInfo: '',
    axleBalanceScore: 95,
    longitudinalCG: '52% جلو / 48% عقب',
    lateralCG: '50% چپ / 50% راست (متوازن)'
  });

  // Plugins & Feature Permissions
  const [plugins, setPlugins] = useState<PluginModule[]>(INITIAL_PLUGINS);
  const [accessMatrix, setAccessMatrix] = useState<Record<UserRole, Record<FeatureKey, FeatureAccess>>>(INITIAL_FEATURE_ACCESS);

  // Photos & Signatures
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  // Calculation Result state
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Advanced Industrial Controls State (فاز پیشرفته صنعتی)
  const [isOrderLocked, setIsOrderLocked] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(new Date().toLocaleTimeString('fa-IR'));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [scenarios, setScenarios] = useState<LayoutScenario[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      operator: 'شهرام (مدیر)',
      action: 'راه‌اندازی سیستم چیدمان',
      details: 'سامانه صنعتی چیدمان بار رادیاتور با موفقیت آماده به کار گردید.',
      type: 'info'
    }
  ]);

  // Undo / Redo State Stack
  type HistoryState = {
    counts: RadiatorCounts;
    truckDetails: TruckDetails;
    rules: LayoutRules;
  };
  const [pastStates, setPastStates] = useState<HistoryState[]>([]);
  const [futureStates, setFutureStates] = useState<HistoryState[]>([]);

  const addAuditLog = useCallback((action: string, details: string, type: AuditLogEntry['type'] = 'info') => {
    const newLog: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      operator: currentProfile === 'manager' ? 'شهرام (مدیر)' : 'اپراتور شیفت',
      action,
      details,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentProfile]);

  // Helper to push history snapshot before state update
  const pushHistorySnapshot = useCallback(() => {
    setPastStates(prev => [...prev.slice(-20), {
      counts: { ...counts },
      truckDetails: { ...truckDetails },
      rules: { ...rules }
    }]);
    setFutureStates([]);
  }, [counts, truckDetails, rules]);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (pastStates.length === 0 || isOrderLocked) return;
    const previous = pastStates[pastStates.length - 1];
    const newPast = pastStates.slice(0, pastStates.length - 1);

    setFutureStates(prev => [{ counts: { ...counts }, truckDetails: { ...truckDetails }, rules: { ...rules } }, ...prev]);
    setPastStates(newPast);

    setCounts(previous.counts);
    setTruckDetails(previous.truckDetails);
    setRules(previous.rules);
    addAuditLog('بازگشت تغییرات (Undo)', 'آخرین تغییر انجام‌شده لغو گردید.', 'edit');
    addToast('info', '🔵 آخرین تغییر بازگردانی گردید (Undo)');
  }, [pastStates, counts, truckDetails, rules, isOrderLocked, addAuditLog, addToast]);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (futureStates.length === 0 || isOrderLocked) return;
    const next = futureStates[0];
    const newFuture = futureStates.slice(1);

    setPastStates(prev => [...prev, { counts: { ...counts }, truckDetails: { ...truckDetails }, rules: { ...rules } }]);
    setFutureStates(newFuture);

    setCounts(next.counts);
    setTruckDetails(next.truckDetails);
    setRules(next.rules);
    addAuditLog('تکرار تغییرات (Redo)', 'تغییر لغوشده مجدداً اعمال گردید.', 'edit');
    addToast('info', '🔵 تغییر مجدداً تکرار گردید (Redo)');
  }, [futureStates, counts, truckDetails, rules, isOrderLocked, addAuditLog, addToast]);

  // Save Scenario
  const handleSaveCurrentScenario = useCallback((name: string) => {
    const data = buildRadiatorData(counts, destinationInfo.stops, customWeights);
    const safeMaxH = clamp(rules.maxH, 11, 350);
    const manualTruck = {
      id: truckDetails.id || VEHICLE_PRESETS[selectedTruckIndex].id,
      name: truckDetails.model || VEHICLE_PRESETS[selectedTruckIndex].name,
      L: truckDetails.L,
      W: truckDetails.W,
      H: truckDetails.H || VEHICLE_PRESETS[selectedTruckIndex].H,
      cap: truckDetails.cap
    };
    const ev = evaluateTruck(manualTruck, data, safeMaxH, rules.rowW, rules.layerH, rules.axleLimit, rules.overloadMargin, palletConfig, rules.manualLayers);

    const newScenario: LayoutScenario = {
      id: 'sc-' + Date.now(),
      name,
      createdAt: new Date().toLocaleTimeString('fa-IR'),
      counts: { ...counts },
      truckDetails: { ...truckDetails },
      rules: { ...rules },
      result: ev,
      fill: ev.fill || 0,
      balance: ev.axleBalanceScore || 90,
      weight: data.totalWeight,
      totalPieces: data.totalPieces
    };

    setScenarios(prev => [newScenario, ...prev]);
    addAuditLog('ثبت سناریو', `سناریوی "${name}" برای کامیون ${truckDetails.model} ذخیره شد.`, 'scenario');
    addToast('success', `🟢 سناریوی "${name}" با موفقیت ثبت شد.`);
  }, [counts, destinationInfo.stops, customWeights, rules, truckDetails, selectedTruckIndex, palletConfig, addAuditLog, addToast]);

  const handleDeleteScenario = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    addAuditLog('حذف سناریو', 'یکی از سناریوهای چیدمان حذف گردید.', 'warning');
    addToast('warning', '🟡 سناریو از لیست حذف شد.');
  }, [addAuditLog, addToast]);

  const handleApplyScenario = useCallback((sc: LayoutScenario) => {
    if (isOrderLocked) return;
    pushHistorySnapshot();
    setCounts(sc.counts);
    setTruckDetails(sc.truckDetails);
    setRules(sc.rules);
    addAuditLog('اعمال سناریو', `سناریوی "${sc.name}" بارگذاری شد.`, 'edit');
    addToast('success', `🟢 سناریوی "${sc.name}" بر روی سفارش فعلی اعمال گردید.`);
  }, [isOrderLocked, pushHistorySnapshot, addAuditLog, addToast]);

  const handleToggleOrderLock = useCallback(() => {
    const nextLock = !isOrderLocked;
    setIsOrderLocked(nextLock);
    addAuditLog(
      nextLock ? 'قفل سفارش' : 'بازکردن قفل سفارش',
      nextLock ? 'ویرایش مقادیر جهت بارگیری نهایی قفل شد.' : 'قفل سفارش جهت ویرایش باز گردید.',
      'lock'
    );
    addToast(
      nextLock ? 'warning' : 'info',
      nextLock ? '🔒 سفارش جهت بارگیری قفل شد. تغییرات مسدود است.' : '🔓 قفل سفارش باز شد. ویرایش امکان‌پذیر است.'
    );
  }, [isOrderLocked, addAuditLog, addToast]);

  // Auto Save status updater trigger on state changes
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSavedTime(new Date().toLocaleTimeString('fa-IR'));
    }, 350);
    return () => clearTimeout(timer);
  }, [counts, truckDetails, rules, destinationInfo]);

  // Active feature access checker based on profile
  const getFeatureAccess = (key: FeatureKey): FeatureAccess => {
    const profileAllowed = PROFILE_FEATURES[currentProfile];
    if (!profileAllowed.includes(key)) return 'disabled';
    return accessMatrix.manager[key] || 'active';
  };

  // Run Layout Calculation Algorithm
  const handleRunCalculation = useCallback(() => {
    try {
      const data = buildRadiatorData(counts, destinationInfo.stops, customWeights);
      if (data.totalPieces === 0) {
        setResult(null);
        return;
      }

      const safeMaxH = clamp(rules.maxH, 11, 350);

      if (rules.autoVehicle) {
        const rec = getVehicleRecommendations(
          data,
          safeMaxH,
          rules.rowW,
          rules.layerH,
          rules.axleLimit,
          rules.overloadMargin,
          palletConfig,
          rules.manualLayers
        );

        if (rec.bestResult) {
          setResult(rec.bestResult);
          if (selectedTruckIndex !== rec.bestPresetIndex) {
            setSelectedTruckIndex(rec.bestPresetIndex);
          }
          const targetId = rec.bestResult.truck.id;
          const targetModel = rec.bestResult.truck.name;
          const targetL = rec.bestResult.truck.L;
          const targetW = rec.bestResult.truck.W;
          const targetH = rec.bestResult.truck.H;
          const targetCap = rec.bestResult.truck.cap;

          setTruckDetails((prev) => {
            if (
              prev.id === targetId &&
              prev.model === targetModel &&
              prev.L === targetL &&
              prev.W === targetW &&
              prev.H === targetH &&
              prev.cap === targetCap
            ) {
              return prev;
            }
            return {
              ...prev,
              id: targetId,
              model: targetModel,
              L: targetL,
              W: targetW,
              H: targetH,
              cap: targetCap
            };
          });
          return;
        }
      }

      const presetName = (selectedTruckIndex >= 0 && VEHICLE_PRESETS[selectedTruckIndex])
        ? VEHICLE_PRESETS[selectedTruckIndex].name
        : 'خودروی سفارشی';

      const presetId = (selectedTruckIndex >= 0 && VEHICLE_PRESETS[selectedTruckIndex])
        ? VEHICLE_PRESETS[selectedTruckIndex].id
        : 'custom';

      const presetH = (selectedTruckIndex >= 0 && VEHICLE_PRESETS[selectedTruckIndex])
        ? VEHICLE_PRESETS[selectedTruckIndex].H
        : 200;

      const manualTruck = {
        id: truckDetails.id || presetId,
        name: truckDetails.model || presetName,
        L: truckDetails.L || 600,
        W: truckDetails.W || 220,
        H: truckDetails.H || presetH,
        cap: truckDetails.cap || 6000
      };

      const ev = evaluateTruck(manualTruck, data, safeMaxH, rules.rowW, rules.layerH, rules.axleLimit, rules.overloadMargin, palletConfig, rules.manualLayers);
      setResult(ev);
    } catch (err) {
      console.error('Error running calculation:', err);
    }
  }, [
    counts,
    destinationInfo.stops,
    customWeights,
    rules,
    palletConfig,
    selectedTruckIndex,
    truckDetails
  ]);

  const handleSelectVehiclePreset = useCallback((index: number, preset: VehiclePreset) => {
    setSelectedTruckIndex(index);
    setTruckDetails((prev) => ({
      ...prev,
      id: preset.id,
      model: preset.name,
      L: preset.L,
      W: preset.W,
      H: preset.H,
      cap: preset.cap
    }));
  }, []);

  const bestVehicleInfo = useMemo(() => {
    const data = buildRadiatorData(counts, destinationInfo.stops, customWeights);
    if (data.totalPieces === 0) return null;
    const safeMaxH = clamp(rules.maxH, 11, 350);
    const rec = getVehicleRecommendations(
      data,
      safeMaxH,
      rules.rowW,
      rules.layerH,
      rules.axleLimit,
      rules.overloadMargin,
      palletConfig,
      rules.manualLayers
    );
    if (!rec.bestResult) return null;
    return {
      name: rec.bestResult.truck.name,
      fill: rec.bestResult.fill,
      index: rec.bestPresetIndex,
      preset: rec.bestResult.truck
    };
  }, [counts, destinationInfo.stops, customWeights, rules, palletConfig]);

  const handleSelectBestVehicle = useCallback(() => {
    const data = buildRadiatorData(counts, destinationInfo.stops, customWeights);
    if (data.totalPieces === 0) {
      addToast('warning', 'لطفاً ابتدا تعداد رادیاتورها را وارد فرمایید.');
      return;
    }
    const safeMaxH = clamp(rules.maxH, 11, 350);
    const rec = getVehicleRecommendations(
      data,
      safeMaxH,
      rules.rowW,
      rules.layerH,
      rules.axleLimit,
      rules.overloadMargin,
      palletConfig,
      rules.manualLayers
    );

    if (rec.bestResult) {
      handleSelectVehiclePreset(rec.bestPresetIndex, rec.bestResult.truck);
      addToast(
        'success',
        `🟢 خودروی «${rec.bestResult.truck.name}» با بیشترین ظرفیت پر شوندگی (${toPersianDigits(Math.round(rec.bestResult.fill))}٪) انتخاب گردید.`
      );
    } else {
      addToast('warning', 'با مقادیر فعلی بار، خودروی متناسب یافت نشد.');
    }
  }, [counts, destinationInfo.stops, customWeights, rules, palletConfig, handleSelectVehiclePreset, addToast]);

  // Stable state updater callbacks to prevent unnecessary child re-renders
  const handleCountsChange = useCallback((newCounts: RadiatorCounts) => {
    setCounts(newCounts);
  }, []);

  const handlePalletConfigChange = useCallback((newConfig: PalletConfig) => {
    setPalletConfig(newConfig);
  }, []);

  const handleCustomWeightsChange = useCallback((newWeights: CustomWeights) => {
    setCustomWeights(newWeights);
  }, []);

  // Load record from History
  const handleLoadRecordFromHistory = (rec: SavedLoadingRecord) => {
    setCounts(rec.counts);
    if (rec.truckDetails) setTruckDetails(rec.truckDetails);
    if (rec.destinationInfo) setDestinationInfo(rec.destinationInfo);
    handleRunCalculation();
  };

  // Recalculate automatically on count, customWeights, destination or layout change (debounced for smooth typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = buildRadiatorData(counts, destinationInfo.stops, customWeights);
      if (data.totalPieces > 0) {
        handleRunCalculation();
      } else {
        setResult(null);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    counts,
    customWeights,
    selectedTruckIndex,
    truckDetails.L,
    truckDetails.W,
    truckDetails.cap,
    rules.maxH,
    rules.rowW,
    rules.layerH,
    rules.manualLayers,
    rules.overloadMargin,
    rules.axleLimit,
    rules.allowOverhang,
    rules.autoVehicle,
    destinationInfo.stops,
    palletConfig.usePallets,
    palletConfig.material,
    palletConfig.length,
    palletConfig.width,
    palletConfig.height,
    palletConfig.tareWeight,
    palletConfig.unitPrice,
    palletConfig.radiatorsPerPallet,
    palletConfig.customPalletCount,
    handleRunCalculation
  ]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const profileLabelMap: Record<UserProfileKey, string> = {
      simple: 'ساده',
      warehouse: 'انبار',
      logistics: 'لجستیک',
      manager: 'مدیر'
    };

    const rows = [
      ['فیلد', 'مقدار'],
      ['پروفایل فعال', profileLabelMap[currentProfile]],
      ['حالت برنامه', mode === 'pro' ? 'حرفه‌ای' : 'Wizard'],
      ['نام راننده', truckDetails.driverName || '-'],
      ['شماره تماس راننده', truckDetails.driverPhone || '-'],
      ['پلاک خودرو', truckDetails.plate || '-'],
      ['مدل خودرو', truckDetails.model || '-'],
      ['حالت پالت‌بندی', palletConfig.usePallets ? 'فعال (' + palletConfig.material + ')' : 'غیره / فله'],
      ['قیمت کل پالت‌ها', result?.palletTotalCost ? result.palletTotalCost + ' تومان' : '-'],
      ['تعداد پالت‌ها', result?.totalPalletsNeeded ? String(result.totalPalletsNeeded) : '-'],
      ['مقصد اصلی', destinationInfo.destination || '-'],
      ['تعداد مقاصد تفکیکی (LIFO)', String(destinationInfo.stops?.length || 0)],
      ['تاریخ بارگیری', destinationInfo.loadDate || '-'],
      ['ساعت بارگیری', destinationInfo.loadTime || '-'],
      ['زمان تخمینی تخلیه', destinationInfo.unloadTime || '-'],
      ['ارتفاع مجاز (cm)', String(rules.maxH)],
      ['هزینه حمل (تومان)', String(shippingCostInfo.totalCost)],
      ['تأییدیه بارگیری', rules.confirmLoading ? 'تأیید شده' : 'در انتظار تأیید']
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `گزارش_بارگیری_رادیاتور_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTogglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleAccessChange = (role: UserRole, key: FeatureKey, val: FeatureAccess) => {
    setAccessMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: val
      }
    }));
  };

  const currentData = buildRadiatorData(counts, destinationInfo.stops, customWeights);
  const profileLabelMap: Record<UserProfileKey, string> = {
    simple: 'پروفایل ساده',
    warehouse: 'پروفایل انباردار',
    logistics: 'پروفایل لجستیک',
    manager: 'پروفایل مدیر'
  };

  const activePalletCost = result?.palletTotalCost || 0;
  const activePalletCount = result?.totalPalletsNeeded || 0;

  return (
    <AndroidAppFrame isAndroidView={isAndroidView} onToggleAndroidView={setIsAndroidView}>
      <div className="max-w-[1350px] mx-auto px-4 py-6 font-['Vazirmatn',sans-serif] bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100">
        {/* App Header */}
        <Header
          currentProfile={currentProfile}
          onProfileChange={setCurrentProfile}
          mode={mode}
          onModeChange={setMode}
          onPrint={handlePrint}
          onExportCSV={handleExportCSV}
          onRunCalc={handleRunCalculation}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          isAndroidView={isAndroidView}
          onToggleAndroidView={setIsAndroidView}
        />

        {/* Phase 3 Bosch & Siemens Industrial Dashboard Navigation Bar */}
        <DashboardNavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Industrial Control Suite (Undo/Redo, Auto-save, Order Lock, Scenarios, Audit Log) */}
        <IndustrialControlSuite
          canUndo={pastStates.length > 0}
          canRedo={futureStates.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          lastSavedTime={lastSavedTime}
          isSaving={isSaving}
          isOrderLocked={isOrderLocked}
          onToggleOrderLock={handleToggleOrderLock}
          scenarios={scenarios}
          onSaveCurrentScenario={handleSaveCurrentScenario}
          onDeleteScenario={handleDeleteScenario}
          onApplyScenario={handleApplyScenario}
          auditLogs={auditLogs}
          operatorName={profileLabelMap[currentProfile]}
          counts={counts}
          truckDetails={truckDetails}
          rules={rules}
          result={result}
          totalPieces={currentData.totalPieces}
          totalWeight={currentData.totalWeight}
        />


        {/* Mode Wizard or Pro Mode Content */}
        {mode === 'wizard' ? (
          <div className="space-y-6">
            <WizardCard
              counts={counts}
              onCountsChange={handleCountsChange}
              customWeights={customWeights}
              onCustomWeightsChange={handleCustomWeightsChange}
              palletConfig={palletConfig}
              onPalletConfigChange={handlePalletConfigChange}
              truckDetails={truckDetails}
              onTruckDetailsChange={setTruckDetails}
              selectedTruckIndex={selectedTruckIndex}
              onTruckSelect={setSelectedTruckIndex}
              destinationInfo={destinationInfo}
              onDestinationInfoChange={setDestinationInfo}
              rules={rules}
              onRulesChange={setRules}
              shippingCostInfo={shippingCostInfo}
              onShippingCostInfoChange={setShippingCostInfo}
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              signatureUrl={signatureUrl}
              onSignatureChange={setSignatureUrl}
              getFeatureAccess={getFeatureAccess}
              onFinishWizard={() => {
                handleRunCalculation();
                setActiveTab('layout');
              }}
              onSelectBestVehicle={handleSelectBestVehicle}
              bestVehicleName={bestVehicleInfo?.name}
              bestVehicleFill={bestVehicleInfo?.fill}
            />

            <CalculationResultView
              result={result}
              data={currentData}
              truckDetails={truckDetails}
              destinationInfo={destinationInfo}
              rules={rules}
              shippingCost={shippingCostInfo.totalCost}
              profileName={profileLabelMap[currentProfile]}
              appModeName="Wizard"
              photoUrl={photoUrl}
              signatureUrl={signatureUrl}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* TAB 1: DASHBOARD HOME */}
            {activeTab === 'dashboard' && (
              <DashboardHome
                onNavigateTab={setActiveTab}
                driversCount={drivers.length}
                activeDriverName={truckDetails.driverName}
                truckDetails={truckDetails}
                totalCargoPieces={currentData.totalPieces}
                result={result}
                onOpenScanner={() => setIsScannerOpen(true)}
                onRunCalc={handleRunCalculation}
              />
            )}

            {/* TAB 2: DRIVER REGISTRATION (فاز ۲: ثبت راننده) */}
            {activeTab === 'drivers' && (
              <DriverRegistrationCard
                drivers={drivers}
                onAddDriver={handleAddDriver}
                onDeleteDriver={handleDeleteDriver}
                onSelectDriverForCurrentLoad={handleSelectDriverForCurrentLoad}
                currentTruckDetails={truckDetails}
                onUpdateTruckDetails={setTruckDetails}
              />
            )}

            {/* TAB 3: VEHICLE REGISTRATION (فاز ۲: ثبت خودرو) */}
            {activeTab === 'vehicles' && (
              <>
                <VehicleRegistrationCard
                  customVehicles={customVehicles}
                  onAddVehicle={handleAddCustomVehicle}
                  onDeleteVehicle={handleDeleteCustomVehicle}
                  onSelectVehicleForCurrentLoad={(v) => {
                    setTruckDetails({
                      ...truckDetails,
                      model: v.model,
                      cap: v.cap,
                      L: v.L,
                      W: v.W,
                      plate: v.plate || truckDetails.plate
                    });
                  }}
                  currentTruckDetails={truckDetails}
                  onUpdateTruckDetails={setTruckDetails}
                />

                <VehicleCard
                  details={truckDetails}
                  onChange={setTruckDetails}
                  selectedIndex={selectedTruckIndex}
                  onSelectPreset={setSelectedTruckIndex}
                  access={getFeatureAccess('manual_vehicle')}
                  onManualCustomized={() => setRules((r) => ({ ...r, autoVehicle: false }))}
                  autoVehicleActive={rules.autoVehicle}
                  onSelectBestVehicle={handleSelectBestVehicle}
                  bestVehicleName={bestVehicleInfo?.name}
                  bestVehicleFill={bestVehicleInfo?.fill}
                />

                <VehicleRecommendationCard
                  counts={counts}
                  customWeights={customWeights}
                  rules={rules}
                  palletConfig={palletConfig}
                  selectedTruckIndex={selectedTruckIndex}
                  onSelectVehiclePreset={handleSelectVehiclePreset}
                  access={getFeatureAccess('manual_vehicle')}
                />
              </>
            )}

            {/* TAB 4: CARGO REGISTRATION (فاز ۳: ثبت بار و مقادیر) */}
            {activeTab === 'cargo' && (
              <>
                <OrderPresetsImporter onApplyCounts={setCounts} />

                <QuantitiesCard
                  counts={counts}
                  onChange={handleCountsChange}
                  customWeights={customWeights}
                  onCustomWeightsChange={handleCustomWeightsChange}
                  access={getFeatureAccess('loading_items')}
                  manualLayers={rules.manualLayers}
                  onManualLayersChange={(layers) => setRules((prev) => ({ ...prev, manualLayers: layers }))}
                />

                <RadiatorItemsTable
                  counts={counts}
                  onChangeCounts={handleCountsChange}
                  truckDetails={truckDetails}
                  onTruckChange={setTruckDetails}
                  result={result}
                  onRunCalculation={handleRunCalculation}
                  onOpen3DViewer={() => setActiveTab('layout')}
                  onExportPdf={handlePrint}
                  onExportExcel={handleExportCSV}
                  manualLayers={rules.manualLayers}
                  onManualLayersChange={(layers) => setRules((prev) => ({ ...prev, manualLayers: layers }))}
                  onSaveOrder={() => {
                    addAuditLog('ذخیره سفارش', 'اطلاعات سفارش و جدول رادیاتورها با موفقیت ذخیره گردید.', 'info');
                    addToast('success', '🟢 سفارش و لیست رادیاتورها با موفقیت ذخیره گردید.');
                  }}
                />

                <PalletConfigCard
                  config={palletConfig}
                  onChange={handlePalletConfigChange}
                  totalRadiators={currentData.totalPieces}
                  radiatorCounts={counts}
                  access={getFeatureAccess('pallets')}
                  onSyncCounts={(newCounts) => setCounts(newCounts)}
                />

                <DestinationCard
                  info={destinationInfo}
                  onChange={setDestinationInfo}
                  access={getFeatureAccess('destination')}
                />

                <MultiStopCard
                  destinationInfo={destinationInfo}
                  onChange={setDestinationInfo}
                  lifoEnabled={rules.lifoPriority}
                  onToggleLifo={(val) => setRules({ ...rules, lifoPriority: val })}
                />
              </>
            )}

            {/* TAB 5: SMART LOADING & 3D LAYOUT (فاز ۴، ۵، ۶: چیدمان هوشمند و ۳بعدی) */}
            {activeTab === 'layout' && (
              <>
                <SmartTruckLoadingPlanner
                  currentCounts={counts}
                  currentTruckDetails={truckDetails}
                  onUpdateTruckDetails={setTruckDetails}
                  evalResult={result}
                  onApplyCountsToOrder={(newCounts) => setCounts(newCounts)}
                  addToast={addToast}
                />

                <LayoutRulesCard
                  rules={rules}
                  onChange={setRules}
                  onRunCalc={handleRunCalculation}
                  access={getFeatureAccess('layout_rules')}
                />

                <CalculationResultView
                  result={result}
                  data={currentData}
                  truckDetails={truckDetails}
                  destinationInfo={destinationInfo}
                  rules={rules}
                  shippingCost={shippingCostInfo.totalCost}
                  profileName={profileLabelMap[currentProfile]}
                  appModeName={mode === 'pro' ? 'حرفه‌ای' : 'Wizard'}
                  photoUrl={photoUrl}
                  signatureUrl={signatureUrl}
                />

                <GpsMapCard
                  info={gpsInfo}
                  onChange={setGpsInfo}
                  destination={destinationInfo.destination}
                  truckL={truckDetails.L}
                  truckW={truckDetails.W}
                  access={getFeatureAccess('map_gps')}
                />
              </>
            )}

            {/* TAB 6: REPORTS & EXCEL/PDF (فاز ۷: خروجی PDF و Excel) */}
            {activeTab === 'reports' && (
              <>
                <FactoryReportsCard
                  result={result}
                  truckDetails={truckDetails}
                  totalPieces={currentData.totalPieces}
                  onPrint={handlePrint}
                  onExportCSV={handleExportCSV}
                />

                <ShippingCostCard
                  costInfo={shippingCostInfo}
                  palletTotalCost={activePalletCost}
                  usePallets={palletConfig.usePallets}
                  palletCount={activePalletCount}
                  onChange={setShippingCostInfo}
                  access={getFeatureAccess('cost')}
                />

                <PhotosSignatureCard
                  access={getFeatureAccess('photos_sign')}
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  signatureUrl={signatureUrl}
                  onSignatureChange={setSignatureUrl}
                />
              </>
            )}

            {/* TAB 7: SETTINGS & FACTORY ERP (فاز ۸، ۹، ۱۰: نسخه کارخانه و تنظیمات) */}
            {activeTab === 'settings' && (
              <>
                <FactorySettingsCard
                  currentProfile={currentProfile}
                  onProfileChange={setCurrentProfile}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                />

                <PluginsCard
                  plugins={plugins}
                  onTogglePlugin={handleTogglePlugin}
                  access={getFeatureAccess('plugins')}
                />

                <FeatureMatrixCard
                  accessMatrix={accessMatrix}
                  onAccessChange={handleAccessChange}
                  access={getFeatureAccess('features')}
                />
              </>
            )}
          </div>
        )}

        {/* History Archive Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          currentCounts={counts}
          currentTruck={truckDetails}
          currentDestination={destinationInfo}
          totalPieces={currentData.totalPieces}
          totalWeight={currentData.totalWeight}
          totalCost={shippingCostInfo.totalCost}
          onLoadRecord={handleLoadRecordFromHistory}
        />

        {/* QR & Barcode Scanner Simulator Modal */}
        <QrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          result={result}
          totalPieces={currentData.totalPieces}
        />

        {/* About Radiator-AI & Industrial Roadmap Modal */}
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />

        {/* Live Industrial Toast Notifications System */}
        <ToastNotification
          toasts={toasts}
          onDismiss={dismissToast}
        />
      </div>
    </AndroidAppFrame>
  );
}
