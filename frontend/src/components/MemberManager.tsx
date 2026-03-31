import React, { useState, useEffect } from 'react';

export default function MemberManager({ preselectedGroupId }: { preselectedGroupId?: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId || '');
  const [members, setMembers] = useState<any[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', gender: 'Male', levelWeight: 1 });

  // Registration State
  const [singleMember, setSingleMember] = useState({ name: '', gender: 'Male', levelWeight: 1 });
  const [bulkText, setBulkText] = useState('');

  const API_BASE = 'http://100.88.175.25:8459/api';

  useEffect(() => {
    fetch(`${API_BASE}/queueing-groups`)
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Error loading groups:", err));
  }, []);

  useEffect(() => {
    if (preselectedGroupId && preselectedGroupId !== selectedGroupId) {
      setSelectedGroupId(preselectedGroupId);
    }
  }, [preselectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) refreshMemberList();
  }, [selectedGroupId]);

  const refreshMemberList = () => {
    // Note: Ensure backend returns ALL members (active and inactive) for this to work perfectly
    fetch(`${API_BASE}/members?groupId=${selectedGroupId}`)
      .then(res => res.json())
      .then(data => setMembers(data));
  };

  // --- CRUD ACTIONS ---

  const handleToggleStatus = async (id, currentStatus) => {
    const method = currentStatus ? 'DELETE' : 'PUT';
    const body = currentStatus ? null : JSON.stringify({ isActive: true });

    const response = await fetch(`${API_BASE}/members/${id}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    if (response.ok) refreshMemberList();
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditForm({ name: member.name, gender: member.gender, levelWeight: member.levelWeight });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/members/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });

    if (response.ok) {
      setEditingId(null);
      refreshMemberList();
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...singleMember, groupId: selectedGroupId })
    });
    if (response.ok) {
      setSingleMember({ name: '', gender: 'Male', levelWeight: 1 });
      refreshMemberList();
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    const bulkData = lines.map(name => ({
      name: name.trim(), gender: 'Male', levelWeight: 1, groupId: selectedGroupId
    }));

    const response = await fetch(`${API_BASE}/members/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkData)
    });

    if (response.ok) {
      setBulkText('');
      setIsBulkMode(false);
      refreshMemberList();
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Group Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Selected Group</label>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full p-3 border-2 border-slate-100 rounded-lg bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500"
        >
          <option value="">-- Select Group --</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {selectedGroupId && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Registration Form */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 uppercase text-sm">Add Players</h3>
                <button onClick={() => setIsBulkMode(!isBulkMode)} className="text-[10px] font-bold text-blue-600 uppercase border-b border-blue-600">
                  {isBulkMode ? 'Single' : 'Bulk'}
                </button>
              </div>

              {!isBulkMode ? (
                <form onSubmit={handleSingleSubmit} className="space-y-3">
                  <input type="text" placeholder="Name" value={singleMember.name} onChange={e => setSingleMember({ ...singleMember, name: e.target.value })} className="w-full p-2 border rounded-md" required />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={singleMember.gender} onChange={e => setSingleMember({ ...singleMember, gender: e.target.value })} className="p-2 border rounded-md text-sm"><option>Male</option><option>Female</option></select>
                    <select value={singleMember.levelWeight} onChange={e => setSingleMember({ ...singleMember, levelWeight: parseInt(e.target.value) })} className="p-2 border rounded-md text-sm">
                      <option value="1">Lvl 1</option><option value="2">Lvl 2</option><option value="3">Lvl 3</option>
                    </select>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-tighter">Register</button>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-3">
                  <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} className="w-full p-2 border rounded-md text-sm font-mono" placeholder="Juan&#10;Maria" />
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm uppercase">Import List</button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: Roster Table */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Registered Roster ({members.length})</span>
              </div>

              {/* THE SCROLLABLE WRAPPER */}
              <div className="max-h-[75vh] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
                    <tr className="text-[10px] font-black text-slate-400 uppercase">
                      <th className="p-4">Name</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4 text-center">Level</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m: any) => (
                      <tr key={m.id} className={`${!m.isActive ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                        {editingId === m.id ? (
                          // EDIT MODE ROW
                          <td colSpan={4} className="p-4">
                            <form onSubmit={handleUpdate} className="flex gap-2 items-center">
                              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="flex-grow p-1 border rounded text-sm" />
                              <select value={editForm.levelWeight} onChange={e => setEditForm({ ...editForm, levelWeight: parseInt(e.target.value) })} className="p-1 border rounded text-sm">
                                <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                              </select>
                              <button type="submit" className="text-xs bg-green-600 text-white px-2 py-1 rounded">Save</button>
                              <button onClick={() => setEditingId(null)} className="text-xs bg-slate-300 px-2 py-1 rounded">Cancel</button>
                            </form>
                          </td>
                        ) : (
                          // READ MODE ROW
                          <>
                            <td className="p-4 font-bold text-slate-800 text-sm">{m.name}</td>
                            <td className="p-4 text-slate-500 text-xs">{m.gender}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-black ${m.levelWeight === 3 ? 'bg-red-100 text-red-700' : m.levelWeight === 2 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                L{m.levelWeight}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {/* Add to Session (Disabled Placeholder) */}
                              <button disabled className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold uppercase cursor-not-allowed">Queue</button>

                              {/* Update Button */}
                              <button onClick={() => startEdit(m)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Edit</button>

                              {/* Toggle Active Button */}
                              <button
                                onClick={() => handleToggleStatus(m.id, m.isActive)}
                                className={`text-[10px] font-bold uppercase hover:underline ${m.isActive ? 'text-red-500' : 'text-green-600'}`}
                              >
                                {m.isActive ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
