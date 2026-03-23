import React from 'react';

// --- HEADER COMPONENT ---
export const TopHeader = ({ sessionName, groupId }: { sessionName: string, groupId: string }) => {
  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div>
        <h1 className="text-xl font-bold tracking-wide">COURT MANAGER</h1>
      </div>
      <div className="flex space-x-6 text-sm">
        <div className="flex flex-col text-right">
          <span className="text-slate-400 text-xs uppercase font-semibold">Active Group</span>
          <span className="font-medium">{groupId || 'No Group Selected'}</span>
        </div>
        <div className="flex flex-col text-right border-l border-slate-700 pl-6">
          <span className="text-slate-400 text-xs uppercase font-semibold">Session ID</span>
          <span className="font-medium text-emerald-400">{sessionName || 'Not Started'}</span>
        </div>
      </div>
    </header>
  );
};

// --- RIBBON COMPONENT ---
export const RibbonNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'session', label: 'Active Session' },
    { id: 'members', label: 'Members' },
    { id: 'history', label: 'Game History' },
    { id: 'group', label: 'Queueing Group' },
    { id: 'reports', label: 'Reports' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-8 py-4 text-sm font-semibold uppercase tracking-wider transition-colors
              border-b-4 focus:outline-none
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
