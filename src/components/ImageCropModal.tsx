import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Check, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ImageCropModalProps {
  file: File | null;
  aspect?: number; // 1 for square/circle avatar, 4/3 for post photo
  circular?: boolean;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

export function ImageCropModal({
  file,
  aspect = 1,
  circular = false,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const { language, t } = useApp();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const boxWidth = 280;
  const boxHeight = Math.round(boxWidth / aspect);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, [file]);

  if (!file || !imageSrc) return null;

  const isRotatedOdd = rotation % 180 !== 0;
  const effectiveW = isRotatedOdd ? imgSize.height : imgSize.width;
  const effectiveH = isRotatedOdd ? imgSize.width : imgSize.height;

  const baseScale =
    effectiveW && effectiveH
      ? Math.max(boxWidth / effectiveW, boxHeight / effectiveH)
      : 1;
  const displayScale = baseScale * zoom;

  const clampOffset = (nx: number, ny: number, nextZoom = zoom) => {
    const scale = baseScale * nextZoom;
    const maxOffsetX = Math.max(0, (effectiveW * scale - boxWidth) / 2);
    const maxOffsetY = Math.max(0, (effectiveH * scale - boxHeight) / 2);
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nx)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, ny)),
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.ox + dx, dragStartRef.current.oy + dy));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleSaveCrop = () => {
    const img = imgRef.current;
    if (!img || !effectiveW || !effectiveH) return;

    const outputW = aspect === 1 ? 600 : 960;
    const outputH = Math.round(outputW / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = outputW / boxWidth;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputW, outputH);
    ctx.save();
    ctx.translate(outputW / 2 + offset.x * ratio, outputH / 2 + offset.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(displayScale * ratio, displayScale * ratio);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File(
          [blob],
          `cropped_${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        onConfirm(croppedFile);
      },
      'image/jpeg',
      0.88
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              id="crop-modal-title"
              className="font-display text-lg font-bold text-slate-950 dark:text-slate-50"
            >
              {t.cropPhotoTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'ছবিটি টেনে পজিশন ও জুম ঠিক করুন'
                : 'Drag to reposition and zoom to crop cleanly'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Interactive Crop Canvas */}
        <div className="mt-5 flex justify-center">
          <div
            style={{ width: boxWidth, height: boxHeight }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative cursor-grab touch-none overflow-hidden bg-slate-900 select-none active:cursor-grabbing ${
              circular ? 'rounded-full ring-2 ring-[#2563EB]/60' : 'rounded-lg ring-2 ring-[#2563EB]/60'
            }`}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              onLoad={(e) => {
                const target = e.currentTarget;
                setImgSize({
                  width: target.naturalWidth,
                  height: target.naturalHeight,
                });
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${displayScale})`,
                transformOrigin: 'center center',
              }}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 border-2 border-white/75 ${
                circular ? 'rounded-full' : 'rounded-lg'
              }`}
            />
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, Number((zoom - 0.2).toFixed(2)));
              setZoom(next);
              setOffset((o) => clampOffset(o.x, o.y, next));
            }}
            aria-label="Zoom out"
            className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>

          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => {
              const next = Number(e.target.value);
              setZoom(next);
              setOffset((o) => clampOffset(o.x, o.y, next));
            }}
            aria-label="Zoom"
            className="h-2 flex-1 cursor-pointer accent-[#2563EB]"
          />

          <button
            type="button"
            onClick={() => {
              const next = Math.min(3, Number((zoom + 0.2).toFixed(2)));
              setZoom(next);
              setOffset((o) => clampOffset(o.x, o.y, next));
            }}
            aria-label="Zoom in"
            className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setRotation((r) => (r + 90) % 360);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Rotate"
            title={language === 'bn' ? 'ঘোরান' : 'Rotate'}
            className="inline-flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-9 cursor-pointer rounded-md border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{t.applyCrop}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
