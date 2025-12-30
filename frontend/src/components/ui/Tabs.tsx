import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-6 py-3 font-medium text-sm transition-all
              border-b-2 flex items-center gap-2
              ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
