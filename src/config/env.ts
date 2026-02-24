import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  grpc: {
    communityServiceUrl: string;
    eventServiceUrl: string;
    planningServiceUrl: string;
    chatServiceUrl: string;
    rankingServiceUrl: string;
    authServiceUrl: string;
  };
  cors: {
    origin: string;
  };
}

const env: EnvConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  grpc: {
    communityServiceUrl: process.env.COMMUNITY_SERVICE_URL || 'localhost:50051',
    eventServiceUrl: process.env.EVENT_SERVICE_URL || 'localhost:50052',
    planningServiceUrl: process.env.PLANNING_SERVICE_URL || 'localhost:50053',
    chatServiceUrl: process.env.CHAT_SERVICE_URL || 'localhost:50054',
    rankingServiceUrl: process.env.RANKING_SERVICE_URL || 'localhost:50055',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'localhost:50056',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

export default env;
