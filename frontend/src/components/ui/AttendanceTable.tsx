import React, { useState } from 'react';
import AttendanceRow from './AttendanceRow';

// --- Types ---
interface AttendanceData {
  attendanceStatus: string;
  otHours: number;
  notes: string;
}

interface AttendanceTableProps {
  month: number;
  year: number;
  attendanceMap: Record<string, AttendanceData | undefined>;
  loading: boolean;
  error?: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onSaveAttendance: (date: string, data: AttendanceData) => void;
}

// --- Utilities ---
function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getAllDaysInMonth(month: number, year: number): string[] {
  const days: string[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push(formatDateLocal(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  month,
  year,
  attendanceMap,
  loading,
  error,
  onMonthChange,
  onYearChange,
  onSaveAttendance,
}) => {
  const [candidateMonth, setCandidateMonth] = useState(month);
  const [candidateYear, setCandidateYear] = useState(year);

  React.useEffect(() => {
    setCandidateMonth(month);
    setCandidateYear(year);
  }, [month, year]);

  const dates = getAllDaysInMonth(month, year);

  return (
    <div className="rounded-xl bg-card shadow-md w-full">
      {/* Header + Filters */}
      <div className="flex items-center justify-between px-6 py-3 bg-background border-b border-gray-200 rounded-t-xl shadow-sm">
        {/* Table Labels */}
        <div className="grid grid-cols-5 gap-x-6 font-semibold text-text-primary text-base w-full">
          <div className="w-28">Date</div>
          <div className="w-28">Status</div>
          <div className="w-28">OT Hours</div>
          <div className="flex-1">Notes</div>
          <div className="w-28 text-right">Actions</div>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2 ml-6">
          <select
            className="px-3 py-1 rounded-md border border-gray-200 bg-background text-primary font-medium w-28 focus:ring-2 focus:ring-primary transition-all outline-none"
            value={candidateMonth}
            onChange={(e) => setCandidateMonth(Number(e.target.value))}
            aria-label="Select month"
          >
            {Array.from({ length: 12 }, (_, idx) => {
              const monthValue = idx + 1;
              return (
                <option key={monthValue} value={monthValue}>
                  {new Date(0, idx).toLocaleString('default', { month: 'short' })}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            className="px-3 py-1 rounded-md border border-gray-200 bg-background text-primary font-medium w-20 focus:ring-2 focus:ring-primary transition-all outline-none"
            value={candidateYear}
            onChange={(e) => setCandidateYear(Number(e.target.value))}
            aria-label="Select year"
          />
          <button
            type="button"
            className="
              ml-2 px-4 py-1 
              rounded 
              bg-primary 
              hover:bg-primary-hover 
              text-card font-semibold 
              transition-all
              shadow-sm
            "
            onClick={() => {
              onMonthChange(candidateMonth);
              onYearChange(candidateYear);
            }}
            aria-label="Apply month/year filter"
          >
            Apply
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 mb-2 p-2 rounded bg-error/10 text-error text-sm font-medium">
          {error}
        </div>
      )}

      <div className="overflow-y-auto max-h-[500px] rounded-b-xl px-6 py-3 space-y-2">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={`loading-skeleton-${i + 1}`}
              className="animate-pulse h-14 bg-background rounded-lg w-full mb-2"
            />
          ))
        ) : (
          <>
            {dates.map((date) => (
              <AttendanceRow
                key={date}
                date={date}
                initialData={attendanceMap[date]}
                onSave={(data) => onSaveAttendance(date, data)}
              />
            ))}
            {dates.every((date) => !attendanceMap[date]) && (
              <div className="mt-6 text-text-secondary text-center text-sm">
                No attendance records for this month yet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceTable;
