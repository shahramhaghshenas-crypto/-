import React from 'react';
import { Smartphone, Download, Wifi, BatteryCharging, Signal, Sparkles, CheckCircle2 } from 'lucide-react';

interface AndroidAppFrameProps {
  children: React.ReactNode;
  isAndroidView: boolean;
  onToggleAndroidView: (val: boolean) => void;
}

export const AndroidAppFrame: React.FC<AndroidAppFrameProps> = ({
  children,
  isAndroidView,
  onToggleAndroidView
}) => {
  const handleDownloadAPK = () => {
    const element = document.createElement('a');
    const file = new Blob([
      'APK SIMULATION PACKAGE: Radiator Load Optimizer Android Edition\nVersion: 2.4.0\nTarget Platform: Android 14 (API 34)\nFeatures: 3D Pallet Calculator, Shipping Costs, LIFO Packing'
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'RadiatorLoadOptimizer_v2.4.apk';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isAndroidView) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6 flex flex-col items-center justify-center font-['Vazirmatn',sans-serif]">
      {/* Top Banner Control */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span>حالت شبیه‌ساز اپلیکیشن اندروید (Android APK Mode)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadAPK}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            دانلود فایل APK اندروید
          </button>
          <button
            type="button"
            onClick={() => onToggleAndroidView(false)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            خروج از شبیه‌ساز
          </button>
        </div>
      </div>

      {/* Android Device Body Container */}
      <div className="w-full max-w-[430px] bg-slate-900 rounded-[44px] p-3 border-[6px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col h-[860px]">
        {/* Android Speaker Notch */}
        <div className="w-32 h-4 bg-slate-950 rounded-b-xl mx-auto flex items-center justify-center gap-2 z-50 mb-1">
          <span className="w-12 h-1 bg-slate-800 rounded-full inline-block" />
          <span className="w-2.5 h-2.5 bg-slate-800 rounded-full inline-block" />
        </div>

        {/* Android Top Status Bar */}
        <div className="px-4 py-1 text-white text-[11px] font-mono flex items-center justify-between bg-slate-950/80 rounded-t-2xl z-40 border-b border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] text-emerald-400 font-bold">5G</span>
          </div>

          <div className="font-bold text-slate-200">۱۴:۳۰</div>

          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span>٪۱۰۰</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Android Main App Scroll View */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-2 text-xs scrollbar-thin">
          {children}
        </div>

        {/* Android Bottom System Navigation Bar */}
        <div className="bg-slate-950 py-2 px-8 flex items-center justify-around rounded-b-[36px] text-slate-400 border-t border-slate-800">
          {/* Recents */}
          <button type="button" className="p-1 hover:text-white transition">
            <span className="w-4 h-4 border-2 border-slate-400 rounded-xs inline-block" />
          </button>
          {/* Home */}
          <button type="button" className="p-1 hover:text-white transition">
            <span className="w-4 h-4 rounded-full border-2 border-slate-400 inline-block" />
          </button>
          {/* Back */}
          <button type="button" className="p-1 hover:text-white transition">
            <span className="w-0 h-0 border-y-6 border-y-transparent border-r-[10px] border-r-slate-400 inline-block" />
          </button>
        </div>
      </div>
    </div>
  );
};
