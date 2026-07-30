import React from 'react';
import { MapPin, Calendar, Clock, FileText, ArrowDownUp } from 'lucide-react';
import { DestinationInfo, FeatureAccess } from '../types';

interface DestinationCardProps {
  info: DestinationInfo;
  onChange: (info: DestinationInfo) => void;
  access: FeatureAccess;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  info,
  onChange,
  access
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          اطلاعات مقصد و زمان‌بندی بارگیری
        </h2>
        <span className="text-xs text-slate-400 font-medium">اطلاعات ترابری</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">شهر / آدرس مقصد</label>
          <input
            type="text"
            placeholder="مثلاً اصفهان، شهرک صنعتی"
            value={info.destination}
            onChange={(e) => onChange({ ...info, destination: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">تاریخ بارگیری</label>
          <input
            type="date"
            value={info.loadDate}
            onChange={(e) => onChange({ ...info, loadDate: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ساعت بارگیری</label>
          <input
            type="time"
            value={info.loadTime}
            onChange={(e) => onChange({ ...info, loadTime: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">زمان تخمینی تخلیه</label>
          <input
            type="datetime-local"
            value={info.unloadTime}
            onChange={(e) => onChange({ ...info, unloadTime: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Textareas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            توضیحات تکمیلی بارگیری
          </label>
          <textarea
            rows={3}
            placeholder="ملاحظات خاص بسته بندی یا احتیاط در حمل..."
            value={info.notes}
            onChange={(e) => onChange({ ...info, notes: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <ArrowDownUp className="w-3.5 h-3.5 text-blue-500" />
            ترتیب بارگیری پیشنهادی
          </label>
          <textarea
            rows={3}
            placeholder="مثلاً: ۱. رادیاتورهای ۱۸۰ و ۱۶۰، ۲. رادیاتورهای ۱۲۰..."
            value={info.loadOrder}
            onChange={(e) => onChange({ ...info, loadOrder: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <ArrowDownUp className="w-3.5 h-3.5 text-amber-500" />
            ترتیب تخلیه پیشنهادی
          </label>
          <textarea
            rows={3}
            placeholder="مثلاً: انبار شماره ۱ در ابتدا، سپس انبار شماره ۲..."
            value={info.unloadOrder}
            onChange={(e) => onChange({ ...info, unloadOrder: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          />
        </div>
      </div>
    </div>
  );
};
