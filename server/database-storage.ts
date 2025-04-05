import { 
  users, 
  User, 
  InsertUser, 
  courses, 
  Course, 
  InsertCourse,
  enrollments,
  Enrollment,
  InsertEnrollment,
  materials,
  Material,
  InsertMaterial,
  assignments,
  Assignment,
  InsertAssignment,
  submissions,
  Submission,
  InsertSubmission,
  courseFeedbacks,
  CourseFeedback,
  InsertCourseFeedback
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from 'pg';

const PostgresSessionStore = connectPg(session);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using 'any' for now to fix type issues

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Course management
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    // Преобразуем даты в объекты Date, если они переданы как строки
    const startDate = insertCourse.startDate instanceof Date 
      ? insertCourse.startDate 
      : new Date(insertCourse.startDate);
    
    const endDate = insertCourse.endDate instanceof Date 
      ? insertCourse.endDate 
      : new Date(insertCourse.endDate);
    
    // Формируем данные для вставки с правильными типами
    const insertData = {
      title: insertCourse.title,
      description: insertCourse.description,
      category: insertCourse.category,
      duration: insertCourse.duration,
      teacherId: insertCourse.teacherId,
      startDate: startDate,
      endDate: endDate,
      imageUrl: insertCourse.imageUrl ?? null,
      isActive: insertCourse.isActive ?? true
    };
    
    const [course] = await db.insert(courses).values(insertData).returning();
    return course;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCoursesByTeacherId(teacherId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined> {
    const [course] = await db.update(courses)
      .set(data)
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.count > 0;
  }

  // Enrollment management
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    );
    return enrollment;
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments)
      .set(data)
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id));
    return result.count > 0;
  }

  // Materials management
  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values({
      ...insertMaterial,
      createdAt: new Date()
    }).returning();
    return material;
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async getMaterialsByCourse(courseId: number): Promise<Material[]> {
    return await db.select()
      .from(materials)
      .where(eq(materials.courseId, courseId))
      .orderBy(materials.order);
  }

  async updateMaterial(id: number, data: Partial<Material>): Promise<Material | undefined> {
    const [material] = await db.update(materials)
      .set(data)
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return result.count > 0;
  }

  // Assignments management
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    // Убеждаемся, что dueDate - это объект Date
    const dueDate = insertAssignment.dueDate instanceof Date 
      ? insertAssignment.dueDate 
      : new Date(insertAssignment.dueDate);
    
    // Формируем данные для вставки
    const insertData = {
      title: insertAssignment.title,
      description: insertAssignment.description,
      courseId: insertAssignment.courseId,
      dueDate: dueDate
    };
    
    const [assignment] = await db.insert(assignments).values(insertData).returning();
    return assignment;
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return await db.select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(assignments.dueDate);
  }

  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined> {
    const [assignment] = await db.update(assignments)
      .set(data)
      .where(eq(assignments.id, id))
      .returning();
    return assignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.count > 0;
  }

  // Submissions management
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values({
      ...insertSubmission,
      submitted: new Date()
    }).returning();
    return submission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByUser(userId: number): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(eq(submissions.userId, userId));
  }

  async updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined> {
    const [submission] = await db.update(submissions)
      .set(data)
      .where(eq(submissions.id, id))
      .returning();
    return submission;
  }
  
  // Course Feedback management
  async createCourseFeedback(insertFeedback: InsertCourseFeedback): Promise<CourseFeedback> {
    const [feedback] = await db.insert(courseFeedbacks).values({
      ...insertFeedback,
      createdAt: new Date()
    }).returning();
    return feedback;
  }
  
  async getCourseFeedback(id: number): Promise<CourseFeedback | undefined> {
    const [feedback] = await db.select().from(courseFeedbacks).where(eq(courseFeedbacks.id, id));
    return feedback;
  }
  
  async getCourseFeedbacksByCourse(courseId: number): Promise<CourseFeedback[]> {
    const result = await db.select()
      .from(courseFeedbacks)
      .where(eq(courseFeedbacks.courseId, courseId));
    // Сортируем результаты в памяти по убыванию даты
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCourseFeedbacksByUser(userId: number): Promise<CourseFeedback[]> {
    const result = await db.select()
      .from(courseFeedbacks)
      .where(eq(courseFeedbacks.userId, userId));
    // Сортируем результаты в памяти по убыванию даты
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateCourseFeedback(id: number, data: Partial<CourseFeedback>): Promise<CourseFeedback | undefined> {
    const [feedback] = await db.update(courseFeedbacks)
      .set(data)
      .where(eq(courseFeedbacks.id, id))
      .returning();
    return feedback;
  }
  
  async deleteCourseFeedback(id: number): Promise<boolean> {
    const result = await db.delete(courseFeedbacks).where(eq(courseFeedbacks.id, id));
    return result.count > 0;
  }
}