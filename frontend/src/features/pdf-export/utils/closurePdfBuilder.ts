import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { SalaryReportData } from '../types/pdf.types';
import { formatCurrency, formatDate, formatDateRange } from './pdfFormatters';

export function buildClosureReportPdf(
  data: SalaryReportData,
  signatureDataUrl?: string,
): TDocumentDefinitions {
  const content: Content[] = [
    buildHeader(data),
    buildWorkerInfo(data),
    buildCyclePeriod(data),
    buildBalanceBreakdown(data),
  ];

  // Add advances table if there are advances
  if (data.advances.records.length > 0) {
    content.push(buildAdvancesSection(data));
  }

  // Add expenses table if there are expenses
  if (data.expenses.records.length > 0) {
    content.push(buildExpensesSection(data));
  }

  // Add note if present
  if (data.salary.paymentProof) {
    content.push(buildNoteSection(data.salary.paymentProof));
  }

  // Add signature
  content.push(buildSignatureSection(data, signatureDataUrl));

  // Add footer
  content.push(buildFooter(data));

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#333333',
    },
    styles: {
      header: { fontSize: 18, bold: true, color: '#1a1a2e', margin: [0, 0, 0, 5] },
      subheader: { fontSize: 12, color: '#666666', margin: [0, 0, 0, 15] },
      sectionTitle: { fontSize: 12, bold: true, color: '#1a1a2e', margin: [0, 15, 0, 8] },
      label: { fontSize: 10, color: '#666666' },
      value: { fontSize: 10, bold: true, color: '#333333' },
    },
  };
}

function buildHeader(data: SalaryReportData): Content {
  return {
    columns: [
      {
        text: 'CYCLE CLOSURE REPORT',
        style: 'header',
        width: '*',
      },
      {
        text: `#${data.salary.id}`,
        fontSize: 14,
        bold: true,
        color: '#999999',
        alignment: 'right' as const,
        width: 'auto',
      },
    ],
    margin: [0, 0, 0, 3] as [number, number, number, number],
  };
}

function buildWorkerInfo(data: SalaryReportData): Content {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'Worker', style: 'label' },
          { text: data.worker.name, style: 'value', fontSize: 13 },
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'Phone', style: 'label' },
          { text: data.worker.phone || 'N/A', style: 'value' },
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'Daily Wage', style: 'label' },
          { text: formatCurrency(data.worker.wage), style: 'value' },
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'OT Rate', style: 'label' },
          { text: `${formatCurrency(data.worker.otRate)}/unit`, style: 'value' },
        ],
      },
    ],
    margin: [0, 10, 0, 0] as [number, number, number, number],
    columnGap: 10,
  };
}

function buildCyclePeriod(data: SalaryReportData): Content {
  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['*', '*'],
      body: [
        [
          {
            text: 'CYCLE PERIOD',
            colSpan: 2,
            bold: true,
            fontSize: 11,
            color: '#ffffff',
            fillColor: '#6c5ce7',
            margin: [8, 6, 8, 6],
          },
          {},
        ],
        [
          {
            text: [
              { text: 'From: ', style: 'label' },
              { text: formatDate(data.salary.cycleStart, 'long'), style: 'value' },
            ],
            margin: [8, 6, 8, 6],
          },
          {
            text: [
              { text: 'To: ', style: 'label' },
              { text: formatDate(data.salary.cycleEnd, 'long'), style: 'value' },
            ],
            margin: [8, 6, 8, 6],
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
  };
}

function buildBalanceBreakdown(data: SalaryReportData): Content {
  const { salary } = data;
  const { summary: attSummary } = data.attendance;

  const rows: any[][] = [
    [
      {
        text: 'BALANCE BREAKDOWN',
        colSpan: 2,
        bold: true,
        fontSize: 11,
        color: '#ffffff',
        fillColor: '#6c5ce7',
        margin: [8, 6, 8, 6],
      },
      {},
    ],
    [
      { text: `Days Worked (${attSummary.totalDays})`, margin: [8, 4, 8, 4] },
      { text: formatCurrency(salary.basePay), alignment: 'right', margin: [8, 4, 8, 4] },
    ],
    [
      { text: `OT Units (${attSummary.totalOtUnits})`, margin: [8, 4, 8, 4] },
      { text: formatCurrency(salary.otPay), alignment: 'right', margin: [8, 4, 8, 4] },
    ],
    [
      { text: 'Gross Pay', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
      {
        text: formatCurrency(salary.grossPay),
        bold: true,
        alignment: 'right',
        margin: [8, 4, 8, 4],
        fillColor: '#f8f9fa',
      },
    ],
    [
      { text: 'Advances', margin: [8, 4, 8, 4] },
      {
        text: `-${formatCurrency(salary.totalAdvance)}`,
        alignment: 'right',
        color: '#e17055',
        margin: [8, 4, 8, 4],
      },
    ],
    [
      { text: 'Expenses', margin: [8, 4, 8, 4] },
      {
        text: `-${formatCurrency(salary.totalExpense)}`,
        alignment: 'right',
        color: '#e17055',
        margin: [8, 4, 8, 4],
      },
    ],
    [
      {
        text: 'NET BALANCE',
        bold: true,
        fontSize: 12,
        margin: [8, 6, 8, 6],
        fillColor: '#f0f0f0',
      },
      {
        text: `${salary.netPay < 0 ? '-' : ''}${formatCurrency(Math.abs(salary.netPay))}`,
        bold: true,
        fontSize: 12,
        alignment: 'right',
        color: salary.netPay >= 0 ? '#00b894' : '#d63031',
        margin: [8, 6, 8, 6],
        fillColor: '#f0f0f0',
      },
    ],
  ];

  if (salary.netPay < 0) {
    rows.push([
      {
        text: '⚠ Worker owes company — balance carried forward to next cycle',
        colSpan: 2,
        italics: true,
        fontSize: 9,
        color: '#e17055',
        margin: [8, 4, 8, 4],
        fillColor: '#fff5f5',
      },
      {},
    ]);
  }

  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['*', 'auto'],
      body: rows,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e0e0e0',
      vLineColor: () => '#e0e0e0',
    },
  };
}

function buildAdvancesSection(data: SalaryReportData): Content {
  const body: any[][] = [
    [
      {
        text: 'ADVANCES',
        colSpan: 3,
        bold: true,
        fontSize: 11,
        color: '#ffffff',
        fillColor: '#e17055',
        margin: [8, 6, 8, 6],
      },
      {},
      {},
    ],
    [
      { text: 'Date', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
      { text: 'Amount', bold: true, alignment: 'right', margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
      { text: 'Reason', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
    ],
  ];

  for (const advance of data.advances.records) {
    body.push([
      { text: formatDate(advance.date), margin: [8, 3, 8, 3] },
      { text: formatCurrency(advance.amount), alignment: 'right', margin: [8, 3, 8, 3] },
      { text: advance.reason || '-', margin: [8, 3, 8, 3], color: '#666666' },
    ]);
  }

  body.push([
    { text: 'Total', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
    {
      text: formatCurrency(data.advances.summary.total),
      bold: true,
      alignment: 'right',
      margin: [8, 4, 8, 4],
      fillColor: '#f8f9fa',
    },
    { text: `${data.advances.summary.count} advance(s)`, margin: [8, 4, 8, 4], fillColor: '#f8f9fa', color: '#666666' },
  ]);

  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['auto', 'auto', '*'],
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e0e0e0',
      vLineColor: () => '#e0e0e0',
    },
  };
}

function buildExpensesSection(data: SalaryReportData): Content {
  const body: any[][] = [
    [
      {
        text: 'EXPENSES',
        colSpan: 3,
        bold: true,
        fontSize: 11,
        color: '#ffffff',
        fillColor: '#0984e3',
        margin: [8, 6, 8, 6],
      },
      {},
      {},
    ],
    [
      { text: 'Date', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
      { text: 'Amount', bold: true, alignment: 'right', margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
      { text: 'Type', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
    ],
  ];

  for (const expense of data.expenses.records) {
    body.push([
      { text: formatDate(expense.date), margin: [8, 3, 8, 3] },
      { text: formatCurrency(expense.amount), alignment: 'right', margin: [8, 3, 8, 3] },
      { text: expense.type.name, margin: [8, 3, 8, 3], color: '#666666' },
    ]);
  }

  body.push([
    { text: 'Total', bold: true, margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
    {
      text: formatCurrency(data.expenses.summary.total),
      bold: true,
      alignment: 'right',
      margin: [8, 4, 8, 4],
      fillColor: '#f8f9fa',
    },
    { text: '', margin: [8, 4, 8, 4], fillColor: '#f8f9fa' },
  ]);

  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['auto', 'auto', '*'],
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e0e0e0',
      vLineColor: () => '#e0e0e0',
    },
  };
}

function buildNoteSection(note: string): Content {
  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: 'NOTE / REASON',
            bold: true,
            fontSize: 11,
            color: '#ffffff',
            fillColor: '#636e72',
            margin: [8, 6, 8, 6],
          },
        ],
        [
          {
            text: note,
            margin: [8, 6, 8, 6],
            italics: true,
            color: '#555555',
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
  };
}

function buildSignatureSection(data: SalaryReportData, signatureDataUrl?: string): Content {
  const finalSignature = signatureDataUrl || data.salary.signature;

  if (!finalSignature) {
    return {
      margin: [0, 25, 0, 0] as [number, number, number, number],
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          stack: [
            {
              canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }],
              margin: [0, 30, 0, 5] as [number, number, number, number],
            },
            { text: 'Worker Signature', alignment: 'center' as const, fontSize: 9, color: '#999999' },
          ],
        },
      ],
    };
  }

  return {
    margin: [0, 25, 0, 0] as [number, number, number, number],
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          {
            image: finalSignature,
            width: 150,
            height: 50,
            alignment: 'center' as const,
            margin: [0, 0, 0, 5] as [number, number, number, number],
          },
          {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }],
            margin: [0, 0, 0, 5] as [number, number, number, number],
          },
          { text: 'Worker Signature', alignment: 'center' as const, fontSize: 9, color: '#999999' },
        ],
      },
    ],
  };
}

function buildFooter(data: SalaryReportData): Content {
  return {
    margin: [0, 20, 0, 0] as [number, number, number, number],
    stack: [
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e0e0e0' }],
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      {
        columns: [
          {
            text: `Generated: ${data.generatedAtFormatted}`,
            fontSize: 8,
            color: '#999999',
          },
          {
            text: 'Cycle Closure Report',
            fontSize: 8,
            color: '#999999',
            alignment: 'right' as const,
          },
        ],
      },
    ],
  };
}
