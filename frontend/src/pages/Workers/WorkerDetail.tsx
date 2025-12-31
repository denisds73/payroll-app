import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Phone,
  Receipt,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import IssueAdvanceModal from '../../components/modals/IssueAdvanceModal';
import PaySalaryModal from '../../components/modals/PaySalaryModal';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import AttendanceTab from '../../components/workers/AttendanceTab';
import HistoryTab from '../../components/workers/HistoryTab';
import ProfileTab from '../../components/workers/ProfileTab';
import { salariesAPI } from '../../services/api';
import { useWorkerStore } from '../../store/workerStore';

interface CycleStats {
  cycleStart: string;
  cycleEnd: string;
  totalDays: number;
  totalOtUnits: number;
  basePay: number;
  otPay: number;
  grossPay: number;
  totalAdvance: number;
  totalExpense: number;
  netPay: number;
}

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const { workers, fetchWorkers } = useWorkerStore();
  const [activeTab, setActiveTab] = useState('attendance');
  const [cycleStats, setCycleStats] = useState<CycleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Modal states
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  const worker = workers.find((w) => w.id === Number(id));

  useEffect(() => {
    if (workers.length === 0) {
      fetchWorkers();
    }
  }, [workers.length, fetchWorkers]);

  useEffect(() => {
    if (worker) {
      fetchCycleStats(worker.id);
    }
  }, [worker?.id]);

  const fetchCycleStats = async (workerId: number) => {
    setLoadingStats(true);
    setStatsError(null);

    try {
      const response = await salariesAPI.calculate(workerId);
      setCycleStats(response.data);
      console.log('Cycle stats loaded:', response.data);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setStatsError('No attendance in current cycle');
      } else {
        setStatsError('Error loading cycle stats');
      }
      console.log('Cycle stats error:', error.response?.data?.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSalarySuccess = () => {
    if (worker) {
      console.log('Salary paid - refreshing stats');
      fetchCycleStats(worker.id);
    }
  };

  const handleAttendanceChange = () => {
    if (worker) {
      console.log('Attendance changed - refreshing stats');
      fetchCycleStats(worker.id);
    }
  };

  const handleAdvanceSuccess = () => {
    if (worker) {
      console.log('Advance issued - refreshing stats');
      fetchCycleStats(worker.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Worker Header */}
      <div className="bg-card p-6 rounded-lg shadow-sm">
        {/* Top Row: Worker Info + Action Buttons */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">{worker.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  worker.isActive
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {worker.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {worker.phone || 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />₹{worker.wage}/day
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                OT: ₹{worker.otRate}/unit
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
              onClick={() => setIsAdvanceModalOpen(true)}
            >
              <DollarSign className="w-4 h-4" />
              Issue Advance
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex items-center gap-2"
              onClick={() => setIsSalaryModalOpen(true)}
            >
              <TrendingUp className="w-4 h-4" />
              Pay Salary
            </Button>
          </div>
        </div>

        {/* Cycle Stats Cards */}
        {loadingStats ? (
          <div className="py-4">
            <p className="text-sm text-text-secondary">Loading current cycle stats...</p>
          </div>
        ) : statsError ? (
          <div className="bg-background rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-text-secondary">{statsError}</p>
            <p className="text-xs text-text-disabled mt-1">Mark attendance to see cycle summary</p>
          </div>
        ) : cycleStats ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Current Cycle Summary
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(cycleStats.cycleStart)} - {formatDate(cycleStats.cycleEnd)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {/* Earned Card */}
              <button
                type="button"
                className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <p className="text-sm font-semibold text-text-primary">Earned</p>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-1">
                  {formatCurrency(cycleStats.grossPay)}
                </p>
                <p className="text-xs text-text-secondary">
                  {cycleStats.totalDays} days • {cycleStats.totalOtUnits} OT units
                </p>
              </button>

              {/* Advances Card */}
              <button
                type="button"
                className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-warning" />
                  <p className="text-sm font-semibold text-text-primary">Advances</p>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-1">
                  {formatCurrency(cycleStats.totalAdvance)}
                </p>
                <p className="text-xs text-text-secondary">
                  {cycleStats.totalAdvance > 0 ? 'Deducted from salary' : 'No advances taken'}
                </p>
              </button>

              {/* Expenses Card */}
              <button
                type="button"
                className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-info" />
                  <p className="text-sm font-semibold text-text-primary">Expenses</p>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-1">
                  {formatCurrency(cycleStats.totalExpense)}
                </p>
                <p className="text-xs text-text-secondary">
                  {cycleStats.totalExpense > 0 ? 'Deducted from salary' : 'No expenses'}
                </p>
              </button>

              {/* Net Payable Card */}
              <div className="bg-white rounded-lg p-4 border-2 border-primary">
                <div className="flex items-center gap-2 mb-3">
                  <FileText
                    className={`w-5 h-5 ${cycleStats.netPay >= 0 ? 'text-success' : 'text-error'}`}
                  />
                  <p className="text-sm font-semibold text-text-primary">Net Payable</p>
                </div>
                <p className="text-2xl font-bold text-text-primary mb-1">
                  {formatCurrency(Math.abs(cycleStats.netPay))}
                </p>
                <p
                  className={`text-xs font-medium ${cycleStats.netPay >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {cycleStats.netPay >= 0 ? 'To Pay Worker' : 'Worker Owes Company'}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'attendance' && (
            <AttendanceTab workerId={worker.id} onAttendanceChange={handleAttendanceChange} />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              workerId={worker.id}
              workerName={worker.name}
              onDataChange={() => fetchCycleStats(worker.id)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              worker={worker}
              onUpdate={() => {
                fetchWorkers();
                if (worker) {
                  fetchCycleStats(worker.id);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Issue Advance Modal */}
      <IssueAdvanceModal
        workerId={worker.id}
        workerName={worker.name}
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSuccess={handleAdvanceSuccess}
      />

      <PaySalaryModal
        workerId={worker.id}
        workerName={worker.name}
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSuccess={handleSalarySuccess}
      />
    </div>
  );
}
