# Proto Files Directory

This directory should contain the `.proto` files for all gRPC microservices.

## Expected Files

- `community.proto` - Community Service protocol definition
- `event.proto` - Event Service protocol definition  
- `planning.proto` - Planning Service protocol definition
- `chat.proto` - Chat Service protocol definition
- `ranking.proto` - Ranking Service protocol definition

## Usage

The gRPC clients in `src/clients/` will reference these proto files to generate client stubs.

Once you have the actual proto files from your microservices, place them here and update the client implementations accordingly.

## Example Proto File Structure

```protobuf
syntax = "proto3";

package community;

service CommunityService {
  rpc GetGroup (GetGroupRequest) returns (Group);
  rpc CreateGroup (CreateGroupRequest) returns (Group);
  // ... more RPC methods
}

message GetGroupRequest {
  string groupId = 1;
}

message Group {
  string id = 1;
  string name = 2;
  string description = 3;
  string ownerId = 4;
}
```
