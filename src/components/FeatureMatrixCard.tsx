import React from 'react';
import { Lock, ShieldAlert, CheckCircle, Eye, XCircle } from 'lucide-react';
import { FeatureDef, FeatureAccess, FeatureKey, UserRole } from '../types';
import { FEATURE_DEFS } from '../data/presets';

interface FeatureMatrixCardProps {
  accessMatrix: Record<UserRole, Record<FeatureKey, FeatureAccess>>;
  onAccessChange: (role: UserRole, key: FeatureKey, val: FeatureAccess) => void;
  access: FeatureAccess;
}

export const FeatureMatrixCard: React.FC<FeatureMatrixCardProps> = ({
  accessMatrix,
  onAccessChange,
  access
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const getStatusBadge = (val: FeatureAccess) => {
    switch (val) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            🟢 فعال
          </span>
        );
      case 'view':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 rounded-full">
            <Eye className="w-3 h-3 text-amber-500" />
            🟡 فقط مشاهده
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 rounded-full">
            🔴 غیرفعال
          </span>
        );
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          ماتریس دسترسی‌ها و مدیریت سطوح کاربران
        </h2>
        <span className="text-xs text-slate-400 font-medium">سطوح: مدیر / انباردار</span>
      </div>

      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        امکان تعیین دسترسی برای هر بخش سیستم به ۳ حالت: <b>🟢 فعال کامل</b>، <b>🟡 فقط مشاهده</b>، و <b>🔴 غیرفعال (مخفی)</b>.
      </p>

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold bg-slate-50">
              <th className="py-3 px-4 rounded-r-xl">قابلیت / ماژول</th>
              <th className="py-3 px-4">سطح مدیر (Manager)</th>
              <th className="py-3 px-4">سطح انباردار (Worker)</th>
              <th className="py-3 px-4 rounded-l-xl">وضعیت فعلی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {FEATURE_DEFS.map((f) => (
              <tr key={f.key} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-bold text-slate-800">{f.label}</td>
                
                {/* Manager dropdown */}
                <td className="py-3 px-4">
                  <select
                    value={accessMatrix.manager[f.key]}
                    onChange={(e) => onAccessChange('manager', f.key, e.target.value as FeatureAccess)}
                    disabled={isReadOnly}
                    className="bg-white border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">🟢 فعال</option>
                    <option value="view">🟡 فقط مشاهده</option>
                    <option value="disabled">🔴 غیرفعال</option>
                  </select>
                </td>

                {/* Worker dropdown */}
                <td className="py-3 px-4">
                  <select
                    value={accessMatrix.worker[f.key]}
                    onChange={(e) => onAccessChange('worker', f.key, e.target.value as FeatureAccess)}
                    disabled={isReadOnly}
                    className="bg-white border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">🟢 فعال</option>
                    <option value="view">🟡 فقط مشاهده</option>
                    <option value="disabled">🔴 غیرفعال</option>
                  </select>
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4">
                  {getStatusBadge(accessMatrix.manager[f.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
