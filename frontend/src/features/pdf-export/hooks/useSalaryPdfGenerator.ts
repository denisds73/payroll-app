import { useCallback, useState } from 'react';
import { generateAndDownloadPdf } from '../services/pdfService';
import type { UseSalaryPdfGenerator } from '../types/pdf.types';
import { buildSalaryReportPdf } from '../utils/pdfBuilder';
import { fetchSalaryReportData } from '../utils/pdfData';

export function useSalaryPdfGenerator(): UseSalaryPdfGenerator {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateAndDownload = useCallback(async (salaryId: number, signatureDataUrl?: string): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const reportData = await fetchSalaryReportData(salaryId);
      const finalSignature = signatureDataUrl || reportData.salary.signature;
      const docDefinition = buildSalaryReportPdf(reportData, finalSignature);

      const fileName = generateFileName(
        reportData.worker.name,
        reportData.salary.cycleStart,
        reportData.salary.cycleEnd,
      );

      await generateAndDownloadPdf(docDefinition, fileName);

      setSuccess(true);
      setIsGenerating(false);
    } catch (err) {
      console.error('❌ PDF generation failed:', err);

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.';

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

  return `Salary_Report_${cleanName}_${formatDateForFileName(cycleStart)}_to_${formatDateForFileName(cycleEnd)}`;
}
