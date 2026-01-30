/** biome-ignore-all lint/a11y/noStaticElementInteractions: <modal handling> */
import { User, X } from 'lucide-react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { workersAPI } from '../../services/api';
import { useWorkerStore } from '../../store/workerStore';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import Input from '../ui/Input';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkerFormData {
  name: string;
  phone: string;
  wage: string;
  otRate: string;
  joinedAt: string;
}

export default function AddWorkerModal({ isOpen, onClose }: AddWorkerModalProps) {
  const navigate = useNavigate();
  const { fetchWorkers } = useWorkerStore();
  const today = new Date().toISOString().split('T')[0];

  const modalTitleId = useId();
  const nameId = useId();
  const phoneId = useId();
  const wageId = useId();
  const otRateId = useId();

  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    phone: '',
    wage: '',
    otRate: '',
    joinedAt: today,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      setFormData({
        name: '',
        phone: '',
        wage: '',
        otRate: '',
        joinedAt: today,
      });
      setError(null);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, today]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const wageNum = Number.parseInt(formData.wage, 10);
    if (!formData.wage || Number.isNaN(wageNum) || wageNum <= 0) {
      setError('Please enter a valid daily wage greater than 0');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10 digits');
      return;
    }

    let otRateNum: number | undefined;
    if (formData.otRate) {
      otRateNum = Number.parseFloat(formData.otRate);
      if (Number.isNaN(otRateNum) || otRateNum < 0) {
        setError('Please enter a valid OT rate');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: {
        name: string;
        wage: number;
        phone?: string;
        otRate?: number;
        joinedAt?: string;
      } = {
        name: formData.name.trim(),
        wage: wageNum,
      };

      if (formData.phone) {
        payload.phone = formData.phone.replace(/\D/g, '');
      }

      if (otRateNum !== undefined && otRateNum > 0) {
        payload.otRate = otRateNum;
      }

      if (formData.joinedAt) {
        payload.joinedAt = formData.joinedAt;
      }

      const response = await workersAPI.create(payload);
      const newWorkerId = response.data.id;

      fetchWorkers();

      toast.success(`${formData.name.trim()} added successfully!`);
      handleClose();

      navigate(`/workers/${newWorkerId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to add worker';

      setError(errorMessage || 'Failed to add worker');
      toast.error(errorMessage || 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!loading) {
      setIsAnimating(false);
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          wage: '',
          otRate: '',
          joinedAt: today,
        });
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
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id={modalTitleId} className="text-lg font-semibold text-text-primary">
                Add New Worker
              </h2>
              <p className="text-sm text-text-secondary">Enter worker details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg animate-shake">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Name <span className="text-error">*</span>
              </label>
              <Input
                id={nameId}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter worker name"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor={phoneId}
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Phone
              </label>
              <Input
                id={phoneId}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit phone number"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={wageId}
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Daily Wage <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    ₹
                  </span>
                  <input
                    id={wageId}
                    type="number"
                    min="1"
                    step="1"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    placeholder="500"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={otRateId}
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  OT Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    ₹
                  </span>
                  <input
                    id={otRateId}
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.otRate}
                    onChange={(e) => setFormData({ ...formData, otRate: e.target.value })}
                    placeholder="100"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <DatePicker
                label="Joined Date"
                value={formData.joinedAt || null}
                onChange={(date) => setFormData({ ...formData, joinedAt: date || '' })}
                maxDate={today}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              {loading ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
