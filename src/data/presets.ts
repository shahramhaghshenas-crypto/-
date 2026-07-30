import { VehiclePreset, UserProfileKey, FeatureKey, FeatureDef, PluginModule, FeatureAccess, PalletConfig } from '../types';

export const RADIATOR_SIZES = [60, 80, 100, 120, 140, 160, 180] as const;

export const DEFAULT_PALLET_CONFIG: PalletConfig = {
  usePallets: false,
  material: 'wooden',
  length: 120, // 120 cm standard pallet length
  width: 100,  // 100 cm standard pallet width
  height: 15,  // 15 cm base height
  tareWeight: 25, // 25 kg wooden pallet
  unitPrice: 180000, // 180,000 Toman for wooden pallet
  radiatorsPerPallet: 20, // 20 radiators per pallet default
  customPalletCount: 0
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
  { name: 'خاور ۶ تن', L: 470, W: 220, cap: 6000 },
  { name: 'خاور ۸ تن', L: 470, W: 220, cap: 8000 },
  { name: '۹۱۱ پنج تن', L: 580, W: 220, cap: 5000 },
  { name: 'تک ۱۰ تن', L: 680, W: 230, cap: 10000 },
  { name: 'ده چرخ', L: 760, W: 245, cap: 15000 },
  { name: 'نیسان', L: 300, W: 170, cap: 2200 },
  { name: 'وانت', L: 220, W: 150, cap: 700 },
  { name: 'مزدا', L: 280, W: 160, cap: 1000 },
  { name: 'تریلی ۲۲ تن', L: 1200, W: 250, cap: 22000 },
  { name: 'سفارشی', L: 470, W: 220, cap: 6000 }
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
