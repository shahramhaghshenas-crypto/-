import React from 'react';
import { DollarSign, Truck, ShieldCheck, Edit3, CheckCircle2, Package } from 'lucide-react';
import { ShippingCostInfo, FeatureAccess } from '../types';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

interface ShippingCostCardProps {
  costInfo: ShippingCostInfo;
  palletTotalCost?: number;
  usePallets?: boolean;
  palletCount?: number;
  onChange: (info: ShippingCostInfo) => void;
  access?: FeatureAccess;
}

export const ShippingCostCard: React.FC<ShippingCostCardProps> = ({
  costInfo,
  palletTotalCost = 0,
  usePallets = false,
  palletCount = 0,
  onChange,
  access = 'active'
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  // Base calculated freight from distance & rate
  const distanceFreight = costInfo.distanceKm * costInfo.ratePerKm + costInfo.fixedCost;
  const activeFreight = costInfo.isManualFreight ? costInfo.customFreightCost : distanceFreight;
  const grandTotalCost = activeFreight + costInfo.insuranceCost + costInfo.driverAllowance + (usePallets ? palletTotalCost : 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <span>محاسبه و تغییر دستی هزینه کرایه باربری و پالت (به تومان)</span>
        </div>

        {/* Manual Freight Override Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <input
            type="checkbox"
            checked={costInfo.isManualFreight}
            disabled={isReadOnly}
            onChange={(e) => onChange({ ...costInfo, isManualFreight: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>تعیین دستی مبلغ کرایه باربری</span>
        </label>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Manual Freight Amount or Distance Formula */}
        {costInfo.isManualFreight ? (
          <div>
            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
              مبلغ کرایه باربری دستی (تومان):
            </label>
            <input
              type="number"
              disabled={isReadOnly}
              value={costInfo.customFreightCost}
              onChange={(e) =>
                onChange({ ...costInfo, customFreightCost: Math.max(0, Number(e.target.value)), totalCost: grandTotalCost })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                مسافت تخمینی (کیلومتر):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={costInfo.distanceKm}
                onChange={(e) =>
                  onChange({ ...costInfo, distanceKm: Math.max(0, Number(e.target.value)), totalCost: grandTotalCost })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                نرخ کرایه هر کیلومتر (تومان):
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={costInfo.ratePerKm}
                onChange={(e) =>
                  onChange({ ...costInfo, ratePerKm: Math.max(0, Number(e.target.value)), totalCost: grandTotalCost })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {/* Insurance Cost */}
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
            هزینه بیمه بار (تومان):
          </label>
          <input
            type="number"
            disabled={isReadOnly}
            value={costInfo.insuranceCost}
            onChange={(e) =>
              onChange({ ...costInfo, insuranceCost: Math.max(0, Number(e.target.value)), totalCost: grandTotalCost })
            }
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Driver Allowance */}
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
            حق‌الزحمه و حق خواب راننده (تومان):
          </label>
          <input
            type="number"
            disabled={isReadOnly}
            value={costInfo.driverAllowance}
            onChange={(e) =>
              onChange({ ...costInfo, driverAllowance: Math.max(0, Number(e.target.value)), totalCost: grandTotalCost })
            }
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Cost Breakdown Summary Card */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-200 block">صورت‌حساب نهایی ارسال:</span>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span>کرایه باربری: <strong className="text-white font-mono">{fmtPersian(activeFreight)}</strong> تومان</span>
            <span>بیمه: <strong className="text-white font-mono">{fmtPersian(costInfo.insuranceCost)}</strong> تومان</span>
            {usePallets && (
              <span className="text-amber-300 flex items-center gap-1 font-semibold">
                <Package className="w-3.5 h-3.5" />
                هزینه پالت‌ها ({toPersianDigits(palletCount)} عدد): <strong className="text-amber-200 font-mono">{fmtPersian(palletTotalCost)}</strong> تومان
              </span>
            )}
          </div>
        </div>

        <div className="text-right sm:text-left bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
          <span className="text-[11px] text-indigo-200 block">جمع کل قابل پرداخت:</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {fmtPersian(grandTotalCost)} تومان
          </span>
        </div>
      </div>
    </div>
  );
};
