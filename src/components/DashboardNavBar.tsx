import React from 'react';
import { User, Truck, Box, Cpu, BarChart3, Settings, LayoutGrid } from 'lucide-react';
import { DashboardTab } from '../types';

interface DashboardNavBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  pendingCalculationsCount?: number;
}

export const DashboardNavBar: React.FC<DashboardNavBarProps> = ({
  activeTab,
  onTabChange,
  pendingCalculationsCount = 0
}) => {
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'داشبورد اصلی',
      icon: <LayoutGrid className="w-6 h-6" />
    },
    {
      id: 'drivers',
      label: 'ثبت راننده',
      icon: <User className="w-6 h-6" />
    },
    {
      id: 'vehicles',
      label: 'ثبت خودرو',
      icon: <Truck className="w-6 h-6" />
    },
    {
      id: 'cargo',
      label: 'ثبت بار',
      icon: <Box className="w-6 h-6" />
    },
    {
      id: 'layout',
      label: 'چیدمان هوشمند',
      icon: <Cpu className="w-6 h-6" />,
      badge: 'AI Engine'
    },
    {
      id: 'reports',
      label: 'گزارش‌ها',
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      id: 'settings',
      label: 'تنظیمات کارخانه',
      icon: <Settings className="w-6 h-6" />
    }
  ];

  return (
    <div className="bg-slate-950 text-white rounded-2xl border-2 border-slate-800 p-2 md:p-3 shadow-xl mb-6 no-print">
      {/* Top Industrial Header Banner */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
            Bosch & Siemens Industrial Loading System v2.4
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <span className="hidden sm:inline bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            حالت کارخانه (صنعتی)
          </span>
          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-lg font-mono">
            آفلاین / آماده همگام‌سازی
          </span>
        </div>
      </div>

      {/* Main Glove-Friendly Touch Button Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center text-center p-3.5 md:p-4 rounded-xl font-black transition-all duration-200 border-2 active:scale-95 touch-manipulation min-h-[76px] ${
                isActive
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/60 ring-2 ring-blue-400/50 scale-[1.02]'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className={`mb-1.5 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {tab.icon}
              </div>
              <span className="text-xs md:text-sm font-black leading-tight">
                {tab.label}
              </span>

              {tab.badge && (
                <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
