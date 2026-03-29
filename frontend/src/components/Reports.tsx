import React, { useState, useEffect } from 'react';
import GameHistoryTable from './GameHistoryTable';

export default function Reports() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const API_BASE = 'https://shirostor.tailf23fe.ts.net:8459/api';

  // Load backend session history
  useEffect(() => {
    fetch(`${API_BASE}/sessions/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
          // Auto-select the most recent one if we want, currently it defaults to ''
        }
      })
      .catch(err => console.error("Error loading session history:", err));
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Intro Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Post-Session Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Review the historical game data for any past setup.</p>
      </div>

      {/* Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Select a Session</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full lg:w-1/2 p-3 border-2 border-slate-100 rounded-lg bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">-- Choose Historical Session --</option>
          {sessions.map((s: any) => {
            const dateStr = new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const groupName = s.queueingGroup?.name || 'Unknown Group';
            return (
              <option key={s.id} value={s.id}>
                {dateStr} | {groupName} ({s.venue || 'No Venue'}) - {s.status}
              </option>
            );
          })}
        </select>
      </div>

      {/* Table */}
      {selectedSessionId && <GameHistoryTable sessionId={selectedSessionId} />}
    </div>
  );
}
