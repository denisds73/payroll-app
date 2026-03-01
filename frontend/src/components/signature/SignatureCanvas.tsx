import { forwardRef, useEffect, useImperativeHandle } from 'react';
import type { SignatureData } from './signature.types';
import { useSignatureCapture } from './useSignatureCapture';

export interface SignatureCanvasRef {
  save: () => SignatureData | null;
  clear: () => void;
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ width, height }, ref) => {
    const calculatedWidth = width || Math.min(window.innerWidth * 0.85, 1400);
    const calculatedHeight = height || Math.min(window.innerHeight * 0.65, 600);

    const { canvasRef, handlePointerDown, handlePointerMove, handlePointerUp, save, clear } =
      useSignatureCapture();

    useImperativeHandle(ref, () => ({
      save,
      clear,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={calculatedWidth}
        height={calculatedHeight}
        style={{
          width: `${calculatedWidth}px`,
          height: `${calculatedHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        className="border-2 border-border rounded-lg cursor-crosshair bg-card shadow-sm touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}

      />
    );
  },
);

SignatureCanvas.displayName = 'SignatureCanvas';
