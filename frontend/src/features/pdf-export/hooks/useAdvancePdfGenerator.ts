import { useCallback, useState } from 'react';
import { generateAndDownloadPdf, getPdfUrl, openPdfInNewTab } from '../services/pdfService';
import type { UseAdvancePdfGenerator } from '../types/pdf.types';
import { buildAdvanceReceiptPdf } from '../utils/advancePdfBuilder';
import { fetchAdvanceReportData } from '../utils/pdfData';

export function useAdvancePdfGenerator(): UseAdvancePdfGenerator {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateAndDownload = useCallback(async (advanceId: number, signatureDataUrl?: string): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const reportData = await fetchAdvanceReportData(advanceId);
      const finalSignature = signatureDataUrl || reportData.advance.signature;
      const docDefinition = buildAdvanceReceiptPdf(reportData, finalSignature);
      const fileName = generateFileName(reportData.worker.name, reportData.advance.date, reportData.advance.id);

      await generateAndDownloadPdf(docDefinition, fileName, reportData.worker.name, 'Advance');

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

  const generateAndView = useCallback(async (advanceId: number, signatureDataUrl?: string): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const reportData = await fetchAdvanceReportData(advanceId);
      const finalSignature = signatureDataUrl || reportData.advance.signature;
      const docDefinition = buildAdvanceReceiptPdf(reportData, finalSignature);
      const fileName = generateFileName(reportData.worker.name, reportData.advance.date, reportData.advance.id);

      await openPdfInNewTab(docDefinition, fileName);

      setSuccess(true);
      setIsGenerating(false);
    } catch (err) {
      console.error('❌ PDF view failed:', err);

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to view PDF. Please try again.';

      setError(errorMessage);
      setSuccess(false);
      setIsGenerating(false);

      throw err;
    }
  }, []);

  const generatePdfUrl = useCallback(async (advanceId: number, signatureDataUrl?: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const reportData = await fetchAdvanceReportData(advanceId);
      const finalSignature = signatureDataUrl || reportData.advance.signature;
      const docDefinition = buildAdvanceReceiptPdf(reportData, finalSignature);

      const url = await getPdfUrl(docDefinition);

      setSuccess(true);
      setIsGenerating(false);
      return url;
    } catch (err) {
      console.error('❌ PDF URL generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF URL.';
      setError(errorMessage);
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
    generateAndView,
    generatePdfUrl,
    clear,
    isGenerating,
    error,
    success,
  };
}

function generateFileName(workerName: string, advanceDate: string, advanceId: number): string {
  const cleanName = workerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

  const date = new Date(advanceDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-IN', { month: 'short' });
  const year = date.getFullYear();

  return `Advance_Receipt_${cleanName}_${day}-${month}-${year}_ID-${advanceId}`;
}
