import React, { useState } from 'react';

const API_BASE = 'https://shirostor.tailf23fe.ts.net:3001/api';

export default function Admin() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleResetDatabase = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/reset-db`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Reload the entire application state on success
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to reset database.');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while resetting the database.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Administration</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Manage core system properties and testing data.</p>
      </div>
      
      <div className="p-8 flex-1">
        <div className="max-w-md border border-red-200 bg-red-50 rounded-2xl p-6">
          <h3 className="text-lg font-black text-red-700 uppercase tracking-tight mb-2">Danger Zone</h3>
          <p className="text-sm font-medium text-red-600 mb-6 font-semibold">
            This action will permanently purge all queueing groups, members, sessions, games, and players from the system. Only the foundational Sports data will be preserved.
          </p>
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-3 bg-white border-2 border-red-200 text-red-600 font-black rounded-xl uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Reset Database
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase italic">Are you absolutely sure?</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">This will wipe all active structural data and cannot be undone.</p>
            
            {error && <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-2 rounded">{error}</div>}

            <button 
              onClick={handleResetDatabase} 
              disabled={isDeleting}
              className={`w-full py-4 text-white font-black rounded-xl uppercase tracking-widest mb-2 shadow-lg shadow-red-100 transition-all ${isDeleting ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isDeleting ? 'Nuking Database...' : 'Yes, Delete Everything'}
            </button>
            <button 
              onClick={() => setShowConfirmModal(false)} 
              disabled={isDeleting}
              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
