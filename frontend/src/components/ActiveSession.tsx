import React, { useState, useEffect } from 'react';

export default function ActiveSession({ selectedGroupId }: { selectedGroupId?: string }) {
  // --- SESSION STATE ---
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  
  // --- PLAYER & MODAL STATE ---
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState('member'); // 'member' or 'walkin'
  const [sortBy, setSortBy] = useState('waitTime');
  
  // --- DATA STATES ---
  const [groups, setGroups] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [pendingGames, setPendingGames] = useState([]);

  // Active players in the current session
  const [players, setPlayers] = useState([]);

  // --- FORM STATES ---
  const [targetGroupId, setTargetGroupId] = useState(selectedGroupId || '');
  const [venue, setVenue] = useState('');
  const [courtCount, setCourtCount] = useState(2);
  const [walkinName, setWalkinName] = useState('');
  
  // Game Draft Form State
  const [draftType, setDraftType] = useState('Doubles'); // Singles, Doubles, Triples
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);

  const API_BASE = 'http://100.88.175.25:3001/api';

  // Load groups and pending games
  useEffect(() => {
    if (activeSession?.id) {
      fetch(`${API_BASE}/games/session/${activeSession.id}`)
        .then(res => res.json())
        .then(data => {
          const pending = data.filter((g: any) => g.status === 'PENDING');
          setPendingGames(pending);
        })
        .catch(err => console.error("Error loading games:", err));

      fetch(`${API_BASE}/players/session/${activeSession.id}`)
        .then(res => res.json())
        .then(data => setPlayers(data))
        .catch(err => console.error("Error loading players:", err));
    }

    fetch(`${API_BASE}/queueing-groups`)
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Error loading groups:", err));
  }, [activeSession?.id]);

  // Fetch members for the session's group when opening the add player modal
  useEffect(() => {
    if (showAddPlayerModal && activeSession?.groupId) {
      fetch(`${API_BASE}/members?groupId=${activeSession.groupId}`)
        .then(res => res.json())
        .then(data => setAvailableMembers(data.filter((m: any) => m.isActive)))
        .catch(err => console.error("Error loading members:", err));
    }
  }, [showAddPlayerModal, activeSession?.groupId, activeSession?.id]);

  // --- ACTIONS ---
  const handleStartSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: targetGroupId,
          venue: venue || 'Unnamed Venue',
          courtCount: courtCount
        })
      });
      if (res.ok) {
        const newSession = await res.json();
        setActiveSession(newSession);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const handleEndSession = () => {
    setActiveSession(null);
    setShowEndModal(false);
  };

  const handleAddFromMember = async (member) => {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          memberId: member.id,
          name: member.name,
          levelWeight: member.levelWeight
        })
      });
      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers([...players, newPlayer]);
        setShowAddPlayerModal(false);
      }
    } catch (err) {
      console.error("Failed to add player from member:", err);
    }
  };

  const handleAddWalkin = async (e) => {
    e.preventDefault();
    if (!walkinName) return;
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          name: walkinName,
          levelWeight: 1
        })
      });
      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers([...players, newPlayer]);
        setWalkinName('');
        setShowAddPlayerModal(false);
      }
    } catch (err) {
      console.error("Failed to add walk-in player:", err);
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  // --- GAME DRAFTING & DND ---
  const handleDraftGame = async () => {
    const gameData = {
      sessionId: activeSession.id,
      type: draftType,
      teamA: teamA.map(p => p.id),
      teamB: teamB.map(p => p.id),
      status: 'PENDING'
    };

    try {
      const res = await fetch(`${API_BASE}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      if (res.ok) {
        const newGame = await res.json();
        setPendingGames([...pendingGames, newGame]);
        setTeamA([]);
        setTeamB([]);
        setShowDraftModal(false);
      }
    } catch (err) {
      console.error("Failed to draft game:", err);
    }
  };

  const onDragStart = (e, gameId) => {
    e.dataTransfer.setData("gameId", gameId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, courtId) => {
    const gameId = e.dataTransfer.getData("gameId");
    
    try {
      const res = await fetch(`${API_BASE}/games/${gameId}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId })
      });

      if (res.ok) {
        const updatedGame = await res.json();
        // Update local session courts to show the game
        const updatedCourts = activeSession.courts.map(c => 
          c.id === courtId ? { ...c, status: 'Playing', game: updatedGame } : c
        );
        setActiveSession({ ...activeSession, courts: updatedCourts });
        setPendingGames(pendingGames.filter(g => g.id !== gameId));
        
        // Update player statuses locally
        const playingIds = [...(updatedGame.teamA || []), ...(updatedGame.teamB || [])].map((p: any) => p.id);
        setPlayers(players.map(p => 
          playingIds.includes(p.id) 
            ? { ...p, playingStatus: 'PLAYING', gamesPlayed: (p.gamesPlayed || 0) + 1 } 
            : p
        ));
      }
    } catch (err) {
      console.error("Failed to assign game to court:", err);
    }
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
                <select value={targetGroupId} onChange={e => setTargetGroupId(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm">
                  <option value="">Select Group...</option>
                  {Array.isArray(groups) && groups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Venue Name" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                <input type="number" value={courtCount} onChange={e => setCourtCount(parseInt(e.target.value))} placeholder="Courts" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
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
            <button onClick={() => setShowDraftModal(true)} className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-wider">Draft Game</button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">End Session</button>
      </div>

      {/* KANBAN */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-8">
        
        {/* PLAYER COLUMN */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase">Queue ({Array.isArray(players) ? players.length : 0})</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-[9px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer">
              <option value="available">Available First</option>
              <option value="waitTime">Wait Time ▽</option>
              <option value="alphabetical">Name A-Z</option>
              <option value="level">Level ▽</option>
            </select>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {Array.isArray(players) && players.map(p => (
              <div key={p.id} className={`p-3 rounded-xl border-2 transition-all shadow-sm group ${p.playingStatus === 'INACTIVE' ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${p.playingStatus === 'PLAYING' ? 'bg-blue-500 animate-pulse' : p.playingStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {p.playerStatus === 'WALKIN' && <span className="text-[7px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase">Guest</span>}
                    <span className="text-[9px] font-black text-slate-300 italic">L{p.levelWeight}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                    <span>{p.gamesPlayed || 0} Games</span>
                    <span>{p.waitTime || '0m'} Wait</span>
                  </div>
                  {/* SAFE DELETE BUTTON */}
                  {(p.gamesPlayed || 0) === 0 && p.playingStatus !== 'PLAYING' && (
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
          <div className="flex-1 space-y-3 bg-slate-50/50 rounded-2xl p-3 border-2 border-dashed border-slate-200 overflow-y-auto">
            {(!Array.isArray(pendingGames) || pendingGames.length === 0) ? (
              <div className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase italic tracking-widest opacity-40">Draft a game to start</div>
            ) : (
              pendingGames.map(game => (
                <div 
                  key={game.id} 
                  draggable 
                  onDragStart={(e) => onDragStart(e, game.id)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors"
                >
                  <div className="text-[8px] font-black text-blue-600 uppercase mb-2">{game.type}</div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <span>{game.teamA?.map(p => p.name).join(' & ')}</span>
                    <span className="text-slate-300 mx-2">VS</span>
                    <span>{game.teamB?.map(p => p.name).join(' & ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COURTS COLUMN */}
        <div className="flex-1 min-w-[450px] flex flex-col space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courts ({activeSession?.courts ? activeSession.courts.length : 0})</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase">+ Add Court</button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.isArray(activeSession?.courts) && activeSession.courts.map((c: any) => (
              <div 
                key={c.id} 
                onDragOver={onDragOver} 
                onDrop={(e) => onDrop(e, c.id)}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${c.game ? 'border-blue-500' : 'border-slate-200'}`}
              >
                <div className="bg-slate-800 p-2.5 flex justify-between items-center">
                  <input defaultValue={c.name} className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-2 rounded w-24" />
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${c.game ? 'bg-blue-500 text-white' : (c.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white')}`}>{c.game ? 'Playing' : c.status}</span>
                </div>
                <div className="p-6 text-center">
                  {c.game ? (
                    <div className="text-[10px] font-black text-slate-700 uppercase">{c.game.teamA?.map(p => p.name).join(' & ')} <span className="text-slate-300 px-1">vs</span> {c.game.teamB?.map(p => p.name).join(' & ')}</div>
                  ) : (
                    <div className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Ready</div>
                  )}
                </div>
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
                  {Array.isArray(availableMembers) && availableMembers.map((m: any) => (
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

      {/* DRAFT GAME MODAL */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase italic">Draft New Game</h3>
              <select value={draftType} onChange={e => { setDraftType(e.target.value); setTeamA([]); setTeamB([]); }} className="p-2 bg-slate-50 rounded-lg text-xs font-bold border-none">
                <option>Singles</option>
                <option>Doubles</option>
                <option>Triples</option>
              </select>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Team A Selection */}
              <div>
                <h4 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">Team A</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.isArray(players) && players.filter(p => p.playingStatus === 'ACTIVE' && !teamB.find(t => t.id === p.id)).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => teamA.find(t => t.id === p.id) ? setTeamA(teamA.filter(t => t.id !== p.id)) : setTeamA([...teamA, p])}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${teamA.find(t => t.id === p.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Team B Selection */}
              <div>
                <h4 className="text-[10px] font-black text-red-600 uppercase mb-3 tracking-widest">Team B</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.isArray(players) && players.filter(p => p.playingStatus === 'ACTIVE' && !teamA.find(t => t.id === p.id)).map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => teamB.find(t => t.id === p.id) ? setTeamB(teamB.filter(t => t.id !== p.id)) : setTeamB([...teamB, p])}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${teamB.find(t => t.id === p.id) ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex space-x-3">
              <button onClick={handleDraftGame} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Add to Pending</button>
              <button onClick={() => setShowDraftModal(false)} className="px-8 py-4 bg-white text-slate-400 font-black rounded-2xl uppercase tracking-widest text-xs border border-slate-200">Cancel</button>
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
