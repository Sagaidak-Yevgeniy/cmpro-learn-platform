import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Enrollment, Course } from "@shared/schema";
import { Loader2 } from "lucide-react";
import ProgressTracker from "@/components/student/progress-tracker";
import AssignmentList from "@/components/student/assignment-list";
import CourseList from "@/components/courses/course-list";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

interface StudentStats {
  completedCourses: number;
  inProgressCourses: number;
  averageGrade: number;
  enrolledCourses: EnrollmentWithCourse[];
  upcomingAssignments: any[];  // Using any for simplicity
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
    enabled: !!user && user.role === "student",
  });
  
  const { data: allCourses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  if (statsLoading || coursesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!stats || !allCourses) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ошибка загрузки данных</h2>
          <p className="mt-2 text-gray-600">Пожалуйста, попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }
  
  const enrolledCourseIds = stats.enrolledCourses.map(e => e.courseId);
  const recommendedCourses = allCourses
    .filter(course => !enrolledCourseIds.includes(course.id))
    .slice(0, 3);
  
  const activeCourses = stats.enrolledCourses.filter(e => e.progress < 100);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Ваш прогресс обучения</p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Мой прогресс</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Ваша активность и результаты</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Завершено курсов</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completedCourses}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">В процессе</p>
              <p className="text-xl font-semibold text-gray-900">{stats.inProgressCourses}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Средний балл</p>
              <p className="text-xl font-semibold text-[#48BB78]">{stats.averageGrade.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Активные курсы</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-4">
                  {activeCourses.length > 0 ? (
                    activeCourses.map((enrollment) => (
                      <ProgressTracker 
                        key={enrollment.id} 
                        enrollment={enrollment} 
                      />
                    ))
                  ) : (
                    <p>У вас пока нет активных курсов.</p>
                  )}
                </div>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Ближайшие задания</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <AssignmentList assignments={stats.upcomingAssignments} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-4">Рекомендуемые курсы</h2>
      {recommendedCourses.length > 0 ? (
        <CourseList courses={recommendedCourses} />
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-600">Кажется, вы уже записаны на все доступные курсы!</p>
          <Link href="/courses">
            <Button className="mt-4">Просмотреть все курсы</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
