import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { startGrpcServer } from './grpc/server';
import { initializeDatabase } from './database/client';
import { initializeRedis } from './cache/redis';
import { typeDefs, resolvers } from './graphql/schema';

const app = express();
const PORT = process.env.PORT || 4102;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized');

    // Initialize Redis cache
    await initializeRedis();
    console.log('✓ Redis cache initialized');

    // Setup Apollo GraphQL
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await apolloServer.start();
    console.log('✓ Apollo GraphQL server started');

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
