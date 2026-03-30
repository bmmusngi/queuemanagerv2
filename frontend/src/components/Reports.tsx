import React, { useState, useEffect } from 'react';
import GameHistoryTable from './GameHistoryTable';

export default function Reports() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://100.88.175.25:8459/api';

  // Load backend session history
  useEffect(() => {
    fetch(`${API_BASE}/sessions/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(err => console.error("Error loading session history:", err));
  }, []);

  // Load specific session details for financial reporting
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionDetails(null);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/sessions/${selectedSessionId}`)
      .then(res => res.json())
      .then(data => setSessionDetails(data))
      .catch(err => console.error("Error loading session details:", err))
      .finally(() => setLoading(false));
  }, [selectedSessionId]);

  const handleUpdatePayment = async (playerId: string, status: string, mode: string) => {
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, mode })
      });
      if (res.ok) {
        const updatedRes = await fetch(`${API_BASE}/sessions/${selectedSessionId}`);
        const updatedData = await updatedRes.json();
        setSessionDetails(updatedData);
      }
    } catch (err) {
      console.error("Failed to update payment:", err);
    }
  };

  // Calculate Financials for the selected session
  const financials = React.useMemo(() => {
    if (!sessionDetails || !sessionDetails.players) return null;
    
    let collected = 0;
    let outstanding = 0;
    const breakdown = { GCash: 0, Cash: 0, QRPH: 0 };
    const unpaidPlayers: any[] = [];

    sessionDetails.players.forEach((p: any) => {
      const amount = sessionDetails.paymentScheme === 'GAME'
        ? (sessionDetails.baseFee + (sessionDetails.gameFee * (p.gamesPlayed || 0)))
        : (sessionDetails.baseFee || 0);

      if (p.paymentStatus === 'PAID') {
        collected += amount;
        if (p.paymentMode === 'GCash') breakdown.GCash += amount;
        if (p.paymentMode === 'Cash') breakdown.Cash += amount;
        if (p.paymentMode === 'QRPH') breakdown.QRPH += amount;
      } else {
        outstanding += amount;
        unpaidPlayers.push({ ...p, amountDue: amount });
      }
    });

    return { collected, outstanding, breakdown, unpaidPlayers };
  }, [sessionDetails]);

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-10 pr-2 custom-scrollbar">
      {/* Intro Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Post-Session Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Review the historical game data for any past setup.</p>
      </div>

      {/* Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Select a Session</label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full lg:w-1/2 p-3 border-2 border-slate-100 rounded-lg bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
        >
          <option value="">-- Choose Historical Session --</option>
          {sessions.map((s: any) => {
            const dateStr = new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const groupName = s.queueingGroup?.name || 'Unknown Group';
            return (
              <option key={s.id} value={s.id}>
                {dateStr} | {groupName} ({s.venue || 'No Venue'}) - {s.status}
              </option>
            );
          })}
        </select>
      </div>

      {/* Table & Financials Split */}
      {selectedSessionId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main History Table */}
          <div className="lg:col-span-2 space-y-6">
            <GameHistoryTable sessionId={selectedSessionId} />
          </div>

          {/* Financial Sidebar */}
          <div className="space-y-6">
            {financials && (
              <>
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Financial Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase block tracking-tighter">Total Collected</span>
                        <span className="text-2xl font-black text-green-400">₱{financials.collected}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase block tracking-tighter">Outstanding</span>
                        <span className={`text-xl font-black ${financials.outstanding > 0 ? 'text-red-400' : 'text-slate-400'}`}>₱{financials.outstanding}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2">
                       {Object.entries(financials.breakdown).map(([mode, amount]) => (
                         <div key={mode} className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                           <span>{mode}</span>
                           <span className="text-slate-200">₱{amount}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Unpaid List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unpaid Balances</h3>
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">{financials.unpaidPlayers.length}</span>
                  </div>
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {financials.unpaidPlayers.length === 0 ? (
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-4 italic opacity-60">All debts settled</p>
                    ) : (
                      financials.unpaidPlayers.map(p => (
                        <div key={p.id} className="flex justify-between items-center group bg-slate-50/50 p-2 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                          <div>
                            <span className="text-xs font-black text-slate-700 block leading-tight">{p.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.gamesPlayed || 0} Games</span>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-xs font-black text-red-600 block leading-tight">₱{p.amountDue}</span>
                            <button 
                              onClick={() => handleUpdatePayment(p.id, 'PAID', 'Cash')}
                              className="mt-1 text-[8px] font-black bg-red-50 text-red-600 px-2 py-1 rounded-lg uppercase tracking-tighter hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            >
                              Mark Paid
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
