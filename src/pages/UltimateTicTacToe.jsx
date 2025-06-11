import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './UltimateTicTacToe.css';
import { GiGlassCelebration } from "react-icons/gi";
import { GiClover } from "react-icons/gi";

const initialBoard = () => Array(9).fill(null);
const initialGame = () => Array(9).fill(null).map(() => initialBoard());

const UltimateTicTacToe = () => {
  const location = useLocation();
  const playerName = location?.state?.name || 'Player';
  const [boards, setBoards] = useState(initialGame);
  const [overallWinner, setOverallWinner] = useState(null);
  const [nextBoardIndex, setNextBoardIndex] = useState(null);
  const [player, setPlayer] = useState('X');
  const [boardWinners, setBoardWinners] = useState(Array(9).fill(null));
  const [difficulty, setDifficulty] = useState('easy');
  const [message, setMessage] = useState(`Welcome, ${playerName}`);

  const checkWinner = (cells) => {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (let [a, b, c] of wins) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    return null;
  };

  const getAvailableCells = (board) => {
    return board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);
  };

  const getComputerMove = (boardIndex) => {
    const board = boards[boardIndex];
    const available = getAvailableCells(board);

    if (difficulty === 'easy') {
      return available[Math.floor(Math.random() * available.length)];
    }

    if (difficulty === 'medium') {
      for (let idx of available) {
        const tempBoard = [...board];
        tempBoard[idx] = 'O';
        if (checkWinner(tempBoard) === 'O') return idx;
      }
      return available[Math.floor(Math.random() * available.length)];
    }

    if (difficulty === 'hard') {
      const minimax = (b, depth, isMax) => {
        const result = checkWinner(b);
        if (result === 'O') return 10 - depth;
        if (result === 'X') return depth - 10;
        const empty = getAvailableCells(b);
        if (empty.length === 0) return 0;

        return isMax
          ? Math.max(...empty.map(i => {
              const copy = [...b];
              copy[i] = 'O';
              return minimax(copy, depth + 1, false);
            }))
          : Math.min(...empty.map(i => {
              const copy = [...b];
              copy[i] = 'X';
              return minimax(copy, depth + 1, true);
            }));
      };

      let bestScore = -Infinity;
      let bestMove = available[0];
      for (let idx of available) {
        const copy = [...board];
        copy[idx] = 'O';
        const score = minimax(copy, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      return bestMove;
    }

    return available[0];
  };

  const handleCellClick = (boardIndex, cellIndex) => {
    if (overallWinner || player !== 'X') return;
    if (nextBoardIndex !== null && boardIndex !== nextBoardIndex) return;
    if (boards[boardIndex][cellIndex]) return;
    if (boardWinners[boardIndex]) return;

    const newBoards = boards.map((board, i) => i === boardIndex ? [...board] : [...board]);
    newBoards[boardIndex][cellIndex] = 'X';

    const newBoardWinners = [...boardWinners];
    const winner = checkWinner(newBoards[boardIndex]);
    if (winner) newBoardWinners[boardIndex] = winner;

    const overall = checkWinner(newBoardWinners);
    if (overall) {
      setOverallWinner(overall);
      setMessage(overall === 'X' ? `Hurray, ${playerName} won! ` : `Sorry, ${playerName} lost.`);
    }

    setBoards(newBoards);
    setBoardWinners(newBoardWinners);
    const next = newBoardWinners[cellIndex] ? null : cellIndex;
    setNextBoardIndex(next);
    setPlayer('O');
  };

  useEffect(() => {
    if (player === 'O' && !overallWinner) {
      const boardIndex = nextBoardIndex === null || boardWinners[nextBoardIndex] ? 
        boards.findIndex((b, i) => !boardWinners[i] && getAvailableCells(b).length > 0) : 
        nextBoardIndex;

      if (boardIndex < 0) return;

      const move = getComputerMove(boardIndex);
      setTimeout(() => {
        const newBoards = boards.map((board, i) => i === boardIndex ? [...board] : [...board]);
        newBoards[boardIndex][move] = 'O';

        const newBoardWinners = [...boardWinners];
        const winner = checkWinner(newBoards[boardIndex]);
        if (winner) newBoardWinners[boardIndex] = winner;

        const overall = checkWinner(newBoardWinners);
        if (overall) {
          setOverallWinner(overall);
          setMessage(overall === 'X' ? `Hurray, ${playerName} won!` : `Sorry, ${playerName} lost.`);
        }

        setBoards(newBoards);
        setBoardWinners(newBoardWinners);
        const next = newBoardWinners[move] ? null : move;
        setNextBoardIndex(next);
        setPlayer('X');
      }, 500);
    }
  }, [player]);

  const handleRestart = () => {
    setBoards(initialGame);
    setBoardWinners(Array(9).fill(null));
    setOverallWinner(null);
    setPlayer('X');
    setNextBoardIndex(null);
    setMessage(`Welcome, ${playerName}`);
  };

  const renderBoard = (board, boardIndex) => (
    <div className={`small-board ${boardWinners[boardIndex] ? 'won' : ''}`} key={boardIndex}>
      {board.map((cell, cellIndex) => (
        <button
          key={cellIndex}
          className="cell-ultimate"
          onClick={() => handleCellClick(boardIndex, cellIndex)}
          disabled={
            !!cell ||
            (nextBoardIndex !== null && nextBoardIndex !== boardIndex) ||
            !!boardWinners[boardIndex] ||
            overallWinner
          }
        >
          {cell}
        </button>
      ))}
      {boardWinners[boardIndex] && <div className="winner-overlay">{boardWinners[boardIndex]}</div>}
    </div>
  );

  return (
    <div className="ultimate-container">
      <h2 className='message'>{message} <GiClover style={{width:'2 rem', margin:'-5px'}}/></h2>
      <div>
        <label className='difficulty'>Difficulty: </label>
        <select className='difficulty-dropdown-ultimate' value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      {!overallWinner && <p>Next Player: {player}</p>}
      <div className="big-board">
        {boards.map((board, index) => renderBoard(board, index))}
      </div>
      {overallWinner && (
        <button className="restart-button" onClick={handleRestart} style={{ marginTop: '20px' }}>
          Play Again
        </button>
      )}
    </div>
  );
};

export default UltimateTicTacToe;