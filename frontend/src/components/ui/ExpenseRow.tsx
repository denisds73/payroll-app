import { Lock } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { VALIDATION } from '../../utils/validation';
import ConfirmModal from '../modals/ConfirmModal';
import Button from './Button';
import Input from './Input';
import TamilTextarea from './TamilTextarea';
import Tooltip from './Tooltip';

export interface ExpenseRowData {
  /** Map of typeId -> amount for each expense type */
  amounts: Record<number, number>;
  note: string;
  /** Map of typeId -> existing expense record ID (for updates/deletes) */
  existingIds: Record<number, number | string>;
}

interface ExpenseRowProps {
  date: string;
  expenseTypes: { id: number; name: string }[];
  initialData?: ExpenseRowData;
  onSave?: (data: ExpenseRowData) => void;
  onDelete?: (data: ExpenseRowData) => void;
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

const ExpenseRow: React.FC<ExpenseRowProps> = ({
  date,
  expenseTypes,
  initialData,
  onSave,
  onDelete,
  isLocked = false,
  lockReasons = [],
}) => {
  const hasExistingData = initialData ? Object.keys(initialData.existingIds).length > 0 : false;
  const [isEditing, setIsEditing] = useState<boolean>(!hasExistingData);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const buildEmptyAmounts = (): Record<number, number> => {
    const amounts: Record<number, number> = {};
    for (const t of expenseTypes) {
      amounts[t.id] = 0;
    }
    return amounts;
  };

  const [formData, setFormData] = useState<ExpenseRowData>({
    amounts: buildEmptyAmounts(),
    note: '',
    existingIds: {},
  });

  const [savedData, setSavedData] = useState<ExpenseRowData>({
    amounts: buildEmptyAmounts(),
    note: '',
    existingIds: {},
  });

  const handleAmountChange = (typeId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !Number.isNaN(Number(value))) {
      setFormData((prev) => ({
        ...prev,
        amounts: {
          ...prev.amounts,
          [typeId]: value === '' ? 0 : Number(value),
        },
      }));
    }
  };

  const handleSave = () => {
    // Check if at least one amount is filled
    const hasAnyAmount = Object.values(formData.amounts).some((a) => a > 0);
    if (!hasAnyAmount) {
      toast.error('Please enter at least one expense amount');
      return;
    }

    // Validate individual amounts
    for (const [typeId, amount] of Object.entries(formData.amounts)) {
      if (amount < 0) {
        const type = expenseTypes.find((t) => t.id === Number(typeId));
        toast.error(`${type?.name || 'Expense'} amount cannot be negative`);
        return;
      }
      if (amount > VALIDATION.amount.max) {
        const type = expenseTypes.find((t) => t.id === Number(typeId));
        toast.error(`${type?.name || 'Expense'}: ${VALIDATION.amount.messageMax}`);
        return;
      }
    }

    setSavedData(formData);
    const hasSaved = Object.keys(formData.existingIds).length > 0;
    if (hasSaved) {
      setIsEditing(false);
    }
    setIsDirty(false);

    if (onSave) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsDirty(false);
    const hasSaved = Object.keys(savedData.existingIds).length > 0;
    if (hasSaved) {
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(formData);
      }
      setShowDeleteModal(false);

      // Reset back to empty
      const emptyData: ExpenseRowData = {
        amounts: buildEmptyAmounts(),
        note: '',
        existingIds: {},
      };
      setFormData(emptyData);
      setSavedData(emptyData);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete expenses');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
      setIsEditing(true);
    }
  };


  // Sync initialData
  useEffect(() => {
    if (initialData) {
      const mergedAmounts = { ...buildEmptyAmounts(), ...initialData.amounts };
      const merged = { ...initialData, amounts: mergedAmounts };
      setFormData(merged);
      setSavedData(merged);
      const hasSaved = Object.keys(initialData.existingIds).length > 0;
      setIsEditing(!hasSaved);
    } else {
      const empty = { amounts: buildEmptyAmounts(), note: '', existingIds: {} };
      setFormData(empty);
      setSavedData(empty);
      setIsEditing(true);
    }
  }, [initialData]);

  // Track dirty state
  useEffect(() => {
    if (!isEditing) return;

    const amountsChanged = expenseTypes.some(
      (t) => (formData.amounts[t.id] || 0) !== (savedData.amounts[t.id] || 0),
    );
    const noteChanged = formData.note !== savedData.note;

    setIsDirty(amountsChanged || noteChanged);
  }, [formData, savedData, isEditing, expenseTypes]);

  const hasAnyExistingIds = Object.keys(savedData.existingIds).length > 0;

  const renderActionButtons = () => {
    if (isLocked) {
      return (
        <div className="flex items-center gap-2 text-text-secondary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Locked</span>
        </div>
      );
    }

    // View mode: show Edit and Delete buttons if there's data
    if (!isEditing && hasAnyExistingIds) {
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
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="border-2 font-semibold"
          >
            Delete
          </Button>
        </div>
      );
    }

    // Edit mode (or new row mode)
    const hasAnyAmount = Object.values(formData.amounts).some((a) => a > 0);
    const canSave = isDirty && hasAnyAmount;

    return (
      <div className="flex gap-2">
        <Button variant="primary" size="md" onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleCancel}
          disabled={!isDirty && !hasAnyExistingIds}
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

  const totalAmount = Object.values(formData.amounts).reduce((sum, a) => sum + (a || 0), 0);

  const rowContent = (
    <div
      className={`flex flex-nowrap items-center gap-x-4 px-6 py-2 bg-card transition-all duration-200 rounded-lg ${
        isLocked ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      role="row"
    >
      {/* Date */}
      <div className="w-36 shrink-0 text-md font-medium text-text-primary">
        {formatDate(date)}
      </div>

      {/* Expense type input fields */}
      {expenseTypes.map((type) => (
        <div key={type.id} className="shrink-0 w-24">
          <Input
            type="number"
            value={formData.amounts[type.id] || ''}
            onChange={(e) => handleAmountChange(type.id, e)}
            disabled={!isEditing || isLocked}
            placeholder={type.name}
            min="0"
            max={VALIDATION.amount.max}
            step="0.01"
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>
      ))}

      {/* Notes */}
      <div className="flex-1 min-w-0">
        <TamilTextarea
          value={formData.note}
          onValueChange={(val) => setFormData((prev) => ({ ...prev, note: val }))}
          disabled={!isEditing || isLocked}
          placeholder="Add notes..."
          maxLength={VALIDATION.textField.maxLength}
        />
      </div>

      {/* Actions */}
      <div className="w-32 shrink-0 flex justify-end">
        {renderActionButtons()}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Expenses"
          message={`Are you sure you want to delete all expenses (₹${totalAmount}) for ${formatDate(date)}? This action cannot be undone.`}
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

export default ExpenseRow;
