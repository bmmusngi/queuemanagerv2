import React, { useState, useEffect } from 'react';


export default function QueueingGroupManager() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Directly targeting your ASUSTOR backend over Tailscale
  const API_URL = 'http://100.88.175.25:3001/api/queueing-groups';

  // Fetch existing groups from the database
  const fetchGroups = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  // Load groups when the component mounts
  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle the form submission
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Assuming your Prisma schema requires a 'name' field for the group
        body: JSON.stringify({ name: groupName }) 
      });
      
      if (response.ok) {
        setGroupName(''); // Clear the input
        fetchGroups();    // Refresh the list immediately
      } else {
        console.error('Failed to save to database');
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Manage Queueing Groups</h2>
      
      {/* Creation Form */}
      <form onSubmit={handleCreateGroup} className="flex gap-4 mb-8">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Tuesday Smashers"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Create Group'}
        </button>
      </form>

      {/* List of Existing Groups */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Active Groups
        </h3>
        {groups.length === 0 ? (
          <p className="text-slate-500 italic">No groups found. Create one above!</p>
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
            {groups.map((group: any) => (
              <li key={group.id} className="p-4 flex justify-between items-center bg-slate-50">
                <span className="font-medium text-slate-800">{group.name}</span>
                <span className="text-xs text-slate-500">ID: {group.id.slice(0,8)}...</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
