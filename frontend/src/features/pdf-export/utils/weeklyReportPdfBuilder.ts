import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { WeeklyReportPdfData } from '../types/pdf.types';
import { formatCurrency } from './pdfFormatters';

export function buildWeeklyReportPdf(data: WeeklyReportPdfData): TDocumentDefinitions {
  const dayNames = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getAttendanceMarking = (status: string, otUnits: number): string => {
    let marking = '';
    switch (status.toUpperCase()) {
      case 'PRESENT': marking = 'x'; break;
      case 'ABSENT': marking = 'a'; break;
      case 'HALF': marking = '/'; break;
      default: marking = '-'; break;
    }
    const ot = otUnits ?? 0;
    if (ot > 0) {
      marking += ' ';
      if (ot === 0.5) marking += '/';
      else if (ot === 1.0) marking += 'x';
      else if (ot === 1.5) marking += 'x/';
      else if (ot >= 2.0) marking += 'xx';
      else marking += `(${ot})`;
    }
    return marking;
  };

  // Build the table body
  const tableBody: any[] = [];

  // Header 1: Column groups
  tableBody.push([
    { text: 'வாரம்', style: 'tableHeader', rowSpan: 1, alignment: 'center' },
    ...dayNames.map(day => ({ text: day, style: 'dayHeader', alignment: 'center' })),
    { text: 'வேலை நாட்கள்', style: 'workHeader', alignment: 'center' },
    { text: 'OT', style: 'workHeader', alignment: 'center' },
    { text: 'சம்பளம்', style: 'workHeader', alignment: 'center' },
    { text: 'செலவு', style: 'expenseHeader', alignment: 'center' },
    { text: 'சாப்பாடு', style: 'expenseHeader', alignment: 'center' },
    { text: 'மொத்த செலவு', style: 'expenseHeader', alignment: 'center' },
    { text: 'வரவு', style: 'netHeader', alignment: 'center' }
  ]);

  // Data rows
  data.reports.forEach((week) => {
    const row: any[] = [];
    
    // Week Range
    row.push({ text: `${formatDate(week.startDate)} – ${formatDate(week.endDate)}`, style: 'tableCell', alignment: 'center' });

    // 7 Days
    const start = new Date(week.startDate + 'T00:00:00Z');
    const sunday = new Date(start);
    sunday.setUTCDate(sunday.getUTCDate() - start.getUTCDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isInRange = d >= new Date(week.startDate + 'T00:00:00Z') && d <= new Date(week.endDate + 'T00:00:00Z');
      
      if (!isInRange) {
        row.push({ text: '', style: 'tableCell' });
      } else {
        const att = week.attendances.find(a => a.date === dateStr);
        row.push({ 
          text: att ? getAttendanceMarking(att.status, att.otUnits) : '', 
          style: 'tableCell', 
          alignment: 'center' 
        });
      }
    }

    // Work group
    row.push({ text: week.attendanceCount > 0 ? week.attendanceCount.toString() : '0', style: 'tableCell', alignment: 'center' });
    row.push({ text: week.otUnits > 0 ? week.otUnits.toString() : '0', style: 'tableCell', alignment: 'center' });
    row.push({ text: formatCurrency(week.earning).replace('₹', ''), style: 'tableCell', alignment: 'right' });

    // Expense group
    row.push({ text: formatCurrency(week.expenseGeneral).replace('₹', ''), style: 'tableCell', alignment: 'right' });
    row.push({ text: formatCurrency(week.expenseFood).replace('₹', ''), style: 'tableCell', alignment: 'right' });
    row.push({ text: formatCurrency(week.expensesTotal).replace('₹', ''), style: 'tableCell', alignment: 'right', bold: true });

    // Net
    row.push({ 
      text: formatCurrency(week.netEarning).replace('₹', ''), 
      style: 'tableCell', 
      alignment: 'right', 
      bold: true,
      color: week.netEarning >= 0 ? '#059669' : '#DC2626' 
    });

    tableBody.push(row);
  });

  // Totals row
  tableBody.push([
    { text: 'மொத்தம்', style: 'totalLabel', alignment: 'center' },
    { text: '', colSpan: 7 }, {}, {}, {}, {}, {}, {},
    { text: data.totals.attendanceCount.toString(), style: 'totalValue', alignment: 'center' },
    { text: data.totals.otUnits.toString(), style: 'totalValue', alignment: 'center' },
    { text: formatCurrency(data.totals.earning).replace('₹', ''), style: 'totalValue', alignment: 'right' },
    { text: formatCurrency(data.totals.expenseGeneral).replace('₹', ''), style: 'totalValue', alignment: 'right' },
    { text: formatCurrency(data.totals.expenseFood).replace('₹', ''), style: 'totalValue', alignment: 'right' },
    { text: formatCurrency(data.totals.expensesTotal).replace('₹', ''), style: 'totalValue', alignment: 'right' },
    { 
      text: formatCurrency(data.totals.netEarning).replace('₹', ''), 
      style: 'totalValue', 
      alignment: 'right',
      color: data.totals.netEarning >= 0 ? '#059669' : '#DC2626'
    }
  ]);

  return {
    info: {
      title: `Weekly Report - ${data.worker.name}`,
      author: 'Payroll System',
    },
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 40],
    content: [
      {
        columns: [
          {
            text: 'வாராந்திர அறிக்கை (WEEKLY REPORT)',
            style: 'header',
            width: '*'
          },
          {
            text: data.generatedAt,
            style: 'date',
            width: 'auto',
            alignment: 'right'
          }
        ]
      },
      {
        margin: [0, 5, 0, 15],
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#1a1a2e',
                border: [false, false, false, false],
                columns: [
                  {
                    stack: [
                      { text: 'தொழிலாளர் பெயர் (Worker Name)', style: 'label' },
                      { text: data.worker.name, style: 'value' }
                    ]
                  },
                  {
                    stack: [
                      { text: 'தொலைபேசி எண் (Phone Number)', style: 'label' },
                      { text: data.worker.phone || 'N/A', style: 'value' }
                    ]
                  }
                ],
                margin: [10, 8, 10, 8]
              }
            ]
          ]
        }
      },
      {
        table: {
          headerRows: 1,
          widths: ['11%', '3.5%', '3.5%', '3.5%', '3.5%', '3.5%', '3.5%', '3.5%', '8%', '5%', '9%', '8%', '8%', '9%', '10%'],
          body: tableBody
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1.5 : 0.5,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths!.length) ? 1.5 : 0.5,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#f8fafc';
            if (rowIndex === tableBody.length - 1) return '#f1f5f9';
            return rowIndex % 2 === 0 ? '#ffffff' : '#fcfcfc';
          }
        }
      },
      {
        text: '\nNote: இதர செலவுகள் (Other Expenses) are excluded from Net Earning calculations in this report.',
        style: 'footer'
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        font: 'Tamil',
        color: '#1e293b'
      },
      date: {
        fontSize: 10,
        color: '#64748b'
      },
      label: {
        fontSize: 8,
        color: '#cbd5e1',
        font: 'Tamil'
      },
      value: {
        fontSize: 12,
        bold: true,
        color: '#ffffff',
        font: 'Tamil'
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        font: 'Tamil',
        color: '#475569',
        margin: [0, 4, 0, 4]
      },
      dayHeader: {
        fontSize: 10,
        bold: true,
        font: 'Tamil',
        color: '#64748b'
      },
      workHeader: {
        fontSize: 9,
        bold: true,
        font: 'Tamil',
        color: '#2563eb',
        fillColor: '#eff6ff'
      },
      expenseHeader: {
        fontSize: 9,
        bold: true,
        font: 'Tamil',
        color: '#d97706',
        fillColor: '#fffbeb'
      },
      netHeader: {
        fontSize: 9,
        bold: true,
        font: 'Tamil',
        color: '#059669',
        fillColor: '#ecfdf5'
      },
      tableCell: {
        fontSize: 9,
        font: 'Tamil',
        color: '#334155',
        margin: [0, 2, 0, 2]
      },
      totalLabel: {
        fontSize: 10,
        bold: true,
        font: 'Tamil',
        color: '#1e293b',
        margin: [0, 4, 0, 4]
      },
      totalValue: {
        fontSize: 10,
        bold: true,
        font: 'Tamil',
        color: '#1e293b'
      },
      footer: {
        fontSize: 8,
        italics: true,
        font: 'Tamil',
        color: '#94a3b8',
        margin: [0, 10, 0, 0]
      }
    },
    defaultStyle: {
      font: 'Tamil'
    }
  };
}
