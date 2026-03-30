import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/Dashboard';
import LobbyView from './components/LobbyView';

function App() {
  return (
    <Routes>
      {/* Admin / Host View */}
      <Route path="/" element={<DashboardLayout />} />
      
      {/* Player / Public View */}
      <Route path="/lobby/:sessionId" element={<LobbyView />} />
    </Routes>
  );
}

export default App;
