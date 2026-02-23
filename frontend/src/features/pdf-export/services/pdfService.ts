import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

export async function generateAndDownloadPdf(docDefinition: any, fileName: string): Promise<void> {
  try {
    if (!docDefinition) {
      throw new Error('Document definition is required');
    }
    if (!fileName) {
      throw new Error('File name is required');
    }

    const pdf = pdfMake.createPdf(docDefinition);

    pdf.download(`${fileName}.pdf`);

    return Promise.resolve();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';

    throw new Error(`PDF Generation Error: ${errorMessage}`);
  }
}

export async function openPdfInNewTab(docDefinition: any, _fileName: string): Promise<void> {
  try {
    if (!docDefinition) {
      throw new Error('Document definition is required');
    }

    const pdf = pdfMake.createPdf(docDefinition);
    pdf.open();

    return Promise.resolve();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to open PDF';
    throw new Error(`PDF Open Error: ${errorMessage}`);
  }
}

export async function getPdfBlob(docDefinition: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (!docDefinition) {
        throw new Error('Document definition is required');
      }

      const pdf = pdfMake.createPdf(docDefinition);

      (pdf as any).getBase64(
        (base64: string) => {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);

          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: 'application/pdf' });
          resolve(blob);
        },
        (error: any) => {
          reject(new Error(`Failed to generate PDF blob: ${error}`));
        },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      reject(new Error(`PDF Blob Error: ${errorMessage}`));
    }
  });
}

export default {
  generateAndDownloadPdf,
  openPdfInNewTab,
  getPdfBlob,
};
