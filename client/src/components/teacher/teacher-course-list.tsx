import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TeacherCourseListProps {
  courses: any[]; // Using any for simplicity
}

export default function TeacherCourseList({ courses }: TeacherCourseListProps) {
  if (!courses || courses.length === 0) {
    return (
      <div className="border-t border-gray-200 p-6 text-center">
        <p className="text-gray-500">У вас пока нет курсов.</p>
        <Button className="mt-4">Создать новый курс</Button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200">
      <ul className="divide-y divide-gray-200">
        {courses.map((course) => (
          <li key={course.id} className="hover:bg-gray-50">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-full p-1 ${getCategoryColor(course.category)}`}>
                    {getCategoryIcon(course.category)}
                  </div>
                  <p className="ml-3 text-sm font-medium text-gray-900">{course.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {course.isActive ? 'Активный' : 'Неактивный'}
                  </span>
                  <span className="text-sm text-gray-500">{course.studentCount} студентов</span>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Начало: {format(new Date(course.startDate), 'dd.MM.yyyy')} | Окончание: {format(new Date(course.endDate), 'dd.MM.yyyy')}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <div className="flex space-x-2">
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="link" className="text-sm font-medium text-primary hover:text-primary/90 p-0">
                        Материалы
                      </Button>
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Button variant="link" className="text-sm font-medium text-primary hover:text-primary/90 p-0">
                      Редактировать
                    </Button>
                    <span className="text-gray-500">|</span>
                    <Button variant="link" className="text-sm font-medium text-primary hover:text-primary/90 p-0">
                      Статистика
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper functions to get category color and icon
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
  }
}
