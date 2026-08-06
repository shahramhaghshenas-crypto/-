import React, { useState } from 'react';
import { User, Phone, CreditCard, ShieldCheck, Truck, Plus, Check, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { DriverRecord, TruckDetails } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface DriverRegistrationCardProps {
  drivers: DriverRecord[];
  onAddDriver: (driver: Omit<DriverRecord, 'id' | 'createdAt'>) => void;
  onDeleteDriver: (id: string) => void;
  onSelectDriverForCurrentLoad: (driver: DriverRecord) => void;
  currentTruckDetails?: TruckDetails;
  onUpdateTruckDetails?: (details: TruckDetails) => void;
}

export const DriverRegistrationCard: React.FC<DriverRegistrationCardProps> = ({
  drivers,
  onAddDriver,
  onDeleteDriver,
  onSelectDriverForCurrentLoad,
  currentTruckDetails,
  onUpdateTruckDetails
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNo: '',
    plate: '',
    transportCompany: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      alert('لطفاً نام، نام خانوادگی و شماره موبایل راننده را وارد کنید.');
      return;
    }

    onAddDriver({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      licenseNo: formData.licenseNo.trim(),
      plate: formData.plate.trim(),
      transportCompany: formData.transportCompany.trim() || 'شرکت حمل باربری کارخانه'
    });

    // Also update active shipment if requested
    if (currentTruckDetails && onUpdateTruckDetails) {
      onUpdateTruckDetails({
        ...currentTruckDetails,
        driverName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        driverPhone: formData.phone.trim(),
        plate: formData.plate.trim() || currentTruckDetails.plate
      });
    }

    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      licenseNo: '',
      plate: '',
      transportCompany: ''
    });

    setSuccessMsg('اطلاعات راننده با موفقیت در سیستم کارخانه ثبت و بر روی بار جاری اعمال شد.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const filteredDrivers = drivers.filter(d =>
    d.firstName.includes(searchQuery) ||
    d.lastName.includes(searchQuery) ||
    d.phone.includes(searchQuery) ||
    d.plate.includes(searchQuery) ||
    d.transportCompany.includes(searchQuery)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 dark:shadow-none">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
              ثبت و مدیریت اطلاعات راننده (فاز ۲)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ثبت هویت، گواهینامه، شماره تماس و پلاک ناوگان حمل‌ونقل کارخانه
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

      {/* Driver Registration Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
          فرم ثبت مشخصات راننده جدید
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              نام راننده <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="مثال: علی"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="مثال: محمدی"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شماره موبایل <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="مثال: 09123456789"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شماره گواهینامه
            </label>
            <input
              type="text"
              value={formData.licenseNo}
              onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
              placeholder="مثال: 9823415678"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شماره پلاک کامیون
            </label>
            <input
              type="text"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              placeholder="مثال: 78 ع 456 ایران 22"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شرکت حمل‌ونقل / باربری
            </label>
            <input
              type="text"
              value={formData.transportCompany}
              onChange={(e) => setFormData({ ...formData, transportCompany: e.target.value })}
              placeholder="مثال: ترابر سریع آریا"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>ذخیره راننده</span>
          </button>
        </div>
      </form>

      {/* Saved Drivers Table & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>بانک اطلاعات رانندگان کارخانه</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-mono font-bold">
              {toPersianDigits(drivers.length)} راننده
            </span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی راننده، پلاک یا شرکت..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {filteredDrivers.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            هیچ راننده‌ای یافت نشد. می‌توانید با فرم بالا راننده جدید اضافه کنید.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">شماره تماس</th>
                  <th className="p-3">شماره گواهینامه</th>
                  <th className="p-3">پلاک</th>
                  <th className="p-3">شرکت حمل</th>
                  <th className="p-3 text-center">عملیات بار جاری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredDrivers.map((d) => {
                  const isCurrentlyAssigned = currentTruckDetails?.driverName === `${d.firstName} ${d.lastName}`;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                      <td className="p-3 font-bold">
                        {d.firstName} {d.lastName}
                      </td>
                      <td className="p-3 font-mono dir-ltr text-right">{toPersianDigits(d.phone)}</td>
                      <td className="p-3 font-mono dir-ltr text-right">{d.licenseNo ? toPersianDigits(d.licenseNo) : '—'}</td>
                      <td className="p-3 font-semibold">{d.plate ? toPersianDigits(d.plate) : '—'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{d.transportCompany || '—'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectDriverForCurrentLoad(d)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                              isCurrentlyAssigned
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {isCurrentlyAssigned ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>راننده بار جاری</span>
                              </>
                            ) : (
                              <span>انتخاب برای بار جاری</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDriver(d.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="حذف راننده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
