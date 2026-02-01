import { useCallback, useRef } from 'react';
import type { SignatureData } from './signature.types';

export const useSignatureCapture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokeCountRef = useRef(0);

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
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [getContext, getCoordinates],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      const { x, y } = getCoordinates(event);

      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [getContext, getCoordinates],
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokeCountRef.current = 0;
  }, [getContext]);

  const save = useCallback((): SignatureData | null => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    if (strokeCountRef.current === 0) {
      alert('Please sign');
      return null;
    }

    const dataUrl = canvas.toDataURL('image/png');

    return {
      dataUrl,
      capturedAt: new Date(),
      isEmpty: false,
    };
  }, []);

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
