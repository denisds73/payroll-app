import { useEffect, useState } from 'react';
import { attendanceAPI } from '../../services/api';
import AttendanceTable from '../ui/AttendanceTable';

interface AttendanceData {
  attendanceStatus: string;
  otHours: number;
  notes: string;
}

// Enhanced to track record IDs
interface AttendanceDataWithId extends AttendanceData {
  id?: number; // Backend record ID
}

interface AttendanceTabProps {
  workerId: number;
}

export default function AttendanceTab({ workerId }: AttendanceTabProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // Store data with IDs
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

      console.log('=== FETCH ATTENDANCE DEBUG ===');
      console.log('📅 Requesting:', { workerId, month, year });
      console.log('📦 Response count:', response.data.length);

      const map: Record<string, AttendanceDataWithId> = {};

      response.data.forEach((record: any) => {
        const dateStr = record.date.split('T')[0];
        const frontendStatus = record.status.toLowerCase();

        console.log('🔄 Processing:', {
          id: record.id, // Track ID
          date: dateStr,
          status: frontendStatus,
        });

        map[dateStr] = {
          id: record.id, // Store the ID
          attendanceStatus: frontendStatus,
          otHours: record.otUnits || 0,
          notes: record.note || '',
        };
      });

      console.log('✅ Final map:', map);
      console.log('=== END FETCH DEBUG ===');

      setAttendanceMap(map);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
      console.error('❌ Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (date: string, data: AttendanceData) => {
    try {
      console.log('=== SAVE ATTENDANCE DEBUG ===');
      console.log('📝 Date:', date);
      console.log('📝 Frontend data:', data);

      // Check if record already exists
      const existingRecord = attendanceMap[date];
      const backendStatus = data.attendanceStatus.toUpperCase();

      if (existingRecord && existingRecord.id) {
        // UPDATE existing record
        console.log('🔄 Updating existing record ID:', existingRecord.id);

        const payload = {
          status: backendStatus,
          otUnits: data.otHours,
          note: data.notes || undefined,
        };

        console.log('📤 PATCH /attendance/' + existingRecord.id, payload);

        const response = await attendanceAPI.update(existingRecord.id, payload);

        console.log('📥 Update response:', response.data);
        console.log('✅ Update successful');

        // Update local state with new data (keep the ID)
        setAttendanceMap((prev) => ({
          ...prev,
          [date]: {
            ...data,
            id: existingRecord.id, // Keep existing ID
          },
        }));
      } else {
        // CREATE new record
        console.log('➕ Creating new record');

        const payload = {
          workerId,
          date,
          status: backendStatus,
          otUnits: data.otHours,
          note: data.notes || undefined,
        };

        console.log('📤 POST /attendance', payload);

        const response = await attendanceAPI.create(payload);

        console.log('📥 Create response:', response.data);
        console.log('✅ Create successful');

        // Update local state with new data and ID from response
        setAttendanceMap((prev) => ({
          ...prev,
          [date]: {
            ...data,
            id: response.data.id, // Store the new ID
          },
        }));
      }

      console.log('=== END SAVE DEBUG ===');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save attendance';
      alert(errorMsg);
      console.error('❌ Save error:', err);
      console.error('❌ Error details:', err.response?.data);

      // Don't update local state on error
      // User should see the error and try again
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
