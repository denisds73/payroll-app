import { AlertCircle, Calendar, Phone, Trash2, Wallet } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workersAPI } from '../../services/api';
import ConfirmModal from '../modals/ConfirmModal';
import Button from '../ui/Button';

interface ProfileTabProps {
  worker: {
    id: number;
    name: string;
    phone: string | null;
    wage: number;
    otRate: number;
    isActive: boolean;
    joinedAt: string;
  };
  onUpdate: () => void;
}

interface WorkerFormData {
  name: string;
  phone: string;
  wage: string;
  otRate: string;
  wageEffectiveDate: string;
  otRateEffectiveDate: string;
  isActive: boolean;
}

export default function ProfileTab({ worker, onUpdate }: ProfileTabProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const nameId = useId();
  const phoneId = useId();
  const wageId = useId();
  const otRateId = useId();
  const wageEffectiveDateId = useId();
  const otRateEffectiveDateId = useId();
  const isActiveId = useId();

  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    phone: '',
    wage: '',
    otRate: '',
    wageEffectiveDate: today,
    otRateEffectiveDate: today,
    isActive: true,
  });
  const [originalWage, setOriginalWage] = useState<number>(0);
  const [originalOtRate, setOriginalOtRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<'values' | 'effectiveDate'>('values');
  const [warningVisible, setWarningVisible] = useState(false);

  useEffect(() => {
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      wage: worker.wage.toString(),
      otRate: worker.otRate.toString(),
      wageEffectiveDate: today,
      otRateEffectiveDate: today,
      isActive: worker.isActive,
    });
    setOriginalWage(worker.wage);
    setOriginalOtRate(worker.otRate);
  }, [worker, today]);

  const wageChanged = Number(formData.wage) !== originalWage;
  const otRateChanged = Number(formData.otRate) !== originalOtRate;

  const showWarning =
    (editMode === 'values' && (wageChanged || otRateChanged)) || editMode === 'effectiveDate';

  useEffect(() => {
    setWarningVisible(showWarning);
  }, [showWarning]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.wage || Number(formData.wage) <= 0) {
      setError('Please enter a valid wage');
      return;
    }

    if (!formData.otRate || Number(formData.otRate) < 0) {
      setError('Please enter a valid OT rate');
      return;
    }

    setLoading(true);

    try {
      if (editMode === 'effectiveDate') {
        // Only update effective dates (send current wage/OT rate)
        await workersAPI.update(worker.id, {
          wage: Number(formData.wage),
          otRate: Number(formData.otRate),
        });
      } else {
        // Normal update (values)
        await workersAPI.update(worker.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          wage: Number(formData.wage),
          otRate: Number(formData.otRate),
          isActive: formData.isActive,
        });
      }

      setSuccess(true);
      setOriginalWage(Number(formData.wage));
      setOriginalOtRate(Number(formData.otRate));
      setEditMode('values'); // Reset to values mode after save
      onUpdate();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update worker';

      setError(errorMessage || 'Failed to update worker');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleteLoading(true);

    try {
      await workersAPI.delete(worker.id);
      navigate('/workers');
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to delete worker';

      alert(errorMessage || 'Failed to delete worker');
      setDeleteModalOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Worker Profile</h3>
          <Button
            variant="dangerLight"
            size="md"
            onClick={() => setDeleteModalOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
            iconPosition="left"
          >
            Delete Worker
          </Button>
        </div>

        {/* Joined Date Info */}
        <div className="bg-background rounded-lg p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-text-secondary" />
          <div>
            <p className="text-xs text-text-secondary">Joined On</p>
            <p className="text-sm font-medium text-text-primary">{formatDate(worker.joinedAt)}</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm mb-4">
            Worker profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm mb-4 animate-shake"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-card border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-semibold text-text-primary mb-4">Basic Information</h4>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor={nameId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id={nameId}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor={phoneId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="tel"
                    id={phoneId}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label
                    htmlFor={isActiveId}
                    className="text-sm font-medium text-text-primary block mb-1"
                  >
                    Worker Status
                  </label>
                  <p className="text-xs text-text-secondary">
                    {formData.isActive
                      ? 'Worker is currently active'
                      : 'Worker is currently inactive'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-success' : 'bg-gray-300'
                  }`}
                  disabled={loading}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Wage & OT Rate Section */}
          <div className="bg-card border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-text-primary">Wage & Overtime</h4>

              {/* Toggle Edit Mode */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode('values')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    editMode === 'values'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  Edit Values
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode('effectiveDate')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    editMode === 'effectiveDate'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  Change Effective Date
                </button>
              </div>
            </div>

            {/* Warning for wage/OT changes */}

            <div className="grid grid-cols-2 gap-6">
              {/* Daily Wage */}
              <div>
                <label
                  htmlFor={wageId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Daily Wage <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="number"
                    id={wageId}
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    placeholder="0"
                    min="1"
                    step="1"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      editMode === 'values' && wageChanged ? 'border-warning' : 'border-gray-300'
                    }`}
                    required
                    disabled={loading || editMode === 'effectiveDate'}
                  />
                </div>

                {editMode === 'values' && wageChanged && (
                  <div className="mt-2">
                    <label
                      htmlFor={wageEffectiveDateId}
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      Effective From
                    </label>
                    <input
                      type="date"
                      id={wageEffectiveDateId}
                      value={formData.wageEffectiveDate}
                      max={today}
                      onChange={(e) =>
                        setFormData({ ...formData, wageEffectiveDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {editMode === 'effectiveDate' && (
                  <div className="mt-2">
                    <label
                      htmlFor={wageEffectiveDateId}
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      Change Effective Date
                    </label>
                    <input
                      type="date"
                      id={wageEffectiveDateId}
                      value={formData.wageEffectiveDate}
                      max={today}
                      onChange={(e) =>
                        setFormData({ ...formData, wageEffectiveDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-warning rounded-lg focus:outline-none focus:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {/* OT Rate */}
              <div>
                <label
                  htmlFor={otRateId}
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  OT Rate <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    id={otRateId}
                    value={formData.otRate}
                    onChange={(e) => setFormData({ ...formData, otRate: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:border-primary ${
                      editMode === 'values' && otRateChanged ? 'border-warning' : 'border-gray-300'
                    }`}
                    required
                    disabled={loading || editMode === 'effectiveDate'}
                  />
                </div>

                {editMode === 'values' && otRateChanged && (
                  <div className="mt-2">
                    <label
                      htmlFor={otRateEffectiveDateId}
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      Effective From
                    </label>
                    <input
                      type="date"
                      id={otRateEffectiveDateId}
                      value={formData.otRateEffectiveDate}
                      max={today}
                      onChange={(e) =>
                        setFormData({ ...formData, otRateEffectiveDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {editMode === 'effectiveDate' && (
                  <div className="mt-2">
                    <label
                      htmlFor={otRateEffectiveDateId}
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      Change Effective Date
                    </label>
                    <input
                      type="date"
                      id={otRateEffectiveDateId}
                      value={formData.otRateEffectiveDate}
                      max={today}
                      onChange={(e) =>
                        setFormData({ ...formData, otRateEffectiveDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-warning rounded-lg focus:outline-none focus:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            </div>
            {((editMode === 'values' && (wageChanged || otRateChanged)) ||
              editMode === 'effectiveDate') && (
              <div
                className={`bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3 mt-6 transition-all duration-300 ease-in-out ${
                  warningVisible
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
                aria-hidden={!warningVisible}
              >
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning mb-1">
                    {editMode === 'values' ? 'Wage Change Detected' : 'Change Effective Date'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {editMode === 'values'
                      ? 'Attendance marked from the effective date onwards will use the new rates for salary calculation. Previous attendance records will retain their original rates.'
                      : 'Only change the effective date if you made a mistake. This will recalculate all attendance from the new date with the current wage/OT rate values.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setFormData({
                  name: worker.name,
                  phone: worker.phone || '',
                  wage: worker.wage.toString(),
                  otRate: worker.otRate.toString(),
                  wageEffectiveDate: today,
                  otRateEffectiveDate: today,
                  isActive: worker.isActive,
                });
                setEditMode('values');
                setError(null);
                setSuccess(false);
              }}
              disabled={loading}
              className="flex-1"
            >
              Reset
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Worker?"
        message={`Are you sure you want to delete ${worker.name}? This will permanently delete all their attendance, advances, expenses, and salary records. This action cannot be undone.`}
        confirmText={deleteLoading ? 'Deleting...' : 'Delete Worker'}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
