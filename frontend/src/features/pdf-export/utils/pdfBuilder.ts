import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { SalaryReportData } from '../types/pdf.types';
import { capitalize, formatCurrency, formatDate, formatDateRange } from './pdfFormatters';

export function buildSalaryReportPdf(
  data: SalaryReportData,
  signatureDataUrl?: string,
): TDocumentDefinitions {
  return {
    info: {
      title: `Salary Report - ${data.worker.name}`,
      author: 'Payroll System',
      subject: `Salary report for ${formatDateRange(data.salary.cycleStart, data.salary.cycleEnd)}`,
      creator: 'Payroll App',
      producer: 'PDFMake',
    },

    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],

    content: [
      buildHeader(data),
      buildWorkerInfo(data),
      buildSalaryPeriod(data),
      buildAttendanceSummary(data),
      buildAttendanceTable(data),
      buildExpensesTable(data),
      buildAdvancesTable(data),
      buildSalaryBreakdown(data),
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
        margin: [0, 15, 0, 8],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#FFFFFF',
        fillColor: '#18181b',
      },
      tableCell: {
        fontSize: 9,
        color: '#18181b',
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
      summaryLabel: {
        fontSize: 11,
        color: '#18181b',
      },
      summaryValue: {
        fontSize: 11,
        color: '#18181b',
        bold: true,
      },
      totalRow: {
        fontSize: 10,
        bold: true,
        color: '#18181b',
      },
      footer: {
        fontSize: 8,
        color: '#a1a1aa',
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

function buildHeader(data: SalaryReportData): any {
  return [
    {
      text: 'SALARY REPORT',
      style: 'documentTitle',
    },
    {
      text: `Generated: ${data.generatedAtFormatted}`,
      style: 'footer',
      margin: [0, 0, 0, 20],
    },
  ];
}

function buildWorkerInfo(data: SalaryReportData): any {
  return [
    {
      text: 'WORKER INFORMATION',
      style: 'sectionHeader',
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            {
              columns: [
                { text: 'Name:', style: 'infoLabel', width: 80 },
                { text: data.worker.name, style: 'infoValue' },
              ],
              margin: [0, 0, 0, 4],
            },
            ...(data.worker.phone
              ? [
                  {
                    columns: [
                      { text: 'Phone:', style: 'infoLabel', width: 80 },
                      { text: data.worker.phone, style: 'infoValue' },
                    ],
                    margin: [0, 0, 0, 4],
                  },
                ]
              : []),
          ],
        },
        {
          width: '50%',
          stack: [],
        },
      ],
    },
  ];
}

function buildSalaryPeriod(data: SalaryReportData): any {
  return [
    {
      text: 'SALARY PERIOD',
      style: 'sectionHeader',
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            {
              columns: [
                { text: 'Period:', style: 'infoLabel', width: 80 },
                {
                  text: formatDateRange(data.salary.cycleStart, data.salary.cycleEnd),
                  style: 'infoValue',
                },
              ],
              margin: [0, 0, 0, 4],
            },
            ...(data.salary.issuedAt
              ? [
                  {
                    columns: [
                      { text: 'Paid On:', style: 'infoLabel', width: 80 },
                      {
                        text: formatDate(data.salary.issuedAt),
                        style: 'infoValue',
                      },
                    ],
                    margin: [0, 0, 0, 4],
                  },
                ]
              : []),
          ],
        },
        {
          width: '50%',
          stack: [
            {
              columns: [
                { text: 'Status:', style: 'infoLabel', width: 80 },
                { text: capitalize(data.salary.status), style: 'infoValue' },
              ],
              margin: [0, 0, 0, 4],
            },
            ...(data.salary.paymentProof
              ? [
                  {
                    columns: [
                      { text: 'Reference:', style: 'infoLabel', width: 80 },
                      { text: data.salary.paymentProof, style: 'infoValue' },
                    ],
                    margin: [0, 0, 0, 4],
                  },
                ]
              : []),
          ],
        },
      ],
    },
  ];
}

function buildAttendanceSummary(data: SalaryReportData): Content {
  const { attendance } = data;
  const { summary } = attendance;

  return {
    stack: [
      // Header
      {
        text: 'Attendance Summary',
        style: 'sectionHeader',
        margin: [0, 15, 0, 10],
      },

      // Two-column layout
      {
        columns: [
          // Left Column - Days
          {
            width: '48%',
            stack: [
              { text: 'Days Breakdown', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Present Days', style: 'tableCell' },
                      {
                        text: summary.presentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Half Days', style: 'tableCell' },
                      { text: summary.halfDays.toString(), style: 'tableCell', alignment: 'right' },
                    ],
                    [
                      { text: 'Absent Days', style: 'tableCell' },
                      {
                        text: summary.absentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Total Days Worked', style: 'tableCell', bold: true },
                      {
                        text: summary.totalDays.toFixed(1),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                    [
                      { text: 'Total OT Units', style: 'tableCell', bold: true },
                      {
                        text: summary.totalOtUnits.toFixed(1),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                  ],
                },
                layout: 'lightHorizontalLines',
              },
            ],
          },

          // Gap
          { width: '4%', text: '' },

          // Right Column - Amounts
          {
            width: '48%',
            stack: [
              { text: 'Payment Breakdown', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Base Wage Total', style: 'tableCell' },
                      {
                        text: formatCurrency(summary.totalBasePay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        color: '#10B981', // Success color
                      },
                    ],
                    [
                      { text: 'Overtime Total', style: 'tableCell' },
                      {
                        text: formatCurrency(summary.totalOtPay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        color: '#10B981', // Success color
                      },
                    ],
                    [
                      { text: 'Gross Pay', style: 'tableCell', bold: true },
                      {
                        text: formatCurrency(summary.totalBasePay + summary.totalOtPay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        fontSize: 11,
                        color: '#18181b', // Primary color
                      },
                    ],
                  ],
                },
                layout: 'lightHorizontalLines',
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildAttendanceMarking(status: string, otUnits: number): any {
  let marking = '';

  switch (status.toUpperCase()) {
    case 'PRESENT':
      marking = 'x';
      break;
    case 'ABSENT':
      marking = 'a';
      break;
    case 'HALF':
      marking = '/';
      break;
    default:
      marking = '-';
      break;
  }

  const ot = otUnits ?? 0;
  if (ot > 0) {
    marking += '  ';
    if (ot === 0.5) {
      marking += '/';
    } else if (ot === 1.0) {
      marking += 'x';
    } else if (ot === 1.5) {
      marking += 'x/';
    } else if (ot >= 2.0) {
      marking += 'xx';
    } else {
      marking += `(${ot} OT)`;
    }
  }

  return { text: marking, style: 'tableCell' };
}

function buildAttendanceTable(data: SalaryReportData): any {
  const { records } = data.attendance;

  if (records.length === 0) {
    return [
      { text: 'ATTENDANCE DETAILS', style: 'sectionHeader' },
      { text: 'No attendance records for this period', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Marking', style: 'tableHeader' },
      { text: 'Note', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      buildAttendanceMarking(record.status, record.otUnits),
      { text: record.note || '-', style: 'tableCell' },
    ]),
  ];

  return [
    {
      text: 'ATTENDANCE DETAILS',
      style: 'sectionHeader',
    },
    {
      table: {
        headerRows: 1,
        widths: ['30%', '25%', '45%'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#18181b' : rowIndex % 2 === 0 ? '#F5F5F7' : null;
        },
      },
    },
  ];
}

function buildExpensesTable(data: SalaryReportData): any {
  const { records, summary } = data.expenses;

  if (records.length === 0) {
    return [
      { text: 'EXPENSES', style: 'sectionHeader' },
      { text: 'No expenses for this period', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Type', style: 'tableHeader' },
      { text: 'Amount', style: 'tableHeader', alignment: 'right' },
      { text: 'Note', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      { text: record.type.name, style: 'tableCell' },
      {
        text: formatCurrency(record.amount),
        style: 'tableCell',
        alignment: 'right',
      },
      { text: record.note || '-', style: 'tableCell' },
    ]),
    [
      { text: 'TOTAL EXPENSES', style: 'totalRow', colSpan: 2 },
      {},
      {
        text: formatCurrency(summary.total),
        style: 'totalRow',
        alignment: 'right',
      },
      {},
    ],
  ];

  return [
    {
      text: 'EXPENSES',
      style: 'sectionHeader',
    },
    {
      table: {
        headerRows: 1,
        widths: ['20%', '25%', '20%', '35%'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number, node: any) => {
          if (rowIndex === 0) return '#18181b';
          if (rowIndex === node.table.body.length - 1) return '#F5F5F7';
          return rowIndex % 2 === 0 ? '#F5F5F7' : null;
        },
      },
    },
  ];
}

function buildAdvancesTable(data: SalaryReportData): any {
  const { records, summary } = data.advances;

  if (records.length === 0) {
    return [
      { text: 'ADVANCES', style: 'sectionHeader' },
      { text: 'No advances for this period', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Amount', style: 'tableHeader', alignment: 'right' },
      { text: 'Reason', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      {
        text: formatCurrency(record.amount),
        style: 'tableCell',
        alignment: 'right',
      },
      { text: record.reason || '-', style: 'tableCell' },
    ]),
    [
      { text: 'TOTAL ADVANCES', style: 'totalRow' },
      {
        text: formatCurrency(summary.total),
        style: 'totalRow',
        alignment: 'right',
      },
      {},
    ],
  ];

  return [
    {
      text: 'ADVANCES',
      style: 'sectionHeader',
    },
    {
      table: {
        headerRows: 1,
        widths: ['25%', '25%', '50%'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number, node: any) => {
          if (rowIndex === 0) return '#18181b';
          if (rowIndex === node.table.body.length - 1) return '#F5F5F7';
          return rowIndex % 2 === 0 ? '#F5F5F7' : null;
        },
      },
    },
  ];
}

function buildSalaryBreakdown(data: SalaryReportData): any {
  const { salary, attendance } = data;

  return [
    {
      text: 'SALARY BREAKDOWN',
      style: 'sectionHeader',
    },
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            {
              text: `Base Pay (${attendance.summary.totalDays.toFixed(1)} days)`,
              style: 'tableCell',
            },
            {
              text: formatCurrency(salary.basePay),
              style: 'tableCell',
              alignment: 'right',
            },
          ],
          [
            {
              text: `OT Pay (${attendance.summary.totalOtUnits.toFixed(1)} units)`,
              style: 'tableCell',
            },
            {
              text: formatCurrency(salary.otPay),
              style: 'tableCell',
              alignment: 'right',
            },
          ],
          [
            {
              text: 'Gross Pay',
              style: 'totalRow',
              border: [false, true, false, false],
            },
            {
              text: formatCurrency(salary.grossPay),
              style: 'totalRow',
              alignment: 'right',
              border: [false, true, false, false],
            },
          ],
          [
            { text: 'Less: Advances', style: 'tableCell', color: '#EF4444' },
            {
              text: `-${formatCurrency(salary.totalAdvance)}`,
              style: 'tableCell',
              alignment: 'right',
              color: '#EF4444',
            },
          ],
          [
            { text: 'Less: Expenses', style: 'tableCell', color: '#EF4444' },
            {
              text: `-${formatCurrency(salary.totalExpense)}`,
              style: 'tableCell',
              alignment: 'right',
              color: '#EF4444',
            },
          ],
          [
            {
              text: 'NET PAYABLE',
              style: 'totalRow',
              fontSize: 12,
              border: [false, true, false, true],
              fillColor: '#F5F5F7',
            },
            {
              text: formatCurrency(salary.netPay),
              style: 'totalRow',
              fontSize: 12,
              alignment: 'right',
              border: [false, true, false, true],
              fillColor: '#F5F5F7',
              color: salary.netPay >= 0 ? '#10B981' : '#EF4444',
            },
          ],
          [
            { text: 'Total Paid', style: 'tableCell' },
            {
              text: formatCurrency(salary.totalPaid),
              style: 'tableCell',
              alignment: 'right',
            },
          ],
          [
            {
              text: 'Balance',
              style: 'totalRow',
              border: [false, true, false, false],
            },
            {
              text: formatCurrency(salary.netPay - salary.totalPaid),
              style: 'totalRow',
              alignment: 'right',
              border: [false, true, false, false],
              color: salary.netPay - salary.totalPaid === 0 ? '#10B981' : '#F59E0B',
            },
          ],
        ],
      },
      layout: 'noBorders',
    },
  ];
}

function buildFooter(data: SalaryReportData): any {
  return [
    {
      text: '\n\n─────────────────────────────────────────────────',
      alignment: 'center',
      color: '#e5e7eb',
    },
    {
      text: `This is a computer-generated document. Generated on ${data.generatedAtFormatted}`,
      style: 'footer',
      margin: [0, 10, 0, 0],
    },
  ];
}

function buildSignatureSection(data: SalaryReportData, signatureDataUrl?: string): Content {
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
                text: `Signed on: ${formatDate(new Date().toISOString())}`,
                fontSize: 8,
                color: '#6b7280',
                italics: true,
                alignment: 'center',
                margin: [0, 3, 0, 0],
              }
            : [],
        ],
      },
      { width: '*', text: '' },
    ],
    margin: [0, 20, 0, 0],
  };
}
