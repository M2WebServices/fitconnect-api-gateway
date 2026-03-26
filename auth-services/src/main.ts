import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { startGrpcServer } from './grpc/server';
import { initializeDatabase } from './database/client';
import { initializeRedis } from './cache/redis';
import { typeDefs, resolvers } from './graphql/schema';

const app = express();
const PORT = process.env.PORT || 4102;
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set(['http://localhost:3000', 'http://localhost:5173', ...configuredOrigins])
);

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized');

    // Initialize Redis cache (optional in local dev)
    try {
      await initializeRedis();
      console.log('✓ Redis cache initialized');
    } catch {
      console.warn('⚠ Redis cache disabled');
    }

    // Setup Apollo GraphQL
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await apolloServer.start();
    console.log('✓ Apollo GraphQL server started');

    // CORS middleware (includes OPTIONS preflight handling)
    app.use((req, res, next) => {
      const requestOrigin = req.headers.origin;
      const allowOrigin =
        requestOrigin && allowedOrigins.includes(requestOrigin)
          ? requestOrigin
          : allowedOrigins[0] || '*';

      res.header('Access-Control-Allow-Origin', allowOrigin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }

      next();
    });

    // Middleware
    app.use(express.json());

    // GraphQL endpoint
    app.use(
      '/graphql',
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          const token = req.headers.authorization?.replace('Bearer ', '');
          return { token };
        },
      })
    );

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'auth-service' });
    });

    // Start gRPC server
    startGrpcServer();
    console.log('✓ gRPC server started');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 Auth Service running on port ${PORT}`);
      console.log(`🔐 gRPC endpoint: 0.0.0.0:${process.env.GRPC_PORT || '5106'}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
