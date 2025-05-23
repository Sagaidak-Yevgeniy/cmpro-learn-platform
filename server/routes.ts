import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Настройка multer для загрузки файлов
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неверный формат файла. Разрешены только JPEG, PNG и GIF'));
    }
  }
});
import { 
  insertCourseSchema, 
  insertEnrollmentSchema, 
  insertMaterialSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertCourseFeedbackSchema,
  Course,
  Assignment
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // setup authentication routes
  setupAuth(app);

  // Upload image route
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не загружен" });
      }
      res.json({ 
        imageUrl: req.file.filename,
        message: "Файл успешно загружен" 
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при загрузке файла" });
    }
  });

  // Update course image
  app.put("/api/courses/:id/image", upload.single("image"), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ message: "Файл не загружен" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      const updatedCourse = await storage.updateCourse(courseId, {
        ...course,
        imageUrl: req.file.filename
      });

      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обновлении изображения" });
    }
  });

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
      console.log("Получены данные курса:", req.body);

      // Проверяем наличие обязательных полей и устанавливаем значения по умолчанию
      const requestData = {
        ...req.body,
        teacherId: req.user.id,
        imageUrl: req.body.imageUrl || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      };

      console.log("Подготовленные данные курса:", requestData);

      // Расширяем схему, чтобы преобразовать строковые даты в объекты Date
      const courseSchemaWithDateConversion = insertCourseSchema.transform((data) => {
        console.log("Преобразование дат курса:", data);
        return {
          ...data,
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
          endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate)
        };
      });

      const courseData = courseSchemaWithDateConversion.parse(requestData);
      console.log("Валидированные данные курса:", courseData);

      // Создаем курс
      const course = await storage.createCourse(courseData);

      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Ошибка валидации ZOD:", error.errors);
        return res.status(400).json({ 
          message: "Неверные данные курса", 
          errors: error.errors,
          details: error.format()
        });
      }
      console.error("Ошибка при создании курса:", error);
      res.status(500).json({ message: "Ошибка при создании курса" });
    }
  });

  // Enrollments API
  app.get("/api/enrollments/my", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки записей на курсы" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        userId: req.user.id,
        enrollmentDate: new Date(),
        progress: 0
      });

      // Проверка существования курса
      const course = await storage.getCourse(enrollmentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Проверка на дублирование записи
      const existingEnrollment = await storage.getEnrollmentByUserAndCourse(
        req.user.id, 
        enrollmentData.courseId
      );

      if (existingEnrollment) {
        return res.status(400).json({ message: "Вы уже записаны на этот курс" });
      }

      // Проверяем текущее количество студентов
      const currentEnrollments = await storage.getEnrollmentsByCourse(enrollmentData.courseId);
      const studentCount = currentEnrollments.length;

      const enrollment = await storage.createEnrollment({
        ...enrollmentData,
        progress: enrollmentData.progress || 0,
        enrollmentDate: enrollmentData.enrollmentDate || new Date(),
        grade: null
      });

      // Обновляем количество студентов в курсе
      const updatedCourse = await storage.updateCourse(enrollmentData.courseId, {
        ...course,
        studentCount: studentCount + 1
      });

      res.status(201).json({
        ...enrollment,
        course: updatedCourse
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные записи", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при записи на курс" });
    }
  });

  // Materials API
  app.get("/api/courses/:id/materials", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const courseId = parseInt(req.params.id);

      // Проверка существования курса
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Если пользователь - преподаватель курса или студент, записанный на курс
      if (req.user?.role === "teacher" && req.user.id === course.teacherId) {
        const materials = await storage.getMaterialsByCourse(courseId);
        return res.json(materials);
      }

      if (req.user?.role === "student") {
        const enrollment = await storage.getEnrollmentByUserAndCourse(req.user.id, courseId);
        if (enrollment) {
          const materials = await storage.getMaterialsByCourse(courseId);
          return res.json(materials);
        }
      }

      return res.status(403).json({ message: "У вас нет доступа к материалам этого курса" });
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки материалов" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут добавлять материалы" });
    }

    try {
      const materialData = insertMaterialSchema.parse(req.body);

      // Проверка существования курса
      const course = await storage.getCourse(materialData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Проверка, является ли пользователь преподавателем этого курса
      if (req.user.id !== course.teacherId) {
        return res.status(403).json({ message: "Вы не являетесь преподавателем этого курса" });
      }

      const material = await storage.createMaterial({
        ...materialData,
        order: materialData.order || 0,
        description: materialData.description || null
      });

      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные материала", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при добавлении материала" });
    }
  });

    app.post("/api/courses/:id/lectures", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }

  try {
    const courseId = parseInt(req.params.id);
    const course = await storage.getCourse(courseId);

    if (!course) {
      return res.status(404).json({ message: "Курс не найден" });
    }

    if (req.user?.id !== course.teacherId) {
      return res.status(403).json({ message: "Нет прав для добавления лекций" });
    }

    const lecture = await storage.createMaterial({
      courseId,
      title: req.body.title,
      type: "lecture",
      description: req.body.description,
      content: req.body.videoUrl,
      order: req.body.order || 0
    });

    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при добавлении лекции" });
  }
});

  // Course Feedback API
  app.get("/api/courses/:id/feedback", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);

      // Проверка существования курса
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      const feedback = await storage.getCourseFeedbacksByCourse(courseId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки отзывов" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Только студенты могут оставлять отзывы" });
    }

    try {
      const feedbackData = insertCourseFeedbackSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      // Проверка существования курса
      const course = await storage.getCourse(feedbackData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Проверка, записан ли студент на курс
      const enrollment = await storage.getEnrollmentByUserAndCourse(
        req.user.id, 
        feedbackData.courseId
      );

      if (!enrollment) {
        return res.status(403).json({ message: "Вы не записаны на этот курс" });
      }

      // Проверка, оставлял ли студент уже отзыв
      const existingFeedback = await storage.getCourseFeedbacksByUser(req.user.id);
      const alreadyFeedback = existingFeedback.find(f => f.courseId === feedbackData.courseId);

      if (alreadyFeedback) {
        // Обновить существующий отзыв
        const updatedFeedback = await storage.updateCourseFeedback(alreadyFeedback.id, {
          content: feedbackData.content,
          rating: feedbackData.rating || null
        });
        return res.json(updatedFeedback);
      }

      // Создать новый отзыв
      const feedback = await storage.createCourseFeedback({
        ...feedbackData,
        rating: feedbackData.rating || null
      });

      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные отзыва", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при добавлении отзыва" });
    }
  });

  // Assignments API
  app.get("/api/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : null;

      if (courseId) {
        // Проверка существования курса
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Курс не найден" });
        }

        // Если пользователь - преподаватель курса или студент, записанный на курс
        if (req.user?.role === "teacher" && req.user.id === course.teacherId) {
          const assignments = await storage.getAssignmentsByCourse(courseId);
          return res.json(assignments);
        }

        if (req.user?.role === "student") {
          const enrollment = await storage.getEnrollmentByUserAndCourse(req.user.id, courseId);
          if (enrollment) {
            const assignments = await storage.getAssignmentsByCourse(courseId);
            return res.json(assignments);
          }
        }

        return res.status(403).json({ message: "У вас нет доступа к заданиям этого курса" });
      } else {
        return res.status(400).json({ message: "Укажите ID курса" });
      }
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки заданий" });
    }
  });

  app.get("/api/courses/:id/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const courseId = parseInt(req.params.id);

      // Проверка существования курса
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Если пользователь - преподаватель курса или студент, записанный на курс
      if (req.user?.role === "teacher" && req.user.id === course.teacherId) {
        const assignments = await storage.getAssignmentsByCourse(courseId);
        return res.json(assignments);
      }

      if (req.user?.role === "student") {
        const enrollment = await storage.getEnrollmentByUserAndCourse(req.user.id, courseId);
        if (enrollment) {
          const assignments = await storage.getAssignmentsByCourse(courseId);
          return res.json(assignments);
        }
      }

      return res.status(403).json({ message: "У вас нет доступа к заданиям этого курса" });
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки заданий" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут создавать задания" });
    }

    try {
      console.log("Тело запроса для задания:", req.body);

      // Расширяем схему для преобразования строковой даты в объект Date
      const assignmentSchemaWithDateConversion = insertAssignmentSchema.transform((data) => {
        console.log("Трансформация данных задания:", data);
        return {
          ...data,
          dueDate: data.dueDate instanceof Date ? data.dueDate : new Date(data.dueDate)
        };
      });

      const assignmentData = assignmentSchemaWithDateConversion.parse(req.body);
      console.log("Данные задания после валидации:", assignmentData);

      // Проверка существования курса
      const course = await storage.getCourse(assignmentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Проверка, является ли пользователь преподавателем этого курса
      if (req.user.id !== course.teacherId) {
        return res.status(403).json({ message: "Вы не являетесь преподавателем этого курса" });
      }

      const assignment = await storage.createAssignment({
        ...assignmentData
      });

      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Ошибка валидации ZOD при создании задания:", error.errors);
        return res.status(400).json({ 
          message: "Неверные данные задания", 
          errors: error.errors,
          details: error.format()
        });
      }
      console.error("Ошибка при создании задания:", error);
      res.status(500).json({ message: "Ошибка при создании задания" });
    }
  });

  // Submissions API
  app.get("/api/submissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const assignmentId = req.query.assignmentId ? parseInt(req.query.assignmentId as string) : null;

      if (assignmentId) {
        // Проверка существования задания
        const assignment = await storage.getAssignment(assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: "Задание не найдено" });
        }

        // Проверка, является ли пользователь преподавателем этого курса
        const course = await storage.getCourse(assignment.courseId);
        if (!course) {
          return res.status(404).json({ message: "Курс не найден" });
        }

        if (req.user?.role === "teacher" && req.user.id === course.teacherId) {
          const submissions = await storage.getSubmissionsByAssignment(assignmentId);
          return res.json(submissions);
        }

        // Студент может видеть только свои работы
        if (req.user?.role === "student") {
          const submissions = await storage.getSubmissionsByAssignment(assignmentId);
          const userSubmissions = submissions.filter(sub => sub.userId === req.user?.id);
          return res.json(userSubmissions);
        }

        return res.status(403).json({ message: "У вас нет доступа к работам по этому заданию" });
      } else {
        return res.status(400).json({ message: "Укажите ID задания" });
      }
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки работ" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "student") {
      return res.status(403).json({ message: "Только студенты могут отправлять работы" });
    }

    try {
      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      // Проверка существования задания
      const assignment = await storage.getAssignment(submissionData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Задание не найдено" });
      }

      // Проверка, записан ли студент на курс
      const enrollment = await storage.getEnrollmentByUserAndCourse(
        req.user.id, 
        assignment.courseId
      );

      if (!enrollment) {
        return res.status(403).json({ message: "Вы не записаны на этот курс" });
      }

      // Проверка, не просрочена ли сдача задания
      const currentDate = new Date();
      const dueDate = new Date(assignment.dueDate);

      if (currentDate > dueDate) {
        return res.status(400).json({ message: "Срок сдачи задания истек" });
      }

      // Проверка, не сдавал ли студент уже работу по этому заданию
      const submissions = await storage.getSubmissionsByAssignment(assignment.id);
      const existingSubmission = submissions.find(sub => sub.userId === req.user?.id);

      if (existingSubmission) {
        // Обновить существующую работу
        const updatedSubmission = await storage.updateSubmission(existingSubmission.id, {
          content: submissionData.content,
          submitted: new Date()
        });
        return res.json(updatedSubmission);
      }

      // Создать новую работу
      const submission = await storage.createSubmission({
        ...submissionData
      });

      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные работы", errors: error.errors });
      }
      res.status(500).json({ message: "Ошибка при отправке работы" });
    }
  });

  app.patch("/api/submissions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (req.user?.role !== "teacher") {
      return res.status(403).json({ message: "Только преподаватели могут оценивать работы" });
    }

    try {
      const submissionId = parseInt(req.params.id);

      // Проверка существования работы
      const submission = await storage.getSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Работа не найдена" });
      }

      // Проверка, принадлежит ли задание курсу преподавателя
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Задание не найдено" });
      }

      const course = await storage.getCourse(assignment.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      if (req.user.id !== course.teacherId) {
        return res.status(403).json({ message: "Вы не являетесь преподавателем этого курса" });
      }

      // Валидация данных оценки
      const { grade, feedback } = req.body;

      if (typeof grade !== "number" || grade < 0 || grade > 100) {
        return res.status(400).json({ message: "Оценка должна быть числом от 0 до 100" });
      }

      const updatedSubmission = await storage.updateSubmission(submissionId, {
        grade,
        feedback: feedback || null
      });

      res.json(updatedSubmission);
    } catch (error) {
      res.status(500).json({ message: "Ошибка при оценке работы" });
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

      // Get all assignments and submissions
      let completedAssignments = 0;
      let totalAssignments = 0;

      for (const enrollment of enrollments) {
        const assignments = await storage.getAssignmentsByCourse(enrollment.courseId);
        totalAssignments += assignments.length;

        for (const assignment of assignments) {
          const submissions = await storage.getSubmissionsByAssignment(assignment.id);
          const userSubmission = submissions.find(sub => sub.userId === req.user?.id);
          if (userSubmission) {
            completedAssignments += 1;
          }
        }
      }

      res.json({
        enrolledCourses: enrollments.length,
        courseData,
        completedAssignments,
        totalAssignments
      });
    } catch (error) {
      res.status(500).json({ message: "Ошибка при получении статистики" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByUsername(email);

      if (user) {
        // В реальном приложении здесь нужно отправить email
        // Сейчас просто имитируем успешную отправку
        res.status(200).json({ message: "Инструкции отправлены на email" });
      } else {
        // Не сообщаем о существовании/отсутствии пользователя
        res.status(200).json({ message: "Если пользователь существует, инструкции будут отправлены" });
      }
    } catch (error) {
      res.status(500).json({ message: "Ошибка при обработке запроса" });
    }
  });

  // Delete enrollment endpoint
  app.delete("/api/enrollments/:courseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;

      // Get the course
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Check if enrollment exists
      const enrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
      if (!enrollment) {
        return res.status(404).json({ message: "Запись на курс не найдена" });
      }

      // Delete enrollment
      await storage.deleteEnrollment(enrollment.id);

      // Update course student count
      const currentEnrollments = await storage.getEnrollmentsByCourse(courseId);
      const studentCount = currentEnrollments.length - 1;

      await storage.updateCourse(courseId, {
        ...course,
        studentCount: Math.max(0, studentCount) // Ensure count doesn't go below 0
      });

      res.json({ message: "Успешно отписались от курса" });
    } catch (error) {
      console.error("Error in delete enrollment:", error);
      res.status(500).json({ message: "Ошибка при отписке от курса" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}