// src/socket.js
import { io } from 'socket.io-client';

// Replace with your backend URL if deployed online
const URL = 'https://ultimatetictactoe-backend.onrender.com';

// Create socket instance
const socket = io(URL, {
  autoConnect: false, // Prevent automatic connection; we control it manually
  transports: ['websocket'], // Use WebSocket explicitly
});

export default socket;
