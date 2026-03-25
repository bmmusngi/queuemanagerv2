import React, { useState, useEffect } from 'react';

export default function ActiveSession({ onSessionUpdate }) {
  // --- SESSION & DATA STATE ---
  const [activeSession, setActiveSession] = useState(null);
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  
  // --- MODAL & UI STATE ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState('member'); 
  const [sortBy, setSortBy] = useState('available');

  // --- FORM STATES (For Setup) ---
  const [setupVenue, setSetupVenue] = useState('');
  const [setupGroupId, setSetupGroupId] = useState('');
  const [setupCourtCount, setSetupCourtCount] = useState(2);
  const [walkinName, setWalkinName] = useState('');

  const API_BASE = 'http://100.88.175.25:3001/api';

  // 1. Fetch groups when the setup modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetch(`${API_BASE}/queueing-groups`)
        .then(res => res.json())
        .then(data => setGroups(data))
        .catch(err => console.error("Error fetching groups:", err));
    }
  }, [showCreateModal]);

  // 2. Fetch members when adding a player
  const fetchGroupMembers = async () => {
    if (!activeSession?.groupId) return;
    const res = await fetch(`${API_BASE}/members?groupId=${activeSession.groupId}`);
    const data = await res.json();
    const checkedInIds = players.map(p => p.memberId);
    setAvailableMembers(data.filter(m => !checkedInIds.includes(m.id)));
  };

  useEffect(() => {
    if (showAddPlayerModal && addPlayerTab === 'member') fetchGroupMembers();
  }, [showAddPlayerModal, addPlayerTab]);

  // --- SESSION ACTIONS ---
  const handleStartSession = () => {
    if (!setupGroupId || !setupVenue) return alert("Please fill in all fields!");

    const selectedGroup = groups.find(g => g.id === setupGroupId);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const generatedId = `${dateStr}-${selectedGroup.name.substring(0, 3).toUpperCase()}`;
    
    const sessionData = {
      id: generatedId,
      venue: setupVenue,
      groupId: setupGroupId,
      groupName: selectedGroup.name,
      courts: Array.from({ length: setupCourtCount }).map((_, i) => ({
        id: `c${i+1}`, name: `Court ${i+1}`, status: 'Available', game: null
      }))
    };

    setActiveSession(sessionData);
    setShowCreateModal(false);
    
    // Pass the new Session ID and Group Name up to Dashboard/TopHeader
    if (onSessionUpdate) {
      onSessionUpdate({ id: generatedId, groupName: selectedGroup.name });
    }
  };

  const handleEndSession = () => {
    setActiveSession(null);
    setShowEndModal(false);
    if (onSessionUpdate) onSessionUpdate({ id: '---', groupName: '---' });
  };

  // --- PLAYER ACTIONS ---
  const checkInMember = (m) => {
    const newP = { id: Date.now().toString(), memberId: m.id, name: m.name, level: m.levelWeight, games: 0, waitTime: '0m', status: 'Available', isActive: true };
    setPlayers([...players, newP]);
    setShowAddPlayerModal(false);
  };

  const addWalkin = (e) => {
    e.preventDefault();
    if (!walkinName) return;
    const newP = { id: Date.now().toString(), name: walkinName, level: 1, games: 0, waitTime: '0m', status: 'Available', isActive: true, isWalkin: true };
    setPlayers([...players, newP]);
    setWalkinName('');
    setShowAddPlayerModal(false);
  };

  // --- RENDER: EMPTY STATE ---
  if (!activeSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏸</div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4 italic">No Active Session</h2>
          <button onClick={() => setShowCreateModal(true)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Setup Today's Session</button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Session Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Queueing Group</label>
                  <select 
                    value={setupGroupId} onChange={e => setSetupGroupId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Group --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Venue</label>
                  <input value={setupVenue} onChange={e => setSetupVenue(e.target.value)} placeholder="e.g. Metro Sports" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Number of Courts</label>
                  <input type="number" value={setupCourtCount} onChange={e => setSetupCourtCount(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
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

  // --- RENDER: ACTIVE BOARD ---
  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <h2 className="font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">{activeSession.venue}</h2>
            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
          </div>
          <div className="flex space-x-2 border-l pl-6 border-slate-100">
            <button onClick={() => setShowAddPlayerModal(true)} className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-lg uppercase tracking-wider shadow-sm">+ Add Player</button>
            <button className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-wider">Draft Game</button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">End Session</button>
      </div>

      <div className="flex flex-1 space-x-6 overflow-x-auto pb-6">
        {/* PLAYER COLUMN */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Queue ({players.length})</h3>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-[9px] font-bold bg-transparent text-slate-500 outline-none">
              <option value="available">Available First</option>
              <option value="waitTime">Wait Time ▽</option>
              <option value="level">Level ▽</option>
            </select>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {players.map(p => (
              <div key={p.id} className="p-3 rounded-xl border-2 bg-white border-transparent shadow-sm group">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Playing' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-300">L{p.level}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-3 text-[8px] font-black text-slate-400 uppercase">
                    <span>{p.games} Games</span>
                    <span>{p.waitTime} Wait</span>
                  </div>
                  {p.games === 0 && p.status !== 'Playing' && (
                    <button onClick={() => setPlayers(players.filter(x => x.id !== p.id))} className="text-[8px] font-black text-red-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING COLUMN */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2">Pending Games</h3>
          <div className="flex-1 bg-slate-100/30 rounded-2xl p-3 border-2 border-dashed border-slate-200" />
        </div>

        {/* COURTS COLUMN */}
        <div className="flex-1 min-w-[450px] flex flex-col space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2">Courts</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeSession.courts.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-2 flex justify-between items-center">
                  <span className="text-white font-black text-[10px] uppercase px-2">{c.name}</span>
                  <span className="text-[8px] font-bold bg-green-500 text-white px-2 py-0.5 rounded uppercase">{c.status}</span>
                </div>
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Ready</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex border-b bg-slate-50">
              <button onClick={() => setAddPlayerTab('member')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${addPlayerTab === 'member' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Group</button>
              <button onClick={() => setAddPlayerTab('walkin')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${addPlayerTab === 'walkin' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Walk-in</button>
            </div>
            <div className="p-6">
              {addPlayerTab === 'member' ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {availableMembers.map(m => (
                    <button key={m.id} onClick={() => checkInMember(m)} className="w-full flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:bg-blue-50 transition-all">
                      <span className="font-bold text-slate-700">{m.name}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase">Check-in</span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={addWalkin} className="space-y-4">
                  <input value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="Full Name" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" />
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest">Add Walk-in</button>
                </form>
              )}
              <button onClick={() => setShowAddPlayerModal(false)} className="w-full mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tighter italic">End Session?</h3>
            <button onClick={handleEndSession} className="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest mb-2 shadow-lg shadow-red-100">Confirm Close</button>
            <button onClick={() => setShowEndModal(false)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Back to Game</button>
          </div>
        </div>
      )}
    </div>
  );
}
