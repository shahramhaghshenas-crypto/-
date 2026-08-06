export type RadiatorSize = 60 | 80 | 100 | 120 | 140 | 160 | 180;

export type RadiatorCounts = Record<number, number>;

export type CustomWeights = Record<number, number>;

export type PalletMaterial = 'wooden' | 'metal' | 'plastic';

export interface CustomPalletItem {
  id: string;
  name?: string;
  material: PalletMaterial;
  length: number; // Length in cm
  width: number; // Width in cm
  height: number; // Base height in cm
  tareWeight: number; // Empty pallet weight in kg
  unitPrice: number; // Unit price in Toman
  radiatorCounts: Record<number, number>; // Radiator count per size on this specific pallet
}

export interface SizePalletSpec {
  length: number; // Length in cm
  width: number; // Width in cm
  height: number; // Base height in cm
  tareWeight: number; // Empty pallet weight in kg
  unitPrice: number; // Price per pallet in Toman
  radiatorsPerPallet: number; // Capacity per pallet
}

export interface PalletConfig {
  usePallets: boolean;
  material: PalletMaterial;
  length: number; // Pallet Length cm (e.g. 120 cm)
  width: number; // Pallet Width cm (e.g. 100 cm)
  height: number; // Pallet Base Height cm (e.g. 15 cm)
  tareWeight: number; // Empty Pallet Tare Weight in kg
  unitPrice: number; // Unit price per pallet in Toman
  radiatorsPerPallet: number; // Number of radiators loaded per pallet
  customPalletCount: number; // Optional manual override of pallet count (0 = auto)
  sizeDistributionMode?: 'auto' | 'custom' | 'basket' | 'per_size'; // 'auto', 'custom', 'basket', or 'per_size'
  customSizeCounts?: Record<number, number>; // How many radiators of size 60, 80, 100, 120, 140, 160, 180 per pallet
  customPalletBasket?: CustomPalletItem[]; // Multi-pallet basket with individual dimensions & radiator combinations
  perSizeSpecs?: Record<number, SizePalletSpec>; // Custom pallet dimensions for each radiator size (60, 80, 100, 120, 140, 160, 180)
}

export interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNo: string;
  plate: string;
  transportCompany: string;
  createdAt: string;
}

export interface CustomVehicleRecord {
  id: string;
  model: string;
  cap: number; // weight capacity in kg
  L: number; // cargo length cm
  W: number; // cargo width cm
  height: number; // cargo height cm
  plate: string;
  createdAt?: string;
}

export type DashboardTab = 'dashboard' | 'drivers' | 'vehicles' | 'cargo' | 'layout' | 'reports' | 'settings';

export interface VehiclePreset {
  name: string;
  L: number; // Length in cm
  W: number; // Width in cm
  cap: number; // Weight capacity in kg
  radiatorMeterRange?: string; // e.g. "۶۰ تا ۱۰۰ متر"
  nominalTonnage?: string; // e.g. "۳ تن" or "۵۰۰ کیلوگرم"
  minMeters?: number;
  maxMeters?: number;
}

export interface TruckDetails {
  model: string;
  L: number;
  W: number;
  cap: number;
  plate: string;
  driverName: string;
  driverPhone: string;
  waybillNo: string;
}

export interface DestinationStop {
  id: string;
  cityName: string;
  address: string;
  orderIndex: number; // 1 = First destination to unload
  counts: RadiatorCounts;
}

export interface DestinationInfo {
  destination: string;
  loadDate: string;
  loadTime: string;
  unloadTime: string;
  notes: string;
  loadOrder: string;
  unloadOrder: string;
  stops: DestinationStop[];
}

export interface LayoutRules {
  maxH: number; // Max height cm (11 to 180)
  rowW: number; // Row width cm
  layerH: number; // Layer height cm
  manualLayers?: number; // Optional manual layer count specified by user (e.g., 1-15 layers)
  customLayersCount?: number; // Manual override of layer count (0 = auto based on maxH, or 1..15)
  overloadMargin: number; // Overload margin in kg
  axleLimit: number; // Axle limit in kg
  confirmLoading: boolean;
  autoVehicle: boolean;
  show2D: boolean;
  show3D: boolean;
  lifoPriority: boolean; // Last-In-First-Out packing by destination stop
}

export interface ShippingCostInfo {
  distanceKm: number;
  ratePerKm: number;
  fixedCost: number;
  insuranceCost: number;
  driverAllowance: number;
  customFreightCost: number; // Manually specified base freight cost in Toman
  isManualFreight: boolean; // Whether custom manual freight cost is enabled
  palletTotalCost: number; // Calculated total cost of all pallets in Toman
  totalCost: number;
}

export interface GPSInfo {
  lat: string;
  lng: string;
  cgInfo: string;
  axleBalanceScore: number; // 0-100 balance percentage
  longitudinalCG: string; // e.g., "55% front / 45% rear"
  lateralCG: string; // e.g., "50% left / 50% right (Balanced)"
}

export interface PluginModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export type FeatureAccess = 'active' | 'view' | 'disabled';

export type UserRole = 'manager' | 'worker';

export type UserProfileKey = 'simple' | 'warehouse' | 'logistics' | 'manager';

export type AppMode = 'pro' | 'wizard';

export interface PackedItem {
  length: number;
  weight: number;
  stopId?: string;
  scanned?: boolean;
}

export interface PackedLane {
  list: number[];
  items: PackedItem[];
  rem: number;
}

export interface PackedLayer {
  ok: boolean;
  lanes: PackedLane[];
  usedLength: number;
}

export interface PackedPallet {
  id: string;
  index: number;
  posX: number; // Length offset from truck front in cm
  posY: number; // Width offset from truck left in cm
  posZ: number; // Height layer offset in cm
  length: number;
  width: number;
  height: number; // Full height including radiators
  baseHeight: number;
  material: PalletMaterial;
  tareWeight: number;
  cargoWeight: number;
  totalWeight: number;
  radiatorCount: number;
  radiatorSizes: number[];
  sizeBreakdown?: string;
  stopId?: string;
}

export interface RadiatorData {
  counts: RadiatorCounts;
  customWeights?: CustomWeights;
  items: number[];
  totalWeight: number;
  totalPieces: number;
  totalMeter: number;
}

export interface EvaluationResult {
  ok: boolean;
  reason?: string;
  truck: VehiclePreset;
  lanesCount: number;
  maxLayers: number;
  usedLayers: number;
  packed: PackedLayer[];
  packedPallets?: PackedPallet[]; // 3D Pallet layout list
  totalPalletsNeeded?: number;
  palletTotalCost?: number;
  palletTotalWeight?: number;
  fill: number; // Percentage 0-100
  reserve: number;
  approxAxle: number;
  axleOk: boolean;
  axleBalanceScore: number;
  frontAxleWeight: number;
  rearAxleWeight: number;
  // Center of Gravity (مرکز ثقل) Metrics
  cogX?: number; // Center of gravity length from front (cm)
  cogY?: number; // Center of gravity width from left (cm)
  cogZ?: number; // Center of gravity height from floor (cm)
  cogXPercent?: number; // % of truck length (ideal 45-55%)
  cogYPercent?: number; // % of truck width (ideal 48-52%)
  cogStatus?: 'perfect' | 'good' | 'warning';
  cogStatusLabel?: string;
}

export type FeatureKey = 
  | 'manual_vehicle'
  | 'loading_items'
  | 'destination'
  | 'layout_rules'
  | 'cost'
  | 'map_gps'
  | 'photos_sign'
  | 'plugins'
  | 'features'
  | 'history'
  | 'multistop'
  | 'pallets';

export interface FeatureDef {
  key: FeatureKey;
  label: string;
}

export interface SavedLoadingRecord {
  id: string;
  createdAt: string;
  title: string;
  truckName: string;
  plate: string;
  driverName: string;
  destination: string;
  totalPieces: number;
  totalWeight: number;
  totalCost: number;
  palletCost?: number;
  palletCount?: number;
  counts: RadiatorCounts;
  truckDetails: TruckDetails;
  destinationInfo: DestinationInfo;
}

export interface LayoutScenario {
  id: string;
  name: string;
  createdAt: string;
  counts: RadiatorCounts;
  truckDetails: TruckDetails;
  rules: LayoutRules;
  result: EvaluationResult | null;
  fill: number;
  balance: number;
  weight: number;
  totalPieces: number;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'lock' | 'edit' | 'scenario';
}

export interface SmartTruckPreset {
  id: string;
  name: string;
  type: 'nissan' | 'pickup' | 'truck6m' | 'truck8m' | 'wheel10' | 'trailer';
  L: number; // Length cm
  W: number; // Width cm
  H: number; // Height cm
  cap: number; // Max payload kg
  icon?: string;
}

export interface PlacedRadiatorItem {
  id: string;
  model: string;
  width: number; // Width in cm along X axis
  length: number; // Length in cm along Y axis
  height: number; // Height in cm along Z axis
  thickness?: number; // Thickness in cm
  weight: number; // Weight in kg
  color: string; // Hex color representation
  x: number; // X offset in truck bed (cm)
  y: number; // Y offset in truck bed (cm)
  z: number; // Z stack height (cm)
  layer: number; // Layer index (1..N)
  sequence?: number; // Smart Loading Sequence order (1..N)
  rotated?: boolean; // 90 degree rotation flag
  orientation?: 'flat' | 'vertical_knife' | 'side'; // Orientation mode
  rotationAngle?: 0 | 90 | 180; // Rotation angle
  stopId?: string; // Target stop destination if applicable
  isPallet?: boolean;
}

export type LoadingPatternMode = 'flat' | 'vertical_knife' | 'side_loading' | 'interlocking' | 'brick_zigzag' | 'hybrid_maxrects';

export interface OptimizationMetrics {
  spaceUtilizationPercent: number; // e.g. 96
  deadSpacePercent: number; // e.g. 3
  weightBalanceScore: number; // e.g. 98
  loadingEfficiencyScore: number; // e.g. 97
  selectedPattern: LoadingPatternMode;
  selectedPatternLabel: string;
  totalPacked: number;
  totalRequested: number;
  explanationLogs: string[];
}

export interface SavedSmartLayout {
  id: string;
  name: string;
  createdAt: string;
  truck: SmartTruckPreset;
  items: PlacedRadiatorItem[];
  totalWeight: number;
  totalPieces: number;
  fillPercent: number;
  notes?: string;
}

