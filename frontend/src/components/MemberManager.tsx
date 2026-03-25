import React, { useState, useEffect } from 'react';

export default function MemberManager() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [members, setMembers] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  
  // Single Member State
  const [singleMember, setSingleMember] = useState({ name: '', gender: 'Male', levelWeight: 1 });
  
  // Bulk Member State
  const [bulkText, setBulkText] = useState('');

  const API_BASE = 'http://100.88.175.25:3001/api';

  // Load groups on mount
  useEffect(() => {
    fetch(`${API_BASE}/queueing-groups`)
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Error loading groups:", err));
  }, []);

  // Load members when group changes
  useEffect(() => {
    if (selectedGroupId) {
      fetch(`${API_BASE}/members?groupId=${selectedGroupId}`)
        .then(res => res.json())
        .then(data => setMembers(data))
        .catch(err => console.error("Error loading members:", err));
    }
  }, [selectedGroupId]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return alert("Please select a group first!");

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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !bulkText.trim()) return;

    // Split text by lines and map to DTO format
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    const bulkData = lines.map(name => ({
      name: name.trim(),
      gender: 'Male', // Defaulting for bulk, can be edited later
      levelWeight: 1,
      groupId: selectedGroupId
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

  const refreshMemberList = () => {
    fetch(`${API_BASE}/members?groupId=${selectedGroupId}`)
      .then(res => res.json())
      .then(data => setMembers(data));
  };

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
          Target Queueing Group
        </label>
        <select 
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full p-3 border-2 border-slate-100 rounded-lg bg-slate-50 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">-- Select a Group to Manage Members --</option>
          {groups.map((g: any) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroupId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Add Players</h3>
                <button 
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {isBulkMode ? 'Single Entry' : 'Bulk Paste'}
                </button>
              </div>

              {!isBulkMode ? (
                <form onSubmit={handleSingleSubmit} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={singleMember.name}
                    onChange={e => setSingleMember({...singleMember, name: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={singleMember.gender}
                      onChange={e => setSingleMember({...singleMember, gender: e.target.value})}
                      className="p-2 border rounded-md text-sm"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                    <select 
                      value={singleMember.levelWeight}
                      onChange={e => setSingleMember({...singleMember, levelWeight: parseInt(e.target.value)})}
                      className="p-2 border rounded-md text-sm"
                    >
                      <option value="1">Beginner (1)</option>
                      <option value="2">Intermediate (2)</option>
                      <option value="3">Advanced (3)</option>
                    </select>
                  </div>
                  <button className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors">
                    Register Player
                  </button>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Paste names (one per line)</p>
                  <textarea 
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    rows={8}
                    className="w-full p-2 border rounded-md text-sm font-mono"
                    placeholder="Juan Dela Cruz&#10;Maria Clara&#10;Joel Coach"
                  />
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-500 transition-colors">
                    Import List
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Player Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Gender</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{m.name}</td>
                      <td className="p-4 text-slate-600 text-sm">{m.gender}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          m.levelWeight === 3 ? 'bg-red-100 text-red-700' : 
                          m.levelWeight === 2 ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          LEVEL {m.levelWeight}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic">No players registered yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
