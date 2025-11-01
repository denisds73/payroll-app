import { MdCheckCircle } from 'react-icons/md';
import Badge from '../components/ui/Badge';

export default function TestPage() {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Badge text="Active" variant="success" />
      <Badge text="Inactive" variant="error" />
      <Badge text="Pending" variant="warning" />
      <Badge text="Info" variant="info" />
      <Badge text="Default" />
      <Badge text="Success" variant="success" icon={<MdCheckCircle />} />
    </div>
  );
}
