import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import WorkersList from '../../components/workers/WorkersList';
import { useWorkerStore } from '../../store/workerStore';

export default function WorkersDashboard() {
  const navigate = useNavigate();

  // Get state and actions from Zustand store
  const { workers, loading, error, fetchWorkers } = useWorkerStore();

  // Local state for search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch workers on component mount
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Filter workers based on search query
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) {
      return workers;
    }

    const query = searchQuery.toLowerCase();
    return workers.filter((worker) => worker.name.toLowerCase().includes(query));
  }, [workers, searchQuery]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Workers</h1>
          <p className="text-text-secondary mt-1">Manage your workforce and track attendance</p>
        </div>
        <Button onClick={() => navigate('/workers/add')} icon={<Plus className="w-5 h-5" />}>
          Add Worker
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search workers by name..."
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-error text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Workers List */}
      <WorkersList workers={filteredWorkers} loading={loading} />
    </div>
  );
}
