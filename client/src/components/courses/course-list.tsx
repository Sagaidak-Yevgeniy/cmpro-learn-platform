
import { Course } from "@shared/schema";
import CourseCard from "./course-card";

interface CourseListProps {
  courses: Course[];
}

export default function CourseList({ courses }: CourseListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard 
          key={course.id} 
          course={{
            ...course,
            imageUrl: course.imageUrl ? `/uploads/${course.imageUrl}` : undefined
          }} 
        />
      ))}
    </div>
  );
}
