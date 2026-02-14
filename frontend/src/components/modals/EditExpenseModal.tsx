import { X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI, expenseTypesAPI } from '../../services/api';
import { VALIDATION } from '../../utils/validation';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

interface EditExpenseModalProps {
  expense: {
    id: number;
    date: string;
    amount: number;
    note: string;
    typeId: number;
  } | null;
  workerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExpenseFormData {
  date: string;
  amount: string;
  typeId: string;
  note: string;
}

interface ExpenseType {
  id: number;
  name: string;
}

export default function EditExpenseModal({
  expense,
  workerName,
  isOpen,
  onClose,
  onSuccess,
}: EditExpenseModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const dateId = useId();
  const amountId = useId();
  const typeId = useId();
  const noteId = useId();
  const modalTitleId = useId();

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: '',
    amount: '',
    typeId: '',
    note: '',
  });
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchExpenseTypes();
      if (expense) {
        const expenseDate = new Date(expense.date).toISOString().split('T')[0];
        setFormData({
          date: expenseDate,
          amount: expense.amount.toString(),
          typeId: expense.typeId.toString(),
          note: expense.note || '',
        });
      }
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, expense]);

  const fetchExpenseTypes = async (): Promise<void> => {
    try {
      const response = await expenseTypesAPI.getAll();
      setExpenseTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch expense types:', err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!expense) return;



    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error(VALIDATION.amount.messageMin);
      return;
    }

    if (Number(formData.amount) > VALIDATION.amount.max) {
      toast.error(VALIDATION.amount.messageMax);
      return;
    }

    if (!formData.typeId) {
      toast.error('Please select an expense type');
      return;
    }

    setLoading(true);

    try {
      await expensesAPI.update(expense.id, {
        date: formData.date,
        amount: Number(formData.amount),
        typeId: Number(formData.typeId),
        note: formData.note || undefined,
      });

      handleClose();

      setTimeout(() => {
        onSuccess();
      }, 250);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update expense';

      toast.error(errorMessage || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(() => {
        onClose();
      }, 200);
    }
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleBackdropKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="presentation"
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
              Edit Expense
            </h2>
            <p className="text-sm text-text-secondary mt-1">{workerName}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>


          <div>
            <label htmlFor={dateId} className="block text-sm font-medium text-text-primary mb-2">
              Date <span className="text-error">*</span>
            </label>
            <DatePicker
              id={dateId}
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date: date || today })}
              maxDate={today}
              disabled={loading}
              placeholder="Select date"
            />
          </div>

          <div>
            <label htmlFor={typeId} className="block text-sm font-medium text-text-primary mb-2">
              Type <span className="text-error">*</span>
            </label>
            <select
              id={typeId}
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="">Select type...</option>
              {expenseTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={amountId} className="block text-sm font-medium text-text-primary mb-2">
              Amount <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                ₹
              </span>
              <input
                type="number"
                id={amountId}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                min="1"
                max={VALIDATION.amount.max}
                step="1"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor={noteId} className="block text-sm font-medium text-text-primary mb-2">
              Note (Optional)
            </label>
            <textarea
              id={noteId}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note about this expense..."
              rows={3}
              maxLength={VALIDATION.textField.maxLength}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
              disabled={loading}
            />
            {formData.note.length > 0 && (
              <p className="text-xs text-text-secondary mt-1 text-right">
                {formData.note.length}/{VALIDATION.textField.maxLength}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
