import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertCourseSchema, 
  insertEnrollmentSchema, 
  insertMaterialSchema,
  insertAssignmentSchema,
  insertSubmissionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // setup authentication routes
  setupAuth(app);

  // Courses API
  app.get("/api/courses", async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    res.json(course);
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут создавать курсы" });
    }

    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при создании курса" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут обновлять курсы" });
    }

    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете редактировать только свои курсы" });
    }

    try {
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обновлении курса" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут удалять курсы" });
    }

    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете удалять только свои курсы" });
    }

    try {
      await storage.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Ошибка при удалении курса" });
    }
  });

  // Course enrollments
  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    // Only students can enroll in courses
    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Только студенты могут записаться на курс" });
    }

    try {
      const validatedData = insertEnrollmentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the course exists
      const course = await storage.getCourse(validatedData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }
      
      // Check if the user is already enrolled
      const existingEnrollment = await storage.getEnrollmentByUserAndCourse(
        req.user.id, 
        validatedData.courseId
      );
      
      if (existingEnrollment) {
        return res.status(400).json({ message: "Вы уже записаны на этот курс" });
      }

      const enrollment = await storage.createEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при записи на курс" });
    }
  });

  app.get("/api/enrollments/my", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      
      // Get the course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );
      
      res.json(enrollmentsWithCourses);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении записей на курсы" });
    }
  });

  app.get("/api/courses/:courseId/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут просматривать записи на курс" });
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете просматривать только свои курсы" });
    }

    try {
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      
      // Get the user details for each enrollment
      const enrollmentsWithUsers = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          // Remove password from user object
          if (user) {
            const { password, ...userWithoutPassword } = user;
            return { ...enrollment, user: userWithoutPassword };
          }
          return enrollment;
        })
      );
      
      res.json(enrollmentsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении записей на курс" });
    }
  });

  app.put("/api/enrollments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут обновлять прогресс и оценки" });
    }

    const enrollmentId = parseInt(req.params.id);
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Запись не найдена" });
    }

    // Verify the teacher owns the course
    const course = await storage.getCourse(enrollment.courseId);
    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете обновлять только записи своих курсов" });
    }

    try {
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обновлении записи" });
    }
  });

  // Materials API
  app.post("/api/materials", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут добавлять материалы" });
    }

    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      
      // Verify the teacher owns the course
      const course = await storage.getCourse(validatedData.courseId);
      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Вы можете добавлять материалы только к своим курсам" });
      }

      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при создании материала" });
    }
  });

  app.get("/api/courses/:courseId/materials", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    // If user is a student, check if they're enrolled
    if (req.user.role === "student") {
      const enrollment = await storage.getEnrollmentByUserAndCourse(req.user.id, courseId);
      if (!enrollment) {
        return res.status(403).json({ message: "Вы не записаны на этот курс" });
      }
    }
    // If user is a teacher, check if they own the course
    else if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете просматривать материалы только своих курсов" });
    }

    try {
      const materials = await storage.getMaterialsByCourse(courseId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении материалов" });
    }
  });

  // Assignments API
  app.post("/api/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут создавать задания" });
    }

    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      
      // Verify the teacher owns the course
      const course = await storage.getCourse(validatedData.courseId);
      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Вы можете создавать задания только для своих курсов" });
      }

      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при создании задания" });
    }
  });

  app.get("/api/courses/:courseId/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const courseId = parseInt(req.params.courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    // If user is a student, check if they're enrolled
    if (req.user.role === "student") {
      const enrollment = await storage.getEnrollmentByUserAndCourse(req.user.id, courseId);
      if (!enrollment) {
        return res.status(403).json({ message: "Вы не записаны на этот курс" });
      }
    }
    // If user is a teacher, check if they own the course
    else if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Вы можете просматривать задания только своих курсов" });
    }

    try {
      const assignments = await storage.getAssignmentsByCourse(courseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении заданий" });
    }
  });

  // Submissions API
  app.post("/api/submissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Только студенты могут отправлять ответы на задания" });
    }

    try {
      const validatedData = insertSubmissionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the assignment exists
      const assignment = await storage.getAssignment(validatedData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Задание не найдено" });
      }
      
      // Check if the student is enrolled in the course
      const enrollment = await storage.getEnrollmentByUserAndCourse(
        req.user.id, 
        assignment.courseId
      );
      
      if (!enrollment) {
        return res.status(403).json({ message: "Вы не записаны на этот курс" });
      }

      const submission = await storage.createSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при отправке ответа" });
    }
  });

  app.get("/api/assignments/:assignmentId/submissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const assignmentId = parseInt(req.params.assignmentId);
    const assignment = await storage.getAssignment(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: "Задание не найдено" });
    }

    // Only teachers who own the course can view all submissions
    if (req.user.role === "teacher") {
      const course = await storage.getCourse(assignment.courseId);
      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Вы можете просматривать ответы только для своих курсов" });
      }
      
      try {
        const submissions = await storage.getSubmissionsByAssignment(assignmentId);
        
        // Get the user details for each submission
        const submissionsWithUsers = await Promise.all(
          submissions.map(async (submission) => {
            const user = await storage.getUser(submission.userId);
            // Remove password from user object
            if (user) {
              const { password, ...userWithoutPassword } = user;
              return { ...submission, user: userWithoutPassword };
            }
            return submission;
          })
        );
        
        res.json(submissionsWithUsers);
      } catch (error) {
        res.status(500).json({ message: "Ошибка при получении ответов" });
      }
    } 
    // Students can only view their own submissions
    else if (req.user.role === "student") {
      try {
        const submissions = await storage.getSubmissionsByAssignment(assignmentId);
        const userSubmissions = submissions.filter(sub => sub.userId === req.user.id);
        res.json(userSubmissions);
      } catch (error) {
        res.status(500).json({ message: "Ошибка при получении ответов" });
      }
    } else {
      return res.status(403).json({ message: "Доступ запрещен" });
    }
  });

  app.put("/api/submissions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const submissionId = parseInt(req.params.id);
    const submission = await storage.getSubmission(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: "Ответ не найден" });
    }

    // Teachers can update grades and feedback
    if (req.user.role === "teacher") {
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Задание не найдено" });
      }
      
      const course = await storage.getCourse(assignment.courseId);
      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Вы можете оценивать ответы только для своих курсов" });
      }
      
      try {
        const updatedSubmission = await storage.updateSubmission(submissionId, {
          grade: req.body.grade,
          feedback: req.body.feedback
        });
        res.json(updatedSubmission);
      } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении ответа" });
      }
    }
    // Students can only update their own submissions before it's graded
    else if (req.user.role === "student" && submission.userId === req.user.id) {
      if (submission.grade !== null) {
        return res.status(403).json({ message: "Невозможно изменить оцененный ответ" });
      }
      
      try {
        const updatedSubmission = await storage.updateSubmission(submissionId, {
          content: req.body.content,
          submitted: new Date()
        });
        res.json(updatedSubmission);
      } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении ответа" });
      }
    } else {
      return res.status(403).json({ message: "Доступ запрещен" });
    }
  });

  // Teacher dashboard stats
  app.get("/api/teacher/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Доступ только для преподавателей" });
    }

    try {
      const courses = await storage.getCoursesByTeacherId(req.user.id);
      
      // Get the enrollments for each course
      const courseData = await Promise.all(
        courses.map(async (course) => {
          const enrollments = await storage.getEnrollmentsByCourse(course.id);
          return {
            ...course,
            studentCount: enrollments.length
          };
        })
      );
      
      // Get all assignments for the teacher's courses
      const courseIds = courses.map(course => course.id);
      let allAssignments: Assignment[] = [];
      
      for (const courseId of courseIds) {
        const assignments = await storage.getAssignmentsByCourse(courseId);
        allAssignments = [...allAssignments, ...assignments];
      }
      
      // Get all submissions for the assignments
      let pendingSubmissions = 0;
      
      for (const assignment of allAssignments) {
        const submissions = await storage.getSubmissionsByAssignment(assignment.id);
        const ungraded = submissions.filter(sub => sub.grade === null);
        pendingSubmissions += ungraded.length;
      }
      
      res.json({
        totalCourses: courses.length,
        totalStudents: courseData.reduce((sum, course) => sum + course.studentCount, 0),
        pendingSubmissions,
        courses: courseData
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении статистики" });
    }
  });

  // Student dashboard stats
  app.get("/api/student/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Доступ только для студентов" });
    }

    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      
      // Get the course details for each enrollment
      const courseData = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return {
            ...enrollment,
            course
          };
        })
      );
      
      // Get upcoming assignments
      const courseIds = enrollments.map(e => e.courseId);
      let upcomingAssignments: Assignment[] = [];
      
      for (const courseId of courseIds) {
        const assignments = await storage.getAssignmentsByCourse(courseId);
        // Filter for assignments due in the future
        const upcoming = assignments.filter(a => a.dueDate > new Date());
        upcomingAssignments = [...upcomingAssignments, ...upcoming];
      }
      
      // Sort assignments by due date
      upcomingAssignments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      
      // Get course information for assignments
      const assignmentsWithCourses = await Promise.all(
        upcomingAssignments.map(async (assignment) => {
          const course = await storage.getCourse(assignment.courseId);
          return {
            ...assignment,
            course
          };
        })
      );
      
      res.json({
        completedCourses: courseData.filter(e => e.progress === 100).length,
        inProgressCourses: courseData.filter(e => e.progress > 0 && e.progress < 100).length,
        averageGrade: courseData.filter(e => e.grade !== null)
          .reduce((sum, e) => sum + (e.grade || 0), 0) / 
          (courseData.filter(e => e.grade !== null).length || 1),
        enrolledCourses: courseData,
        upcomingAssignments: assignmentsWithCourses.slice(0, 5)  // Return only 5 closest assignments
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении статистики" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
