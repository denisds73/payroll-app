import { Lock } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import ConfirmModal from '../modals/ConfirmModal';
import AttendanceStatusGroup from './AttendanceStatusGroup';
import Button from './Button';
import OTInputStepper from './OTInputStepper';
import TamilTextarea from './TamilTextarea';
import Tooltip from './Tooltip';

interface AttendanceData {
  attendanceStatus: string;
  otHours: number;
  notes: string;
}

interface AttendanceRowProps {
  date: string;
  initialData?: AttendanceData;
  onSave?: (data: AttendanceData) => void;
  onDelete?: () => void;
  isLocked?: boolean;
  lockReasons?: string[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${day}-${month}-${year} (${weekday})`;
};

const AttendanceRow: React.FC<AttendanceRowProps> = ({
  date,
  initialData,
  onSave,
  onDelete,
  isLocked = false,
  lockReasons = [],
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSavedData(initialData);
      setIsEditing(false);
    } else {
      // For new rows, we reset form if initialData becomes undefined
      const empty = { attendanceStatus: '', otHours: 0, notes: '' };
      setFormData(empty);
      setSavedData(empty);
      setIsEditing(true);
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

    if (isLocked) {
      return (
        <div className="flex items-center gap-2 text-text-secondary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Locked</span>
        </div>
      );
    }

    // View mode: show Edit and Delete buttons
    if (!isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            className="border-2 font-semibold"
            variant="outline"
            size="md"
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="dangerLight"
            size="md"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="border-2 font-semibold"
          >
            Delete
          </Button>
        </div>
      );
    }

    // Edit mode: Always show Save and Cancel buttons
    return (
      <div className="flex gap-2">
        <Button variant="primary" size="md" onClick={handleSave} disabled={!isDirty}>
          Save
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleCancel}
          disabled={!isDirty && !hasSavedData}
        >
          Cancel
        </Button>
      </div>
    );
  };

  const tooltipContent = lockReasons.length > 0 && (
    <div>
      <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-1.5">
        <Lock className="w-3.5 h-3.5" />
        <span>Locked</span>
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">
        {lockReasons.map((reason) => (
          <div key={reason}>{reason}</div>
        ))}
      </div>
    </div>
  );

  const rowContent = (
    <div
      className={`flex flex-nowrap items-center gap-x-8 px-6 py-2 bg-card transition-all duration-200 rounded-lg ${
        isLocked ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <div className="w-36 shrink-0 text-md font-medium text-text-primary">
        {formatDate(date)}
      </div>

      <div className="w-48 shrink-0 flex justify-center">
        <AttendanceStatusGroup
          value={formData.attendanceStatus}
          onChange={handleAttendanceChange}
          disabled={!isEditing || isLocked}
        />
      </div>

      <div className="w-[120px] shrink-0 flex justify-center">
        <OTInputStepper
          value={formData.otHours}
          onChange={handleOtChange}
          disabled={!isEditing || isLocked}
          min={0}
          max={2}
          step={0.5}
        />
      </div>

      <div className="flex-1 min-w-0">
        <TamilTextarea
          value={formData.notes}
          onValueChange={(val) => setFormData((prev) => ({ ...prev, notes: val }))}
          disabled={!isEditing || isLocked}
          placeholder="Add notes..."
        />
      </div>

      <div className="w-32 shrink-0 flex justify-end">
        {renderActionButtons()}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Attendance"
          message={`Are you sure you want to delete attendance for ${formatDate(date)}?`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );

  if (isLocked && tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="cursor">
        {rowContent}
      </Tooltip>
    );
  }

  return rowContent;
};

export default AttendanceRow;
