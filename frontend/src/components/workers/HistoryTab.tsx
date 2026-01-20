import { DollarSign, Edit2, Filter, Lock, Receipt, Trash2, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { advancesAPI, expensesAPI, salariesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';
import ConfirmModal from '../modals/ConfirmModal';
import EditAdvanceModal from '../modals/EditAdvanceModal';
import EditExpenseModal from '../modals/EditExpenseModal';
import { DateRangePicker } from '../ui/DatePicker';
import Tooltip from '../ui/Tooltip';
import SalaryPdfExportButton from '../export/SalaryPdfExportButton';

interface HistoryTabProps {
  workerId: number;
  workerName: string;
  onDataChange?: () => void;
}

interface HistoryItem {
  id: number;
  type: 'advance' | 'salary' | 'expense';
  date: string;
  amount: number;
  description: string;
  cycleInfo?: string;
  typeId?: number;
  typeName?: string;
  issuedAt?: string;
  createdAt: string;
  // 🆕 Partial payment fields
  status?: 'PENDING' | 'PARTIAL' | 'PAID';
  netPay?: number;
  totalPaid?: number;
}

interface FilterState {
  types: {
    advance: boolean;
    salary: boolean;
    expense: boolean;
  };
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export default function HistoryTab({ workerId, workerName, onDataChange }: HistoryTabProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [editAdvanceModalOpen, setEditAdvanceModalOpen] = useState(false);
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    types: {
      advance: true,
      salary: true,
      expense: true,
    },
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });

  const lockDataByWorker = useSalaryLockStore((state) => state.lockDataByWorker);
  const fetchPaidPeriods = useSalaryLockStore((state) => state.fetchPaidPeriods);
  const isDateLocked = useSalaryLockStore((state) => state.isDateLocked);
  const lockLoading = useSalaryLockStore((state) => state.loading);
  const lockErrors = useSalaryLockStore((state) => state.errors);

  const lockError = lockErrors[workerId];

  useEffect(() => {
    fetchPaidPeriods(workerId);
  }, [workerId, fetchPaidPeriods]);

  useEffect(() => {
    fetchHistory();
  }, [workerId]);

  const fetchHistory = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const advancesResponse = await advancesAPI.getByWorker(workerId);
      const advances: HistoryItem[] = advancesResponse.data.map((adv: any) => ({
        id: adv.id,
        type: 'advance' as const,
        date: adv.date,
        amount: adv.amount,
        description: adv.reason || 'Advance payment',
        createdAt: adv.createdAt,
      }));

      const salariesResponse = await salariesAPI.getByWorker(workerId);
      const salaries: HistoryItem[] = salariesResponse.data.map((sal: any) => ({
        id: sal.id,
        type: 'salary' as const,
        date: sal.cycleEnd,
        amount: sal.totalPaid,
        description:
          sal.paymentProof ||
          `Salary for ${formatDate(sal.cycleStart)} - ${formatDate(sal.cycleEnd)}`,
        cycleInfo: `${formatDate(sal.cycleStart)} - ${formatDate(sal.cycleEnd)}`,
        issuedAt: sal.issuedAt,
        createdAt: sal.createdAt,
        // 🆕 Add status and payment fields
        status: sal.status,
        netPay: sal.netPay,
        totalPaid: sal.totalPaid,
      }));

      const expensesResponse = await expensesAPI.getByWorker(workerId);
      const expenses: HistoryItem[] = expensesResponse.data.map((exp: any) => ({
        id: exp.id,
        type: 'expense' as const,
        date: exp.date,
        amount: exp.amount,
        description: exp.note || 'Expense',
        typeId: exp.typeId,
        typeName: exp.type?.name || 'Unknown',
        createdAt: exp.createdAt,
      }));

      const combined = [...advances, ...salaries, ...expenses].sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setHistory(combined);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to load history';

      setError(errorMessage || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (!filters.types[item.type]) return false;

      const itemDate = new Date(item.date).getTime();
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom).getTime();
        if (itemDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo).setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }

      if (filters.amountMin && item.amount < Number(filters.amountMin)) return false;
      if (filters.amountMax && item.amount > Number(filters.amountMax)) return false;

      return true;
    });
  }, [history, filters]);

  const hasActiveFilters = useMemo(() => {
    const allTypesSelected = filters.types.advance && filters.types.salary && filters.types.expense;
    const hasDateFilter = filters.dateFrom || filters.dateTo;
    const hasAmountFilter = filters.amountMin || filters.amountMax;

    return !allTypesSelected || hasDateFilter || hasAmountFilter;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      types: {
        advance: true,
        salary: true,
        expense: true,
      },
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    });
  };

  const handleEdit = (item: HistoryItem): void => {
    const dateOnly = item.date.split('T')[0];
    if (isDateLocked(workerId, dateOnly)) {
      toast.error('Cannot edit - salary has been paid for this period');
      return;
    }

    setSelectedItem(item);
    if (item.type === 'advance') {
      setEditAdvanceModalOpen(true);
    } else if (item.type === 'expense') {
      setEditExpenseModalOpen(true);
    }
  };

  const handleDeleteClick = (item: HistoryItem): void => {
    const dateOnly = item.date.split('T')[0];
    if (isDateLocked(workerId, dateOnly)) {
      toast.error('Cannot delete - salary has been paid for this period');
      return;
    }

    setSelectedItem(item);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'advance') {
        await advancesAPI.delete(selectedItem.id);
      } else if (selectedItem.type === 'expense') {
        await expensesAPI.delete(selectedItem.id);
      }

      fetchHistory();

      if (onDataChange) {
        onDataChange();
      }

      toast.success(`${selectedItem.type} deleted successfully`);
      setConfirmDeleteOpen(false);
      setSelectedItem(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : `Failed to delete ${selectedItem.type}`;

      if (
        errorMessage?.toLowerCase().includes('locked') ||
        errorMessage?.toLowerCase().includes('salary') ||
        errorMessage?.toLowerCase().includes('paid')
      ) {
        toast.error('Cannot delete - salary has been paid for this period');
        fetchPaidPeriods(workerId, true);
      } else {
        toast.error(errorMessage || `Failed to delete ${selectedItem.type}`);
      }

      setConfirmDeleteOpen(false);
    }
  };

  const handleSuccess = (): void => {
    fetchHistory();
    if (onDataChange) {
      onDataChange();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'advance':
        return <DollarSign className="w-5 h-5 text-warning" />;
      case 'salary':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'expense':
        return <Receipt className="w-5 h-5 text-info" />;
      default:
        return null;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'advance':
        return 'border-l-warning bg-warning/5';
      case 'salary':
        return 'border-l-success bg-success/5';
      case 'expense':
        return 'border-l-info bg-info/5';
      default:
        return 'border-l-gray-300';
    }
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

  const getLockReason = (date: string): string | undefined => {
    const workerData = lockDataByWorker[workerId];
    if (!workerData) return undefined;

    const dateOnly = date.split('T')[0];

    for (const period of workerData.periods) {
      if (!period.isPaid) continue;

      const startDate = period.startDate.split('T')[0];
      const endDate = period.endDate.split('T')[0];

      if (dateOnly >= startDate && dateOnly <= endDate) {
        return `Salary has been paid for the period ${formatDateRange(period.startDate, period.endDate)}.`;
      }
    }

    return undefined;
  };

  const isItemLocked = (item: HistoryItem): boolean => {
    if (item.type === 'salary') return true;
    const dateOnly = item.date.split('T')[0];
    return isDateLocked(workerId, dateOnly);
  };

  const isLoading = loading || lockLoading[workerId];
  const combinedError = error || lockError || null;

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-text-secondary mt-3">Loading history...</p>
      </div>
    );
  }

  if (combinedError) {
    return (
      <div
        className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg"
        role="alert"
      >
        {combinedError}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4">
          <Receipt className="w-8 h-8 text-text-disabled" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">No Transaction History</h3>
        <p className="text-sm text-text-secondary">
          Advances, expenses, and salary payments will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Transaction History</h3>
          <span className="text-sm text-text-secondary">
            {filteredHistory.length} of {history.length} transactions
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className={`text-sm transition-all flex items-center gap-1 font-medium ${
              hasActiveFilters
                ? 'text-error hover:text-error/80 cursor-pointer'
                : 'text-error/0 pointer-events-none'
            }`}
          >
            <X className="w-4 h-4" />
            Clear
          </button>

          <div className="flex items-center gap-2">
            {(['salary', 'advance', 'expense'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    types: {
                      ...prev.types,
                      [type]: !prev.types[type],
                    },
                  }))
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize border ${
                  filters.types[type]
                    ? type === 'advance'
                      ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                      : type === 'salary'
                        ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                        : 'bg-info/10 text-info border-info/30 hover:bg-info/20'
                    : 'bg-background text-text-disabled border-gray-300 opacity-60 hover:opacity-80'
                }`}
              >
                {filters.types[type] && <span className="mr-1">✓</span>}
                {type}
              </button>
            ))}
          </div>

          <DateRangePicker
            value={{ start: filters.dateFrom || null, end: filters.dateTo || null }}
            onChange={(range) =>
              setFilters({ ...filters, dateFrom: range.start || '', dateTo: range.end || '' })
            }
            showPresets
            className="w-64"
          />
        </div>

        <div className="space-y-3 min-h-96">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4">
                <Filter className="w-8 h-8 text-text-disabled" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Matching Transactions
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Try adjusting your filters to see more results
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const locked = isItemLocked(item);
              const lockReason = locked ? getLockReason(item.date) : undefined;

              const itemContent = (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`border-l-4 ${getItemColor(item.type)} rounded-lg p-4 hover:shadow-md transition-all ${
                    locked && item.type !== 'salary' ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getItemIcon(item.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-text-primary capitalize">
                            {item.type}
                          </span>

                          {item.type === 'expense' && item.typeName && (
                            <>
                              <span className="text-xs text-text-disabled">•</span>
                              <span className="text-xs font-medium text-info bg-info/10 px-2 py-0.5 rounded">
                                {item.typeName}
                              </span>
                            </>
                          )}
                          <span className="text-xs text-text-disabled">•</span>
                          {item.type === 'salary' && item.cycleInfo ? (
                            <span className="text-xs text-text-secondary">{item.cycleInfo}</span>
                          ) : (
                            <span className="text-xs text-text-secondary">
                              {formatDate(item.date)}
                            </span>
                          )}
                        </div>

                        {item.type === 'salary' && item.issuedAt ? (
                          <div className="space-y-1">
                            <p className="text-xs text-success flex items-center gap-1">
                              <span className="font-medium">Processed on:</span>
                              <span>{formatDate(item.issuedAt)}</span>

                              {item.issuedAt.split('T')[0] !== item.date.split('T')[0] && (
                                <span className="text-warning ml-1">(Retroactive)</span>
                              )}
                            </p>

                            {/* 🆕 SHOW PARTIAL PAYMENT STATUS */}
                            {item.status === 'PARTIAL' && item.netPay && item.totalPaid !== undefined && (
                              <p className="text-xs flex items-center gap-1">
                                <span className="font-medium text-warning">Partial Payment:</span>
                                <span className="text-text-secondary">
                                  {formatCurrency(item.totalPaid)} of {formatCurrency(item.netPay)}
                                </span>
                                <span className="text-text-disabled">•</span>
                                <span className="text-warning">
                                  Remaining: {formatCurrency(item.netPay - item.totalPaid)}
                                </span>
                              </p>
                            )}
                          </div>
                        ) : (
                          item.type !== 'salary' && (
                            <p className="text-sm text-text-secondary">{item.description}</p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            item.type === 'salary' && item.amount >= 0
                              ? 'text-success'
                              : item.type === 'advance' || item.type === 'expense'
                                ? 'text-warning'
                                : 'text-text-primary'
                          }`}
                        >
                          {item.type === 'advance' || item.type === 'expense' ? '-' : ''}
                          {formatCurrency(item.amount)}
                        </p>
                        
                        {/* 🆕 SHOW PARTIAL STATUS BADGE */}
                        {item.type === 'salary' && item.status === 'PARTIAL' && (
                          <span className="text-xs text-warning font-medium">Partial</span>
                        )}
                      </div>

                      {item.type === 'salary' && (
                        <SalaryPdfExportButton
                          salaryId={item.id}
                          workerName={workerName}
                          variant="ghost"
                        />
                      )}

                      {(item.type === 'advance' || item.type === 'expense') && (
                        <>
                          {locked ? (
                            <div className="flex items-center gap-2 text-text-secondary px-2">
                              <Lock className="w-4 h-4" />
                              <span className="text-sm font-medium">Locked</span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(item)}
                                className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );

              if (locked && lockReason && item.type !== 'salary') {
                const tooltipContent = (
                  <div>
                    <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">{lockReason}</div>
                  </div>
                );

                return (
                  <Tooltip
                    key={`${item.type}-${item.id}`}
                    content={tooltipContent}
                    position="cursor"
                  >
                    {itemContent}
                  </Tooltip>
                );
              }

              return itemContent;
            })
          )}
        </div>
      </div>

      <EditAdvanceModal
        advance={
          selectedItem?.type === 'advance'
            ? {
                id: selectedItem.id,
                date: selectedItem.date,
                amount: selectedItem.amount,
                reason: selectedItem.description,
              }
            : null
        }
        workerName={workerName}
        isOpen={editAdvanceModalOpen}
        onClose={() => {
          setEditAdvanceModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
      />

      <EditExpenseModal
        expense={
          selectedItem?.type === 'expense'
            ? {
                id: selectedItem.id,
                date: selectedItem.date,
                amount: selectedItem.amount,
                note: selectedItem.description,
                typeId: selectedItem.typeId || 1,
              }
            : null
        }
        workerName={workerName}
        isOpen={editExpenseModalOpen}
        onClose={() => {
          setEditExpenseModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
      />

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title={`Delete ${selectedItem?.type}?`}
        message={`Are you sure you want to delete this ${selectedItem?.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setSelectedItem(null);
        }}
      />
    </>
  );
}
