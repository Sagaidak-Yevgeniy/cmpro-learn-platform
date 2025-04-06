-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar TEXT
);

-- Создание таблицы курсов
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  teacher_id INTEGER NOT NULL,
  duration TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  student_count INTEGER NOT NULL DEFAULT 0
);

-- Update student_count for all courses
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses 
    SET student_count = (
      SELECT COUNT(*) 
      FROM enrollments 
      WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET student_count = (
      SELECT COUNT(*) 
      FROM enrollments 
      WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrollment changes
DROP TRIGGER IF EXISTS enrollment_count_trigger ON enrollments;
CREATE TRIGGER enrollment_count_trigger
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_student_count();

-- Initial update of all course student counts
UPDATE courses c
SET student_count = (
  SELECT COUNT(*) 
  FROM enrollments e 
  WHERE e.course_id = c.id
);

-- Создание таблицы записей на курсы
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grade INTEGER
);

-- Создание таблицы материалов
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lecture', 'material', 'test')),
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  file_url TEXT,
  duration INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Создание таблицы заданий
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы ответов на задания
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grade INTEGER,
  feedback TEXT
);

-- Создание таблицы отзывов о курсах
CREATE TABLE IF NOT EXISTS course_feedbacks (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);