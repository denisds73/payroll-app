import { forwardRef, useImperativeHandle } from 'react';
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
    const calculatedWidth = width || Math.min(window.innerWidth * 0.7, 900);
    const calculatedHeight = height || Math.min(window.innerHeight * 0.4, 300);

    const { canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, save, clear } =
      useSignatureCapture();

    useImperativeHandle(ref, () => ({
      save,
      clear,
    }));

    return (
      <canvas
        ref={canvasRef}
        width={calculatedWidth}
        height={calculatedHeight}
        style={{
          width: `${calculatedWidth}px`,
          height: `${calculatedHeight}px`,
          maxWidth: '100%',
        }}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
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
