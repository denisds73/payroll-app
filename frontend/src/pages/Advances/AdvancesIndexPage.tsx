import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advancesAPI } from '../../services/api';

interface WorkerWithLatestAdvance {
  workerId: number;
  workerName: string;
  lastAdvanceId: number;
  lastAdvanceDate: string;
  lastAdvanceAmount: number;
  lastAdvanceReason: string | null;
}

export default function AdvancesIndexPage() {
  const [workers, setWorkers] = useState<WorkerWithLatestAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await advancesAPI.listWorkersWithLatest();
      setWorkers(response.data);
    } catch (err) {
      setError('Failed to load workers with advances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.workerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  const handleViewHistory = (workerId: number) => {
    navigate(`/advances/${workerId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Worker Advances</h1>
        <p className="text-sm text-text-secondary mt-0.5">Workers with advance history</p>
      </div>

      <div className="bg-card rounded-lg border border-gray-200 overflow-visible">
        <div className="flex items-center justify-end border-b border-gray-200 px-4 py-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by worker name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 border-b border-error/20">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[35%]">
                  Worker
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[18%]">
                  Last Advance Date
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[15%]">
                  Amount
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[20%]">
                  Reason
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-[12%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-text-secondary">No advances found</p>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.workerId}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleViewHistory(worker.workerId)}
                  >
                    <td className="px-4 py-3 w-[35%]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-xs">
                            {worker.workerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {worker.workerName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap w-[18%] text-center">
                      {formatDate(worker.lastAdvanceDate)}
                    </td>

                    <td className="px-4 py-3 text-sm font-bold text-warning whitespace-nowrap w-[15%] text-center">
                      {formatCurrency(worker.lastAdvanceAmount)}
                    </td>

                    <td className="px-4 py-3 text-sm text-text-secondary w-[20%] text-center">
                      <div className="truncate mx-auto max-w-full">
                        {worker.lastAdvanceReason || (
                          <span className="text-gray-400 italic">No reason</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right w-[12%]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHistory(worker.workerId);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
