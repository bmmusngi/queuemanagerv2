import React, { useState } from 'react';
import { TopHeader, RibbonNav } from './Navigation';
import { ComingSoon } from './ComingSoon';
import QueueingGroupManager from './QueueingGroup';
import MemberManager from './MemberManager';
import ActiveSession from './ActiveSession';


export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('session');

  // Placeholder static data (eventually fetched via your NestJS API)
  const currentSession = {
    id: '20260323A001',
    groupId: 'TUD Badminton',
  };

  // Dynamically render the active view
  const renderContent = () => {
    switch (activeTab) {
      case 'session':
        return <ActiveSession />;
      case 'members':
        return <MemberManager />;
      case 'history':
        return <ComingSoon title="Session Game History" />;
      case 'group':
        return <QueueingGroupManager />;                            //QueueingGroup.tsx
      case 'reports':
        return <ComingSoon title="Player & Session Reports" />;
      case 'admin':
        return <ComingSoon title="System Administration" />;
      default:
        return <ComingSoon title="Module" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <TopHeader 
        sessionName={currentSession.id} 
        groupId={currentSession.groupId} 
      />

      {/* Navigation Ribbon */}
      <RibbonNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content Area */}
 { /* THE FIX: Added pb-20 for that clean bottom margin */ }
 <main className="flex-grow p-6 overflow-y-auto pb-20"> 
      <div className="max-w-7xl mx-auto h-full">
        {renderContent()}
      </div>
    </main>
    </div>
  );
};
