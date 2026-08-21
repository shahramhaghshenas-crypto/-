import { VehiclePreset, UserProfileKey, FeatureKey, FeatureDef, PluginModule, FeatureAccess, PalletConfig } from '../types';

export const RADIATOR_SIZES = [40, 60, 80, 100, 120, 140, 160, 180, 200] as const;

export const DEFAULT_PER_SIZE_PALLET_SPECS = {
  40: { length: 60, width: 80, height: 15, tareWeight: 15, unitPrice: 130000, radiatorsPerPallet: 30 },
  60: { length: 80, width: 80, height: 15, tareWeight: 18, unitPrice: 150000, radiatorsPerPallet: 25 },
  80: { length: 100, width: 90, height: 15, tareWeight: 20, unitPrice: 160000, radiatorsPerPallet: 25 },
  100: { length: 120, width: 100, height: 15, tareWeight: 25, unitPrice: 180000, radiatorsPerPallet: 25 },
  120: { length: 140, width: 100, height: 15, tareWeight: 28, unitPrice: 200000, radiatorsPerPallet: 25 },
  140: { length: 160, width: 110, height: 15, tareWeight: 32, unitPrice: 220000, radiatorsPerPallet: 25 },
  160: { length: 180, width: 110, height: 15, tareWeight: 36, unitPrice: 250000, radiatorsPerPallet: 25 },
  180: { length: 200, width: 110, height: 15, tareWeight: 40, unitPrice: 280000, radiatorsPerPallet: 25 },
  200: { length: 220, width: 110, height: 15, tareWeight: 44, unitPrice: 300000, radiatorsPerPallet: 25 },
};

export const DEFAULT_PALLET_CONFIG: PalletConfig = {
  usePallets: false,
  material: 'wooden',
  length: 120, // 120 cm standard pallet length
  width: 100,  // 100 cm standard pallet width
  height: 15,  // 15 cm base height
  tareWeight: 25, // 25 kg wooden pallet
  unitPrice: 180000, // 180,000 Toman for wooden pallet
  radiatorsPerPallet: 25, // 25 radiators per pallet default
  customPalletCount: 0,
  sizeDistributionMode: 'per_size',
  customSizeCounts: {
    40: 0,
    60: 0,
    80: 0,
    100: 10,
    120: 10,
    140: 0,
    160: 0,
    180: 0,
    200: 0
  },
  customPalletBasket: [],
  perSizeSpecs: DEFAULT_PER_SIZE_PALLET_SPECS
};

export const PALLET_MATERIAL_PRESETS: Record<'wooden' | 'metal' | 'plastic', { name: string; tareWeight: number; unitPrice: number; icon: string; color: string }> = {
  wooden: {
    name: 'پالت چوبی 🪵',
    tareWeight: 25,
    unitPrice: 180000,
    icon: '🪵',
    color: '#8B5A2B'
  },
  metal: {
    name: 'پالت فلزی ⚙️',
    tareWeight: 45,
    unitPrice: 650000,
    icon: '⚙️',
    color: '#718096'
  },
  plastic: {
    name: 'پالت پلاستیکی 🟦',
    tareWeight: 18,
    unitPrice: 380000,
    icon: '🟦',
    color: '#2563EB'
  }
};

export const VEHICLE_PRESETS: VehiclePreset[] = [
  { id: 'nissan', name: 'نیسان', L: 240, W: 160, H: 120, cap: 2000, radiatorMeterRange: '۲۵ تا ۶۰ متر', nominalTonnage: '۲ تن', minMeters: 25, maxMeters: 60 },
  { id: 'pickup', name: 'وانت', L: 180, W: 140, H: 100, cap: 800, radiatorMeterRange: '۱ تا ۱۵ متر', nominalTonnage: '۵۰۰ کیلوگرم', minMeters: 1, maxMeters: 15 },
  { id: 'truck6m', name: 'خاور ۶ تن', L: 600, W: 220, H: 200, cap: 6000, radiatorMeterRange: '۶۰ تا ۱۰۰ متر', nominalTonnage: '۳ تن', minMeters: 60, maxMeters: 100 },
  { id: 'truck8m', name: 'خاور ۸ تن', L: 800, W: 240, H: 220, cap: 10000, radiatorMeterRange: '۱۰۰ تا ۱۳۵ متر', nominalTonnage: '۴ تن', minMeters: 100, maxMeters: 135 },
  { id: 'wheel10', name: 'ده چرخ', L: 700, W: 245, H: 220, cap: 15000, radiatorMeterRange: '۲۲۰ تا ۲۶۰ متر', nominalTonnage: '۱۵ تن', minMeters: 220, maxMeters: 260 },
  { id: 'trailer', name: 'تریلی', L: 1200, W: 250, H: 250, cap: 22000, radiatorMeterRange: '۲۶۰ تا ۵۲۰ متر', nominalTonnage: '۲۲ تن', minMeters: 260, maxMeters: 520 },
  { id: 'custom', name: 'سفارشی', L: 600, W: 220, H: 200, cap: 6000, radiatorMeterRange: 'دلخواه', nominalTonnage: 'سفارشی' }
];

export interface CatalogRadiatorSpec {
  size: number;
  label: string;
  width: number; // L in cm
  length: number; // Thickness in cm
  height: number; // H in cm
  weight: number; // W in kg
  color: string;
}

export const RADIATOR_CATALOG: CatalogRadiatorSpec[] = [
  { size: 40, label: 'رادیاتور ۴۰ سانتی (۴۶۰×۱۱۰×۶۲۰)', width: 46, length: 11, height: 62, weight: 10, color: '#ec4899' },
  { size: 60, label: 'رادیاتور ۶۰ سانتی (۶۶۰×۱۱۰×۶۲۰)', width: 66, length: 11, height: 62, weight: 12, color: '#eab308' },
  { size: 80, label: 'رادیاتور ۸۰ سانتی (۸۶۰×۱۱۰×۶۲۰)', width: 86, length: 11, height: 62, weight: 15, color: '#ef4444' },
  { size: 100, label: 'رادیاتور ۱۰۰ سانتی (۱۰۶۰×۱۱۰×۶۲۰)', width: 106, length: 11, height: 62, weight: 20, color: '#3b82f6' },
  { size: 120, label: 'رادیاتور ۱۲۰ سانتی (۱۲۶۰×۱۱۰×۶۲۰)', width: 126, length: 11, height: 62, weight: 22, color: '#22c55e' },
  { size: 140, label: 'رادیاتور ۱۴۰ سانتی (۱۴۶۰×۱۱۰×۶۲۰)', width: 146, length: 11, height: 62, weight: 24, color: '#a855f7' },
  { size: 160, label: 'رادیاتور ۱۶۰ سانتی (۱۶۶۰×۱۱۰×۶۲۰)', width: 166, length: 11, height: 62, weight: 25, color: '#f97316' },
  { size: 180, label: 'رادیاتور ۱۸۰ سانتی (۱۸۶۰×۱۱۰×۶۲۰)', width: 186, length: 11, height: 62, weight: 28, color: '#64748b' },
  { size: 200, label: 'رادیاتور ۲۰۰ سانتی (۲۰۶۰×۱۱۰×۶۲۰)', width: 206, length: 11, height: 62, weight: 30, color: '#06b6d4' }
];

export const PROFILE_FEATURES: Record<UserProfileKey, FeatureKey[]> = {
  simple: ['loading_items', 'manual_vehicle'],
  warehouse: ['loading_items', 'manual_vehicle', 'destination', 'layout_rules', 'pallets', 'photos_sign', 'history'],
  logistics: ['loading_items', 'manual_vehicle', 'destination', 'layout_rules', 'cost', 'map_gps', 'multistop', 'pallets', 'history'],
  manager: ['loading_items', 'manual_vehicle', 'destination', 'layout_rules', 'cost', 'map_gps', 'photos_sign', 'plugins', 'features', 'multistop', 'pallets', 'history']
};

export const FEATURE_DEFS: FeatureDef[] = [
  { key: 'manual_vehicle', label: 'انتخاب دستی و مشخصات خودرو' },
  { key: 'loading_items', label: 'ورود تعداد رادیاتورها' },
  { key: 'pallets', label: 'پالت‌بندی، چوبی/فلزی/پلاستیکی و محاسبات قیمت' },
  { key: 'destination', label: 'مقصد، راننده و زمان‌بندی' },
  { key: 'multistop', label: 'بارگیری چند مقصدی LIFO' },
  { key: 'layout_rules', label: 'چیدمان، ارتفاع و کنترل بار' },
  { key: 'cost', label: 'محاسبه هزینه حمل و کرایه دستی' },
  { key: 'map_gps', label: 'نقشه، GPS و مرکز ثقل' },
  { key: 'photos_sign', label: 'ثبت عکس بارگیری و امضا' },
  { key: 'history', label: 'آرشیو و تاریخچه بارگیری‌ها' },
  { key: 'plugins', label: 'سیستم افزونه‌ها و ماژول‌ها' },
  { key: 'features', label: 'مدیریت دسترسی‌ها و امکانات' }
];

export const INITIAL_FEATURE_ACCESS: Record<'manager' | 'worker', Record<FeatureKey, FeatureAccess>> = {
  manager: {
    manual_vehicle: 'active',
    loading_items: 'active',
    destination: 'active',
    multistop: 'active',
    layout_rules: 'active',
    cost: 'active',
    map_gps: 'active',
    photos_sign: 'active',
    history: 'active',
    plugins: 'active',
    features: 'active',
    pallets: 'active'
  },
  worker: {
    manual_vehicle: 'disabled',
    loading_items: 'active',
    destination: 'active',
    multistop: 'active',
    layout_rules: 'active',
    cost: 'view',
    map_gps: 'view',
    photos_sign: 'active',
    history: 'view',
    plugins: 'disabled',
    features: 'disabled',
    pallets: 'active'
  }
};

export const INITIAL_PLUGINS: PluginModule[] = [
  { id: 'rad_load', name: 'ماژول بارگیری رادیاتور پنلی', description: 'چیدمان بهینه، محاسبه وزن و طول', enabled: true },
  { id: 'pallet_mode', name: 'ماژول پالت‌بندی تخصصی (چوبی/فلزی/پلاستیکی)', description: 'چیدمان سه‌بعدی پالت، وزن خالی و قیمت به تومان', enabled: true },
  { id: 'dom_transport', name: 'ماژول حمل و نقل داخلی', description: 'ارسال‌های بین‌شهری و استانی', enabled: true },
  { id: 'exp_transport', name: 'ماژول ترانزیت و صادراتی', description: 'پروتکل‌های بین‌المللی و گمرک', enabled: false },
  { id: 'boilers', name: 'ماژول پکیج دیواری و شوفاژ', description: 'محاسبه چیدمان پکیج‌ها', enabled: false },
  { id: 'spare_parts', name: 'ماژول قطعات یدکی و لوله', description: 'مدیریت قطعات جانبی', enabled: false },
  { id: 'erp', name: 'اتصال مستقیم به سیستم ERP', description: 'همگام‌سازی حواله‌ها و خروج کالا', enabled: true },
  { id: 'excel_sales', name: 'اتصال به اکسل فروش و انبار', description: 'ورود سریع داده‌ها از فایل', enabled: true },
  { id: 'qr_scanner', name: 'اسکنر بارکد و QR کد بارگیری', description: 'صحت‌سنجی حین بارگیری', enabled: true }
];
