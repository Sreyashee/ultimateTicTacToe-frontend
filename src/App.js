
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SinglePlayerGame from './pages/SinglePlayerGame';

// In your main App.js or routing file
import Multiplayer from './pages/Multiplayer';
import UltimateTicTacToe from './pages/UltimateTicTacToe';

// Add this route

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single" element={<SinglePlayerGame />} />
       
<Route path="/multiplayer" element={<Multiplayer />} />
<Route path="/ultimate" element={<UltimateTicTacToe />} />

      </Routes>
    </Router>
  );
}

export default App;
