import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/card';

export const AddWorker = () => {
  return (
    <div className="p-8">
      <Card variant="elevated">
        <Card.Header>
          <Card.Title>Add New Worker</Card.Title>
          <Card.Description>Enter worker details to register a new employee</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <p className="text-secondary">Form coming soon...</p>
            <div className="h-64 rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center">
              <p className="text-secondary">Worker Form Fields Here</p>
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button variant="outline">Cancel</Button>
          <Button icon={<Plus className="w-4 h-4" />}>Save Worker</Button>
        </Card.Footer>
      </Card>
    </div>
  );
};
