import { useCallback, useRef } from 'react';
import type { SignatureData } from './signature.types';

export const useSignatureCapture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokeCountRef = useRef(0);

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const getContext = useCallback(() => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getContext('2d');
  }, []);

  const getCoordinates = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return { x: 0, y: 0 };

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      let clientX: number;
      let clientY: number;

      if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        const touch = (event as React.TouchEvent<HTMLCanvasElement>).touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: x * scaleX,
        y: y * scaleY,
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const ctx = getContext();
      if (!ctx) return;

      isDrawingRef.current = true;
      strokeCountRef.current++;

      const { x, y } = getCoordinates(event);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      ctx.beginPath();
      ctx.moveTo(x, y);

      lastPointRef.current = { x, y };
    },
    [getContext, getCoordinates],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      const { x, y } = getCoordinates(event);
      const lastPoint = lastPointRef.current;

      if (!lastPoint) {
        lastPointRef.current = { x, y };
        return;
      }

      const midX = (lastPoint.x + x) / 2;
      const midY = (lastPoint.y + y) / 2;

      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(midX, midY);

      lastPointRef.current = { x, y };
    },
    [getContext, getCoordinates],
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeCountRef.current = 0;
    lastPointRef.current = null;
  }, [getContext]);

  const cropCanvas = useCallback((sourceCanvas: HTMLCanvasElement): string => {
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

        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(sourceCanvas.width, maxX + padding);
    maxY = Math.min(sourceCanvas.height, maxY + padding);

    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;

    if (croppedWidth <= 0 || croppedHeight <= 0) {
      return sourceCanvas.toDataURL('image/png');
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) return sourceCanvas.toDataURL('image/png');

    croppedCtx.drawImage(
      sourceCanvas,
      minX,
      minY,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight,
    );

    return croppedCanvas.toDataURL('image/png');
  }, []);

  const save = useCallback((): SignatureData | null => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    if (strokeCountRef.current === 0) {
      alert('Please provide a signature before saving');
      return null;
    }

    const dataUrl = cropCanvas(canvas);

    return {
      dataUrl,
      capturedAt: new Date(),
      isEmpty: false,
    };
  }, [cropCanvas]);

  return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    save,
    clear,
    isEmpty: strokeCountRef.current === 0,
  };
};
