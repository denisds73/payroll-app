import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import type { SignatureData } from './signature.types';

export const useSignatureCapture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokeCountRef = useRef(0);
  const pointsRef = useRef<{ x: number; y: number; p: number; v: number }[]>([]);

  const getContext = useCallback(() => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getContext('2d');
  }, []);

  const getCoordinates = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0, p: 0.5 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);


    const p = event.pressure > 0 ? event.pressure : 0.5;

    return { x, y, p };
  }, []);

  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p1: { x: number; y: number; p: number; v: number },
      p2: { x: number; y: number; p: number; v: number },
    ) => {

      const dpr = window.devicePixelRatio || 1;
      const width = 2.5 * dpr;

      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#18181b';
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const ctx = getContext();
      if (!ctx) return;

      (event.target as Element).setPointerCapture(event.pointerId);

      isDrawingRef.current = true;
      strokeCountRef.current++;
      
      const { x, y, p } = getCoordinates(event);
      const point = { x, y, p, v: 0 };
      pointsRef.current = [point];
    },
    [getContext, getCoordinates],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      const { x, y, p } = getCoordinates(event);
      const lastPoint = pointsRef.current[pointsRef.current.length - 1];
      
      const dist = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
      if (dist < 1) return;

      const newPoint = { x, y, p, v: dist };
      
      drawLine(ctx, lastPoint, newPoint);
      
      pointsRef.current.push(newPoint);
    },
    [getContext, getCoordinates, drawLine],
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    pointsRef.current = [];
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokeCountRef.current = 0;
    pointsRef.current = [];
  }, []);

  const cropCanvas = useCallback((sourceCanvas: HTMLCanvasElement): string => {
    const dpr = window.devicePixelRatio || 1;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL('image/png');

    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const pixels = imageData.data;

    let minX = sourceCanvas.width;
    let minY = sourceCanvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < sourceCanvas.height; y++) {
      for (let x = 0; x < sourceCanvas.width; x++) {
        const index = (y * sourceCanvas.width + x) * 4;
        const alpha = pixels[index + 3];

        if (alpha > 5) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
       return sourceCanvas.toDataURL('image/png');
    }

    const padding = 20 * dpr;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(sourceCanvas.width, maxX + padding);
    maxY = Math.min(sourceCanvas.height, maxY + padding);

    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) return sourceCanvas.toDataURL('image/png');

    croppedCtx.drawImage(
      sourceCanvas,
      minX, minY, croppedWidth, croppedHeight,
      0, 0, croppedWidth, croppedHeight
    );

    return croppedCanvas.toDataURL('image/png');
  }, []);

  const save = useCallback((): SignatureData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    if (strokeCountRef.current === 0) {
      toast.error('Please provide a signature before saving');
      return null;
    }

    return {
      dataUrl: cropCanvas(canvas),
      capturedAt: new Date(),
      isEmpty: false,
    };
  }, [cropCanvas]);

  return {
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    save,
    clear,
    isEmpty: strokeCountRef.current === 0,
  };
};

