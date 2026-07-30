import React, { useRef, useEffect, useState } from 'react';
import { Camera, PenTool, Trash2, Check, Image as ImageIcon } from 'lucide-react';
import { FeatureAccess } from '../types';

interface PhotosSignatureCardProps {
  access: FeatureAccess;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  signatureUrl: string | null;
  onSignatureChange: (url: string | null) => void;
}

export const PhotosSignatureCard: React.FC<PhotosSignatureCardProps> = ({
  access,
  photoUrl,
  onPhotoChange,
  signatureUrl,
  onSignatureChange,
}) => {
  if (access === 'disabled') return null;
  const isReadOnly = access === 'view';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signSavedMsg, setSignSavedMsg] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI crisp drawing
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';

    // If signature exists, redraw it
    if (signatureUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signatureUrl;
    }
  }, [signatureUrl]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      const pos = getCanvasPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      const pos = getCanvasPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onSignatureChange(null);
    setSignSavedMsg('');
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
      setSignSavedMsg('امضا با موفقیت ذخیره شد!');
    } catch (err) {
      setSignSavedMsg('ذخیره امضا انجام نشد');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPhotoChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          ثبت عکس بارگیری و امضای دیجیتال راننده
        </h2>
        <span className="text-xs text-slate-400 font-medium">مستندات تحویل</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            تصویر بارگیری کالا / چیدمان کانتینر
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={isReadOnly}
            className="w-full text-xs text-slate-500 file:mr-0 file:ml-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />

          <div className="mt-3 min-h-[160px] border-2 border-dashed border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Loading photo" className="max-h-40 rounded-lg object-contain shadow-xs" />
            ) : (
              <div className="text-center text-slate-400 p-4">
                <Camera className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                <span className="text-xs">تصویر بارگیری بارگذاری نشده است</span>
              </div>
            )}
          </div>
        </div>

        {/* Signature Pad Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <PenTool className="w-4 h-4 text-purple-500" />
            امضای الکترونیکی راننده / انباردار
          </label>
          <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-40 touch-none cursor-crosshair bg-white"
            />
            <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 select-none pointer-events-none">
              محل ثبت امضا
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  پاک کردن امضا
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  ذخیره امضا
                </button>
              </div>
              {signSavedMsg && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {signSavedMsg}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
