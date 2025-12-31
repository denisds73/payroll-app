/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { salariesAPI } from '../../services/api';
import Button from '../ui/Button';

interface PaySalaryModalProps {
  workerId: number;
  workerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SalaryCalculation {
  cycleStart: string;
  cycleEnd: string;
  totalDays: number;
  totalOtUnits: number;
  basePay: number;
  otPay: number;
  grossPay: number;
  totalAdvance: number;
  totalExpense: number;
  netPay: number;
}

interface SalaryFormData {
  paymentDate: string;
  note: string;
}

export default function PaySalaryModal({
  workerId,
  workerName,
  isOpen,
  onClose,
  onSuccess,
}: PaySalaryModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const paymentDateId = useId();
  const noteId = useId();
  const modalTitleId = useId();

  const [formData, setFormData] = useState<SalaryFormData>({
    paymentDate: today,
    note: '',
  });
  const [salaryData, setSalaryData] = useState<SalaryCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      fetchSalaryCalculation();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, workerId]);

  const fetchSalaryCalculation = async (): Promise<void> => {
    setCalculating(true);
    setError(null);

    try {
      const response = await salariesAPI.calculate(workerId);
      setSalaryData(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to calculate salary';

      setError(errorMessage || 'Failed to calculate salary');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!salaryData) {
      setError('No salary data available');
      return;
    }

    setLoading(true);

    try {
      await salariesAPI.pay(workerId, {
        paymentDate: formData.paymentDate,
        note: formData.note || undefined,
      });

      setFormData({
        paymentDate: today,
        note: '',
      });

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to process salary payment';

      setError(errorMessage || 'Failed to process salary payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setIsAnimating(false);

      setTimeout(() => {
        setFormData({
          paymentDate: today,
          note: '',
        });
        setSalaryData(null);
        setError(null);
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

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

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
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
              Pay Salary
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div
              className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm animate-shake"
              role="alert"
            >
              {error}
            </div>
          )}

          {calculating ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-text-secondary mt-3">Calculating salary...</p>
            </div>
          ) : salaryData ? (
            <>
              {/* Salary Breakdown */}
              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                  <span className="text-sm font-semibold text-text-primary">Salary Cycle</span>
                  <span className="text-sm text-text-secondary">
                    {formatDate(salaryData.cycleStart)} - {formatDate(salaryData.cycleEnd)}
                  </span>
                </div>

                {/* Earnings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Days Worked ({salaryData.totalDays})
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(salaryData.basePay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      OT Units ({salaryData.totalOtUnits})
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(salaryData.otPay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
                    <span className="font-medium text-text-primary">Gross Pay</span>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(salaryData.grossPay)}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 pt-2 border-t border-gray-300">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Advances</span>
                    <span className="font-medium text-warning">
                      -{formatCurrency(salaryData.totalAdvance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Expenses</span>
                    <span className="font-medium text-warning">
                      -{formatCurrency(salaryData.totalExpense)}
                    </span>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-400">
                  <span className="text-base font-bold text-text-primary">Net Payable</span>
                  <span
                    className={`text-xl font-bold ${salaryData.netPay >= 0 ? 'text-success' : 'text-error'}`}
                  >
                    {formatCurrency(Math.abs(salaryData.netPay))}
                  </span>
                </div>
                {salaryData.netPay < 0 && (
                  <p className="text-xs text-error text-center">Worker owes company</p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label
                  htmlFor={paymentDateId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Payment Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  id={paymentDateId}
                  value={formData.paymentDate}
                  max={today}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                  disabled={loading}
                />
              </div>

              {/* Note */}
              <div>
                <label
                  htmlFor={noteId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Note (Optional)
                </label>
                <textarea
                  id={noteId}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add payment details or remarks..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                  disabled={loading}
                />
              </div>

              {/* Actions */}
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
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      </div>
    </div>
  );
}
