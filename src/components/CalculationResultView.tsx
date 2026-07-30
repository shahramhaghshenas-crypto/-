import React from 'react';
import { Truck, CheckCircle, AlertTriangle, Scale, Ruler, Layers, DollarSign, MapPin, User, FileText, CheckSquare } from 'lucide-react';
import { EvaluationResult, RadiatorData, TruckDetails, DestinationInfo, LayoutRules } from '../types';
import { fmtPersian, toPersianDigits } from '../utils/persianDigits';
import { Layout2DView } from './Layout2DView';
import { Layout3DView } from './Layout3DView';

interface CalculationResultViewProps {
  result: EvaluationResult | null;
  data: RadiatorData;
  truckDetails: TruckDetails;
  destinationInfo: DestinationInfo;
  rules: LayoutRules;
  shippingCost: number;
  profileName: string;
  appModeName: string;
  photoUrl: string | null;
  signatureUrl: string | null;
}

export const CalculationResultView: React.FC<CalculationResultViewProps> = ({
  result,
  data,
  truckDetails,
  destinationInfo,
  rules,
  shippingCost,
  profileName,
  appModeName,
  photoUrl,
  signatureUrl,
}) => {
  if (data.totalPieces === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">آماده محاسبه بارگیری</h3>
        <p className="text-xs text-slate-500 mt-1">
          لطفاً تعداد رادیاتورها را در فرم بالا وارد کرده و دکمه «محاسبه بهترین ماشین و چیدمان» را فشار دهید.
        </p>
      </div>
    );
  }

  if (!result || !result.ok) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm my-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-rose-900">عدم امکان بارگیری با شرایط فعلی</h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {result?.reason || 'بار مورد نظر در ابعاد کانتینر جا نگرفت یا از سقف وزن مجاز عبور کرد.'}
            </p>
          </div>
        </div>

        {/* Failed summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-rose-200/60 text-xs">
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">تعداد کل</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(data.totalPieces)}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">وزن کل</span>
            <span className="text-base font-bold text-rose-700">{fmtPersian(data.totalWeight, 0)} kg</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">متراژ کل</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(data.totalMeter, 1)} m</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100">
            <span className="text-slate-500 block">سقف لایه مجاز</span>
            <span className="text-base font-bold text-slate-800">{fmtPersian(Math.floor(rules.maxH / rules.layerH))}</span>
          </div>
        </div>
      </div>
    );
  }

  const { truck, lanesCount, maxLayers, usedLayers, packed, fill, approxAxle, axleOk } = result;
  const confirmText = rules.confirmLoading ? 'تأیید شده' : 'در انتظار تأیید';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm my-6 card-print">
      {/* Printable Cargo Bill Header */}
      <div className="hidden print-only text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black">حواله و مجوز بارگیری رادیاتور</h1>
        <p className="text-sm mt-1">سامانه تخصصی مدیریت چیدمان و ناوگان باربری</p>
      </div>

      {/* Main Header Result */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              پیشنهاد اصلی: {truck.name}
            </h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
              بازده چیدمان: {fmtPersian(fill, 1)}٪
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پروفایل فعلی: <b>{profileName}</b> | حالت: <b>{appModeName}</b> | وضعیت بارگیری: <b className="text-emerald-700">{confirmText}</b>
          </p>
        </div>

        <div className="text-left">
          <span className="text-xs text-slate-400 block">پلاک ثبت‌شده:</span>
          <span className="text-sm font-black text-slate-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-block">
            {truckDetails.plate || 'ثبت‌نشده'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">تعداد کل کالا</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(data.totalPieces)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">وزن کل بار</span>
          <span className="text-lg font-black text-amber-700">{fmtPersian(data.totalWeight, 0)} kg</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">متراژ کل بار</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(data.totalMeter, 1)} m</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">حداکثر لایه مجاز</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(maxLayers)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">لایه مصرف‌شده</span>
          <span className="text-lg font-black text-blue-700">{fmtPersian(usedLayers)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">ردیف هر لایه</span>
          <span className="text-lg font-black text-slate-900">{fmtPersian(lanesCount)}</span>
        </div>

        <div className={`border rounded-xl p-3 ${axleOk ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <span className="text-[11px] text-slate-500 block">وزن هر محور</span>
          <span className={`text-lg font-black ${axleOk ? 'text-emerald-800' : 'text-rose-800'}`}>
            {fmtPersian(approxAxle, 0)} kg
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">درصد پرشدن</span>
          <span className="text-lg font-black text-emerald-700">{fmtPersian(fill, 1)}٪</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">هزینه حمل</span>
          <span className="text-lg font-black text-emerald-800">{fmtPersian(shippingCost)}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">نام راننده</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{truckDetails.driverName || '-'}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">پلاک</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{truckDetails.plate || '-'}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 block">شهر مقصد</span>
          <span className="text-sm font-bold text-slate-900 truncate block">{destinationInfo.destination || '-'}</span>
        </div>
      </div>

      {/* Center of Gravity & Stability Analysis Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 md:p-5 mb-6 shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/80 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-base">
              🎯
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-amber-300">
                تحلیل مرکز ثقل (Center of Gravity) و پایداری دینامیکی خودرو
              </h3>
              <p className="text-[11px] text-slate-300">
                {result.cogStatusLabel || 'محاسبات سه‌بعدی مرکز جرم و توزیع فشار بر اکسل‌ها'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border self-start sm:self-auto ${
              result.cogStatus === 'perfect'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : result.cogStatus === 'good'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {result.cogStatus === 'perfect'
              ? '🎯 چیدمان عالی و کاملاً متوازن'
              : result.cogStatus === 'good'
              ? '⚖️ چیدمان پایدار و استاندارد'
              : '⚠️ نیازمند تنظیم مرکز ثقل'}
          </span>
        </div>

        {/* 3D CoG Coordinates & Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">موقعیت مرکز ثقل طولی (X)</span>
              <span className="font-bold text-amber-300">{fmtPersian(result.cogXPercent || 50)}٪</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, result.cogXPercent || 50))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              فاصله از دیواره جلو: <b>{fmtPersian(result.cogX || Math.round(truck.L / 2))} cm</b> (طول مفید: {fmtPersian(truck.L)}cm)
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">موقعیت مرکز ثقل عرضی (Y)</span>
              <span className="font-bold text-emerald-300">{fmtPersian(result.cogYPercent || 50)}٪</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, result.cogYPercent || 50))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              فاصله از دیواره چپ: <b>{fmtPersian(result.cogY || Math.round(truck.W / 2))} cm</b> (عرض مفید: {fmtPersian(truck.W)}cm)
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-200">ارتفاع مرکز ثقل از کف (Z)</span>
              <span className="font-bold text-indigo-300">{fmtPersian(result.cogZ || 25)} cm</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-1.5 border border-slate-700">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round(((result.cogZ || 25) / Math.max(1, rules.maxH)) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              حفظ مرکز ثقل در پایین، خطر واژگونی بار در پیچ‌های تند را خنثی می‌سازد.
            </span>
          </div>
        </div>

        {/* Axle Distribution Bar */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              سهم وزن اکسل جلو: <strong className="text-white">{fmtPersian(result.frontAxleWeight, 0)} kg</strong> | اکسل عقب: <strong className="text-white">{fmtPersian(result.rearAxleWeight, 0)} kg</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">شاخص توازن:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold border border-emerald-500/30">
              {fmtPersian(result.axleBalanceScore, 0)}٪
            </span>
          </div>
        </div>
      </div>

      {/* Text Manifest Breakdown Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 leading-relaxed text-xs text-slate-700 font-mono whitespace-pre-wrap">
        <strong className="text-sm text-slate-900 block font-sans mb-2">دستورالعمل چیدمان پیشنهادی:</strong>
        • طول‌های بلندتر در لایه‌های پایین‌تر قرار داده شده‌اند تا مرکز ثقل پایین بماند.
        • ردیف‌های میانی سنگین‌تر چینش شده‌اند.
        • طول‌های کوتاه‌تر برای پر کردن فضای باقیمانده هر ردیف استفاده شدند.
        • با ارتفاع مجاز {fmtPersian(rules.maxH)} سانتی‌متر، هر لایه {fmtPersian(rules.layerH)} سانتی‌متر و هر ردیف {fmtPersian(rules.rowW)} سانتی‌متر در نظر گرفته شده است.

        <strong className="text-sm text-slate-900 block font-sans mt-4 mb-2">جزئیات ردیف‌به‌ردیف لایه‌ها:</strong>
        {packed.map((layer, li) => {
          const hasItems = layer.lanes.some((r) => r.list.length > 0);
          if (!hasItems) return null;
          return (
            <div key={li} className="mb-2">
              <span className="font-bold text-blue-800">لایه {toPersianDigits(li + 1)}:</span>
              {layer.lanes.map((lane, ri) => (
                <div key={ri} className="mr-3 text-slate-600">
                  - ردیف {toPersianDigits(ri + 1)}: {lane.list.length > 0 ? lane.list.join(' + ') + ' سانتی‌متر' : 'خالی'} | باقیمانده: {toPersianDigits(lane.rem)} cm
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 2D Visual View */}
      {rules.show2D && <Layout2DView result={result} />}

      {/* 3D Visual View */}
      {rules.show3D && result && result.ok && <Layout3DView evalResult={result} />}

      {/* Details Table */}
      <div className="overflow-x-auto my-6">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
              <th className="py-2.5 px-3">عنوان فیلد</th>
              <th className="py-2.5 px-3">مقدار ثبت‌شده</th>
              <th className="py-2.5 px-3">توضیحات سامانه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">پلاک خودرو</td>
              <td className="py-2 px-3 font-bold">{truckDetails.plate || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مستقیماً در اپ ثبت شده است</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">نام راننده</td>
              <td className="py-2 px-3 font-bold">{truckDetails.driverName || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مشخصات ترابری</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">شماره تماس راننده</td>
              <td className="py-2 px-3 font-bold">{truckDetails.driverPhone || '-'}</td>
              <td className="py-2 px-3 text-slate-500">ارتباطی</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">ساعت بارگیری</td>
              <td className="py-2 px-3 font-bold">{destinationInfo.loadTime || '-'}</td>
              <td className="py-2 px-3 text-slate-500">زمان‌بندی خروج</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">زمان تخمینی تخلیه</td>
              <td className="py-2 px-3 font-bold">{destinationInfo.unloadTime || '-'}</td>
              <td className="py-2 px-3 text-slate-500">مقرر در مقصد</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">وضعیت تأیید</td>
              <td className="py-2 px-3 font-bold text-emerald-700">{confirmText}</td>
              <td className="py-2 px-3 text-slate-500">تأییدیه مسئول بارگیری</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Photos & Signatures Attached Preview in Manifest */}
      {(photoUrl || signatureUrl) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 my-4">
          {photoUrl && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">تصویر بارگیری کالا:</span>
              <img src={photoUrl} alt="Photo" className="max-h-32 rounded-lg border border-slate-200 object-contain" />
            </div>
          )}
          {signatureUrl && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">امضای راننده / تحویل‌دهنده:</span>
              <img src={signatureUrl} alt="Signature" className="max-h-24 rounded-lg border border-slate-200 object-contain" />
            </div>
          )}
        </div>
      )}

      {/* Printable Footer */}
      <div className="hidden print-only mt-12 pt-6 border-t border-slate-400 flex justify-between text-xs text-slate-700">
        <div>محل امضای انباردار: ............................</div>
        <div>محل امضای راننده: ............................</div>
        <div>تأیید مدیریت لجستیک: ............................</div>
      </div>
    </div>
  );
};
