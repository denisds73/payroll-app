import { useState } from 'react';
import OTInputStepper from '../components/ui/OTInputStepper';

export default function OTInputStepperTestPage() {
  const [ot, setOt] = useState(0); // Start at 0 OT

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">OT Stepper (Test)</h2>
      <OTInputStepper
        value={ot}
        onChange={setOt}
        step={0.5}
        min={0}
        max={3}
        // Try adding/removing disabled={true} to test lock logic!
      />
      <div>
        <span>Current OT value: {ot}</span>
      </div>
    </div>
  );
}
