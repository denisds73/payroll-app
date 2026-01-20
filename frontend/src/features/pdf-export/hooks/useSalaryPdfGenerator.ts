
import { useState, useCallback } from 'react';
import type { UseSalaryPdfGenerator } from '../types/pdf.types';
import { fetchSalaryReportData } from '../utils/pdfData';
import { buildSalaryReportPdf } from '../utils/pdfBuilder';
import { generateAndDownloadPdf } from '../services/pdfService';

export function useSalaryPdfGenerator(): UseSalaryPdfGenerator {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateAndDownload = useCallback(async (salaryId: number): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🎯 Starting PDF generation for salary ID:', salaryId);

      console.log('📊 Phase 1: Fetching salary report data...');
      const reportData = await fetchSalaryReportData(salaryId);
      console.log('✅ Data fetched successfully');

      console.log('🎨 Phase 2: Building PDF document...');
      const docDefinition = buildSalaryReportPdf(reportData);
      console.log('✅ PDF structure built');

      console.log('💾 Phase 3: Generating and downloading PDF...');
      
      const fileName = generateFileName(
        reportData.worker.name,
        reportData.salary.cycleStart,
        reportData.salary.cycleEnd,
      );
      
      await generateAndDownloadPdf(docDefinition, fileName);
      console.log('✅ PDF downloaded:', fileName);

      setSuccess(true);
      setIsGenerating(false);

      console.log('🎉 PDF generation complete!');
    } catch (err) {
      console.error('❌ PDF generation failed:', err);

      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to generate PDF. Please try again.';

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

function generateFileName(
  workerName: string,
  cycleStart: string,
  cycleEnd: string,
): string {
  const cleanName = workerName
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');

  const endDate = new Date(cycleEnd);
  const month = endDate.toLocaleDateString('en-IN', { month: 'short' });
  const year = endDate.getFullYear();

  return `salary_report_${cleanName}_${month}${year}`;
}
