import React, { useState } from 'react';
import { MapPin, Plus, Trash2, ArrowUpDown, Layers, Check, Info } from 'lucide-react';
import { DestinationInfo, DestinationStop, RadiatorCounts } from '../types';
import { RADIATOR_SIZES } from '../data/presets';
import { toPersianDigits } from '../utils/persianDigits';

interface MultiStopCardProps {
  destinationInfo: DestinationInfo;
  onChange: (info: DestinationInfo) => void;
  lifoEnabled: boolean;
  onToggleLifo: (enabled: boolean) => void;
}

export const MultiStopCard: React.FC<MultiStopCardProps> = ({
  destinationInfo,
  onChange,
  lifoEnabled,
  onToggleLifo
}) => {
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const stops = destinationInfo.stops || [];

  const handleAddStop = () => {
    if (!newCity.trim()) return;
    const newStop: DestinationStop = {
      id: 'stop_' + Date.now(),
      cityName: newCity.trim(),
      address: newAddress.trim() || 'آدرس نامشخص',
      orderIndex: stops.length + 1,
      counts: { 60: 0, 80: 0, 100: 5, 120: 5, 140: 0, 160: 0, 180: 0 }
    };
    const updatedStops = [...stops, newStop];
    onChange({
      ...destinationInfo,
      stops: updatedStops
    });
    setNewCity('');
    setNewAddress('');
  };

  const handleRemoveStop = (id: string) => {
    const updatedStops = stops.filter(s => s.id !== id).map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    onChange({
      ...destinationInfo,
      stops: updatedStops
    });
  };

  const handleUpdateCount = (stopId: string, size: keyof RadiatorCounts, delta: number) => {
    const updatedStops = stops.map(st => {
      if (st.id === stopId) {
        const val = Math.max(0, (st.counts[size] || 0) + delta);
        return {
          ...st,
          counts: {
            ...st.counts,
            [size]: val
          }
        };
      }
      return st;
    });
    onChange({
      ...destinationInfo,
      stops: updatedStops
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <span>مدیریت چیدمان چند مقصدی (مسیرهای تفکیکی LIFO)</span>
        </div>

        {/* LIFO Toggle Switch */}
        <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={lifoEnabled}
            onChange={(e) => onToggleLifo(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            قانون چیدمان LIFO (مقصد اول = چیدمان آخر جلوی درب)
          </span>
        </label>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          در سیستم چند مقصدی، رادیاتورهایی که باید در مقصد اول (تخلیه ۱) پیاده شوند، در انتهایی‌ترین بخش کامیون (نزدیک به درب خروجی) چیده می‌شوند تا نیازی به جابجایی سایر بارها نباشد.
        </span>
      </div>

      {/* Add new stop input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="نام مقصد (مثلاً: اراک - انبار مرکزی)"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="آدرس دقیق یا توضیحات تحویل‌گیرنده"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddStop}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مقصد تخلیه</span>
        </button>
      </div>

      {/* Stops list */}
      {stops.length === 0 ? (
        <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          هنوز مقصد فرعی تعریف نشده است. بار به عنوان تک‌مقصده چیده می‌شود.
        </p>
      ) : (
        <div className="space-y-4">
          {stops.map((stop, idx) => {
            const totalStopPieces = RADIATOR_SIZES.reduce((sum, sz) => sum + (stop.counts[sz] || 0), 0);
            return (
              <div
                key={stop.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/40 dark:bg-slate-800/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        تخلیه {toPersianDigits(idx + 1)}: {stop.cityName}
                      </span>
                      <span className="text-xs text-slate-400 block">{stop.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                      {toPersianDigits(totalStopPieces)} رادیاتور
                    </span>
                    <button
                      onClick={() => handleRemoveStop(stop.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="حذف مقصد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Size Counters for this stop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                  {RADIATOR_SIZES.map((sz) => {
                    const c = stop.counts[sz] || 0;
                    return (
                      <div
                        key={sz}
                        className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center"
                      >
                        <span className="text-[10px] text-slate-400 font-bold block">سایز {toPersianDigits(sz)}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <button
                            onClick={() => handleUpdateCount(stop.id, sz, -1)}
                            className="w-5 h-5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold hover:bg-slate-200 transition"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold font-mono px-1">{toPersianDigits(c)}</span>
                          <button
                            onClick={() => handleUpdateCount(stop.id, sz, 1)}
                            className="w-5 h-5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold hover:bg-slate-200 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
