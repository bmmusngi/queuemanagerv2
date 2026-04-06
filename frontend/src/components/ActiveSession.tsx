import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { suggestMatch, DraftSettings } from '../utils/draft.utils';

export default function ActiveSession({ selectedGroupId, onSessionUpdate }: { selectedGroupId?: string, onSessionUpdate?: (session: any) => void }) {
  // --- SESSION STATE ---
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);

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
  
  const [showDraftSettings, setShowDraftSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<DraftSettings>(() => {
    const saved = localStorage.getItem('badminton_draft_settings');
    return saved ? JSON.parse(saved) : {
      levelWeight: 5,
      idleWeight: 8,
      historyWeight: 4,
      tournamentMode: false
    };
  });

  // Hydrate voices.
  // Some Chromium-based browsers (e.g. Opera on Android) don't reliably fire
  // onvoiceschanged, so we also schedule a fallback load after a short delay.
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    // Fallback: retry after 500ms for browsers that never fire onvoiceschanged
    const retryTimer = setTimeout(loadVoices, 500);
    return () => {
      clearTimeout(retryTimer);
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('badminton_tts_settings', JSON.stringify(ttsSettings));
  }, [ttsSettings]);

  useEffect(() => {
    localStorage.setItem('badminton_draft_settings', JSON.stringify(draftSettings));
  }, [draftSettings]);

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
  const [editingGame, setEditingGame] = useState<any>(null);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [settlingPlayer, setSettlingPlayer] = useState<any>(null);
  const [syncMember, setSyncMember] = useState(false);

  // --- FORM STATES ---
  const [targetGroupId, setTargetGroupId] = useState(selectedGroupId || '');
  const [venue, setVenue] = useState('');
  const [courtCount, setCourtCount] = useState(2);
  const [paymentScheme, setPaymentScheme] = useState<'FIXED' | 'GAME' | null>(null);
  const [baseFee, setBaseFee] = useState<number>(0);
  const [gameFee, setGameFee] = useState<number>(0);
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

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      const res = await fetch(`${API_BASE}/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlayer.name,
          gender: editingPlayer.gender,
          levelWeight: editingPlayer.levelWeight,
          syncMember: syncMember
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setPlayers(players.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        setEditingPlayer(null);
        setSyncMember(false);
      }
    } catch (err) {
      console.error("Failed to update player:", err);
    }
  };

  const handleUpdateFinancials = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentScheme,
          baseFee,
          gameFee
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveSession(updated);
        // showFinancialsModal is already true, we can keep it open or close it
        // Let's just update and show a small confirmation if needed, but for now, just sync
      }
    } catch (err) {
      console.error("Failed to update financials:", err);
    }
  };

  const handleUpdatePayment = async (playerId: string, status: string, mode: string) => {
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, mode })
      });
      if (res.ok) {
        const updated = await res.json();
        setPlayers(players.map(p => p.id === playerId ? { ...p, ...updated } : p));
        setSettlingPlayer(null);
      }
    } catch (err) {
      console.error("Failed to update payment:", err);
    }
  };

  const handleUpdatePartner = async (playerId: string, partnerId: string | null) => {
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}/partner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId })
      });
      if (res.ok) {
        // Refresh players
        const updatedPlayers = await fetch(`${API_BASE}/players/session/${activeSession.id}`).then(r => r.json());
        setPlayers(updatedPlayers);
        // Update editing player if needed
        if (editingPlayer?.id === playerId) {
          const updated = updatedPlayers.find((p: any) => p.id === playerId);
          setEditingPlayer(updated);
        }
      }
    } catch (err) {
      console.error("Failed to update partner:", err);
    }
  };

  const handleSmartSuggest = () => {
    // Get truly available players: ACTIVE and NOT already locked into a pending game.
    // Pre-attach idleTimeMs and sort most-idle-first so suggestMatch picks the
    // longest-waiting players when there are more candidates than spots.
    const availablePlayers = players
      .filter(p => p.playingStatus === 'ACTIVE' && !pendingPlayerIds.has(p.id))
      .map(p => ({ ...p, idleTimeMs: getIdleTime(p) }))
      .sort((a, b) => b.idleTimeMs - a.idleTimeMs); // descending: most idle first

    const suggestion = suggestMatch(availablePlayers, allSessionGames, draftSettings);

    if (suggestion) {
      setTeamA(suggestion.teamA);
      setTeamB(suggestion.teamB);
      setDraftType(suggestion.type.charAt(0) + suggestion.type.slice(1).toLowerCase());
    } else {
      alert("Not enough available players to form a balanced match.");
    }
  };

  // Helper to find idle time. For players who have never played, counts from their
  // createdAt (join time) so the queue wait is always reflected in the display.
  const getIdleTime = (player: any) => {
    const playerGames = allSessionGames.filter(g =>
      (g.status === 'COMPLETED' || g.status === 'CANCELLED') &&
      ([...(g.teamA || []), ...(g.teamB || [])].some((p: any) => p.id === player.id))
    );

    if (playerGames.length === 0) {
      // Never played — count from when the player joined the session
      return player.createdAt ? Date.now() - new Date(player.createdAt).getTime() : 0;
    }

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
        const idleA = getIdleTime(a);
        const idleB = getIdleTime(b);
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

  // IDs of players already committed to a pending (drafted but not yet started) game.
  // These players are still ACTIVE in status but should not be selectable again.
  const pendingPlayerIds = React.useMemo(() => {
    return new Set<string>(
      pendingGames.flatMap(g => [...(g.teamA || []), ...(g.teamB || [])].map((p: any) => p.id))
    );
  }, [pendingGames]);

  // Financial Metrics
  const financials = React.useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    const breakdown = { GCash: 0, Cash: 0, QRPH: 0 };

    players.forEach(p => {
      const amount = activeSession?.paymentScheme === 'GAME'
        ? (activeSession.baseFee + (activeSession.gameFee * (p.gamesPlayed || 0)))
        : (activeSession?.baseFee || 0);

      if (p.paymentStatus === 'PAID') {
        collected += amount;
        if (p.paymentMode === 'GCash') breakdown.GCash += amount;
        if (p.paymentMode === 'Cash') breakdown.Cash += amount;
        if (p.paymentMode === 'QRPH') breakdown.QRPH += amount;
      } else {
        outstanding += amount;
      }
    });

    return { collected, outstanding, breakdown };
  }, [players, activeSession]);

  const [showFinancialsModal, setShowFinancialsModal] = useState(false);

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
          courtCount: courtCount,
          paymentScheme,
          baseFee,
          gameFee
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
  const handleUpdateGame = async () => {
    if (!editingGame) return;

    // We only update type and teams for pending games
    const gameData = {
      type: editingGame.type,
      teamA: { set: editingGame.teamA.map((p: any) => ({ id: p.id })) },
      teamB: { set: editingGame.teamB.map((p: any) => ({ id: p.id })) },
    };

    try {
      const res = await fetch(`${API_BASE}/games/${editingGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      if (res.ok) {
        const updated = await res.json();
        setPendingGames(prev => prev.map(g => g.id === updated.id ? updated : g));
        setAllSessionGames(prev => prev.map(g => g.id === updated.id ? updated : g));
        setEditingGame(null);
      }
    } catch (err) {
      console.error("Failed to update game:", err);
    }
  };

  const handleCancelGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to cancel this game?")) return;

    try {
      const res = await fetch(`${API_BASE}/games/${gameId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const cancelledGame = await res.json();
        
        // 1. Remove from pending games if it's there
        setPendingGames(prev => prev.filter(g => g.id !== gameId));
        
        // 2. Clear from court if it's active
        if (activeSession?.courts) {
          const updatedCourts = activeSession.courts.map((c: any) =>
            c.game?.id === gameId ? { ...c, status: 'ACTIVE', game: null } : c
          );
          setActiveSession({ ...activeSession, courts: updatedCourts });
        }

        // 3. Update allSessionGames to reflect CANCELLED status (for idle time)
        // Note: The backend now returns the game with CANCELLED status and endedAt set.
        setAllSessionGames(prev => {
          const exists = prev.find(g => g.id === gameId);
          if (exists) {
            return prev.map(g => g.id === gameId ? { ...g, ...cancelledGame } : g);
          } else {
            return [...prev, cancelledGame];
          }
        });

        // 4. Reset player statuses locally
        const affectedPlayerIds = [...(cancelledGame.teamA || []), ...(cancelledGame.teamB || [])].map((p: any) => p.id);
        setPlayers(prev => prev.map(p => 
          affectedPlayerIds.includes(p.id) ? { ...p, playingStatus: 'ACTIVE' } : p
        ));

        if (selectedGameId === gameId) setSelectedGameId(null);
      }
    } catch (err) {
      console.error("Failed to cancel game:", err);
    }
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

  const handleAddCourt = async () => {
    try {
      const newIndex = (activeSession.courts?.length || 0) + 1;
      const res = await fetch(`${API_BASE}/courts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          name: `Court ${newIndex}`,
          status: 'ACTIVE'
        })
      });
      if (res.ok) {
        const newCourt = await res.json();
        setActiveSession({
          ...activeSession,
          courts: [...(activeSession.courts || []), newCourt]
        });
      }
    } catch (err) {
      console.error("Failed to add court:", err);
    }
  };

  const handleUpdateCourtName = async (courtId: string, newName: string) => {
    try {
      const res = await fetch(`${API_BASE}/courts/${courtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveSession({
          ...activeSession,
          courts: activeSession.courts.map((c: any) => c.id === courtId ? { ...c, name: updated.name } : c)
        });
      }
    } catch (err) {
      console.error("Failed to update court name:", err);
    }
  };

  const handleDeleteCourt = async (courtId: string) => {
    const court = activeSession.courts.find((c: any) => c.id === courtId);
    if (court?.game) {
      alert("Cannot delete a court with an active game.");
      return;
    }
    if (activeSession.courts.length <= 1) {
      alert("You must have at least one court.");
      return;
    }
    if (!confirm("Are you sure you want to delete this court?")) return;

    try {
      const res = await fetch(`${API_BASE}/courts/${courtId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActiveSession({
          ...activeSession,
          courts: activeSession.courts.filter((c: any) => c.id !== courtId)
        });
      }
    } catch (err) {
      console.error("Failed to delete court:", err);
    }
  };

  const announceMatchup = (courtName: string, game: any) => {
    if (!window.speechSynthesis) return;

    // Stop any ongoing announcement
    window.speechSynthesis.cancel();

    // Use phoneticAlias if it exists in the future, otherwise default to name
    const teamNamesA = game.teamA?.map((p: any) => p.phoneticAlias || p.name).join(' and ') || 'Team A';
    const teamNamesB = game.teamB?.map((p: any) => p.phoneticAlias || p.name).join(' and ') || 'Team B';

    // Build custom dialogue from template.
    // Use case-insensitive regex so old templates with e.g. {Court} or {TeamA} still work.
    let dialogue = ttsSettings.template
      .replace(/{court}/gi, courtName)
      .replace(/{teamA}/gi, teamNamesA)
      .replace(/{teamB}/gi, teamNamesB);

    const message = new SpeechSynthesisUtterance(dialogue);

    // Apply Settings
    message.rate = ttsSettings.rate;
    message.pitch = ttsSettings.pitch;

    // Only apply the stored voice if it actually exists in the current browser.
    // If not found, fall back to system default to avoid silent failures on Opera etc.
    if (ttsSettings.voiceUri) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === ttsSettings.voiceUri);
      if (selectedVoice) {
        message.voice = selectedVoice;
      } else {
        // Voice from settings not available in this browser — clear it silently
        setTtsSettings(prev => ({ ...prev, voiceUri: '' }));
      }
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
                
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payment Scheme (Required)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button" 
                      onClick={() => setPaymentScheme('FIXED')}
                      className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentScheme === 'FIXED' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                    >
                      Fixed Fee
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPaymentScheme('GAME')}
                      className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentScheme === 'GAME' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                    >
                      Game Fee
                    </button>
                  </div>

                  {paymentScheme === 'FIXED' && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Session Fee (PHP)</label>
                      <input type="number" value={baseFee} onChange={e => setBaseFee(parseInt(e.target.value) || 0)} className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}

                  {paymentScheme === 'GAME' && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Entry/Court Fee (PHP)</label>
                        <input type="number" value={baseFee} onChange={e => setBaseFee(parseInt(e.target.value) || 0)} className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Fee per Game (PHP)</label>
                        <input type="number" value={gameFee} onChange={e => setGameFee(parseInt(e.target.value) || 0)} className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t border-slate-50">
                  <button 
                    onClick={handleStartSession} 
                    disabled={!targetGroupId || !paymentScheme}
                    className={`flex-1 py-4 font-black rounded-xl uppercase text-xs tracking-widest shadow-md transition-all ${(!targetGroupId || !paymentScheme) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    Go Live
                  </button>
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
            <button onClick={() => setShowLobbyModal(true)} className="text-[10px] font-black bg-purple-50 text-purple-600 px-4 py-2 rounded-lg uppercase tracking-wider flex items-center gap-2 border border-purple-100">
               <span className="animate-pulse">📡</span> Share Lobby
            </button>
            <button onClick={() => setShowAudioSettings(true)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border border-slate-100" title="Audio Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
            <button onClick={() => setShowDraftSettings(true)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-purple-500 hover:bg-purple-50 transition-all border border-slate-100" title="Drafting Engine Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
            <button onClick={() => setShowFinancialsModal(true)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-green-500 hover:bg-green-50 transition-all border border-slate-100 flex items-center gap-2" title="Financial Settings">
              <span className="text-[10px] font-black text-slate-600">₱{financials.collected}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        </div>
        <button onClick={() => setShowEndModal(true)} className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-2 rounded-lg uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">End Session</button>
      </div>

      {/* KANBAN */}
      <div className="flex flex-1 space-x-6 overflow-x-auto pb-8 max-h-[calc(100vh-290px)]">

        {/* PLAYER COLUMN */}
        <div className="w-72 flex-shrink-0 flex flex-col space-y-3 min-h-0">
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
              const idleMs = getIdleTime(p);
              const idleMinutes = Math.floor(idleMs / (1000 * 60));

              return (
                <div key={p.id} className={`p-3 rounded-xl border-2 transition-all shadow-sm group relative ${p.playingStatus === 'INACTIVE' ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' : 'bg-white border-transparent'}`}>
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${p.playingStatus === 'PLAYING' ? 'bg-blue-500' : p.playingStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />

                  <div className="flex items-center">
                    {/* COLUMN 1: Level Sidebar */}
                    <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-3 mr-3 min-w-[36px]">
                      <span className="text-xs font-black text-blue-600 italic leading-none">L{p.levelWeight}</span>
                      {p.playerStatus === 'WALKIN' && <span className="text-[6px] font-black bg-orange-100 text-orange-600 px-1 rounded uppercase mt-1 tracking-tighter">Guest</span>}
                    </div>

                    {/* COLUMN 2: Info & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1 mb-1 truncate">
                        <span className="text-xs font-bold text-slate-800 truncate">{p.name}</span>
                        {isPending && <span className="text-[7px] font-black bg-yellow-100 text-yellow-700 px-1 rounded uppercase tracking-tighter">Pending</span>}
                        {p.partnerId && (
                          <span className="text-[7px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                            🤝 {players.find(partner => partner.id === p.partnerId)?.name.split(' ')[0] || 'Partner'}
                          </span>
                        )}
                        {p.playingStatus === 'INACTIVE' && (
                          <button 
                            onClick={() => setSettlingPlayer(p)}
                            className={`text-[7px] font-black px-1 rounded uppercase tracking-tighter transition-all ${p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}
                          >
                            {p.paymentStatus === 'PAID' ? `Paid (${p.paymentMode})` : 'Unpaid'}
                          </button>
                        )}
                      </div>
                      <div className="flex space-x-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>{p.gamesPlayed || 0} Games</span>
                        <span className={p.playingStatus === 'PLAYING' ? 'text-blue-600 animate-pulse' : ''}>
                          {p.playingStatus === 'PLAYING' ? 'Playing' : `${idleMinutes}m ${(p.gamesPlayed || 0) === 0 ? 'Waiting' : 'Idle'}`}
                        </span>
                      </div>
                    </div>

                    {/* COLUMN 3: Action Grid (Always Visible for Tablet) */}
                    <div className="grid grid-cols-2 gap-1 ml-3 border-l border-slate-50 pl-2">
                      {/* SLEEP/WAKE TOGGLE */}
                      <button
                        onClick={() => togglePlayerStatus(p.id, p.playingStatus)}
                        title={p.playingStatus === 'ACTIVE' ? "Mark as Sleeping" : "Mark as Active"}
                        className={`p-1.5 rounded-lg border transition-all ${p.playingStatus === 'ACTIVE' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'}`}
                      >
                        {p.playingStatus === 'ACTIVE' ? '💤' : '⚡'}
                      </button>

                      {/* EDIT PLAYER */}
                      <button
                        onClick={() => { setEditingPlayer({ ...p }); setSyncMember(false); }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                        title="Edit Details"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      
                      {/* PAY BUTTON */}
                      {p.paymentStatus === 'UNPAID' && (activeSession?.paymentScheme === 'FIXED' || p.playingStatus === 'INACTIVE') ? (
                        <button
                          onClick={() => setSettlingPlayer(p)}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 font-bold text-[10px] border border-green-100 hover:bg-green-600 hover:text-white"
                          title="Settle Payment"
                        >
                          ₱
                        </button>
                      ) : (
                         <div className="w-6 h-6"></div> // Placeholder for grid alignment
                      )}

                      {/* SAFE DELETE BUTTON */}
                      {(p.gamesPlayed || 0) === 0 && p.playingStatus !== 'PLAYING' ? (
                        <button onClick={() => removePlayer(p.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-600 hover:text-white">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      ) : (
                         <div className="w-6 h-6"></div> // Placeholder for grid alignment
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
                  className={`p-4 rounded-xl shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing group relative ${selectedGameId === game.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-400'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[8px] font-black text-blue-600 uppercase">{game.type}</div>
                    <div className="flex gap-1 -mt-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingGame(game); }}
                        className="p-1 rounded-md bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                        title="Edit Pending Game"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelGame(game.id); }}
                        className="p-1 rounded-md bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                        title="Cancel Game"
                      >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
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
            <button 
              onClick={handleAddCourt}
              className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-800 transition-colors"
            >
              + Add Court
            </button>
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
                <div className="bg-slate-800 p-2 flex justify-between items-center group/court">
                  <div className="flex items-center flex-1">
                    <input 
                      defaultValue={c.name} 
                      onBlur={(e) => handleUpdateCourtName(c.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateCourtName(c.id, (e.target as HTMLInputElement).value)}
                      className="bg-transparent text-white font-black text-[10px] uppercase outline-none focus:bg-slate-700 px-2 rounded w-full max-w-[120px] transition-colors" 
                    />
                    <span className={`ml-2 text-[8px] font-bold px-2 py-0.5 rounded uppercase ${c.game ? 'bg-blue-500 text-white' : (c.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white')}`}>
                      {c.game ? 'Playing' : c.status}
                    </span>
                  </div>
                  
                  {!c.game && activeSession.courts.length > 1 && (
                    <button 
                      onClick={() => handleDeleteCourt(c.id)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover/court:opacity-100 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
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
                          disabled={!window.speechSynthesis}
                          title={window.speechSynthesis ? 'Announce Matchup on Speaker' : 'Text-to-speech not supported in this browser (use Chrome)'}
                          className={`p-2 rounded-full transition-colors flex items-center justify-center shadow-sm border ${window.speechSynthesis ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
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
                        <button
                          onClick={() => handleCancelGame(c.game.id)}
                          title="Void/Cancel Game"
                          className="bg-red-50 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-sm border border-red-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
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

            <div className="px-6 py-2">
              <button 
                onClick={handleSmartSuggest}
                className="w-full py-3 bg-purple-50 text-purple-600 border border-purple-200 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <span className="group-hover:animate-pulse">🪄</span>
                Smart Match Suggestions
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Team A Selection */}
              <div>
                <h4 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">Team A</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.isArray(players) && players.filter(p => p.playingStatus === 'ACTIVE' && !pendingPlayerIds.has(p.id) && !teamB.find(t => t.id === p.id)).map(p => (
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
                  {Array.isArray(players) && players.filter(p => p.playingStatus === 'ACTIVE' && !pendingPlayerIds.has(p.id) && !teamA.find(t => t.id === p.id)).map(p => (
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

      {/* EDIT PENDING GAME MODAL */}
      {editingGame && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100">
            <div className="p-6 border-b flex justify-between items-center bg-blue-50/30">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic leading-none">Edit Pending Game</h3>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Update teams or match type</span>
              </div>
              <select 
                value={editingGame.type} 
                onChange={e => setEditingGame({ ...editingGame, type: e.target.value, teamA: [], teamB: [] })} 
                className="p-2 bg-white rounded-lg text-xs font-bold border border-slate-200 shadow-sm"
              >
                <option>Singles</option>
                <option>Doubles</option>
                <option>Triples</option>
              </select>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Team A Selection */}
              <div>
                <h4 className="text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest px-1">Team A</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Array.isArray(players) && players
                    .filter(p => 
                      p.playingStatus === 'ACTIVE' && 
                      (!pendingPlayerIds.has(p.id) || editingGame.teamA?.find((t: any) => t.id === p.id) || editingGame.teamB?.find((t: any) => t.id === p.id)) && 
                      !editingGame.teamB?.find((t: any) => t.id === p.id)
                    )
                    .map(p => {
                      const isSelected = editingGame.teamA?.find((t: any) => t.id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => isSelected 
                            ? setEditingGame({ ...editingGame, teamA: editingGame.teamA.filter((t: any) => t.id !== p.id) }) 
                            : setEditingGame({ ...editingGame, teamA: [...(editingGame.teamA || []), p] })
                          }
                          className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        >
                          {p.name}
                        </button>
                      );
                    })
                  }
                </div>
              </div>
              {/* Team B Selection */}
              <div>
                <h4 className="text-[10px] font-black text-red-600 uppercase mb-3 tracking-widest px-1">Team B</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Array.isArray(players) && players
                    .filter(p => 
                      p.playingStatus === 'ACTIVE' && 
                      (!pendingPlayerIds.has(p.id) || editingGame.teamA?.find((t: any) => t.id === p.id) || editingGame.teamB?.find((t: any) => t.id === p.id)) && 
                      !editingGame.teamA?.find((t: any) => t.id === p.id)
                    )
                    .map(p => {
                      const isSelected = editingGame.teamB?.find((t: any) => t.id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => isSelected 
                            ? setEditingGame({ ...editingGame, teamB: editingGame.teamB.filter((t: any) => t.id !== p.id) }) 
                            : setEditingGame({ ...editingGame, teamB: [...(editingGame.teamB || []), p] })
                          }
                          className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-100' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        >
                          {p.name}
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex space-x-3">
              <button 
                onClick={handleUpdateGame} 
                className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingGame(null)} 
                className="px-8 py-4 bg-white text-slate-400 font-black rounded-2xl uppercase tracking-widest text-xs border border-slate-200 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
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
              {/* BROWSER COMPATIBILITY WARNING */}
              {!window.speechSynthesis && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                  <div>
                    <p className="text-[11px] font-black text-amber-800 uppercase tracking-wide">Not supported in this browser</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Text-to-speech requires Chrome. Opera and DuckDuckGo do not support this feature.</p>
                  </div>
                </div>
              )}
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
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dialogue Template</label>
                  <button
                    onClick={() => setTtsSettings(prev => ({ ...prev, template: 'Game assigned to {court}. {teamA}, versus, {teamB}.' }))}
                    className="text-[9px] font-black text-blue-500 uppercase tracking-wider hover:text-blue-700 transition-colors"
                  >
                    Reset Default
                  </button>
                </div>
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
                  <span className="ml-auto opacity-60 normal-case">Case-insensitive</span>
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
      {/* EDIT PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="text-sm font-black uppercase tracking-widest italic">Edit Player Details</h3>
              <button onClick={() => setEditingPlayer(null)} className="hover:text-slate-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdatePlayer} className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name / Alias</label>
                <input 
                  type="text" 
                  value={editingPlayer.name} 
                  onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gender</label>
                  <select 
                    value={editingPlayer.gender} 
                    onChange={e => setEditingPlayer({...editingPlayer, gender: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Skill Level</label>
                  <select 
                    value={editingPlayer.levelWeight} 
                    onChange={e => setEditingPlayer({...editingPlayer, levelWeight: parseInt(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="1">Lvl 1 (Beginner)</option>
                    <option value="2">Lvl 2 (Intermediate)</option>
                    <option value="3">Lvl 3 (Advance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1 flex justify-between">
                  <span>🤝 Fix Partner</span>
                  {editingPlayer.partnerId && (
                    <button 
                      type="button" 
                      onClick={() => handleUpdatePartner(editingPlayer.id, null)}
                      className="text-[8px] text-red-500 font-black hover:underline"
                    >
                      Unlink Partner
                    </button>
                  )}
                </label>
                <select 
                  value={editingPlayer.partnerId || ''} 
                  onChange={e => handleUpdatePartner(editingPlayer.id, e.target.value || null)}
                  className="w-full p-4 bg-purple-50/50 border border-purple-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-700"
                >
                  <option value="">-- No Fixed Partner --</option>
                  {players
                    .filter(p => p.id !== editingPlayer.id && p.playingStatus === 'ACTIVE')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.partnerId ? '(Already Linked)' : ''}
                      </option>
                    ))
                  }
                </select>
                <p className="text-[8px] text-slate-400 mt-2 italic px-1">Fixed pairs are always drafted together in Tournament Mode.</p>
              </div>

              {editingPlayer.memberId && (
                <label className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={syncMember} 
                    onChange={e => setSyncMember(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-[10px] font-black text-blue-800 uppercase block leading-none">Sync to Permanent Profile</span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Correct the Member records permanently</span>
                  </div>
                </label>
              )}

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setEditingPlayer(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl uppercase tracking-widest text-xs transition-all hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-md shadow-blue-100 hover:bg-blue-700 transition-all text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLEMENT MODAL */}
      {settlingPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest italic">Settle Payment</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{settlingPlayer.name}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Amount Due</span>
                <span className="text-3xl font-black text-slate-900">
                  PHP {activeSession.paymentScheme === 'GAME' 
                    ? (activeSession.baseFee + (activeSession.gameFee * settlingPlayer.gamesPlayed)) 
                    : activeSession.baseFee}
                </span>
                {activeSession.paymentScheme === 'GAME' && (
                  <span className="text-[9px] font-bold text-slate-400 block mt-1 uppercase tracking-tighter">
                    {activeSession.baseFee} (Base) + ({activeSession.gameFee} x {settlingPlayer.gamesPlayed} games)
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['GCash', 'Cash', 'QRPH'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleUpdatePayment(settlingPlayer.id, 'PAID', mode)}
                      className="p-3 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={() => handleUpdatePayment(settlingPlayer.id, 'UNPAID', '')}
                  className="flex-1 py-4 bg-red-50 text-red-600 font-black rounded-xl uppercase tracking-widest text-[9px] border border-red-100"
                >
                  Reset to Unpaid
                </button>
                <button 
                  onClick={() => setSettlingPlayer(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-400 font-black rounded-xl uppercase tracking-widest text-[9px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL SETTINGS MODAL */}
      {showFinancialsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Session Financials</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Active Scheme: {activeSession.paymentScheme}</p>
              </div>
              <button onClick={() => setShowFinancialsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <span className="text-[10px] font-black text-green-700 uppercase block mb-1">Collected</span>
                  <span className="text-2xl font-black text-green-900 leading-none">₱{financials.collected}</span>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <span className="text-[10px] font-black text-red-700 uppercase block mb-1">Outstanding</span>
                  <span className="text-2xl font-black text-red-900 leading-none">₱{financials.outstanding}</span>
                </div>
              </div>

              {/* Editable Rates */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Update Session Rates</label>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button 
                    type="button" 
                    onClick={() => setPaymentScheme('FIXED')}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentScheme === 'FIXED' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    Fixed Fee
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentScheme('GAME')}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentScheme === 'GAME' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                  >
                    Game Fee
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Base/Court Fee (PHP)</label>
                    <input 
                      type="number" 
                      value={baseFee} 
                      onChange={e => setBaseFee(parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  {paymentScheme === 'GAME' && (
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Fee per Game (PHP)</label>
                      <input 
                        type="number" 
                        value={gameFee} 
                        onChange={e => setGameFee(parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpdateFinancials}
                  className="w-full py-3 bg-blue-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Update All Bills
                </button>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Current Breakdown</label>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  {Object.entries(financials.breakdown).map(([mode, amount]) => (
                    <div key={mode} className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 uppercase tracking-tighter">{mode}</span>
                      <span className="text-slate-800 tracking-tighter">₱{amount}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-black text-xs">
                    <span className="text-slate-400 uppercase">Total Revenue</span>
                    <span className="text-blue-600">₱{financials.collected + financials.outstanding}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFinancialsModal(false)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg mt-2"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFTING SETTINGS MODAL */}
      {showDraftSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-purple-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic leading-none">Drafting Engine</h3>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Experimental Utilities</span>
                </div>
              </div>
              <button onClick={() => setShowDraftSettings(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm border border-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1 flex justify-between">
                    <span>Skill Parity Weight</span>
                    <span className="text-purple-600 font-black">{draftSettings.levelWeight}</span>
                  </label>
                  <input
                    type="range" min="0" max="10" step="1"
                    value={draftSettings.levelWeight}
                    onChange={e => setDraftSettings({ ...draftSettings, levelWeight: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[8px] text-slate-400 mt-2 italic leading-relaxed">Prioritizes matching players with similar L1-L5 ratings.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1 flex justify-between">
                    <span>Wait Time Bonus</span>
                    <span className="text-purple-600 font-black">{draftSettings.idleWeight}</span>
                  </label>
                  <input
                    type="range" min="0" max="10" step="1"
                    value={draftSettings.idleWeight}
                    onChange={e => setDraftSettings({ ...draftSettings, idleWeight: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[8px] text-slate-400 mt-2 italic leading-relaxed">Gives priority to players with the longest idle time since their last game.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1 flex justify-between">
                    <span>Variety Penalty</span>
                    <span className="text-purple-600 font-black">{draftSettings.historyWeight}</span>
                  </label>
                  <input
                    type="range" min="0" max="10" step="1"
                    value={draftSettings.historyWeight}
                    onChange={e => setDraftSettings({ ...draftSettings, historyWeight: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[8px] text-slate-400 mt-2 italic leading-relaxed">Penalizes matches with the same partners or opponents from recent games.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div 
                  onClick={() => setDraftSettings({ ...draftSettings, tournamentMode: !draftSettings.tournamentMode })}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${draftSettings.tournamentMode ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-tight ${draftSettings.tournamentMode ? 'text-purple-700' : 'text-slate-800'}`}>Tournament Practice Mode</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Enable this to prioritize "Fixed Pairs" staying together for drill sets.</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${draftSettings.tournamentMode ? 'bg-purple-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${draftSettings.tournamentMode ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowDraftSettings(false)}
                className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE LOBBY MODAL */}
      {showLobbyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Share Public Lobby</h3>
                <p className="text-[10px] text-purple-200 font-bold uppercase mt-1">For player viewing only</p>
              </div>
              <button onClick={() => setShowLobbyModal(false)} className="hover:text-purple-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 flex flex-col items-center space-y-6 text-center">
              <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-purple-100 border-4 border-purple-50">
                <QRCodeSVG 
                  value={`${window.location.origin}/lobby/${activeSession.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Players can scan this to see</p>
                <div className="flex flex-wrap justify-center gap-2">
                   {['Live Match Score', 'On-Deck List', 'Waitlist Status'].map(tag => (
                     <span key={tag} className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{tag}</span>
                   ))}
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-50">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/lobby/${activeSession.id}`);
                    alert("Lobby link copied to clipboard!");
                  }}
                  className="w-full py-3 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-all"
                >
                  Copy Link to Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
