import React, { useState } from 'react';

export default function ActiveSession() {
  // --- MOCK DATA FOR UI PREVIEW ---
  const mockPlayers = [
    { id: '1', name: 'Joel (Coach)', level: 3, games: 2, waitTime: '15m', status: 'Available' },
    { id: '2', name: 'Maria Clara', level: 1, games: 1, waitTime: '5m', status: 'Playing' },
    { id: '3', name: 'Juan Dela Cruz', level: 2, games: 3, waitTime: '2m', status: 'Available' },
    { id: '4', name: 'Snorlax', level: 1, games: 0, waitTime: '45m', status: 'Available' },
  ];

  const mockPendingGames = [
    { id: 'g1', teamA: ['Juan', 'Joel'], teamB: ['Maria', 'Snorlax'], type: 'Doubles' },
  ];

  const mockCourts = [
    { id: 'c1', name: 'Court 1', status: 'Occupied', game: { teamA: 'Team Alpha', teamB: 'Team Beta' } },
    { id: 'c2', name: 'Court 2', status: 'Available', game: null },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. SUB-HEADER ACTIONS */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <h2 className="font-black text-slate-800 uppercase tracking-tight">Active Session</h2>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Live</span>
        </div>
        <div className="flex space-x-2">
          <button className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100">+ Add Player</button>
          <button className="text-xs font-bold bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700">Draft Game</button>
          <button className="text-xs font-bold bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100">End Session</button>
        </div>
      </div>

      {/* 2. KANBAN BOARD */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-4">
        
        {/* COLUMN 1: PLAYERS */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase">Players (4)</h3>
            <div className="flex space-x-2 text-[10px] font-bold text-slate-500">
              <button className="text-blue-600 underline">All</button>
              <button>Available</button>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            {mockPlayers.map(p => (
              <div key={p.id} className={`p-4 rounded-xl border-2 transition-all ${p.status === 'Playing' ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-transparent shadow-sm hover:border-blue-200 cursor-grab'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800">{p.name}</span>
                  <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded">L{p.level}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Games: {p.games}</span>
                  <span className={p.status === 'Playing' ? 'text-blue-500' : 'text-orange-500'}>Wait: {p.waitTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: PENDING GAMES */}
        <div className="w-80 flex-shrink-0 flex flex-col space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase px-2">Pending Games</h3>
          <div className="flex-1 space-y-3 bg-slate-100/50 rounded-2xl p-2 border-2 border-dashed border-slate-200">
            {mockPendingGames.map(g => (
              <div key={g.id} className="bg-white p-4 rounded-xl shadow-md border-t-4 border-blue-500 cursor-move">
                <div className="text-[9px] font-black text-blue-500 uppercase mb-2">Next Up</div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Team A: <span className="text-slate-500">{g.teamA.join(', ')}</span></div>
                  <div className="text-[10px] font-black text-slate-300 text-center italic">VS</div>
                  <div className="text-xs font-bold text-slate-700">Team B: <span className="text-slate-500">{g.teamB.join(', ')}</span></div>
                </div>
              </div>
            ))}
            <div className="text-center py-10 text-slate-400 text-xs italic">Drag players here to draft</div>
          </div>
        </div>

        {/* COLUMN 3: ACTIVE GAMES (COURTS) */}
        <div className="flex-1 flex flex-col space-y-4 min-w-[400px]">
          <h3 className="text-xs font-black text-slate-400 uppercase px-2">Active Courts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockCourts.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-3 flex justify-between items-center">
                  <input 
                    defaultValue={c.name} 
                    className="bg-transparent text-white font-black text-xs uppercase outline-none focus:ring-1 focus:ring-blue-400 px-1 rounded"
                  />
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Occupied' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                    {c.status}
                  </span>
                </div>
                <div className="p-6 text-center">
                  {c.game ? (
                    <div className="space-y-4">
                      <div className="text-sm font-bold text-slate-800">{c.game.teamA} vs {c.game.teamB}</div>
                      <button className="w-full py-2 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">Finish Game</button>
                    </div>
                  ) : (
                    <div className="py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-xs font-bold uppercase">
                      Drop Game Here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
