import React, { useState, useEffect } from 'react';
import { History, Save, Trash2, Download, CheckCircle, Truck, Calendar, MapPin, Package, X } from 'lucide-react';
import { SavedLoadingRecord, RadiatorCounts, TruckDetails, DestinationInfo } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCounts: RadiatorCounts;
  currentTruck: TruckDetails;
  currentDestination: DestinationInfo;
  totalPieces: number;
  totalWeight: number;
  totalCost: number;
  onLoadRecord: (record: SavedLoadingRecord) => void;
}

const LOCAL_STORAGE_KEY = 'radiator_cargo_history_v1';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  currentCounts,
  currentTruck,
  currentDestination,
  totalPieces,
  totalWeight,
  totalCost,
  onLoadRecord
}) => {
  const [records, setRecords] = useState<SavedLoadingRecord[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecords(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const titleToUse = saveTitle.trim() || `بارگیری ${currentTruck.model || 'خودرو'} - ${new Date().toLocaleDateString('fa-IR')}`;
    const newRecord: SavedLoadingRecord = {
      id: 'load_' + Date.now(),
      createdAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      title: titleToUse,
      truckName: currentTruck.model || 'کامیون نامشخص',
      plate: currentTruck.plate || 'ثبت‌نشده',
      driverName: currentTruck.driverName || 'نامشخص',
      destination: currentDestination.destination || 'نامشخص',
      totalPieces,
      totalWeight: Math.round(totalWeight),
      totalCost,
      counts: { ...currentCounts },
      truckDetails: { ...currentTruck },
      destinationInfo: { ...currentDestination }
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setSaveTitle('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `radiator_cargo_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            <History className="w-5 h-5" />
            <span>تاریخچه و آرشیو بارگیری‌های ثبت‌شده</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save current section */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Save className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>ذخیره بارگیری فعلی در آرشیو</span>
          </h4>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="عنوان سفارشی برای این بارگیری (مثلاً: پروژه سپهر - پارت ۲)"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveCurrent}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره در آرشیو</span>
            </button>
          </div>
          {saveSuccess && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>بارگیری فعلی با موفقیت در مرورگر ذخیره شد!</span>
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">
              تعداد بارگیری‌های بایگانی شده: {toPersianDigits(records.length)} مورد
            </span>
            {records.length > 0 && (
              <button
                onClick={handleExportJSON}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی نسخه پشتیبان (JSON)</span>
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>هنوز هیچ بارگیری در آرشیو ذخیره نشده است.</p>
              <p className="text-xs text-slate-400 mt-1">با زدن دکمه ذخیره، اطلاعات چیدمان و بارنامه فعلی ثبت می‌شود.</p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {rec.title}
                    </span>
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {toPersianDigits(rec.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-indigo-500" />
                      {rec.truckName} (پلاک: {toPersianDigits(rec.plate)})
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      مقصد: {rec.destination}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      {toPersianDigits(rec.totalPieces)} رادیاتور ({toPersianDigits(rec.totalWeight.toLocaleString())} kg)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onLoadRecord(rec);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>فراخوانی مجدد</span>
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title="حذف از آرشیو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-300 transition"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
