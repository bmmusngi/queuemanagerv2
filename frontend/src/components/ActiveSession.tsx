import React, { useState, useEffect } from 'react';

// Added interface to prevent the TS "Exit Code 2" error
interface ActiveSessionProps {
  onSessionUpdate?: (info: { id: string; groupName: string }) => void;
}

export default function ActiveSession({ onSessionUpdate }: ActiveSessionProps) {
  // --- SESSION STATE ---
  const [activeSession, setActiveSession] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]); // Fetched from backend
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  
  // --- PLAYER & MODAL STATE ---
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState('member'); // 'member' or 'walkin'
  const [sortBy, setSortBy] = useState('waitTime');
  
  // Cleaned state for real usage
  const [players, setPlayers] = useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);

  // --- FORM STATES ---
  const [setupGroupId, setSetupGroupId] = useState(''); // New state for dropdown
  const [venue, setVenue] = useState('');
  const [courtCount, setCourtCount] = useState(2);
  const [walkinName, setWalkinName] = useState('');

  const API_BASE = 'http://100.88.175.25:3001/api';

  // --- 1. FETCH GROUPS (For Setup) ---
  useEffect(() => {
    if (showCreateModal) {
      fetch(`${API_BASE}/queueing-groups`)
        .then(res => res.json())
        .then(data => setGroups(data))
        .catch(console.error);
    }
  }, [showCreateModal]);

  // --- 2. FETCH MEMBERS (For Check-in) ---
  useEffect(() => {
    if (showAddPlayerModal && addPlayerTab === 'member' && activeSession?.queueingGroupId) {
      fetch(`${API_BASE}/members?groupId=${activeSession.queueingGroupId}`)
        .then(res => res.json())
        .then(data => {
          // Filter out people already in the players array
          const checkedInIds = players.map(p => p.memberId);
          setAvailableMembers(data.filter((m: any) => !checkedInIds.includes(m.id)));
        })
        .catch(console.error);
    }
  }, [showAddPlayerModal, addPlayerTab, activeSession, players]);

  // --- ACTIONS ---
  const handleStartSession = async () => {
    if (!setupGroupId || !venue) return alert("Please fill in all fields!");

    // 1. Transform the data to match the DTO requirements
    const selectedGroup = groups.find(g => g.id === setupGroupId);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const generatedId = `${dateStr}-${selectedGroup?.name.substring(0, 3).toUpperCase() || 'SES'}`;
    const namesArray = Array.from({ length: courtCount }).map((_, i) => `Court ${i + 1}`);

    // 2. The Payload exactly matches CreateSessionDto
    const payload = {
      id: generatedId,
      queueingGroupId: setupGroupId,
      venue: venue,
      courtNames: namesArray
    };

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedSession = await res.json(); 
        setActiveSession(savedSession);
        setShowCreateModal(false);
        
        if (onSessionUpdate && selectedGroup) {
          onSessionUpdate({ id: savedSession.id, groupName: selectedGroup.name });
        }
      } else {
        alert("Failed to create session. Check backend logs.");
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("Failed to connect to backend");
    }
  };

  const handleEndSession = async () => {
    if (activeSession) {
      await fetch(`${API_BASE}/sessions/${activeSession.id}/end`, { method: 'PUT' });
    }
    setActiveSession(null);
    setShowEndModal(false);
    if (onSessionUpdate) onSessionUpdate({ id: '---', groupName: '---' });
  };

  const handleAddFromMember = (member: any) => {
    const newPlayer = {
      id: Date.now().toString(),
      memberId: member.id, // Keeping track of DB ID
      name: member.name,
      level: member.levelWeight,
      games: 0,
      waitTime: '0m',
      status: 'Available',
      isActive: true,
      isWalkin: false
    };
    setPlayers([...players, newPlayer]);
    setShowAddPlayerModal(false);
  };

  const handleAddWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName) return;
    const newPlayer = {
      id: Date.now().toString(),
      name: walkinName,
      level: 1,
      games: 0,
      waitTime: '0m',
      status: 'Available',
      isActive: true,
      isWalkin: true
    };
    setPlayers([...players, newPlayer]);
    setWalkinName('');
    setShowAddPlayerModal(false);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  // --- 1. EMPTY STATE ---
  if (!activeSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏸</div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2 italic">No Active Session</h2>
          <button onClick={() => setShowCreateModal(true)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">
            Create Session
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Session Setup</h3>
              <div className="space-y-4">
                {/* NEW GROUP DROPDOWN */}
                <select 
                  value={setupGroupId} 
                  onChange={e => setSetupGroupId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-slate-700"
                >
                  <option value="">-- Select Group --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                <input type="number" value={courtCount} onChange={e => setCourtCount(parseInt(e.target.value))} placeholder="Courts" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                
                <div className="flex space-x-2 pt-4">
                  <button onClick={handleStartSession} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-md">Go Live</button>
                  <button onClick={() => setShowCreateModal(false)} className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 2. ACTIVE BOARD ---
  return (
    <div className="flex flex-col h-full space-y-4 relative">
      
      {/* SUB-HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <h2 className="font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px]">{activeSession.venue}</h2>
            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
          </div>
          <div className="flex space-x-2 border-l pl-6 border-slate-100">
            <button onClick={() => setShowAddPlayerModal(true)} className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-lg uppercase tracking-wider shadow-sm">+ Add Player</button>
            <button className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-wider">Draft Game</button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">End Session</button>
      </div>

      {/* KANBAN */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-8">
        
        {/* PLAYER COLUMN */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Queue ({players.length})</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-[9px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer">
              <option value="available">Available First</option>
              <option value="waitTime">Wait Time ▽</option>
              <option value="alphabetical">Name A-Z</option>
              <option value="level">Level ▽</option>
            </select>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {players.length === 0 && (
               <div className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase italic tracking-widest opacity-60">No players checked in</div>
            )}
            {players.map(p => (
              <div key={p.id} className={`p-3 rounded-xl border-2 transition-all shadow-sm group ${!p.isActive ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'Playing' ? 'bg-blue-500 animate-pulse' : p.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {p.isWalkin && <span className="text-[7px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase">Guest</span>}
                    <span className="text-[9px] font-black text-slate-300 italic">L{p.level}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                    <span>{p.games} Games</span>
                    <span>{p.waitTime} Wait</span>
                  </div>
                  {p.games === 0 && p.status !== 'Playing' && (
                    <button onClick={() => removePlayer(p.id)} className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-red-500 hover:underline uppercase transition-opacity">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING COLUMN */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2">Pending Games</h3>
          <div className="flex-1 space-y-3 bg-slate-100/30 rounded-2xl p-3 border-2 border-dashed border-slate-200 overflow-y-auto">
            <div className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase italic tracking-widest opacity-40">Drag players here</div>
          </div>
        </div>

        {/* COURTS COLUMN */}
        <div className="flex-1 min-w-[450px] flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courts ({activeSession.courts?.length || 0})</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase">+ Add Court</button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeSession.courts?.map((c: any) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-2.5 flex justify-between items-center">
                  <input defaultValue={c.name} className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-2 rounded w-24" />
                  <span className="text-[8px] font-bold bg-green-500 text-white px-2 py-0.5 rounded uppercase">{c.status}</span>
                </div>
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Ready</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD PLAYER MODAL */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex border-b bg-slate-50">
              <button onClick={() => setAddPlayerTab('member')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${addPlayerTab === 'member' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>From Group</button>
              <button onClick={() => setAddPlayerTab('walkin')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${addPlayerTab === 'walkin' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Walk-in</button>
            </div>
            <div className="p-6">
              {addPlayerTab === 'member' ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {availableMembers.length === 0 && (
                    <div className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">No members available</div>
                  )}
                  {availableMembers.map(m => (
                    <button key={m.id} onClick={() => handleAddFromMember(m)} className="w-full flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 group transition-all">
                      <span className="font-bold text-slate-700">{m.name}</span>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase">Check-in</span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleAddWalkin} className="space-y-4">
                  <input autoFocus value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex space-x-2">
                    <select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"><option>Level 1</option><option>Level 2</option></select>
                    <select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"><option>Male</option><option>Female</option></select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-100">Add to Queue</button>
                </form>
              )}
              <button onClick={() => setShowAddPlayerModal(false)} className="w-full mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* END SESSION MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase italic">Finish Session?</h3>
            <button onClick={handleEndSession} className="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest mb-2 shadow-lg shadow-red-100">Confirm Close</button>
            <button onClick={() => setShowEndModal(false)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase">Back to Game</button>
          </div>
        </div>
      )}
    </div>
  );
}
