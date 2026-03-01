import { useNavigate } from 'react-router-dom';
import type { Worker } from '../../store/workerStore';
import WorkerCard from './WorkerCard';

interface WorkersListProps {
  workers: Worker[];
  loading: boolean;
}

export default function WorkersList({ workers, loading }: WorkersListProps) {
  const navigate = useNavigate();

  const handleWorkerClick = (id: number) => {
    navigate(`/workers/${id}`);
  };

  // Loading state - skeleton cards
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="animate-pulse h-16 bg-surface rounded-lg"
          />
        ))}
      </div>
    );
  }

  // Empty state - no workers
  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-base">
          No workers found. Add your first worker to get started.
        </p>
      </div>
    );
  }

  // Normal state - display workers
  return (
    <div className="space-y-3">
      {workers.map((worker) => (
        <WorkerCard
          key={worker.id}
          worker={worker}
          onClick={handleWorkerClick}
        />
      ))}
    </div>
  );
}
