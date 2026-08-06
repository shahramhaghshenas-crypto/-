import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, AlertTriangle, ArrowRight, Play, RotateCcw, Truck, Box, Scale, ShieldAlert, Volume2, ArrowUp, VolumeX } from 'lucide-react';
import { EvaluationResult, RadiatorData, TruckDetails } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface LiveLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult | null;
  data: RadiatorData;
  truckDetails: TruckDetails;
  operatorName?: string;
}

interface FlattenedPiece {
  id: string;
  size: number;
  weight: number;
  laneIdx: number;
  layerIdx: number;
  posIdx: number;
  isLoaded: boolean;
}

export const LiveLoadingModal: React.FC<LiveLoadingModalProps> = ({
  isOpen,
  onClose,
  result,
  data,
  truckDetails,
  operatorName = 'شهرام'
}) => {
  const [pieces, setPieces] = useState<FlattenedPiece[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');

  // Initialize flattened piece queue based on calculated packing layout
  useEffect(() => {
    if (!result || !result.packed || result.packed.length === 0) {
      // Fallback if no result exists yet
      const fallbackList: FlattenedPiece[] = [];
      data.items.forEach((sz, idx) => {
        fallbackList.push({
          id: `p-${idx + 1}`,
          size: sz,
          weight: Math.round(27 * (sz / 100)),
          laneIdx: idx % 3,
          layerIdx: Math.floor(idx / (3 * 4)),
          posIdx: idx,
          isLoaded: false
        });
      });
      setPieces(fallbackList);
      setCurrentStepIdx(0);
      return;
    }

    const queue: FlattenedPiece[] = [];
    let pieceCounter = 1;

    // Build LIFO / Front-to-Back loading order
    result.packed.forEach((layer, layerIdx) => {
      layer.lanes.forEach((lane, laneIdx) => {
        lane.list.forEach((sz, posIdx) => {
          queue.push({
            id: `p-${pieceCounter++}`,
            size: sz,
            weight: Math.round(27 * (sz / 100)),
            laneIdx,
            layerIdx,
            posIdx,
            isLoaded: false
          });
        });
      });
    });

    setPieces(queue);
    setCurrentStepIdx(0);
  }, [result, data]);

  if (!isOpen) return null;

  const totalCount = pieces.length;
  const loadedCount = pieces.filter(p => p.isLoaded).length;
  const progressPercent = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  const loadedWeight = pieces.filter(p => p.isLoaded).reduce((sum, p) => sum + p.weight, 0);

  // Calculate live balance scores
  const leftLoaded = pieces.filter(p => p.isLoaded && p.laneIdx === 0).reduce((sum, p) => sum + p.weight, 0);
  const rightLoaded = pieces.filter(p => p.isLoaded && p.laneIdx === (result?.lanesCount ? result.lanesCount - 1 : 2)).reduce((sum, p) => sum + p.weight, 0);
  const totalBalance = (leftLoaded + rightLoaded) > 0 ? Math.round((1 - Math.abs(leftLoaded - rightLoaded) / (leftLoaded + rightLoaded)) * 100) : 100;

  const currentNextPiece = pieces.find(p => !p.isLoaded) || null;

  const handleConfirmNextPiece = () => {
    if (!currentNextPiece) return;

    // Check for weight balance anomalies
    const nextLeft = currentNextPiece.laneIdx === 0 ? leftLoaded + currentNextPiece.weight : leftLoaded;
    const nextRight = currentNextPiece.laneIdx === (result?.lanesCount ? result.lanesCount - 1 : 2) ? rightLoaded + currentNextPiece.weight : rightLoaded;
    const nextImbalance = Math.abs(nextLeft - nextRight);

    if (nextImbalance > 500 && (nextLeft + nextRight) > 1000) {
      setAlertMessage(`هشدار تعادل زنده: قرار دادن قطعه در لاین ${currentNextPiece.laneIdx + 1} باعث عدم توازن سمت ${nextLeft > nextRight ? 'راست' : 'چپ'} می‌شود.`);
      if (soundEnabled) playBeep(false);
      setTimeout(() => setAlertMessage(null), 4000);
    } else {
      if (soundEnabled) playBeep(true);
    }

    setPieces(prev => prev.map(p => p.id === currentNextPiece.id ? { ...p, isLoaded: true } : p));
    setCurrentStepIdx(prev => prev + 1);
  };

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim() || !currentNextPiece) return;

    // Check if scanned input matches next piece size (e.g., "100" or "RAD-100")
    if (scanInput.includes(String(currentNextPiece.size))) {
      handleConfirmNextPiece();
      setScanInput('');
    } else {
      setAlertMessage(`خطای اسکن: رادیاتور اسکن شده (${scanInput}) با رادیاتور مورد انتظار بعدی (${currentNextPiece.size}cm) مطابقت ندارد!`);
      if (soundEnabled) playBeep(false);
      setTimeout(() => setAlertMessage(null), 4500);
    }
  };

  const handleReset = () => {
    setPieces(prev => prev.map(p => ({ ...p, isLoaded: false })));
    setCurrentStepIdx(0);
    setAlertMessage(null);
  };

  function playBeep(success: boolean) {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.15 : 0.4));
    } catch {
      // ignore audio context failures in iframe
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto dir-rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 md:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-white">
                  حالت «بارگیری زنده» در سالن (Live Loading Assistant)
                </h2>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                  زنده - آنلاین
                </span>
              </div>
              <p className="text-xs text-slate-400">
                راهنمای لحظه‌به‌لحظه اپراتور: نمایش محل exact قطعه بعدی، کنترل تعادل وزن زنده و اسکن رادیاتور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                soundEnabled ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="هشدار صوتی"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Warning Banner */}
        {alertMessage && (
          <div className="bg-rose-600 text-white p-3.5 text-xs md:text-sm font-bold flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}

        {/* Main Interactive Grid Layout */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Live Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">پیشرفت بارگیری</span>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">
                {toPersianDigits(loadedCount)} / {toPersianDigits(totalCount)} <span className="text-xs text-emerald-600">({toPersianDigits(progressPercent)}٪)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">وزن بارگیری شده</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {toPersianDigits(loadedWeight)} <span className="text-xs font-normal">kg</span>
              </div>
              <span className="text-[10px] text-slate-500 block">از مجموع {toPersianDigits(data.totalWeight)} kg</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">تعادل زنده چپ/راست</span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {toPersianDigits(totalBalance)}٪
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">توازن اکسل پایدار</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">اپراتور مسئول</span>
              <div className="text-base font-black text-slate-800 dark:text-slate-100">
                {operatorName}
              </div>
              <span className="text-[10px] text-slate-500 block">کامیون: {truckDetails.model}</span>
            </div>
          </div>

          {/* Target Next Piece Card */}
          {currentNextPiece ? (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 dark:from-amber-950/40 dark:to-amber-950/40 border-2 border-amber-500 p-4 md:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-lg">
                  <span className="text-xs">سایز</span>
                  <span className="text-xl font-mono leading-none">{toPersianDigits(currentNextPiece.size)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                      قطعه بعدی جهت قرارگیری
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      وزن: {toPersianDigits(currentNextPiece.weight)} kg
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mt-1">
                    محل exact چیدمان: لایه {toPersianDigits(currentNextPiece.layerIdx + 1)} | لاین {toPersianDigits(currentNextPiece.laneIdx + 1)} | موقعیت {toPersianDigits(currentNextPiece.posIdx + 1)}
                  </h3>
                </div>
              </div>

              {/* Confirm / Scan Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <form onSubmit={handleSimulateScan} className="flex gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="کد یا سایز اسکن QR..."
                    className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 w-36"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2.5 bg-slate-900 text-amber-400 hover:bg-black font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>اسکن</span>
                  </button>
                </form>

                <button
                  onClick={handleConfirmNextPiece}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأیید قرارگیری قطعه</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                بارگیری با موفقیت کامل انجام شد!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                تمامی {toPersianDigits(totalCount)} قطعه رادیاتور طبق الگوریتم هوشمند با حفظ توازن کامل داخل کامیون چیده شدند.
              </p>
            </div>
          )}

          {/* Interactive Live 2D Grid Representation */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>نقشه چیدمان زنده اتاق کامیون ({truckDetails.model})</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" /> بارگیری‌شده
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-400 border border-amber-300 animate-pulse" /> قطعه بعدی
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" /> در انتظار
                </span>
              </div>
            </div>

            {/* Visual Truck Bed Container */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[220px] flex flex-col justify-center space-y-3">
              {Array.from({ length: result?.lanesCount || 3 }).map((_, laneIdx) => {
                const lanePieces = pieces.filter(p => p.laneIdx === laneIdx);
                return (
                  <div key={laneIdx} className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono">لاین {toPersianDigits(laneIdx + 1)} (طول کانتینر)</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {lanePieces.map((p) => {
                        const isNext = currentNextPiece?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`min-w-[48px] h-12 rounded-lg text-xs font-mono font-bold flex flex-col items-center justify-center border transition-all ${
                              p.isLoaded
                                ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-sm'
                                : isNext
                                ? 'bg-amber-400 border-2 border-amber-300 text-slate-950 shadow-lg scale-105 animate-pulse'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400'
                            }`}
                          >
                            <span>{toPersianDigits(p.size)}</span>
                            <span className="text-[9px] opacity-80">{toPersianDigits(p.weight)}kg</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازنشانی و شروع مجدد بارگیری</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white hover:bg-black font-bold text-xs md:text-sm rounded-xl transition"
          >
            بستن راهنما
          </button>
        </div>
      </div>
    </div>
  );
};
