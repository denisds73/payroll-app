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

    const { canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, save, clear } =
      useSignatureCapture();

    useImperativeHandle(ref, () => ({
      save,
      clear,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
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
        className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white shadow-sm"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />
    );
  },
);

SignatureCanvas.displayName = 'SignatureCanvas';
