import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import workRoutes from './routes/featuresRoutes/workRoutes.js'
import schoolRoutes from './routes/featuresRoutes/schoolRoutes.js';
import homeRoutes from './routes/featuresRoutes/homeRoute.js'
import travelRoutes from './routes/featuresRoutes/travelRoutes.js'
import messageRoutes from './routes/messageRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import initSocket from './utils/socket.js';
import fileUpload from 'express-fileupload';


dotenv.config();

const app = express();
app.use(fileUpload({ useTempFiles: true }));

const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

app.use(cors({
  origin: '*'
}));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

//Features Routes
app.use('/api/work', workRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/home', homeRoutes)
app.use('/api/travel', travelRoutes)
// Error handling
app.use(errorHandler);

// Initialize Socket.io
initSocket(httpServer);

// Database connection and server start
connectDB().then(() => {
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});