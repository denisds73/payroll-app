/** biome-ignore-all lint/a11y/noStaticElementInteractions: Modal requires click handlers on backdrop */
import { AlertCircle, CheckCircle, X, XCircle } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { workersAPI } from '../../services/api';
import { useWorkerStatusStore } from '../../store/useWorkerStatusStore';
import { getLocalToday } from '../../utils/dateUtils';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

interface WorkerStatusModalProps {
  workerId: number;
  workerName: string;
  mode: 'disable' | 'activate' | 'cancel-scheduled';
  inactiveFrom?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkerStatusModal({
  workerId,
  workerName,
  mode,
  inactiveFrom,
  isOpen,
  onClose,
  onSuccess,
}: WorkerStatusModalProps) {
  const today = getLocalToday();
  const dateId = useId();
  const modalTitleId = useId();

  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  const fetchBlockedDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      const response = await workersAPI.getBlockedDates(workerId);
      setBlockedDates(response.data.blockedDates);
      console.log('📅 Blocked dates loaded:', response.data.blockedDates);
    } catch (err) {
      console.error('Failed to load blocked dates:', err);
    } finally {
      setLoadingDates(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (isOpen && mode === 'disable') {
      fetchBlockedDates();
    }
  }, [isOpen, mode, fetchBlockedDates]);

  useEffect(() => {
    if (mode === 'activate' && inactiveFrom) {
      setEffectiveFrom(inactiveFrom.split('T')[0]);
    } else {
      setEffectiveFrom(today);
    }
  }, [today, mode, inactiveFrom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const markWorkerStatusChanged = useWorkerStatusStore((state) => state.markWorkerStatusChanged);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    console.log(`🚀 ${mode === 'disable' ? 'Disabling' : 'Activating'} worker:`, {
      workerId,
      effectiveFrom,
    });

    try {
      if (mode === 'disable') {
        await workersAPI.disable(workerId, effectiveFrom);
      } else {
        await workersAPI.activate(workerId, effectiveFrom);
      }

      markWorkerStatusChanged(workerId);

      console.log(`✅ 1. Backend ${mode} successful`);
      onSuccess();
      console.log('✅ 2. Called onSuccess()');
      handleClose();
      console.log('✅ 3. Called handleClose()');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      const errorMessage = error?.response?.data?.message || `Failed to ${mode} worker`;
      toast.error(errorMessage);
      console.error(`❌ ${mode} error:`, {
        message: error?.response?.data?.message,
        status: error?.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsAnimating(false);

      setTimeout(() => {
        setEffectiveFrom(today);
        setBlockedDates([]);
        onClose();
      }, 200);
    }
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleBackdropKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleDateChange = (dateStr: string | null) => {
    if (dateStr) {
      setEffectiveFrom(dateStr);

    }
  };

  if (!isOpen) return null;

  const isDisableMode = mode === 'disable';
  const isCancelScheduledMode = mode === 'cancel-scheduled';
  const isActivateMode = mode === 'activate';

  // Determine modal appearance based on mode
  let title: string;
  let Icon: typeof XCircle;
  let iconColor: string;
  let buttonVariant: 'danger' | 'primary' | 'secondary';
  let buttonText: string;
  let loadingText: string;

  if (isDisableMode) {
    title = 'Disable Worker';
    Icon = XCircle;
    iconColor = 'text-error';
    buttonVariant = 'danger';
    buttonText = 'Disable Worker';
    loadingText = 'Disabling...';
  } else if (isCancelScheduledMode) {
    title = 'Cancel Scheduled Inactivation';
    Icon = CheckCircle;
    iconColor = 'text-warning';
    buttonVariant = 'primary';
    buttonText = 'Cancel Inactivation';
    loadingText = 'Cancelling...';
  } else {
    title = 'Activate Worker';
    Icon = CheckCircle;
    iconColor = 'text-success';
    buttonVariant = 'primary';
    buttonText = 'Activate Worker';
    loadingText = 'Activating...';
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className={`bg-card rounded-lg shadow-xl max-w-lg w-full transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${iconColor}`} />
            <div>
              <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
                {title}
              </h2>
              <p className="text-sm text-text-secondary mt-1">{workerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-background"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {isDisableMode ? (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm text-text-primary">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Mark the worker as inactive from the selected date</li>
                  <li>Prevent creating attendance/expenses during inactive period</li>
                  <li>Lock existing records during inactive period</li>
                </ul>
              </div>
            </div>
          ) : isCancelScheduledMode ? (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm text-text-primary">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Cancel the scheduled inactivation</li>
                  <li>Keep the worker as active</li>
                  <li>Allow creating attendance/expenses for all dates</li>
                </ul>
                {inactiveFrom && (
                  <p className="mt-2 text-text-secondary">
                    Scheduled inactivation date:{' '}
                    <span className="font-medium text-text-primary">
                      {new Date(inactiveFrom).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm text-text-primary">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  <li>Mark the worker as active from the selected date</li>
                  <li>Allow creating attendance/expenses from this date onwards</li>
                  <li>Unlock records from this date forward</li>
                </ul>
              </div>
            </div>
          )}

          {/* Only show date picker for disable and activate modes, not for cancel-scheduled */}
          {!isCancelScheduledMode && (
            <div>
              <label htmlFor={dateId} className="block text-sm font-medium text-text-primary mb-2">
                Effective From Date <span className="text-error">*</span>
              </label>

              <DatePicker
                value={effectiveFrom}
                onChange={handleDateChange}
                excludeDates={isDisableMode ? blockedDates : []}
                minDate={isActivateMode && inactiveFrom ? inactiveFrom.split('T')[0] : undefined}
                disabled={loading || loadingDates}
                loading={loadingDates && isDisableMode}
                placeholder="Select date"
                id={dateId}
              />

              <div className="mt-2 space-y-1">
                <p className="text-xs text-text-secondary">
                  {isDisableMode
                    ? 'Worker will be inactive from this date onwards.'
                    : 'Worker will be active from this date onwards.'}
                </p>
                {isDisableMode && blockedDates.length > 0 && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Dates with attendance, expenses, or paid salaries are grayed out
                  </p>
                )}
              </div>
            </div>
          )}



          <div className="flex gap-3">
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
              variant={buttonVariant}
              size="md"
              disabled={loading || loadingDates}
              className="flex-1"
            >
              {loading ? loadingText : buttonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
