
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Enrollment, Course } from "@shared/schema";
import { Loader2 } from "lucide-react";
import ProgressTracker from "@/components/student/progress-tracker";
import AssignmentList from "@/components/student/assignment-list";
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
  upcomingAssignments: any[];
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
    enabled: !!user && user.role === "student",
  });

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ошибка загрузки данных</h2>
          <p className="mt-2 text-gray-600">Пожалуйста, попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }

  const activeCourses = stats.enrolledCourses.filter(e => e.progress < 100);
  const completedCourses = stats.enrolledCourses.filter(e => e.progress === 100);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Мои курсы</h1>
        <p className="text-gray-600 mt-1">Ваш прогресс обучения</p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Активные курсы</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Курсы в процессе изучения</p>
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
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-200">
            {activeCourses.length > 0 ? (
              activeCourses.map((enrollment) => (
                <div key={enrollment.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <Link href={`/courses/${enrollment.course.id}`}>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-primary cursor-pointer">
                        {enrollment.course.title}
                      </h3>
                    </Link>
                    <Link href={`/courses/${enrollment.course.id}`}>
                      <Button variant="outline">Продолжить обучение</Button>
                    </Link>
                  </div>
                  <ProgressTracker enrollment={enrollment} />
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                У вас пока нет активных курсов
              </div>
            )}
          </div>
        </div>
      </div>

      {completedCourses.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Завершённые курсы</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Курсы, которые вы успешно прошли</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-200">
              {completedCourses.map((enrollment) => (
                <div key={enrollment.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <Link href={`/courses/${enrollment.course.id}`}>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-primary cursor-pointer">
                        {enrollment.course.title}
                      </h3>
                    </Link>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Завершено
                    </span>
                  </div>
                  <ProgressTracker enrollment={enrollment} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.upcomingAssignments.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Ближайшие задания</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Задания, которые нужно выполнить</p>
          </div>
          <div className="border-t border-gray-200 p-4">
            <AssignmentList assignments={stats.upcomingAssignments} />
          </div>
        </div>
      )}
    </div>
  );
}
