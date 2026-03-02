import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { AdvanceReportData } from '../types/pdf.types';
import { formatCurrency, formatDate } from './pdfFormatters';

export function buildAdvanceReceiptPdf(
  data: AdvanceReportData,
  signatureDataUrl?: string,
): TDocumentDefinitions {
  return {
    info: {
      title: `Advance Receipt - ${data.worker.name}`,
      author: 'Payroll System',
      subject: `Advance receipt for ${formatDate(data.advance.date)}`,
      creator: 'Payroll App',
      producer: 'PDFMake',
    },

    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],

    content: [
      buildHeader(data),
      buildWorkerInfo(data),
      buildAdvanceDetails(data),
      buildSignatureSection(data, signatureDataUrl),
      buildFooter(data),
    ],

    styles: {
      documentTitle: {
        fontSize: 24,
        bold: true,
        alignment: 'left',
        color: '#1a1a2e',
        margin: [0, 0, 0, 2],
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#ffffff',
        fillColor: '#1a1a2e',
        margin: [0, 15, 0, 0],
      },
      infoLabel: {
        fontSize: 9,
        color: '#666666',
        bold: false,
      },
      infoValue: {
        fontSize: 10,
        color: '#1a1a2e',
        bold: true,
      },
      amountBox: {
        fontSize: 24,
        bold: true,
        color: '#e17055',
        alignment: 'center',
      },
      footer: {
        fontSize: 8,
        color: '#999999',
        alignment: 'center',
      },
      signatureLine: {
        fontSize: 10,
        color: '#18181b',
        margin: [0, 40, 0, 5],
      },
      disclaimer: {
        fontSize: 9,
        color: '#52525b',
        italics: true,
        alignment: 'center',
      },
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#18181b',
    },
  };
}

function buildHeader(data: AdvanceReportData): Content {
  return [
    {
      columns: [
        {
          text: 'ADVANCE RECEIPT',
          style: 'documentTitle',
          width: '*',
        },
        {
          text: `#AR-${data.advance.id}`,
          fontSize: 14,
          bold: true,
          color: '#999999',
          alignment: 'right',
          width: 'auto',
        },
      ],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e0e0e0' }],
      margin: [0, 5, 0, 15],
    },
  ];
}

function buildWorkerInfo(data: AdvanceReportData): Content {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'Worker Name', style: 'infoLabel' },
          { text: data.worker.name, style: 'infoValue', fontSize: 13 },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'Phone Number', style: 'infoLabel' },
          { text: data.worker.phone || 'N/A', style: 'infoValue' },
        ],
        margin: [40, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 20],
  };
}

function buildAdvanceDetails(data: AdvanceReportData): any {
  return [
    {
      text: 'ADVANCE DETAILS',
      style: 'sectionHeader',
    },

    {
      columns: [
        { text: 'Date Issued:', style: 'infoLabel', width: 80 },
        { text: formatDate(data.advance.date), style: 'infoValue' },
      ],
      margin: [0, 0, 0, 6],
    },
    ...(data.advance.reason
      ? [
          {
            columns: [
              { text: 'Reason:', style: 'infoLabel', width: 80 },
              { text: data.advance.reason, style: 'infoValue' },
            ],
            margin: [0, 0, 0, 6],
          },
        ]
      : []),

    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'AMOUNT ISSUED',
              bold: true,
              fontSize: 11,
              color: '#ffffff',
              fillColor: '#e17055',
              margin: [0, 5, 0, 5],
              alignment: 'center',
            },
          ],
          [
            {
              text: formatCurrency(data.advance.amount),
              style: 'amountBox',
              margin: [0, 15, 0, 15],
              fillColor: '#f8f9fa',
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
      },
      margin: [0, 15, 0, 0],
    },
  ];
}

function buildSignatureSection(data: AdvanceReportData, signatureDataUrl?: string): any {
  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 250,
        stack: [
          signatureDataUrl
            ? {
                image: signatureDataUrl,
                width: 200,
                height: 80,
                alignment: 'center',
                margin: [25, 40, 25, 0],
              }
            : {
                text: '[Signature not captured]',
                alignment: 'center',
                italics: true,
                color: '#9ca3af',
                margin: [0, 50, 0, 20],
              },
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 200,
                y2: 0,
                lineWidth: 1,
                lineColor: '#18181b',
              },
            ],
            margin: [25, 5, 25, 5],
          },
          {
            text: 'Worker Signature',
            style: 'infoLabel',
            alignment: 'center',
            margin: [0, 5, 0, 2],
          },
          {
            text: data.worker.name,
            style: 'infoValue',
            alignment: 'center',
            fontSize: 11,
            bold: true,
          },
          signatureDataUrl
            ? {
                text: `Signed on: ${formatDate(new Date().toISOString(), 'short')}`,
                fontSize: 8,
                color: '#6b7280',
                italics: true,
                alignment: 'center',
                margin: [0, 3, 0, 0],
              }
            : {},
        ],
      },
      { width: '*', text: '' },
    ],
  };
}

function buildFooter(data: AdvanceReportData): Content {
  return [
    {
      text: '\n\n─────────────────────────────────────────────────',
      alignment: 'center',
      color: '#e5e7eb',
    },
    {
      text: 'This advance amount will be deducted from your next salary payment.',
      style: 'footer',
      margin: [0, 10, 0, 5],
    },
    {
      text: `This is a computer-generated document. Generated on ${data.generatedAtFormatted}`,
      style: 'footer',
      alignment: 'center',
    },
  ];
}
