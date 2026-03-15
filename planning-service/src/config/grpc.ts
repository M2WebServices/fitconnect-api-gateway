import fs from "fs";
import path from "path";
import { env } from "./env";

export const GRPC_HOST = "0.0.0.0";
export const GRPC_PORT = env.grpcPort;
export const GRPC_ADDRESS = `${GRPC_HOST}:${GRPC_PORT}`;
const projectRoot = path.resolve(__dirname, "../..");
export const GRPC_PROTO_PATH = path.join(projectRoot, "proto", "event.proto");
export const GRPC_INCLUDE_DIRS = [
	path.join(projectRoot, "proto"),
	path.join(projectRoot, "node_modules", "google-proto-files"),
	path.join(projectRoot, "..", "node_modules", "google-proto-files")
].filter((dir) => fs.existsSync(dir));
