import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherCourseList from "@/components/teacher/teacher-course-list";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import { format } from "date-fns";

interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  courses: any[];  // Using any for simplicity
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("courses");
  
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
                disabled // Feature to be implemented
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
                disabled // Feature to be implemented
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
          <TabsTrigger value="students" disabled>Студенты</TabsTrigger>
          <TabsTrigger value="submissions" disabled>Проверка работ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Мои курсы</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Список ваших активных курсов</p>
            </div>
            <TeacherCourseList courses={stats.courses} />
            <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
              <Button className="inline-flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Создать новый курс
              </Button>
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-center text-gray-600">Раздел в разработке</p>
          </div>
        </TabsContent>
        
        <TabsContent value="submissions">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <p className="text-center text-gray-600">Раздел в разработке</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
