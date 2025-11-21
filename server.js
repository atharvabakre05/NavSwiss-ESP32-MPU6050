// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocket } = require('ws'); // ws package
const { Server } = require('socket.io');

const APP_PORT = 3000;
const ESP32_WS = 'ws://192.168.29.21:81'; // <--- your ESP32 IP and ws port

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);

// Store last message for quick GETs
let latest = { time: Date.now(), mpu1: null, mpu2: null };

// Socket.IO: when browser connects, send latest immediately
io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id);
  socket.emit('sensor', latest);
});

// Connect to ESP32 WebSocket server as a client
function connectToESP32() {
  console.log('Connecting to ESP32 at', ESP32_WS);
  const ws = new WebSocket(ESP32_WS);

  ws.on('open', () => {
    console.log('Connected to ESP32 WebSocket');
  });

  ws.on('message', (raw) => {
    // ESP32 broadcasts JSON strings like: {"mpu1":{...},"mpu2":{...}}
    try {
      const data = JSON.parse(raw.toString());
      latest = { time: Date.now(), ...data };
      // Broadcast to all browser clients
      io.emit('sensor', latest);
    } catch (err) {
      console.warn('WS parse error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('ESP32 WebSocket closed — reconnecting in 2s');
    setTimeout(connectToESP32, 2000);
  });

  ws.on('error', (err) => {
    console.warn('ESP32 WS error:', err.message);
    ws.close();
  });
}

// Start everything
server.listen(APP_PORT, () => {
  console.log(`Server running at http://localhost:${APP_PORT} (or use http://<this-pc-ip>:${APP_PORT})`);
  connectToESP32();
});

// Optional endpoints
app.get('/latest', (req, res) => {
  res.json(latest);
});
