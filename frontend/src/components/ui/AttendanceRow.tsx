import type React from 'react';
import { useEffect, useState } from 'react';
import Button from './Button';
import OTInputStepper from './OTInputStepper';
import RadioGroup, { type RadioOption } from './RadioGroup';
import Textarea from './Textarea';

interface AttendanceData {
  attendanceStatus: string;
  otHours: number;
  notes: string;
}

interface AttendanceRowProps {
  date: string;
  initialData?: AttendanceData;
  onSave?: (data: AttendanceData) => void;
}

const attendanceOptions: RadioOption[] = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Halfday', label: 'Half Day' },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
};

const AttendanceRow: React.FC<AttendanceRowProps> = ({ date, initialData, onSave }) => {
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [formData, setFormData] = useState<AttendanceData>({
    attendanceStatus: '',
    otHours: 0,
    notes: '',
  });

  const [savedData, setSavedData] = useState<AttendanceData>({
    attendanceStatus: '',
    otHours: 0,
    notes: '',
  });

  const handleAttendanceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, attendanceStatus: value }));
  };

  const handleOtChange = (value: number) => {
    setFormData((prev) => ({ ...prev, otHours: value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, notes: e.target.value }));
  };

  const handleSave = () => {
    setSavedData(formData);
    setIsEditing(false);
    setIsDirty(false);

    if (onSave) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsDirty(false);
    const currentHasSavedData =
      savedData.attendanceStatus !== '' || savedData.otHours !== 0 || savedData.notes !== '';
    if (currentHasSavedData) {
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSavedData(initialData);
      setIsEditing(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isEditing) return;

    const hasChanges =
      formData.attendanceStatus !== savedData.attendanceStatus ||
      formData.otHours !== savedData.otHours ||
      formData.notes !== savedData.notes;

    setIsDirty(hasChanges);
  }, [formData, savedData, isEditing]);

  const renderActionButtons = () => {
    const hasSavedData =
      savedData.attendanceStatus !== '' || savedData.otHours !== 0 || savedData.notes !== '';

    if (!isEditing) {
      return (
        <Button className="border-2 font-semibold" variant="outline" size="md" onClick={handleEdit}>
          Edit
        </Button>
      );
    }

    if (isDirty) {
      return (
        <div className="flex gap-2">
          <Button variant="primary" size="md" onClick={handleSave}>
            Save
          </Button>
          <Button variant="secondary" size="md" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      );
    }

    if (isEditing) {
      if (hasSavedData)
        return (
          <Button variant="secondary" size="md" onClick={handleCancel}>
            Cancel
          </Button>
        );
    }

    return null;
  };

  return (
    <div className="flex flex-nowrap items-center gap-x-8 px-3 py-1 bg-card ">
      <div className="w-28 shrink-0 text-md font-medium text-text-primary">{formatDate(date)}</div>

      <RadioGroup
        className="shrink-0"
        name={`attendance-${date}`}
        options={attendanceOptions}
        value={formData.attendanceStatus}
        onChange={handleAttendanceChange}
        disabled={!isEditing}
      />

      <OTInputStepper
        className="shrink-0"
        value={formData.otHours}
        onChange={handleOtChange}
        disabled={!isEditing}
        min={0}
        max={2}
        step={0.5}
      />
      <div className="max-w-xs flex-1 min-w-0 relative" style={{ top: '-3px' }}>
        <Textarea
          value={formData.notes}
          onChange={handleNotesChange}
          disabled={!isEditing}
          placeholder="Add notes..."
        />
      </div>

      <div className="ml-auto shrink-0 flex gap-2">{renderActionButtons()}</div>
    </div>
  );
};

export default AttendanceRow;
