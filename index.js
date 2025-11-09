import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import workRoutes from './routes/featuresRoutes/workRoutes.js';
import schoolRoutes from './routes/featuresRoutes/schoolRoutes.js';
import homeRoutes from './routes/featuresRoutes/homeRoute.js';
import travelRoutes from './routes/featuresRoutes/travelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import initSocket from './utils/socket.js';
import fileUpload from 'express-fileupload';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(fileUpload({ useTempFiles: true }));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles for privacy policy
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Explicit route for privacy policy to ensure accessibility
app.get('/privacy-policy.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(join(__dirname, 'public', 'privacy-policy.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

// Features Routes
app.use('/api/work', workRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/travel', travelRoutes);

// Error handling
app.use(errorHandler);

// ✅ Create server first
const httpServer = createServer(app);

// ✅ Initialize Socket.io after httpServer exists
const io = initSocket(httpServer);
app.set('io', io);

// Database connection and server start
connectDB().then(() => {
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});
