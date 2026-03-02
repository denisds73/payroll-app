import { useCallback, useState } from 'react';
import { generateAndDownloadPdf } from '../services/pdfService';
import type { UseSalaryPdfGenerator } from '../types/pdf.types';
import { buildClosureReportPdf } from '../utils/closurePdfBuilder';
import { fetchSalaryReportData } from '../utils/pdfData';

export function useClosurePdfGenerator(): UseSalaryPdfGenerator {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateAndDownload = useCallback(async (closureId: number, signatureDataUrl?: string): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Reuse the same data fetcher — closure records are stored in the Salary table
      const reportData = await fetchSalaryReportData(closureId);
      const finalSignature = signatureDataUrl || reportData.salary.signature;
      const docDefinition = buildClosureReportPdf(reportData, finalSignature);

      const fileName = generateFileName(
        reportData.worker.name,
        reportData.salary.cycleStart,
        reportData.salary.cycleEnd,
      );

      await generateAndDownloadPdf(docDefinition, fileName);

      setSuccess(true);
      setIsGenerating(false);
    } catch (err) {
      console.error('❌ Closure PDF generation failed:', err);

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate closure report PDF.';

      setError(errorMessage);
      setSuccess(false);
      setIsGenerating(false);

      throw err;
    }
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setSuccess(false);
    setIsGenerating(false);
  }, []);

  return {
    generateAndDownload,
    clear,
    isGenerating,
    error,
    success,
  };
}

function formatDateForFileName(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function generateFileName(workerName: string, cycleStart: string, cycleEnd: string): string {
  const cleanName = workerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

  return `Closure_Report_${cleanName}_${formatDateForFileName(cycleStart)}_to_${formatDateForFileName(cycleEnd)}`;
}
