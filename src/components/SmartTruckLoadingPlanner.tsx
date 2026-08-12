import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SmartTruckPreset,
  PlacedRadiatorItem,
  SavedSmartLayout,
  RadiatorCounts,
  TruckDetails,
  EvaluationResult
} from '../types';
import {
  Truck,
  Box,
  Cpu,
  RotateCw,
  Sparkles,
  Download,
  Printer,
  Save,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  AlertTriangle,
  Grid,
  Zap,
  Move,
  Clock,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  MousePointer,
  CheckCircle2,
  Sliders,
  Eye,
  FileSpreadsheet,
  Ruler,
  Magnet,
  Compass,
  ChevronsRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowDown,
  ArrowUp,
  FileText,
  AlertOctagon,
  Navigation,
  ListOrdered,
  Workflow,
  Target,
  Scale,
  Flame,
  Activity,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';
import { Layout3DView } from './Layout3DView';
import { MaxRectsPacker, FreeRectangle, runAdvancedOptimizer, defragmentAndCompact } from '../utils/maxRectsPacker';
import { OptimizationMetrics, LoadingPatternMode } from '../types';

import { VEHICLE_PRESETS, RADIATOR_CATALOG, CatalogRadiatorSpec } from '../data/presets';

interface SmartTruckLoadingPlannerProps {
  currentCounts?: RadiatorCounts;
  currentTruckDetails?: TruckDetails;
  onUpdateTruckDetails?: (details: TruckDetails) => void;
  evalResult?: EvaluationResult | null;
  onApplyCountsToOrder?: (counts: RadiatorCounts) => void;
  addToast?: (type: 'success' | 'warning' | 'error' | 'info', text: string) => void;
}

// Preset Trucks alias
export const SMART_TRUCK_PRESETS = VEHICLE_PRESETS;

export interface SmartGapSpace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  areaCm2: number;
  areaM2: number;
  volumeM3: number;
  compatibleModels: {
    spec: CatalogRadiatorSpec;
    needsRotation: boolean;
    fitsQty: number;
    warehouseQty: number;
  }[];
  fitsAny: boolean;
  bestFitModel?: CatalogRadiatorSpec;
}

interface AlignmentGuide {
  type: 'x' | 'y';
  pos: number;
}

export type SequenceStrategy =
  | 'auto-optimized'
  | 'back-to-front'
  | 'front-to-back'
  | 'left-to-right'
  | 'right-to-left'
  | 'center-first'
  | 'heavy-first'
  | 'fragile-last'
  | 'custom';

export const SmartTruckLoadingPlanner: React.FC<SmartTruckLoadingPlannerProps> = ({
  currentCounts,
  currentTruckDetails,
  onUpdateTruckDetails,
  evalResult,
  onApplyCountsToOrder,
  addToast
}) => {
  // Selected Truck Configuration derived from parent (Single Source of Truth)
  const selectedTruck = useMemo(() => {
    return {
      id: currentTruckDetails?.id || 'custom',
      name: currentTruckDetails?.model || 'سفارشی',
      type: (currentTruckDetails?.id || 'truck6m') as any,
      L: currentTruckDetails?.L || 600,
      W: currentTruckDetails?.W || 220,
      H: currentTruckDetails?.H || 200,
      cap: currentTruckDetails?.cap || 6000
    };
  }, [currentTruckDetails]);

  const customL = selectedTruck.L;
  const customW = selectedTruck.W;
  const customH = selectedTruck.H;
  const customCap = selectedTruck.cap;

  const updateTruckDetailsParent = (updated: Partial<TruckDetails>) => {
    if (onUpdateTruckDetails && currentTruckDetails) {
      onUpdateTruckDetails({
        ...currentTruckDetails,
        ...updated
      });
    }
  };

  const layoutSignature = useMemo(() => {
    const countsStr = Object.entries(currentCounts || {})
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([sz, qty]) => `${sz}:${qty}`)
      .join(',');
    return `${countsStr}_${selectedTruck.id}_${selectedTruck.L}_${selectedTruck.W}_${selectedTruck.H}_${selectedTruck.cap}`;
  }, [currentCounts, selectedTruck]);

  const [lastLayoutSignature, setLastLayoutSignature] = useState<string>('');

  // View mode tab: '2d' | '3d' | 'sequence'
  const [viewTab, setViewTab] = useState<'2d' | '3d' | 'sequence'>('2d');

  // Smart Loading Sequence State
  const [sequenceStrategy, setSequenceStrategy] = useState<SequenceStrategy>('auto-optimized');
  const [sequenceAnimPlaying, setSequenceAnimPlaying] = useState<boolean>(false);
  const [sequenceAnimStep, setSequenceAnimStep] = useState<number>(0);
  const [sequenceAnimSpeed, setSequenceAnimSpeed] = useState<number>(1);
  const [showSequenceNumbers, setShowSequenceNumbers] = useState<boolean>(true);
  const [showForkliftPath, setShowForkliftPath] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showCoGOverlay, setShowCoGOverlay] = useState<boolean>(true);

  // Placed Radiators Items List & Multi-selection
  const [placedItems, setPlacedItems] = useState<PlacedRadiatorItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<PlacedRadiatorItem[][]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  // Clipboard for Copy / Paste
  const [copiedItems, setCopiedItems] = useState<PlacedRadiatorItem[]>([]);

  // Canvas Zoom & Pan
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // CAD Options & Features
  const [enableSnapGrid, setEnableSnapGrid] = useState<boolean>(true);
  const [enableMagneticSnap, setEnableMagneticSnap] = useState<boolean>(true);
  const [enablePushSystem, setEnablePushSystem] = useState<boolean>(true);
  const [enableCADGuides, setEnableCADGuides] = useState<boolean>(true);
  const [enableLocalCompact, setEnableLocalCompact] = useState<boolean>(true);
  const [showEmptySpaces, setShowEmptySpaces] = useState<boolean>(true);
  const [gridStepCm, setGridStepCm] = useState<number>(10); // 10cm snap

  // Custom Item Generator Inputs
  const [newItemSize, setNewItemSize] = useState<number>(100);
  const [newItemQty, setNewItemQty] = useState<number>(10);

  // Animation & AI Packing State
  const [isPackingAnimating, setIsPackingAnimating] = useState<boolean>(false);
  const [packingProgress, setPackingProgress] = useState<number>(0);

  // Advanced Optimization Metrics & Pattern State
  const [optMetrics, setOptMetrics] = useState<OptimizationMetrics | null>(null);
  const [selectedPatternMode, setSelectedPatternMode] = useState<LoadingPatternMode>('hybrid_maxrects');
  const [isAdvancedOptRunning, setIsAdvancedOptRunning] = useState<boolean>(false);
  const [optExplanationIndex, setOptExplanationIndex] = useState<number>(-1);

  // Saved Layouts Presets
  const [savedLayouts, setSavedLayouts] = useState<SavedSmartLayout[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [layoutNameInput, setLayoutNameInput] = useState<string>('');

  // Dragging & CAD Interaction State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragLiveInfo, setDragLiveInfo] = useState<{
    x: number;
    y: number;
    w: number;
    l: number;
    weight: number;
    areaM2: number;
    model: string;
    rotationAngle: number;
    isInvalid: boolean;
    ghostStatus: 'green' | 'red' | 'orange' | 'blue';
    distToLeft: number;
    distToTop: number;
    remainingFreeAreaM2: number;
    occupiedPercent: number;
  } | null>(null);

  // Alignment Guide lines for CAD rendering
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Record History Snapshot
  const pushHistory = useCallback((items: PlacedRadiatorItem[]) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyStep + 1);
      return [...nextHistory, items];
    });
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  // Set items with history tracking
  const updateItemsWithHistory = (newItems: PlacedRadiatorItem[]) => {
    setPlacedItems(newItems);
    pushHistory(newItems);
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setPlacedItems(history[prevStep]);
      if (addToast) addToast('info', 'عمل قبلی واکشی شد (Undo)');
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setPlacedItems(history[nextStep]);
      if (addToast) addToast('info', 'عمل بعدی بازگردانی شد (Redo)');
    }
  };

  // Auto-Save Layout to LocalStorage
  useEffect(() => {
    if (placedItems.length > 0) {
      try {
        const autoSaveData = {
          truck: selectedTruck,
          items: placedItems,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('radiator_ai_autosave_layout', JSON.stringify(autoSaveData));
      } catch (e) {
        console.warn('Could not auto-save layout', e);
      }
    }
  }, [placedItems, selectedTruck]);

  // Sequence Strategy Generator Helper
  const applySequenceStrategy = useCallback((
    items: PlacedRadiatorItem[],
    strategy: SequenceStrategy,
    truckL: number,
    truckW: number
  ): PlacedRadiatorItem[] => {
    if (items.length === 0) return items;

    const cloned = [...items];

    switch (strategy) {
      case 'auto-optimized':
      case 'back-to-front':
        // Front cabin at X=0 is loaded FIRST, Rear door at X=truckL is loaded LAST (LIFO)
        cloned.sort((a, b) => {
          if (Math.abs(a.x - b.x) > 5) return a.x - b.x; // Primary: X ascending
          return a.y - b.y; // Secondary: Y ascending
        });
        break;

      case 'front-to-back':
        // Rear door loaded FIRST, Front cabin loaded LAST
        cloned.sort((a, b) => {
          if (Math.abs(a.x - b.x) > 5) return b.x - a.x; // Primary: X descending
          return a.y - b.y;
        });
        break;

      case 'left-to-right':
        cloned.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 5) return a.y - b.y; // Y ascending
          return a.x - b.x;
        });
        break;

      case 'right-to-left':
        cloned.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Y descending
          return a.x - b.x;
        });
        break;

      case 'center-first': {
        const centerY = truckW / 2;
        cloned.sort((a, b) => {
          const distA = Math.abs((a.y + (a.rotated ? a.width : a.length) / 2) - centerY);
          const distB = Math.abs((b.y + (b.rotated ? b.width : b.length) / 2) - centerY);
          return distA - distB;
        });
        break;
      }

      case 'heavy-first':
        cloned.sort((a, b) => b.weight - a.weight);
        break;

      case 'fragile-last':
        cloned.sort((a, b) => a.weight - b.weight);
        break;

      case 'custom':
        cloned.sort((a, b) => (a.sequence || 999) - (b.sequence || 999));
        break;
    }

    return cloned.map((item, idx) => ({
      ...item,
      sequence: idx + 1
    }));
  }, []);

  // Sorted list of placed items with guaranteed sequence numbers
  const sequenceItems = useMemo(() => {
    if (placedItems.length === 0) return [];
    let list = [...placedItems];
    if (list.some(i => i.sequence === undefined)) {
      list = applySequenceStrategy(list, sequenceStrategy, customL, customW);
    } else {
      list.sort((a, b) => (a.sequence || 1) - (b.sequence || 1));
    }
    return list;
  }, [placedItems, sequenceStrategy, customL, customW, applySequenceStrategy]);

  // Real-time Blocking & Access Violation Analysis
  const sequenceBlockingWarnings = useMemo(() => {
    if (sequenceItems.length <= 1) return [];

    const warnings: {
      blockedItemId: string;
      blockedModel: string;
      blockedSeq: number;
      blockingItemId: string;
      blockingModel: string;
      blockingSeq: number;
      reason: string;
    }[] = [];

    for (let i = 0; i < sequenceItems.length; i++) {
      const itemA = sequenceItems[i]; // Loaded EARLIER in sequence
      const seqA = itemA.sequence || (i + 1);
      const itemAW = itemA.rotated ? itemA.length : itemA.width;
      const itemAL = itemA.rotated ? itemA.width : itemA.length;

      for (let j = i + 1; j < sequenceItems.length; j++) {
        const itemB = sequenceItems[j]; // Loaded LATER in sequence
        const seqB = itemB.sequence || (j + 1);

        // Check if item A is sitting closer to the rear entrance than item B (X_A > X_B)
        // AND item A overlaps item B's corridor along Y axis
        const aIsRearOfB = itemA.x > itemB.x + 2;
        const yOverlap = (itemA.y < itemB.y + (itemB.rotated ? itemB.width : itemB.length) - 2) &&
                         (itemA.y + itemAL > itemB.y + 2);

        if (aIsRearOfB && yOverlap) {
          warnings.push({
            blockedItemId: itemB.id,
            blockedModel: itemB.model,
            blockedSeq: seqB,
            blockingItemId: itemA.id,
            blockingModel: itemA.model,
            blockingSeq: seqA,
            reason: `رادیاتور شماره ${toPersianDigits(seqA)} (${itemA.model}) جلوی درب قرار دارد و مانع بارگیری رادیاتور شماره ${toPersianDigits(seqB)} (${itemB.model}) می‌شود!`
          });
        }
      }
    }

    return warnings;
  }, [sequenceItems]);

  // Estimated Loading Time Calculation
  const estimatedLoadingTime = useMemo(() => {
    if (placedItems.length === 0) {
      return { totalSeconds: 0, totalMinutes: 0, formatted: '۰ دقیقه', forkliftTrips: 0 };
    }

    let totalSec = 0;
    placedItems.forEach(item => {
      let itemSec = 45; // 45s base per radiator
      if (item.weight > 30) itemSec += 20; // Heavy bonus
      if (Math.max(item.width, item.length) >= 120) itemSec += 15; // Size bonus
      totalSec += itemSec;
    });

    const totalMin = Math.ceil(totalSec / 60);
    const formatted = totalMin >= 60
      ? `${toPersianDigits(Math.floor(totalMin / 60))} ساعت و ${toPersianDigits(totalMin % 60)} دقیقه`
      : `${toPersianDigits(totalMin)} دقیقه`;

    return {
      totalSeconds: totalSec,
      totalMinutes: totalMin,
      formatted,
      forkliftTrips: placedItems.length
    };
  }, [placedItems]);

  // Animation Step Interval Player
  useEffect(() => {
    let intervalId: any = null;
    if (sequenceAnimPlaying && sequenceItems.length > 0) {
      const delay = Math.max(250, Math.round(1000 / sequenceAnimSpeed));
      intervalId = setInterval(() => {
        setSequenceAnimStep((prev) => {
          if (prev >= sequenceItems.length) {
            setSequenceAnimPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sequenceAnimPlaying, sequenceItems.length, sequenceAnimSpeed]);

  // Apply Sequence Strategy Handler
  const handleApplyStrategy = (strat: SequenceStrategy) => {
    setSequenceStrategy(strat);
    const updated = applySequenceStrategy(placedItems, strat, customL, customW);
    updateItemsWithHistory(updated);
    setSequenceAnimStep(0);
    if (addToast) {
      const labels: Record<SequenceStrategy, string> = {
        'auto-optimized': 'بهینه‌سازی خودکار LIFO (عدم مسدودسازی)',
        'back-to-front': 'جلو به عقب (از کابین تا درب)',
        'front-to-back': 'عقب به جلو (از درب تا کابین)',
        'left-to-right': 'چپ به راست',
        'right-to-left': 'راست به چپ',
        'center-first': 'ابتدا مرکز کانتینر',
        'heavy-first': 'ابتدا قطعات سنگین',
        'fragile-last': 'قطعات حساس/سبک در آخر',
        'custom': 'ترتیب سفارشی'
      };
      addToast('success', `استراتژی "${labels[strat]}" اعمال شد.`);
    }
  };

  // Reorder Sequence Handlers
  const handleReorderSequence = (index: number, direction: 'up' | 'down') => {
    const newItems = [...sequenceItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      sequence: idx + 1
    }));

    setSequenceStrategy('custom');
    updateItemsWithHistory(updated);
    if (addToast) addToast('info', 'ترتیب بارگیری به صورت دستی تغییر یافت.');
  };

  const handleSetSequenceNumber = (itemId: string, newSeq: number) => {
    if (newSeq < 1 || newSeq > sequenceItems.length) return;

    const newItems = sequenceItems.filter(i => i.id !== itemId);
    const targetItem = sequenceItems.find(i => i.id === itemId);
    if (!targetItem) return;

    newItems.splice(newSeq - 1, 0, targetItem);

    const updated = newItems.map((item, idx) => ({
      ...item,
      sequence: idx + 1
    }));

    setSequenceStrategy('custom');
    updateItemsWithHistory(updated);
  };

  // Export Loading Sequence Instructions as PDF
  const handleExportSequencePDF = () => {
    if (sequenceItems.length === 0) {
      if (addToast) addToast('warning', 'هیچ رادیاتوری در کانتینر بارگیری نشده است.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('fa-IR');
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const tableRows = sequenceItems.map((item) => {
      const w = item.rotated ? item.length : item.width;
      const l = item.rotated ? item.width : item.length;
      const seq = item.sequence || 1;
      const isBlocked = sequenceBlockingWarnings.some(w => w.blockedItemId === item.id);

      return `
        <tr style="background-color: ${seq % 2 === 0 ? '#f8fafc' : '#ffffff'}; text-align: center;">
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 14px; color: ${isBlocked ? '#dc2626' : '#1e3a8a'};">
            ${seq} ${isBlocked ? '⚠️' : ''}
          </td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">
            <span style="display:inline-block; width:12px; height:12px; background-color:${item.color}; margin-left:6px; border-radius:3px;"></span>
            ${item.model}
          </td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-family: monospace;">${w} × ${l} × ${item.height} cm</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-family: monospace;">X: ${item.x}, Y: ${item.y}</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">${item.weight} kg</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">
            ${item.rotated ? 'چرخش ۹۰ درجه | ' : ''}ارسال به موقعیت گام ${seq}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>دستورالعمل رسمی تسلسل بارگیری لیفتراک - ${selectedTruck.name}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; margin: 20px; color: #0f172a; direction: rtl; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
          th { background-color: #1e3a8a; color: white; padding: 10px; border: 1px solid #1e3a8a; }
          .summary-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 13px; font-weight: bold; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
          .sig-box { width: 45%; border-top: 1px dashed #94a3b8; padding-top: 10px; text-align: center; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">📋 دستورالعمل رسمی تسلسل بارگیری انبار (Smart Loading Sequence)</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">سیستم مدیریت انبارداری و چیدمان پویای کامیون</div>
          </div>
          <div style="text-align: left; font-size: 11px;">
            <div>تاریخ صدور: ${dateStr}</div>
            <div>زمان: ${timeStr}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div><b>نوع خودرو:</b> ${selectedTruck.name}</div>
          <div><b>ابعاد کانتینر:</b> ${customL} × ${customW} × ${customH} cm</div>
          <div><b>راننده / پلاک:</b> ${currentTruckDetails?.driverName || 'ثبت نشده'} - ${currentTruckDetails?.plate || '-'}</div>
          <div><b>شماره بارنامه:</b> ${currentTruckDetails?.waybillNo || 'ثبت نشده'}</div>
        </div>

        <div class="summary-box">
          ⏱️ زمان تخمینی کل بارگیری: ${estimatedLoadingTime.formatted} | 📦 تعداد قطعات: ${placedItems.length} عدد | ⚖️ وزن کل: ${stats.totalWeight} kg
        </div>

        <h3>جدول گام‌به‌گام تسلسل ورود بار به کانتینر (راهنمای اپراتور):</h3>
        <table>
          <thead>
            <tr>
              <th>گام #</th>
              <th>مدل رادیاتور</th>
              <th>ابعاد (L×W×H)</th>
              <th>مختصات (X, Y)</th>
              <th>وزن</th>
              <th>دستورالعمل اپراتور</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">امضاء و تأیید سرپرست انبار</div>
          <div class="sig-box">امضاء و تأیید اپراتور لیفتراک / بارچین</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Invalidate old placements and auto-pack on counts or vehicle change (Requirement 6 & 7)
  useEffect(() => {
    if (currentCounts && layoutSignature !== lastLayoutSignature) {
      setLastLayoutSignature(layoutSignature);

      const newList: PlacedRadiatorItem[] = [];
      let itemCounter = 1;

      Object.entries(currentCounts).forEach(([sizeStr, qty]) => {
        const sizeNum = Number(sizeStr);
        const spec = RADIATOR_CATALOG.find(c => c.size === sizeNum) || {
          size: sizeNum,
          label: `رادیاتور ${sizeNum} سانتی`,
          width: sizeNum,
          length: 11,
          height: 62,
          weight: Math.round(sizeNum * 0.22),
          color: '#3b82f6'
        };

        for (let i = 0; i < Number(qty); i++) {
          newList.push({
            id: `rad-${itemCounter++}`,
            model: spec.label,
            width: spec.width,
            length: spec.length,
            height: spec.height,
            weight: spec.weight,
            color: spec.color,
            x: 0,
            y: 0,
            z: 0,
            layer: 1
          });
        }
      });

      setSelectedItemIds([]);

      if (newList.length > 0) {
        const { winningResult, metrics } = runAdvancedOptimizer(
          newList,
          selectedTruck.L,
          selectedTruck.W,
          selectedTruck.H,
          selectedTruck.cap
        );
        const packedResult = [...winningResult.packedItems, ...winningResult.unpackedItems];
        setPlacedItems(packedResult);
        setOptMetrics(metrics);
        setHistory([packedResult]);
        setHistoryStep(0);
      } else {
        setPlacedItems([]);
        setOptMetrics(null);
        setHistory([[]]);
        setHistoryStep(0);
      }
    }
  }, [currentCounts, layoutSignature, lastLayoutSignature, selectedTruck]);

  // Load Saved Layouts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('radiator_ai_saved_smart_layouts');
      if (stored) {
        setSavedLayouts(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load saved layouts', e);
    }
  }, []);

  const saveSavedLayoutsToStorage = (layouts: SavedSmartLayout[]) => {
    setSavedLayouts(layouts);
    try {
      localStorage.setItem('radiator_ai_saved_smart_layouts', JSON.stringify(layouts));
    } catch (e) {
      console.warn('Could not save layouts to storage', e);
    }
  };

  // Preset Switch
  const handleSelectTruckPreset = (preset: any) => {
    updateTruckDetailsParent({
      id: preset.id,
      model: preset.name,
      L: preset.L,
      W: preset.W,
      H: preset.H,
      cap: preset.cap
    });
    if (addToast) addToast('info', `خودرو به ${preset.name} تغییر یافت.`);
  };

  // Add items from catalog button
  const handleAddCatalogItems = () => {
    const spec = RADIATOR_CATALOG.find(c => c.size === newItemSize) || RADIATOR_CATALOG[2];
    const newItems: PlacedRadiatorItem[] = [];

    for (let i = 0; i < newItemQty; i++) {
      newItems.push({
        id: `rad-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        model: spec.label,
        width: spec.width,
        length: spec.length,
        height: spec.height,
        weight: spec.weight,
        color: spec.color,
        x: 0,
        y: 0,
        z: 0,
        layer: 1
      });
    }

    const updated = [...placedItems, ...newItems];
    autoPackItems(updated, customL, customW, customH);
    if (addToast) addToast('success', `تعداد ${toPersianDigits(newItemQty)} عدد ${spec.label} افزوده شد.`);
  };

  // Clear all items
  const handleClearAllItems = () => {
    updateItemsWithHistory([]);
    setSelectedItemIds([]);
    if (addToast) addToast('warning', 'تمام بارگیری خالی شد.');
  };

  // Multi-Pattern & AI Advanced Optimization Execution
  const autoPackItems = (
    itemsToPack: PlacedRadiatorItem[],
    truckL: number,
    truckW: number,
    truckH: number,
    pattern: LoadingPatternMode = selectedPatternMode
  ) => {
    if (itemsToPack.length === 0) return;

    setIsPackingAnimating(true);
    setPackingProgress(0);

    const { winningResult, metrics } = runAdvancedOptimizer(
      itemsToPack,
      truckL,
      truckW,
      truckH,
      customCap
    );

    const packedResult = [...winningResult.packedItems, ...winningResult.unpackedItems];

    let step = 0;
    const totalSteps = packedResult.length;
    const interval = setInterval(() => {
      step += Math.max(1, Math.floor(totalSteps / 15));
      const currentProgress = Math.min(100, Math.round((step / totalSteps) * 100));
      setPackingProgress(currentProgress);

      if (step >= totalSteps) {
        clearInterval(interval);
        updateItemsWithHistory(packedResult);
        setOptMetrics(metrics);
        setIsPackingAnimating(false);
        if (addToast) {
          if (winningResult.unpackedItems.length > 0) {
            addToast(
              'warning',
              `⚡ چیدمان انجام شد. تعداد ${toPersianDigits(winningResult.unpackedItems.length)} رادیاتور به دلیل کمبود فضا جا نگرفت!`
            );
          } else {
            addToast('success', `⚡ چیدمان هوشمند بر اساس الگوی ${metrics.selectedPatternLabel} انجام شد. همه قطعات قابل چابجایی دستی هستند.`);
          }
        }
      }
    }, 35);
  };

  // Advanced Optimization (AI Super Optimizer with step explanations and relocation)
  const handleRunAdvancedOptimization = () => {
    if (placedItems.length === 0) {
      if (addToast) addToast('warning', 'هیچ رادیاتوری در کانتینر بارگیری نشده است.');
      return;
    }

    setIsAdvancedOptRunning(true);
    setIsPackingAnimating(true);
    setPackingProgress(0);
    setOptExplanationIndex(0);

    const { winningResult, metrics } = runAdvancedOptimizer(
      placedItems,
      customL,
      customW,
      customH,
      customCap
    );

    const targetItems = winningResult.packedItems;
    let step = 0;
    const totalSteps = Math.max(1, targetItems.length);

    const interval = setInterval(() => {
      step += Math.max(1, Math.floor(totalSteps / 12));
      const progress = Math.min(100, Math.round((step / totalSteps) * 100));
      setPackingProgress(progress);

      const logIdx = Math.min(
        metrics.explanationLogs.length - 1,
        Math.floor((progress / 100) * metrics.explanationLogs.length)
      );
      setOptExplanationIndex(logIdx);

      if (step >= totalSteps) {
        clearInterval(interval);
        updateItemsWithHistory(targetItems);
        setOptMetrics(metrics);
        setIsAdvancedOptRunning(false);
        setIsPackingAnimating(false);
        if (addToast) {
          addToast(
            'success',
            `🚀 بهینه‌سازی پیشرفته پیشرفته انجام شد! بهره‌وری فضای بار: ٪${toPersianDigits(metrics.spaceUtilizationPercent)} | بالانس وزن: ٪${toPersianDigits(metrics.weightBalanceScore)}`
          );
        }
      }
    }, 40);
  };

  // Modal state for Smart Gap Detection
  const [activeGapModal, setActiveGapModal] = useState<SmartGapSpace | null>(null);

  // Minimum radiator size constants (60cm x 11cm)
  const MIN_RAD_LENGTH = 60;
  const MIN_RAD_THICKNESS = 11;

  // Real-time Smart Gap Detection & Empty Space Scanner (MaxRects algorithm)
  const smartGaps = useMemo((): SmartGapSpace[] => {
    const layer1Items = placedItems.filter(i => (i.layer || 1) === 1);
    const freeNodes: FreeRectangle[] = [{ x: 0, y: 0, width: customL, height: customW }];

    layer1Items.forEach((item) => {
      const itemW = item.rotated ? item.length : item.width;
      const itemL = item.rotated ? item.width : item.length;
      const placedNode = { x: item.x, y: item.y, width: itemW, height: itemL };

      let numRects = freeNodes.length;
      for (let i = 0; i < numRects; i++) {
        const free = freeNodes[i];
        if (!free || free.x === undefined) continue;

        if (
          placedNode.x >= free.x + free.width ||
          placedNode.x + placedNode.width <= free.x ||
          placedNode.y >= free.y + free.height ||
          placedNode.y + placedNode.height <= free.y
        ) {
          continue;
        }

        if (placedNode.y > free.y) {
          freeNodes.push({ x: free.x, y: free.y, width: free.width, height: placedNode.y - free.y });
        }
        if (placedNode.y + placedNode.height < free.y + free.height) {
          freeNodes.push({
            x: free.x,
            y: placedNode.y + placedNode.height,
            width: free.width,
            height: free.y + free.height - (placedNode.y + placedNode.height)
          });
        }
        if (placedNode.x > free.x) {
          freeNodes.push({ x: free.x, y: free.y, width: placedNode.x - free.x, height: free.height });
        }
        if (placedNode.x + placedNode.width < free.x + free.width) {
          freeNodes.push({
            x: placedNode.x + placedNode.width,
            y: free.y,
            width: free.x + free.width - (placedNode.x + placedNode.width),
            height: free.height
          });
        }

        freeNodes.splice(i, 1);
        i--;
        numRects--;
      }
    });

    // Prune redundant sub-rectangles contained inside larger ones
    const prunedNodes: FreeRectangle[] = [];
    for (let i = 0; i < freeNodes.length; i++) {
      let isContained = false;
      for (let j = 0; j < freeNodes.length; j++) {
        if (i === j) continue;
        if (
          freeNodes[i].x >= freeNodes[j].x &&
          freeNodes[i].y >= freeNodes[j].y &&
          freeNodes[i].x + freeNodes[i].width <= freeNodes[j].x + freeNodes[j].width &&
          freeNodes[i].y + freeNodes[i].height <= freeNodes[j].y + freeNodes[j].height
        ) {
          isContained = true;
          break;
        }
      }
      if (!isContained) {
        prunedNodes.push(freeNodes[i]);
      }
    }

    // Ignore spaces smaller than minimum radiator size (60cm x 11cm)
    const validSpaces = prunedNodes.filter(rect => {
      const isEnoughThickness = rect.width >= MIN_RAD_THICKNESS && rect.height >= MIN_RAD_THICKNESS;
      const isEnoughLength = rect.width >= MIN_RAD_LENGTH || rect.height >= MIN_RAD_LENGTH;
      return isEnoughThickness && isEnoughLength;
    });

    // Calculate placed counts for warehouse stock estimation
    const placedCountsMap: Record<number, number> = {};
    placedItems.forEach(item => {
      const matchedSpec = RADIATOR_CATALOG.find(c => c.label === item.model || c.width === item.width);
      if (matchedSpec) {
        placedCountsMap[matchedSpec.size] = (placedCountsMap[matchedSpec.size] || 0) + 1;
      }
    });

    return validSpaces.map((space, idx) => {
      const areaCm2 = space.width * space.height;
      const areaM2 = Number((areaCm2 / 10000).toFixed(2));
      const volumeM3 = Number(((areaCm2 * customH) / 1000000).toFixed(2));

      const compatibleModels: SmartGapSpace['compatibleModels'] = [];

      RADIATOR_CATALOG.forEach(spec => {
        const fitsNormal = space.width >= spec.width && space.height >= spec.length;
        const fitsRotated = space.width >= spec.length && space.height >= spec.width;

        if (fitsNormal || fitsRotated) {
          const fitsQtyNormal = fitsNormal ? Math.floor(space.width / spec.width) * Math.floor(space.height / spec.length) : 0;
          const fitsQtyRotated = fitsRotated ? Math.floor(space.width / spec.length) * Math.floor(space.height / spec.width) : 0;
          const fitsQty = Math.max(1, Math.max(fitsQtyNormal, fitsQtyRotated));

          const initialCount = currentCounts && currentCounts[spec.size] !== undefined ? currentCounts[spec.size] : 25;
          const placedCount = placedCountsMap[spec.size] || 0;
          const warehouseQty = Math.max(0, initialCount - placedCount);

          compatibleModels.push({
            spec,
            needsRotation: !fitsNormal && fitsRotated,
            fitsQty,
            warehouseQty
          });
        }
      });

      const bestFit = compatibleModels.length > 0
        ? compatibleModels.reduce((prev, curr) => curr.spec.size > prev.spec.size ? curr : prev).spec
        : undefined;

      return {
        id: `gap-${idx}-${space.x}-${space.y}`,
        x: space.x,
        y: space.y,
        width: space.width,
        height: space.height,
        areaCm2,
        areaM2,
        volumeM3,
        compatibleModels,
        fitsAny: compatibleModels.length > 0,
        bestFitModel: bestFit
      };
    });
  }, [placedItems, customL, customW, customH, currentCounts]);

  // Backward compatibility alias for emptySpaces
  const emptySpaces = useMemo(() => {
    return smartGaps.map(g => ({ x: g.x, y: g.y, width: g.width, height: g.height }));
  }, [smartGaps]);

  // Handle radiator insertion directly into a detected gap position
  const handleInsertIntoGap = (
    gap: SmartGapSpace,
    modelInfo: { spec: CatalogRadiatorSpec; needsRotation: boolean }
  ) => {
    const newItem: PlacedRadiatorItem = {
      id: `rad-gap-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      model: modelInfo.spec.label,
      width: modelInfo.spec.width,
      length: modelInfo.spec.length,
      height: modelInfo.spec.height,
      weight: modelInfo.spec.weight,
      color: modelInfo.spec.color,
      x: gap.x,
      y: gap.y,
      z: 0,
      layer: 1,
      rotated: modelInfo.needsRotation
    };

    updateItemsWithHistory([...placedItems, newItem]);
    setSelectedItemIds([newItem.id]);
    setActiveGapModal(null);

    if (addToast) {
      addToast(
        'success',
        `رادیاتور ${modelInfo.spec.label} در فضای خالی (${toPersianDigits(gap.width)}×${toPersianDigits(gap.height)}cm) جای‌گذاری شد.`
      );
    }
  };

  // Fill Empty Space Handler
  const handleFillEmptySpace = (space: FreeRectangle) => {
    const fittingSpec = RADIATOR_CATALOG.find(
      c => c.width <= space.width && c.length <= space.height
    ) || RADIATOR_CATALOG[0];

    const newItem: PlacedRadiatorItem = {
      id: `rad-gap-${Date.now()}`,
      model: fittingSpec.label,
      width: fittingSpec.width,
      length: fittingSpec.length,
      height: fittingSpec.height,
      weight: fittingSpec.weight,
      color: fittingSpec.color,
      x: space.x,
      y: space.y,
      z: 0,
      layer: 1
    };

    updateItemsWithHistory([...placedItems, newItem]);
    setSelectedItemIds([newItem.id]);
    if (addToast) addToast('success', `رادیاتور جدید به فضای خالی (${toPersianDigits(space.width)}×${toPersianDigits(space.height)}cm) افزوده شد.`);
  };

  // Helper check rectangle intersection
  const checkOverlap = (
    a: { x: number; y: number; w: number; l: number },
    b: { x: number; y: number; w: number; l: number }
  ) => {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.l &&
      a.y + a.l > b.y
    );
  };

  const checkOverlap3D = (
    a: { x: number; y: number; z: number; w: number; l: number; h: number },
    b: { x: number; y: number; z: number; w: number; l: number; h: number }
  ) => {
    const xOverlap = a.x < b.x + b.w && a.x + a.w > b.x;
    const yOverlap = a.y < b.y + b.l && a.y + a.l > b.y;
    const zOverlap = a.z < b.z + b.h && a.z + a.h > b.z;
    return xOverlap && yOverlap && zOverlap;
  };

  // Dynamic Push & Chain Reaction Engine (Simulates sliding affected nearby items smoothly)
  const applyPushSystem = (
    movingId: string,
    targetX: number,
    targetY: number,
    items: PlacedRadiatorItem[]
  ): PlacedRadiatorItem[] => {
    const movingItem = items.find(i => i.id === movingId);
    if (!movingItem) return items;

    const movingW = movingItem.rotated ? movingItem.length : movingItem.width;
    const movingL = movingItem.rotated ? movingItem.width : movingItem.length;

    const dx = targetX - movingItem.x;
    const dy = targetY - movingItem.y;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return items;

    const result = items.map(i => ({ ...i }));
    const activeMoving = result.find(i => i.id === movingId);
    if (!activeMoving) return items;
    activeMoving.x = targetX;
    activeMoving.y = targetY;

    // Queue of pushed items for chain reaction
    const queue: string[] = [movingId];
    const visited = new Set<string>([movingId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = result.find(i => i.id === currentId);
      if (!current) continue;
      const curW = current.rotated ? current.length : current.width;
      const curL = current.rotated ? current.width : current.length;

      // Check all other items for overlap with current
      for (const other of result) {
        if (other.id === currentId || visited.has(other.id)) continue;

        const othW = other.rotated ? other.length : other.width;
        const othL = other.rotated ? other.width : other.length;

        if (checkOverlap({ x: current.x, y: current.y, w: curW, l: curL }, { x: other.x, y: other.y, w: othW, l: othL })) {
          // Calculate required shift along major movement axis
          const overlapX = (current.x < other.x)
            ? (current.x + curW) - other.x
            : (other.x + othW) - current.x;
          const overlapY = (current.y < other.y)
            ? (current.y + curL) - other.y
            : (other.y + othL) - current.y;

          if (Math.abs(dx) >= Math.abs(dy)) {
            // Horizontal dominant push
            if (dx > 0) {
              other.x = current.x + curW;
            } else if (dx < 0) {
              other.x = current.x - othW;
            } else {
              other.x += overlapX;
            }
          } else {
            // Vertical dominant push
            if (dy > 0) {
              other.y = current.y + curL;
            } else if (dy < 0) {
              other.y = current.y - othL;
            } else {
              other.y += overlapY;
            }
          }

          // Clamp to truck boundaries
          other.x = Math.max(0, Math.min(customL - othW, other.x));
          other.y = Math.max(0, Math.min(customW - othL, other.y));

          visited.add(other.id);
          queue.push(other.id);
        }
      }
    }

    return result;
  };

  // Local Compaction Engine (Compacts nearby cluster after user drag release)
  const compactLocalRegion = (releasedId: string, items: PlacedRadiatorItem[]): PlacedRadiatorItem[] => {
    const target = items.find(i => i.id === releasedId);
    if (!target) return items;

    const result = items.map(i => ({ ...i }));
    const targetW = target.rotated ? target.length : target.width;
    const targetL = target.rotated ? target.width : target.length;

    // Compact items within 150cm neighborhood
    const radius = 150;
    const nearby = result.filter(i => {
      const itemW = i.rotated ? i.length : i.width;
      const itemL = i.rotated ? i.width : i.length;
      return (
        Math.abs((i.x + itemW / 2) - (target.x + targetW / 2)) < radius &&
        Math.abs((i.y + itemL / 2) - (target.y + targetL / 2)) < radius
      );
    });

    // Snap tiny gaps (<5cm) to adjacent edges or truck walls
    nearby.forEach(item => {
      const itemW = item.rotated ? item.length : item.width;
      const itemL = item.rotated ? item.width : item.length;

      if (item.x < 5) item.x = 0;
      if (item.y < 5) item.y = 0;
      if (customL - (item.x + itemW) < 5) item.x = customL - itemW;
      if (customW - (item.y + itemL) < 5) item.y = customW - itemL;

      // Align to adjacent neighbors if close
      nearby.forEach(other => {
        if (other.id === item.id) return;
        const othW = other.rotated ? other.length : other.width;
        const othL = other.rotated ? other.width : other.length;

        if (Math.abs((item.x + itemW) - other.x) < 4) item.x = other.x - itemW;
        if (Math.abs(item.x - (other.x + othW)) < 4) item.x = other.x + othW;
        if (Math.abs((item.y + itemL) - other.y) < 4) item.y = other.y - itemL;
        if (Math.abs(item.y - (other.y + othL)) < 4) item.y = other.y + othL;
      });
    });

    return result;
  };

  // Live Statistics & Center of Gravity (CoG) Calculations
  const stats = useMemo(() => {
    let totalWeight = 0;
    let totalVolumeM3 = 0;
    let totalPieces = placedItems.length;

    let weightedXSum = 0;
    let weightedYSum = 0;
    let leftWeight = 0;
    let rightWeight = 0;
    let maxZ = 0;

    let outsideBoundsCount = 0;
    let overlapCount = 0;

    for (let i = 0; i < placedItems.length; i++) {
      const item = placedItems[i];
      const itemW = item.rotated ? item.length : item.width;
      const itemL = item.rotated ? item.width : item.length;

      totalWeight += item.weight;
      totalVolumeM3 += (itemW * itemL * item.height) / 1000000;

      const itemCenterX = item.x + itemW / 2;
      const itemCenterY = item.y + itemL / 2;

      weightedXSum += item.weight * itemCenterX;
      weightedYSum += item.weight * itemCenterY;

      if (itemCenterY < customW / 2) {
        leftWeight += item.weight;
      } else {
        rightWeight += item.weight;
      }

      if (item.z + item.height > maxZ) {
        maxZ = item.z + item.height;
      }

      if (item.x + itemW > customL || item.y + itemL > customW || item.x < 0 || item.y < 0) {
        outsideBoundsCount++;
      }

      for (let j = i + 1; j < placedItems.length; j++) {
        const other = placedItems[j];
        const othW = other.rotated ? other.length : other.width;
        const othL = other.rotated ? other.width : other.length;
        const itemH = item.height || 62;
        const othH = other.height || 62;

        if (
          checkOverlap3D(
            { x: item.x, y: item.y, z: item.z || 0, w: itemW, l: itemL, h: itemH },
            { x: other.x, y: other.y, z: other.z || 0, w: othW, l: othL, h: othH }
          )
        ) {
          overlapCount++;
        }
      }
    }

    const truckVolumeM3 = (customL * customW * customH) / 1000000;
    const fillPercent = truckVolumeM3 > 0 ? Math.min(100, (totalVolumeM3 / truckVolumeM3) * 100) : 0;
    const remainingWeight = customCap - totalWeight;
    const remainingVolumeM3 = Math.max(0, truckVolumeM3 - totalVolumeM3);

    const cogX = totalWeight > 0 ? weightedXSum / totalWeight : customL / 2;
    const cogY = totalWeight > 0 ? weightedYSum / totalWeight : customW / 2;
    const cogXPercent = Math.round((cogX / customL) * 100);
    const cogYPercent = Math.round((cogY / customW) * 100);

    const leftPercent = totalWeight > 0 ? Math.round((leftWeight / totalWeight) * 100) : 50;
    const rightPercent = totalWeight > 0 ? 100 - leftPercent : 50;

    const frontAxleWeight = totalWeight > 0 ? Math.round(totalWeight * (1 - cogX / customL)) : 0;
    const rearAxleWeight = totalWeight > 0 ? Math.round(totalWeight * (cogX / customL)) : 0;
    const frontAxlePercent = totalWeight > 0 ? Math.round((frontAxleWeight / totalWeight) * 100) : 50;
    const rearAxlePercent = totalWeight > 0 ? 100 - frontAxlePercent : 50;

    const maxFrontAxleLimit = Math.round(customCap * 0.55);
    const maxRearAxleLimit = Math.round(customCap * 0.65);

    const isFrontAxleExceeded = frontAxleWeight > maxFrontAxleLimit;
    const isRearAxleExceeded = rearAxleWeight > maxRearAxleLimit;
    const isOverloaded = totalWeight > customCap;

    const lateralDeviation = Math.abs(cogYPercent - 50);
    const isLateralUnbalanced = lateralDeviation > 4;
    const isAxleUnbalanced = cogXPercent < 35 || cogXPercent > 65 || isFrontAxleExceeded || isRearAxleExceeded;
    const isHeightExceeded = maxZ > customH;

    let balanceStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let balanceStatusLabel = 'تراز عالی و ایمن (Safe)';
    let balanceStatusBg = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200';

    if (isOverloaded || isFrontAxleExceeded || isRearAxleExceeded || lateralDeviation > 10 || cogXPercent < 30 || cogXPercent > 70) {
      balanceStatus = 'danger';
      balanceStatusLabel = 'خطر ناایمنی شدید مرکز ثقل / اکسل (Dangerous)';
      balanceStatusBg = 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200';
    } else if (isLateralUnbalanced || isAxleUnbalanced) {
      balanceStatus = 'warning';
      balanceStatusLabel = 'هشدار عدم تعادل بار (Warning)';
      balanceStatusBg = 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200';
    }

    const warnings: string[] = [];
    if (isOverloaded) {
      warnings.push(`🚨 بار بیش از حد مجاز کامیون: ${fmtPersian(totalWeight - customCap, 0)} کیلوگرم اضافه بار!`);
    }
    if (isFrontAxleExceeded) {
      warnings.push(`🚨 حد مجاز اکسل جلو (${fmtPersian(maxFrontAxleLimit, 0)}kg) با بارگیری ${fmtPersian(frontAxleWeight, 0)}kg رد شده است!`);
    }
    if (isRearAxleExceeded) {
      warnings.push(`🚨 حد مجاز اکسل عقب (${fmtPersian(maxRearAxleLimit, 0)}kg) با بارگیری ${fmtPersian(rearAxleWeight, 0)}kg رد شده است!`);
    }
    if (isLateralUnbalanced) {
      const side = cogYPercent > 50 ? 'راست' : 'چپ';
      warnings.push(`⚠️ عدم تعادل عرضی: سنگینی بار به سمت ${side} متمایل است (${toPersianDigits(cogYPercent)}٪ راست / ${toPersianDigits(100 - cogYPercent)}٪ چپ) - خطر واژگونی در پیچ‌ها`);
    }
    if (isAxleUnbalanced && !isFrontAxleExceeded && !isRearAxleExceeded) {
      const axle = cogXPercent > 50 ? 'عقب' : 'جلو';
      warnings.push(`⚠️ عدم تعادل طولی: ${toPersianDigits(cogXPercent)}٪ بار روی اکسل ${axle} متمرکز است`);
    }
    if (outsideBoundsCount > 0) {
      warnings.push(`🚫 تعداد ${toPersianDigits(outsideBoundsCount)} رادیاتور از دیواره کامیون بیرون زده است!`);
    }
    if (overlapCount > 0) {
      warnings.push(`❌ تداخل/هم‌پوشانی ${toPersianDigits(overlapCount)} رادیاتور شناسایی شد!`);
    }
    if (isHeightExceeded) {
      warnings.push(`⛔ ارتفاع چیدمان (${toPersianDigits(Math.round(maxZ))}cm) از سقف کامیون (${toPersianDigits(customH)}cm) فراتر رفته است!`);
    }

    return {
      totalWeight,
      remainingWeight,
      fillPercent,
      remainingVolumeM3,
      totalPieces,
      palletCount: Math.ceil(totalPieces / 24),
      cogX,
      cogY,
      cogXPercent,
      cogYPercent,
      leftWeight,
      rightWeight,
      leftPercent,
      rightPercent,
      frontAxleWeight,
      rearAxleWeight,
      frontAxlePercent,
      rearAxlePercent,
      maxFrontAxleLimit,
      maxRearAxleLimit,
      isFrontAxleExceeded,
      isRearAxleExceeded,
      balanceStatus,
      balanceStatusLabel,
      balanceStatusBg,
      isOverloaded,
      isLateralUnbalanced,
      isAxleUnbalanced,
      isHeightExceeded,
      outsideBoundsCount,
      overlapCount,
      warnings
    };
  }, [placedItems, customL, customW, customH, customCap]);

  // AI Balance Advisor Suggestions
  const balanceSuggestions = useMemo(() => {
    if (placedItems.length === 0) return [];
    const suggestions: { text: string; actionText?: string }[] = [];

    if (Math.abs(stats.cogYPercent - 50) > 4) {
      const isRightHeavier = stats.cogYPercent > 50;
      const diffKg = Math.abs(stats.rightWeight - stats.leftWeight);
      const sideName = isRightHeavier ? 'راست' : 'چپ';
      const targetSideName = isRightHeavier ? 'چپ' : 'راست';

      suggestions.push({
        text: `برای برطرف کردن اختلاف ${toPersianDigits(Math.round(diffKg))} کیلوگرمی سمت ${sideName}، رادیاتورها را به سمت ${targetSideName} هدایت کنید تا مرکز ثقل عرضی دقیقاً روی ۵۰٪ تنظیم شود.`
      });
    }

    if (Math.abs(stats.cogXPercent - 50) > 8) {
      const isRearHeavier = stats.cogXPercent > 50;
      const diffKg = Math.abs(stats.rearAxleWeight - stats.frontAxleWeight);
      const axleName = isRearHeavier ? 'عقب (درب کانتینر)' : 'جلو (کابین)';
      const targetAxleName = isRearHeavier ? 'جلو (کابین)' : 'عقب (درب کانتینر)';

      suggestions.push({
        text: `فشار بار روی اکسل ${axleName} زیاد است (${toPersianDigits(stats.cogXPercent)}٪). انتقال چند قطعه سنگین‌تر به سمت ${targetAxleName} اختلاف ${toPersianDigits(Math.round(diffKg))}kg را متوازن می‌کند.`
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        text: 'مرکز ثقل و توزیع وزن اکسل‌ها در وضعیت کاملاً استاندارد و متوازن قرار دارد (۵۰/۵۰).'
      });
    }

    return suggestions;
  }, [placedItems, stats]);

  // Auto Balance Center of Gravity Function
  const handleAutoBalance = () => {
    if (placedItems.length === 0) return;
    const sorted = [...placedItems].sort((a, b) => a.x - b.x);
    autoPackItems(sorted, customL, customW, customH);
    if (addToast) addToast('success', 'بهینه‌سازی خودکار مرکز ثقل و توزیع متوازن بار اکسل‌ها انجام شد.');
  };

  // Copy / Paste / Multi-Selection Actions
  const handleCopySelected = () => {
    if (selectedItemIds.length === 0) return;
    const selected = placedItems.filter(i => selectedItemIds.includes(i.id));
    setCopiedItems(selected);
    if (addToast) addToast('info', `تعداد ${toPersianDigits(selected.length)} رادیاتور کپی شد.`);
  };

  const handlePasteCopied = () => {
    if (copiedItems.length === 0) return;
    const newItems = copiedItems.map((item, idx) => ({
      ...item,
      id: `rad-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      x: Math.min(customL - item.width, item.x + 15),
      y: Math.min(customW - item.length, item.y + 15)
    }));

    const updated = [...placedItems, ...newItems];
    updateItemsWithHistory(updated);
    setSelectedItemIds(newItems.map(i => i.id));
    if (addToast) addToast('success', `تعداد ${toPersianDigits(newItems.length)} رادیاتور چسبانده شد (Paste).`);
  };

  const handleRotate90Selected = () => {
    if (selectedItemIds.length === 0) return;
    const updated = placedItems.map(item =>
      selectedItemIds.includes(item.id) ? { ...item, rotated: !item.rotated } : item
    );
    updateItemsWithHistory(updated);
  };

  const handleRotate180Selected = () => {
    if (selectedItemIds.length === 0) return;
    const updated = placedItems.map(item =>
      selectedItemIds.includes(item.id) ? { ...item, rotated: !item.rotated } : item
    );
    updateItemsWithHistory(updated);
    if (addToast) addToast('info', 'چرخش ۱۸۰ درجه اعمال شد.');
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0) return;
    const updated = placedItems.filter(i => !selectedItemIds.includes(i.id));
    updateItemsWithHistory(updated);
    setSelectedItemIds([]);
    if (addToast) addToast('warning', 'رادیاتورهای انتخابی حذف شدند.');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteCopied();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, copiedItems, historyStep, history]);

  // Pointer Event Handlers for CAD Canvas Dragging
  const handlePointerStart = (clientX: number, clientY: number, shiftKey: boolean, pointerId?: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    if (pointerId !== undefined && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(pointerId); } catch (e) { /* ignore */ }
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = customL / (rect.width / zoomScale);
    const scaleY = customW / (rect.height / zoomScale);

    const clickX = (clientX - rect.left - panOffset.x) * scaleX;
    const clickY = (clientY - rect.top - panOffset.y) * scaleY;

    // Find clicked radiator (topmost)
    const found = [...placedItems].reverse().find(item => {
      const itemW = item.rotated ? item.length : item.width;
      const itemL = item.rotated ? item.width : item.length;
      return (
        clickX >= item.x &&
        clickX <= item.x + itemW &&
        clickY >= item.y &&
        clickY <= item.y + itemL
      );
    });

    if (found) {
      if (shiftKey) {
        setSelectedItemIds(prev =>
          prev.includes(found.id) ? prev.filter(id => id !== found.id) : [...prev, found.id]
        );
      } else {
        setSelectedItemIds([found.id]);
      }
      setDraggedItemId(found.id);
      setDragOffset({
        x: clickX - found.x,
        y: clickY - found.y
      });

      const itemW = found.rotated ? found.length : found.width;
      const itemL = found.rotated ? found.width : found.length;

      const totalFloorAreaM2 = (customL * customW) / 10000;
      let totalOccupiedCm2 = 0;
      placedItems.forEach(i => {
        const w = i.rotated ? i.length : i.width;
        const l = i.rotated ? i.width : i.length;
        totalOccupiedCm2 += w * l;
      });
      const occupiedAreaM2 = totalOccupiedCm2 / 10000;
      const remainingFreeAreaM2 = Math.max(0, totalFloorAreaM2 - occupiedAreaM2);
      const occupiedPercent = Math.min(100, (occupiedAreaM2 / totalFloorAreaM2) * 100);

      setDragLiveInfo({
        x: Math.round(found.x),
        y: Math.round(found.y),
        w: itemW,
        l: itemL,
        weight: found.weight,
        areaM2: Number(((itemW * itemL) / 10000).toFixed(2)),
        model: found.model,
        rotationAngle: found.rotated ? 90 : 0,
        isInvalid: false,
        ghostStatus: 'green',
        distToLeft: Math.round(found.x),
        distToTop: Math.round(found.y),
        remainingFreeAreaM2: Number(remainingFreeAreaM2.toFixed(2)),
        occupiedPercent: Math.round(occupiedPercent)
      });
    } else {
      // Check if user tapped an empty space gap!
      const clickedGap = smartGaps.find(gap =>
        clickX >= gap.x &&
        clickX <= gap.x + gap.width &&
        clickY >= gap.y &&
        clickY <= gap.y + gap.height
      );

      if (clickedGap) {
        setActiveGapModal(clickedGap);
      } else {
        if (!shiftKey) setSelectedItemIds([]);
      }
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!draggedItemId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = customL / (rect.width / zoomScale);
    const scaleY = customW / (rect.height / zoomScale);

    let rawX = (clientX - rect.left - panOffset.x) * scaleX - dragOffset.x;
    let rawY = (clientY - rect.top - panOffset.y) * scaleY - dragOffset.y;

    const draggedItem = placedItems.find(i => i.id === draggedItemId);
    if (!draggedItem) return;

    const itemW = draggedItem.rotated ? draggedItem.length : draggedItem.width;
    const itemL = draggedItem.rotated ? draggedItem.width : draggedItem.length;

    let targetX = rawX;
    let targetY = rawY;

    // Grid Snap
    if (enableSnapGrid) {
      targetX = Math.round(targetX / gridStepCm) * gridStepCm;
      targetY = Math.round(targetY / gridStepCm) * gridStepCm;
    }

    const activeGuides: AlignmentGuide[] = [];

    // Magnetic Snap to Truck Walls, Center Lines & Neighbor Edges
    if (enableMagneticSnap) {
      const snapThreshold = 12; // 12cm magnet range

      // Magnet X: Left Wall (0), Right Wall (customL)
      if (Math.abs(targetX) <= snapThreshold) {
        targetX = 0;
        activeGuides.push({ type: 'x', pos: 0 });
      }
      if (Math.abs(targetX + itemW - customL) <= snapThreshold) {
        targetX = customL - itemW;
        activeGuides.push({ type: 'x', pos: customL });
      }

      // Magnet X: Truck Center Line (customL / 2)
      if (Math.abs((targetX + itemW / 2) - customL / 2) <= snapThreshold) {
        targetX = customL / 2 - itemW / 2;
        activeGuides.push({ type: 'x', pos: customL / 2 });
      }

      // Magnet Y: Top Wall (0), Bottom Wall (customW)
      if (Math.abs(targetY) <= snapThreshold) {
        targetY = 0;
        activeGuides.push({ type: 'y', pos: 0 });
      }
      if (Math.abs(targetY + itemL - customW) <= snapThreshold) {
        targetY = customW - itemL;
        activeGuides.push({ type: 'y', pos: customW });
      }

      // Magnet Y: Truck Center Line (customW / 2)
      if (Math.abs((targetY + itemL / 2) - customW / 2) <= snapThreshold) {
        targetY = customW / 2 - itemL / 2;
        activeGuides.push({ type: 'y', pos: customW / 2 });
      }

      // Magnet to adjacent items
      for (const other of placedItems) {
        if (other.id === draggedItemId) continue;
        const othW = other.rotated ? other.length : other.width;
        const othL = other.rotated ? other.width : other.length;

        // X alignment (edges)
        if (Math.abs(targetX - (other.x + othW)) <= snapThreshold) {
          targetX = other.x + othW;
          activeGuides.push({ type: 'x', pos: other.x + othW });
        }
        if (Math.abs(targetX + itemW - other.x) <= snapThreshold) {
          targetX = other.x - itemW;
          activeGuides.push({ type: 'x', pos: other.x });
        }
        // X alignment (centers)
        if (Math.abs((targetX + itemW / 2) - (other.x + othW / 2)) <= snapThreshold) {
          targetX = (other.x + othW / 2) - itemW / 2;
          activeGuides.push({ type: 'x', pos: other.x + othW / 2 });
        }

        // Y alignment (edges)
        if (Math.abs(targetY - (other.y + othL)) <= snapThreshold) {
          targetY = other.y + othL;
          activeGuides.push({ type: 'y', pos: other.y + othL });
        }
        if (Math.abs(targetY + itemL - other.y) <= snapThreshold) {
          targetY = other.y - itemL;
          activeGuides.push({ type: 'y', pos: other.y });
        }
        // Y alignment (centers)
        if (Math.abs((targetY + itemL / 2) - (other.y + othL / 2)) <= snapThreshold) {
          targetY = (other.y + othL / 2) - itemL / 2;
          activeGuides.push({ type: 'y', pos: other.y + othL / 2 });
        }
      }
    }

    // Clamp inside truck boundaries (Never allow ghost outside truck boundaries)
    targetX = Math.max(0, Math.min(customL - itemW, targetX));
    targetY = Math.max(0, Math.min(customW - itemL, targetY));

    // Apply Push System if enabled
    let updatedItems = [...placedItems];
    if (enablePushSystem) {
      updatedItems = applyPushSystem(draggedItemId, targetX, targetY, placedItems);
    } else {
      updatedItems = placedItems.map(i => (i.id === draggedItemId ? { ...i, x: targetX, y: targetY } : i));
    }

    setPlacedItems(updatedItems);
    if (enableCADGuides) {
      setAlignmentGuides(activeGuides);
    }

    // Check overlap validity
    let hasOverlap = false;
    for (const other of updatedItems) {
      if (other.id === draggedItemId) continue;
      const othW = other.rotated ? other.length : other.width;
      const othL = other.rotated ? other.width : other.length;
      if (checkOverlap({ x: targetX, y: targetY, w: itemW, l: itemL }, { x: other.x, y: other.y, w: othW, l: othL })) {
        hasOverlap = true;
        break;
      }
    }

    // Check Weight Distribution Safety
    let tempTotalWeight = 0;
    let tempWeightedX = 0;
    let tempWeightedY = 0;
    for (const item of updatedItems) {
      const w = item.rotated ? item.length : item.width;
      const l = item.rotated ? item.width : item.length;
      tempTotalWeight += item.weight;
      tempWeightedX += item.weight * (item.x + w / 2);
      tempWeightedY += item.weight * (item.y + l / 2);
    }
    const tempCogX = tempTotalWeight > 0 ? tempWeightedX / tempTotalWeight : customL / 2;
    const tempCogY = tempTotalWeight > 0 ? tempWeightedY / tempTotalWeight : customW / 2;
    const cogXPercent = Math.round((tempCogX / customL) * 100);
    const cogYPercent = Math.round((tempCogY / customW) * 100);

    const isOverloaded = tempTotalWeight > customCap;
    const isLateralUnbalanced = Math.abs(cogYPercent - 50) > 8;
    const isAxleUnbalanced = cogXPercent < 35 || cogXPercent > 65;
    const isWeightUnsafe = isOverloaded || isLateralUnbalanced || isAxleUnbalanced;

    const isAligned = activeGuides.length > 0;

    let ghostStatus: 'green' | 'red' | 'orange' | 'blue' = 'green';
    if (hasOverlap) {
      ghostStatus = 'red';
    } else if (isWeightUnsafe) {
      ghostStatus = 'orange';
    } else if (isAligned) {
      ghostStatus = 'blue';
    } else {
      ghostStatus = 'green';
    }

    // Live remaining free area & occupied percentage
    const totalFloorAreaM2 = (customL * customW) / 10000;
    let totalOccupiedCm2 = 0;
    updatedItems.forEach(i => {
      const w = i.rotated ? i.length : i.width;
      const l = i.rotated ? i.width : i.length;
      totalOccupiedCm2 += w * l;
    });
    const occupiedAreaM2 = totalOccupiedCm2 / 10000;
    const remainingFreeAreaM2 = Math.max(0, totalFloorAreaM2 - occupiedAreaM2);
    const occupiedPercent = Math.min(100, (occupiedAreaM2 / totalFloorAreaM2) * 100);

    setDragLiveInfo({
      x: Math.round(targetX),
      y: Math.round(targetY),
      w: itemW,
      l: itemL,
      weight: draggedItem.weight,
      areaM2: Number(((itemW * itemL) / 10000).toFixed(2)),
      model: draggedItem.model,
      rotationAngle: draggedItem.rotated ? 90 : 0,
      isInvalid: hasOverlap,
      ghostStatus,
      distToLeft: Math.round(targetX),
      distToTop: Math.round(targetY),
      remainingFreeAreaM2: Number(remainingFreeAreaM2.toFixed(2)),
      occupiedPercent: Math.round(occupiedPercent)
    });
  };

  const handlePointerEnd = (pointerId?: number) => {
    if (canvasRef.current && pointerId !== undefined && canvasRef.current.releasePointerCapture) {
      try { canvasRef.current.releasePointerCapture(pointerId); } catch (e) { /* ignore */ }
    }

    if (draggedItemId) {
      let finalItems = placedItems;
      if (enableLocalCompact) {
        finalItems = compactLocalRegion(draggedItemId, placedItems);
        setPlacedItems(finalItems);
      }
      pushHistory(finalItems);
      setDraggedItemId(null);
      setDragLiveInfo(null);
      setAlignmentGuides([]);
    }
  };

  // Render 2D CAD Top View Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (viewTab !== '2d' && viewTab !== 'sequence')) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomScale, zoomScale);

    // Canvas CAD Background (Dark Slate Engineering Grid)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Engineering Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    const gridStepX = (gridStepCm / customL) * width;
    const gridStepY = (gridStepCm / customW) * height;

    for (let x = 0; x < width; x += gridStepX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStepY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const scaleX = width / customL;
    const scaleY = height / customW;

    // Draw Truck Center Lines (Length & Width Center Axis)
    const truckCenterX = (customL / 2) * scaleX;
    const truckCenterY = (customW / 2) * scaleY;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);

    ctx.beginPath();
    ctx.moveTo(truckCenterX, 0);
    ctx.lineTo(truckCenterX, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, truckCenterY);
    ctx.lineTo(width, truckCenterY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw Highlighted Empty Spaces (Smart Gap Detection: Semi-transparent Blue/Green/Gray)
    if (showEmptySpaces && smartGaps.length > 0) {
      smartGaps.forEach((space) => {
        const spacePxX = space.x * scaleX;
        const spacePxY = space.y * scaleY;
        const spacePxW = space.width * scaleX;
        const spacePxH = space.height * scaleY;

        // Base semi-transparent blue scan layer
        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
        ctx.fillRect(spacePxX, spacePxY, spacePxW, spacePxH);

        if (space.fitsAny) {
          // Highlight in semi-transparent green when a radiator can fit
          ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
          ctx.fillRect(spacePxX, spacePxY, spacePxW, spacePxH);

          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(spacePxX, spacePxY, spacePxW, spacePxH);
          ctx.setLineDash([]);

          // Display "Suitable for Model XXXX" badge
          if (spacePxW > 35 && spacePxH > 16) {
            const labelText = space.bestFitModel
              ? `Suitable for Model ${space.bestFitModel.size}cm`
              : 'Suitable for Radiators';

            ctx.fillStyle = '#15803d';
            ctx.font = 'bold 9px Tahoma, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, spacePxX + spacePxW / 2, spacePxY + spacePxH / 2);
          }
        } else {
          // Display space in semi-transparent gray when no radiator fits
          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.fillRect(spacePxX, spacePxY, spacePxW, spacePxH);

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(spacePxX, spacePxY, spacePxW, spacePxH);
          ctx.setLineDash([]);

          if (spacePxW > 30 && spacePxH > 16) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 9px Tahoma, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`فضای محدود (${space.width}×${space.height})`, spacePxX + spacePxW / 2, spacePxY + spacePxH / 2);
          }
        }
      });
    }

    // Draw Weight Distribution Density Heatmap Overlay
    if (showHeatmap && placedItems.length > 0) {
      ctx.save();
      const cols = 16;
      const rows = 8;
      const cellWidthCm = customL / cols;
      const cellHeightCm = customW / rows;
      const cellWidthPx = width / cols;
      const cellHeightPx = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellMinX = c * cellWidthCm;
          const cellMaxX = (c + 1) * cellWidthCm;
          const cellMinY = r * cellHeightCm;
          const cellMaxY = (r + 1) * cellHeightCm;

          let cellWeightSum = 0;
          placedItems.forEach(item => {
            const itemW = item.rotated ? item.length : item.width;
            const itemL = item.rotated ? item.width : item.length;
            const overlapW = Math.max(0, Math.min(cellMaxX, item.x + itemW) - Math.max(cellMinX, item.x));
            const overlapH = Math.max(0, Math.min(cellMaxY, item.y + itemL) - Math.max(cellMinY, item.y));
            if (overlapW > 0 && overlapH > 0) {
              const itemArea = itemW * itemL;
              const overlapArea = overlapW * overlapH;
              cellWeightSum += item.weight * (overlapArea / itemArea);
            }
          });

          if (cellWeightSum > 0) {
            const cellAreaM2 = (cellWidthCm * cellHeightCm) / 10000;
            const density = cellWeightSum / cellAreaM2;

            let fillStyle = 'rgba(59, 130, 246, 0.20)';
            if (density > 220) fillStyle = 'rgba(239, 68, 68, 0.45)';
            else if (density > 150) fillStyle = 'rgba(245, 158, 11, 0.38)';
            else if (density > 80) fillStyle = 'rgba(34, 197, 94, 0.30)';

            ctx.fillStyle = fillStyle;
            ctx.fillRect(c * cellWidthPx, r * cellHeightPx, cellWidthPx, cellHeightPx);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cellWidthPx, r * cellHeightPx, cellWidthPx, cellHeightPx);
          }
        }
      }
      ctx.restore();
    }
    alignmentGuides.forEach((guide) => {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      if (guide.type === 'x') {
        const pxX = guide.pos * scaleX;
        ctx.moveTo(pxX, 0);
        ctx.lineTo(pxX, height);
      } else {
        const pxY = guide.pos * scaleY;
        ctx.moveTo(0, pxY);
        ctx.lineTo(width, pxY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Placed Radiators
    placedItems.forEach((item) => {
      const itemW = (item.rotated ? item.length : item.width) * scaleX;
      const itemL = (item.rotated ? item.width : item.length) * scaleY;
      const posX = item.x * scaleX;
      const posY = item.y * scaleY;

      const isSelected = selectedItemIds.includes(item.id);
      const isDragged = item.id === draggedItemId;

      ctx.fillStyle = item.color || '#3b82f6';
      ctx.fillRect(posX, posY, itemW, itemL);

      if (isDragged && dragLiveInfo?.isInvalid) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(posX, posY, itemW, itemL);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
      } else if (isDragged) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.fillRect(posX, posY, itemW, itemL);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3.5;
      } else if (isSelected) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.fillRect(posX, posY, itemW, itemL);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
      }
      ctx.strokeRect(posX, posY, itemW, itemL);

      if (itemW > 25 && itemL > 12) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Tahoma, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${item.width}`, posX + itemW / 2, posY + itemL / 2);
      }
    });

    // Draw Professional Ghost Radiator Preview Overlay
    if (draggedItemId && dragLiveInfo) {
      const ghostX = dragLiveInfo.x * scaleX;
      const ghostY = dragLiveInfo.y * scaleY;
      const ghostW = dragLiveInfo.w * scaleX;
      const ghostH = dragLiveInfo.l * scaleY;

      let ghostFill = 'rgba(34, 197, 94, 0.40)'; // Green Ghost (Valid)
      let ghostStroke = '#22c55e';
      let ghostGlow = '#22c55e';

      if (dragLiveInfo.ghostStatus === 'red') {
        ghostFill = 'rgba(239, 68, 68, 0.50)'; // Red Ghost (Overlap / Out of Bounds)
        ghostStroke = '#ef4444';
        ghostGlow = '#ef4444';
      } else if (dragLiveInfo.ghostStatus === 'orange') {
        ghostFill = 'rgba(249, 115, 22, 0.50)'; // Orange Ghost (Unsafe Weight Balance)
        ghostStroke = '#f97316';
        ghostGlow = '#f97316';
      } else if (dragLiveInfo.ghostStatus === 'blue') {
        ghostFill = 'rgba(59, 130, 246, 0.50)'; // Blue Ghost (Perfect Alignment)
        ghostStroke = '#3b82f6';
        ghostGlow = '#3b82f6';
      }

      ctx.save();

      // Shadow Glow Effect
      ctx.shadowColor = ghostGlow;
      ctx.shadowBlur = 14;

      // Ghost Fill
      ctx.fillStyle = ghostFill;
      ctx.fillRect(ghostX, ghostY, ghostW, ghostH);

      // Ghost Dashed Border
      ctx.strokeStyle = ghostStroke;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(ghostX, ghostY, ghostW, ghostH);
      ctx.setLineDash([]);

      // Ghost Dimensions & Coordinates Text Overlay
      if (ghostW > 30 && ghostH > 16) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Tahoma, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000000';
        ctx.fillText(`${dragLiveInfo.w}×${dragLiveInfo.l} cm`, ghostX + ghostW / 2, ghostY + ghostH / 2 - 5);
        ctx.font = 'bold 9px Tahoma, Arial';
        ctx.fillText(`(${dragLiveInfo.x}, ${dragLiveInfo.y}) - ${dragLiveInfo.rotationAngle}° | ${dragLiveInfo.weight}kg`, ghostX + ghostW / 2, ghostY + ghostH / 2 + 7);
      }

      ctx.restore();

      // Distance Arrow Lines to Walls
      ctx.strokeStyle = ghostStroke;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);

      // Left distance line
      ctx.beginPath();
      ctx.moveTo(0, ghostY + ghostH / 2);
      ctx.lineTo(ghostX, ghostY + ghostH / 2);
      ctx.stroke();

      // Top distance line
      ctx.beginPath();
      ctx.moveTo(ghostX + ghostW / 2, 0);
      ctx.lineTo(ghostX + ghostW / 2, ghostY);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw Center of Gravity (CoG) Target Crosshair & Floating Label
    if (showCoGOverlay && placedItems.length > 0) {
      const cogPxX = (stats.cogX / customL) * width;
      const cogPxY = (stats.cogY / customW) * height;

      const targetColor = stats.balanceStatus === 'safe'
        ? '#22c55e'
        : stats.balanceStatus === 'warning'
        ? '#eab308'
        : '#ef4444';

      ctx.save();
      ctx.shadowColor = targetColor;
      ctx.shadowBlur = 12;

      // Outer circle
      ctx.beginPath();
      ctx.arc(cogPxX, cogPxY, 15, 0, Math.PI * 2);
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(cogPxX, cogPxY, 7, 0, Math.PI * 2);
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center solid dot
      ctx.beginPath();
      ctx.arc(cogPxX, cogPxY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = targetColor;
      ctx.fill();

      // Crosshair Ticks
      ctx.beginPath();
      ctx.moveTo(cogPxX - 22, cogPxY);
      ctx.lineTo(cogPxX + 22, cogPxY);
      ctx.moveTo(cogPxX, cogPxY - 22);
      ctx.lineTo(cogPxX, cogPxY + 22);
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // High visibility floating badge label
      const labelText = `🎯 CG: (${toPersianDigits(Math.round(stats.cogX))}cm, ${toPersianDigits(Math.round(stats.cogY))}cm)`;
      ctx.font = 'bold 10px Tahoma, Arial';
      const textWidth = ctx.measureText(labelText).width;
      const badgeX = Math.min(width - textWidth - 15, Math.max(10, cogPxX - textWidth / 2));
      const badgeY = cogPxY > height / 2 ? cogPxY - 26 : cogPxY + 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.fillRect(badgeX - 5, badgeY - 11, textWidth + 10, 18);
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(badgeX - 5, badgeY - 11, textWidth + 10, 18);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX, badgeY - 2);

      ctx.restore();
    }

    // Draw Smart Loading Sequence Badges & Forklift Path Overlay
    if (viewTab === 'sequence' || showSequenceNumbers) {
      // 1. Draw Forklift Path Connecting Step 1 -> 2 -> ... -> N
      if (showForkliftPath && sequenceItems.length > 0) {
        const doorX = customL * scaleX; // Rear Door Entry
        const doorY = (customW / 2) * scaleY;

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(doorX, doorY);

        let prevPxX = doorX;
        let prevPxY = doorY;

        sequenceItems.forEach((item, idx) => {
          const seq = item.sequence || (idx + 1);
          if (viewTab === 'sequence' && sequenceAnimStep > 0 && seq > sequenceAnimStep) return;

          const itemW = (item.rotated ? item.length : item.width) * scaleX;
          const itemL = (item.rotated ? item.width : item.length) * scaleY;
          const targetPxX = (item.x * scaleX) + itemW / 2;
          const targetPxY = (item.y * scaleY) + itemL / 2;

          ctx.lineTo(targetPxX, targetPxY);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(targetPxY - prevPxY, targetPxX - prevPxX);
          const headLen = 9;
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.fillStyle = '#f59e0b';
          ctx.moveTo(targetPxX, targetPxY);
          ctx.lineTo(targetPxX - headLen * Math.cos(angle - Math.PI / 6), targetPxY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(targetPxX - headLen * Math.cos(angle + Math.PI / 6), targetPxY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.setLineDash([6, 4]);
          ctx.moveTo(targetPxX, targetPxY);

          prevPxX = targetPxX;
          prevPxY = targetPxY;
        });

        ctx.restore();
      }

      // 2. Draw Sequence Number Badge Circles on Each Radiator
      placedItems.forEach((item) => {
        const itemW = (item.rotated ? item.length : item.width) * scaleX;
        const itemL = (item.rotated ? item.width : item.length) * scaleY;
        const posX = item.x * scaleX;
        const posY = item.y * scaleY;
        const seq = item.sequence || 1;

        // In sequence mode during animation, hide items that haven't been loaded yet
        if (viewTab === 'sequence' && sequenceAnimStep > 0 && seq > sequenceAnimStep) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(posX, posY, itemW, itemL);
          ctx.restore();
          return;
        }

        const isBlocked = sequenceBlockingWarnings.some(w => w.blockedItemId === item.id);
        const isCurrentStep = viewTab === 'sequence' && sequenceAnimStep === seq;

        ctx.save();
        if (isCurrentStep) {
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.5;
          ctx.strokeRect(posX - 3, posY - 3, itemW + 6, itemL + 6);
        }

        const badgeRadius = Math.max(10, Math.min(14, Math.min(itemW, itemL) / 2.8));
        const badgeX = posX + badgeRadius + 3;
        const badgeY = posY + badgeRadius + 3;

        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isBlocked ? '#ef4444' : isCurrentStep ? '#f59e0b' : '#0284c7';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(badgeRadius * 1.15)}px Tahoma, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${seq}`, badgeX, badgeY);
        ctx.restore();
      });
    }

    ctx.restore();
  }, [placedItems, selectedItemIds, draggedItemId, dragLiveInfo, alignmentGuides, smartGaps, showEmptySpaces, customL, customW, stats, viewTab, zoomScale, panOffset, gridStepCm, sequenceItems, sequenceAnimStep, showSequenceNumbers, showForkliftPath, sequenceBlockingWarnings, showHeatmap, showCoGOverlay]);

  // Save Layout Modal Handlers
  const handleSaveLayoutModal = () => {
    if (!layoutNameInput.trim()) return;

    const newLayout: SavedSmartLayout = {
      id: 'layout-' + Date.now(),
      name: layoutNameInput.trim(),
      createdAt: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR'),
      truck: selectedTruck,
      items: [...placedItems],
      totalWeight: stats.totalWeight,
      totalPieces: stats.totalPieces,
      fillPercent: Math.round(stats.fillPercent)
    };

    const updated = [newLayout, ...savedLayouts];
    saveSavedLayoutsToStorage(updated);
    setLayoutNameInput('');
    setIsSavedModalOpen(false);
    if (addToast) addToast('success', `طرح چیدمان "${newLayout.name}" با موفقیت ذخیره گردید.`);
  };

  const handleLoadSavedLayout = (layout: SavedSmartLayout) => {
    updateTruckDetailsParent({
      id: layout.truck.id,
      model: layout.truck.name,
      L: layout.truck.L,
      W: layout.truck.W,
      H: layout.truck.H,
      cap: layout.truck.cap
    });
    updateItemsWithHistory(layout.items);
    setIsSavedModalOpen(false);
    if (addToast) addToast('success', `طرح "${layout.name}" بارگذاری شد.`);
  };

  const handleDeleteSavedLayout = (id: string) => {
    const updated = savedLayouts.filter(l => l.id !== id);
    saveSavedLayoutsToStorage(updated);
    if (addToast) addToast('warning', 'طرح ذخیره‌شده حذف گردید.');
  };

  const evaluationResultFor3D = useMemo((): EvaluationResult => {
    const calcLanes = Math.max(1, Math.floor(customW / 60));
    const laneW = customW / calcLanes;
    return {
      ok: true,
      truck: {
        id: selectedTruck.id,
        name: selectedTruck.name,
        L: customL,
        W: customW,
        H: customH,
        cap: customCap
      },
      lanesCount: calcLanes,
      maxLayers: Math.max(1, Math.floor(customH / 55)),
      usedLayers: Math.max(1, ...placedItems.map(i => i.layer || 1)),
      packed: [
        {
          ok: true,
          usedLength: customL,
          lanes: Array.from({ length: calcLanes }).map((_, laneIdx) => {
            const laneItems = placedItems.filter(i => {
              const centerY = i.y + (i.length || 11) / 2;
              const idx = Math.min(calcLanes - 1, Math.max(0, Math.floor(centerY / laneW)));
              return idx === laneIdx;
            });
            return {
              rem: 0,
              items: laneItems.map(i => {
                const nominalLen = i.width >= 46 ? i.width - 6 : i.width;
                return { length: nominalLen, weight: i.weight };
              }),
              list: laneItems.map(i => (i.width >= 46 ? i.width - 6 : i.width))
            };
          })
        }
      ],
      fill: Math.round(stats.fillPercent),
      reserve: Math.max(0, 100 - Math.round(stats.fillPercent)),
      approxAxle: Math.round(stats.totalWeight * 0.5),
      axleOk: !stats.isAxleUnbalanced,
      axleBalanceScore: 100 - Math.abs(stats.cogXPercent - 50) * 2,
      frontAxleWeight: Math.round(stats.totalWeight * (stats.cogXPercent / 100)),
      rearAxleWeight: Math.round(stats.totalWeight * (1 - stats.cogXPercent / 100)),
      cogX: stats.cogX,
      cogY: stats.cogY,
      cogZ: 25,
      cogXPercent: stats.cogXPercent,
      cogYPercent: stats.cogYPercent,
      cogStatus: stats.isLateralUnbalanced || stats.isAxleUnbalanced ? 'warning' : 'perfect',
      cogStatusLabel: `مرکز ثقل: ${toPersianDigits(stats.cogXPercent)}٪ طولی | ${toPersianDigits(stats.cogYPercent)}٪ عرضی`
    };
  }, [selectedTruck, customL, customW, customH, customCap, placedItems, stats]);

  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `نقشه_چیدمان_کامیون_${selectedTruck.name}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = url;
    link.click();
    if (addToast) addToast('success', 'تصویر PNG با موفقیت دریافت شد.');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-xl mb-8">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Cpu className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              سامانه هوشمند بارگیری و چیدمان پویای کامیون (Warehouse CAD Loading Planner)
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                سیستم پویای پویا CAD
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              جابجایی تعاملی، سیستم هل دادن متوالی، چسبندگی مغناطیسی، خطوط راهنمای زنده و کنترل دستی کامل
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Advanced Optimization Button */}
          <button
            type="button"
            onClick={handleRunAdvancedOptimization}
            disabled={isPackingAnimating || isAdvancedOptRunning || placedItems.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 touch-manipulation"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span>بهینه‌سازی پیشرفته AI</span>
          </button>

          {/* AI Auto Arrange Button */}
          <button
            type="button"
            onClick={() => autoPackItems(placedItems, customL, customW, customH)}
            disabled={isPackingAnimating || placedItems.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50 touch-manipulation"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>چیدمان هوشمند</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition"
              title="واکشی (Undo) - Ctrl+Z"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition"
              title="بازگردانی (Redo) - Ctrl+Y"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Save Layout */}
          <button
            type="button"
            onClick={() => setIsSavedModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold px-3.5 py-2.5 rounded-xl transition text-xs"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>ذخیره / مدیریت طرح‌ها</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 transition text-xs"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 transition text-xs"
          >
            <Printer className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">چاپ</span>
          </button>
        </div>
      </div>

      {/* TRUCK SELECTOR */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-black text-slate-800 dark:text-slate-200">
          <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>انتخاب نوع خودرو و ابعاد کانتینر:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          {SMART_TRUCK_PRESETS.map((preset) => {
            const isSelected = selectedTruck.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTruckPreset(preset)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition active:scale-95 touch-manipulation ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                }`}
              >
                <Truck className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span className="text-xs font-black leading-tight">{preset.name}</span>
                <span className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {toPersianDigits(preset.L)}×{toPersianDigits(preset.W)} cm
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">طول (L cm):</label>
            <input
              type="number"
              value={customL}
              onChange={(e) => updateTruckDetailsParent({ id: 'custom', model: 'سفارشی', L: Math.max(100, Number(e.target.value)) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">عرض (W cm):</label>
            <input
              type="number"
              value={customW}
              onChange={(e) => updateTruckDetailsParent({ id: 'custom', model: 'سفارشی', W: Math.max(100, Number(e.target.value)) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">ارتفاع (H cm):</label>
            <input
              type="number"
              value={customH}
              onChange={(e) => updateTruckDetailsParent({ id: 'custom', model: 'سفارشی', H: Math.max(50, Number(e.target.value)) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">ظرفیت بار (kg):</label>
            <input
              type="number"
              value={customCap}
              onChange={(e) => updateTruckDetailsParent({ id: 'custom', model: 'سفارشی', cap: Math.max(500, Number(e.target.value)) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* WARNINGS */}
      {stats.warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {stats.warnings.map((warn, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs md:text-sm font-bold shadow-xs animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* LIVE METRICS STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">پرشدگی حجمی</span>
          <span className="text-lg md:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
            ٪{toPersianDigits(Math.round(stats.fillPercent))}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">وزن کل بارگیری</span>
          <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-mono">
            {fmtPersian(stats.totalWeight, 0)} <span className="text-xs">kg</span>
          </span>
        </div>

        <div className={`p-3.5 rounded-xl border text-center ${
          stats.remainingWeight < 0
            ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
        }`}>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">وزن مجاز باقیمانده</span>
          <span className="text-lg md:text-xl font-black font-mono">
            {fmtPersian(stats.remainingWeight, 0)} <span className="text-xs">kg</span>
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">رادیاتور / پالت</span>
          <span className="text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {toPersianDigits(stats.totalPieces)} <span className="text-xs">عدد ({toPersianDigits(stats.palletCount)} پالت)</span>
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">مرکز ثقل طولی (CG X)</span>
          <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ٪{toPersianDigits(stats.cogXPercent)}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">فضای خالی کف</span>
          <span className="text-lg md:text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {toPersianDigits(emptySpaces.length)} <span className="text-xs">موقعیت</span>
          </span>
        </div>
      </div>

      {/* ADVANCED OPTIMIZATION SCORECARD & PATTERN SELECTOR */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/30 text-white rounded-2xl p-4 md:p-6 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-500/20 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black flex items-center gap-2">
                <span>کارت امتیاز چیدمان و بهینه‌سازی صنعتی (Optimization Scorecard)</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  AI Engine v3.5
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                الگوریتم‌های الگویی MaxRects، قفل متقاطع (Interlocking)، ایستاده (Knife-Edge) و رفع موضعی فضاهای پرت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRunAdvancedOptimization}
              disabled={isPackingAnimating || isAdvancedOptRunning || placedItems.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 active:scale-95 text-slate-950 font-black px-5 py-3 rounded-xl shadow-xl shadow-amber-500/20 transition disabled:opacity-50 touch-manipulation text-sm shrink-0"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>اجرای بهینه‌سازی پیشرفته (Move & Relocate)</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 relative z-10">
          {/* Space Utilization */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-indigo-400/20 p-4 rounded-xl text-center">
            <span className="block text-xs font-bold text-indigo-200/80 mb-1">بهره‌وری فضای کانتینر</span>
            <span className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
              ٪{toPersianDigits(optMetrics?.spaceUtilizationPercent ?? Math.round(stats.fillPercent))}
            </span>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${optMetrics?.spaceUtilizationPercent ?? Math.round(stats.fillPercent)}%` }}
              ></div>
            </div>
          </div>

          {/* Dead Space */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-indigo-400/20 p-4 rounded-xl text-center">
            <span className="block text-xs font-bold text-indigo-200/80 mb-1">فضای پرت و مرده</span>
            <span className="text-2xl md:text-3xl font-black text-amber-400 font-mono">
              ٪{toPersianDigits(optMetrics?.deadSpacePercent ?? Math.max(1, 100 - Math.round(stats.fillPercent)))}
            </span>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${optMetrics?.deadSpacePercent ?? Math.max(1, 100 - Math.round(stats.fillPercent))}%` }}
              ></div>
            </div>
          </div>

          {/* Weight Balance */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-indigo-400/20 p-4 rounded-xl text-center">
            <span className="block text-xs font-bold text-indigo-200/80 mb-1">امتیاز توازن وزن اکسل‌ها</span>
            <span className="text-2xl md:text-3xl font-black text-blue-400 font-mono">
              ٪{toPersianDigits(optMetrics?.weightBalanceScore ?? (100 - Math.abs(stats.cogXPercent - 50) * 2))}
            </span>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${optMetrics?.weightBalanceScore ?? (100 - Math.abs(stats.cogXPercent - 50) * 2)}%` }}
              ></div>
            </div>
          </div>

          {/* Loading Efficiency */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-indigo-400/20 p-4 rounded-xl text-center">
            <span className="block text-xs font-bold text-indigo-200/80 mb-1">راندمان راندمان بارگیری کل</span>
            <span className="text-2xl md:text-3xl font-black text-purple-400 font-mono">
              ٪{toPersianDigits(optMetrics?.loadingEfficiencyScore ?? Math.round((stats.fillPercent * 0.7) + 25))}
            </span>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${optMetrics?.loadingEfficiencyScore ?? Math.round((stats.fillPercent * 0.7) + 25)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Supported Pattern Modes Selector */}
        <div className="mb-4 relative z-10">
          <div className="text-xs font-bold text-indigo-200/90 mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>انتخاب مستقیم الگوی چیدمان صنعتی (Loading Patterns):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'hybrid_maxrects', label: 'ترکیبی الگوریتم MaxRects', icon: Sparkles },
              { id: 'vertical_knife', label: 'عمودی تیغه‌ای (Knife-Edge)', icon: ArrowUp },
              { id: 'interlocking', label: 'متقاطع و قفل شونده (Interlocking)', icon: Grid },
              { id: 'brick_zigzag', label: 'آجری-زیگزاگ (Brick Pattern)', icon: Layers },
              { id: 'flat', label: 'چیدمان افقی تخت (Standard Flat Bed)', icon: Box }
            ].map((pat) => {
              const PatIcon = pat.icon;
              const isSelected = (optMetrics?.selectedPattern || selectedPatternMode) === pat.id;
              return (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatternMode(pat.id as LoadingPatternMode);
                    autoPackItems(placedItems, customL, customW, customH, pat.id as LoadingPatternMode);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-indigo-100 border border-indigo-400/20'
                  }`}
                >
                  <PatIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{pat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Explanation Logs Display */}
        {optMetrics?.explanationLogs && optMetrics.explanationLogs.length > 0 && (
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-100 relative z-10">
            <div className="font-bold text-amber-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>گزارش زنده هوش مصنوعی و دلایل جابجایی قطعات:</span>
            </div>
            <div className="space-y-1.5 font-mono">
              {optMetrics.explanationLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-1.5 rounded-lg transition-all ${
                    optExplanationIndex === idx ? 'bg-amber-500/20 text-amber-300 font-bold border-r-2 border-amber-400' : 'text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TRUCK CENTER OF GRAVITY & AXLE BALANCE ANALYSIS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>تحلیل زنده مرکز ثقل و توزیع بار اکسل‌ها (Truck CoG & Axle Load Analysis)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                محاسبه آنی بالانس طولی/عرضی کانتینر، اکسل جلو/عقب و درصد سنگینی طرفین
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Balance Status Badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 transition-all duration-500 ${stats.balanceStatusBg}`}>
              {stats.balanceStatus === 'safe' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
              )}
              <span>{stats.balanceStatusLabel}</span>
            </div>

            {/* Auto Balance Button */}
            <button
              type="button"
              onClick={handleAutoBalance}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95"
              title="توزیع خودکار متوازن بار روی اکسل‌ها و مرکز ثقل"
            >
              <Sparkles className="w-4 h-4" />
              <span>اصلاح خودکار تعادل</span>
            </button>
          </div>
        </div>

        {/* 4 CORE METRIC CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 1. Center of Gravity Coordinates */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4 text-amber-500" />
                مختصات مرکز ثقل (CoG)
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                X:{toPersianDigits(Math.round(stats.cogX))}cm | Y:{toPersianDigits(Math.round(stats.cogY))}cm
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-600 dark:text-slate-400">موقعیت طولی (X):</span>
                <span className="font-mono text-slate-900 dark:text-white">٪{toPersianDigits(stats.cogXPercent)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, stats.cogXPercent))}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-bold pt-1">
                <span className="text-slate-600 dark:text-slate-400">موقعیت عرضی (Y):</span>
                <span className="font-mono text-slate-900 dark:text-white">٪{toPersianDigits(stats.cogYPercent)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    stats.isLateralUnbalanced ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, stats.cogYPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Left vs Right Weight Split */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Scale className="w-4 h-4 text-blue-500" />
                توازن چپ / راست (Left/Right)
              </span>
              <span className={`font-mono font-bold ${stats.isLateralUnbalanced ? 'text-red-500' : 'text-emerald-500'}`}>
                ٪{toPersianDigits(stats.leftPercent)} / ٪{toPersianDigits(stats.rightPercent)}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-blue-600 dark:text-blue-400">چپ: {fmtPersian(stats.leftWeight, 0)} kg</span>
                <span className="text-indigo-600 dark:text-indigo-400">راست: {fmtPersian(stats.rightWeight, 0)} kg</span>
              </div>

              <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${stats.leftPercent}%` }}
                />
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                  style={{ width: `${stats.rightPercent}%` }}
                />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white dark:bg-slate-900 shadow-xs" title="نقطه ۵۰/۵۰ ایده آل" />
              </div>
              <p className="text-[10px] text-slate-500 text-center font-bold">
                {stats.isLateralUnbalanced ? '⚠️ انحراف عرضی غیرمجاز (احتمال واژگونی)' : '✅ توازن عرضی در وضعیت ایمن قرار دارد'}
              </p>
            </div>
          </div>

          {/* 3. Axle Loads (Front vs Rear) */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-purple-500" />
                بار اکسل‌ها (Axle Loads)
              </span>
              <span className="font-mono text-purple-600 dark:text-purple-400">
                جلو: {toPersianDigits(stats.frontAxlePercent)}٪ | عقب: {toPersianDigits(stats.rearAxlePercent)}٪
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  <span>اکسل جلو (کابین):</span>
                  <span className={stats.isFrontAxleExceeded ? 'text-red-500 font-bold' : ''}>
                    {fmtPersian(stats.frontAxleWeight, 0)} / {fmtPersian(stats.maxFrontAxleLimit, 0)} kg
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      stats.isFrontAxleExceeded ? 'bg-red-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, (stats.frontAxleWeight / (stats.maxFrontAxleLimit || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  <span>اکسل عقب (درب کانتینر):</span>
                  <span className={stats.isRearAxleExceeded ? 'text-red-500 font-bold' : ''}>
                    {fmtPersian(stats.rearAxleWeight, 0)} / {fmtPersian(stats.maxRearAxleLimit, 0)} kg
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      stats.isRearAxleExceeded ? 'bg-red-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, (stats.rearAxleWeight / (stats.maxRearAxleLimit || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Canvas Visual Layer Controls */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
              لایه‌های گرافیکی تحلیل روی نقشه:
            </span>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>نقشه حرارتی چگالی وزن (Heatmap)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded accent-orange-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>علامت گرافیکی مرکز ثقل (CoG Marker)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showCoGOverlay}
                  onChange={(e) => setShowCoGOverlay(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* AI BALANCING ADVISOR SUGGESTIONS */}
        {balanceSuggestions.length > 0 && (
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-xs font-black text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>توصیه‌های هوشمند بهبود بالانس کامیون:</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200 font-bold list-disc list-inside">
              {balanceSuggestions.map((s, idx) => (
                <li key={idx}>{s.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* DYNAMIC CAD INTERACTION CONTROL PANEL */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-black text-cyan-300">تنظیمات پیشرفته تعاملی انبارداری CAD:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300">
              <input
                type="checkbox"
                checked={enableMagneticSnap}
                onChange={(e) => setEnableMagneticSnap(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span className="flex items-center gap-1">
                <Magnet className="w-3.5 h-3.5 text-cyan-400" />
                گیره مغناطیسی به لبه‌ها
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300">
              <input
                type="checkbox"
                checked={enablePushSystem}
                onChange={(e) => setEnablePushSystem(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span className="flex items-center gap-1">
                <ChevronsRight className="w-3.5 h-3.5 text-amber-400" />
                سیستم هل دادن متوالی (Push Chain)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300">
              <input
                type="checkbox"
                checked={enableCADGuides}
                onChange={(e) => setEnableCADGuides(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                خطوط راهنمای لیزری زنده
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300">
              <input
                type="checkbox"
                checked={enableLocalCompact}
                onChange={(e) => setEnableLocalCompact(e.target.checked)}
                className="rounded accent-purple-500"
              />
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                فشرده‌سازی محلی هنگام رهاسازی
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">افزودن قطعه:</span>
            <select
              value={newItemSize}
              onChange={(e) => setNewItemSize(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold"
            >
              {RADIATOR_CATALOG.map((c) => (
                <option key={c.size} value={c.size}>
                  {c.label} ({c.weight}kg)
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              max="500"
              value={newItemQty}
              onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
              className="w-16 bg-slate-800 border border-slate-700 text-white rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center"
            />

            <button
              type="button"
              onClick={handleAddCatalogItems}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllItems}
              className="flex items-center gap-1 bg-red-950 text-red-300 hover:bg-red-900 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-red-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>خالی کردن</span>
            </button>
          </div>

          {/* Interactive Multi-Select Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 border border-slate-700 p-2 rounded-xl text-xs">
            <span className="font-bold text-amber-300 text-[11px]">
              انتخابی ({toPersianDigits(selectedItemIds.length)}):
            </span>
            <button
              type="button"
              onClick={handleRotate90Selected}
              disabled={selectedItemIds.length === 0}
              className="bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-400 disabled:opacity-40"
              title="چرخش ۹۰ درجه"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>۹۰°</span>
            </button>
            <button
              type="button"
              onClick={handleRotate180Selected}
              disabled={selectedItemIds.length === 0}
              className="bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-400 disabled:opacity-40"
              title="چرخش ۱۸۰ درجه"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>۱۸۰°</span>
            </button>
            <button
              type="button"
              onClick={handleCopySelected}
              disabled={selectedItemIds.length === 0}
              className="bg-slate-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-600 disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>کپی</span>
            </button>
            <button
              type="button"
              onClick={handlePasteCopied}
              disabled={copiedItems.length === 0}
              className="bg-slate-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-slate-600 disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>چسباندن</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedItemIds.length === 0}
              className="bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-red-500 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>

      {/* DETECTED EMPTY SPACES SUGGESTIONS PANEL */}
      {showEmptySpaces && smartGaps.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-2xl mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>شناسایی هوشمند شکاف‌های خالی (Smart Gap Detection):</span>
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold">
              تعداد {toPersianDigits(smartGaps.length)} شکاف قابل جاگذاری شناسایی شد
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {smartGaps.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => setActiveGapModal(space)}
                className={`border font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95 touch-manipulation ${
                  space.fitsAny
                    ? 'bg-white dark:bg-slate-900 border-emerald-400 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${space.fitsAny ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>
                  فضای خالی {toPersianDigits(space.width)}×{toPersianDigits(space.height)} cm
                  {space.bestFitModel ? ` (${space.bestFitModel.size}cm)` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE & CANVAS ZOOM CONTROLS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab('2d')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              viewTab === '2d'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>۲ بعدی (Top View)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('3d')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              viewTab === '3d'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>۳ بعدی (3D View)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('sequence')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition relative ${
              viewTab === 'sequence'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>تسلسل بارگیری هوشمند (Smart Sequence)</span>
            {sequenceBlockingWarnings.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-white" title="هشدار مسدودسازی بارگیری" />
            )}
          </button>
        </div>

        {/* 2D View Zoom & Layer Toggles */}
        {(viewTab === '2d' || viewTab === 'sequence') && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showSequenceNumbers}
                onChange={(e) => setShowSequenceNumbers(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>شماره تسلسل</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showForkliftPath}
                onChange={(e) => setShowForkliftPath(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>مسیر لیفتراک</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmptySpaces}
                onChange={(e) => setShowEmptySpaces(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>نمایش فضاهای خالی</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSnapGrid}
                onChange={(e) => setEnableSnapGrid(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>چسبندگی به شبکه ({toPersianDigits(gridStepCm)}cm)</span>
            </label>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.max(0.6, z - 0.15))}
                className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                title="بزرگ‌نمایی کمتر"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 text-slate-700 dark:text-slate-300">
                {Math.round(zoomScale * 100)}٪
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(z => Math.min(2.5, z + 0.15))}
                className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                title="بزرگ‌نمایی بیشتر"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setZoomScale(1); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                title="تنظیم مجدد بزرگ‌نمایی"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PACKING ANIMATION PROGRESS */}
      {isPackingAnimating && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-300 dark:border-amber-800 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>هوش مصنوعی در حال محاسبه بهترین چیدمان سه بعدی با الگوریتم MaxRects...</span>
            </span>
            <span>{toPersianDigits(packingProgress)}٪</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-150 rounded-full"
              style={{ width: `${packingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2D CANVAS / 3D SCENE DISPLAY / SEQUENCE OPERATOR CONSOLE */}
      {viewTab === '3d' ? (
        <div>
          <Layout3DView evalResult={evaluationResultFor3D} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 2D / Sequence Canvas Container */}
          <div className="relative border-2 border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-inner p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 px-2">
              <span>کابین راننده (جلو کامیون) 🚛</span>
              <span>طول: {toPersianDigits(customL)}cm | عرض: {toPersianDigits(customW)}cm</span>
              <span>درب عقب کانتینر</span>
            </div>

            <div className="overflow-x-auto flex justify-center relative">
              <canvas
                ref={canvasRef}
                width={850}
                height={380}
                onPointerDown={(e) => handlePointerStart(e.clientX, e.clientY, e.shiftKey || e.ctrlKey, e.pointerId)}
                onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onPointerUp={(e) => handlePointerEnd(e.pointerId)}
                onPointerCancel={(e) => handlePointerEnd(e.pointerId)}
                className="cursor-crosshair rounded-xl border border-slate-700 shadow-2xl max-w-full touch-none"
              />

              {/* PROFESSIONAL GHOST PREVIEW LIVE HUD OVERLAY */}
              {dragLiveInfo && (
                <div className={`absolute top-4 right-4 max-w-sm w-full px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs border backdrop-blur-md transition-all duration-150 animate-fadeIn pointer-events-none ${
                  dragLiveInfo.ghostStatus === 'red'
                    ? 'bg-red-950/90 text-red-100 border-red-500 shadow-red-900/50'
                    : dragLiveInfo.ghostStatus === 'orange'
                    ? 'bg-orange-950/90 text-orange-100 border-orange-500 shadow-orange-900/50'
                    : dragLiveInfo.ghostStatus === 'blue'
                    ? 'bg-blue-950/90 text-blue-100 border-blue-500 shadow-blue-900/50'
                    : 'bg-emerald-950/90 text-emerald-100 border-emerald-500 shadow-emerald-900/50'
                }`}>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full animate-ping ${
                        dragLiveInfo.ghostStatus === 'red' ? 'bg-red-400' :
                        dragLiveInfo.ghostStatus === 'orange' ? 'bg-orange-400' :
                        dragLiveInfo.ghostStatus === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
                      }`} />
                      <span className="font-black text-sm">{dragLiveInfo.model}</span>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                      dragLiveInfo.ghostStatus === 'red' ? 'bg-red-500/30 text-red-300' :
                      dragLiveInfo.ghostStatus === 'orange' ? 'bg-orange-500/30 text-orange-300' :
                      dragLiveInfo.ghostStatus === 'blue' ? 'bg-blue-500/30 text-blue-300' : 'bg-emerald-500/30 text-emerald-300'
                    }`}>
                      {dragLiveInfo.ghostStatus === 'red' && '🔴 Red Ghost (تداخل/خروج)'}
                      {dragLiveInfo.ghostStatus === 'orange' && '🟠 Orange Ghost (ناایمنی وزن)'}
                      {dragLiveInfo.ghostStatus === 'blue' && '🔵 Blue Ghost (تراز راهنما)'}
                      {dragLiveInfo.ghostStatus === 'green' && '🟢 Green Ghost (موقعیت معتبر)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                    <div>طول: <span className="font-bold">{toPersianDigits(dragLiveInfo.w)} cm</span></div>
                    <div>عرض: <span className="font-bold">{toPersianDigits(dragLiveInfo.l)} cm</span></div>
                    <div>مختصات (X,Y): <span className="font-bold">({toPersianDigits(dragLiveInfo.x)}, {toPersianDigits(dragLiveInfo.y)})</span></div>
                    <div>زاویه چرخش: <span className="font-bold">{toPersianDigits(dragLiveInfo.rotationAngle)}°</span></div>
                    <div>وزن قطعه: <span className="font-bold">{toPersianDigits(dragLiveInfo.weight)} kg</span></div>
                    <div>مساحت باقی‌مانده: <span className="font-bold text-amber-300">{toPersianDigits(dragLiveInfo.remainingFreeAreaM2)} m²</span></div>
                    <div className="col-span-2 mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[10px]">
                      <span>درصد اشغال کانتینر:</span>
                      <span className="font-bold text-cyan-300">{toPersianDigits(dragLiveInfo.occupiedPercent)}٪</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <span className="font-bold text-slate-400">راهنمای ابعاد:</span>
              {RADIATOR_CATALOG.map((c) => (
                <div key={c.size} className="flex items-center gap-1 text-[11px]">
                  <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: c.color }} />
                  <span>{toPersianDigits(c.size)}cm ({c.weight}kg)</span>
                </div>
              ))}
            </div>
          </div>

          {/* SMART SEQUENCE CONSOLE MODULE */}
          {viewTab === 'sequence' && (
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-6 animate-fadeIn">
              {/* Header Ribbon */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Workflow className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-black text-amber-300">
                      کنسول هوشمند تسلسل بارگیری لیفتراک (Smart Loading Sequence)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    مدیریت اولویت، ترتیب ورود قطعات به کانتینر، شبیه‌سازی گام‌به‌گام و صدور دستورالعمل اجرایی انبار
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyStrategy('auto-optimized')}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg transition text-xs active:scale-95 touch-manipulation"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>بهینه‌سازی خودکار LIFO</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSequencePDF}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-4 py-2.5 rounded-xl border border-cyan-800/50 transition text-xs active:scale-95 touch-manipulation"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>چاپ دستورالعمل PDF</span>
                  </button>
                </div>
              </div>

              {/* Live Metric Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">⏱️ زمان تخمینی بارگیری</span>
                  <span className="text-base font-black text-amber-400">{estimatedLoadingTime.formatted}</span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">🚜 تردد لیفتراک / پالت بر</span>
                  <span className="text-base font-black text-blue-400">{toPersianDigits(estimatedLoadingTime.forkliftTrips)} سرویس</span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">📦 کل قطعات قابل چیدمان</span>
                  <span className="text-base font-black text-emerald-400">{toPersianDigits(sequenceItems.length)} عدد</span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">⚠️ وضعیت تداخل دسترسی</span>
                  <span className={`text-xs font-black ${
                    sequenceBlockingWarnings.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {sequenceBlockingWarnings.length > 0
                      ? `${toPersianDigits(sequenceBlockingWarnings.length)} مسدودسازی`
                      : '🟢 کاملاً استاندارد'}
                  </span>
                </div>
              </div>

              {/* Blocking Warnings Alert Panel */}
              {sequenceBlockingWarnings.length > 0 && (
                <div className="bg-red-950/80 border-2 border-red-500 rounded-2xl p-4 space-y-3 animate-fadeIn shadow-xl">
                  <div className="flex items-center gap-2 text-red-200 font-black text-sm">
                    <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                    <span>هشدار مسدودسازی ترتیب بارگیری (Impossible Loading Order Detected):</span>
                  </div>
                  <div className="space-y-1.5 pr-2 max-h-32 overflow-y-auto">
                    {sequenceBlockingWarnings.map((w, idx) => (
                      <div key={idx} className="text-xs text-red-100 flex items-center gap-2 bg-red-900/50 p-2 rounded-lg border border-red-800/50 font-sans">
                        <span className="text-red-400 font-bold">⚠️</span>
                        <span>{w.reason}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleApplyStrategy('auto-optimized')}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                    >
                      اصلاح خودکار عدم مسدودسازی (LIFO)
                    </button>
                  </div>
                </div>
              )}

              {/* Animation Playback Controller */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Play className="w-4 h-4 text-amber-400" />
                    <span>شبیه‌ساز زنده گام‌به‌گام ورود رادیاتورها (Animated Loader):</span>
                  </div>

                  <div className="text-xs font-mono font-bold text-amber-300">
                    {sequenceAnimStep > 0
                      ? `گام ${toPersianDigits(sequenceAnimStep)} از ${toPersianDigits(sequenceItems.length)} (${sequenceItems[sequenceAnimStep - 1]?.model || ''})`
                      : 'آماده شروع شبیه‌سازی'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSequenceAnimPlaying(!sequenceAnimPlaying)}
                      className={`p-2.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs ${
                        sequenceAnimPlaying
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {sequenceAnimPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      <span>{sequenceAnimPlaying ? 'توقف' : 'پخش انیمیشن'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSequenceAnimPlaying(false); setSequenceAnimStep(s => Math.max(0, s - 1)); }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                      title="گام قبلی"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSequenceAnimPlaying(false); setSequenceAnimStep(s => Math.min(sequenceItems.length, s + 1)); }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                      title="گام بعدی"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSequenceAnimPlaying(false); setSequenceAnimStep(0); }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition text-xs font-bold"
                      title="بازنشانی به ابتدا"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Playback Speed Selector */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                    <span>سرعت پخش:</span>
                    {[0.5, 1, 2, 4].map(spd => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSequenceAnimSpeed(spd)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          sequenceAnimSpeed === spd
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Slider */}
                <input
                  type="range"
                  min={0}
                  max={sequenceItems.length}
                  value={sequenceAnimStep}
                  onChange={(e) => {
                    setSequenceAnimPlaying(false);
                    setSequenceAnimStep(Number(e.target.value));
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Strategy Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-cyan-400" />
                    <span>انتخاب استراتژی تسلسل بارگیری انبار:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">استراتژی فعال: <b className="text-amber-300">{sequenceStrategy}</b></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { id: 'auto-optimized', label: 'بهینه‌سازی خودکار LIFO', desc: 'عدم گیر افتادن بار' },
                    { id: 'back-to-front', label: 'جلو به عقب', desc: 'کابین ➔ درب' },
                    { id: 'front-to-back', label: 'عقب به جلو', desc: 'درب ➔ کابین' },
                    { id: 'left-to-right', label: 'چپ به راست', desc: 'دیواره چپ ➔ راست' },
                    { id: 'right-to-left', label: 'راست به چپ', desc: 'دیواره راست ➔ چپ' },
                    { id: 'center-first', label: 'ابتدا مرکز', desc: 'تعادل ثقل در وسط' },
                    { id: 'heavy-first', label: 'قطعات سنگین اول', desc: 'اولویت وزن سنگین' },
                    { id: 'fragile-last', label: 'حساس/سبک آخر', desc: 'حفاظت از آسیب' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleApplyStrategy(st.id as SequenceStrategy)}
                      className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between touch-manipulation active:scale-95 ${
                        sequenceStrategy === st.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[11px] font-black block leading-snug">{st.label}</span>
                      <span className="text-[9px] text-slate-400 block mt-1">{st.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reorderable Sequence Table & Touch List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>جدول مدیریت و جابه‌جایی دستی شماره‌های تسلسل (Manual Sequence Control):</span>
                  <span className="text-[11px] text-slate-400">تعداد {toPersianDigits(sequenceItems.length)} رادیاتور</span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3 text-center">شماره تسلسل</th>
                        <th className="p-3">مدل رادیاتور</th>
                        <th className="p-3 text-center">ابعاد (W×L×H cm)</th>
                        <th className="p-3 text-center">مختصات کانتینر</th>
                        <th className="p-3 text-center">وزن</th>
                        <th className="p-3 text-center">وضعیت دسترسی</th>
                        <th className="p-3 text-center">جابه‌جایی اولویت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {sequenceItems.map((item, idx) => {
                        const seq = item.sequence || (idx + 1);
                        const isBlocked = sequenceBlockingWarnings.some(w => w.blockedItemId === item.id);
                        const isCurrentStep = sequenceAnimStep === seq;

                        return (
                          <tr
                            key={item.id}
                            className={`transition ${
                              isCurrentStep
                                ? 'bg-amber-500/20 text-amber-200 font-bold'
                                : isBlocked
                                ? 'bg-red-950/30 text-red-200'
                                : idx % 2 === 0
                                ? 'bg-slate-900/80'
                                : 'bg-slate-900/40'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                                isBlocked ? 'bg-red-600 text-white' : isCurrentStep ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                              }`}>
                                {toPersianDigits(seq)}
                              </span>
                            </td>

                            <td className="p-2.5 font-sans font-bold">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-xs shrink-0 inline-block" style={{ backgroundColor: item.color }} />
                                <span>{item.model}</span>
                              </div>
                            </td>

                            <td className="p-2.5 text-center text-slate-300">
                              {toPersianDigits(item.rotated ? item.length : item.width)} × {toPersianDigits(item.rotated ? item.width : item.length)} × {toPersianDigits(item.height)}
                            </td>

                            <td className="p-2.5 text-center text-slate-300">
                              X: {toPersianDigits(item.x)}, Y: {toPersianDigits(item.y)}
                            </td>

                            <td className="p-2.5 text-center font-bold text-emerald-400">
                              {toPersianDigits(item.weight)} kg
                            </td>

                            <td className="p-2.5 text-center font-sans text-[11px]">
                              {isBlocked ? (
                                <span className="text-red-400 font-bold flex items-center justify-center gap-1">
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                  <span>مسدودشده</span>
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>آزاد</span>
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleReorderSequence(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300"
                                  title="انتقال به اولویت بالاتر"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReorderSequence(idx, 'down')}
                                  disabled={idx === sequenceItems.length - 1}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300"
                                  title="انتقال به اولویت پایین‌تر"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  max={sequenceItems.length}
                                  value={seq}
                                  onChange={(e) => handleSetSequenceNumber(item.id, Number(e.target.value))}
                                  className="w-12 bg-slate-950 border border-slate-700 text-amber-300 text-center rounded-lg py-1 font-mono text-xs font-bold"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVED LAYOUTS MODAL */}
      {isSavedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-500" />
                <span>ذخیره و مدیریت طرح‌های چیدمان</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                عنوان طرح چیدمان جدید:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: بارگیری خاور ۱۲۰ و ۱۴۰"
                  value={layoutNameInput}
                  onChange={(e) => setLayoutNameInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleSaveLayoutModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0"
                >
                  ذخیره
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">طرح‌های ذخیره‌شده قبلی:</h4>
              {savedLayouts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">هنوز هیچ طرحی ذخیره نشده است.</p>
              ) : (
                savedLayouts.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{saved.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {saved.createdAt} | {saved.truck.name} | {toPersianDigits(saved.totalPieces)} رادیاتور ({toPersianDigits(saved.fillPercent)}٪ پر)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoadSavedLayout(saved)}
                        className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-xs"
                      >
                        بارگذاری
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedLayout(saved.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* SMART GAP DETECTION POPUP MODAL */}
      {activeGapModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    شناسایی هوشمند شکاف (Smart Gap Detection)
                  </h3>
                  <p className="text-xs text-slate-500">مشخصات ابعادی، مساحت و رادیاتورهای قابل جای‌گذاری</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGapModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {/* Space Metrics Calculations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs">
              <div>
                <span className="block text-slate-500 text-[10px] font-bold">عرض (Width)</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {toPersianDigits(activeGapModal.width)} <span className="text-[10px]">cm</span>
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] font-bold">طول/عمق (Height)</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {toPersianDigits(activeGapModal.height)} <span className="text-[10px]">cm</span>
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] font-bold">مساحت (Area)</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                  {toPersianDigits(activeGapModal.areaM2)} <span className="text-[10px]">m²</span>
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] font-bold">حجم (Volume)</span>
                <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                  {toPersianDigits(activeGapModal.volumeM3)} <span className="text-[10px]">m³</span>
                </span>
              </div>
            </div>

            {/* Compatible Radiator Models */}
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
                <span>مدل‌های رادیاتور قابل جای‌گذاری در این شکاف:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                  {toPersianDigits(activeGapModal.compatibleModels.length)} مدل سازگار
                </span>
              </h4>

              {activeGapModal.compatibleModels.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                  هیچ رادیاتوری در این فضای محدود قرار نمی‌گیرد (ابعاد کوچک‌تر از حداقل ابعاد رادیاتور).
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeGapModal.compatibleModels.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-xs inline-block shrink-0" style={{ backgroundColor: item.spec.color }} />
                          <span className="font-black text-xs text-slate-900 dark:text-white">{item.spec.label}</span>
                          {item.needsRotation && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold">
                              چرخش ۹۰°
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>ابعاد: {toPersianDigits(item.spec.width)}×{toPersianDigits(item.spec.length)}×{toPersianDigits(item.spec.height)}cm</span>
                          <span>وزن: {toPersianDigits(item.spec.weight)}kg</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            موجود در انبار: {toPersianDigits(item.warehouseQty)} عدد
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInsertIntoGap(activeGapModal, item)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition touch-manipulation"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Insert Here (جاگذاری)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
