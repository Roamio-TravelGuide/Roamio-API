import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';
import { errorHandler } from './middleware/error.js';
import multer from 'multer';

dotenv.config();

// BigInt JSON serialization workaround
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const app = express();

// Middleware
app.use(cors({
  methods: ['PATCH']
}));
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