import express from 'express';
import http from 'http';
import { config } from './config';
import { initializePool, closePool } from './utils/db';
import { createWebSocketServer } from './websocket/server';
import { redisManager } from './websocket/RedisManager';
import authRoutes from './routes/auth';
import conversationRoutes from './routes/conversations';
import logger from './utils/logger';

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/conversations', conversationRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Create WebSocket server
createWebSocketServer(server);

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Shutdown signal received, draining connections...');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
  });

  // Give connections time to close
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Close resources
  await redisManager.disconnect();
  await closePool();

  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Initialize database
    initializePool();
    logger.info('Database pool initialized');

    // Connect to Redis
    await redisManager.connect();

    server.listen(config.api.port, config.api.host, () => {
      logger.info('HTTP Server listening', {
        host: config.api.host,
        port: config.api.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
