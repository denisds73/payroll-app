import { ChevronRight, Phone, Plus, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddWorkerModal from '../../components/modals/AddWorkerModal';
import Button from '../../components/ui/Button';
import { useWorkerStore } from '../../store/workerStore';

type FilterTab = 'all' | 'active' | 'inactive';

export default function WorkersDashboard() {
  const navigate = useNavigate();
  const { workers, loading, error, fetchWorkers } = useWorkerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = useMemo(() => {
    let result = workers;

    if (activeFilter === 'active') {
      result = result.filter((w) => w.isActive);
    } else if (activeFilter === 'inactive') {
      result = result.filter((w) => !w.isActive);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) => w.name.toLowerCase().includes(query) || w.phone?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [workers, searchQuery, activeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Workers', count: workers.length },
    { id: 'active', label: 'Active', count: workers.filter((w) => w.isActive).length },
    { id: 'inactive', label: 'Inactive', count: workers.filter((w) => !w.isActive).length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your workforce, wages, and attendance
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Worker
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          <div className="flex">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeFilter === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    activeFilter === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-text-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary w-64"
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
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Worker
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-24">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3 w-32">
                  Net Payable
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                        <div className="min-w-0 flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1.5" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 w-24">
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16 mx-auto" />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto" />
                    </td>
                    <td className="px-2 py-3 w-10">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-4 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-text-secondary font-medium mb-1">
                        {searchQuery ? 'No workers found' : 'No workers yet'}
                      </p>
                      <p className="text-sm text-text-secondary mb-4">
                        {searchQuery
                          ? 'Try a different search term'
                          : 'Add your first worker to get started'}
                      </p>
                      {!searchQuery && (
                        <Button
                          size="sm"
                          onClick={() => setAddModalOpen(true)}
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Add Worker
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    onClick={() => navigate(`/workers/${worker.id}`)}
                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {worker.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {worker.name}
                          </p>
                          <p className="text-xs text-text-secondary truncate flex items-center gap-1 mt-0.5">
                            {worker.phone ? (
                              <>
                                <Phone className="w-3 h-3 shrink-0" />
                                {worker.phone}
                              </>
                            ) : (
                              <span className="text-gray-400">No phone</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 w-24 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          worker.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-32 text-right">
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            (worker.netPayable ?? 0) >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {formatCurrency(Math.abs(worker.netPayable ?? 0))}
                        </span>
                        <p
                          className={`text-xs mt-0.5 ${
                            (worker.netPayable ?? 0) >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {(worker.netPayable ?? 0) >= 0 ? 'To Pay' : 'Owes'}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 w-10">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredWorkers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-text-secondary">
            Showing {filteredWorkers.length} of {workers.length} workers
          </div>
        )}
      </div>

      <AddWorkerModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}
