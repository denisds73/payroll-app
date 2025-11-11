import { useState } from 'react';
import AttendanceRow from '../components/ui/AttendanceRow';

export default function TestPage() {
  const [saved, setSaved] = useState<{
    attendanceStatus: string;
    otHours: number;
    notes: string;
  } | null>(null);

  const initialData = {
    attendanceStatus: 'Present',
    otHours: 1,
    notes: 'Initial note',
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-bold">AttendanceRow Single Row Test</h2>
      <AttendanceRow date={'2025-11-11'} onSave={setSaved} />
      <div className="mt-8">
        <h3 className="font-semibold">Saved Data:</h3>
        <pre>{JSON.stringify(saved, null, 2)}</pre>
      </div>
    </div>
  );
}
