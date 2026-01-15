import { Lock, Plus } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import ConfirmModal from '../modals/ConfirmModal';
import Button from './Button';
import Input from './Input';
import RadioGroup, { type RadioOption } from './RadioGroup';
import Textarea from './Textarea';
import Tooltip from './Tooltip';

interface ExpenseData {
  id?: number | string;
  typeId: number;
  amount: number;
  note: string;
}

interface ExpenseRowProps {
  date: string;
  expenseTypes: { id: number; name: string }[];
  initialData?: ExpenseData;
  onSave?: (data: ExpenseData) => void;
  onDelete?: (expenseId: number | string) => void;
  showAddButton?: boolean;
  onAddNew?: () => void;
  canDelete?: boolean;
  isNew?: boolean;
  isLocked?: boolean;
  lockReasons?: string[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
};

const ExpenseRow: React.FC<ExpenseRowProps> = ({
  date,
  expenseTypes,
  initialData,
  onSave,
  onDelete,
  showAddButton = false,
  onAddNew,
  canDelete = true,
  isNew = false,
  isLocked = false,
  lockReasons = [],
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(isNew || !initialData);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<ExpenseData>({
    typeId: 0,
    amount: 0,
    note: '',
  });

  const [savedData, setSavedData] = useState<ExpenseData>({
    typeId: 0,
    amount: 0,
    note: '',
  });

  const expenseOptions: RadioOption[] = expenseTypes.map((type) => ({
    value: String(type.id),
    label: type.name,
  }));

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, typeId: Number(value) }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !Number.isNaN(Number(value))) {
      setFormData((prev) => ({ ...prev, amount: value === '' ? 0 : Number(value) }));
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, note: e.target.value }));
  };

  const handleSave = () => {
    if (formData.typeId === 0) {
      alert('Please select an expense type');
      return;
    }
    if (formData.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    setSavedData(formData);
    setIsEditing(false);
    setIsDirty(false);

    if (onSave) {
      onSave(formData);
    }
  };

  const handleCancel = () => {
    const isEmptyNew = isNew && savedData.typeId === 0 && savedData.amount === 0;
    if (isEmptyNew && onDelete && initialData?.id) {
      onDelete(initialData.id);
      return;
    }

    setFormData(savedData);
    setIsDirty(false);
    const hasSavedData = savedData.typeId !== 0 || savedData.amount !== 0 || savedData.note !== '';
    if (hasSavedData) {
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(initialData.id);
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete expense');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    if (initialData) {
      console.log(`📋 ExpenseRow ${date} received initialData:`, initialData);
      setFormData(initialData);
      setSavedData(initialData);

      if (!isNew) {
        setIsEditing(false);
      }
    }
  }, [initialData, date, isNew]);

  useEffect(() => {
    if (!isEditing) return;

    const hasChanges =
      formData.typeId !== savedData.typeId ||
      formData.amount !== savedData.amount ||
      formData.note !== savedData.note;

    setIsDirty(hasChanges);
  }, [formData, savedData, isEditing]);

  const renderActionButtons = () => {
    const hasSavedData = savedData.typeId !== 0 || savedData.amount !== 0 || savedData.note !== '';

    if (isLocked) {
      return (
        <div className="flex items-center gap-2 text-text-secondary">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Locked</span>
        </div>
      );
    }

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
          {initialData?.id && canDelete && (
            <Button
              variant="dangerLight"
              size="md"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="border-2 font-semibold"
            >
              Delete
            </Button>
          )}
        </div>
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

    if (isEditing && hasSavedData) {
      return (
        <Button variant="secondary" size="md" onClick={handleCancel}>
          Cancel
        </Button>
      );
    }

    return null;
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
      className={`flex flex-nowrap items-center gap-x-6 px-3 py-1 bg-card transition-all duration-200 rounded-lg ${
        isNew ? 'animate-fadeIn' : ''
      } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="row"
    >
      <div className="w-8 shrink-0 flex items-center justify-center">
        {showAddButton && isHovered && !isEditing && !isLocked && (
          <button
            type="button"
            onClick={onAddNew}
            className="w-8 h-8 rounded-md bg-success/10 text-success hover:bg-success/20 border border-success/20 flex items-center justify-center transition-opacity duration-200"
            style={{ opacity: isHovered ? 1 : 0 }}
            title="Add another expense for this date"
            aria-label="Add expense"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="w-28 shrink-0 text-md font-medium text-text-primary">{formatDate(date)}</div>

      <RadioGroup
        className="shrink-0"
        name={`expense-type-${date}-${initialData?.id || 'new'}`}
        options={expenseOptions}
        value={String(formData.typeId)}
        onChange={handleTypeChange}
        disabled={!isEditing || isLocked}
      />

      <div className="shrink-0 w-32">
        <Input
          type="number"
          value={formData.amount || ''}
          onChange={handleAmountChange}
          disabled={!isEditing || isLocked}
          placeholder="₹ Amount"
          min="0"
          step="0.01"
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>

      <div className="max-w-xs flex-1 min-w-0 relative">
        <Textarea
          value={formData.note}
          onChange={handleNoteChange}
          disabled={!isEditing || isLocked}
          placeholder="Add notes..."
        />
      </div>

      <div className="ml-auto shrink-0 flex gap-2">{renderActionButtons()}</div>

      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Expense"
          message={`Are you sure you want to delete this expense of ₹${formData.amount || savedData.amount} for ${formatDate(date)}? This action cannot be undone.`}
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
