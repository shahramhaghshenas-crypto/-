// ===================================
// Radiator AI
// 3D Loading Engine (Advanced Bin Packing)
// Version 1.0 Industrial
// ===================================

export class Position {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.z = Math.round(z);
  }
}

export interface Orientation {
  length: number;
  width: number;
  height: number;
  name: string;
}

export class Radiator {
  id: string;
  model: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  position: Position | null;
  placedOrientation: Orientation | null;

  constructor(
    id: string,
    model: string,
    length: number,
    width: number,
    height: number,
    weight: number
  ) {
    this.id = id;
    this.model = model;
    this.length = length;
    this.width = width;
    this.height = height;
    this.weight = weight;
    this.position = null;
    this.placedOrientation = null;
  }
}

export class Truck {
  length: number;
  width: number;
  height: number;
  capacity: number;
  name: string;

  constructor(length: number, width: number, height: number, capacity: number, name = 'کامیون استاندارد') {
    this.length = length;
    this.width = width;
    this.height = height;
    this.capacity = capacity;
    this.name = name;
  }
}

export interface PackedResultItem {
  id: string;
  model: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  x: number;
  y: number;
  z: number;
}

export class LoadingEngine3D {
  truck: Truck | null;
  items: Radiator[];
  result: Radiator[];
  freeSpaces: Position[];
  allowRotations: boolean;

  constructor() {
    this.truck = null;
    this.items = [];
    this.result = [];
    this.freeSpaces = [];
    this.allowRotations = true;
  }

  setTruck(truck: Truck) {
    this.truck = truck;
    this.freeSpaces = [new Position(0, 0, 0)];
  }

  setItems(items: Radiator[]) {
    this.items = items;
  }

  calculate(): Radiator[] {
    this.result = [];
    if (!this.truck) {
      throw new Error("ماشین انتخاب نشده است.");
    }
    if (this.items.length === 0) {
      throw new Error("هیچ رادیاتوری وارد نشده است.");
    }

    this.freeSpaces = [new Position(0, 0, 0)];
    this.packItems();
    return this.result;
  }

  /**
   * Generates up to 6 valid orientations for a radiator
   */
  getPossibleOrientations(item: Radiator): Orientation[] {
    if (!this.allowRotations) {
      return [{ length: item.length, width: item.width, height: item.height, name: 'Standard' }];
    }

    // Radiators can be laid flat or stood upright (provided height constraints permit)
    const rawOrientations = [
      { length: item.length, width: item.width, height: item.height, name: 'طولی-افقی' },
      { length: item.width, width: item.length, height: item.height, name: 'عرضی-افقی' },
      { length: item.length, width: item.height, height: item.width, name: 'دیواره‌ای' },
      { length: item.height, width: item.width, height: item.length, name: 'ایستاده طولی' },
      { length: item.width, width: item.height, height: item.length, name: 'ایستاده عرضی' },
      { length: item.height, width: item.length, height: item.width, name: 'ایستاده جانبی' },
    ];

    // Filter orientations that fit in truck container bounds
    const truck = this.truck!;
    return rawOrientations.filter(
      (o) => o.length <= truck.length && o.width <= truck.width && o.height <= truck.height
    );
  }

  /**
   * Checks if two 3D boxes overlap
   */
  static checkCollision(
    x1: number, y1: number, z1: number, l1: number, w1: number, h1: number,
    x2: number, y2: number, z2: number, l2: number, w2: number, h2: number
  ): boolean {
    return !(
      x1 + l1 <= x2 || x2 + l2 <= x1 ||
      y1 + w1 <= y2 || y2 + w2 <= y1 ||
      z1 + h1 <= z2 || z2 + h2 <= z1
    );
  }

  /**
   * Checks collision against all placed items
   */
  isColliding(x: number, y: number, z: number, l: number, w: number, h: number): boolean {
    for (const placed of this.result) {
      if (!placed.position || !placed.placedOrientation) continue;
      if (
        LoadingEngine3D.checkCollision(
          x, y, z, l, w, h,
          placed.position.x, placed.position.y, placed.position.z,
          placed.placedOrientation.length, placed.placedOrientation.width, placed.placedOrientation.height
        )
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks base support for items elevated off the floor (z > 0)
   */
  hasSolidSupport(x: number, y: number, z: number, l: number, w: number): boolean {
    if (z === 0) return true; // Ground level is solid

    // Calculate covered area below
    let coveredArea = 0;
    const itemArea = l * w;

    for (const placed of this.result) {
      if (!placed.position || !placed.placedOrientation) continue;
      const px = placed.position.x;
      const py = placed.position.y;
      const pz = placed.position.z;
      const pl = placed.placedOrientation.length;
      const pw = placed.placedOrientation.width;
      const ph = placed.placedOrientation.height;

      // Check if placed item top surface touches the bottom of candidate position
      if (pz + ph === z) {
        const overlapX = Math.max(0, Math.min(x + l, px + pl) - Math.max(x, px));
        const overlapY = Math.max(0, Math.min(y + w, py + pw) - Math.max(y, py));
        coveredArea += overlapX * overlapY;
      }
    }

    // Requires at least 65% support underneath
    return coveredArea >= itemArea * 0.65;
  }

  /**
   * Evaluates and scores candidate position & orientation
   */
  evaluatePosition(space: Position, orient: Orientation): number {
    if (!this.truck) return -999999;

    let score = 1000;

    // Lower Z is heavily favored for stability
    score -= space.z * 30;

    // Pushing cargo toward front bulk (lower X)
    score -= space.x * 2;

    // Centerline alignment penalty on Y axis
    const centerOffset = Math.abs(space.y + orient.width / 2 - this.truck.width / 2);
    score -= centerOffset * 5;

    // Floor contact bonus (+200)
    if (this.isTouchingFloor(space.z)) {
      score += 200;
    }

    // Side and front wall contact bonus (+80)
    if (this.isTouchingWall(space, orient)) {
      score += 80;
    }

    return score;
  }

  /**
   * Checks if position rests directly on the truck floor
   */
  isTouchingFloor(z: number): boolean {
    return z === 0;
  }

  /**
   * Checks if position touches container walls
   */
  isTouchingWall(space: Position, orient: Orientation): boolean {
    if (!this.truck) return false;
    return (
      space.x === 0 ||
      space.y === 0 ||
      space.y + orient.width >= this.truck.width - 1
    );
  }

  /**
   * Finds best candidate position and orientation using multi-criteria weighted scoring
   */
  findBestPosition(item: Radiator): { space: Position; orientation: Orientation } | null {
    if (!this.truck) return null;

    let bestOption: { space: Position; orientation: Orientation; score: number } | null = null;
    const orientations = this.getPossibleOrientations(item);

    for (const space of this.freeSpaces) {
      for (const orient of orientations) {
        // Container bounds check
        if (
          space.x + orient.length <= this.truck.length &&
          space.y + orient.width <= this.truck.width &&
          space.z + orient.height <= this.truck.height
        ) {
          // Collision check
          if (this.isColliding(space.x, space.y, space.z, orient.length, orient.width, orient.height)) {
            continue;
          }

          // Support check
          if (!this.hasSolidSupport(space.x, space.y, space.z, orient.length, orient.width)) {
            continue;
          }

          const score = this.evaluatePosition(space, orient);

          if (!bestOption || score > bestOption.score) {
            bestOption = { space, orientation: orient, score };
          }
        }
      }
    }

    return bestOption ? { space: bestOption.space, orientation: bestOption.orientation } : null;
  }

  /**
   * Deduplicates candidate free spaces
   */
  removeDuplicateSpaces() {
    const unique: Position[] = [];
    this.freeSpaces.forEach((space) => {
      const exist = unique.find(
        (p) => p.x === space.x && p.y === space.y && p.z === space.z
      );
      if (!exist) {
        unique.push(space);
      }
    });
    this.freeSpaces = unique;
  }

  /**
   * Sorts free spaces ascending by Z, then Y, then X
   */
  sortFreeSpaces() {
    this.freeSpaces.sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  /**
   * Places an item, generates 3 new candidate extreme positions, and prunes spaces
   */
  placeItem(item: Radiator): boolean {
    const best = this.findBestPosition(item);
    if (!best) {
      return false;
    }

    const { space, orientation } = best;
    item.position = space;
    item.placedOrientation = orientation;
    this.result.push(item);

    // Generate 3 new candidate free positions (Extreme Points / Space Partitioning)
    this.freeSpaces.push(new Position(space.x + orientation.length, space.y, space.z));
    this.freeSpaces.push(new Position(space.x, space.y + orientation.width, space.z));
    this.freeSpaces.push(new Position(space.x, space.y, space.z + orientation.height));

    this.removeDuplicateSpaces();
    this.sortFreeSpaces();
    return true;
  }

  /**
   * Packs items using First-Fit Decreasing (FFD) heuristic based on volume & weight
   */
  packItems() {
    // Sort items by volume * weight descending for maximum packing density
    const sortedItems = [...this.items].sort((a, b) => {
      const volA = a.length * a.width * a.height;
      const volB = b.length * b.width * b.height;
      if (volA !== volB) return volB - volA;
      return b.weight - a.weight;
    });

    const unplaced: Radiator[] = [];

    for (const item of sortedItems) {
      const placed = this.placeItem(item);
      if (!placed) {
        unplaced.push(item);
      }
    }

    if (unplaced.length > 0) {
      console.warn(`${unplaced.length} radiator(s) could not fit inside truck container.`);
    }
  }

  /**
   * Calculates 3D Center of Gravity (CoG) with moments
   */
  calculateCenterOfGravity(): { x: number; y: number; z: number; totalWeight: number } {
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (const item of this.result) {
      if (!item.position || !item.placedOrientation) continue;
      const cx = item.position.x + item.placedOrientation.length / 2;
      const cy = item.position.y + item.placedOrientation.width / 2;
      const cz = item.position.z + item.placedOrientation.height / 2;

      totalWeight += item.weight;
      sumX += cx * item.weight;
      sumY += cy * item.weight;
      sumZ += cz * item.weight;
    }

    if (totalWeight === 0) {
      return { x: 0, y: 0, z: 0, totalWeight: 0 };
    }

    return {
      x: Math.round((sumX / totalWeight) * 10) / 10,
      y: Math.round((sumY / totalWeight) * 10) / 10,
      z: Math.round((sumZ / totalWeight) * 10) / 10,
      totalWeight
    };
  }

  /**
   * Checks truck gross payload weight limit
   */
  checkWeight(): boolean {
    if (!this.truck) return false;
    let total = 0;
    for (const item of this.items) {
      total += item.weight;
    }
    return total <= this.truck.capacity;
  }

  /**
   * Calculates structural stacking weight/pressure pressing down on a specific radiator
   */
  calculatePressure(item: Radiator): number {
    if (!item.position || !item.placedOrientation) return 0;
    let totalPressureKg = 0;

    const ix = item.position.x;
    const iy = item.position.y;
    const iz = item.position.z;
    const il = item.placedOrientation.length;
    const iw = item.placedOrientation.width;
    const ih = item.placedOrientation.height;

    for (const other of this.result) {
      if (other.id === item.id || !other.position || !other.placedOrientation) continue;
      // Must be physically sitting on top or higher
      if (other.position.z >= iz + ih) {
        // Check horizontal XY overlap
        const ox = other.position.x;
        const oy = other.position.y;
        const ol = other.placedOrientation.length;
        const ow = other.placedOrientation.width;

        const overlapX = Math.max(0, Math.min(ix + il, ox + ol) - Math.max(ix, ox));
        const overlapY = Math.max(0, Math.min(iy + iw, oy + ow) - Math.max(iy, oy));

        if (overlapX > 0 && overlapY > 0) {
          const overlapRatio = (overlapX * overlapY) / (ol * ow);
          totalPressureKg += other.weight * overlapRatio;
        }
      }
    }

    return Math.round(totalPressureKg * 10) / 10;
  }

  /**
   * Checks for stacking pressure threshold warnings across all placed items
   */
  checkPressureWarnings(maxPressureKg = 250): { item: Radiator; pressure: number }[] {
    const warnings: { item: Radiator; pressure: number }[] = [];
    for (const item of this.result) {
      const pressure = this.calculatePressure(item);
      if (pressure > maxPressureKg) {
        warnings.push({ item, pressure });
      }
    }
    return warnings;
  }

  /**
   * Calculates weight distribution between Front and Rear container halves
   */
  calculateFrontRearBalance(): { frontWeight: number; rearWeight: number; difference: number; percentFront: number } {
    if (!this.truck) return { frontWeight: 0, rearWeight: 0, difference: 0, percentFront: 50 };

    const middleX = this.truck.length / 2;
    let frontWeight = 0;
    let rearWeight = 0;

    for (const item of this.result) {
      if (!item.position || !item.placedOrientation) continue;
      const cx = item.position.x + item.placedOrientation.length / 2;
      if (cx < middleX) {
        frontWeight += item.weight;
      } else {
        rearWeight += item.weight;
      }
    }

    const total = frontWeight + rearWeight;
    const percentFront = total > 0 ? Math.round((frontWeight / total) * 100) : 50;

    return {
      frontWeight: Math.round(frontWeight),
      rearWeight: Math.round(rearWeight),
      difference: Math.abs(Math.round(frontWeight - rearWeight)),
      percentFront
    };
  }

  /**
   * Calculates weight balance between Left and Right container walls
   */
  calculateLeftRightBalance(): { leftWeight: number; rightWeight: number; difference: number; percentLeft: number } {
    if (!this.truck) return { leftWeight: 0, rightWeight: 0, difference: 0, percentLeft: 50 };

    const middleY = this.truck.width / 2;
    let leftWeight = 0;
    let rightWeight = 0;

    for (const item of this.result) {
      if (!item.position || !item.placedOrientation) continue;
      const cy = item.position.y + item.placedOrientation.width / 2;
      if (cy < middleY) {
        leftWeight += item.weight;
      } else {
        rightWeight += item.weight;
      }
    }

    const total = leftWeight + rightWeight;
    const percentLeft = total > 0 ? Math.round((leftWeight / total) * 100) : 50;

    return {
      leftWeight: Math.round(leftWeight),
      rightWeight: Math.round(rightWeight),
      difference: Math.abs(Math.round(leftWeight - rightWeight)),
      percentLeft
    };
  }

  /**
   * Calculates total support area under a placed radiator (from items directly underneath)
   */
  calculateSupportArea(item: Radiator): number {
    if (!item.position || !item.placedOrientation) return 0;

    let supportArea = 0;
    const ix = item.position.x;
    const iy = item.position.y;
    const iz = item.position.z;
    const il = item.placedOrientation.length;
    const iw = item.placedOrientation.width;

    if (iz === 0) {
      return il * iw; // Ground floor gives 100% support
    }

    // Find items directly touching bottom face
    for (const other of this.result) {
      if (other.id === item.id || !other.position || !other.placedOrientation) continue;
      if (other.position.z + other.placedOrientation.height === iz) {
        const ox = other.position.x;
        const oy = other.position.y;
        const ol = other.placedOrientation.length;
        const ow = other.placedOrientation.width;

        const overlapX = Math.max(0, Math.min(ix + il, ox + ol) - Math.max(ix, ox));
        const overlapY = Math.max(0, Math.min(iy + iw, oy + ow) - Math.max(iy, oy));

        if (overlapX > 0 && overlapY > 0) {
          supportArea += overlapX * overlapY;
        }
      }
    }

    return supportArea;
  }

  /**
   * Checks stability (requires >= 80% support area for elevated items)
   */
  isStable(item: Radiator): boolean {
    if (!item.position || !item.placedOrientation) return false;
    if (item.position.z === 0) return true;

    const supportArea = this.calculateSupportArea(item);
    const totalArea = item.placedOrientation.length * item.placedOrientation.width;
    if (totalArea === 0) return false;

    return (supportArea / totalArea) >= 0.80;
  }

  /**
   * Checks stability across all placed radiators
   */
  checkStability(): { item: Radiator; message: string; ratio: number }[] {
    const warnings: { item: Radiator; message: string; ratio: number }[] = [];
    for (const item of this.result) {
      if (!this.isStable(item)) {
        const totalArea = item.placedOrientation ? item.placedOrientation.length * item.placedOrientation.width : 1;
        const supportArea = this.calculateSupportArea(item);
        const ratio = Math.round((supportArea / totalArea) * 100);
        warnings.push({
          item,
          message: `پایداری ناکافی (پوشش زیرین ${ratio}٪ - حداقل ۸۰٪ نیاز است)`,
          ratio
        });
      }
    }
    return warnings;
  }

  /**
   * Calculates total volume of packed radiators (cm³)
   */
  calculateUsedVolume(): number {
    let volume = 0;
    for (const item of this.result) {
      if (!item.placedOrientation) continue;
      volume += item.placedOrientation.length * item.placedOrientation.width * item.placedOrientation.height;
    }
    return volume;
  }

  /**
   * Calculates unused free volume of container (cm³)
   */
  calculateFreeVolume(): number {
    if (!this.truck) return 0;
    const truckVolume = this.truck.length * this.truck.width * this.truck.height;
    return Math.max(0, truckVolume - this.calculateUsedVolume());
  }

  /**
   * Generates complete 3D Loading Engine Report object
   */
  generateFullReport() {
    const cog = this.calculateCenterOfGravity();
    const balance = this.calculateLeftRightBalance();
    const frontRear = this.calculateFrontRearBalance();
    const usedVolume = this.calculateUsedVolume();
    const freeVolume = this.calculateFreeVolume();
    const fillPercent = this.fillRate();
    const isWeightValid = this.checkWeight();

    const pressureWarnings = this.checkPressureWarnings();
    const stabilityWarnings = this.checkStability();

    const warningsList: string[] = [];
    if (!isWeightValid) {
      warningsList.push(`وزن بار از ظرفیت مجاز کامیون (${this.truck?.capacity} kg) بیشتر است!`);
    }
    pressureWarnings.forEach(w => {
      warningsList.push(`رادیاتور ${w.item.model} متحمل فشار بالای ${w.pressure} kg است.`);
    });
    stabilityWarnings.forEach(s => {
      warningsList.push(`رادیاتور ${s.item.model}: ${s.message}`);
    });

    return {
      truck: this.truck,
      layout: this.result,
      totalWeight: cog.totalWeight,
      fillPercent,
      usedVolume,
      freeVolume,
      centerOfGravity: cog,
      balance,
      frontRear,
      warnings: warningsList
    };
  }

  /**
   * Calculates container volume fill percentage
   */
  fillRate(): number {
    if (!this.truck) return 0;

    let totalCargoVolume = 0;
    for (const item of this.result) {
      if (!item.placedOrientation) continue;
      totalCargoVolume += item.placedOrientation.length * item.placedOrientation.width * item.placedOrientation.height;
    }

    const truckVolume = this.truck.length * this.truck.width * this.truck.height;
    if (truckVolume === 0) return 0;

    return Math.min(100, Math.round((totalCargoVolume / truckVolume) * 1000) / 10);
  }
}
