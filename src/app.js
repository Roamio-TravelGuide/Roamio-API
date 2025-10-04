import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';
import { errorHandler } from './middleware/error.js';
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// BigInt JSON serialization workaround
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const app = express();

// Middleware
app.use(cors({
  methods: ['PATCH','DELETE','PUT']
}));


app.use(express.json());

// Routes
app.use('/api/v1', routes);
 
// Health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));


// Error handling middleware - MUST BE LAST
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;