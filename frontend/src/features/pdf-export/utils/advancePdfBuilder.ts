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
        fontSize: 22,
        bold: true,
        alignment: 'center',
        color: '#18181b',
        margin: [0, 0, 0, 5],
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#18181b',
        margin: [0, 20, 0, 10],
      },
      infoLabel: {
        fontSize: 10,
        color: '#52525b',
        bold: true,
      },
      infoValue: {
        fontSize: 10,
        color: '#18181b',
      },
      amountBox: {
        fontSize: 16,
        bold: true,
        color: '#18181b',
        alignment: 'center',
      },
      footer: {
        fontSize: 8,
        color: '#a1a1aa',
        italics: true,
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
      text: 'ADVANCE RECEIPT',
      style: 'documentTitle',
    },
    {
      text: `Generated: ${data.generatedAtFormatted}`,
      style: 'footer',
      margin: [0, 0, 0, 30],
    },
  ];
}

function buildWorkerInfo(data: AdvanceReportData): Content {
  return [
    {
      text: 'WORKER INFORMATION',
      style: 'sectionHeader',
    },
    {
      columns: [
        { text: 'Name:', style: 'infoLabel', width: 100 },
        { text: data.worker.name, style: 'infoValue' },
      ],
      margin: [0, 0, 0, 8],
    },
    {
      columns: [
        { text: 'Worker ID:', style: 'infoLabel', width: 100 },
        { text: `#${data.worker.id}`, style: 'infoValue' },
      ],
      margin: [0, 0, 0, 8],
    },
  ];
}

function buildAdvanceDetails(data: AdvanceReportData): Content {
  return [
    {
      text: 'ADVANCE DETAILS',
      style: 'sectionHeader',
    },
    {
      columns: [
        { text: 'Advance ID:', style: 'infoLabel', width: 100 },
        { text: `#${data.advance.id}`, style: 'infoValue' },
      ],
      margin: [0, 0, 0, 8],
    },
    {
      columns: [
        { text: 'Date Issued:', style: 'infoLabel', width: 100 },
        { text: formatDate(data.advance.date), style: 'infoValue' },
      ],
      margin: [0, 0, 0, 8],
    },
    ...(data.advance.reason
      ? [
          {
            columns: [
              { text: 'Reason:', style: 'infoLabel', width: 100 },
              { text: data.advance.reason, style: 'infoValue' },
            ],
            margin: [0, 0, 0, 8],
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
              style: 'infoLabel',
              alignment: 'center',
              margin: [0, 10, 0, 5],
            },
          ],
          [
            {
              text: formatCurrency(data.advance.amount),
              style: 'amountBox',
              margin: [0, 5, 0, 10],
              color: '#10B981',
            },
          ],
        ],
      },
      layout: {
        fillColor: '#F5F5F7',
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
      },
      margin: [0, 15, 0, 0],
    },
  ];
}

function buildSignatureSection(data: AdvanceReportData, signatureDataUrl?: string): Content {
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
      text: '\n\n',
    },
    {
      text: 'This advance amount will be deducted from your next salary payment.',
      style: 'disclaimer',
      margin: [0, 20, 0, 10],
    },
    {
      text: '─────────────────────────────────────────────────',
      alignment: 'center',
      color: '#e5e7eb',
      margin: [0, 10, 0, 10],
    },
    {
      text: `This is a computer-generated document. Generated on ${data.generatedAtFormatted}`,
      style: 'footer',
    },
  ];
}
