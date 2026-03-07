import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { notoSansTamilBase64 } from '../../../assets/fonts/notoSansTamilBase64';
import { reportsAPI } from '../../../services/api';

// Initialize VFS with both default fonts and NotoSansTamil
const defaultVfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs || pdfFonts;

export const vfs = {
  ...defaultVfs,
  'tamil.ttf': notoSansTamilBase64,
};

export const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
  Tamil: {
    normal: 'tamil.ttf',
    bold: 'tamil.ttf',
    italics: 'tamil.ttf',
    bolditalics: 'tamil.ttf',
  },
};

// Set globally
if (typeof (pdfMake as any).addVirtualFileSystem !== 'undefined') {
  (pdfMake as any).addVirtualFileSystem(vfs);
} else {
  (pdfMake as any).vfs = vfs;
}
(pdfMake as any).fonts = fonts;

export async function generateAndDownloadPdf(
  docDefinition: any,
  fileName: string,
  workerName?: string,
  reportType?: 'Advance' | 'Salary' | 'Closure',
): Promise<void> {
  try {
    if (!docDefinition) {
      throw new Error('Document definition is required');
    }
    if (!fileName) {
      throw new Error('File name is required');
    }

    const pdf = pdfMake.createPdf(docDefinition);

    pdf.download(`${fileName}.pdf`);

    // Fire-and-forget: also save to the structured folder hierarchy
    if (workerName && reportType) {
      getPdfBlob(docDefinition)
        .then((blob) => reportsAPI.save(blob, workerName, reportType, fileName))
        .then(() => console.log(`📁 Report archived: ${reportType}/${fileName}`))
        .catch((err) => console.warn('⚠️ Failed to archive report (non-blocking):', err));
    }

    return Promise.resolve();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';

    throw new Error(`PDF Generation Error: ${errorMessage}`);
  }
}

export async function openPdfInNewTab(docDefinition: any, fileName: string): Promise<void> {
  const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
  console.log(`[PdfService] Opening PDF. isElectron: ${isElectron}, fileName: ${fileName}`);

  try {
    if (!docDefinition) {
      throw new Error('Document definition is required');
    }

    const pdf = pdfMake.createPdf(docDefinition);

    // 1. Electron-native approach: Save to temp and open with default viewer
    if (isElectron) {
      try {
        const electronRequire = (window as any).require;
        if (electronRequire) {
          const fs = electronRequire('fs');
          const path = electronRequire('path');
          const os = electronRequire('os');
          const { shell } = electronRequire('electron');

          console.log('[PdfService] Using Electron native open (save-to-temp)');
          // pdfmake 0.3.x: getBuffer() returns a Promise
          const buffer = await (pdf as any).getBuffer();
          const safeName = (fileName || 'Report').replace(/[^a-z0-9]/gi, '_');
          const tempPath = path.join(os.tmpdir(), `${safeName}_${Date.now()}.pdf`);
          fs.writeFileSync(tempPath, new Uint8Array(buffer));

          const openError = await shell.openPath(tempPath);
          if (openError) {
            console.error('[PdfService] shell.openPath error:', openError);
          } else {
            console.log('[PdfService] Electron native open successful');
            return;
          }
        }
      } catch (err) {
        console.warn('[PdfService] Electron native open failed, using fallback:', err);
      }
    }

    // 2. Web fallback: open via base64 Data URL
    console.log('[PdfService] Opening via Data URL');
    const base64: string = await (pdf as any).getBase64();
    const dataUrl = `data:application/pdf;base64,${base64}`;
    const newWindow = window.open(dataUrl, '_blank');

    if (!newWindow) {
      console.warn('[PdfService] Pop-up blocked, falling back to pdf.open()');
      pdf.open();
    }
  } catch (error) {
    console.error('[PdfService] Fatal error in openPdfInNewTab:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to open PDF';
    throw new Error(`PDF Open Error: ${errorMessage}`);
  }
}

export async function getPdfUrl(docDefinition: any): Promise<string> {
  console.log('[PdfService] Generating PDF URL...');

  if (!docDefinition) throw new Error('Document definition is required');

  const pdf = pdfMake.createPdf(docDefinition);
  const blob: Blob = await (pdf as any).getBlob();
  const url = URL.createObjectURL(blob);

  console.log('[PdfService] PDF URL generated:', url);
  return url;
}

export async function getPdfBlob(docDefinition: any): Promise<Blob> {
  if (!docDefinition) {
    throw new Error('Document definition is required');
  }

  const pdf = pdfMake.createPdf(docDefinition);

  // pdfmake 0.3.x: getBlob() returns a Promise<Blob>
  const blob: Blob = await (pdf as any).getBlob();
  return blob;
}

export default {
  generateAndDownloadPdf,
  openPdfInNewTab,
  getPdfUrl,
  getPdfBlob,
};
