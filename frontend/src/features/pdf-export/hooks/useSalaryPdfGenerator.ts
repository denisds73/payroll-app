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

function generateFileName(workerName: string, cycleEnd: string): string {
  const cleanName = workerName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');

  const endDate = new Date(cycleEnd);
  const month = endDate.toLocaleDateString('en-IN', { month: 'short' });
  const year = endDate.getFullYear();

  return `salary_report_${cleanName}_${month}${year}`;
}
