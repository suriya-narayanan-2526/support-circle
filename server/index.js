import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Placeholder Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Support Circle API is running.' });
});

// Routes
import donationsRoute from './routes/donations.js';
import requestsRoute from './routes/requests.js';
import authRoute from './routes/auth.js';

app.use('/api/donations', donationsRoute);
app.use('/api/requests', requestsRoute);
app.use('/api/auth', authRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
