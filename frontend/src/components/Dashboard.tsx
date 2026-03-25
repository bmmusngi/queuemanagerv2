import React, { useState } from 'react';
import { TopHeader, RibbonNav } from './Navigation';
import { ComingSoon } from './ComingSoon';
import QueueingGroupManager from './QueueingGroup';
import MemberManager from './MemberManager';
import ActiveSession from './ActiveSession';


export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('session');

  // NEW: State to track the live session info for the Header
    const [sessionInfo, setSessionInfo] = useState({
      id: '---',
      groupName: '---'
    });

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
        sessionName = { sessionInfo.id }
        groupId = { sessionInfo.groupName } 
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
          {activeTab === 'session' ? (
            // Pass the setter function down to the ActiveSession component
            <ActiveSession onSessionUpdate={(info) => setSessionInfo(info)} />
          ) : activeTab === 'members' ? (
            <MemberManager />
          ) : (
            <ComingSoon title="Module" />
          )}
        </div>
      </main>
    </div>
  );
};