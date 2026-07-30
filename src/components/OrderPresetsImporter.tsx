import React, { useState } from 'react';
import { Package, FileSpreadsheet, Sparkles, Check, ArrowRight } from 'lucide-react';
import { RadiatorCounts } from '../types';
import { toPersianDigits } from '../utils/persianDigits';

interface OrderPresetsImporterProps {
  onApplyCounts: (counts: RadiatorCounts) => void;
}

const PRESET_TEMPLATES: { name: string; description: string; counts: RadiatorCounts }[] = [
  {
    name: 'پروژه مسکونی ۲۰ واحدی',
    description: 'ترکیب استاندارد رادیاتورهای ۱۰۰، ۱۲۰ و ۱۴۰ سانتی‌متری برای ۲۰ واحد آپارتمان',
    counts: { 60: 5, 80: 10, 100: 25, 120: 30, 140: 15, 160: 5, 180: 0 }
  },
  {
    name: 'صادرات کامل خاوران (تریلی)',
    description: 'بارگیری سنگین حداکثر ظرفیت تریلی با تنوع تمام سایزها',
    counts: { 60: 20, 80: 30, 100: 45, 120: 40, 140: 25, 160: 15, 180: 10 }
  },
  {
    name: 'پروژه اداری ۵۰ اتاق',
    description: 'بیشترین سهم رادیاتورهای سایز متوسط (۸۰ و ۱۰۰ سانتی‌متری)',
    counts: { 60: 10, 80: 40, 100: 35, 120: 15, 140: 5, 160: 0, 180: 0 }
  },
  {
    name: 'سفارش سبک خاور تک‌مسیر',
    description: 'مناسب توزیع شهری یا شهرستان‌های مجاور با خاور یا ایسوزو',
    counts: { 60: 8, 80: 12, 100: 15, 120: 10, 140: 0, 160: 0, 180: 0 }
  }
];

export const OrderPresetsImporter: React.FC<OrderPresetsImporterProps> = ({ onApplyCounts }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'csv'>('presets');
  const [csvText, setCsvText] = useState('');
  const [parsedStatus, setParsedStatus] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  const handleApplyPreset = (template: typeof PRESET_TEMPLATES[0]) => {
    onApplyCounts(template.counts);
    setCopiedSuccess(template.name);
    setTimeout(() => setCopiedSuccess(null), 2500);
  };

  const handleParseCsv = () => {
    try {
      // Expected format line by line or comma separated:
      // 60: 10
      // 80: 15
      // or CSV format: size,quantity -> 100,20
      const newCounts: RadiatorCounts = { 60: 0, 80: 0, 100: 0, 120: 0, 140: 0, 160: 0, 180: 0 };
      const lines = csvText.split('\n');
      let totalFound = 0;

      lines.forEach(line => {
        const cleaned = line.trim();
        if (!cleaned) return;

        // Try CSV comma separator
        let parts = cleaned.split(/[,:\t=]/);
        if (parts.length >= 2) {
          const sz = parseInt(parts[0].trim(), 10);
          const qty = parseInt(parts[1].trim(), 10);
          if ([60, 80, 100, 120, 140, 160, 180].includes(sz) && !isNaN(qty)) {
            newCounts[sz as keyof RadiatorCounts] += qty;
            totalFound += qty;
          }
        }
      });

      if (totalFound > 0) {
        onApplyCounts(newCounts);
        setParsedStatus(`موفقیت: تعداد ${toPersianDigits(totalFound)} رادیاتور از متن شناسایی و اعمال شد.`);
      } else {
        setParsedStatus('خطا: هیچ سایز رادیاتوری شناسایی نشد. لطفاً از فرمت "سایز, تعداد" استفاده کنید.');
      }
    } catch (err) {
      setParsedStatus('خطا در خواندن فرمت متنی.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>الگوهای آماده سفارش و ورود سریع داده</span>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'presets'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            الگوهای آماده
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'csv'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            ورود متن / Excel
          </button>
        </div>
      </div>

      {activeTab === 'presets' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.name}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {tmpl.name}
                  </span>
                  {copiedSuccess === tmpl.name ? (
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" />
                      اعمال شد
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {tmpl.description}
                </p>
              </div>

              <button
                onClick={() => handleApplyPreset(tmpl)}
                className="w-full py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <span>بارگذاری الگو</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            می‌توانید کدهای سفارش خروجی نرم‌افزار انبار یا Excel را (به صورت سایز,تعداد) در کادر زیر وارد کنید:
          </p>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`نمونه فرمت:\n100, 20\n120, 15\n140, 10`}
            className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={handleParseCsv}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>پردازش و جایگذاری تعداد</span>
            </button>
          </div>
          {parsedStatus && (
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {parsedStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
