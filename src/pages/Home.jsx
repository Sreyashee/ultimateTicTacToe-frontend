import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Connect socket when component mounts
    socket.connect();

    const handleStartGame = ({ roomCode, players, yourSymbol }) => {
  navigate('/multiplayer', { 
    state: { 
      name, 
      roomCode,
      mySymbol: yourSymbol || players.find(p => p.id === socket.id)?.symbol 
    } 
  });
};

    const handleInvalidRoom = () => {
      alert('Invalid or full room code!');
      setIsConnecting(false);
    };

    const handlePartnerLeft = () => {
      alert('Your partner disconnected.');
      navigate('/');
    };

    socket.on('startGame', handleStartGame);
    socket.on('invalidRoom', handleInvalidRoom);
    socket.on('partnerLeft', handlePartnerLeft);

    return () => {
      socket.off('startGame', handleStartGame);
      socket.off('invalidRoom', handleInvalidRoom);
      socket.off('partnerLeft', handlePartnerLeft);
      // Don't disconnect here - keep connection alive
    };
  }, [name, navigate]);

  const handleSinglePlayer = () => {
    if (!name.trim()) {
      setShowPopup(true);
    } else {
      navigate('/single', { state: { name } });
    }
    setError('');
  };

  const handleMultiplayer = () => {
    setShowMultiplayer(true);
    setCode('');
    setEnteredCode('');
    setIsCodeGenerated(false);
    setIsConnecting(false);
  };

  const handleEnterSingle = () => {
    if (name.trim() === '') {
      setError('Name cannot be empty!');
    } else {
      setError('');
      navigate('/single', { state: { name } });
    }
  };
const handleGenerateCode = () => {
  if (!name.trim()) {
    setError('Please enter your name first');
    return;
  }
  
  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Force uppercase
  setCode(newCode);
  setIsCodeGenerated(true);
  setIsConnecting(true);
  
  socket.emit('createRoom', { 
    roomCode: newCode, 
    name 
  }, (response) => {
    if (response.error) {
      alert(response.error);
      setIsConnecting(false);
    } else {
      navigate('/multiplayer', { 
        state: { 
          name, 
          roomCode: newCode,
          mySymbol: 'X'
        } 
      });
    }
  });
};

const handleJoinRoom = () => {
  if (!name.trim()) {
    setError('Please enter your name first');
    return;
  }
  
  if (!enteredCode.trim()) {
    alert('Please enter a room code');
    return;
  }
  
  const normalizedCode = enteredCode.trim().toUpperCase(); // Normalize input
  setIsConnecting(true);
  
  socket.emit('joinRoom', { 
    roomCode: normalizedCode, 
    name 
  }, (response) => {
    if (response.error) {
      alert(response.error);
      setIsConnecting(false);
    }
  });
};


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showPopup) handleEnterSingle();
      else if (showMultiplayer && enteredCode) handleJoinRoom();
    }
  };
  useEffect(() => {
  // Ensure fresh connection
  if (!socket.connected) {
    socket.connect();
  }

  const handleConnectionError = () => {
    alert('Connection error. Please refresh the page.');
  };

  socket.on('connect_error', handleConnectionError);

  return () => {
    socket.off('connect_error', handleConnectionError);
  };
}, []);

  return (
    <div className="home-container">
      <div className="box">
        <h1>Basic TicTacToe</h1>
        <button onClick={handleSinglePlayer}>Single Player</button>
        <button onClick={handleMultiplayer}>Multiplayer</button>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="popup modal-popup">
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              ×
            </button>
            <h3>Enter your name</h3>
            <input
              className="name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Your name"
            />
            {error && (
              <p style={{ color: '#fff', fontSize: '0.9rem', marginTop: '6px' }}>{error}</p>
            )}
            <button 
              className="enter-btn" 
              onClick={handleEnterSingle}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Enter'}
            </button>
          </div>
        </div>
      )}

      {showMultiplayer && (
        <div className="modal-overlay">
          <div className="popup modal-popup">
            <button 
              className="close-btn" 
              onClick={() => setShowMultiplayer(false)}
              disabled={isConnecting}
            >
              ×
            </button>
            <h3>Enter your name</h3>
            <input
              className="name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Your name"
              disabled={isConnecting}
            />
            {error && (
              <p style={{ color: '#fff', fontSize: '0.9rem', marginTop: '6px' }}>{error}</p>
            )}

            <button 
              className="enter-btn" 
              onClick={handleGenerateCode}
              disabled={isConnecting || isCodeGenerated}
            >
              {isConnecting ? 'Generating...' : 'Generate Code'}
            </button>

            {isCodeGenerated && (
            <>
              <p><strong>Code:</strong> {code}</p>
              <button
                className="enter-btn"
                onClick={() => {
                  navigator.clipboard.writeText(code)
                    .then(() => alert('Code copied to clipboard!'))
                    .catch(err => console.error('Failed to copy:', err));
                }}
                disabled={isConnecting}
              >
                Copy
              </button>
                <a
                  className="enter-btn"
                  href={`https://wa.me/?text=Join my TicTacToe game! Use code: ${code}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share via WhatsApp
                </a>
                <p>Waiting for another player to join...</p>
              </>
            )}

            <hr />

            <h4>Or Enter Code</h4>
            <input
              className="name-input"
              placeholder="Enter code"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isConnecting}
            />
            <button 
              className="enter-btn" 
              onClick={handleJoinRoom}
              disabled={isConnecting || !enteredCode.trim()}
            >
              {isConnecting ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 