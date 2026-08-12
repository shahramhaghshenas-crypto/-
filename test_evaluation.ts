import { buildRadiatorData, evaluateTruck, getVehicleRecommendations } from './src/utils/calculation';
import { runAdvancedOptimizer } from './src/utils/maxRectsPacker';
import { VEHICLE_PRESETS, RADIATOR_CATALOG } from './src/data/presets';
import { RadiatorCounts, PlacedRadiatorItem } from './src/types';

// Let's run Test A:
console.log("=== RUNNING TEST A ===");
const countsA: RadiatorCounts = {
  80: 50,
  100: 100,
  160: 50
};

// 1. Build radiator data
const dataA = buildRadiatorData(countsA, undefined, {});
console.log(`totalPieces: ${dataA.totalPieces}`);
console.log(`totalWeight: ${dataA.totalWeight} kg`);

// 2. Recommendations for Test A with 13 layers:
// Wait, getVehicleRecommendations uses maxH. If layerH = 11, then maxH for 13 layers is 13 * 11 = 143.
// Let's check recommended vehicle:
const recA = getVehicleRecommendations(dataA, 143, 11, 11, 4500, 0, { usePallets: false }, 13);
console.log(`Recommended vehicle: ${recA.bestResult?.truck.name} (id: ${recA.bestResult?.truck.id})`);
console.log(`Used layers in evaluateTruck: ${recA.bestResult?.usedLayers}`);

// Let's run the 3D MaxRects Packer for Test A with the recommended vehicle:
const truckA = recA.bestResult?.truck || VEHICLE_PRESETS.find(v => v.id === "truck6m")!;
console.log(`Truck details: ${truckA.name} (${truckA.id}), L: ${truckA.L}, W: ${truckA.W}, H: ${truckA.H}, cap: ${truckA.cap}`);

// Let's prepare items list for packer:
const itemsA: PlacedRadiatorItem[] = [];
let itemCounter = 1;
Object.entries(countsA).forEach(([szStr, qty]) => {
  const sizeNum = Number(szStr);
  const spec = RADIATOR_CATALOG.find(c => c.size === sizeNum)!;
  for (let i = 0; i < qty; i++) {
    itemsA.push({
      id: `rad-${itemCounter++}`,
      model: spec.label,
      width: spec.width,
      length: spec.length,
      height: spec.height,
      weight: spec.weight,
      color: spec.color,
      x: 0,
      y: 0,
      z: 0,
      layer: 1
    });
  }
});

// Run Advanced Optimizer on itemsA:
const optA = runAdvancedOptimizer(itemsA, truckA.L, truckA.W, truckA.H, truckA.cap);
console.log(`optA packed items count: ${optA.winningResult.packedItems.length}`);
console.log(`optA unpacked items count: ${optA.winningResult.unpackedItems.length}`);

// Check for 3D Overlaps in winningResult packedItems:
const checkOverlap3D = (
  a: { x: number; y: number; z: number; w: number; l: number; h: number },
  b: { x: number; y: number; z: number; w: number; l: number; h: number }
) => {
  const xOverlap = a.x < b.x + b.w && a.x + a.w > b.x;
  const yOverlap = a.y < b.y + b.l && a.y + a.l > b.y;
  const zOverlap = a.z < b.z + b.h && a.z + a.h > b.z;
  return xOverlap && yOverlap && zOverlap;
};

const packedItemsA = optA.winningResult.packedItems;
let overlapCountA = 0;
for (let i = 0; i < packedItemsA.length; i++) {
  const item = packedItemsA[i];
  const itemW = item.rotated ? item.length : item.width;
  const itemL = item.rotated ? item.width : item.length;
  for (let j = i + 1; j < packedItemsA.length; j++) {
    const other = packedItemsA[j];
    const othW = other.rotated ? other.length : other.width;
    const othL = other.rotated ? other.width : other.length;
    if (checkOverlap3D(
      { x: item.x, y: item.y, z: item.z || 0, w: itemW, l: itemL, h: item.height },
      { x: other.x, y: other.y, z: other.z || 0, w: othW, l: othL, h: other.height }
    )) {
      overlapCountA++;
    }
  }
}
console.log(`Overlap count A: ${overlapCountA}`);

// Let's run Test B:
console.log("\n=== RUNNING TEST B ===");
const countsB: RadiatorCounts = {
  80: 20,
  100: 20,
  160: 20
};

const dataB = buildRadiatorData(countsB, undefined, {});
console.log(`totalPieces: ${dataB.totalPieces}`);
console.log(`totalWeight: ${dataB.totalWeight} kg`);

// Running Test B on same vehicle as Test A (truckA):
const optB = runAdvancedOptimizer(
  dataB.items.map((sizeNum, idx) => {
    const spec = RADIATOR_CATALOG.find(c => c.size === sizeNum)!;
    return {
      id: `rad-${idx}`,
      model: spec.label,
      width: spec.width,
      length: spec.length,
      height: spec.height,
      weight: spec.weight,
      color: spec.color,
      x: 0,
      y: 0,
      z: 0,
      layer: 1
    };
  }),
  truckA.L,
  truckA.W,
  truckA.H,
  truckA.cap
);
console.log(`optB packed items count: ${optB.winningResult.packedItems.length}`);
console.log(`optB unpacked items count: ${optB.winningResult.unpackedItems.length}`);

let overlapCountB = 0;
const packedItemsB = optB.winningResult.packedItems;
for (let i = 0; i < packedItemsB.length; i++) {
  const item = packedItemsB[i];
  const itemW = item.rotated ? item.length : item.width;
  const itemL = item.rotated ? item.width : item.length;
  for (let j = i + 1; j < packedItemsB.length; j++) {
    const other = packedItemsB[j];
    const othW = other.rotated ? other.length : other.width;
    const othL = other.rotated ? other.width : other.length;
    if (checkOverlap3D(
      { x: item.x, y: item.y, z: item.z || 0, w: itemW, l: itemL, h: item.height },
      { x: other.x, y: other.y, z: other.z || 0, w: othW, l: othL, h: other.height }
    )) {
      overlapCountB++;
    }
  }
}
console.log(`Overlap count B: ${overlapCountB}`);
