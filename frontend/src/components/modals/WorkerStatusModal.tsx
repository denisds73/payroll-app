/** biome-ignore-all lint/a11y/noStaticElementInteractions: Modal requires click handlers on backdrop */
import { AlertCircle, Calendar, CheckCircle, X, XCircle } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePickerStyles.css';
import { workersAPI } from '../../services/api';
import { useWorkerStatusStore } from '../../store/useWorkerStatusStore';
import Button from '../ui/Button';

interface WorkerStatusModalProps {
  workerId: number;
  workerName: string;
  mode: 'disable' | 'activate';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkerStatusModal({
  workerId,
  workerName,
  mode,
  isOpen,
  onClose,
  onSuccess,
}: WorkerStatusModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const dateId = useId();
  const modalTitleId = useId();

  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setEffectiveFrom(today);
  }, [today]);

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
    setError(null);
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
      setError(errorMessage);
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
        setError(null);
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

  const blockedDateObjects = blockedDates.map((dateStr) => new Date(`${dateStr}T00:00:00`));

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setEffectiveFrom(dateStr);
      setError(null);
    }
  };

  if (!isOpen) return null;

  const isDisableMode = mode === 'disable';
  const title = isDisableMode ? 'Disable Worker' : 'Activate Worker';
  const Icon = isDisableMode ? XCircle : CheckCircle;
  const iconColor = isDisableMode ? 'text-error' : 'text-success';
  const buttonVariant = isDisableMode ? 'danger' : 'primary';
  const buttonText = isDisableMode ? 'Disable Worker' : 'Activate Worker';
  const loadingText = isDisableMode ? 'Disabling...' : 'Activating...';

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          <div>
            <label htmlFor={dateId} className="block text-sm font-medium text-text-primary mb-2">
              Effective From Date <span className="text-error">*</span>
            </label>

            {loadingDates && isDisableMode && (
              <div className="mb-2 text-xs text-text-secondary flex items-center gap-2">
                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b border-primary" />
                Loading available dates...
              </div>
            )}

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary z-10 pointer-events-none" />
              <DatePicker
                selected={new Date(`${effectiveFrom}T00:00:00`)}
                onChange={handleDateChange}
                excludeDates={isDisableMode ? blockedDateObjects : []}
                dateFormat="yyyy-MM-dd"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || loadingDates}
                placeholderText="Select date"
                showPopperArrow={false}
                popperPlacement="bottom-start"
              />
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-xs text-text-secondary">
                {isDisableMode
                  ? 'Worker will be inactive from this date onwards.'
                  : 'Worker will be active from this date onwards.'}
              </p>
              {isDisableMode && blockedDates.length > 0 && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Dates with attendance/expense are grayed out and cannot be selected
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
              {error}
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
