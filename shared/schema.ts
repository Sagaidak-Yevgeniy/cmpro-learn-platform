import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "teacher"] }).notNull().default("student"),
  avatar: text("avatar")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  avatar: true,
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  teacherId: integer("teacher_id").notNull(),
  duration: text("duration").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCourseSchema = createInsertSchema(courses, {
  // Делаем некоторые поля необязательными для вставки
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  // Добавляем поддержку дат как в строковом формате, так и в формате объекта Date
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
}).pick({
  title: true,
  description: true,
  category: true,
  imageUrl: true,
  teacherId: true,
  duration: true,
  startDate: true,
  endDate: true,
  isActive: true,
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  grade: integer("grade"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  userId: true,
  courseId: true,
  progress: true,
  enrollmentDate: true,
  grade: true,
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["lecture", "presentation", "lab", "test", "additional"] }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  courseId: true,
  title: true,
  type: true,
  description: true,
  content: true,
  order: true,
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments, {
  // Задаем настройки валидации
  description: z.string(),
  dueDate: z.string().or(z.date()),
}).pick({
  courseId: true,
  title: true,
  description: true,
  dueDate: true,
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  submitted: timestamp("submitted").notNull().defaultNow(),
  grade: integer("grade"),
  feedback: text("feedback"),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  userId: true,
  content: true,
  grade: true,
  feedback: true,
});

export const courseFeedbacks = pgTable("course_feedbacks", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseFeedbackSchema = createInsertSchema(courseFeedbacks).pick({
  courseId: true,
  userId: true,
  content: true,
  rating: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type CourseFeedback = typeof courseFeedbacks.$inferSelect;
export type InsertCourseFeedback = z.infer<typeof insertCourseFeedbackSchema>;

// Добавляем отношения между таблицами
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses, { relationName: "teacher_courses" }),
  enrollments: many(enrollments),
  submissions: many(submissions),
  courseFeedbacks: many(courseFeedbacks)
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
    relationName: "teacher_courses"
  }),
  enrollments: many(enrollments),
  materials: many(materials),
  assignments: many(assignments),
  feedbacks: many(courseFeedbacks)
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id]
  })
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id]
  })
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id]
  }),
  submissions: many(submissions)
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id]
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id]
  })
}));

export const courseFeedbacksRelations = relations(courseFeedbacks, ({ one }) => ({
  course: one(courses, {
    fields: [courseFeedbacks.courseId],
    references: [courses.id]
  }),
  user: one(users, {
    fields: [courseFeedbacks.userId],
    references: [users.id]
  })
}));
