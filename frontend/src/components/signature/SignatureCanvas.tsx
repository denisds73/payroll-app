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
  ({ width = 600, height = 200 }, ref) => {
    const { canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, save, clear } =
      useSignatureCapture();

    useImperativeHandle(ref, () => ({
      save,
      clear,
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
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
