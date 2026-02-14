/** biome-ignore-all lint/a11y/noStaticElementInteractions: <it should be like this> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <it should be like this> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <it should be like this> */
import { X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { useSalaryPdfGenerator } from '../../features/pdf-export/hooks/useSalaryPdfGenerator';
import { salariesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';
import { VALIDATION } from '../../utils/validation';
import { SignatureModal } from '../signature/SignatureModal';
import type { SignatureData } from '../signature/signature.types';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

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
  carryForward: number;
  totalNetPayable: number;
}

interface PendingPartialSalary {
  id: number;
  cycleStart: string;
  cycleEnd: string;
  netPay: number;
  totalPaid: number;
}

interface SalaryFormData {
  paymentAmount: string;
  paymentDate: string;
  paymentProof: string;
}

export default function PaySalaryModal({
  workerId,
  workerName,
  isOpen,
  onClose,
  onSuccess,
}: PaySalaryModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const paymentAmountId = useId();
  const paymentDateId = useId();
  const paymentProofId = useId();
  const modalTitleId = useId();

  const { markSalaryAsPaid } = useSalaryLockStore();
  const { generateAndDownload } = useSalaryPdfGenerator();

  const [formData, setFormData] = useState<SalaryFormData>({
    paymentAmount: '',
    paymentDate: today,
    paymentProof: '',
  });
  const [salaryData, setSalaryData] = useState<SalaryCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined);

  const [pendingPartials, setPendingPartials] = useState<PendingPartialSalary[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      fetchSalaryCalculation();
      fetchPendingPartials();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, workerId]);

  const fetchPendingPartials = async () => {
    try {
      const response = await salariesAPI.getPendingPartials(workerId);
      setPendingPartials(response.data);
    } catch (err) {
      console.error('Failed to fetch pending partials', err);
    }
  };

  useEffect(() => {
    if (salaryData && !isPartialPayment) {
      setFormData((prev) => ({
        ...prev,
        paymentAmount: salaryData.totalNetPayable > 0 ? salaryData.totalNetPayable.toString() : '0',
      }));
    }
  }, [salaryData, isPartialPayment]);

  const fetchSalaryCalculation = async (payDate?: string): Promise<void> => {
    setCalculating(true);
    setError(null);

    try {
      console.log('🔍 Fetching calculation with payDate:', payDate);
      const calcResponse = await salariesAPI.calculate(workerId, payDate);
      setSalaryData(calcResponse.data);
      console.log('Salary calculated:', {
        payDate: payDate || 'today',
        data: calcResponse.data,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to calculate salary';

      setError(errorMessage || 'Failed to calculate salary');
      setSalaryData(null);
    } finally {
      setCalculating(false);
    }
  };

  const handlePaymentDateChange = async (newDate: string): Promise<void> => {
    console.log('🔍 Payment date changed to:', newDate);
    setFormData((prev) => ({ ...prev, paymentDate: newDate }));

    if (newDate) {
      console.log('🔍 Calling API with payDate:', newDate);
      await fetchSalaryCalculation(newDate);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!salaryData) {
      setError('No salary data available');
      return;
    }

    const paymentAmount = Number.parseFloat(formData.paymentAmount);

    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const maxAmount = salaryData.totalNetPayable;

    if (paymentAmount > maxAmount) {
      setError(
        `Payment amount cannot exceed payable amount: ₹${maxAmount.toLocaleString('en-IN')}`,
      );
      return;
    }

    setLoading(true);

    try {
      let remainingToPay = paymentAmount;

      // 1. Pay Carry Forward (Oldest First)
      if (pendingPartials.length > 0) {
        for (const salary of pendingPartials) {
          if (remainingToPay <= 0) break;

          const unpaidBalance = salary.netPay - salary.totalPaid;
          const payAmount = Math.min(remainingToPay, unpaidBalance);

          if (payAmount > 0) {
            console.log(`Paying ₹${payAmount} to carry-forward salary #${salary.id}`);
            await salariesAPI.issue(salary.id, {
              amount: payAmount,
              paymentProof: formData.paymentProof || undefined,
              signature: signatureData,
            });

            // Update lock state
            markSalaryAsPaid(workerId, salary.id, salary.cycleStart, salary.cycleEnd);
            remainingToPay -= payAmount;
          }
        }
      }

      // 2. Pay New Cycle (if money left)
      if (remainingToPay > 0 && salaryData) {
        console.log('Paying remaining ₹' + remainingToPay + ' to current cycle');
        // Create new salary record
        const createResponse = await salariesAPI.create(workerId, formData.paymentDate);
        const salary = createResponse.data;

        await salariesAPI.issue(salary.id, {
          amount: remainingToPay,
          paymentProof: formData.paymentProof || undefined,
          signature: signatureData,
        });

        markSalaryAsPaid(workerId, salary.id, salary.cycleStart, salary.cycleEnd);

        // Auto-generate and download PDF before closing
        try {
          await generateAndDownload(salary.id, signatureData);
        } catch (pdfErr) {
          console.error('❌ Failed to auto-download salary PDF:', pdfErr);
        }
      }

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
          paymentAmount: '',
          paymentDate: today,
          paymentProof: '',
        });
        setSalaryData(null);
        setError(null);
        setIsPartialPayment(false);
        setSignatureData(undefined);
        onClose();
      }, 200);
    }
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const handleCloseSignatureModal = () => {
    setIsSignatureModalOpen(false);
  };

  const handleSaveSignature = (data: SignatureData) => {
    setSignatureData(data.dataUrl);
    console.log('✅ Signature captured for salary payment');
  };

  const handleClearSignature = () => {
    setSignatureData(undefined);
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

  const handlePaymentTypeChange = (partial: boolean): void => {
    setIsPartialPayment(partial);
    if (!partial && salaryData) {
      setFormData((prev) => ({
        ...prev,
        paymentAmount: salaryData.totalNetPayable > 0 ? salaryData.totalNetPayable.toString() : '0',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        paymentAmount: '',
      }));
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

  const isRetroactive = formData.paymentDate !== today;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
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
              className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {calculating ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-text-secondary mt-3">
                {isRetroactive ? 'Recalculating for selected date...' : 'Calculating salary...'}
              </p>
            </div>
          ) : salaryData ? (
            <>
              {isRetroactive && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-warning flex items-center gap-2">
                    ⚠️ Retroactive Payment
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Salary calculated up to {formatDate(formData.paymentDate)}. Transactions after
                    this date will be included in the next cycle.
                  </p>
                </div>
              )}

              <div className="bg-background rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                  <span className="text-sm font-semibold text-text-primary">Salary Cycle</span>
                  <span className="text-sm text-text-secondary">
                    {formatDate(salaryData.cycleStart)} - {formatDate(salaryData.cycleEnd)}
                  </span>
                </div>

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

                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-400">
                  <span className="text-base font-bold text-text-primary">Net Payable</span>
                  <span
                    className={`text-xl font-bold ${salaryData.totalNetPayable >= 0 ? 'text-success' : 'text-error'}`}
                  >
                    {formatCurrency(Math.abs(salaryData.totalNetPayable))}
                  </span>
                </div>
                {salaryData.carryForward > 0 && (
                  <div className="text-xs space-y-1 bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Current Cycle:</span>
                      <span className="font-medium">{formatCurrency(salaryData.netPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning font-medium">Carry Forward (Unpaid):</span>
                      <span className="font-medium text-warning">
                        {formatCurrency(salaryData.carryForward)}
                      </span>
                    </div>
                  </div>
                )}
                {salaryData.totalNetPayable < 0 && (
                  <p className="text-xs text-error text-center">
                    ⚠️ Worker owes company - no payment required
                  </p>
                )}
              </div>

              {salaryData.totalNetPayable > 0 && (
                <>
                  <div>
                    <label
                      htmlFor={paymentDateId}
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Payment Date <span className="text-error">*</span>
                    </label>
                    <DatePicker
                      id={paymentDateId}
                      value={formData.paymentDate}
                      onChange={(date) => handlePaymentDateChange(date || today)}
                      minDate={
                        salaryData
                          ? new Date(salaryData.cycleStart).toISOString().split('T')[0]
                          : undefined
                      }
                      maxDate={today}
                      disabled={loading || calculating}
                      placeholder="Select payment date"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {isRetroactive
                        ? '💡 Salary recalculated for this date'
                        : 'Select today or any past date'}
                    </p>
                  </div>

                  {salaryData.carryForward > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-700 mb-4 flex items-center gap-2">
                      <span className="font-semibold">Note:</span>
                      Payments will clear carry-forward balances first.
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Payment Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handlePaymentTypeChange(false)}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          !isPartialPayment
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-background text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        Full Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentTypeChange(true)}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          isPartialPayment
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-background text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        Partial Payment
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={paymentAmountId}
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Payment Amount <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                        ₹
                      </span>
                      <input
                        type="number"
                        id={paymentAmountId}
                        value={formData.paymentAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentAmount: e.target.value })
                        }
                        placeholder="Enter amount"
                        min="0"
                        max={salaryData.totalNetPayable}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                        disabled={loading || !isPartialPayment}
                      />
                    </div>
                    {isPartialPayment && (
                      <p className="text-xs text-text-secondary mt-1">
                        Maximum: {formatCurrency(salaryData.totalNetPayable)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={paymentProofId}
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Payment Reference / Note
                    </label>
                    <textarea
                      id={paymentProofId}
                      value={formData.paymentProof}
                      onChange={(e) => setFormData({ ...formData, paymentProof: e.target.value })}
                      placeholder="e.g., UPI Ref: 123456789, Cash, Cheque #1234..."
                      rows={3}
                      maxLength={VALIDATION.textField.maxLength}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                      disabled={loading}
                    />
                    {formData.paymentProof.length > 0 && (
                      <p className="text-xs text-text-secondary mt-1 text-right">
                        {formData.paymentProof.length}/{VALIDATION.textField.maxLength}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Signature (Optional)
                    </label>

                    {signatureData ? (
                      <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                        <img
                          src={signatureData}
                          alt="Worker signature"
                          className="h-16 mx-auto mb-2"
                        />
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={handleOpenSignatureModal}
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
                        onClick={handleOpenSignatureModal}
                        disabled={loading}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-sm font-medium">Click to add signature</span>
                      </button>
                    )}
                  </div>
                </>
              )}

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
                {salaryData.totalNetPayable > 0 ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={loading || calculating}
                    className="flex-1"
                  >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </form>
      </div>
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={handleCloseSignatureModal}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
