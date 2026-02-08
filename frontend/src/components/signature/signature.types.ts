export interface SignatureData {
  dataUrl: string;
  capturedAt: Date;
  isEmpty: boolean;
}

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onSave: (signature: SignatureData) => void;
  onClear: () => void;
}

export interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: SignatureData) => void;
}
