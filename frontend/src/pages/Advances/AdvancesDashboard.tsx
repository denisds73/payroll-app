import { DollarSign, Edit2, Lock, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import IssueAdvanceModal from '../../components/modals/IssueAdvanceModal';
import EditAdvanceModal from '../../components/modals/EditAdvanceModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Button from '../../components/ui/Button';
import { DateRangePicker } from '../../components/ui/DatePicker';
import Tooltip from '../../components/ui/Tooltip';
import { advancesAPI } from '../../services/api';
import { useWorkerStore } from '../../store/workerStore';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';

interface Advance {
  id: number;
  workerId: number;
  workerName?: string;
  amount: number;
  reason: string;
  date: string;
  salaryId: number | null;
  createdAt: string;
  worker?: {
    name: string;
  };
}

export default function AdvancesDashboard() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  const { workers, fetchWorkers } = useWorkerStore();
  const { fetchPaidPeriods } = useSalaryLockStore();

  useEffect(() => {
    fetchAdvances();
    if (workers.length === 0) {
      fetchWorkers();
    }
  }, [fetchWorkers, workers.length]);

  useEffect(() => {
    if (advances.length > 0) {
      const workerIds = Array.from(new Set(advances.map((a) => a.workerId)));
      for (const id of workerIds) {
        fetchPaidPeriods(id);
      }
    }
  }, [advances, fetchPaidPeriods]);

  const fetchAdvances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await advancesAPI.list();
      setAdvances(response.data);
    } catch (err) {
      setError('Failed to fetch advances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvances = useMemo(() => {
    return advances.filter((adv) => {
      const workerName = adv.worker?.name || adv.workerName || '';
      const matchesSearch = workerName.toLowerCase().includes(searchQuery.toLowerCase());

      const advDate = new Date(adv.date).getTime();
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && advDate >= new Date(dateRange.start).getTime();
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && advDate <= endDate.getTime();
      }

      return matchesSearch && matchesDate;
    });
  }, [advances, searchQuery, dateRange]);

  const handleEdit = (adv: Advance) => {
    if (adv.salaryId) {
      toast.error('Cannot edit - advance has already been included in a salary cycle');
      return;
    }
    setSelectedAdvance(adv);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (adv: Advance) => {
    if (adv.salaryId) {
      toast.error('Cannot delete - advance has already been included in a salary cycle');
      return;
    }
    setSelectedAdvance(adv);
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

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn flex flex-col h-[calc(100vh-6rem)] py-6 px-6">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Worker Advances</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Track and manage advances given to workers
          </p>
        </div>
        <Button onClick={() => setIsIssueModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Issue Advance
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border flex flex-col min-h-0 flex-1 overflow-visible">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 gap-4 flex-wrap shrink-0">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by worker name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setDateRange({ start: null, end: null });
              }}
              className={`text-sm transition-all flex items-center gap-1 font-medium ${
                searchQuery || dateRange.start || dateRange.end
                  ? 'text-error hover:text-error/80 cursor-pointer opacity-100'
                  : 'text-error/0 pointer-events-none opacity-0'
              }`}
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              showPresets
              className="w-64"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 border-b border-error/20 shrink-0">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface border-b border-border sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Worker
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Reason
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Amount
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 bg-border rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-text-disabled mb-3" />
                      <p className="text-text-secondary font-medium mb-1">No advances found</p>
                      <p className="text-sm text-text-secondary">
                        Try adjusting your filters or issue a new advance
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const locked = !!adv.salaryId;
                  return (
                    <tr key={adv.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                        {formatDate(adv.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-semibold text-xs text-center">
                              {(adv.worker?.name || adv.workerName || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {adv.worker?.name || adv.workerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {adv.reason || <span className="text-text-disabled italic">No reason provided</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-warning whitespace-nowrap">
                        {formatCurrency(adv.amount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {locked ? (
                            <Tooltip content="Locked: Salary paid for this period" position="top">
                              <div className="p-2 text-text-disabled cursor-not-allowed">
                                <Lock className="w-4 h-4" />
                              </div>
                            </Tooltip>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(adv)}
                                className="p-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(adv)}
                                className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IssueAdvanceModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={fetchAdvances}
      />

      <EditAdvanceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAdvance(null);
        }}
        onSuccess={fetchAdvances}
        advance={selectedAdvance ? {
          id: selectedAdvance.id,
          amount: selectedAdvance.amount,
          date: selectedAdvance.date,
          reason: selectedAdvance.reason
        } : null}
        workerName={selectedAdvance?.worker?.name || selectedAdvance?.workerName || ''}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Advance"
        message={`Are you sure you want to delete the advance of ${selectedAdvance ? formatCurrency(selectedAdvance.amount) : ''} for ${selectedAdvance?.worker?.name || selectedAdvance?.workerName}? This action cannot be undone.`}
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
