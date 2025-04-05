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
import session from "express-session";
import createMemoryStore from "memorystore";
import { DatabaseStorage } from "./database-storage";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Course management
  createCourse(course: InsertCourse): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getCoursesByTeacherId(teacherId: number): Promise<Course[]>;
  updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Enrollment management
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Materials management
  createMaterial(material: InsertMaterial): Promise<Material>;
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialsByCourse(courseId: number): Promise<Material[]>;
  updateMaterial(id: number, data: Partial<Material>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Assignments management
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Submissions management
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByUser(userId: number): Promise<Submission[]>;
  updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined>;
  
  // Course Feedback management
  createCourseFeedback(feedback: InsertCourseFeedback): Promise<CourseFeedback>;
  getCourseFeedback(id: number): Promise<CourseFeedback | undefined>;
  getCourseFeedbacksByCourse(courseId: number): Promise<CourseFeedback[]>;
  getCourseFeedbacksByUser(userId: number): Promise<CourseFeedback[]>;
  updateCourseFeedback(id: number, data: Partial<CourseFeedback>): Promise<CourseFeedback | undefined>;
  deleteCourseFeedback(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private materials: Map<number, Material>;
  private assignments: Map<number, Assignment>;
  private submissions: Map<number, Submission>;
  private courseFeedbacks: Map<number, CourseFeedback>;
  private currentIds: {
    users: number;
    courses: number;
    enrollments: number;
    materials: number;
    assignments: number;
    submissions: number;
    courseFeedbacks: number;
  };
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.materials = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.courseFeedbacks = new Map();
    this.currentIds = {
      users: 1,
      courses: 1,
      enrollments: 1,
      materials: 1,
      assignments: 1,
      submissions: 1,
      courseFeedbacks: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create initial admin/teacher user for testing
    this.createUser({
      username: "teacher@example.com",
      password: "password123",
      name: "Михаил Петрович",
      role: "teacher",
      avatar: null
    });
    
    // Create initial student user for testing
    this.createUser({
      username: "student@example.com",
      password: "password123",
      name: "Анна",
      role: "student",
      avatar: null
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course management
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentIds.courses++;
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }
  
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async getCoursesByTeacherId(teacherId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.teacherId === teacherId
    );
  }
  
  async updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...data };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }
  
  // Enrollment management
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentIds.enrollments++;
    const enrollment: Enrollment = { ...insertEnrollment, id };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }
  
  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      (enrollment) => enrollment.userId === userId && enrollment.courseId === courseId
    );
  }
  
  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseId === courseId
    );
  }
  
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.userId === userId
    );
  }
  
  async updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...data };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }
  
  // Materials management
  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.currentIds.materials++;
    const material: Material = { ...insertMaterial, id, createdAt: new Date() };
    this.materials.set(id, material);
    return material;
  }
  
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }
  
  async getMaterialsByCourse(courseId: number): Promise<Material[]> {
    return Array.from(this.materials.values())
      .filter((material) => material.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }
  
  async updateMaterial(id: number, data: Partial<Material>): Promise<Material | undefined> {
    const material = await this.getMaterial(id);
    if (!material) return undefined;
    
    const updatedMaterial = { ...material, ...data };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }
  
  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }
  
  // Assignments management
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentIds.assignments++;
    const assignment: Assignment = { ...insertAssignment, id, createdAt: new Date() };
    this.assignments.set(id, assignment);
    return assignment;
  }
  
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter((assignment) => assignment.courseId === courseId)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
  
  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...data };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }
  
  // Submissions management
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentIds.submissions++;
    const submission: Submission = { ...insertSubmission, id, submitted: new Date() };
    this.submissions.set(id, submission);
    return submission;
  }
  
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => submission.assignmentId === assignmentId);
  }
  
  async getSubmissionsByUser(userId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter((submission) => submission.userId === userId);
  }
  
  async updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined> {
    const submission = await this.getSubmission(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...data };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  // Course Feedback management
  async createCourseFeedback(insertFeedback: InsertCourseFeedback): Promise<CourseFeedback> {
    const id = this.currentIds.courseFeedbacks++;
    const feedback: CourseFeedback = { ...insertFeedback, id, createdAt: new Date() };
    this.courseFeedbacks.set(id, feedback);
    return feedback;
  }
  
  async getCourseFeedback(id: number): Promise<CourseFeedback | undefined> {
    return this.courseFeedbacks.get(id);
  }
  
  async getCourseFeedbacksByCourse(courseId: number): Promise<CourseFeedback[]> {
    return Array.from(this.courseFeedbacks.values())
      .filter((feedback) => feedback.courseId === courseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Новые отзывы сначала
  }
  
  async getCourseFeedbacksByUser(userId: number): Promise<CourseFeedback[]> {
    return Array.from(this.courseFeedbacks.values())
      .filter((feedback) => feedback.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateCourseFeedback(id: number, data: Partial<CourseFeedback>): Promise<CourseFeedback | undefined> {
    const feedback = await this.getCourseFeedback(id);
    if (!feedback) return undefined;
    
    const updatedFeedback = { ...feedback, ...data };
    this.courseFeedbacks.set(id, updatedFeedback);
    return updatedFeedback;
  }
  
  async deleteCourseFeedback(id: number): Promise<boolean> {
    return this.courseFeedbacks.delete(id);
  }
}

// Используем реализацию для работы с PostgreSQL
export const storage = new DatabaseStorage();
