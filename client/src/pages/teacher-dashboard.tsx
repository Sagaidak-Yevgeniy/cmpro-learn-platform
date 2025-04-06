import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle, ClipboardList, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherCourseList from "@/components/teacher/teacher-course-list";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import CreateCourseDialog from "@/components/teacher/create-course-dialog";
import AssignmentsManager from "@/components/teacher/assignments-manager";
import { format } from "date-fns";
import { useParams } from "wouter";

interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  courses: any[];  // Using any for simplicity
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case "Математика":
      return "bg-blue-500 text-white";
    case "Физика":
      return "bg-green-500 text-white";
    case "Химия":
      return "bg-yellow-500 text-white";
    case "Биология":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getCategoryLabel = (category: string): string => {
  // Add more categories as needed
  switch (category) {
    case "math":
      return "Математика";
    case "physics":
      return "Физика";
    case "chemistry":
      return "Химия";
    case "biology":
      return "Биология";
    default:
      return category; // Return original category if not found
  }
};


export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("courses");
  const { id } = useParams();
  const courseId = id ? parseInt(id) : null;

  const { data: stats, isLoading } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
    enabled: !!user && user.role === "teacher",
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
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


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Кабинет преподавателя, {user?.name}</h1>
        <p className="text-gray-600 mt-1">Управление курсами и учебными материалами</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всего курсов</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/90 p-0"
                onClick={() => setActiveTab("courses")}
              >
                Управление курсами
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#FF9800] rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всего студентов</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/90 p-0"
                onClick={() => setActiveTab("students")}
              >
                Список студентов
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#00BCD4] rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Непроверенные работы</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pendingSubmissions}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/90 p-0"
                onClick={() => setActiveTab("submissions")}
              >
                Просмотреть и оценить
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Мои курсы</TabsTrigger>
          <TabsTrigger value="materials">Загрузка материалов</TabsTrigger>
          <TabsTrigger value="students">Студенты</TabsTrigger>
          <TabsTrigger value="submissions">Проверка работ</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Мои курсы</h2>
                <p className="text-muted-foreground">Всего активных курсов: {stats.totalCourses}</p>
              </div>
              <CreateCourseDialog />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.courses.map((course) => (
                <div key={course.id} className="group bg-white overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-lg">
                  <div className="relative h-48">
                    {course.imageUrl ? (
                      <img 
                        src={`/uploads/${course.imageUrl}`}
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-course.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/90 to-primary text-white text-xl font-bold p-4 text-center">
                        {course.title}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full">
                        {course.studentCount || 0} студентов
                      </span>
                      {course.category && (
                        <span className={`px-2 py-1 text-xs font-medium ${getCategoryColor(course.category)} rounded-full`}>
                          {getCategoryLabel(course.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold tracking-tight mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Старт: {format(new Date(course.startDate), 'dd.MM.yyyy')}
                      </span>
                      <Button 
                        onClick={() => window.location.href = `/courses/${course.id}/manage`}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Управление
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Загрузка материалов</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Добавьте учебные материалы к вашим курсам</p>
            </div>
            <div className="border-t border-gray-200">
              <UploadMaterialForm courses={stats.courses} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Студенты моих курсов</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Просмотр и управление записанными студентами</p>
            </div>
            <div className="p-6">
              {stats.courses.map(course => (
                <div key={course.id} className="mb-8">
                  <h3 className="text-md font-medium mb-2">{course.title}</h3>
                  {course.studentCount > 0 ? (
                    <p className="text-gray-600">Студентов: {course.studentCount}</p>
                  ) : (
                    <p className="text-gray-500 italic">На этот курс пока не записался ни один студент</p>
                  )}
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/teacher/courses/${course.id}`}
                    >
                      Управление курсом
                    </Button>
                  </div>
                  <hr className="my-4" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Непроверенные работы</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {stats.pendingSubmissions > 0 
                  ? `У вас ${stats.pendingSubmissions} работ, ожидающих проверки`
                  : "У вас нет работ, ожидающих проверки"
                }
              </p>
            </div>
            <div className="p-6">
              {stats.courses.some(course => course.studentCount > 0) ? (
                stats.courses.map(course => (
                  <div key={course.id} className="mb-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium">{course.title}</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/teacher/courses/${course.id}`}
                      >
                        Управление заданиями
                      </Button>
                    </div>
                    <hr className="my-3" />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-center">На ваши курсы пока не записался ни один студент</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}