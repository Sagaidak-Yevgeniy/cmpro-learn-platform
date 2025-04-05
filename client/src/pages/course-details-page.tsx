import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Course, Material, Assignment } from "@shared/schema";
import { Loader2, Calendar, Clock, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import CourseFeedback from "@/components/courses/course-feedback";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });
  
  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: [`/api/courses/${courseId}/materials`],
    enabled: !!user && !!course,
  });
  
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [`/api/courses/${courseId}/assignments`],
    enabled: !!user && !!course,
  });
  
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery<any>({
    queryKey: ["/api/enrollments/my"],
    enabled: !!user && user.role === "student",
    select: data => data?.find((e: any) => e.courseId === courseId)
  });
  
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/enrollments", {
        courseId,
        progress: 0,
        enrollmentDate: new Date(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/my"] });
      toast({
        title: "Вы успешно записались на курс",
        description: `Теперь вы можете начать изучение "${course?.title}"`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при записи на курс",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const isLoading = courseLoading || 
                   (user && (materialsLoading || assignmentsLoading || 
                   (user.role === "student" && enrollmentLoading)));
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Курс не найден</h2>
          <p className="mt-2 text-gray-600">
            Курс, который вы ищете, не существует или был удален.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/courses")}>
            Вернуться к курсам
          </Button>
        </div>
      </div>
    );
  }
  
  const isEnrolled = !!enrollment;
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isCourseOwner = isTeacher && user?.id === course.teacherId;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Course header with image */}
        <div className="relative h-64 bg-gray-200">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-blue-700 text-white text-2xl font-bold">
              {course.title}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
              {course.category}
            </span>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          </div>
        </div>

        {/* Course info and actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="mr-1.5 h-5 w-5 text-gray-400" />
                  <span>
                    {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-5 w-5 text-gray-400" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-1.5 h-5 w-5 text-gray-400" />
                  <span>Преподаватель ID: {course.teacherId}</span>
                </div>
              </div>
            </div>
            
            {isStudent && !isEnrolled && (
              <Button 
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {enrollMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Записаться на курс
              </Button>
            )}
            
            {isEnrolled && (
              <div className="flex items-center space-x-2 text-[#48BB78]">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Вы записаны на этот курс</span>
                <CourseFeedback courseId={courseId} courseName={course.title} />
              </div>
            )}
            
            {isCourseOwner && (
              <Button variant="outline" onClick={() => setLocation(`/teacher/courses/${courseId}`)}>
                Управление курсом
              </Button>
            )}
          </div>
        </div>

        {/* Course content tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            {(isEnrolled || isCourseOwner) && (
              <>
                <TabsTrigger value="materials">Материалы</TabsTrigger>
                <TabsTrigger value="assignments">Задания</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">Описание курса</h2>
              <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
            </div>
            
            {/* Show call to action for non-enrolled students */}
            {isStudent && !isEnrolled && (
              <div className="border-t pt-6">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    Хотите получить доступ к материалам этого курса?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Запишитесь на курс, чтобы получить доступ ко всем лекциям, заданиям и дополнительным материалам.
                  </p>
                  <Button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Записаться сейчас
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-6">
            {(isEnrolled || isCourseOwner) && (
              <>
                <h2 className="text-xl font-bold mb-3">Учебные материалы</h2>
                {materials && materials.length > 0 ? (
                  <div className="grid gap-4">
                    {materials.map((material) => (
                      <Card key={material.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{material.title}</h3>
                              {material.description && (
                                <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                                {material.type}
                              </span>
                            </div>
                            <Button variant="outline" size="sm">Открыть</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    На данный момент нет доступных материалов для этого курса.
                  </p>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="assignments" className="space-y-6">
            {(isEnrolled || isCourseOwner) && (
              <>
                <h2 className="text-xl font-bold mb-3">Задания</h2>
                {assignments && assignments.length > 0 ? (
                  <div className="grid gap-4">
                    {assignments.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{assignment.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {assignment.description.length > 100 
                                  ? `${assignment.description.slice(0, 100)}...` 
                                  : assignment.description}
                              </p>
                              <div className="flex items-center mt-2 text-sm text-orange-700">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  Срок сдачи: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Открыть</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    На данный момент нет доступных заданий для этого курса.
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
