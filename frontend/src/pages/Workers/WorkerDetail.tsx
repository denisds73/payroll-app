import { Calendar, FileText, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Tabs from '../../components/ui/Tabs';
import AttendanceTab from '../../components/workers/AttendanceTab';
import { useWorkerStore } from '../../store/workerStore';

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const { workers, fetchWorkers } = useWorkerStore();
  const [activeTab, setActiveTab] = useState('attendance');

  // Find the worker by ID
  const worker = workers.find((w) => w.id === Number(id));

  // Fetch workers if not already loaded
  useEffect(() => {
    if (workers.length === 0) {
      fetchWorkers();
    }
  }, [workers.length, fetchWorkers]);

  // Loading state
  if (!worker) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <FileText className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Worker Header */}
      <div className="mb-6 bg-card p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-text-primary">{worker.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  worker.isActive ? 'bg-success/10 text-success' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {worker.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-text-secondary mt-1">
              Phone: {worker.phone || 'N/A'} • Wage: ₹{worker.wage}/day
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Current Balance</p>
            <p
              className={`text-2xl font-bold ${
                worker.balance >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              ₹{worker.balance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'attendance' && <AttendanceTab workerId={worker.id} />}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
              <p className="text-text-secondary">
                Advances, salaries, and deductions will appear here
              </p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Worker Profile</h2>
              <p className="text-text-secondary">
                Edit form and delete button will be integrated here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
