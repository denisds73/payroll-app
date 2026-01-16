import { ArrowRight, Calendar, Plus, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AddWorkerModal from '../../components/modals/AddWorkerModal';
import Button from '../../components/ui/Button';
import { useWorkerStore } from '../../store/workerStore';

export default function Dashboard() {
  const { workers, loading, fetchWorkers } = useWorkerStore();
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (workers.length === 0) {
      fetchWorkers();
    }
  }, [workers.length, fetchWorkers]);

  const activeWorkers = workers.filter((w) => w.isActive).length;
  const inactiveWorkers = workers.filter((w) => !w.isActive).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome to Payroll App</h1>
        <p className="text-text-secondary">
          Manage worker attendance, advances, expenses, and salaries — all in one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Total Workers</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{loading ? '...' : workers.length}</p>
          <p className="text-xs text-text-secondary mt-1">
            {activeWorkers} active • {inactiveWorkers} inactive
          </p>
        </div>

        <div className="bg-card rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Today</span>
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Quick Tip</span>
          </div>
          <p className="text-sm text-text-secondary">
            Mark attendance daily to keep salary calculations accurate.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/workers"
            className="group bg-card rounded-lg border border-gray-200 p-5 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Manage Workers</h3>
                  <p className="text-sm text-text-secondary">View, add, or edit worker profiles</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="group bg-card rounded-lg border border-gray-200 p-5 hover:border-success hover:shadow-md transition-all w-full text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                  <Plus className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Add New Worker</h3>
                  <p className="text-sm text-text-secondary">
                    Register a new worker with wage details
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-success transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Empty State / Getting Started */}
      {!loading && workers.length === 0 && (
        <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-8 text-center">
          <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Get Started</h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            You haven't added any workers yet. Add your first worker to start tracking attendance,
            advances, and salaries.
          </p>
          <Button variant="primary" size="lg" onClick={() => setAddModalOpen(true)}>
            Add Your First Worker
          </Button>
        </div>
      )}

      {/* Recent Workers (if any exist) */}
      {!loading && workers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recent Workers</h2>
            <Link
              to="/workers"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-card rounded-lg border border-gray-200 divide-y divide-gray-100">
            {workers.slice(0, 5).map((worker) => (
              <Link
                key={worker.id}
                to={`/workers/${worker.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {worker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{worker.name}</p>
                    <p className="text-xs text-text-secondary">₹{worker.wage}/day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      worker.isActive ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {worker.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      <AddWorkerModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}
