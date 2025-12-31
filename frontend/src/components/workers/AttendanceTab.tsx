import { useEffect, useState } from 'react';
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
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceDataWithId>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchAttendance();
  }, [workerId, month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await attendanceAPI.getByWorkerAndMonth(workerId, month, year);

      const map: Record<string, AttendanceDataWithId> = {};

      response.data.forEach((record: any) => {
        const dateStr = record.date.split('T')[0];
        const frontendStatus = record.status.toLowerCase();

        map[dateStr] = {
          id: record.id,
          attendanceStatus: frontendStatus,
          otHours: record.otUnits || 0,
          notes: record.note || '',
        };
      });

      setAttendanceMap(map);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
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
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save attendance';
      alert(errorMsg);
    }
  };

  return (
    <div>
      <AttendanceTable
        month={month}
        year={year}
        attendanceMap={attendanceMap}
        loading={loading}
        error={error}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onSaveAttendance={handleSaveAttendance}
      />
    </div>
  );
}
