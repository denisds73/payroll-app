import { Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/card';
import { DatePicker } from '../../components/ui/DatePicker';
import Input from '../../components/ui/Input';
import { workerAPI } from '../../services/api';

export const AddWorker = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wage: '',
    otRate: '',
    joinedAt: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    // Validate wage
    const wageNum = parseInt(formData.wage, 10);
    if (!formData.wage || Number.isNaN(wageNum) || wageNum <= 0) {
      setError('Valid wage greater than 0 required');
      return;
    }

    // Validate phone (basic)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const payload: {
        name: string;
        wage: number;
        phone?: string;
        otRate?: number;
        joinedAt?: string;
        isActive: boolean;
      } = {
        name: formData.name.trim(),
        wage: wageNum,
        isActive: formData.isActive,
      };

      if (formData.phone) {
        payload.phone = formData.phone;
      }

      if (formData.otRate) {
        const otRateNum = parseFloat(formData.otRate);
        if (!Number.isNaN(otRateNum) && otRateNum > 0) {
          payload.otRate = otRateNum;
        }
      }

      if (formData.joinedAt) {
        payload.joinedAt = formData.joinedAt;
      }

      console.log('Sending payload:', payload);

      const response = await workerAPI.create(payload);

      console.log('Worker created successfully:', response.data);

      setFormData({
        name: '',
        phone: '',
        wage: '',
        otRate: '',
        joinedAt: '',
        isActive: true,
      });

      alert('Worker created successfully!');
    } catch (err: any) {
      console.error('Error creating worker:', err);

      if (err.response) {
        const message = err.response.data?.message || 'Server error occurred';
        setError(message);
      } else if (err.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card variant="elevated">
        <Card.Header>
          <Card.Title>Add New Worker</Card.Title>
          <Card.Description>Enter worker details to register a new employee</Card.Description>
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
                <DatePicker
                  label="Joined Date"
                  value={formData.joinedAt || null}
                  onChange={(date) => handleChange('joinedAt', date || '')}
                />
              </div>

              {/* No Switch component available, so show as text */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Active Worker</span>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="ml-2"
                />
              </div>
            </div>
          </Card.Content>

          <Card.Footer className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              icon={loading ? undefined : <Plus className="w-4 h-4" />}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Saving...' : 'Save Worker'}
            </Button>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
};
