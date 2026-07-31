import { RadiatorCounts, CustomWeights, RadiatorData, VehiclePreset, EvaluationResult, PackedLayer, PackedLane, DestinationStop, PalletConfig, PackedPallet } from '../types';
import { VEHICLE_PRESETS } from '../data/presets';

export function pieceWeight(len: number, customWeights?: CustomWeights): number {
  if (customWeights && customWeights[len] !== undefined && customWeights[len] > 0) {
    return customWeights[len];
  }
  return 27 * (len / 100);
}

export function buildRadiatorData(counts: RadiatorCounts, stops?: DestinationStop[], customWeights?: CustomWeights): RadiatorData {
  let totalPieces = 0;
  let totalMeter = 0;
  let totalWeight = 0;
  const items: number[] = [];

  // Get all sizes present in counts or presets
  const sizeKeys = Array.from(new Set([...Object.keys(counts).map(Number).filter(n => !isNaN(n) && n > 0)]));

  // If multi-stop destinations provided with specific counts
  if (stops && stops.length > 0) {
    // Sort stops by orderIndex DESCENDING for LIFO (Last In First Out)
    const sortedStops = [...stops].sort((a, b) => b.orderIndex - a.orderIndex);
    
    sortedStops.forEach((stop) => {
      sizeKeys.forEach((len) => {
        const c = Math.max(0, stop.counts[len] || 0);
        const w = pieceWeight(len, customWeights);
        totalPieces += c;
        totalMeter += c * (len / 100);
        totalWeight += c * w;
        for (let i = 0; i < c; i++) {
          items.push(len);
        }
      });
    });
  } else {
    sizeKeys.forEach((len) => {
      const c = Math.max(0, counts[len] || 0);
      const w = pieceWeight(len, customWeights);
      totalPieces += c;
      totalMeter += c * (len / 100);
      totalWeight += c * w;
      for (let i = 0; i < c; i++) {
        items.push(len);
      }
    });
    // Sort descending for best packing efficiency (longer radiators first)
    items.sort((a, b) => b - a);
  }

  return {
    counts,
    customWeights,
    items,
    totalWeight,
    totalPieces,
    totalMeter
  };
}

export function packOneLayer(
  items: number[],
  L: number,
  lanesCount: number,
  customWeights?: CustomWeights
): PackedLayer {
  const lanes: PackedLane[] = Array.from({ length: lanesCount }, () => ({
    rem: L,
    list: [],
    items: []
  }));

  const laneWeights: number[] = Array.from({ length: lanesCount }, () => 0);

  for (const item of items) {
    const itemW = pieceWeight(item, customWeights);
    let bestIdx = -1;
    let minLaneWeight = 1e9;
    let bestRem = 1e9;

    // Pick lane with enough space that balances weight across lanes (Lateral CoG)
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].rem >= item) {
        // Prefer lane with lowest total weight for left-right balance
        if (laneWeights[i] < minLaneWeight) {
          minLaneWeight = laneWeights[i];
          bestIdx = i;
          bestRem = lanes[i].rem - item;
        } else if (laneWeights[i] === minLaneWeight && lanes[i].rem - item < bestRem) {
          bestIdx = i;
          bestRem = lanes[i].rem - item;
        }
      }
    }

    if (bestIdx === -1) {
      return { ok: false, lanes, usedLength: 0 };
    }

    lanes[bestIdx].list.push(item);
    lanes[bestIdx].items.push({
      length: item,
      weight: itemW,
      scanned: false
    });
    lanes[bestIdx].rem -= item;
    laneWeights[bestIdx] += itemW;
  }

  const usedLength = lanes.reduce((sum, lane) => sum + (L - lane.rem), 0);
  return { ok: true, lanes, usedLength };
}

export function splitItemsIntoLayers(
  items: number[],
  layerCount: number,
  L?: number,
  lanesCount?: number,
  customWeights?: CustomWeights
): number[][] {
  const layers: number[][] = [];
  for (let i = 0; i < layerCount; i++) {
    layers.push([]);
  }

  // Sort items descending so larger radiators are placed first
  const sortedItems = [...items].sort((a, b) => b - a);

  if (L && lanesCount) {
    for (const item of sortedItems) {
      let placed = false;

      // Try placing item in existing layers (0 to layers.length - 1)
      for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
        const candidate = [...layers[layerIdx], item];
        const p = packOneLayer(candidate, L, lanesCount, customWeights);
        if (p.ok) {
          layers[layerIdx] = candidate;
          placed = true;
          break;
        }
      }

      // If it doesn't fit in available layers, open an overflow layer
      if (!placed) {
        layers.push([item]);
      }
    }
  } else {
    const sums: number[] = Array.from({ length: layerCount }, () => 0);
    for (const item of sortedItems) {
      let minIdx = 0;
      for (let i = 1; i < layerCount; i++) {
        if (sums[i] < sums[minIdx]) {
          minIdx = i;
        }
      }
      layers[minIdx].push(item);
      sums[minIdx] += item;
    }
  }

  return layers;
}

export function evaluateTruck(
  truck: VehiclePreset,
  data: RadiatorData,
  maxH: number,
  rowW: number,
  layerH: number,
  axleLimit: number = 4500,
  overloadMargin: number = 0,
  palletConfig?: PalletConfig,
  manualLayers?: number
): EvaluationResult {
  // If Pallet mode is active, execute Pallet packing evaluation
  if (palletConfig && palletConfig.usePallets) {
    const pLen = palletConfig.length || 120;
    const pWidth = palletConfig.width || 100;
    const pBaseHeight = palletConfig.height || 15;
    const pStackCargoH = 100; // Average cargo height on pallet in cm
    const pTotalH = pBaseHeight + pStackCargoH;
    
    // Calculate total pallets needed
    const radsPerPallet = Math.max(1, palletConfig.radiatorsPerPallet || 20);
    const calculatedPalletCount = Math.ceil(data.totalPieces / radsPerPallet);
    const totalPalletsNeeded = palletConfig.customPalletCount > 0 ? palletConfig.customPalletCount : Math.max(1, calculatedPalletCount);
    
    // Pallet weight calculations
    const palletTareWeight = palletConfig.tareWeight || 25;
    const totalPalletTareWeight = totalPalletsNeeded * palletTareWeight;
    const grossTotalWeight = data.totalWeight + totalPalletTareWeight;
    const palletTotalCost = totalPalletsNeeded * (palletConfig.unitPrice || 0);

    // Floor layout orientation test (Normal vs Rotated)
    // Normal: pallet length along truck length
    const colsNormal = Math.floor(truck.L / pLen);
    const rowsNormal = Math.floor(truck.W / pWidth);
    const palletsPerFloorNormal = colsNormal * rowsNormal;

    // Rotated: pallet width along truck length
    const colsRotated = Math.floor(truck.L / pWidth);
    const rowsRotated = Math.floor(truck.W / pLen);
    const palletsPerFloorRotated = colsRotated * rowsRotated;

    let useRotated = false;
    let cols = colsNormal;
    let rows = rowsNormal;
    let palletsPerFloor = palletsPerFloorNormal;
    let effectivePalletL = pLen;
    let effectivePalletW = pWidth;

    if (palletsPerFloorRotated > palletsPerFloorNormal) {
      useRotated = true;
      cols = colsRotated;
      rows = rowsRotated;
      palletsPerFloor = palletsPerFloorRotated;
      effectivePalletL = pWidth;
      effectivePalletW = pLen;
    }

    const maxHeightLayers = (manualLayers && manualLayers > 0) ? manualLayers : Math.floor(maxH / pTotalH);

    if (palletsPerFloor < 1 || maxHeightLayers < 1) {
      return {
        ok: false,
        reason: `ابعاد پالت (${pLen}x${pWidth}cm) برای قرارگیری در کف کامیون (${truck.L}x${truck.W}cm) یا ارتفاع (${maxH}cm) بزرگ است`,
        truck,
        lanesCount: 0,
        maxLayers: 0,
        usedLayers: 0,
        packed: [],
        totalPalletsNeeded,
        palletTotalCost,
        palletTotalWeight: grossTotalWeight,
        fill: 0,
        reserve: truck.cap - grossTotalWeight,
        approxAxle: grossTotalWeight / 2,
        axleOk: false,
        axleBalanceScore: 0,
        frontAxleWeight: 0,
        rearAxleWeight: 0
      };
    }

    const maxPalletCapacity = palletsPerFloor * maxHeightLayers;

    if (totalPalletsNeeded > maxPalletCapacity) {
      return {
        ok: false,
        reason: `تعداد ${totalPalletsNeeded} پالت در فضای این ماشین (حداکثر ظرفیت ${maxPalletCapacity} پالت) جا نمی‌شود. ماشین بزرگتر انتخاب کنید.`,
        truck,
        lanesCount: rows,
        maxLayers: maxHeightLayers,
        usedLayers: Math.ceil(totalPalletsNeeded / palletsPerFloor),
        packed: [],
        totalPalletsNeeded,
        palletTotalCost,
        palletTotalWeight: grossTotalWeight,
        fill: 0,
        reserve: truck.cap - grossTotalWeight,
        approxAxle: grossTotalWeight / 2,
        axleOk: false,
        axleBalanceScore: 0,
        frontAxleWeight: 0,
        rearAxleWeight: 0
      };
    }

    if (grossTotalWeight > truck.cap + overloadMargin) {
      return {
        ok: false,
        reason: `وزن کل پالت‌ها و رادیاتورها (${Math.round(grossTotalWeight)} کیلوگرم) از ظرفیت مجاز خودرو (${truck.cap} کیلوگرم) بیشتر است`,
        truck,
        lanesCount: rows,
        maxLayers: maxHeightLayers,
        usedLayers: 0,
        packed: [],
        totalPalletsNeeded,
        palletTotalCost,
        palletTotalWeight: grossTotalWeight,
        fill: 0,
        reserve: truck.cap - grossTotalWeight,
        approxAxle: grossTotalWeight / 2,
        axleOk: false,
        axleBalanceScore: 0,
        frontAxleWeight: 0,
        rearAxleWeight: 0
      };
    }

    // Build 3D Pallet Placement Array
    const packedPallets: PackedPallet[] = [];
    let palletIdx = 0;
    const avgCargoW = data.totalWeight / Math.max(1, totalPalletsNeeded);

    for (let layer = 0; layer < maxHeightLayers && palletIdx < totalPalletsNeeded; layer++) {
      for (let c = 0; c < cols && palletIdx < totalPalletsNeeded; c++) {
        for (let r = 0; r < rows && palletIdx < totalPalletsNeeded; r++) {
          palletIdx++;
          const posX = c * effectivePalletL;
          const posY = r * effectivePalletW;
          const posZ = layer * pTotalH;

          const pWeight = avgCargoW + palletTareWeight;

          packedPallets.push({
            id: `pallet_${palletIdx}`,
            index: palletIdx,
            posX,
            posY,
            posZ,
            length: effectivePalletL,
            width: effectivePalletW,
            height: pTotalH,
            baseHeight: pBaseHeight,
            material: palletConfig.material,
            tareWeight: palletTareWeight,
            cargoWeight: Math.round(avgCargoW),
            totalWeight: Math.round(pWeight),
            radiatorCount: radsPerPallet,
            radiatorSizes: [100, 120]
          });
        }
      }
    }

    // Precise Center of Gravity (CoG) for Pallet Mode
    let sumWx = 0;
    let sumWy = 0;
    let sumWz = 0;
    let totalW = 0;

    packedPallets.forEach((p) => {
      const px = p.posX + p.length / 2;
      const py = p.posY + p.width / 2;
      const pz = p.posZ + p.height / 2;
      const w = p.totalWeight;
      sumWx += w * px;
      sumWy += w * py;
      sumWz += w * pz;
      totalW += w;
    });

    const cogX = Math.round(totalW > 0 ? sumWx / totalW : truck.L / 2);
    const cogY = Math.round(totalW > 0 ? sumWy / totalW : truck.W / 2);
    const cogZ = Math.round(totalW > 0 ? sumWz / totalW : (maxHeightLayers * pTotalH) / 2);
    const cogXPercent = Math.round((cogX / truck.L) * 100);
    const cogYPercent = Math.round((cogY / truck.W) * 100);

    const frontWeight = totalW * (1 - cogX / truck.L);
    const rearWeight = totalW * (cogX / truck.L);
    const approxAxle = Math.max(frontWeight, rearWeight);
    const axleOk = approxAxle <= axleLimit;

    const devX = Math.abs(cogXPercent - 50);
    const devY = Math.abs(cogYPercent - 50);
    const axleBalanceScore = Math.max(0, Math.min(100, Math.round(100 - devX * 1.5 - devY * 2)));

    let cogStatus: 'perfect' | 'good' | 'warning' = 'perfect';
    let cogStatusLabel = 'عالی و کاملاً متوازن (مرکز ثقل در محدوده ۴۵٪ تا ۵۵٪ طولی)';
    if (devX <= 5 && devY <= 3) {
      cogStatus = 'perfect';
      cogStatusLabel = 'عالی و کاملاً متوازن (مرکز ثقل در محدوده ۴۵٪ تا ۵۵٪ طولی)';
    } else if (devX <= 12 && devY <= 7) {
      cogStatus = 'good';
      cogStatusLabel = 'مناسب و متوازن (توزیع وزن پایدار)';
    } else {
      cogStatus = 'warning';
      cogStatusLabel = 'هشدار عدم توازن مرکز ثقل (احتمال فشار نامساوی بر اکسل‌ها)';
    }

    const usedVolArea = totalPalletsNeeded * effectivePalletL * effectivePalletW;
    const floorArea = truck.L * truck.W * Math.ceil(totalPalletsNeeded / palletsPerFloor);
    const fill = floorArea > 0 ? Math.min(100, Math.round((usedVolArea / floorArea) * 100)) : 0;

    return {
      ok: true,
      truck,
      lanesCount: rows,
      maxLayers: maxHeightLayers,
      usedLayers: Math.ceil(totalPalletsNeeded / palletsPerFloor),
      packed: [],
      packedPallets,
      totalPalletsNeeded,
      palletTotalCost,
      palletTotalWeight: Math.round(grossTotalWeight),
      fill,
      reserve: Math.round(truck.cap - grossTotalWeight),
      approxAxle: Math.round(approxAxle),
      axleOk,
      axleBalanceScore,
      frontAxleWeight: Math.round(frontWeight),
      rearAxleWeight: Math.round(rearWeight),
      cogX,
      cogY,
      cogZ,
      cogXPercent,
      cogYPercent,
      cogStatus,
      cogStatusLabel
    };
  }

  // Standard Direct/Loose Radiator Packing
  const lanesCount = Math.floor(truck.W / rowW);
  const activeMaxLayers = (manualLayers && manualLayers > 0)
    ? manualLayers
    : Math.max(1, Math.floor(maxH / layerH));

  if (lanesCount < 1 || activeMaxLayers < 1) {
    return {
      ok: false,
      reason: 'ابعاد مجاز (عرض یا ارتفاع) برای لایه‌بندی کافی نیست',
      truck,
      lanesCount: 0,
      maxLayers: 0,
      usedLayers: 0,
      packed: [],
      fill: 0,
      reserve: 0,
      approxAxle: 0,
      axleOk: false,
      axleBalanceScore: 0,
      frontAxleWeight: 0,
      rearAxleWeight: 0
    };
  }

  if (data.totalWeight > truck.cap + overloadMargin) {
    return {
      ok: false,
      reason: `وزن کل بار (${Math.round(data.totalWeight)} کیلوگرم) از ظرفیت مجاز خودرو (${truck.cap} کیلوگرم) بیشتر است`,
      truck,
      lanesCount,
      maxLayers: activeMaxLayers,
      usedLayers: 0,
      packed: [],
      fill: 0,
      reserve: truck.cap - data.totalWeight,
      approxAxle: data.totalWeight / 2,
      axleOk: false,
      axleBalanceScore: 0,
      frontAxleWeight: 0,
      rearAxleWeight: 0
    };
  }

  const layersItems = splitItemsIntoLayers(data.items, activeMaxLayers, truck.L, lanesCount, data.customWeights);
  const usedLayers = layersItems.filter((x) => x.length > 0).length;

  if (usedLayers > activeMaxLayers) {
    return {
      ok: false,
      reason: `برای چیدمان بار در ${truck.name} به ${usedLayers} لایه نیاز است (بیشتر از حد مجاز ${activeMaxLayers} لایه تعیین‌شده)`,
      truck,
      lanesCount,
      maxLayers: activeMaxLayers,
      usedLayers,
      packed: [],
      fill: 0,
      reserve: truck.cap - data.totalWeight,
      approxAxle: data.totalWeight / 2,
      axleOk: false,
      axleBalanceScore: 0,
      frontAxleWeight: 0,
      rearAxleWeight: 0
    };
  }

  const packed: PackedLayer[] = [];

  for (const layerItems of layersItems) {
    if (layerItems.length === 0) continue;
    const p = packOneLayer(layerItems, truck.L, lanesCount, data.customWeights);
    if (!p.ok) {
      return {
        ok: false,
        reason: 'بار در طول/عرض ماشین جا نشد',
        truck,
        lanesCount,
        maxLayers: activeMaxLayers,
        usedLayers,
        packed: [],
        fill: 0,
        reserve: truck.cap - data.totalWeight,
        approxAxle: data.totalWeight / 2,
        axleOk: false,
        axleBalanceScore: 0,
        frontAxleWeight: 0,
        rearAxleWeight: 0
      };
    }
    packed.push(p);
  }

  const packedUsedLayers = packed.filter((x) => x.lanes.some((r) => r.list.length > 0)).length;
  const usedLen = packed.reduce((sum, layer) => sum + layer.usedLength, 0);
  const totalAvailableLength = lanesCount * truck.L * Math.max(packedUsedLayers, 1);
  const fill = totalAvailableLength > 0 ? (usedLen / totalAvailableLength) * 100 : 0;

  // 3D Center of Gravity (CoG) calculation across all items
  const laneW = truck.W / lanesCount;
  let sumWx = 0;
  let sumWy = 0;
  let sumWz = 0;
  let totalW = 0;

  packed.forEach((layer, layerIdx) => {
    layer.lanes.forEach((lane, laneIdx) => {
      let currentX = 0;
      const centerY = (laneIdx + 0.5) * laneW;
      const centerZ = (layerIdx + 0.5) * layerH;

      lane.list.forEach((len) => {
        const itemW = pieceWeight(len, data.customWeights);
        const centerX = currentX + len / 2;

        sumWx += itemW * centerX;
        sumWy += itemW * centerY;
        sumWz += itemW * centerZ;
        totalW += itemW;

        currentX += len;
      });
    });
  });

  const cogX = Math.round(totalW > 0 ? sumWx / totalW : truck.L / 2);
  const cogY = Math.round(totalW > 0 ? sumWy / totalW : truck.W / 2);
  const cogZ = Math.round(totalW > 0 ? sumWz / totalW : (packed.length * layerH) / 2);
  const cogXPercent = Math.round((cogX / truck.L) * 100);
  const cogYPercent = Math.round((cogY / truck.W) * 100);

  const frontWeight = totalW * (1 - cogX / truck.L);
  const rearWeight = totalW * (cogX / truck.L);
  const approxAxle = Math.max(frontWeight, rearWeight);
  const axleOk = approxAxle <= axleLimit;

  const devX = Math.abs(cogXPercent - 50);
  const devY = Math.abs(cogYPercent - 50);
  const axleBalanceScore = Math.max(0, Math.min(100, Math.round(100 - devX * 1.5 - devY * 2)));

  let cogStatus: 'perfect' | 'good' | 'warning' = 'perfect';
  let cogStatusLabel = 'عالی و کاملاً متوازن (مرکز ثقل در محدوده ۴۵٪ تا ۵۵٪ طولی)';
  if (devX <= 5 && devY <= 3) {
    cogStatus = 'perfect';
    cogStatusLabel = 'عالی و کاملاً متوازن (مرکز ثقل در محدوده ۴۵٪ تا ۵۵٪ طولی)';
  } else if (devX <= 12 && devY <= 7) {
    cogStatus = 'good';
    cogStatusLabel = 'مناسب و متوازن (توزیع وزن پایدار)';
  } else {
    cogStatus = 'warning';
    cogStatusLabel = 'هشدار عدم توازن مرکز ثقل (احتمال فشار نامساوی بر اکسل‌ها)';
  }

  return {
    ok: true,
    truck,
    lanesCount,
    maxLayers: activeMaxLayers,
    usedLayers,
    packed,
    fill,
    reserve: truck.cap - data.totalWeight,
    approxAxle: Math.round(approxAxle),
    axleOk,
    axleBalanceScore,
    frontAxleWeight: Math.round(frontWeight),
    rearAxleWeight: Math.round(rearWeight),
    cogX,
    cogY,
    cogZ,
    cogXPercent,
    cogYPercent,
    cogStatus,
    cogStatusLabel
  };
}

export interface VehicleRecommendationItem {
  presetIndex: number;
  preset: VehiclePreset;
  result: EvaluationResult;
  weightFillPercent: number;
  volumeFillPercent: number;
  isBest: boolean;
  statusType: 'best' | 'feasible' | 'overload' | 'too_small';
}

export interface VehicleRecommendation {
  bestResult: EvaluationResult | null;
  bestPresetIndex: number;
  activeLayersCount: number;
  allEvaluations: VehicleRecommendationItem[];
}

export function getVehicleRecommendations(
  data: RadiatorData,
  maxH: number,
  rowW: number,
  layerH: number,
  axleLimit: number = 4500,
  overloadMargin: number = 0,
  palletConfig?: PalletConfig,
  manualLayers?: number
): VehicleRecommendation {
  const evaluations: VehicleRecommendationItem[] = VEHICLE_PRESETS.map((preset, index) => {
    // Evaluate truck with user's manualLayers constraint if specified
    let res = evaluateTruck(
      preset,
      data,
      maxH,
      rowW,
      layerH,
      axleLimit,
      overloadMargin,
      palletConfig,
      manualLayers
    );

    // If it failed due to layer constraint but weight is OK, evaluate without layer limit to find required layers
    if (!res.ok && manualLayers && manualLayers > 0 && data.totalWeight <= preset.cap + overloadMargin) {
      const fallbackRes = evaluateTruck(
        preset,
        data,
        maxH,
        rowW,
        layerH,
        axleLimit,
        overloadMargin,
        palletConfig,
        undefined
      );
      if (fallbackRes.ok) {
        res = {
          ...fallbackRes,
          ok: false,
          reason: `نیازمند ${fallbackRes.usedLayers} لایه چیدمان است (بیشتر از حد مجاز ${manualLayers} لایه)`
        };
      }
    }

    const weightFillPercent = Math.min(100, Math.round((data.totalWeight / preset.cap) * 100));
    const volumeFillPercent = Math.round(res.fill || 0);

    let statusType: 'best' | 'feasible' | 'overload' | 'too_small' = 'feasible';
    if (!res.ok) {
      if (data.totalWeight > preset.cap + overloadMargin) {
        statusType = 'overload';
      } else {
        statusType = 'too_small';
      }
    }

    return {
      presetIndex: index,
      preset,
      result: res,
      weightFillPercent,
      volumeFillPercent,
      isBest: false,
      statusType
    };
  });

  const feasible = evaluations.filter((e) => e.result.ok);

  // Sort feasible vehicles:
  // 1. Smallest weight capacity (cost efficiency - cheapest adequate transport)
  // 2. Highest volume fill percentage
  // 3. Fewer layers required
  feasible.sort((a, b) => {
    if (a.preset.cap !== b.preset.cap) {
      return a.preset.cap - b.preset.cap;
    }
    if (b.result.fill !== a.result.fill) {
      return b.result.fill - a.result.fill;
    }
    return a.result.usedLayers - b.result.usedLayers;
  });

  let bestResult: EvaluationResult | null = null;
  let bestPresetIndex = -1;
  let activeLayersCount = (manualLayers && manualLayers > 0) ? manualLayers : Math.max(1, Math.floor(maxH / layerH));

  if (feasible.length > 0) {
    bestResult = feasible[0].result;
    bestPresetIndex = feasible[0].presetIndex;
    if (manualLayers && manualLayers > 0) {
      activeLayersCount = manualLayers;
    } else {
      activeLayersCount = bestResult.usedLayers || activeLayersCount;
    }

    evaluations.forEach((item) => {
      if (item.presetIndex === bestPresetIndex) {
        item.isBest = true;
        item.statusType = 'best';
      }
    });
  }

  return {
    bestResult,
    bestPresetIndex,
    activeLayersCount,
    allEvaluations: evaluations
  };
}
