const express = require('express');
const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'));

// Define a simple Alert schema
const alertSchema = new mongoose.Schema({
  type: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Alert = mongoose.model('Alert', alertSchema);

// Middleware to parse JSON
app.use(express.json());

// Root route for testing
app.get('/', (req, res) => {
  res.send('Space Weather Alert System Backend is running!');
});

// GET route to fetch all alerts
app.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST route to receive alerts from Python script
app.post('/alerts', async (req, res) => {
  try {
    const { type, message, timestamp } = req.body;
    const alert = new Alert({ type, message, timestamp });
    await alert.save();
    broadcastAlert(alert); // Send to WebSocket clients
    res.status(201).json({ message: 'Alert received and saved', alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save alert' });
  }
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// WebSocket setup
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Function to broadcast alerts to WebSocket clients
function broadcastAlert(alert) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alert));
    }
  });
}

// Optional: Remove or comment out simulation for production
// setInterval(async () => {
//   const alert = new Alert({
//     type: 'Solar Flare',
//     message: 'High solar flare detected!',
//   });
//   await alert.save();
//   broadcastAlert(alert);
// }, 10000);