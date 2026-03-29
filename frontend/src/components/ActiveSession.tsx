import React, { useState, useEffect } from 'react';

export default function ActiveSession({ selectedGroupId, onSessionUpdate }: { selectedGroupId?: string, onSessionUpdate?: (session: any) => void }) {
  // --- SESSION STATE ---
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Update parent dashboard whenever activeSession changes
  useEffect(() => {
    if (onSessionUpdate) {
      onSessionUpdate(activeSession);
    }
  }, [activeSession, onSessionUpdate]);

  // --- PLAYER & MODAL STATE ---
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [addPlayerTab, setAddPlayerTab] = useState('member'); // 'member' or 'walkin'
  const [sortBy, setSortBy] = useState('idleTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState('Active'); // All, Active, Available

  // --- AUDIO / TTS STATE ---
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsSettings, setTtsSettings] = useState(() => {
    const saved = localStorage.getItem('badminton_tts_settings');
    return saved ? JSON.parse(saved) : {
      voiceUri: '',
      rate: 0.9,
      pitch: 1.0,
      template: 'Game assigned to {court}. {teamA}, versus, {teamB}.'
    };
  });

  // Hydrate voices
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('badminton_tts_settings', JSON.stringify(ttsSettings));
  }, [ttsSettings]);

  // --- COMPLETE GAME STATE ---
  const [completeGameData, setCompleteGameData] = useState<any>(null); // holds { courtId, game }
  const [shuttlesUsed, setShuttlesUsed] = useState(0);
  const [winner, setWinner] = useState('TeamA'); // 'TeamA' or 'TeamB'

  // --- DATA STATES ---
  const [groups, setGroups] = useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [allSessionGames, setAllSessionGames] = useState<any[]>([]); // Track all games for history checks

  // Active players in the current session
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // --- FORM STATES ---
  const [targetGroupId, setTargetGroupId] = useState(selectedGroupId || '');
  const [venue, setVenue] = useState('');
  const [courtCount, setCourtCount] = useState(2);
  const [walkinName, setWalkinName] = useState('');
  const [walkinLevel, setWalkinLevel] = useState(1);
  const [walkinGender, setWalkinGender] = useState('Male');

  // Game Draft Form State
  const [draftType, setDraftType] = useState('Doubles'); // Singles, Doubles, Triples
  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);

  const API_BASE = 'http://100.88.175.25:8459/api';

  // Toggle player status
  const togglePlayerStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`${API_BASE}/players/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setPlayers(players.map(p => p.id === id ? { ...p, playingStatus: newStatus } : p));
      }
    } catch (err) {
      console.error("Failed to toggle player status:", err);
    }
  };

  // Helper to find idle time
  const getIdleTime = (playerId: string) => {
    const playerGames = allSessionGames.filter(g =>
      g.status === 'COMPLETED' &&
      ([...(g.teamA || []), ...(g.teamB || [])].some((p: any) => p.id === playerId))
    );
    if (playerGames.length === 0) return Infinity; // Never played = most idle

    const lastGame = playerGames.reduce((latest, current) => {
      const latestDate = new Date(latest.endedAt || 0).getTime();
      const currentDate = new Date(current.endedAt || 0).getTime();
      return currentDate > latestDate ? current : latest;
    });

    return Date.now() - new Date(lastGame.endedAt).getTime();
  };

  // Derived filtered and sorted player list
  const processedPlayers = React.useMemo(() => {
    if (!Array.isArray(players)) return [];

    // 1. Filter
    let list = [...players];
    if (filterBy === 'Active') {
      list = list.filter(p => p.playingStatus !== 'INACTIVE');
    } else if (filterBy === 'Available') {
      list = list.filter(p => p.playingStatus === 'ACTIVE'); // Active and Not Playing (backend sets status to ACTIVE after game)
    }

    // 2. Sort
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'alphabetical') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'idleTime') {
        const idleA = getIdleTime(a.id);
        const idleB = getIdleTime(b.id);
        comparison = idleA - idleB;
      } else if (sortBy === 'waitTime') {
        // Simple wait time logic (createdAt)
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'level') {
        comparison = a.levelWeight - b.levelWeight;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [players, filterBy, sortBy, sortDirection, allSessionGames]);

  // Load groups and pending games
  useEffect(() => {
    if (activeSession?.id) {
      fetch(`${API_BASE}/games/session/${activeSession.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const pending = data.filter((g: any) => g.status === 'PENDING');
            setPendingGames(pending);
            setAllSessionGames(data);
          }
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
    const groupId = activeSession?.queueingGroupId || activeSession?.groupId;
    if (showAddPlayerModal && groupId) {
      fetch(`${API_BASE}/members?groupId=${groupId}`)
        .then(res => res.json())
        .then(data => setAvailableMembers(Array.isArray(data) ? data.filter((m: any) => m.isActive) : []))
        .catch(err => console.error("Error loading members:", err));
    }
  }, [showAddPlayerModal, activeSession?.queueingGroupId, activeSession?.groupId, activeSession?.id]);

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
          levelWeight: member.levelWeight,
          gender: member.gender || 'Unknown'
        })
      });
      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers([...players, newPlayer]);
        // Modal stays open for succession adds
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
          levelWeight: walkinLevel,
          gender: walkinGender
        })
      });
      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers([...players, newPlayer]);
        setWalkinName('');
        setWalkinLevel(1);
        setWalkinGender('Male');
        // Modal stays open for succession adds
      }
    } catch (err) {
      console.error("Failed to add walk-in player:", err);
    }
  };

  const removePlayer = (id: string) => {
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
        setAllSessionGames([...allSessionGames, newGame]);
        setTeamA([]);
        setTeamB([]);
        setShowDraftModal(false);
      }
    } catch (err) {
      console.error("Failed to draft game:", err);
    }
  };

  const onDragStart = (e: any, gameId: string) => {
    e.dataTransfer.setData("gameId", gameId);
  };

  const onDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleStartGame = async (gameId: string, courtId: string) => {
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
        setPendingGames(prev => prev.filter(g => g.id !== gameId));
        setSelectedGameId(null); // Clear selection after success

        // Update player statuses locally
        const playingIds = [...(updatedGame.teamA || []), ...(updatedGame.teamB || [])].map((p: any) => p.id);
        setPlayers(players.map(p =>
          playingIds.includes(p.id)
            ? { ...p, playingStatus: 'PLAYING', gamesPlayed: (p.gamesPlayed || 0) + 1 }
            : p
        ));
      }
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  const onDrop = async (e: any, courtId: string) => {
    const gameId = e.dataTransfer.getData("gameId");
    if (gameId) handleStartGame(gameId, courtId);
  };

  const handleCompleteGame = async () => {
    if (!completeGameData) return;
    const { courtId, game } = completeGameData;
    try {
      const res = await fetch(`${API_BASE}/games/${game.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shuttlesUsed, winner })
      });
      if (res.ok) {
        // Free the court
        const updatedCourts = activeSession.courts.map((c: any) =>
          c.id === courtId ? { ...c, status: 'ACTIVE', game: null } : c
        );
        setActiveSession({ ...activeSession, courts: updatedCourts });

        // Return players to queue (active so they can be drafted again)
        const playingIds = [...(game.teamA || []), ...(game.teamB || [])].map((p: any) => p.id);
        const updatedPlayers = players.map((p: any) =>
          playingIds.includes(p.id) ? { ...p, playingStatus: 'ACTIVE' } : p
        );
        setPlayers(updatedPlayers);

        setCompleteGameData(null);
        setShuttlesUsed(0);
        setWinner('TeamA');
      }
    } catch (err) {
      console.error("Failed to complete game:", err);
    }
  };

  const announceMatchup = (courtName: string, game: any) => {
    if (!window.speechSynthesis) return;

    // Stop any ongoing announcement
    window.speechSynthesis.cancel();

    // Use phoneticAlias if it exists in the future, otherwise default to name
    const teamNamesA = game.teamA?.map((p: any) => p.phoneticAlias || p.name).join(' and ') || 'Team A';
    const teamNamesB = game.teamB?.map((p: any) => p.phoneticAlias || p.name).join(' and ') || 'Team B';

    // Build custom dialogue from template
    let dialogue = ttsSettings.template
      .replace(/{court}/g, courtName)
      .replace(/{teamA}/g, teamNamesA)
      .replace(/{teamB}/g, teamNamesB);

    const message = new SpeechSynthesisUtterance(dialogue);

    // Apply Settings
    message.rate = ttsSettings.rate;
    message.pitch = ttsSettings.pitch;

    if (ttsSettings.voiceUri) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === ttsSettings.voiceUri);
      if (selectedVoice) message.voice = selectedVoice;
    }

    window.speechSynthesis.speak(message);
  };

  // Derived state for draft warnings
  const draftWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (!teamA.length && !teamB.length) return warnings;

    // Check Pairings
    const checkPairings = (team: any[], teamName: string) => {
      if (team.length < 2) return;
      for (let i = 0; i < team.length; i++) {
        for (let j = i + 1; j < team.length; j++) {
          const p1 = team[i];
          const p2 = team[j];
          const paired = allSessionGames.some(g => {
            const inA = g.teamA?.some((p: any) => p.id === p1.id) && g.teamA?.some((p: any) => p.id === p2.id);
            const inB = g.teamB?.some((p: any) => p.id === p1.id) && g.teamB?.some((p: any) => p.id === p2.id);
            return inA || inB;
          });
          if (paired) warnings.push(`${p1.name} and ${p2.name} have already paired up this session.`);
        }
      }
    };
    checkPairings(teamA, 'Team A');
    checkPairings(teamB, 'Team B');

    // Check Matchups
    for (const pA of teamA) {
      for (const pB of teamB) {
        const matchups = allSessionGames.some(g => {
          const aInTeamA = g.teamA?.some((p: any) => p.id === pA.id);
          const bInTeamB = g.teamB?.some((p: any) => p.id === pB.id);
          const aInTeamB = g.teamB?.some((p: any) => p.id === pA.id);
          const bInTeamA = g.teamA?.some((p: any) => p.id === pB.id);
          return (aInTeamA && bInTeamB) || (aInTeamB && bInTeamA);
        });
        if (matchups) warnings.push(`${pA.name} and ${pB.name} have already played against each other.`);
      }
    }

    return Array.from(new Set(warnings));
  }, [teamA, teamB, allSessionGames]);

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
            <button onClick={() => setShowAudioSettings(true)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border border-slate-100" title="Audio Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">End Session</button>
      </div>

      {/* KANBAN */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-8">

        {/* PLAYER COLUMN */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3">
          {/* Filtering Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mx-2">
            {['All', 'Active', 'Available'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterBy(f)}
                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${filterBy === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filterBy} List ({processedPlayers.length})
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[9px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer"
              >
                <option value="idleTime">Most Idle</option>
                <option value="waitTime">Check-in order</option>
                <option value="alphabetical">A to Z</option>
                <option value="level">Skill Level</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
              >
                {sortDirection === 'desc' ? '▽' : '△'}
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {processedPlayers.map(p => {
              const isPending = Array.isArray(pendingGames) && pendingGames.some(g => [...(g.teamA || []), ...(g.teamB || [])].some((player: any) => player.id === p.id));
              const idleMinutes = getIdleTime(p.id) === Infinity ? '-' : Math.floor(getIdleTime(p.id) / (1000 * 60));

              return (
                <div key={p.id} className={`p-3 rounded-xl border-2 transition-all shadow-sm group relative ${p.playingStatus === 'INACTIVE' ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' : 'bg-white border-transparent'}`}>
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${p.playingStatus === 'PLAYING' ? 'bg-blue-500' : p.playingStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />

                  <div className="flex justify-between items-start mb-1 pl-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{p.name}</span>
                      {isPending && <span className="text-[7px] font-black bg-yellow-100 text-yellow-700 px-1 rounded uppercase tracking-tighter">Pending</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {p.playerStatus === 'WALKIN' && <span className="text-[7px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase">Guest</span>}
                      <span className="text-[9px] font-black text-slate-300 italic">L{p.levelWeight}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 pl-1">
                    <div className="flex space-x-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                      <span>{p.gamesPlayed || 0} Games</span>
                      <span>{idleMinutes === '-' ? 'Waiting' : `${idleMinutes}m Idle`}</span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* SLEEP/WAKE TOGGLE */}
                      <button
                        onClick={() => togglePlayerStatus(p.id, p.playingStatus)}
                        title={p.playingStatus === 'ACTIVE' ? "Mark as Sleeping" : "Mark as Active"}
                        className={`p-1 rounded hover:bg-slate-100 ${p.playingStatus === 'ACTIVE' ? 'text-slate-400' : 'text-blue-500'}`}
                      >
                        {p.playingStatus === 'ACTIVE' ? '💤' : '⚡'}
                      </button>

                      {/* SAFE DELETE BUTTON */}
                      {(p.gamesPlayed || 0) === 0 && p.playingStatus !== 'PLAYING' && (
                        <button onClick={() => removePlayer(p.id)} className="p-1 rounded hover:bg-red-50 text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => setSelectedGameId(selectedGameId === game.id ? null : game.id)}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                  className={`p-4 rounded-xl shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing ${selectedGameId === game.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-400'}`}
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
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all relative ${c.game ? 'border-blue-500' : (selectedGameId ? 'border-dashed border-blue-300' : 'border-slate-200')}`}
              >
                {!c.game && selectedGameId && (
                  <button
                    onClick={() => handleStartGame(selectedGameId, c.id)}
                    className="absolute inset-0 bg-blue-600/10 hover:bg-blue-600/20 z-10 flex items-center justify-center group"
                  >
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg transform group-hover:scale-110 transition-transform">
                      Assign Here
                    </div>
                  </button>
                )}
                <div className="bg-slate-800 p-2.5 flex justify-between items-center">
                  <input defaultValue={c.name} className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-2 rounded w-24" />
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${c.game ? 'bg-blue-500 text-white' : (c.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white')}`}>{c.game ? 'Playing' : c.status}</span>
                </div>
                <div className="p-6 flex flex-col items-center justify-center space-y-3">
                  {c.game ? (
                    <>
                      <div className="text-[10px] font-black text-slate-700 uppercase">
                        {c.game.teamA?.map((p: any) => p.name).join(' & ')} <span className="text-slate-300 px-1">vs</span> {c.game.teamB?.map((p: any) => p.name).join(' & ')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => announceMatchup(c.name, c.game)}
                          title="Announce Matchup on Speaker"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-sm border border-blue-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </button>
                        <button
                          onClick={() => { setCompleteGameData({ courtId: c.id, game: c.game }); setWinner('TeamA'); setShuttlesUsed(0); }}
                          title="Finish Game"
                          className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full text-[10px] font-black uppercase transition-colors flex items-center justify-center shadow-sm border border-green-100"
                        >
                          Finish
                        </button>
                      </div>
                    </>
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
                  {Array.isArray(availableMembers) && availableMembers.map((m: any) => {
                    const isAdded = players.some((p: any) => p.memberId === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isAdded && handleAddFromMember(m)}
                        disabled={isAdded}
                        className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all ${isAdded ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50 group'}`}
                      >
                        <span className={`font-bold ${isAdded ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.name}</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase transition-colors ${isAdded ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          {isAdded ? 'Checked-in' : 'Check-in'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleAddWalkin} className="space-y-4">
                  <input autoFocus value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex space-x-2">
                    <select value={walkinLevel} onChange={e => setWalkinLevel(parseInt(e.target.value))} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"><option value={1}>Level 1</option><option value={2}>Level 2</option><option value={3}>Level 3</option><option value={4}>Level 4</option><option value={5}>Level 5</option></select>
                    <select value={walkinGender} onChange={e => setWalkinGender(e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"><option>Male</option><option>Female</option></select>
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

            {/* Warnings Block */}
            {draftWarnings.length > 0 && (
              <div className="px-6 pb-2">
                <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-[10px] font-bold tracking-wide flex flex-col space-y-2 border border-orange-200">
                  <span className="uppercase text-orange-900 font-black flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Opponent Matchup Alerts
                  </span>
                  <ul className="list-disc pl-5 opacity-90">
                    {draftWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}

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

      {/* COMPLETE GAME MODAL */}
      {completeGameData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight text-center border-b pb-4">Finish Game</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Winner</label>
                <select value={winner} onChange={e => setWinner(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-green-500 transition-all">
                  <option value="TeamA">🏆 Team A ({completeGameData.game?.teamA?.map((p: any) => p.name).join(' & ')})</option>
                  <option value="TeamB">🏆 Team B ({completeGameData.game?.teamB?.map((p: any) => p.name).join(' & ')})</option>
                  <option value="Tie">🤝 Draw / Tie Match</option>
                  <option value="N/A">⚪ N/A (No Stats)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Shuttles Used</label>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-2 px-4 shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition-all">
                  <span className="text-xl">🏸</span>
                  <input type="number" min="0" value={shuttlesUsed} onChange={e => setShuttlesUsed(parseInt(e.target.value) || 0)} className="w-full p-2 bg-transparent font-black text-base outline-none text-slate-700" />
                </div>
              </div>
              <div className="flex space-x-2 pt-6">
                <button onClick={handleCompleteGame} className="flex-1 py-4 bg-green-600 text-white font-black rounded-xl uppercase tracking-widest shadow-md shadow-green-200 hover:bg-green-700 transition-all text-xs">Complete Match</button>
                <button onClick={() => setCompleteGameData(null)} className="px-6 py-4 bg-slate-100 text-slate-500 hover:text-slate-700 font-black rounded-xl uppercase tracking-widest text-xs transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AUDIO / TTS SETTINGS MODAL */}
      {showAudioSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Audio Announcements</h3>
              <button onClick={() => setShowAudioSettings(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* VOICE SELECTION */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Voice Assistant</label>
                <select
                  value={ttsSettings.voiceUri}
                  onChange={e => setTtsSettings({ ...ttsSettings, voiceUri: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="">System Default</option>
                  {availableVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>

              {/* RATE & PITCH */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Speech Rate: {ttsSettings.rate}</label>
                  <input
                    type="range" min="0.5" max="2" step="0.1"
                    value={ttsSettings.rate}
                    onChange={e => setTtsSettings({ ...ttsSettings, rate: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Voice Pitch: {ttsSettings.pitch}</label>
                  <input
                    type="range" min="0" max="2" step="0.1"
                    value={ttsSettings.pitch}
                    onChange={e => setTtsSettings({ ...ttsSettings, pitch: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* TEMPLATE */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dialogue Template</label>
                <textarea
                  value={ttsSettings.template}
                  onChange={e => setTtsSettings({ ...ttsSettings, template: e.target.value })}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Use {court}, {teamA}, and {teamB} as placeholders."
                />
                <div className="mt-2 text-[8px] text-slate-400 font-bold uppercase flex gap-2">
                  <span>{'{court}'}</span>
                  <span>{'{teamA}'}</span>
                  <span>{'{teamB}'}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-50">
                <button
                  onClick={() => announceMatchup("Court 1", { teamA: [{ name: "Player A" }], teamB: [{ name: "Player B" }] })}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl uppercase tracking-widest text-xs transition-all hover:bg-slate-200"
                >
                  Preview Audio
                </button>
                <button
                  onClick={() => setShowAudioSettings(false)}
                  className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-md shadow-blue-100 hover:bg-blue-700 transition-all text-xs"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
