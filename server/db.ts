import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, courses, enrollments, materials, assignments, submissions, courseFeedbacks } from "@shared/schema";

// Use env variable provided by Replit
export const connectionString = process.env.DATABASE_URL!;
export const client = postgres(connectionString);

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