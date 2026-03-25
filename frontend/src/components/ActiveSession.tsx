import React, { useState, useEffect } from 'react';

export default function ActiveSession({ selectedGroupId }) {
  // --- UI STATES ---
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [sortBy, setSortBy] = useState({ field: 'waitTime', order: 'desc' });

  // --- FORM STATES ---
  const [venue, setVenue] = useState('');
  const [courtCount, setCourtCount] = useState(2);

  const API_BASE = 'http://100.88.175.25:3001/api';

  // --- MOCK DATA ---
  const mockPlayers = [
    { id: '1', name: 'Joel (Coach)', level: 3, games: 2, waitTime: '15m', status: 'Available', isActive: true },
    { id: '2', name: 'Maria Clara', level: 1, games: 1, waitTime: '5m', status: 'Playing', isActive: true },
    { id: '3', name: 'Juan Dela Cruz', level: 2, games: 3, waitTime: '2m', status: 'Available', isActive: false },
    { id: '4', name: 'Snorlax', level: 1, games: 0, waitTime: '45m', status: 'Available', isActive: true },
  ];

  const mockPendingGames = [
    { id: 'g1', teamA: ['Juan', 'Joel'], teamB: ['Maria', 'Snorlax'], type: 'Doubles', matchNo: 1 },
  ];

  // --- ACTIONS ---
  const handleStartSession = async () => {
    const sessionId = `${new Date().toISOString().split('T')[0].replace(/-/g, '')}${selectedGroupId?.substring(0, 4).toUpperCase() || 'SES'}`;
    
    setActiveSession({
      id: sessionId,
      venue: venue || 'Unnamed Venue',
      courts: Array.from({ length: courtCount }).map((_, i) => ({
        id: `c${i + 1}`,
        name: `Court ${i + 1}`,
        status: 'Available',
        isActive: true,
        game: null
      }))
    });
    setShowCreateModal(false);
  };

  const handleEndSession = () => {
    setActiveSession(null);
    setVenue('');
    setCourtCount(2);
    setShowEndModal(false);
  };

  // --- 1. EMPTY STATE RETURN ---
  if (!activeSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 pb-24">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏸</div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2 italic">Ready to Play?</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">No active session found for this group. Set up your courts to begin queueing.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
          >
            Create Session
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Session Setup</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Venue</label>
                  <input 
                    value={venue} onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Metro Sports Center"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Courts Available</label>
                  <input 
                    type="number" value={courtCount} onChange={e => setCourtCount(parseInt(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button onClick={handleStartSession} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-md">Go Live</button>
                  <button onClick={() => setShowCreateModal(false)} className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-xs tracking-widest">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    ); // End of Empty State Return
  }

  // --- 2. ACTIVE KANBAN RETURN ---
  return (
    <div className="flex flex-col h-full space-y-4 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <h2 className="font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px]">{activeSession.venue}</h2>
            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Live</span>
          </div>
          <div className="flex space-x-2 border-l pl-6 border-slate-100">
            <button className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-lg uppercase tracking-wider">+ Add Player</button>
            <button className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-wider">Draft Game</button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">
          End Session
        </button>
      </div>

      {/* COLUMNS */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-6">
        
        {/* PLAYERS */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Players ({mockPlayers.length})</h3>
            <select className="text-[9px] font-bold bg-transparent text-slate-500 outline-none">
              <option>Sort: Wait Time ▽</option>
              <option>Sort: Alphabetical △</option>
              <option>Sort: Games Played △</option>
              <option>Sort: Level ▽</option>
            </select>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {mockPlayers.map(p => (
              <div key={p.id} className={`p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm ${!p.isActive ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Playing' ? 'bg-blue-500' : p.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-300">L{p.level}</span>
                </div>
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                  <span>{p.games} Games Played</span>
                  <span>{p.waitTime} waiting</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2">Pending Games</h3>
          <div className="flex-1 space-y-3 bg-slate-100/30 rounded-2xl p-3 border-2 border-dashed border-slate-200 overflow-y-auto">
            {mockPendingGames.map((g) => (
              <div key={g.id} className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 cursor-move relative overflow-hidden">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match #{g.matchNo}</span>
                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{g.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-center px-2">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-700 leading-tight">{g.teamA.join(' & ')}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Team A</div>
                    </div>
                    <div className="px-4 text-[9px] font-black text-slate-200 italic">VS</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-700 leading-tight">{g.teamB.join(' & ')}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">Team B</div>
                    </div>
                  </div>
                </div>
                <div className="border-t flex divide-x bg-slate-50/50">
                  <button className="flex-1 py-1.5 text-[8px] font-black uppercase text-slate-400">Edit</button>
                  <button className="flex-1 py-1.5 text-[8px] font-black uppercase text-slate-400">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COURTS */}
        <div className="flex-1 min-w-[450px] flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Active Courts ({activeSession.courts.length})</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase">+ Add Court</button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeSession.courts.map(c => (
              <div key={c.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!c.isActive ? 'opacity-40 grayscale' : ''}`}>
                <div className="bg-slate-800 p-2 flex justify-between items-center">
                  <input defaultValue={c.name} className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-2 rounded w-24" />
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'Occupied' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  {c.game ? (
                    <div className="w-full space-y-4">
                      <div className="text-center text-xs font-bold text-slate-800">{c.game.teamA} vs {c.game.teamB}</div>
                      <div className="flex space-x-2">
                        <button className="flex-1 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">Finish</button>
                        <button className="px-3 py-2.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg">Reassign</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[10px] font-black uppercase tracking-widest flex flex-col items-center">
                      <span className="text-xl mb-1 opacity-20">🏸</span>Ready
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* END SESSION MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">End Session?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">This completes all games and resets the queue.</p>
            <div className="flex flex-col space-y-3">
              <button onClick={handleEndSession} className="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest">Yes, End Session</button>
              <button onClick={() => setShowEndModal(false)} className="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-xl uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
