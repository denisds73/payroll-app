import { useEffect } from 'react';
import { salariesAPI } from '../services/api';

const TestPage = () => {
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

  return <div>Testing salariesAPI... Check console.</div>;
};

export default TestPage;
