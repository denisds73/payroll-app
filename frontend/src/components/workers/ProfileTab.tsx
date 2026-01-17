/** biome-ignore-all lint/a11y/noLabelWithoutControl: <we need labels without input> */
import { AlertCircle, Calendar, Clock, Edit2, Phone, Trash2, Wallet, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { workersAPI } from '../../services/api';
import ConfirmModal from '../modals/ConfirmModal';
import WorkerStatusModal from '../modals/WorkerStatusModal';
import Button from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

interface ProfileTabProps {
  worker: {
    id: number;
    name: string;
    phone: string | null;
    wage: number;
    otRate: number;
    isActive: boolean;
    inactiveFrom: string | null;
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

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    phone: '',
    wage: '',
    otRate: '',
    wageEffectiveDate: today,
    otRateEffectiveDate: today,
  });
  const [originalWage, setOriginalWage] = useState<number>(0);
  const [originalOtRate, setOriginalOtRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [wageEditMode, setWageEditMode] = useState<'values' | 'effectiveDate'>('values');
  const [statusModalMode, setStatusModalMode] = useState<
    'disable' | 'activate' | 'cancel-scheduled' | null
  >(null);

  useEffect(() => {
    resetForm();
  }, [worker, today]);

  const resetForm = () => {
    setFormData({
      name: worker.name,
      phone: worker.phone || '',
      wage: worker.wage.toString(),
      otRate: worker.otRate.toString(),
      wageEffectiveDate: today,
      otRateEffectiveDate: today,
    });
    setOriginalWage(worker.wage);
    setOriginalOtRate(worker.otRate);
    setWageEditMode('values');
    setError(null);
  };

  const wageChanged = Number(formData.wage) !== originalWage;
  const otRateChanged = Number(formData.otRate) !== originalOtRate;
  const showWageWarning =
    (wageEditMode === 'values' && (wageChanged || otRateChanged)) ||
    wageEditMode === 'effectiveDate';

  const handleEdit = () => {
    setIsEditing(true);
    resetForm();
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

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
      if (wageEditMode === 'effectiveDate') {
        await workersAPI.update(worker.id, {
          wage: Number(formData.wage),
          otRate: Number(formData.otRate),
          wageEffectiveDate: formData.wageEffectiveDate,
          otRateEffectiveDate: formData.otRateEffectiveDate,
        });
      } else {
        const payload: {
          name: string;
          phone?: string;
          wage: number;
          otRate: number;
          wageEffectiveDate?: string;
          otRateEffectiveDate?: string;
        } = {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          wage: Number(formData.wage),
          otRate: Number(formData.otRate),
        };

        // Include effective dates if wage or OT rate changed
        if (Number(formData.wage) !== originalWage) {
          payload.wageEffectiveDate = formData.wageEffectiveDate;
        }
        if (Number(formData.otRate) !== originalOtRate) {
          payload.otRateEffectiveDate = formData.otRateEffectiveDate;
        }

        await workersAPI.update(worker.id, payload);
      }

      setOriginalWage(Number(formData.wage));
      setOriginalOtRate(Number(formData.otRate));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      onUpdate();
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update worker';

      setError(errorMessage || 'Failed to update worker');
      toast.error(errorMessage || 'Failed to update worker');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleteLoading(true);

    try {
      await workersAPI.delete(worker.id);
      toast.success('Worker deleted successfully');
      navigate('/workers');
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to delete worker';

      toast.error(errorMessage || 'Failed to delete worker');
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

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleStatusChangeSuccess = () => {
    let action: string;
    if (statusModalMode === 'disable') {
      action = 'disabled';
    } else if (statusModalMode === 'cancel-scheduled') {
      action = 'scheduled inactivation cancelled';
    } else {
      action = 'activated';
    }
    toast.success(`Worker ${action} successfully!`);
    setStatusModalMode(null);
    onUpdate();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">Worker Profile</h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleEdit}
              icon={<Edit2 className="w-4 h-4" />}
              iconPosition="left"
              className={isEditing ? 'invisible' : ''}
            >
              Edit Profile
            </Button>
            <Button
              variant="dangerLight"
              size="md"
              onClick={() => setDeleteModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
              iconPosition="left"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm mb-4 animate-shake"
            role="alert"
          >
            {error}
          </div>
        )}

        {isEditing ? (
          /* Edit Mode */
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
              </div>
            </div>

            {/* Wage & OT Rate Section */}
            <div className="bg-card border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-text-primary">Wage & Overtime</h4>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWageEditMode('values')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      wageEditMode === 'values'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    Edit Values
                  </button>
                  <button
                    type="button"
                    onClick={() => setWageEditMode('effectiveDate')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      wageEditMode === 'effectiveDate'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    Change Effective Date
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        wageEditMode === 'values' && wageChanged
                          ? 'border-warning'
                          : 'border-gray-300'
                      }`}
                      required
                      disabled={loading || wageEditMode === 'effectiveDate'}
                    />
                  </div>
                  {wageEditMode === 'values' && wageChanged && (
                    <p className="mt-1 text-xs text-warning">
                      {formatCurrency(originalWage)} → {formatCurrency(Number(formData.wage))}
                    </p>
                  )}

                  {wageEditMode === 'values' && wageChanged && (
                    <div className="mt-2">
                      <label
                        htmlFor={wageEffectiveDateId}
                        className="block text-xs font-medium text-text-secondary mb-1"
                      >
                        Effective From
                      </label>
                      <DatePicker
                        id={wageEffectiveDateId}
                        value={formData.wageEffectiveDate}
                        onChange={(date) =>
                          setFormData({ ...formData, wageEffectiveDate: date || today })
                        }
                        maxDate={today}
                        disabled={loading}
                        size="sm"
                      />
                    </div>
                  )}

                  {wageEditMode === 'effectiveDate' && (
                    <div className="mt-2">
                      <label
                        htmlFor={wageEffectiveDateId}
                        className="block text-xs font-medium text-text-secondary mb-1"
                      >
                        Change Effective Date
                      </label>
                      <DatePicker
                        id={wageEffectiveDateId}
                        value={formData.wageEffectiveDate}
                        onChange={(date) =>
                          setFormData({ ...formData, wageEffectiveDate: date || today })
                        }
                        maxDate={today}
                        disabled={loading}
                        size="sm"
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
                        wageEditMode === 'values' && otRateChanged
                          ? 'border-warning'
                          : 'border-gray-300'
                      }`}
                      required
                      disabled={loading || wageEditMode === 'effectiveDate'}
                    />
                  </div>
                  {wageEditMode === 'values' && otRateChanged && (
                    <p className="mt-1 text-xs text-warning">
                      {formatCurrency(originalOtRate)} → {formatCurrency(Number(formData.otRate))}
                    </p>
                  )}

                  {wageEditMode === 'values' && otRateChanged && (
                    <div className="mt-2">
                      <label
                        htmlFor={otRateEffectiveDateId}
                        className="block text-xs font-medium text-text-secondary mb-1"
                      >
                        Effective From
                      </label>
                      <DatePicker
                        id={otRateEffectiveDateId}
                        value={formData.otRateEffectiveDate}
                        onChange={(date) =>
                          setFormData({ ...formData, otRateEffectiveDate: date || today })
                        }
                        maxDate={today}
                        disabled={loading}
                        size="sm"
                      />
                    </div>
                  )}

                  {wageEditMode === 'effectiveDate' && (
                    <div className="mt-2">
                      <label
                        htmlFor={otRateEffectiveDateId}
                        className="block text-xs font-medium text-text-secondary mb-1"
                      >
                        Change Effective Date
                      </label>
                      <DatePicker
                        id={otRateEffectiveDateId}
                        value={formData.otRateEffectiveDate}
                        onChange={(date) =>
                          setFormData({ ...formData, otRateEffectiveDate: date || today })
                        }
                        maxDate={today}
                        disabled={loading}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {showWageWarning && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3 mt-6">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning mb-1">
                      {wageEditMode === 'values' ? 'Wage Change Detected' : 'Change Effective Date'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {wageEditMode === 'values'
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
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
                icon={<X className="w-4 h-4" />}
                iconPosition="left"
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          /* Read-only Mode */
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-card border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-semibold text-text-primary mb-4">Basic Information</h4>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {worker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">{worker.name}</p>
                    {worker.phone && (
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {worker.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Joined On</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatDate(worker.joinedAt)}
                    </p>
                  </div>
                </div>

                {/* Worker Status */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-text-secondary">Status</p>
                    <div className="flex items-center gap-2">
                      {/* Determine status: Active, Scheduled Inactivation, or Inactive */}
                      {worker.isActive && !worker.inactiveFrom ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-success" />
                          <p className="text-sm font-medium text-success">Active</p>
                        </>
                      ) : worker.isActive && worker.inactiveFrom ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-warning" />
                          <p className="text-sm font-medium text-warning">
                            Active
                            <span className="text-text-secondary font-normal ml-1">
                              {' '}
                              (inactive from{' '}
                              {new Date(worker.inactiveFrom).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                              )
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-error" />
                          <p className="text-sm font-medium text-error">
                            Inactive
                            {worker.inactiveFrom && (
                              <span className="text-text-secondary font-normal ml-1">
                                {' '}
                                since{' '}
                                {new Date(worker.inactiveFrom).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Show Cancel button for scheduled inactivation, or Disable/Activate based on status */}
                  {worker.isActive && worker.inactiveFrom ? (
                    <Button
                      type="button"
                      variant="dangerLight"
                      size="sm"
                      onClick={() => setStatusModalMode('cancel-scheduled')}
                    >
                      Cancel Scheduled Inactivation
                    </Button>
                  ) : worker.isActive ? (
                    <Button
                      type="button"
                      variant="dangerLight"
                      size="sm"
                      onClick={() => setStatusModalMode('disable')}
                    >
                      Disable Worker
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setStatusModalMode('activate')}
                    >
                      Activate Worker
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Wage & OT Rate Section */}
            <div className="bg-card border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-semibold text-text-primary mb-4">Wage & Overtime</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-text-secondary" />
                    <p className="text-xs text-text-secondary">Daily Wage</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(worker.wage)}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-text-secondary" />
                    <p className="text-xs text-text-secondary">OT Rate</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(worker.otRate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {statusModalMode && (
        <WorkerStatusModal
          workerId={worker.id}
          workerName={worker.name}
          mode={statusModalMode}
          inactiveFrom={worker.inactiveFrom}
          isOpen={statusModalMode !== null}
          onClose={() => setStatusModalMode(null)}
          onSuccess={handleStatusChangeSuccess}
        />
      )}
    </>
  );
}
