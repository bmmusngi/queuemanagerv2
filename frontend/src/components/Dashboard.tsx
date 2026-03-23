import React, { useState } from 'react';
import { TopHeader, RibbonNav } from './Navigation';
import { ComingSoon } from './ComingSoon';

export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('session');

  // Placeholder static data (eventually fetched via your NestJS API)
  const currentSession = {
    id: '20260323A001',
    groupId: 'Tuesday Smashers',
  };

  // Dynamically render the active view
  const renderContent = () => {
    switch (activeTab) {
      case 'session':
        return <ComingSoon title="Active Session Dashboard" />;
      case 'members':
        return <ComingSoon title="Group Members Directory" />;
      case 'history':
        return <ComingSoon title="Session Game History" />;
      case 'group':
        return <ComingSoon title="Queueing Group Details" />;
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
      {/* The padding ensures it doesn't hug the tablet edges too tightly */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
