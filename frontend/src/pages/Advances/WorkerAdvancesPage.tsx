/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { ArrowLeft, ArrowRight, Edit2, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/modals/ConfirmModal';
import EditAdvanceModal from '../../components/modals/EditAdvanceModal';
import IssueAdvanceModal from '../../components/modals/IssueAdvanceModal';
import Button from '../../components/ui/Button';
import Tooltip from '../../components/ui/Tooltip';
import { advancesAPI, salariesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';

interface Advance {
  id: number;
  workerId: string;
  amount: number;
  reason: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  worker: {
    id: number;
    name: string;
  };
}

interface LockedPeriod {
  startDate: string;
  endDate: string;
  reason: string;
  type: 'salary' | 'advance';
}

export default function WorkerAdvancesPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [workerName, setWorkerName] = useState<string>('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [lockedPeriods, setLockedPeriods] = useState<LockedPeriod[]>([]);

  const { isDateLocked, fetchPaidPeriods } = useSalaryLockStore();

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    return `${start.toLocaleDateString('en-IN', formatOptions)} - ${end.toLocaleDateString('en-IN', formatOptions)}`;
  };

  const getLockReason = (date: string, workerId: string): string | null => {
    const dateOnly = date.split('T')[0];

    for (const period of lockedPeriods) {
      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];

      if (dateOnly >= startDate && dateOnly <= endDate) {
        if (period.type === 'salary') {
          return `Salary paid for period ${formatDateRange(period.startDate, period.endDate)}`;
        }
        return period.reason;
      }
    }

    return null;
  };

  const handleEdit = (advance: Advance) => {
    setSelectedAdvance(advance);
    setIsEditModalOpen(true);
  };

  const handleDelete = (advance: Advance) => {
    setSelectedAdvance(advance);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdvance) return;

    try {
      await advancesAPI.delete(selectedAdvance.id);
      toast.success('Advance deleted successfully');
      fetchAdvances();
      setIsDeleteModalOpen(false);
      setSelectedAdvance(null);
    } catch (err) {
      toast.error('Failed to delete advance');
    }
  };

  useEffect(() => {
    const fetchLockData = async () => {
      if (!workerId) return;

      try {
        const response = await salariesAPI.getPaidPeriods(Number(workerId));

        const periodsArray = response.data.periods || [];

        const periods: LockedPeriod[] = periodsArray.map((period: any) => ({
          startDate: period.startDate,
          endDate: period.endDate,
          reason: `Salary paid for period`,
          type: 'salary' as const,
        }));

        setLockedPeriods(periods);
        fetchPaidPeriods(Number(workerId));
      } catch (err) {
        console.error('Failed to fetch lock data:', err);
      }
    };

    fetchLockData();
  }, [workerId, fetchPaidPeriods]);

  useEffect(() => {
    fetchAdvances();
  }, [workerId, month, year]);

  useEffect(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [workerId, currentMonth, currentYear]);

  const fetchAdvances = async () => {
    if (!workerId) return;

    setLoading(true);
    setError(null);

    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const response = await advancesAPI.getByWorker(Number(workerId), { month: monthStr });
      setAdvances(response.data);
      if (response.data.length > 0) {
        setWorkerName(response.data[0].worker.name);
      }
    } catch (err) {
      setError('Failed to load advances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Link
        to="/advances"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Advances
      </Link>

      <div className="flex justify-between items-start">
        {' '}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Worker Advances {workerName && `- ${workerName}`}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Advance history for this worker</p>
        </div>
        <Button
          onClick={() => navigate(`/workers/${workerId}`)}
          disabled={!workerId}
          className="mt-4"
        >
          Go to worker
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-end gap-8">
            <div className="relative">
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-1 rounded-md border border-gray-200 text-primary font-medium w-28 focus:ring-2 focus:ring-primary transition-all outline-none"
                  value={month}
                  onChange={(e) => handleMonthYearChange(Number(e.target.value), year)}
                  aria-label="Select month"
                >
                  {Array.from({ length: 12 }, (_, idx) => {
                    const monthValue = idx + 1;
                    return (
                      <option key={monthValue} value={monthValue}>
                        {new Date(0, idx).toLocaleString('default', { month: 'short' })}
                      </option>
                    );
                  })}
                </select>
                <select
                  className="px-3 py-1 rounded-md border border-gray-200 text-primary font-medium w-24 focus:ring-2 focus:ring-primary transition-all outline-none"
                  value={year}
                  onChange={(e) => handleMonthYearChange(month, Number(e.target.value))}
                  aria-label="Select year"
                >
                  {Array.from({ length: 30 }, (_, idx) => {
                    const currentYear = new Date().getFullYear();
                    const yearValue = currentYear - 5 + idx;
                    return (
                      <option key={yearValue} value={yearValue}>
                        {yearValue}
                      </option>
                    );
                  })}
                </select>
              </div>
              {(month !== currentMonth || year !== currentYear) && (
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-amber-100 border border-amber-400 rounded-md shadow-md text-amber-800 text-xs font-medium flex items-center gap-1 whitespace-nowrap z-10 animate-pulse">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Not viewing current month
                </div>
              )}
            </div>
            <Button
              onClick={() => setIsIssueModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              size="md"
            >
              Issue Advance
            </Button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-error/10 border-b border-error/20">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[25%]">
                  Date
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[20%]">
                  Amount
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[35%]">
                  Reason
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[20%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={4} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-text-secondary">
                      No advances found for{' '}
                      {new Date(year, month - 1).toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                </tr>
              ) : (
                advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap w-[25%] text-center">
                      {formatDate(advance.date)}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold text-warning whitespace-nowrap w-[20%] text-center">
                      {formatCurrency(advance.amount)}
                    </td>

                    <td className="px-4 py-3 text-sm text-text-secondary w-[35%] text-center">
                      <div className="truncate mx-auto max-w-full">
                        {advance.reason || <span className="text-gray-400 italic">No reason</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 w-[20%]">
                      {(() => {
                        const dateOnly = advance.date.split('T')[0];
                        const locked = isDateLocked(Number(workerId), dateOnly);
                        const lockReason = getLockReason(advance.date, workerId || '');

                        const tooltipContent = locked && lockReason && (
                          <div>
                            <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed">
                              {lockReason}
                            </div>
                          </div>
                        );

                        const actionContent = locked ? (
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-not-allowed">
                              <Lock className="w-4 h-4 text-text-disabled" />
                              <span className="text-xs text-text-secondary font-medium">
                                Locked
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(advance)}
                              className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(advance)}
                              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );

                        if (locked && tooltipContent) {
                          return (
                            <Tooltip content={tooltipContent} position="cursor">
                              {actionContent}
                            </Tooltip>
                          );
                        }

                        return actionContent;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IssueAdvanceModal
        workerId={Number(workerId)}
        workerName={workerName}
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={() => {
          fetchAdvances();
          setIsIssueModalOpen(false);
          toast.success('Advance issued successfully');
        }}
      />

      <EditAdvanceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAdvance(null);
        }}
        onSuccess={() => {
          fetchAdvances();
          setIsEditModalOpen(false);
          setSelectedAdvance(null);
          toast.success('Advance updated successfully');
        }}
        advance={
          selectedAdvance
            ? {
                id: selectedAdvance.id,
                amount: selectedAdvance.amount,
                date: selectedAdvance.date,
                reason: selectedAdvance.reason || '',
              }
            : null
        }
        workerName={workerName}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Advance"
        message={`Are you sure you want to delete the advance of ${selectedAdvance ? formatCurrency(selectedAdvance.amount) : ''} on ${selectedAdvance ? formatDate(selectedAdvance.date) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedAdvance(null);
        }}
      />
    </div>
  );
}
