import React, { useState } from 'react';
import { TopHeader, RibbonNav } from './Navigation';
import { ComingSoon } from './ComingSoon';
import QueueingGroupManager from './QueueingGroup';
import MemberManager from './MemberManager';
import ActiveSession from './ActiveSession';
import Admin from './Admin';
import History from './History';
import Reports from './Reports';

export const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('session');
  const [globalSession, setGlobalSession] = useState<any>(null);

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
        <div className="max-w-7xl mx-auto h-full relative">
          <div className={activeTab === 'session' ? 'block h-full' : 'hidden h-full'}><ActiveSession onSessionUpdate={setGlobalSession} /></div>
          <div className={activeTab === 'members' ? 'block h-full' : 'hidden h-full'}><MemberManager preselectedGroupId={globalSession?.queueingGroupId} /></div>
          <div className={activeTab === 'group' ? 'block h-full' : 'hidden h-full'}><QueueingGroupManager /></div>
          <div className={activeTab === 'admin' ? 'block h-full' : 'hidden h-full'}><Admin /></div>
          
          <div className={activeTab === 'history' ? 'block h-full' : 'hidden h-full'}><History globalSession={globalSession} /></div>
          <div className={activeTab === 'reports' ? 'block h-full' : 'hidden h-full'}><Reports /></div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="shrink-0 border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} ShiroBen@PuticatPlays. All rights reserved.</span>
          <a
            href="mailto:puticatplays@gmail.com"
            className="hover:text-slate-600 transition-colors underline underline-offset-2"
          >
            puticatplays@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
};
