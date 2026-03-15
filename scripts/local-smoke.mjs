import { spawnSync } from "child_process";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpJson = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
};

const publishEvent = () => {
  const cmd =
    "docker exec -i fitconnect-redis redis-cli PUBLISH EVENT_CREATED '{\"eventId\":\"evt-smoke\",\"groupId\":\"grp-smoke\",\"title\":\"Smoke Event\",\"date\":\"2026-03-15T10:00:00.000Z\",\"createdAt\":\"2026-03-14T22:31:00.000Z\"}'";
  const result = spawnSync(cmd, { shell: true, stdio: "pipe", encoding: "utf8" });
  return result.status === 0;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  console.log("[local-smoke] Waiting for services...");
  await wait(3000);

  const checks = [
    ["Auth", "http://localhost:4102/health"],
    ["Community", "http://localhost:4101/health"],
    ["Planning", "http://localhost:4103/health"],
    ["Challenge", "http://localhost:4104/health"],
    ["ChatNotif", "http://localhost:4105/health"],
  ];

  for (const [name, url] of checks) {
    const result = await httpJson(url);
    const isOk = result.status < 500;
    console.log(`[local-smoke] ${name}: HTTP ${result.status}`);
    assert(isOk, `${name} health check failed`);
  }

  const gql = await httpJson("http://localhost:4100/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ __typename }" }),
  });

  assert(gql.ok && gql?.data?.data?.__typename === "Query", "Gateway GraphQL smoke query failed");
  console.log("[local-smoke] Gateway GraphQL OK");

  const unique = Date.now();
  const signup = await httpJson("http://localhost:4102/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "mutation($email:String!,$pseudo:String!,$password:String!){ signUp(email:$email,pseudo:$pseudo,password:$password){ token user { id email pseudo } } }",
      variables: {
        email: `smoke-${unique}@fitconnect.local`,
        pseudo: `smoke-${unique}`,
        password: "SmokePassword123!",
      },
    }),
  });

  const token = signup?.data?.data?.signUp?.token;
  assert(Boolean(token), "Auth signUp did not return a token");

  const me = await httpJson("http://localhost:4100/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: "query { me { id username email } }",
    }),
  });
  assert(me.ok && me?.data?.data?.me?.id, "Gateway authenticated me query failed");
  console.log("[local-smoke] Gateway auth via gRPC OK");

  const workout = await httpJson(
    "http://localhost:4103/internal/workouts/completed",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-smoke",
        workoutSessionId: "ws-smoke",
        completedAt: new Date().toISOString(),
        durationMinutes: 30,
        caloriesBurned: 300,
        eventId: "evt-smoke",
        groupId: "grp-smoke",
      }),
    },
    7000
  );
  assert(workout.status === 202, "Planning workout publish endpoint failed");

  assert(publishEvent(), "Redis EVENT_CREATED publish failed");
  await wait(1200);

  const leaderboard = await httpJson("http://localhost:4104/internal/leaderboard?limit=5");
  assert(Array.isArray(leaderboard?.data?.rankings), "Challenge leaderboard endpoint failed");

  const notifications = await httpJson("http://localhost:4105/internal/notifications");
  assert(Array.isArray(notifications?.data?.notifications), "Chat notifications endpoint failed");

  console.log("[local-smoke] Pub/Sub flow OK");
  console.log("[local-smoke] All checks passed");
};

main().catch((error) => {
  console.error("[local-smoke] FAILED:", error.message || error);
  process.exit(1);
});
