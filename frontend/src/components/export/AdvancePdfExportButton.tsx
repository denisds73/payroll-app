import { Download } from 'lucide-react';
import { useEffect } from 'react';
import { useAdvancePdfGenerator } from '../../features/pdf-export/hooks/useAdvancePdfGenerator';
import Button from '../ui/Button';

interface AdvancePdfExportButtonProps {
  advanceId: number;
  workerName: string;
  variant?: 'button' | 'auto';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function AdvancePdfExportButton({
  advanceId,
  variant = 'button',
  onSuccess,
  onError,
}: AdvancePdfExportButtonProps) {
  const { generateAndDownload, isGenerating, error } = useAdvancePdfGenerator();

  useEffect(() => {
    if (variant === 'auto' && advanceId) {
      handleDownload();
    }
  }, [variant, advanceId]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleDownload = async () => {
    try {
      await generateAndDownload(advanceId);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to generate advance receipt:', err);
      if (onError) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
        onError(errorMessage);
      }
    }
  };

  if (variant === 'auto') {
    return null;
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      loading={isGenerating}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      {isGenerating ? 'Generating...' : 'Download Receipt'}
    </Button>
  );
}
