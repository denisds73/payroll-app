/** biome-ignore-all lint/a11y/noStaticElementInteractions: <it should be like this> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <it should be like this> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <it should be like this> */
import { AlertTriangle, Info, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { useClosurePdfGenerator } from '../../features/pdf-export/hooks/useClosurePdfGenerator';
import { salariesAPI } from '../../services/api';
import { getLocalToday } from '../../utils/dateUtils';
import { VALIDATION } from '../../utils/validation';
import { SignatureModal } from '../signature/SignatureModal';
import type { SignatureData } from '../signature/signature.types';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import TamilTextarea from '../ui/TamilTextarea';

interface CloseCycleModalProps {
  workerId: number;
  workerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CycleData {
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
  carryForward: number;
  totalNetPayable: number;
}

export default function CloseCycleModal({
  workerId,
  workerName,
  isOpen,
  onClose,
  onSuccess,
}: CloseCycleModalProps) {
  const today = getLocalToday();
  const modalTitleId = useId();
  const closureDateId = useId();

  const { generateAndDownload } = useClosurePdfGenerator();

  const [note, setNote] = useState('');
  const [closureDate, setClosureDate] = useState(today);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      fetchCycleData();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, workerId]);

  const fetchCycleData = async (payDate?: string): Promise<void> => {
    setCalculating(true);
    try {
      const response = await salariesAPI.calculate(workerId, payDate);
      setCycleData(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load cycle data';
      toast.error(errorMessage || 'Failed to load cycle data');
      setCycleData(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleClosureDateChange = async (newDate: string): Promise<void> => {
    setClosureDate(newDate);
    if (newDate) {
      await fetchCycleData(newDate);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!cycleData) {
      toast.error('No cycle data available');
      return;
    }

    setLoading(true);

    try {
      const response = await salariesAPI.closeCycle(workerId, {
        note: note || undefined,
        signature: signatureData,
        closureDate: closureDate !== today ? closureDate : undefined,
      });

      const closureId = response.data.id;

      // Auto-generate and download Closure Report PDF
      try {
        await generateAndDownload(closureId, signatureData);
      } catch (pdfErr) {
        console.error('❌ Failed to auto-download closure report PDF:', pdfErr);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to close balance';
      toast.error(errorMessage || 'Failed to close balance');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(() => {
        setNote('');
        setClosureDate(today);
        setCycleData(null);
        setSignatureData(undefined);
        onClose();
      }, 200);
    }
  };

  const handleSaveSignature = (data: SignatureData) => {
    setSignatureData(data.dataUrl);
  };

  const handleClearSignature = () => {
    setSignatureData(undefined);
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleBackdropKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') handleClose();
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

  const isRetroactive = closureDate !== today;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className={`bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
              Close Balance
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {calculating ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-text-secondary mt-3">
                {isRetroactive ? 'Recalculating for selected date...' : 'Loading cycle data...'}
              </p>
            </div>
          ) : cycleData ? (
            <>
              {/* Retroactive Warning */}
              {isRetroactive && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Retroactive Closure
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Balance calculated up to {formatDate(closureDate)}. Transactions after
                    this date will be included in the next cycle.
                  </p>
                </div>
              )}

              {/* Info Banner */}
              <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
                <p className="text-sm font-medium text-info flex items-center gap-2">
                  <Info className="w-4 h-4" /> Cycle Closure
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  This action closes the current cycle without issuing any payment.
                  {cycleData.totalNetPayable < 0
                    ? ' The outstanding balance will be carried forward to the next cycle.'
                    : ' A new cycle will begin after closure.'}
                </p>
              </div>

              {/* Cycle Summary */}
              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-sm font-semibold text-text-primary">Cycle Period</span>
                  <span className="text-sm text-text-secondary">
                    {formatDate(cycleData.cycleStart)} - {formatDate(cycleData.cycleEnd)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      Days Worked ({cycleData.totalDays})
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(cycleData.basePay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      OT Units ({cycleData.totalOtUnits})
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(cycleData.otPay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="font-medium text-text-primary">Gross Pay</span>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(cycleData.grossPay)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Advances</span>
                    <span className="font-medium text-warning">
                      -{formatCurrency(cycleData.totalAdvance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Expenses</span>
                    <span className="font-medium text-warning">
                      -{formatCurrency(cycleData.totalExpense)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t-2 border-border-hover">
                  <span className="text-base font-bold text-text-primary">Net Balance</span>
                  <span
                    className={`text-xl font-bold ${cycleData.totalNetPayable >= 0 ? 'text-success' : 'text-error'}`}
                  >
                    {cycleData.totalNetPayable < 0 ? '-' : ''}
                    {formatCurrency(Math.abs(cycleData.totalNetPayable))}
                  </span>
                </div>

                {cycleData.totalNetPayable < 0 && (
                  <p className="text-xs text-warning flex items-center justify-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Worker owes company — balance will carry forward to next cycle
                  </p>
                )}
              </div>

              {/* Closure Date */}
              <div>
                <label
                  htmlFor={closureDateId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Closure Date <span className="text-error">*</span>
                </label>
                <DatePicker
                  id={closureDateId}
                  value={closureDate}
                  onChange={(date) => handleClosureDateChange(date || today)}
                  minDate={
                    cycleData
                      ? new Date(cycleData.cycleStart).toISOString().split('T')[0]
                      : undefined
                  }
                  maxDate={today}
                  disabled={loading || calculating}
                  placeholder="Select closure date"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {isRetroactive
                    ? '💡 Balance recalculated for this date'
                    : 'Select today or any past date'}
                </p>
              </div>

              {/* Note / Reason */}
              <div>
                <TamilTextarea
                  label="Note / Reason (Optional)"
                  value={note}
                  onValueChange={(val) => setNote(val)}
                  placeholder="e.g., Worker on leave, cycle settlement, balance carry-forward..."
                  rows={3}
                  maxLength={VALIDATION.textField.maxLength}
                  disabled={loading}
                />
                {note.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1 text-right">
                    {note.length}/{VALIDATION.textField.maxLength}
                  </p>
                )}
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Signature (Optional)
                </label>

                {signatureData ? (
                  <div className="border-2 border-border rounded-lg p-3 bg-surface">
                    <img
                      src={signatureData}
                      alt="Worker signature"
                      className="h-16 mx-auto mb-2"
                    />
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
                        disabled={loading}
                      >
                        Re-sign
                      </button>
                      <span className="text-xs text-text-secondary">•</span>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-xs text-error hover:text-error-hover transition-colors font-medium"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(true)}
                    disabled={loading}
                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm font-medium">Click to add signature</span>
                  </button>
                )}
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
                  disabled={loading || calculating}
                  className="flex-1"
                >
                  {loading ? 'Closing Balance...' : 'Close Balance'}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      </div>
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
