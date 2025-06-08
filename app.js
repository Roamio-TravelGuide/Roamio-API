const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const tripRoutes = require('./api/v1/shared/tripRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trips', tripRoutes); // All trips routes now under /api/trips

// Health check
app.get('/', (req, res) => res.send('Server is running'));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));