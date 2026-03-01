import { ChevronRight, Circle } from 'lucide-react';
import type { Worker } from '../../store/workerStore';

interface WorkerCardProps {
  worker: Worker;
  onClick: (id: number) => void; // Navigate to detail page
}

export default function WorkerCard({ worker, onClick }: WorkerCardProps) {
  // Format balance with Indian currency
  const formatBalance = (balance: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(balance);
    return formatted;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(worker.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(worker.id);
        }
      }}
      className="
        flex items-center justify-between 
        bg-[--color-card] 
        p-4 
        rounded-lg 
        shadow-sm 
        hover:shadow-md 
        transition-shadow 
        cursor-pointer
        border border-border
      "
    >
      {/* Left side: Status + Name */}
      <div className="flex items-center gap-3 flex-1">
        <Circle
          className={`w-3 h-3 ${
            worker.isActive
              ? 'fill-success text-success'
              : 'fill-text-disabled text-text-disabled'
          }`}
        />
        <h3 className="text-text-primary font-medium text-base">{worker.name}</h3>
      </div>

      {/* Right side: Balance + Arrow */}
      <div className="flex items-center gap-4">
        <span
          className={`text-sm font-medium ${
            worker.balance >= 0 ? 'text-success' : 'text-error'
          }`}
        >
          {formatBalance(worker.balance)}
        </span>
        <ChevronRight className="w-5 h-5 text-text-secondary" />
      </div>
    </div>
  );
}
