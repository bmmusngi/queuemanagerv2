import React from 'react';
import GameHistoryTable from './GameHistoryTable';

export default function History({ globalSession }: { globalSession?: any }) {
  return (
    <div className="space-y-6 pb-10">
      {/* Intro Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Game History</h1>
        <p className="text-slate-500 text-sm mt-1">Review the completed matchups for your currently running session.</p>
      </div>

      <GameHistoryTable sessionId={globalSession?.id} />
    </div>
  );
}
