import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit3, Save, Calculator, Eye, FileText, Download, CheckCircle2, AlertTriangle, Scale, Percent, Layers, ShieldAlert } from 'lucide-react';
import { RadiatorCounts, TruckDetails, EvaluationResult } from '../types';
import { RADIATOR_SIZES } from '../data/presets';
import { pieceWeight } from '../utils/calculation';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';

export interface ProductItemRow {
  id: string;
  code: string;
  model: string;
  quantity: number;
  weight: number; // in kg per unit
  length: number; // cm
  width: number;  // cm
  height: number; // cm
}

interface RadiatorItemsTableProps {
  counts: RadiatorCounts;
  onChangeCounts: (counts: RadiatorCounts) => void;
  truckDetails: TruckDetails;
  onTruckChange?: (truck: TruckDetails) => void;
  result: EvaluationResult | null;
  onRunCalculation: () => void;
  onOpen3DViewer: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onSaveOrder?: () => void;
  manualLayers?: number;
  onManualLayersChange?: (layers: number) => void;
}

export const RadiatorItemsTable: React.FC<RadiatorItemsTableProps> = ({
  counts,
  onChangeCounts,
  truckDetails,
  onTruckChange,
  result,
  onRunCalculation,
  onOpen3DViewer,
  onExportPdf,
  onExportExcel,
  onSaveOrder,
  manualLayers = 10,
  onManualLayersChange
}) => {
  // Order Form State
  const [orderNo, setOrderNo] = useState('ORD-1403-88');
  const [customer, setCustomer] = useState('شرکت تاسیسات مرکزی ایران');
  const [driver, setDriver] = useState(truckDetails.driverName || 'محمد رضایی');
  const [plate, setPlate] = useState(truckDetails.plate || '۱۲ ع ۳۴۵ ایران ۶۸');
  const [destination, setDestination] = useState('تهران - بازار شوش');

  // New Custom Item Form Modal State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('RAD-CUSTOM');
  const [newModel, setNewModel] = useState('رادیاتور آلومینیومی سفارشی');
  const [newQuantity, setNewQuantity] = useState('10');
  const [newWeight, setNewWeight] = useState('14');
  const [newLength, setNewLength] = useState('90');
  const [newWidth, setNewWidth] = useState('15');
  const [newHeight, setNewHeight] = useState('55');

  // Convert standard counts object to ProductItemRow list for rich rendering
  const rows: ProductItemRow[] = React.useMemo(() => {
    const list: ProductItemRow[] = [];
    Object.entries(counts).forEach(([sizeStr, val]) => {
      const size = Number(sizeStr);
      const qty = Number(val);
      if (!isNaN(qty) && qty > 0) {
        const weight = pieceWeight(size);
        list.push({
          id: `size_${size}`,
          code: `RAD-PANEL-${size}`,
          model: `رادیاتور پنلی فولادی ${toPersianDigits(size)} سانتی‌متری`,
          quantity: qty,
          weight,
          length: size,
          width: 15,
          height: 60
        });
      }
    });
    return list;
  }, [counts]);

  const totalQuantity = rows.reduce((acc, r) => acc + r.quantity, 0);
  const totalWeight = rows.reduce((acc, r) => acc + r.quantity * r.weight, 0);

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    const len = parseInt(newLength) || 80;
    const qty = parseInt(newQuantity) || 1;
    if (len > 0 && qty > 0) {
      const nextCounts = { ...counts, [len]: (counts[len] || 0) + qty };
      onChangeCounts(nextCounts);
      setShowAddForm(false);
    }
  };

  const handleDeleteRow = (size: number) => {
    const nextCounts = { ...counts };
    delete nextCounts[size];
    onChangeCounts(nextCounts);
  };

  const handleQtyChange = (size: number, newQtyStr: string) => {
    const q = parseInt(newQtyStr);
    const nextCounts = { ...counts };
    if (isNaN(q) || q <= 0) {
      delete nextCounts[size];
    } else {
      nextCounts[size] = q;
    }
    onChangeCounts(nextCounts);
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* 1. Order & Vehicle Form Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              فرم ثبت اطلاعات سفارش و بارگیری
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            نسخه ۱.۰ صنعتی
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              شماره سفارش:
            </label>
            <input
              type="text"
              id="orderNo"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              نام مشتری / خریدار:
            </label>
            <input
              type="text"
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              نام راننده:
            </label>
            <input
              type="text"
              id="driver"
              value={driver}
              onChange={(e) => {
                setDriver(e.target.value);
                if (onTruckChange) onTruckChange({ ...truckDetails, driverName: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              پلاک خودرو:
            </label>
            <input
              type="text"
              id="plate"
              value={plate}
              onChange={(e) => {
                setPlate(e.target.value);
                if (onTruckChange) onTruckChange({ ...truckDetails, plate: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              مقصد تخلیه:
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Radiator Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              جدول لیست رادیاتورهای بارگیری
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لیست اقلام سفارش شامل کد کالا، وزن و ابعاد هندسی دقیق
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1.5 shrink-0">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تعداد لایه:</span>
              <button
                type="button"
                onClick={() => onManualLayersChange && onManualLayersChange(Math.max(1, manualLayers - 1))}
                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-300"
              >
                -
              </button>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono px-1">
                {toPersianDigits(manualLayers)}
              </span>
              <button
                type="button"
                onClick={() => onManualLayersChange && onManualLayersChange(Math.min(30, manualLayers + 1))}
                className="w-6 h-6 rounded bg-indigo-600 text-white font-bold text-xs flex items-center justify-center hover:bg-indigo-700"
              >
                +
              </button>
            </div>

            <button
              id="btnAddItem"
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن رادیاتور جدید</span>
            </button>
          </div>
        </div>

        {/* Modal / Inline Form for Add New Item */}
        {showAddForm && (
          <form onSubmit={handleAddRow} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300">ثبت رادیاتور سفارشی جدید:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">کد کالا</span>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">نام مدل</span>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">تعداد</span>
                <input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">وزن (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">طول (cm)</span>
                <input
                  type="number"
                  value={newLength}
                  onChange={(e) => setNewLength(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">عرض (cm)</span>
                <input
                  type="number"
                  value={newWidth}
                  onChange={(e) => setNewWidth(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">ارتفاع (cm)</span>
                <input
                  type="number"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border text-xs rounded-lg font-bold font-mono text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition"
              >
                تایید و افزودن به لیست
              </button>
            </div>
          </form>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table id="itemsTable" className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">کد کالا</th>
                <th className="p-3">مدل رادیاتور</th>
                <th className="p-3 text-center">تعداد (عدد)</th>
                <th className="p-3 text-center">وزن واحد (kg)</th>
                <th className="p-3 text-center">طول (cm)</th>
                <th className="p-3 text-center">عرض (cm)</th>
                <th className="p-3 text-center">ارتفاع (cm)</th>
                <th className="p-3 text-center">جمع وزن (kg)</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{row.code}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{row.model}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleQtyChange(row.length, e.target.value)}
                        className="w-16 px-1.5 py-1 text-center font-bold font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {fmtPersian(row.weight, 1)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{toPersianDigits(row.length)}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{toPersianDigits(row.width)}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{toPersianDigits(row.height)}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {fmtPersian(row.quantity * row.weight, 0)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.length)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="حذف این ردیف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    هیچ رادیاتوری در لیست بار ثبت نشده است. از دکمه «افزودن رادیاتور جدید» استفاده کنید.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan={2} className="p-3 text-left">جمع کل سفارش:</td>
                  <td className="p-3 text-center font-mono text-emerald-400 text-sm">{toPersianDigits(totalQuantity)} عدد</td>
                  <td colSpan={4}></td>
                  <td className="p-3 text-center font-mono text-amber-300 text-sm">{fmtPersian(totalWeight, 0)} kg</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 3. Action Buttons Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btnSave"
            type="button"
            onClick={onSaveOrder}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm rounded-xl transition border border-slate-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>ذخیره سفارش</span>
          </button>

          <button
            id="btnCalculate"
            type="button"
            onClick={onRunCalculation}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm rounded-xl transition shadow-lg shadow-blue-900/50 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>محاسبه چیدمان صنعتی</span>
          </button>

          <button
            id="btnViewer"
            type="button"
            onClick={onOpen3DViewer}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>نمایش سه‌بعدی</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onExportPdf && (
            <button
              id="btnPdf"
              type="button"
              onClick={onExportPdf}
              className="px-4 py-2.5 bg-rose-950 text-rose-200 hover:bg-rose-900 border border-rose-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>گزارش PDF</span>
            </button>
          )}

          {onExportExcel && (
            <button
              id="btnExcel"
              type="button"
              onClick={onExportExcel}
              className="px-4 py-2.5 bg-emerald-950 text-emerald-200 hover:bg-emerald-900 border border-emerald-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>خروجی Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Results Panel & Warnings Panel */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Result Stats Box */}
          <div id="resultPanel" className="md:col-span-2 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                نتیجه محاسبه هوش مصنوعی چیدمان
              </h2>
              <span className="text-xs font-mono bg-blue-600/30 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/40">
                {result.truck.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block mb-0.5">وزن کل بار</span>
                <span id="resultWeight" className="text-base font-black text-amber-300 font-mono">
                  {toPersianDigits(result.totalWeight)} kg
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block mb-0.5">درصد پرشدگی</span>
                <span id="resultFill" className="text-base font-black text-emerald-400 font-mono">
                  {toPersianDigits(result.fill)}٪
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block mb-0.5">مرکز ثقل (CoG)</span>
                <span id="resultCG" className="text-base font-black text-cyan-300 font-mono">
                  {result.cogStatusLabel || `${toPersianDigits(result.cogXPercent || 50)}٪ طولی`}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block mb-0.5">تعداد لایه‌ها</span>
                <span id="resultLayers" className="text-base font-black text-indigo-300 font-mono">
                  {toPersianDigits(result.usedLayers)} لایه
                </span>
              </div>
            </div>
          </div>

          {/* Warning List Panel */}
          <div id="warningPanel" className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-amber-300">هشدارها و کنترل کنترل کیفی</h3>
            </div>

            <ul id="warningList" className="space-y-2 text-xs text-slate-300">
              {result.axleOk ? (
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>توزیع بار روی محورها استاندارد است.</span>
                </li>
              ) : (
                <li className="flex items-center gap-2 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>توازن وزن محورها نامتعادل است ({toPersianDigits(result.axleBalanceScore)}٪).</span>
                </li>
              )}

              {result.reason && (
                <li className="flex items-center gap-2 text-amber-300 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{result.reason}</span>
                </li>
              )}

              <li className="flex items-center gap-2 text-cyan-300 font-medium">
                <Layers className="w-4 h-4 shrink-0" />
                <span>حداکثر لایه‌های مجاز چیدمان: {toPersianDigits(result.maxLayers)} لایه</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
