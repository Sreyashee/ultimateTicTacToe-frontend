
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';
import './Multiplayer.css';

const Multiplayer = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { name, roomCode } = state || {};
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [mySymbol, setMySymbol] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  useEffect(() => {
    if (!name || !roomCode) {
      navigate('/');
      return;
    }

    // Initialize socket with reconnection options
    socket.connect();

    // Connection status handlers
    const onConnect = () => {
      setConnectionStatus('connected');
      console.log('Connected to server');
      // Try to reconnect to room if we were in one
      if (roomCode && mySymbol) {
        socket.emit('reconnectToRoom', { roomCode }, (response) => {
          if (response?.success) {
            setBoard(response.roomState.board);
            setCurrentPlayer(response.roomState.currentTurn);
            setPlayers(response.roomState.players);
          }
        });
      }
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from server');
    };

    const onReconnect = (attemptNumber) => {
      setConnectionStatus('reconnecting');
      console.log(`Reconnection attempt ${attemptNumber}`);
    };

    // Game event handlers
    const onMoveMade = ({ cellIndex, symbol, currentTurn, board }) => {
      setBoard(board);
      setCurrentPlayer(currentTurn);
      checkWinner(board);
    };

    const onGameEnded = ({ winner }) => {
      setWinner(winner);
    };

    const onPartnerDisconnected = () => {
      alert('Your partner disconnected. Waiting for them to reconnect...');
    };

    const onPartnerReconnected = () => {
      alert('Your partner has reconnected!');
    };

    const onStartGame = ({ players, currentTurn, yourSymbol }) => {
      setPlayers(players);
      setCurrentPlayer(currentTurn);
      setMySymbol(yourSymbol);
      setGameStarted(true);
    };

    const onGameReset = ({ board, currentTurn }) => {
      setBoard(board);
      setCurrentPlayer(currentTurn);
      setWinner(null);
    };

    // Socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('moveMade', onMoveMade);
    socket.on('gameEnded', onGameEnded);
    socket.on('partnerDisconnected', onPartnerDisconnected);
    socket.on('partnerReconnected', onPartnerReconnected);
    socket.on('startGame', onStartGame);
    socket.on('gameReset', onGameReset);
    socket.on('heartbeat', () => {
      socket.emit('heartbeat');
    });

    // Get initial game state
    socket.emit('getGameState', { roomCode }, (gameState) => {
      if (gameState) {
        setBoard(gameState.board);
        setCurrentPlayer(gameState.currentTurn);
        setPlayers(gameState.players);
        
        const myPlayer = gameState.players.find(p => p.name === name);
        if (myPlayer) {
          setMySymbol(myPlayer.symbol);
          setGameStarted(true);
        }
      }
    });

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('moveMade', onMoveMade);
      socket.off('gameEnded', onGameEnded);
      socket.off('partnerDisconnected', onPartnerDisconnected);
      socket.off('partnerReconnected', onPartnerReconnected);
      socket.off('startGame', onStartGame);
      socket.off('gameReset', onGameReset);
      socket.off('heartbeat');
    };
  }, [name, roomCode, navigate, mySymbol]);

  const checkWinner = (board) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        socket.emit('gameOver', { roomCode, winner: board[a] });
        return;
      }
    }

    if (!board.includes(null)) {
      setWinner('draw');
      socket.emit('gameOver', { roomCode, winner: 'draw' });
    }
  };

  const handleCellClick = (index) => {
    if (board[index] || winner || currentPlayer !== mySymbol || !gameStarted) return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);
    setCurrentPlayer(mySymbol === 'X' ? 'O' : 'X');

    socket.emit('makeMove', {
      roomCode: roomCode.toUpperCase(),
      cellIndex: index,
      symbol: mySymbol
    });

    checkWinner(newBoard);
  };

  const renderCell = (index) => (
    <button
      className={`cell ${board[index] ? board[index].toLowerCase() : ''}`}
      onClick={() => handleCellClick(index)}
      disabled={!!winner || currentPlayer !== mySymbol || !gameStarted || connectionStatus !== 'connected'}
    >
      {board[index]}
    </button>
  );

  const getStatusMessage = () => {
    if (connectionStatus === 'disconnected') return 'Connection lost - attempting to reconnect...';
    if (connectionStatus === 'reconnecting') return 'Reconnecting to server...';
    if (!gameStarted) return 'Waiting for opponent to join...';
    if (winner) return winner === 'draw' ? 'Game ended in a draw!' : `Player ${winner} wins!`;
    return currentPlayer === mySymbol ? 'Your turn!' : 'Waiting for opponent...';
  };

  const handlePlayAgain = () => {
    socket.emit('resetGame', { roomCode });
  };

  return (
    <div className="multiplayer-container">
      <h2>Room: {roomCode}</h2>
      <div className="connection-status">
        Status: {connectionStatus === 'connected' ? 'Online' : 'Offline'}
      </div>
      <div className="player-info">
        {players.map(player => (
          <div key={player.id} className={`player ${player.symbol === mySymbol ? 'you' : ''}`}>
            {player.name} ({player.symbol}) {player.symbol === mySymbol ? '(You)' : ''}
          </div>
        ))}
      </div>
      <div className="status">{getStatusMessage()}</div>
      <div className="board">
        {Array(9).fill().map((_, i) => (
          <div key={i} className="cell-container">{renderCell(i)}</div>
        ))}
      </div>
      {winner && (
        <button className="play-again" onClick={handlePlayAgain}>
          Play Again
        </button>
      )}
    </div>
  );
};

export default Multiplayer;