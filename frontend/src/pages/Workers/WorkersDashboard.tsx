import {
  Calendar,
  ChevronRight,
  DollarSign,
  Phone,
  Plus,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { useWorkerStore } from '../../store/workerStore';

type FilterTab = 'all' | 'active' | 'inactive';

export default function WorkersDashboard() {
  const navigate = useNavigate();
  const { workers, loading, error, fetchWorkers } = useWorkerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeWorkers = workers.filter((w) => w.isActive);
    const inactiveWorkers = workers.filter((w) => !w.isActive);
    const totalDailyWages = activeWorkers.reduce((sum, w) => sum + w.wage, 0);
    const totalBalance = workers.reduce((sum, w) => sum + w.balance, 0);

    return {
      total: workers.length,
      active: activeWorkers.length,
      inactive: inactiveWorkers.length,
      totalDailyWages,
      totalBalance,
    };
  }, [workers]);

  // Filter workers based on search and tab
  const filteredWorkers = useMemo(() => {
    let result = workers;

    // Filter by status
    if (activeFilter === 'active') {
      result = result.filter((w) => w.isActive);
    } else if (activeFilter === 'inactive') {
      result = result.filter((w) => !w.isActive);
    }

    // Filter by search
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Workers', count: stats.total },
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'inactive', label: 'Inactive', count: stats.inactive },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your workforce, wages, and attendance
          </p>
        </div>
        <Button onClick={() => navigate('/workers/add')} icon={<Plus className="w-4 h-4" />}>
          Add Worker
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Workers</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
        </div>

        <div className="bg-card rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Active</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
        </div>

        <div className="bg-card rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Daily Payroll</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(stats.totalDailyWages)}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-warning mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Balance</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              stats.totalBalance >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {formatCurrency(stats.totalBalance)}
          </p>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="bg-card rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          {/* Tabs */}
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

          {/* Search */}
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

        {/* Error State */}
        {error && (
          <div className="p-4 bg-error/10 border-b border-error/20">
            <p className="text-error text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Worker
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Contact
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Daily Wage
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  OT Rate
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Balance
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-3">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-14 ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16 mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-4" />
                    </td>
                  </tr>
                ))
              ) : filteredWorkers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
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
                          onClick={() => navigate('/workers/add')}
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Add Worker
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Worker rows
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    onClick={() => navigate(`/workers/${worker.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {worker.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-text-primary">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Phone className="w-3.5 h-3.5" />
                        {worker.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-text-primary">
                        {formatCurrency(worker.wage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-text-secondary">
                        {formatCurrency(worker.otRate)}/unit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          worker.balance >= 0 ? 'text-success' : 'text-error'
                        }`}
                      >
                        {formatCurrency(worker.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          worker.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(worker.joinedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {!loading && filteredWorkers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-text-secondary">
            Showing {filteredWorkers.length} of {stats.total} workers
          </div>
        )}
      </div>
    </div>
  );
}
