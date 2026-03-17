import express from "express";
import { publishWorkoutCompleted } from "./messaging/publisher";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/internal/workouts/completed", async (req, res) => {
  const { userId, workoutSessionId, completedAt, durationMinutes, caloriesBurned, eventId, groupId } = req.body ?? {};

  if (!userId || !workoutSessionId) {
    res.status(400).json({
      error: "ValidationError",
      message: "userId and workoutSessionId are required",
    });
    return;
  }

  await publishWorkoutCompleted({
    userId,
    workoutSessionId,
    completedAt: completedAt || new Date().toISOString(),
    durationMinutes,
    caloriesBurned,
    eventId,
    groupId,
  });

  res.status(202).json({ published: true });
});
