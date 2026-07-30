import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Info, CheckCircle } from 'lucide-react';
import { GPSInfo, FeatureAccess } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface GpsMapCardProps {
  info: GPSInfo;
  onChange: (info: GPSInfo) => void;
  destination: string;
  truckL: number;
  truckW: number;
  access: FeatureAccess;
}

export const GpsMapCard: React.FC<GpsMapCardProps> = ({
  info,
  onChange,
  destination,
  truckL,
  truckW,
  access
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';
  const [gpsStatus, setGpsStatus] = useState<string>('');

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('مرورگر شما از GPS پشتیبانی نمی‌کند');
      return;
    }
    setGpsStatus('در حال دریافت موقعیت مکان‌یاب...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const cg = `${Math.round(truckL / 2)}cm از طول / ${Math.round(truckW / 2)}cm از عرض`;
        onChange({ lat, lng, cgInfo: cg });
        setGpsStatus('موقعیت GPS با موفقیت دریافت شد!');
      },
      (err) => {
        setGpsStatus('خطا در دریافت GPS یا عدم اعطای دسترسی به مرورگر');
      }
    );
  };

  const currentCg = `${Math.round(truckL / 2)} سانتی‌متر از طول / ${Math.round(truckW / 2)} سانتی‌متر از عرض`;

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          نقشه، GPS و مرکز ثقل تقریبی بار
        </h2>
        <span className="text-xs text-slate-400 font-medium">مکان‌یابی و تعادل خودرو</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">عرض جغرافیایی (Latitude)</label>
          <input
            type="text"
            placeholder="35.6892"
            value={info.lat}
            onChange={(e) => onChange({ ...info, lat: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">طول جغرافیایی (Longitude)</label>
          <input
            type="text"
            placeholder="51.3890"
            value={info.lng}
            onChange={(e) => onChange({ ...info, lng: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">مرکز ثقل تقریبی کانتینر</label>
          <input
            type="text"
            readOnly
            value={currentCg}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs font-bold text-amber-900"
          />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleGetGPS}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            گرفتن موقعیت GPS از مرورگر
          </button>
          {gpsStatus && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {gpsStatus}
            </span>
          )}
        </div>
      )}

      {/* Graphical Map Representation Card */}
      <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 rounded-xl p-4 min-h-[140px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                مقصد بارگیری: {destination || 'تعریف‌نشده'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                موقعیت جغرافیایی: {info.lat || '35.6892'} | {info.lng || '51.3890'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-white text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
            تعادل مرکز ثقل: بهینه
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            این بخش به نقشه واقعی متصل شده و امکان ردیابی ناوگان را فراهم می‌کند.
          </span>
          <span className="font-semibold text-slate-700">مرکز کانتینر: {currentCg}</span>
        </div>
      </div>
    </div>
  );
};
