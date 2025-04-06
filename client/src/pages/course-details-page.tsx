
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import AssignmentsManager from "@/components/teacher/assignments-manager";
import TestConstructor from "@/components/teacher/test-constructor";
import CourseFeedback from "@/components/courses/course-feedback";
import CourseChat from "@/components/chat/course-chat";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/enroll`);
      if (!response.ok) {
        throw new Error("Ошибка при записи на курс");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Вы записались на курс",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось записаться на курс",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!course) {
    return <div>Курс не найден</div>;
  }

  const isTeacher = user?.role === "teacher" && user?.id === course.teacherId;
  const isStudent = user?.role === "student";
  const isEnrolled = course.enrollments?.some(e => e.userId === user?.id);

  const handleEnroll = () => {
    enrollMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
            {course.category}
          </span>
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          {isStudent && !isEnrolled && (
            <Button 
              onClick={handleEnroll} 
              className="mt-4"
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Записаться на курс
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-gray-400" />
                <span>Преподаватель: {course.teacher?.name || "Не указан"}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>
                  {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>{course.duration}</span>
              </div>
            </div>
            <p className="text-gray-600">{course.description}</p>
          </div>
        </Card>

        {isTeacher ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="assignments">Задания</TabsTrigger>
              <TabsTrigger value="tests">Тесты</TabsTrigger>
              <TabsTrigger value="students">Студенты</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление курсом</h2>
                  {/* Здесь можно добавить редактирование основной информации курса */}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="materials">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление материалами</h2>
                  <UploadMaterialForm courseId={courseId} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление заданиями</h2>
                  <AssignmentsManager courseId={courseId} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tests">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Конструктор тестов</h2>
                  <TestConstructor courseId={courseId} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление студентами</h2>
                  {course.enrollments && course.enrollments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {course.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="py-4">
                          <p>{enrollment.user?.name}</p>
                          <p className="text-sm text-gray-500">{enrollment.user?.email}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">На курс пока никто не записался</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              {isEnrolled && (
                <>
                  <TabsTrigger value="materials">Материалы</TabsTrigger>
                  <TabsTrigger value="assignments">Задания</TabsTrigger>
                  <TabsTrigger value="chat">Чат</TabsTrigger>
                </>
              )}
              <TabsTrigger value="feedback">Отзывы</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-3">О курсе</h2>
                  <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                </div>
              </Card>
            </TabsContent>

            {isEnrolled && (
              <>
                <TabsContent value="materials">
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-3">Учебные материалы</h2>
                      {course.materials && course.materials.length > 0 ? (
                        <div className="space-y-4">
                          {course.materials.map((material) => (
                            <Card key={material.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">{material.title}</h3>
                                    <p className="text-sm text-gray-500">{material.description}</p>
                                  </div>
                                  <Button onClick={() => window.open(material.url, '_blank')}>
                                    Открыть
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Материалы пока не добавлены</p>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments">
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-3">Задания</h2>
                      {course.assignments && course.assignments.length > 0 ? (
                        <div className="space-y-4">
                          {course.assignments.map((assignment) => (
                            <Card key={assignment.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">{assignment.title}</h3>
                                    <p className="text-sm text-gray-500">{assignment.description}</p>
                                    <p className="text-sm text-orange-600 mt-2">
                                      Срок сдачи: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}
                                    </p>
                                  </div>
                                  <Button variant="outline">Открыть задание</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Заданий пока нет</p>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="chat">
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-3">Чат курса</h2>
                      <CourseChat courseId={courseId} />
                    </div>
                  </Card>
                </TabsContent>
              </>
            )}

            <TabsContent value="feedback">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-3">Отзывы о курсе</h2>
                  <CourseFeedback courseId={courseId} isEnrolled={isEnrolled} />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
