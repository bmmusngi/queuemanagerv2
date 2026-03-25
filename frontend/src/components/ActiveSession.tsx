import React, { useState, useEffect } from 'react';

// This interface prevents the TypeScript 'Exit Code 2' build error
interface ActiveSessionProps {
  onSessionUpdate: (info: { id: string; groupName: string }) => void;
}

export default function ActiveSession({ onSessionUpdate }: ActiveSessionProps) {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [setupGroupId, setSetupGroupId] = useState('');
  const [setupVenue, setSetupVenue] = useState('');
  const [setupCourtCount, setSetupCourtCount] = useState(2);

  const API_BASE = 'http://100.88.175.25:3001/api';

  useEffect(() => {
    if (showCreateModal) {
      fetch(`${API_BASE}/queueing-groups`)
        .then(res => res.json())
        .then(data => setGroups(data))
        .catch(err => console.error("Fetch groups error:", err));
    }
  }, [showCreateModal]);

  const handleStartSession = async () => {
    if (!setupGroupId || !setupVenue) return alert("Select a Group and Venue!");

    const selectedGroup = groups.find(g => g.id === setupGroupId);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const generatedId = `${dateStr}-${selectedGroup.name.substring(0, 3).toUpperCase()}`;
    
    // Transform number into array of names for the DTO
    const namesArray = Array.from({ length: setupCourtCount }).map((_, i) => `Court ${i + 1}`);

    const payload = {
      id: generatedId,
      queueingGroupId: setupGroupId,
      venue: setupVenue,
      courtNames: namesArray
    };

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setShowCreateModal(false);
        // Sync with Dashboard Header
        onSessionUpdate({ id: data.id, groupName: selectedGroup.name });
      }
    } catch (err) {
      alert("Backend connection failed. Is the server running?");
    }
  };

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-5xl">🏸</div>
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Active Session</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all"
          >
            Setup Today's Session
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight text-center">Session Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Queueing Group</label>
                  <select 
                    value={setupGroupId} 
                    onChange={e => setSetupGroupId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Pick a Club --</option>
                    {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Venue</label>
                  <input value={setupVenue} onChange={e => setSetupVenue(e.target.value)} placeholder="e.g. Metro Sports" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Courts</label>
                  <input type="number" value={setupCourtCount} onChange={e => setSetupCourtCount(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button onClick={handleStartSession} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs">Go Live</button>
                  <button onClick={() => setShowCreateModal(false)} className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-black text-slate-800 uppercase text-lg">{activeSession.venue}</h2>
          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">SID: {activeSession.id}</p>
        </div>
        <button 
          onClick={() => {
            setActiveSession(null); 
            onSessionUpdate({id: '---', groupName: '---'});
          }} 
          className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase"
        >
          End Session
        </button>
      </div>
      
      {/* Placeholder for the upcoming Kanban Board */}
      <div className="h-64 border-4 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
        <span className="text-slate-300 font-black uppercase italic tracking-widest">Session Ready - Next: Add Players</span>
      </div>
    </div>
  );
}
