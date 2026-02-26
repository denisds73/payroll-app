/** biome-ignore-all lint/a11y/noStaticElementInteractions: <> */
import { format } from 'date-fns';
import { AlertCircle, Search, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { generateAndDownloadPdf } from '../../features/pdf-export/services/pdfService';
import { buildAdvanceReceiptPdf } from '../../features/pdf-export/utils/advancePdfBuilder';
import { fetchAdvanceReportData } from '../../features/pdf-export/utils/pdfData';
import { advancesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';
import { useWorkerStore } from '../../store/workerStore';
import { getLocalToday } from '../../utils/dateUtils';
import { VALIDATION } from '../../utils/validation';
import AdvancePdfExportButton from '../export/AdvancePdfExportButton';
import { SignatureModal } from '../signature/SignatureModal';
import type { SignatureData } from '../signature/signature.types';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

interface IssueAdvanceModalProps {
  workerId?: number;
  workerName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AdvanceFormData {
  workerId?: number;
  date: string;
  amount: string;
  reason: string;
  signatureData?: string;
}

export default function IssueAdvanceModal({
  workerId: initialWorkerId,
  workerName: initialWorkerName,
  isOpen,
  onClose,
  onSuccess,
}: IssueAdvanceModalProps) {
  const today = getLocalToday();
  const dateId = useId();
  const amountId = useId();
  const reasonId = useId();
  const workerSearchId = useId();
  const modalTitleId = useId();

  const { workers, fetchWorkers } = useWorkerStore();
  const activeWorkers = useMemo(() => workers.filter((w) => w.isActive), [workers]);

  const { fetchPaidPeriods, isDateLocked, loading: lockLoading } = useSalaryLockStore();

  const [formData, setFormData] = useState<AdvanceFormData>({
    workerId: initialWorkerId,
    date: today,
    amount: '',
    reason: '',
    signatureData: undefined,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [pdfAdvanceId, setPdfAdvanceId] = useState<number | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      if (workers.length === 0) {
        fetchWorkers();
      }
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, workers.length, fetchWorkers]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        workerId: initialWorkerId,
        date: today,
        amount: '',
        reason: '',
        signatureData: undefined,
      });
      setSearchQuery('');
    }
  }, [isOpen, initialWorkerId, today]);

  useEffect(() => {
    const currentWorkerId = initialWorkerId || formData.workerId;

    if (isOpen && currentWorkerId) {
      fetchPaidPeriods(currentWorkerId);
    }
  }, [isOpen, initialWorkerId, formData.workerId, fetchPaidPeriods]);

  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return activeWorkers;
    const query = searchQuery.toLowerCase();
    return activeWorkers.filter((w) => w.name.toLowerCase().includes(query));
  }, [activeWorkers, searchQuery]);

  const selectedWorkerName = useMemo(() => {
    if (initialWorkerName) return initialWorkerName;
    if (formData.workerId) {
      return workers.find((w) => w.id === formData.workerId)?.name || 'Unknown Worker';
    }
    return '';
  }, [initialWorkerName, formData.workerId, workers]);

  const isAdvanceDateDisabled = useCallback(
    (date: Date): boolean => {
      if (!formData.workerId) {
        return true;
      }

      const dateString = format(date, 'yyyy-MM-dd');

      return isDateLocked(formData.workerId, dateString, 'advance');
    },
    [formData.workerId, isDateLocked],
  );

  const currentWorkerId = formData.workerId || initialWorkerId;
  const isPaidPeriodsLoading = currentWorkerId ? lockLoading[currentWorkerId] : false;

  const handleOpenSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const handleCloseSignatureModal = () => {
    setIsSignatureModalOpen(false);
  };

  const handleSaveSignature = (signatureData: SignatureData) => {
    setFormData({
      ...formData,
      signatureData: signatureData.dataUrl,
    });
    console.log('✅ Signature captured:', {
      length: signatureData.dataUrl.length,
      capturedAt: signatureData.capturedAt,
    });
  };

  const handleClearSignature = () => {
    setFormData({
      ...formData,
      signatureData: undefined,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();


    if (!formData.workerId) {
      toast.error('Please select a worker');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error(VALIDATION.amount.messageMin);
      return;
    }

    if (Number(formData.amount) > VALIDATION.amount.max) {
      toast.error(VALIDATION.amount.messageMax);
      return;
    }

    if (formData.workerId && isDateLocked(formData.workerId, formData.date, 'advance')) {
      toast.error('Cannot issue advance for this date - salary is already paid for this period');
      return;
    }

    setLoading(true);

    try {
      const response = await advancesAPI.create({
        workerId: formData.workerId,
        date: formData.date,
        amount: Number(formData.amount),
        reason: formData.reason || undefined,
        signature: formData.signatureData,
      });

      const newAdvance = response.data;

      if (formData.signatureData) {
        await generateAdvancePdfWithSignature(newAdvance, formData.signatureData);
      } else {
        setPdfAdvanceId(newAdvance.id);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to issue advance';

      toast.error(errorMessage || 'Failed to issue advance');
    } finally {
      setLoading(false);
    }
  };

  const generateAdvancePdfWithSignature = async (
    advance: any,
    signatureDataUrl: string,
  ): Promise<void> => {
    try {
      const reportData = await fetchAdvanceReportData(advance.id);
      const docDefinition = buildAdvanceReceiptPdf(reportData, signatureDataUrl);
      const cleanName = reportData.worker.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const date = new Date(reportData.advance.date);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-IN', { month: 'short' });
      const year = date.getFullYear();
      const fileName = `Advance_Receipt_${cleanName}_${day}-${month}-${year}`;
      await generateAndDownloadPdf(docDefinition, fileName);
    } catch (error) {
      console.error('Failed to generate PDF with signature:', error);
      throw error;
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
              Issue Advance
            </h2>
            {initialWorkerName && (
              <p className="text-sm text-text-secondary mt-1">{initialWorkerName}</p>
            )}
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


          {!initialWorkerId && (
            <div className="relative">
              <label
                htmlFor={workerSearchId}
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Worker <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id={workerSearchId}
                  type="text"
                  placeholder="Search and select worker..."
                  value={formData.workerId ? selectedWorkerName : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (formData.workerId) {
                      setFormData({ ...formData, workerId: undefined });
                    }
                    setShowWorkerDropdown(true);
                  }}
                  onFocus={() => setShowWorkerDropdown(true)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  autoComplete="off"
                />
              </div>

              {showWorkerDropdown && (
                <div className="absolute z-60 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredWorkers.length === 0 ? (
                    <div className="p-3 text-sm text-text-secondary text-center">
                      No workers found
                    </div>
                  ) : (
                    filteredWorkers.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, workerId: w.id });
                          setSearchQuery(w.name);
                          setShowWorkerDropdown(false);
                        }}
                      >
                        {w.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor={dateId} className="block text-sm font-medium text-text-primary mb-2">
              Date <span className="text-error">*</span>
            </label>
            <DatePicker
              id={dateId}
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date: date || today })}
              maxDate={today}
              disabled={loading || isPaidPeriodsLoading}
              placeholder="Select date"
              isDateDisabled={isAdvanceDateDisabled}
            />
          </div>
          <p className="text-xs text-warning flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Dates in paid salary periods or in the future are disabled
          </p>

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
            <label htmlFor={reasonId} className="block text-sm font-medium text-text-primary mb-2">
              Reason (Optional)
            </label>
            <textarea
              id={reasonId}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Add a note about this advance..."
              rows={3}
              maxLength={VALIDATION.textField.maxLength}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary resize-none"
              disabled={loading}
            />
            {formData.reason.length > 0 && (
              <p className="text-xs text-text-secondary mt-1 text-right">
                {formData.reason.length}/{VALIDATION.textField.maxLength}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Signature (Optional)
            </label>

            {formData.signatureData ? (
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                <img
                  src={formData.signatureData}
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
              {loading ? 'Processing...' : 'Issue Advance'}
            </Button>
          </div>
        </form>
      </div>

      {pdfAdvanceId && (
        <AdvancePdfExportButton
          advanceId={pdfAdvanceId}
          workerName={selectedWorkerName}
          variant="auto"
          onSuccess={() => {
            setPdfAdvanceId(null);
          }}
          onError={(error) => {
            console.error('❌ Advance receipt download failed:', error);
            setPdfAdvanceId(null);
          }}
        />
      )}

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={handleCloseSignatureModal}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
