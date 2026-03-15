import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import fs from 'fs';
import path from 'path';

export interface GrpcClient {
  client: any;
  close: () => void;
}

/**
 * Create a gRPC client from a proto file
 * @param protoPath - Path to the .proto file
 * @param packageName - Package name in the proto file
 * @param serviceName - Service name in the proto file
 * @param serviceUrl - gRPC service URL (e.g., 'localhost:5101')
 */
export function createGrpcClient(
  protoPath: string,
  packageName: string,
  serviceName: string,
  serviceUrl: string
): GrpcClient {
  const projectRoot = path.resolve(__dirname, '../..');
  const protoDir = path.join(projectRoot, 'proto');
  const PROTO_PATH = path.join(protoDir, protoPath);
  const googleProtoDirs = [
    path.join(projectRoot, 'node_modules', 'google-proto-files'),
    path.join(projectRoot, '..', 'node_modules', 'google-proto-files'),
  ].filter((dir) => fs.existsSync(dir));

  console.log('📁 Loading proto file from:', PROTO_PATH);

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [
      protoDir,
      ...googleProtoDirs,
    ],
  });

  const protoDescriptor: any = grpc.loadPackageDefinition(packageDefinition);
  const packageObj = protoDescriptor[packageName];

  if (!packageObj || !packageObj[serviceName]) {
    throw new Error(`Service ${serviceName} not found in package ${packageName}`);
  }

  const client = new packageObj[serviceName](
    serviceUrl,
    grpc.credentials.createInsecure()
  );

  return {
    client,
    close: () => client.close(),
  };
}

/**
 * Promisify gRPC client method
 * @param client - gRPC client
 * @param method - Method name
 */
export function promisifyGrpcCall(client: any, method: string) {
  return (request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      client[method](request, (error: grpc.ServiceError | null, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}

export { grpc };
