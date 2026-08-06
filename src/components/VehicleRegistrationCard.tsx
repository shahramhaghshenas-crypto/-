import React, { useState } from 'react';
import { Truck, Plus, Search, Trash2, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { CustomVehicleRecord, TruckDetails } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface VehicleRegistrationCardProps {
  customVehicles: CustomVehicleRecord[];
  onAddVehicle: (vehicle: Omit<CustomVehicleRecord, 'id' | 'createdAt'>) => void;
  onDeleteVehicle: (id: string) => void;
  onSelectVehicleForCurrentLoad: (v: CustomVehicleRecord) => void;
  currentTruckDetails: TruckDetails;
  onUpdateTruckDetails: (details: TruckDetails) => void;
}

export const VehicleRegistrationCard: React.FC<VehicleRegistrationCardProps> = ({
  customVehicles,
  onAddVehicle,
  onDeleteVehicle,
  onSelectVehicleForCurrentLoad,
  currentTruckDetails,
  onUpdateTruckDetails
}) => {
  const [formData, setFormData] = useState({
    model: '',
    cap: '',
    L: '',
    W: '',
    height: '180',
    plate: ''
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim() || !formData.cap || !formData.L || !formData.W) {
      alert('لطفاً نوع خودرو، ظرفیت وزنی، طول و عرض اتاق را وارد کنید.');
      return;
    }

    const capNum = Math.max(100, parseInt(formData.cap) || 0);
    const lNum = Math.max(50, parseInt(formData.L) || 0);
    const wNum = Math.max(50, parseInt(formData.W) || 0);
    const hNum = Math.max(50, parseInt(formData.height) || 180);

    const newVehicle: Omit<CustomVehicleRecord, 'id' | 'createdAt'> = {
      model: formData.model.trim(),
      cap: capNum,
      L: lNum,
      W: wNum,
      height: hNum,
      plate: formData.plate.trim()
    };

    onAddVehicle(newVehicle);

    // Apply to current load automatically
    onUpdateTruckDetails({
      ...currentTruckDetails,
      model: formData.model.trim(),
      cap: capNum,
      L: lNum,
      W: wNum,
      plate: formData.plate.trim() || currentTruckDetails.plate
    });

    setFormData({
      model: '',
      cap: '',
      L: '',
      W: '',
      height: '180',
      plate: ''
    });

    setSuccessMsg('خودروی جدید با موفقیت ثبت و مشخصات آن بر روی بارگیری جاری اعمال شد.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200 dark:shadow-none">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
              ثبت و مشخصات خودرو (فاز ۲)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ثبت نوع خودرو، ظرفیت وزنی (تن/کیلوگرم)، ابعاد دقیق اتاق (طول، عرض، ارتفاع) و شماره پلاک
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Vehicle Registration Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
          فرم ثبت مشخصات خودروی جدید
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              نوع و مدل خودرو <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="مثال: خاور ۶ تن جدید، ایسوزو ۶ تن، تریلی ترانزیت"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              ظرفیت وزنی (کیلوگرم) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.cap}
              onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
              placeholder="مثال: 6000 (معادل ۶ تن)"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              طول اتاق (سانتی‌متر) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.L}
              onChange={(e) => setFormData({ ...formData, L: e.target.value })}
              placeholder="مثال: 600 (معادل ۶ متر)"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              عرض اتاق (سانتی‌متر) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.W}
              onChange={(e) => setFormData({ ...formData, W: e.target.value })}
              placeholder="مثال: 220 (معادل ۲.۲ متر)"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              ارتفاع مجاز اتاق (سانتی‌متر)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="مثال: 180 یا 220"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شماره پلاک خودرو
            </label>
            <input
              type="text"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              placeholder="مثال: 44 ج 891 ایران 11"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>ثبت خودرو</span>
          </button>
        </div>
      </form>
    </div>
  );
};
