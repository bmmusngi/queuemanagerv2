import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function LobbyView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://100.88.175.25:8459/api';

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Session not found");
      const data = await res.json();
      setSession(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchSession, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error || !session) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h2 className="text-2xl font-black text-white uppercase italic">Session Unavailable</h2>
      <p className="text-slate-400 mt-2">The session might have ended or the link is invalid.</p>
    </div>
  );

  const activeGames = session.courts.filter((c: any) => c.status === 'OCCUPIED' && c.currentGame);
  const pendingGames = session.games.filter((g: any) => g.status === 'PENDING');
  const lobbyPlayers = session.players.filter((p: any) => p.playingStatus === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Live Lobby</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-none">
            {session.queueingGroup?.name} • {session.venue}
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Next Refresh In</p>
            <p className="text-xs font-black text-blue-400 leading-none tabular-nums">AUTO-SYNC</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
             <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Courts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Matches ({activeGames.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.courts.map((court: any) => (
              <div key={court.id} className={`p-6 rounded-3xl border-2 transition-all shadow-xl ${court.status === 'OCCUPIED' ? 'bg-slate-900 border-blue-500/30 shadow-blue-500/5' : 'bg-slate-900/40 border-slate-800 opacity-50'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tight leading-none">{court.name}</h3>
                    <span className={`text-[9px] font-black uppercase mt-1 inline-block ${court.status === 'OCCUPIED' ? 'text-blue-400' : 'text-slate-500'}`}>
                      {court.status === 'OCCUPIED' ? 'In Progress' : 'Available'}
                    </span>
                  </div>
                  {court.status === 'OCCUPIED' && (
                    <div className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest">Live</div>
                  )}
                </div>

                {court.status === 'OCCUPIED' && court.currentGame && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Team A</p>
                        <div className="space-y-1">
                          {court.currentGame.teamA.map((p: any) => (
                            <p key={p.id} className="text-xs font-bold text-white truncate">{p.name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="px-4 text-center">
                        <span className="text-xl font-black text-slate-700 italic lowercase tracking-tighter">vs</span>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Team B</p>
                        <div className="space-y-1">
                          {court.currentGame.teamB.map((p: any) => (
                            <p key={p.id} className="text-xs font-bold text-white truncate">{p.name}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {court.status === 'VACANT' && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Players</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: On-Deck & Queue */}
        <div className="lg:col-span-4 space-y-8">
          {/* On-Deck Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                On-Deck ({pendingGames.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pendingGames.length === 0 ? (
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center italic text-[10px] font-bold text-slate-500 uppercase">
                  No upcoming matches drafted
                </div>
              ) : (
                pendingGames.map((game: any, idx: number) => (
                  <div key={game.id} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 bg-orange-500 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">
                      #{idx + 1}
                    </div>
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        {game.teamA.map((p: any) => (
                          <p key={p.id} className="text-[10px] font-bold text-white truncate">{p.name}</p>
                        ))}
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] font-black text-orange-500/50 italic">vs</span>
                      </div>
                      <div className="col-span-2 text-right">
                        {game.teamB.map((p: any) => (
                          <p key={p.id} className="text-[10px] font-bold text-white truncate">{p.name}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Waiting List */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Waiting List ({lobbyPlayers.length})</h2>
            </div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-2">
              <div className="max-h-[40vh] overflow-y-auto space-y-1 custom-scrollbar px-2 py-2">
                {lobbyPlayers.length === 0 ? (
                  <p className="text-center py-4 text-[10px] font-black text-slate-600 uppercase">No active players</p>
                ) : (
                  lobbyPlayers.map((p: any) => {
                    const isPlaying = session.courts.some((c: any) => c.status === 'OCCUPIED' && c.currentGame && [...c.currentGame.teamA, ...c.currentGame.teamB].some((player: any) => player.id === p.id));
                    const isPending = pendingGames.some((g: any) => [...g.teamA, ...g.teamB].some((player: any) => player.id === p.id));
                    
                    if (isPlaying) return null; // Hide already playing

                    return (
                      <div key={p.id} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-xl transition-colors border border-transparent hover:border-slate-800">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <div className="flex gap-2">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Level {p.levelWeight}</span>
                             {isPending && <span className="text-[8px] font-black text-orange-400 uppercase tracking-tighter underline underline-offset-2 decoration-orange-500/50">Next Up</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="p-1 px-2 bg-slate-950 text-slate-500 rounded text-[9px] font-black tabular-nums">{p.gamesPlayed} G</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="mt-12 text-center border-t border-slate-900 pt-8 opacity-30">
         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Queue Master V2 • Powered by Antigravity</p>
      </div>
    </div>
  );
}
