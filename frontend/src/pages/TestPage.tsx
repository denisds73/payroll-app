import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import IssueAdvanceModal from '../components/modals/IssueAdvanceModal';
import { salariesAPI } from '../services/api';

const TestPage = () => {
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    const testCalculate = async () => {
      try {
        const result = await salariesAPI.calculate(3); // Your worker ID
        console.log(result);
      } catch (error) {
        console.error('Error calculating salary:', error);
      }
    };
    testCalculate();
  }, []);

  return (
    <div>
      <div>Testing salariesAPI... Check console.</div>
      <IssueAdvanceModal
        workerId={3}
        workerName="Test Worker"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => toast.success('Advance issued!')}
      />
      <button type="button" onClick={() => setModalOpen(true)}>
        Open IssueAdvanceModal
      </button>
    </div>
  );
};

export default TestPage;
