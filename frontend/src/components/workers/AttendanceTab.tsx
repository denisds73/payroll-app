import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useSalaryLock } from '../../hooks/useSalaryLock';
import { attendanceAPI } from '../../services/api';
import AttendanceTable from '../ui/AttendanceTable';

interface AttendanceData {
  attendanceStatus: string;
  otHours: number;
  notes: string;
}

interface AttendanceDataWithId extends AttendanceData {
  id?: number;
}

interface AttendanceTabProps {
  workerId: number;
  onAttendanceChange?: () => void;
}

export default function AttendanceTab({ workerId, onAttendanceChange }: AttendanceTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();

  const month = Number(searchParams.get('month')) || today.getMonth() + 1;
  const year = Number(searchParams.get('year')) || today.getFullYear();

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceDataWithId>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isInitialMount = useRef(true);
  const prevMonthRef = useRef(month);
  const prevYearRef = useRef(year);

  const { isDateLocked, loading: lockLoading, error: lockError } = useSalaryLock(workerId);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, month, year]);

  useEffect(() => {
    const currentMonth = Number(searchParams.get('month'));
    const currentYear = Number(searchParams.get('year'));

    if (currentMonth && (currentMonth < 1 || currentMonth > 12)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('month', String(today.getMonth() + 1));
      setSearchParams(newParams);
    }

    if (currentYear && (currentYear < 2000 || currentYear > 2100)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('year', String(today.getFullYear()));
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams, today]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevMonthRef.current = month;
      prevYearRef.current = year;
      return;
    }

    if (prevMonthRef.current !== month || prevYearRef.current !== year) {
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      toast.success(`Viewing ${monthName} ${year}`);

      prevMonthRef.current = month;
      prevYearRef.current = year;
    }
  }, [month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await attendanceAPI.getByWorkerAndMonth(workerId, month, year);

      const map: Record<string, AttendanceDataWithId> = {};

      for (const record of response.data) {
        const dateStr = record.date.split('T')[0];
        const frontendStatus = record.status.toLowerCase();

        map[dateStr] = {
          id: record.id,
          attendanceStatus: frontendStatus,
          otHours: record.otUnits || 0,
          notes: record.note || '',
        };
      }

      setAttendanceMap(map);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (date: string, data: AttendanceData) => {
    try {
      const existingRecord = attendanceMap[date];
      const backendStatus = data.attendanceStatus.toUpperCase();

      if (existingRecord && existingRecord.id) {
        const payload = {
          status: backendStatus,
          otUnits: data.otHours,
          note: data.notes || undefined,
        };

        await attendanceAPI.update(existingRecord.id, payload);

        setAttendanceMap((prev) => ({
          ...prev,
          [date]: {
            ...data,
            id: existingRecord.id,
          },
        }));
      } else {
        const payload = {
          workerId,
          date,
          status: backendStatus,
          otUnits: data.otHours,
          note: data.notes || undefined,
        };

        const response = await attendanceAPI.create(payload);

        setAttendanceMap((prev) => ({
          ...prev,
          [date]: {
            ...data,
            id: response.data.id,
          },
        }));
      }

      if (onAttendanceChange) {
        onAttendanceChange();
      }

      toast.success('Attendance saved successfully');
    } catch (err: unknown) {
      console.error('Save failed:', err);

      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to save attendance';

      if (
        errorMessage.toLowerCase().includes('locked') ||
        errorMessage.toLowerCase().includes('salary') ||
        errorMessage.toLowerCase().includes('paid')
      ) {
        toast.error('Cannot edit - salary has been paid for this period');
      } else {
        toast.error(errorMessage);
      }

      fetchAttendance();
    }
  };

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('month', String(newMonth));
    newParams.set('year', String(newYear));
    setSearchParams(newParams);
  };

  const getAllDaysInMonth = (month: number, year: number): string[] => {
    const days: string[] = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const lockedDates = useMemo(() => {
    const locked = new Set<string>();
    const dates = getAllDaysInMonth(month, year);

    dates.forEach((date) => {
      if (isDateLocked(date)) {
        locked.add(date);
      }
    });

    return locked;
  }, [isDateLocked, month, year]);

  const isLoading = loading || lockLoading;
  const combinedError = error || lockError;

  return (
    <div>
      <AttendanceTable
        month={month}
        year={year}
        attendanceMap={attendanceMap}
        loading={isLoading}
        error={combinedError}
        onMonthYearChange={handleMonthYearChange}
        onSaveAttendance={handleSaveAttendance}
        lockedDates={lockedDates}
      />
    </div>
  );
}
