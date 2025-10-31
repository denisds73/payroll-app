import { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function TestPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '' });

  const handleSubmit = () => {
    const newErrors = {
      name: name.trim() === '' ? 'Name is required' : '',
      email: email.trim() === '' ? 'Email is required' : '',
    };
    setErrors(newErrors);
  };

  return (
    <div className="flex flex-col">
      <Input
        label="Enter name"
        error={errors.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Enter email"
        error={errors.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleSubmit} type="submit">
        Submit
      </Button>
    </div>
  );
}
