import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './SinglePlayerGame.css';

const createEmptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(null));

const SinglePlayerGame = () => {
  const { state } = useLocation();
  const name = state?.name || 'Player';

  const [board, setBoard] = useState(createEmptyBoard());
  const [player] = useState('X');
  const [difficulty, setDifficulty] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null); // 'player', 'computer', 'draw', null
  const [winningLine, setWinningLine] = useState(null); // array of winning cells

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check for win and get winning combination
  const getWinningLine = (board, symbol) => {
    const lines = [
      [[0,0],[0,1],[0,2]],
      [[1,0],[1,1],[1,2]],
      [[2,0],[2,1],[2,2]],
      [[0,0],[1,0],[2,0]],
      [[0,1],[1,1],[2,1]],
      [[0,2],[1,2],[2,2]],
      [[0,0],[1,1],[2,2]],
      [[0,2],[1,1],[2,0]]
    ];
    for (let line of lines) {
      if (line.every(([r,c]) => board[r][c] === symbol)) return line;
    }
    return null;
  };

  const isWinning = (board, symbol) => !!getWinningLine(board, symbol);

  const isDraw = (board) => {
    for(let row of board) {
      if(row.includes(null)) return false;
    }
    return true;
  };

  const findBlockingMove = (board, symbol) => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!board[i][j]) {
          board[i][j] = symbol;
          const willWin = isWinning(board, symbol);
          board[i][j] = null;
          if (willWin) return [i, j];
        }
      }
    }
    return null;
  };

  const minimax = (board, isMaximizing, depth = 0) => {
    if (isWinning(board, 'O')) return { score: 10 - depth };  // prefer quicker wins
    if (isWinning(board, 'X')) return { score: depth - 10 };  // avoid losing sooner
    if (isDraw(board)) return { score: 0 };

    const empty = [];
    board.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (!cell) empty.push([i, j]);
      })
    );

    let best;
    if (isMaximizing) {
      best = { score: -Infinity };
      for (let [i, j] of empty) {
        board[i][j] = 'O';
        let result = minimax(board, false, depth + 1);
        board[i][j] = null;
        if (result.score > best.score) {
          best = { score: result.score, move: [i, j] };
        }
      }
    } else {
      best = { score: Infinity };
      for (let [i, j] of empty) {
        board[i][j] = 'X';
        let result = minimax(board, true, depth + 1);
        board[i][j] = null;
        if (result.score < best.score) {
          best = { score: result.score, move: [i, j] };
        }
      }
    }
    return best;
  };

  const makeBotMove = (currentBoard) => {
    if (gameOver) return;
    const empty = [];
    currentBoard.forEach((row, i) =>
      row.forEach((cell, j) => {
        if (!cell) empty.push([i, j]);
      })
    );

    if (empty.length === 0) return;

    let move;

    if (difficulty === 'medium') {
      move = findBlockingMove(currentBoard, 'X');
    } else if (difficulty === 'hard') {
      move = minimax(currentBoard, true).move;
    }

    // Fallback to random move (easy or if no blocking move found)
    if (!move) {
      move = empty[Math.floor(Math.random() * empty.length)];
    }

    const [i, j] = move;
    currentBoard[i][j] = 'O';

    setBoard([...currentBoard]);

    // Check if computer wins
    const compWinLine = getWinningLine(currentBoard, 'O');
    if (compWinLine) {
      setGameOver(true);
      setResult('computer');
      setWinningLine(compWinLine);
      return;
    }

    if (isDraw(currentBoard)) {
      setGameOver(true);
      setResult('draw');
    }
  };

  const makeMove = (row, col) => {
    if (board[row][col] || !difficulty || gameOver) return;

    const newBoard = board.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? player : c))
    );

    setBoard(newBoard);

    // Check if player wins
    const playerWinLine = getWinningLine(newBoard, player);
    if (playerWinLine) {
      setGameOver(true);
      setResult('player');
      setWinningLine(playerWinLine);
      return;
    }

    if (isDraw(newBoard)) {
      setGameOver(true);
      setResult('draw');
      return;
    }

    setTimeout(() => makeBotMove(newBoard), 300);
  };

  const handlePlayAgain = () => {
    setBoard(createEmptyBoard());
    setDifficulty('');
    setShowPopup(false);
    setGameOver(false);
    setResult(null);
    setWinningLine(null);
    setTimeout(() => setShowPopup(true), 1000);
  };

  // Helper to style winning line cells
  const isWinningCell = (row, col) => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="game-container">
      <h2 className="welcome">
        {!gameOver && `Welcome, ${name}`}
        {gameOver && result === 'player' && `Hurray!! ${name} won`}
        {gameOver && result === 'computer' && `Sorry, ${name} lost`}
        {gameOver && result === 'draw' && `Draw Match`}
      </h2>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-popup">
            <h3>Select Difficulty</h3>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setShowPopup(false);
              }}
              className="difficulty-dropdown"
            >
              <option value="">-- Choose --</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      )}

      {difficulty && <p className="selected-difficulty">Difficulty: {difficulty}</p>}

      <div className="board">
        {board.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`cell ${isWinningCell(i, j) ? 'winning-cell' : ''}`}
              onClick={() => makeMove(i, j)}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      <button className="play-again-btn" onClick={handlePlayAgain}>
        Play Again
      </button>

      {/* Celebration overlay */}
      {gameOver && result === 'player' && (
        <div className="celebration">
          
        </div>
      )}
    </div>
  );
};

export default SinglePlayerGame;
