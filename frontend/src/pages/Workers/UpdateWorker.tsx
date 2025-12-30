import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/card';
import Input from '../../components/ui/Input';
import { workerAPI } from '../../services/api';

export const UpdateWorker = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [workerId, setWorkerId] = useState<string | undefined>(params.id);

  // Prompt for id only once on mount if not present
  useEffect(() => {
    if (!params.id && !workerId) {
      setWorkerId('2');
    }
  }, [params.id, workerId]);

  // State for the fetched worker data
  type WorkerType = {
    name: string;
    phone?: string;
    wage?: number;
    otRate?: number;
    joinedAt?: string;
    isActive: boolean;
    [key: string]: any;
  };
  const [originalWorker, setOriginalWorker] = useState<WorkerType | null>(null);

  // State for form data (user's edits)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wage: '',
    otRate: '',
    joinedAt: '',
    isActive: true,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wageChanged, setWageChanged] = useState(false);

  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    setError(null);
    workerAPI
      .getById(workerId)
      .then((res) => {
        const w = res.data;
        setOriginalWorker(w);
        setFormData({
          name: w.name || '',
          phone: w.phone || '',
          wage: w.wage?.toString() || '',
          otRate: w.otRate?.toString() || '',
          joinedAt: w.joinedAt ? w.joinedAt.slice(0, 10) : '',
          isActive: w.isActive,
        });
      })
      .catch(() => {
        setError('Failed to fetch worker');
      })
      .finally(() => setLoading(false));
  }, [workerId]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (
        (field === 'wage' && originalWorker && value !== originalWorker.wage?.toString()) ||
        (field === 'otRate' && originalWorker && value !== originalWorker.otRate?.toString())
      ) {
        setWageChanged(true);
      } else if (field === 'wage' || field === 'otRate') {
        setWageChanged(false);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validate name
    if (!formData.name.trim()) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    // Validate wage
    const wageNum = parseInt(formData.wage, 10);
    if (!formData.wage || Number.isNaN(wageNum) || wageNum <= 0) {
      setError('Valid wage greater than 0 required');
      setSubmitting(false);
      return;
    }

    // Validate phone (basic)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10 digits');
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: formData.name.trim(),
        wage: wageNum,
        isActive: formData.isActive,
      };
      if (formData.phone) payload.phone = formData.phone;
      if (formData.otRate) {
        const otRateNum = parseFloat(formData.otRate);
        if (!Number.isNaN(otRateNum) && otRateNum > 0) payload.otRate = otRateNum;
      }
      if (formData.joinedAt) payload.joinedAt = formData.joinedAt;

      await workerAPI.update(workerId!, payload);
      alert('Worker updated successfully!');
      navigate(-1);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.message || 'Server error occurred');
      } else if (err.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card variant="elevated">
        <Card.Header>
          <Card.Title>Update Worker</Card.Title>
          <Card.Description>Modify worker details and save changes</Card.Description>
        </Card.Header>
        <form onSubmit={handleSubmit}>
          <Card.Content className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Name *"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('name', e.target.value)
                  }
                  placeholder="Enter worker name"
                />
              </div>
              <div className="space-y-2">
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('phone', e.target.value)
                  }
                  placeholder="10-digit phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    label="Daily Wage *"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.wage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange('wage', e.target.value)
                    }
                    placeholder="₹500"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label="OT Rate"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.otRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange('otRate', e.target.value)
                    }
                    placeholder="₹100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  label="Joined Date"
                  type="date"
                  value={formData.joinedAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange('joinedAt', e.target.value)
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Active Worker</span>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="ml-2"
                />
              </div>
              {wageChanged && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  Wage or OT Rate has changed. This will affect future salary calculations.
                </div>
              )}
            </div>
          </Card.Content>
          <Card.Footer className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              type="submit"
              icon={<Save className="w-4 h-4" />}
              disabled={submitting || loading}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
};
