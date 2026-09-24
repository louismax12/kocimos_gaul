const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Komsos SMTB API Server is running smoothly.' });
});

// API Routes Version 1
app.use('/api/v1', apiRoutes);

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan.' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Komsos SMTB Backend Server running on port ${PORT}`);
  console.log(`🌐 Base API URL: http://localhost:${PORT}/api/v1`);
  console.log(`=======================================================`);
});
