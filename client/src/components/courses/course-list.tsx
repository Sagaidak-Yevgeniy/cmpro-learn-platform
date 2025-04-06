import { Course } from "@shared/schema";
import CourseCard from "./course-card";

interface CourseListProps {
  courses: Course[];
  isTeacher?: boolean;
  enrollments?: {
    courseId: number;
    progress: number;
  }[];
}

export default function CourseList({ courses, isTeacher, enrollments }: CourseListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={course} 
          isTeacher={isTeacher}
          enrollment={enrollments?.find(e => e.courseId === course.id)}
        />
      ))}
    </div>
  );
}