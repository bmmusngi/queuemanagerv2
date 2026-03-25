import React, { useState } from 'react';

export default function ActiveSession() {
  // --- UI STATES ---
  const [showEndModal, setShowEndModal] = useState(false);
  const [sortBy, setSortBy] = useState({ field: 'waitTime', order: 'desc' });

  // --- MOCK DATA (Enhanced) ---
  const mockPlayers = [
    { id: '1', name: 'Joel (Coach)', level: 3, games: 2, waitTime: '15m', status: 'Available', isActive: true },
    { id: '2', name: 'Maria Clara', level: 1, games: 1, waitTime: '5m', status: 'Playing', isActive: true },
    { id: '3', name: 'Juan Dela Cruz', level: 2, games: 3, waitTime: '2m', status: 'Available', isActive: false }, // Taking a break
    { id: '4', name: 'Snorlax', level: 1, games: 0, waitTime: '45m', status: 'Available', isActive: true },
  ];

  const mockPendingGames = [
    { id: 'g1', teamA: ['Juan', 'Joel'], teamB: ['Maria', 'Snorlax'], type: 'Doubles', matchNo: 1 },
    { id: 'g2', teamA: ['Player 5'], teamB: ['Player 6'], type: 'Singles', matchNo: 2 },
  ];

  const mockCourts = [
    { id: 'c1', name: 'Court 1', status: 'Occupied', isActive: true, game: { teamA: 'Team Alpha', teamB: 'Team Beta' } },
    { id: 'c2', name: 'Court 2', status: 'Available', isActive: true, game: null },
    { id: 'c3', name: 'Court 3', status: 'Inactive', isActive: false, game: null },
  ];

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      
      {/* 1. SUB-HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <h2 className="font-black text-slate-800 uppercase tracking-tight">Active Session</h2>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Live</span>
          </div>
          <div className="flex space-x-2 border-l pl-6 border-slate-100">
            <button className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-lg uppercase tracking-wider">+ Add Player</button>
            <button className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-wider">Draft Game</button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowEndModal(true)}
          className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all"
        >
          End Session
        </button>
      </div>

      {/* 2. KANBAN BOARD */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-10">
        
        {/* COLUMN 1: PLAYERS */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          <div className="px-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase">Players ({mockPlayers.length})</h3>
              <select className="text-[9px] font-bold bg-transparent text-slate-500 outline-none">
                <option>Sort: Wait Time (Desc)</option>
                <option>Sort: Alphabetical (Asc)</option>
                <option>Sort: Games Played (Asc)</option>
                <option>Sort: Level (Desc)</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {mockPlayers.map(p => (
              <div key={p.id} className={`p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing shadow-sm ${!p.isActive ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'Playing' ? 'bg-blue-500' : p.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400">L{p.level}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                  <span>{p.games} Games</span>
                  <span>{p.waitTime} wait</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: PENDING GAMES */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2">Pending Games</h3>
          <div className="flex-1 space-y-3 bg-slate-100/30 rounded-2xl p-3 border-2 border-dashed border-slate-200 overflow-y-auto">
            {mockPendingGames.map((g, idx) => (
              <div key={g.id} className="bg-white rounded-xl shadow-md border-l-4 border-blue-500 cursor-move relative group">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match #{g.matchNo}</span>
                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{g.type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-700 truncate">{g.teamA.join(' & ')}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Team A</div>
                    </div>
                    <div className="px-3 text-[9px] font-black text-slate-300">VS</div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-700 truncate">{g.teamB.join(' & ')}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Team B</div>
                    </div>
                  </div>
                </div>
                
                {/* Inline Actions (Visible on Hover/Tap) */}
                <div className="border-t flex divide-x bg-slate-50 rounded-b-xl">
                  <button className="flex-1 py-1.5 text-[8px] font-black uppercase text-slate-500 hover:text-blue-600">Edit</button>
                  <button className="flex-1 py-1.5 text-[8px] font-black uppercase text-slate-500 hover:text-red-500">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3: ACTIVE COURTS */}
        <div className="flex-1 min-w-[450px] flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Active Courts ({mockCourts.length})</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase">+ Add Court</button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mockCourts.map(c => (
              <div key={c.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!c.isActive ? 'opacity-50 grayscale' : ''}`}>
                <div className="bg-slate-800 p-2.5 flex justify-between items-center">
                  <input 
                    defaultValue={c.name} 
                    className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-1 rounded transition-colors"
                  />
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'Occupied' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                      {c.status}
                    </span>
                    <button className="text-white opacity-40 hover:opacity-100"><i className="text-[10px]">⚙️</i></button>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col items-center justify-center min-h-[100px]">
                  {c.game ? (
                    <div className="w-full space-y-3">
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-800">{c.game.teamA} vs {c.game.teamB}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">Finish</button>
                        <button className="px-3 py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg">Reassign</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[10px] font-black uppercase tracking-tighter">Ready for Match</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. END SESSION MODAL (Overlay) */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">End Session?</h3>
            <p className="text-slate-500 text-sm mb-6">This will complete all active games and close the current queue. This action cannot be undone.</p>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setShowEndModal(false)}
                className="w-full py-3 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest"
              >
                Yes, Close Session
              </button>
              <button 
                onClick={() => setShowEndModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-black rounded-xl uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
