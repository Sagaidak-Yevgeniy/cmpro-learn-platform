import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Course } from "@shared/schema";
import CreateCourseDialog from "./create-course-dialog";
import { Calendar, MoreHorizontal, PlusCircle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";



interface TeacherCourseListProps {
  courses: Course[];
}

// Dummy CourseCard component - replace with actual implementation
const CourseCard = ({ course }: { course: Course }) => (
  <div className="border p-4 rounded shadow-sm">
    <h3>{course.title}</h3>
    <p>Start Date: {format(new Date(course.startDate), 'dd.MM.yyyy')}</p>
    <p>End Date: {format(new Date(course.endDate), 'dd.MM.yyyy')}</p>
    <p>Students: {course.studentCount}</p>
    <Button 
              onClick={() => window.location.href = `/teacher/courses/${course.id}`}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <Settings className="h-4 w-4" />
              Управление курсом
            </Button>
  </div>
);


export default function TeacherCourseList({ courses }: TeacherCourseListProps) {
  if (!courses || courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
        <div className="text-center space-y-3">
          <h3 className="text-xl font-medium">Начните создавать курсы</h3>
          <p className="text-muted-foreground">Создайте свой первый курс и начните обучать студентов</p>
          <CreateCourseDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Мои курсы</h2>
          <p className="text-muted-foreground">Всего активных курсов: {courses.length}</p>
        </div>
        <CreateCourseDialog />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} isTeacher={true} />
        ))}
      </div>
    </div>
  );
}

// Helper functions to get category color and icon (retained from original code)
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    programming: "bg-[#00BCD4] text-white",
    business: "bg-[#FF9800] text-white",
    science: "bg-primary text-white",
    humanities: "bg-[#48BB78] text-white",
  };

  return colors[category] || "bg-gray-500 text-white";
}

function getCategoryIcon(category: string): JSX.Element {
  switch (category) {
    case "programming":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case "business":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      );
    case "science":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "humanities":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253" />
        </svg>
      );
  }
}