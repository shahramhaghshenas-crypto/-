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
  VehiclePreset
} from './types';
import {
  VEHICLE_PRESETS,
  PROFILE_FEATURES,
  INITIAL_FEATURE_ACCESS,
  INITIAL_PLUGINS,
  DEFAULT_PALLET_CONFIG
} from './data/presets';
import { buildRadiatorData, evaluateTruck, getVehicleRecommendations } from './utils/calculation';
import { clamp } from './utils/persianDigits';

import { Header } from './components/Header';
import { WizardCard } from './components/WizardCard';
import { VehicleCard } from './components/VehicleCard';
import { VehicleRecommendationCard } from './components/VehicleRecommendationCard';
import { QuantitiesCard } from './components/QuantitiesCard';
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
import { HistoryModal } from './components/HistoryModal';
import { QrScannerModal } from './components/QrScannerModal';
import { AndroidAppFrame } from './components/AndroidAppFrame';

export default function App() {
  // Profiles & Modes
  const [currentProfile, setCurrentProfile] = useState<UserProfileKey>('manager');
  const [mode, setMode] = useState<AppMode>('pro');
  const [isAndroidView, setIsAndroidView] = useState(false);

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
    model: VEHICLE_PRESETS[0].name,
    L: VEHICLE_PRESETS[0].L,
    W: VEHICLE_PRESETS[0].W,
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
    rowW: 60,
    layerH: 11,
    overloadMargin: 0,
    axleLimit: 4500,
    confirmLoading: false,
    autoVehicle: true,
    show2D: true,
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

  // Active feature access checker based on profile
  const getFeatureAccess = (key: FeatureKey): FeatureAccess => {
    const profileAllowed = PROFILE_FEATURES[currentProfile];
    if (!profileAllowed.includes(key)) return 'disabled';
    return accessMatrix.manager[key] || 'active';
  };

  // Run Layout Calculation Algorithm
  const handleRunCalculation = () => {
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
        setSelectedTruckIndex(rec.bestPresetIndex);
        setTruckDetails((prev) => ({
          ...prev,
          model: rec.bestResult!.truck.name,
          L: rec.bestResult!.truck.L,
          W: rec.bestResult!.truck.W,
          cap: rec.bestResult!.truck.cap
        }));
        return;
      }
    }

    const manualTruck = {
      name: truckDetails.model || VEHICLE_PRESETS[selectedTruckIndex].name,
      L: truckDetails.L,
      W: truckDetails.W,
      cap: truckDetails.cap
    };

    const ev = evaluateTruck(manualTruck, data, safeMaxH, rules.rowW, rules.layerH, rules.axleLimit, rules.overloadMargin, palletConfig, rules.manualLayers);
    setResult(ev);
  };

  const handleSelectVehiclePreset = useCallback((index: number, preset: VehiclePreset) => {
    setSelectedTruckIndex(index);
    setTruckDetails((prev) => ({
      ...prev,
      model: preset.name,
      L: preset.L,
      W: preset.W,
      cap: preset.cap
    }));
  }, []);

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
    palletConfig.customPalletCount
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
          isAndroidView={isAndroidView}
          onToggleAndroidView={setIsAndroidView}
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
              }}
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
            {/* Step 1: Cargo Quantities & Pallet Packaging */}
            <OrderPresetsImporter onApplyCounts={setCounts} />

            <QuantitiesCard
              counts={counts}
              onChange={handleCountsChange}
              customWeights={customWeights}
              onCustomWeightsChange={handleCustomWeightsChange}
              access={getFeatureAccess('loading_items')}
            />

            <PalletConfigCard
              config={palletConfig}
              onChange={handlePalletConfigChange}
              totalRadiators={currentData.totalPieces}
              radiatorCounts={counts}
              access={getFeatureAccess('pallets')}
              onSyncCounts={(newCounts) => setCounts(newCounts)}
            />

            {/* Step 2: Vehicle Selection & Truck Capacity */}
            <VehicleCard
              details={truckDetails}
              onChange={setTruckDetails}
              selectedIndex={selectedTruckIndex}
              onSelectPreset={setSelectedTruckIndex}
              access={getFeatureAccess('manual_vehicle')}
              onManualCustomized={() => setRules((r) => ({ ...r, autoVehicle: false }))}
              autoVehicleActive={rules.autoVehicle}
            />

            {/* Step 3: Destination, Timing & Multi-Stop LIFO */}
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

            {/* Step 4: Layout Rules & Axle Constraints */}
            <LayoutRulesCard
              rules={rules}
              onChange={setRules}
              onRunCalc={handleRunCalculation}
              access={getFeatureAccess('layout_rules')}
            />

            {/* Smart Vehicle Recommendation & Fill Matrix */}
            <VehicleRecommendationCard
              counts={counts}
              customWeights={customWeights}
              rules={rules}
              palletConfig={palletConfig}
              selectedTruckIndex={selectedTruckIndex}
              onSelectVehiclePreset={handleSelectVehiclePreset}
              access={getFeatureAccess('manual_vehicle')}
            />

            {/* Step 5: Complete Loading Calculation & 3D Visualizer */}
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

            {/* Step 6: Freight & Shipping Costs */}
            <ShippingCostCard
              costInfo={shippingCostInfo}
              palletTotalCost={activePalletCost}
              usePallets={palletConfig.usePallets}
              palletCount={activePalletCount}
              onChange={setShippingCostInfo}
              access={getFeatureAccess('cost')}
            />

            {/* Step 7: Route Map & Center of Gravity GPS */}
            <GpsMapCard
              info={gpsInfo}
              onChange={setGpsInfo}
              destination={destinationInfo.destination}
              truckL={truckDetails.L}
              truckW={truckDetails.W}
              access={getFeatureAccess('map_gps')}
            />

            {/* Step 8: Proof of Loading - Photos & Digital Signature */}
            <PhotosSignatureCard
              access={getFeatureAccess('photos_sign')}
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              signatureUrl={signatureUrl}
              onSignatureChange={setSignatureUrl}
            />

            {/* Step 9: System Plugins & Access Permission Matrix */}
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
      </div>
    </AndroidAppFrame>
  );
}
