import { DollarSign, Edit2, Receipt, TrendingUp, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmModal from '../modals/ConfirmModal';
import EditAdvanceModal from '../modals/EditAdvanceModal';
import EditExpenseModal from '../modals/EditExpenseModal';
import { advancesAPI, expensesAPI, salariesAPI } from '../../services/api';

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
  typeName?: string;  // Added
}

export default function HistoryTab({ workerId, workerName, onDataChange }: HistoryTabProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [editAdvanceModalOpen, setEditAdvanceModalOpen] = useState(false);
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

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
      }));

      const salariesResponse = await salariesAPI.getByWorker(workerId);
      const salaries: HistoryItem[] = salariesResponse.data.map((sal: any) => ({
        id: sal.id,
        type: 'salary' as const,
        date: sal.paymentDate,
        amount: sal.netPay,
        description: sal.note || 'Salary payment',
        cycleInfo: `${formatDate(sal.cycleStart)} - ${formatDate(sal.cycleEnd)}`,
      }));

      const expensesResponse = await expensesAPI.getByWorker(workerId);
      const expenses: HistoryItem[] = expensesResponse.data.map((exp: any) => ({
        id: exp.id,
        type: 'expense' as const,
        date: exp.date,
        amount: exp.amount,
        description: exp.note || 'Expense',
        typeId: exp.typeId,
        typeName: exp.type?.name || 'Unknown',  // Added
      }));

      const combined = [...advances, ...salaries, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

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

  const handleEdit = (item: HistoryItem): void => {
    setSelectedItem(item);
    if (item.type === 'advance') {
      setEditAdvanceModalOpen(true);
    } else if (item.type === 'expense') {
      setEditExpenseModalOpen(true);
    }
  };

  const handleDeleteClick = (item: HistoryItem): void => {
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

      setConfirmDeleteOpen(false);
      setSelectedItem(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : `Failed to delete ${selectedItem.type}`;

      alert(errorMessage || `Failed to delete ${selectedItem.type}`);
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

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-text-secondary mt-3">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg"
        role="alert"
      >
        {error}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Transaction History</h3>
          <span className="text-sm text-text-secondary">{history.length} transactions</span>
        </div>

        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`border-l-4 ${getItemColor(item.type)} rounded-lg p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getItemIcon(item.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary capitalize">
                        {item.type}
                      </span>
                      {/* Show expense type */}
                      {item.type === 'expense' && item.typeName && (
                        <>
                          <span className="text-xs text-text-disabled">•</span>
                          <span className="text-xs font-medium text-info bg-info/10 px-2 py-0.5 rounded">
                            {item.typeName}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-text-disabled">•</span>
                      <span className="text-xs text-text-secondary">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                    {item.cycleInfo && (
                      <p className="text-xs text-text-disabled mt-1">Cycle: {item.cycleInfo}</p>
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
                  </div>

                  {(item.type === 'advance' || item.type === 'expense') && (
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Advance Modal */}
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

      {/* Edit Expense Modal */}
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

      {/* Confirm Delete Modal */}
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
