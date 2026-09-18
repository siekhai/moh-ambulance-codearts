import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import ambulanceRoutes from './routes/ambulance.js';
import orderRoutes from './routes/order.js';
import mapsRoutes from './routes/maps.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/maps', mapsRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
