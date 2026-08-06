import { RadiatorCounts, TruckDetails, LayoutRules } from '../types';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class Validator {
  /**
   * Validates radiator counts order or order object
   */
  static checkOrder(countsOrOrder: RadiatorCounts | { items: any[]; customer?: string; truck?: any }): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if ('items' in countsOrOrder && Array.isArray(countsOrOrder.items)) {
      if (countsOrOrder.items.length === 0) {
        issues.push({ field: 'items', message: 'هیچ رادیاتوری انتخاب نشده است.', severity: 'error' });
      }
      if (!countsOrOrder.customer || countsOrOrder.customer.trim() === '') {
        issues.push({ field: 'customer', message: 'نام مشتری وارد نشده است.', severity: 'error' });
      }
      if (!countsOrOrder.truck) {
        issues.push({ field: 'truck', message: 'خودرو انتخاب نشده است.', severity: 'error' });
      }
      return issues;
    }

    const counts = countsOrOrder as RadiatorCounts;
    const totalCount = Object.values(counts).reduce((acc, val) => acc + (Number(val) || 0), 0);

    if (totalCount <= 0) {
      issues.push({
        field: 'counts',
        message: 'هیچ رادیاتوری انتخاب نشده است. حداقل یک رادیاتور ثبت کنید.',
        severity: 'error'
      });
    }

    // Check for negative quantities
    for (const [sz, qty] of Object.entries(counts)) {
      if (qty < 0) {
        issues.push({
          field: `counts.${sz}`,
          message: `تعداد رادیاتور سایز ${sz} نمی‌تواند منفی باشد.`,
          severity: 'error'
        });
      }
    }

    return issues;
  }

  /**
   * Validate item quantity
   */
  static checkQuantity(item: { quantity: number }): boolean {
    return item && item.quantity > 0;
  }

  /**
   * Validate weight limit
   */
  static checkWeight(weight: number, maxWeight: number): boolean {
    return weight <= maxWeight;
  }

  /**
   * Validate item dimensions against container dimensions
   */
  static checkDimensions(
    item: { length: number; width: number; height: number },
    truck: { L: number; W: number; H?: number }
  ): boolean {
    const truckH = truck.H || 240;
    return (
      item.length <= truck.L &&
      item.width <= truck.W &&
      item.height <= truckH
    );
  }

  /**
   * Validates truck dimensions and capacity against loaded weight
   */
  static checkTruck(truckDetails: TruckDetails, totalWeightKg: number, totalVolumeM3: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!truckDetails.model || truckDetails.model.trim() === '') {
      issues.push({
        field: 'truck.model',
        message: 'مدیل خودرو انتخاب یا تعریف نشده است.',
        severity: 'error'
      });
    }

    if (truckDetails.L <= 0 || truckDetails.W <= 0) {
      issues.push({
        field: 'truck.dimensions',
        message: 'ابعاد کانتینر کامیون (طول و عرض) باید بزرگتر از صفر باشند.',
        severity: 'error'
      });
    }

    if (totalWeightKg > truckDetails.cap) {
      issues.push({
        field: 'truck.capacity',
        message: `وزن کل بار (${totalWeightKg} kg) از ظرفیت مجاز خودرو (${truckDetails.cap} kg) بیشتر است!`,
        severity: 'error'
      });
    } else if (totalWeightKg > truckDetails.cap * 0.95) {
      issues.push({
        field: 'truck.capacity_warning',
        message: 'وزن بار به 95٪ ظرفیت مجاز کامیون رسیده است.',
        severity: 'warning'
      });
    }

    return issues;
  }

  /**
   * Validates layout rules (max height, max layers, axle limit)
   */
  static checkLayoutRules(rules: LayoutRules): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (rules.maxH < 50 || rules.maxH > 400) {
      issues.push({
        field: 'rules.maxH',
        message: 'ارتفاع مجاز چیدمان باید بین 50 سانتی‌متر تا 400 سانتی‌متر باشد.',
        severity: 'warning'
      });
    }

    if (rules.axleLimit > 0 && rules.axleLimit < 500) {
      issues.push({
        field: 'rules.axleLimit',
        message: 'حد بار مجاز محور غیرعادی تنظیم شده است.',
        severity: 'info'
      });
    }

    return issues;
  }
}
