import React, { useState, useEffect } from 'react';

export default function GameHistoryTable({ sessionId }: { sessionId?: string }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'https://shirostor.tailf23fe.ts.net:3001/api';

  const fetchGames = () => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`${API_BASE}/games/session/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only completed games and sort descending by endedAt if available
          const completed = data.filter(g => g.status === 'COMPLETED');
          completed.sort((a, b) => new Date(b.endedAt || b.createdAt).getTime() - new Date(a.endedAt || a.createdAt).getTime());
          setGames(completed);
        }
      })
      .catch(err => console.error("Error fetching games:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGames();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Session Selected</div>
        <p className="text-slate-500 text-sm mt-2">Please select or start a session to view its game history.</p>
      </div>
    );
  }

  // Aggregate Stats
  const totalGames = games.length;
  const totalShuttles = games.reduce((acc, g) => acc + (g.shuttlesUsed || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header and Stats */}
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Session History</h2>
          <p className="text-slate-500 text-xs mt-1">ID: {sessionId}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-slate-200 hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase">Games</div>
            <div className="font-black text-slate-800 text-lg">{totalGames}</div>
          </div>
          <div className="text-center px-4 border-r border-slate-200 hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase">Shuttles</div>
            <div className="font-black text-slate-800 text-lg">{totalShuttles}</div>
          </div>
          <button 
            onClick={fetchGames}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs uppercase hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-white border-b border-slate-200">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-4">Time Completed</th>
              <th className="p-4">Team A</th>
              <th className="p-4 text-center">Winner</th>
              <th className="p-4">Team B</th>
              <th className="p-4 text-center">Shuttles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {games.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase text-xs italic opacity-50">
                  No completed games record found for this session.
                </td>
              </tr>
            ) : (
              games.map(game => {
                const endedTime = game.endedAt ? new Date(game.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
                
                return (
                  <tr key={game.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">{endedTime}</td>
                    
                    {/* Team A Data */}
                    <td className="p-4">
                      <div className={`text-sm font-bold ${game.winner === 'TeamA' ? 'text-green-600' : 'text-slate-700'}`}>
                        {game.teamA?.map((p: any) => p.name).join(' & ')}
                      </div>
                      {game.winner === 'TeamA' && <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase mt-1 inline-block">Winner</span>}
                    </td>

                    <td className="p-4 text-center">
                      <span className="text-slate-300 mx-2 font-black text-xs">VS</span>
                    </td>

                    {/* Team B Data */}
                    <td className="p-4">
                      <div className={`text-sm font-bold ${game.winner === 'TeamB' ? 'text-green-600' : 'text-slate-700'}`}>
                        {game.teamB?.map((p: any) => p.name).join(' & ')}
                      </div>
                      {game.winner === 'TeamB' && <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase mt-1 inline-block">Winner</span>}
                    </td>

                    <td className="p-4 text-center font-bold text-slate-700 text-sm">
                      {game.shuttlesUsed}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
