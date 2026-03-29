import React, { useState } from 'react';
import { TopHeader, RibbonNav } from './Navigation';
import { ComingSoon } from './ComingSoon';
import QueueingGroupManager from './QueueingGroup';
import MemberManager from './MemberManager';
import ActiveSession from './ActiveSession';
import Admin from './Admin';

export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('session');
  const [globalSession, setGlobalSession] = useState<any>(null);

  // Dynamically render the active view
  const renderContent = () => {
    switch (activeTab) {
      case 'session':
        return <ActiveSession onSessionUpdate={setGlobalSession} />;
      case 'members':
        return <MemberManager preselectedGroupId={globalSession?.queueingGroupId} />;
      case 'history':
        return <ComingSoon title="Session Game History" />;
      case 'group':
        return <QueueingGroupManager />;                            //QueueingGroup.tsx
      case 'reports':
        return <ComingSoon title="Player & Session Reports" />;
      case 'admin':
        return <Admin />;
      default:
        return <ComingSoon title="Module" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <TopHeader 
        sessionName={globalSession?.id} 
        groupId={globalSession?.queueingGroupId} 
      />

      {/* Navigation Ribbon */}
      <RibbonNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content Area */}
      {/* The padding ensures it doesn't hug the tablet edges too tightly */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
