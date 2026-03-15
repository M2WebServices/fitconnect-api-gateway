import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

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
  port: parseInt(process.env.PORT || '4100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  grpc: {
    communityServiceUrl: process.env.COMMUNITY_SERVICE_URL || 'localhost:5101',
    eventServiceUrl: process.env.EVENT_SERVICE_URL || 'localhost:5102',
    planningServiceUrl: process.env.PLANNING_SERVICE_URL || 'localhost:5103',
    chatServiceUrl: process.env.CHAT_SERVICE_URL || 'localhost:5104',
    rankingServiceUrl: process.env.RANKING_SERVICE_URL || 'localhost:5105',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'localhost:5106',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

export default env;
