import { useState } from 'react';
import { SearchBar } from '../components/ui/SearchBar';

const TestPage = () => {
  const [value, setValue] = useState('');

  return <SearchBar value={value} onChange={setValue} placeholder="Search workers..." />;
};

export default TestPage;
