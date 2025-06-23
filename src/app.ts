// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/error';

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Error handling middleware - MUST BE LAST
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;