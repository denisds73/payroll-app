/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { ArrowLeft, ArrowRight, Edit2, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdvancePdfExportButton from '../../components/export/AdvancePdfExportButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import EditAdvanceModal from '../../components/modals/EditAdvanceModal';
import IssueAdvanceModal from '../../components/modals/IssueAdvanceModal';
import PdfPreviewModal from '../../components/modals/PdfPreviewModal';
import Button from '../../components/ui/Button';
import { DateRangePicker } from '../../components/ui/DatePicker';
import Tooltip from '../../components/ui/Tooltip';
import { useAdvancePdfGenerator } from '../../features/pdf-export/hooks/useAdvancePdfGenerator';
import { advancesAPI, salariesAPI } from '../../services/api';
import { useSalaryLockStore } from '../../store/useSalaryLockStore';

interface Advance {
  id: number;
  workerId: string;
  amount: number;
  reason: string | null;
  date: string;
  salaryId: number | null;
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

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [workerName, setWorkerName] = useState<string>('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [lockedPeriods, setLockedPeriods] = useState<LockedPeriod[]>([]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  const advancePdf = useAdvancePdfGenerator();
  const { fetchPaidPeriods } = useSalaryLockStore();

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

  const getLockReason = (date: string, _workerId: string): string | null => {
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

  const handleOpenPreview = async (advanceId: number) => {
    setPreviewPdfTitle(`Advance Receipt - ${workerName}`);
    setPreviewPdfUrl(null);
    setPreviewModalOpen(true);

    try {
      const url = await advancePdf.generatePdfUrl(advanceId);
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error('Failed to generate preview URL:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load PDF preview');
      setPreviewModalOpen(false);
    }
  };

  // Cleanup PDF URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewPdfUrl && previewPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

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
  }, [workerId, dateFrom, dateTo]);

  const fetchAdvances = async () => {
    if (!workerId) return;

    setLoading(true);
    setError(null);

    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await advancesAPI.getByWorker(Number(workerId), params);
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
    <div className="max-w-6xl mx-auto animate-fadeIn flex flex-col h-[calc(100vh-6rem)] py-8">
      <Link
        to="/advances"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors shrink-0 self-start mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Advances
      </Link>

      <div className="flex justify-between items-start mb-6 shrink-0">
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

      <div className="bg-card rounded-lg border border-border flex flex-col min-h-0 flex-1">
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-end gap-4">
            <DateRangePicker
              value={{ start: dateFrom || null, end: dateTo || null }}
              onChange={(range) => {
                setDateFrom(range.start || '');
                setDateTo(range.end || '');
              }}
              showPresets
              className="w-64"
            />
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

        <div className="overflow-auto flex-1 relative">
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="bg-surface border-b border-border sticky top-0 z-10 shadow-sm">
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
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={4} className="px-4 py-4">
                      <div className="h-4 bg-border rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-text-secondary">
                      {dateFrom || dateTo
                        ? 'No advances found for the selected date range'
                        : 'No advances found'}
                    </p>
                  </td>
                </tr>
              ) : (
                advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap w-[25%] text-center">
                      {formatDate(advance.date)}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold text-warning whitespace-nowrap w-[20%] text-center">
                      {formatCurrency(advance.amount)}
                    </td>

                    <td className="px-4 py-3 text-sm text-text-secondary w-[35%] text-center">
                      <div className="truncate mx-auto max-w-full">
                        {advance.reason || <span className="text-text-disabled italic">No reason</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 w-[20%]">
                      {(() => {
                        const locked = !!advance.salaryId;
                        const lockReason = locked ? getLockReason(advance.date, workerId || '') : null;

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

                        const actionContent = (
                          <div className="flex items-center justify-center gap-1">
                            <AdvancePdfExportButton
                              advanceId={advance.id}
                              workerName={workerName}
                              onViewClick={() => handleOpenPreview(advance.id)}
                            />
                            {locked ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                <Lock className="w-4 h-4 text-text-disabled" />
                                <span className="text-xs text-text-secondary font-medium">
                                  Locked
                                </span>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(advance)}
                                  className="p-2 text-text-secondary hover:bg-surface-hover rounded-lg transition-colors"
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
                              </>
                            )}
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

      <PdfPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
      />
    </div>
  );
}
