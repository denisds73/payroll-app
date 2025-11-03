import { useState } from 'react';
import RadioGroup from '../components/ui/Radiogroup';

const attendanceOptions = [
  { value: 'P', label: 'Present' },
  { value: 'A', label: 'Absent' },
  { value: 'H', label: 'Halfday' },
];

export default function RadioGroupTestPage() {
  // 1. State for chosen attendance value
  const [attendance, setAttendance] = useState('P');

  return (
    <div className="p-8">
      {/* 2. Display your RadioGroup */}
      <h2 className="mb-2 font-bold text-lg">Attendance Selector (Test)</h2>
      <RadioGroup
        name="attendance"
        options={attendanceOptions}
        value={attendance}
        onChange={setAttendance}
      />

      {/* 3. Show current state to verify logic */}
      <div className="mt-4">
        <span className="font-mono">Currently selected: {attendance}</span>
      </div>
    </div>
  );
}
