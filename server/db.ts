import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, courses, enrollments, materials, assignments, submissions, courseFeedbacks } from "@shared/schema";

// Use env variable provided by Replit
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL не настроен. Убедитесь, что база данных создана в Replit.");
}

// Используем пул соединений для лучшей производительности
export const connectionString = process.env.DATABASE_URL.replace('.us-east-2', '-pooler.us-east-2');
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

// Initialize drizzle with all schema tables
export const db = drizzle(client, {
  schema: {
    users,
    courses,
    enrollments,
    materials,
    assignments,
    submissions,
    courseFeedbacks
  }
});